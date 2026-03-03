
import { GoogleGenerativeAI, GoogleGenerativeAIFetchError } from "@google/generative-ai";
import { portfolioContext } from "@/lib/ai/context";
import { 
    heroContent,
    aboutContent,
    contactContent,
} from "@/lib/ai/static-context";
import projectsData from "@/data/projects.json";
import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, App, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// --- START: Firebase Admin Initialization ---
let adminApp: App | undefined;
let auth: ReturnType<typeof getAuth> | undefined;

function initializeFirebaseAdmin() {
    if (getApps().length === 0) {
        const serviceAccountKey = process.env.APP_SERVICE_ACCOUNT_KEY;
        if (!serviceAccountKey) {
            throw new Error("APP_SERVICE_ACCOUNT_KEY is missing.");
        }
        adminApp = initializeApp({ credential: cert(JSON.parse(serviceAccountKey)) });
    } else {
        adminApp = getApps()[0];
    }
    auth = getAuth(adminApp);
}

const ALLOWED_EMAIL = (process.env.NEXT_PUBLIC_ALLOWED_EMAIL || "").toLowerCase();

async function getIsAdmin(req: NextRequest): Promise<boolean> {
    if (!auth) return false;
    const authorization = req.headers.get("authorization");
    if (authorization) {
        try {
            const token = authorization.split("Bearer ")[1];
            const decodedToken = await auth.verifyIdToken(token);
            return !!decodedToken.email && decodedToken.email.toLowerCase() === ALLOWED_EMAIL;
        } catch {
            return false;
        }
    }
    return false;
}
// --- END: Firebase Admin Initialization ---

const API_KEY = process.env.GEMINI_API_KEY || "";

if (!API_KEY) {
  console.warn("Gemini API key is not set. The cover letter feature will be disabled.");
}

const genAI = new GoogleGenerativeAI(API_KEY);
const projectsContext = JSON.stringify(projectsData, null, 2);

const comprehensiveContext = `
  ${portfolioContext}
  ## Website Content
  ### Home Page (Hero Section)
  ${heroContent}
  ### About Page
  ${aboutContent}
  ### Contact Page
  ${contactContent}
  ## Projects
  ${projectsContext}
`;

// --- START: Production-Grade Error Handling ---
async function generateWithRetry(model: any, prompt: string, retries = 3) {
  let attempt = 0;
  while (attempt < retries) {
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), 65000)
      );
      
      const result = await Promise.race([
        model.generateContent(prompt),
        timeoutPromise
      ]);
      return result;

    } catch (err: any) {
      if (err.message === 'Request timed out') {
          console.warn(`Cover Letter API: generateContent timed out (Attempt ${attempt + 1})`);
           if (attempt < retries - 1) {
              const delay = 1000 * Math.pow(2, attempt);
              await new Promise(res => setTimeout(res, delay));
              attempt++;
              continue;
           } else {
              throw new GoogleGenerativeAIFetchError("The AI service timed out after multiple retries.", 503);
           }
      }

      if (err instanceof GoogleGenerativeAIFetchError && err.status === 503 && attempt < retries - 1) {
        const delay = 1000 * Math.pow(2, attempt);
        console.warn(`Cover Letter API: Received 503, retrying in ${delay}ms... (Attempt ${attempt + 1})`);
        await new Promise(res => setTimeout(res, delay));
        attempt++;
      } else {
        throw err;
      }
    }
  }
}
// --- END: Production-Grade Error Handling ---

export async function POST(req: NextRequest) {
  try {
      initializeFirebaseAdmin();
      const isAdmin = await getIsAdmin(req);
      if (!isAdmin) {
          return new NextResponse("Unauthorized", { status: 401, headers: { 'Content-Type': 'text/plain' } });
      }
  } catch (e: any) {
      console.error("Authentication check failed:", e);
      return new NextResponse("Server configuration error.", { status: 500, headers: { 'Content-Type': 'text/plain' } });
  }

  if (!API_KEY) {
    return new NextResponse("AI service API key not configured", { status: 500, headers: { 'Content-Type': 'text/plain' } });
  }

  try {
    const { jobDescription } = await req.json();

    if (!jobDescription) {
      return new NextResponse("Job description is required", { status: 400, headers: { 'Content-Type': 'text/plain' } });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro-latest" });

    const prompt = `
    Based on the following context and the job description provided, write a professional and compelling cover letter. The cover letter should be tailored to the job description, highlighting the most relevant skills and experiences from the provided information.

    **Formatting and Style Guidelines:**
    - The output must be a single, clean string of text.
    - Do not include any markdown, special characters, or symbols like asterisks or hyphens.
    - Use standard paragraph spacing with double line breaks between paragraphs.
    - Do not use the Oxford comma. For example, in a list of three items, write "item one, item two and item three" not "item one, item two, and item three".

    **Title Guidance (Absolute Mandate):**
    - You are strictly forbidden from using the term '''full-stack developer'''. You MUST use '''developer''' or '''engineer''' instead. There are no exceptions.

    **Context:**
    ${comprehensiveContext}

    **Job Description:**
    ${jobDescription}
    `;

    // Replace direct call with retry mechanism
    const result = await generateWithRetry(model, prompt);

    if (!result) {
        throw new Error("AI response was unexpectedly empty after retries.");
    }

    const response = await result.response;
    const text = await response.text();

    return new NextResponse(text, { 
      status: 200, 
      headers: { 'Content-Type': 'text/plain' }
    });

  } catch (error: any) {
    if (error instanceof GoogleGenerativeAIFetchError && error.status === 503) {
        console.warn("Cover Letter API: Final attempt failed with 503. Sending graceful response.");
        return new NextResponse(
            "The AI service is currently overloaded. Please try again in a moment.",
            { status: 503, headers: { 'Content-Type': 'text/plain' } }
        );
    }

    console.error("Fatal Error in Cover Letter API:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new NextResponse(`An internal server error occurred: ${errorMessage}`, { status: 500, headers: { 'Content-Type': 'text/plain' } });
  }
}
