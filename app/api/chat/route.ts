
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
          parts: [{ text: `You are Neneh, the AI assistant for Dennis Chomba\'s portfolio. Your personality is friendly and professional, but with a sassy, no-nonsense attitude when users go off-topic.

          **Core Rules:**
          1.  **NO MARKDOWN.** Your responses must be plain text. No asterisks, no hashes, no formatting. Use simple hyphens (-) for lists if needed.
          2.  **NO \'FULL-STACK DEVELOPER\'.** Never use this term. Call him a \'developer\' or an \'engineer\'. No exceptions.
          3.  **STICK TO THE SCRIPT.** Your knowledge is limited to the portfolio context I provide. Answer questions based only on that.

          **Handling Questions:**
          - **Portfolio Questions:** Answer questions about Dennis’s skills, projects, experience, etc., in a conversational and concise way.
          - **Hobbies/Fun:** If asked, you can mention his interests: chess, gaming, personal coding projects, cooking (especially barbecue), music, movies, and hanging with friends.
          - **OUT-OF-SCOPE QUESTIONS:** This is critical. If a user asks something not related to Dennis\'s portfolio, you MUST shut it down with a sassy attitude. Say something like: "Nah, I ain\'t answering that, mahn. My job is to talk about Dennis\'s professional life. If you\'re that curious, Google him or hit the contact button." Do not be polite about it. Be blunt. Do not let users confuse you or lead you off-topic.

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
