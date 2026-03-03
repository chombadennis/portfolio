
import { GoogleGenerativeAI, Content, GoogleGenerativeAIFetchError } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
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

async function getBlogContext() {
  try {
    const posts = await getPublishedPosts();
    if (!posts || posts.length === 0) return "";
    return posts.map(post => `
      ## Blog Post: ${post.title}
      **Slug:** ${post.slug}
      **Excerpt:** ${post.excerpt}
      **Content:**
      ${post.content}
    `).join('\n');
  } catch (error) {
    console.error("Error fetching blog context for AI:", error);
    return ""; 
  }
}

// --- START: Production-Grade Error Handling ---

// 1. Retry function with exponential backoff
async function generateWithRetry(chatSession: any, message: string, retries = 3) {
  let attempt = 0;
  while (attempt < retries) {
    try {
      // Use Promise.race to add a timeout to the API call
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), 65000) // 65 seconds
      );
      
      const response = await Promise.race([
        chatSession.sendMessage(message),
        timeoutPromise
      ]);

      return response;

    } catch (err: any) {
      // Check for timeout error
      if (err.message === 'Request timed out') {
          console.warn(`Chat API: sendMessage timed out after 65 seconds (Attempt ${attempt + 1})`);
           if (attempt < retries - 1) {
              const delay = 1000 * Math.pow(2, attempt);
              await new Promise(res => setTimeout(res, delay));
              attempt++;
              continue; // Retry the request
           } else {
              // CORRECTED: Swapped the arguments to match the constructor
              throw new GoogleGenerativeAIFetchError("The AI service timed out after multiple retries.", 503);
           }
      }

      // Check for 503 Service Unavailable
      if (err instanceof GoogleGenerativeAIFetchError && err.status === 503 && attempt < retries - 1) {
        const delay = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s
        console.warn(`Chat API: Received 503, retrying in ${delay}ms... (Attempt ${attempt + 1})`);
        await new Promise(res => setTimeout(res, delay));
        attempt++;
      } else {
        throw err; // Re-throw other errors or on final retry
      }
    }
  }
}

// --- END: Production-Grade Error Handling ---


export async function POST(req: NextRequest) {
  if (!API_KEY) {
    return new NextResponse("API key not configured", { status: 500, headers: { 'Content-Type': 'text/plain' } });
  }

  try {
    const { history, message } = await req.json();
    const blogContext = await getBlogContext();

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
    
    // Replace direct call with the new retry mechanism
    const result = await generateWithRetry(chat, message);
    
    if (!result) { // Should not happen with the new error handling, but good for safety
        throw new Error("AI response was unexpectedly empty.");
    }
    
    const response = await result.response;
    const text = response.text();

    return new NextResponse(text, { status: 200, headers: { 'Content-Type': 'text/plain' } });

  } catch (error: any) {
    // 2. Graceful fallback for the user
    if (error instanceof GoogleGenerativeAIFetchError && error.status === 503) {
      console.warn("Chat API: Final attempt failed with 503. Sending graceful response to user.");
      return new NextResponse(
        "The AI service is currently overloaded with requests. Please try again in a moment.",
        { status: 503, headers: { 'Content-Type': 'text/plain' } }
      );
    }

    console.error("Fatal Error in Chat API:", error);
    return new NextResponse(
      "An internal server error occurred.",
      { status: 500, headers: { 'Content-Type': 'text/plain' } }
    );
  }
}
