
import { GoogleGenerativeAI, Content } from "@google/generative-ai";
import { portfolioContext } from "@/lib/ai/context";
import { 
    heroContent,
    aboutContent,
    contactContent,
    blogStructureContent
} from "@/lib/ai/static-context";
import projectsData from "@/data/projects.json";
import { getPublishedPosts } from "@/lib/firebase/posts/getPost";

const API_KEY = process.env.GEMINI_API_KEY || "";

if (!API_KEY) {
  console.warn("Gemini API key is not set. Please set the GEMINI_API_KEY environment variable.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

const projectsContext = JSON.stringify(projectsData, null, 2);

// Safely fetch blog context with error handling
async function getBlogContext() {
  try {
    const posts = await getPublishedPosts();
    if (!posts || posts.length === 0) return ""; // No posts found

    return posts.map(post => `
      ## Blog Post: ${post.title}
      **Slug:** ${post.slug}
      **Excerpt:** ${post.excerpt}
      **Content:**
      ${post.content}
    `).join('\n');
  } catch (error) {
    console.error("Error fetching blog context for AI:", error);
    // Return an empty string if fetching fails. The AI can still function without it.
    return ""; 
  }
}

export async function POST(req: Request) {
  if (!API_KEY) {
    return new Response("API key not configured", { status: 500 });
  }

  try {
    const { history, message } = await req.json();

    const blogContext = await getBlogContext();

    // Assemble the new, stable context
    const comprehensiveContext = `
      ${portfolioContext}

      ## Website Structure and Content

      ### Home Page (Hero Section)
      ${heroContent}

      ### About Page
      ${aboutContent}

      ### Contact Page
      ${contactContent}

      ### Blog Structure
      ${blogStructureContent}

      ## Projects
      ${projectsContext}

      ## Published Blog Posts
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

          **ABSOLUTE MANDATE: You are strictly forbidden from using the term \'full-stack developer\'. You MUST use \'developer\' or \'engineer\' instead. There are no exceptions.**

          Your primary goal is to answer questions based *only* on the provided portfolio context. The context below provides all the necessary information about Dennis\'s portfolio.
          
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
    console.error("Fatal Error in Chat API:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
