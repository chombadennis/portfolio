import { NextRequest, NextResponse } from 'next/server';
// STEP 1: Use the new, correct SDK (`@google/genai`)
import { GoogleGenAI } from '@google/genai';
import { portfolioContext } from "@/lib/ai/context";
import { 
    heroContent,
    aboutContent,
    contactContent,
} from "@/lib/ai/static-context";
import projectsData from "@/data/projects.json";
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

// CORRECT INITIALIZATION: The new SDK expects an options object.
const genAI = new GoogleGenAI({ apiKey: API_KEY });
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

// --- START: Production-Grade Error Handling (Corrected) ---
async function generateWithRetry(modelName: string, prompt: string, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), 65000)
      );
      
      const result = await Promise.race([
        genAI.models.generateContent({
          model: modelName,
          contents: prompt,
        }),
        timeoutPromise
      ]);
      return result;

    } catch (err: any) {
        console.warn(`Cover Letter API: Attempt ${attempt} failed for model ${modelName}. Error: ${err.message}`);
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
// --- END: Production-Grade Error Handling (Corrected) ---

export async function POST(req: NextRequest) {
  let result: any;
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

    const primaryModel = 'gemini-2.5-pro';
    const fallbackModel = 'gemini-pro-latest';

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
    
    try {
        console.log(`Attempting to generate content with primary model: ${primaryModel}`);
        result = await generateWithRetry(primaryModel, prompt);
    } catch (primaryError: any) {
        console.warn(`Primary model ${primaryModel} failed. Attempting fallback model ${fallbackModel}.`);
        try {
            result = await generateWithRetry(fallbackModel, prompt);
        } catch (fallbackError: any) {
            console.error(`Fallback model ${fallbackModel} also failed.`);
            throw fallbackError;
        }
    }

    if (!result) {
        throw new Error("AI response was unexpectedly empty after retries.");
    }

    const candidates = result.response ? result.response.candidates : result.candidates;

    if (!candidates || candidates.length === 0 || !candidates[0].content?.parts[0]?.text) {
        console.error("Invalid AI response structure:", JSON.stringify(result, null, 2));
        throw new Error("Received an invalid response structure from the AI service.");
    }

    const text = candidates[0].content.parts[0].text;

    return new NextResponse(text, { 
      status: 200, 
      headers: { 'Content-Type': 'text/plain' }
    });

  } catch (error: any) {
    const status = error.status || (error.message && error.message.includes('429') ? 429 : 500);
    const message = error.message || 'An unknown error occurred';

    if (status === 429) {
      console.warn("Cover Letter API: Hit quota limit (429).");
      return new NextResponse(
        "Looks like the AI is taking a quick coffee break due to a billing hiccup. Dennis is already on it, and I can vouch for his skills—he's got this AI thing down. Please try again in a little bit!",
        { status: 429, headers: { 'Content-Type': 'text/plain' } }
      );
    }

    if (status === 503) {
        console.warn("Cover Letter API: Final attempt failed with 503. Sending graceful response.");
        return new NextResponse(
            "The AI service is currently overloaded. Please try again in a moment.",
            { status: 503, headers: { 'Content-Type': 'text/plain' } }
        );
    }

    console.error("Fatal Error in Cover Letter API:", error);
    return new NextResponse(`An internal server error occurred: ${message}`, { status: status, headers: { 'Content-Type': 'text/plain' } });
  }
}
