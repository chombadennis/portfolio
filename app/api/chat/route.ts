
import { GoogleGenerativeAI, Content } from "@google/generative-ai";
import { portfolioContext } from "@/lib/ai/context";
import projectsData from "@/data/projects.json";
import { HeroSection } from "@/components/sections/HeroSection";
import { AboutSection } from "@/components/sections/AboutSection";
import Contact from "@/app/contact/page";
import BlogPage from "@/app/blog/page";
import BlogPostPage from "@/app/blog/[slug]/page";
import BlogPostClient from "@/app/blog/[slug]/client";
import { getPublishedPosts } from "@/lib/firebase/posts/getPost";

const API_KEY = process.env.GEMINI_API_KEY || "";

if (!API_KEY) {
  console.warn("Gemini API key is not set. Please set the GEMINI_API_KEY environment variable.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

const projectsContext = JSON.stringify(projectsData, null, 2);

async function getBlogContext() {
  const posts = await getPublishedPosts();
  return posts.map(post => `
    ## Blog Post: ${post.title}

    **Slug:** ${post.slug}
    **Excerpt:** ${post.excerpt}
    **Content:**
    ${post.content}
  `).join('\n');
}

export async function POST(req: Request) {
  if (!API_KEY) {
    return new Response("API key not configured", { status: 500 });
  }

  try {
    const { history, message } = await req.json();

    const blogContext = await getBlogContext();

    const comprehensiveContext = `
${portfolioContext}

## Projects

${projectsContext}

## Home Page

${HeroSection.toString()}
${AboutSection.toString()}

## Contact Page

${Contact.toString()}

## Blog

${BlogPage.toString()}
${BlogPostPage.toString()}
${BlogPostClient.toString()}
${blogContext}
`;

    const model = genAI.getGenerativeModel({ model: "gemini-pro-latest" });

    const formattedHistory: Content[] = history.map((entry: { role: string, parts: string }) => ({
      role: entry.role,
      parts: [{ text: entry.parts }],
    }));

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: `You are Neneh, a helpful AI assistant for Dennis Chomba\'s portfolio website. Your personality should be professional but friendly, summarizing information in a conversational, chat-friendly way. Be concise but not robotic.

          **VERY IMPORTANT RULE: Your responses must be in plain text only. Do NOT use any markdown formatting like *, **, #, ###, etc. When you need to create a list, use a simple hyphen (-) for each item.**

          Your primary goal is to answer questions based *only* on the provided portfolio context. The context below is a JSON object with detailed information about Dennis\'s projects, including descriptions, technologies used, live URLs, and GitHub links. Dennis is always open for collaboration and work projects in the domain of his expertise. When referring to Dennis, use the title \'developer\' or \'engineer\'.
          
          If asked about Dennis\'s hobbies or what he does for fun, you can subtly mention that his interests include intellectually stimulating activities like chess and gaming, creative pursuits like personal coding projects, and social gatherings. He particularly enjoys culinary experiences, from exploring food and drink events to being hands-on with things like barbecues. He also appreciates arts and culture, like music and movies, and values spending quality time with friends.
          
          If a user asks a question that is vague or not related to the portfolio (e.g., \'what is the meaning of life?\'), you must politely decline and guide them back. 
          Suggest topics they can ask about, such as Dennis\'s skills, highlighted projects, work experience, or education.
          Here is the complete portfolio context:\n\n${comprehensiveContext}` }],
        },
        {
          role: "model",
          parts: [{ text: "Hello! I am Neneh, the AI assistant for Dennis Chomba\'s portfolio. I can answer questions about his skills, projects, and work experience. How may I help you today?" }],
        },
        ...formattedHistory,
      ],
      generationConfig: {
        temperature: 0.6,
        topK: 40,
        topP: 0.9,
      },
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return new Response(text, { status: 200 });

  } catch (error) {
    console.error("Error in chat API:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
