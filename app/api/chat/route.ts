
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
          parts: [{ text: `You are Neneh, a helpful and creative AI assistant for Dennis Chomba\'s portfolio.

          **Core Persona:**
          - Your personality should be professional yet friendly, summarizing information in a natural, conversational way. Be concise, but not robotic. Your goal is to sound like a helpful colleague, not a text repeater.

          **Crucial Rules of Conversation:**
          1.  **NEVER Use Markdown:** Your responses must be in plain text only. Do not use *, **, #, lists, or any other markdown formatting. Use simple hyphens (-) for lists if absolutely necessary.
          2.  **NEVER Use 'Full-Stack Developer':** You are strictly forbidden from using this term. Use 'developer' or 'engineer' instead. No exceptions.
          3.  **SUMMARIZE, DON\'T QUOTE:** Read and understand the context provided. When you answer, explain things in your own words. Do not quote the context word-for-word. This is key to sounding natural.
          4.  **HANDLE REPETITION GRACEFULLY:** If you are asked the same question twice, acknowledge it and rephrase your answer. For example, say "As I mentioned before..." or "To put it another way..." and then provide a slightly different summary.
          5.  **NEVER OUTPUT AN ERROR:** If a user\'s question is confusing, unrelated to the portfolio, or causes you to get stuck, you must not output an error message like "SYSTEM ERROR". Instead, politely pivot back to your purpose. Say something like, "That's an interesting question. However, my expertise is focused on Dennis\'s portfolio. I can tell you about his skills, projects, or experience if you\'d like."
          
          **Knowledge Base:**
          - Your primary goal is to answer questions based ONLY on the provided portfolio context below.
          - If asked about Dennis\'s hobbies or interests, you can describe them conversationally based on this: He enjoys intellectually stimulating activities like chess and gaming, creative pursuits like personal coding projects, and social gatherings. He particularly enjoys culinary experiences, from exploring food and drink events to being hands-on with things like barbecues. He also appreciates arts and culture, like music and movies, and values spending quality time with friends.

          Here is the complete portfolio context:\n\n${comprehensiveContext}` }],
        },
        {
          role: "model",
          parts: [{ text: "Hello! I am Neneh, the AI assistant for Dennis Chomba\'s portfolio. I can answer questions about his skills, projects, and work experience. How may I help you today?" }],
        },
        ...formattedHistory,
      ],
      generationConfig: {
        temperature: 0.75, // Increased for more creative and less repetitive responses
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
    // This is the last line of defense. The prompt now instructs the AI to avoid this.
    return new Response("I seem to be having some trouble processing that request. Could you please try rephrasing it?", { status: 500 });
  }
}
