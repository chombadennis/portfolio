import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Content } from '@google/genai';
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
  console.warn("Gemini API key is not set. The chat feature will be disabled.");
}

const genAI = new GoogleGenAI({ apiKey: API_KEY });
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

async function generateWithRetry(modelName: string, prompt: Content[], retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), 65000)
      );
      
      const result = await Promise.race([
        genAI.models.generateContent({
          model: modelName,
          contents: prompt,
          generationConfig: {
            temperature: 0.6,
            topK: 40,
            topP: 0.9,
          }
        } as any),
        timeoutPromise
      ]);
      return result;

    } catch (err: any) {
        console.warn(`Chat API: Attempt ${attempt} failed for model ${modelName}. Error: ${err.message}`);
        if (attempt === retries) {
            throw err;
        }
        
        if (err.message === 'Request timed out' || err.status === 503) {
            const delay = 1000 * Math.pow(2, attempt - 1);
            console.warn(`Retrying in ${delay}ms...`);
            await new Promise(res => setTimeout(res, delay));
        } else {
            throw err;
        }
    }
  }
  throw new Error(`Failed to generate content with model ${modelName} after ${retries} attempts.`);
}

export async function POST(req: NextRequest) {
  let result: any;
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

    const formattedHistory: Content[] = history.map((entry: any) => {
        const role = entry.role || 'user';
        let parts;

        if (typeof entry.parts === 'string') {
            parts = [{ text: entry.parts }];
        } else if (Array.isArray(entry.parts)) {
            parts = entry.parts.map((part: any) => ({ text: part.text || '' }));
        } else {
            console.warn('Invalid history entry found:', entry);
            parts = [{ text: '' }];
        }

        return { role, parts };
    });

    const chatHistory: Content[] = [
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
        { 
          role: "user",
          parts: [{ text: message }]
        }
    ];

    const primaryModel = 'gemini-2.5-pro';
    const fallbackModel = 'gemini-pro-latest';
    
    try {
        console.log(`Attempting to generate content with primary model: ${primaryModel}`);
        result = await generateWithRetry(primaryModel, chatHistory);
    } catch (primaryError: any) {
        console.warn(`Primary model ${primaryModel} failed. Attempting fallback model ${fallbackModel}.`);
        try {
            result = await generateWithRetry(fallbackModel, chatHistory);
        } catch (fallbackError: any) {
            console.error(`Fallback model ${fallbackModel} also failed.`);
            throw fallbackError;
        }
    }
    
    if (!result) {
        throw new Error("AI response was unexpectedly empty.");
    }
    
    const candidates = result.response ? result.response.candidates : result.candidates;

    if (!candidates || candidates.length === 0 || !candidates[0].content?.parts[0]?.text) {
        console.error("Invalid AI response structure:", JSON.stringify(result, null, 2));
        throw new Error("Received an invalid response structure from the AI service.");
    }
    
    const text = candidates[0].content.parts[0].text;

    return new NextResponse(text, { status: 200, headers: { 'Content-Type': 'text/plain' } });

  } catch (error: any) {
    const status = error.status || (error.message && error.message.includes('429') ? 429 : 500);
    const message = error.message || "An unknown error occurred.";

    if (status === 429) {
      console.warn("Chat API: Hit quota limit (429).");
      return new NextResponse(
        "Looks like Neneh is taking a quick coffee break due to a billing hiccup. Dennis is already on it, and I can vouch for his skills. He's got this AI thing down. Please try again in a little bit!",
        { status: 429, headers: { 'Content-Type': 'text/plain' } }
      );
    }

    if (status === 503) {
      console.warn("Chat API: Final attempt failed with 503.");
      return new NextResponse(
        "The AI service is currently overloaded. Please try again in a moment.",
        { status: 503, headers: { 'Content-Type': 'text/plain' } }
      );
    }

    console.error("Fatal Error in Chat API:", error);
    return new NextResponse(
      `An internal server error occurred: ${message}`,
      { status: status, headers: { 'Content-Type': 'text/plain' } }
    );
  }
}