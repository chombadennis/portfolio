
import { GoogleGenerativeAI } from "@google/generative-ai";
import { portfolioContext } from "@/lib/ai/context";
import { 
    heroContent,
    aboutContent,
    contactContent,
} from "@/lib/ai/static-context";
import projectsData from "@/data/projects.json";
import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, App, cert } from "firebase-admin/app";
import { getAuth, DecodedIdToken } from "firebase-admin/auth";

// --- START: Firebase Admin Initialization (minimal addition for security) ---
let adminApp: App | undefined;
let auth: ReturnType<typeof getAuth> | undefined;

function initializeFirebaseAdmin() {
    if (getApps().length === 0) {
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        if (!serviceAccountKey) {
            throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is missing.");
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


// --- START: Your working Gemini AI Implementation ---
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

export async function POST(req: NextRequest) {
  // 1. Initialize and check authentication first
  try {
      initializeFirebaseAdmin();
      const isAdmin = await getIsAdmin(req);
      if (!isAdmin) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
  } catch (e: any) {
      console.error("Authentication check failed:", e);
      return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
  }

  // 2. Proceed with your proven logic
  if (!API_KEY) {
    return new Response("AI service API key not configured", { status: 500 });
  }

  try {
    const { jobDescription } = await req.json();

    if (!jobDescription) {
      return new Response("Job description is required", { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro-latest" }); // Correct model name

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

    const result = await model.generateContent({ 
        contents: [{ role: "user", parts: [{text: prompt}] }]
    });
    const response = await result.response;
    const text = await response.text();

    return new Response(text, { 
      status: 200, 
      headers: { 'Content-Type': 'text/plain' }
    });

  } catch (error: any) {
    console.error("Fatal Error in Cover Letter API:", error);
    // Send back the specific error from Gemini for better debugging
    return new Response(`An unexpected error occurred. Details: ${error.message}`, { status: 500 });
  }
}
