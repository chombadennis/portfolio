import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { promises as fs } from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import { initializeApp, getApps, App, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import pdf from 'pdf-parse';

// --- START: Firebase Admin Initialization ---
let adminApp: App | undefined;
let auth: ReturnType<typeof getAuth> | undefined;

function initializeFirebaseAdmin() {
    if (getApps().length === 0) {
        const serviceAccountKey = process.env.APP_SERVICE_ACCOUNT_KEY;
        if (!serviceAccountKey) {
            throw new Error("Firebase Admin service account key is not set.");
        }
        try {
            adminApp = initializeApp({ credential: cert(JSON.parse(serviceAccountKey)) });
        } catch (e: any) {
            throw new Error(`Failed to parse Firebase service account key: ${e.message}`);
        }
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

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

async function getFileContent(filePath: string): Promise<string> {
    const absolutePath = path.resolve(process.cwd(), filePath);
    return await fs.readFile(absolutePath, 'utf-8');
}


// --- START: Production-Grade Error Handling ---
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
        console.warn(`ATS Checker API: Attempt ${attempt} failed for model ${modelName}. Error: ${err.message}`);
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
    
    let result: any;
    try {
        const formData = await req.formData();
        const jobDescription = formData.get('jobDescription') as string;
        const resumeFile = formData.get('resume') as File | null;

        if (!jobDescription || !resumeFile) {
            return new NextResponse('Missing job description or resume file', { status: 400 });
        }

        const resumeBuffer = Buffer.from(await resumeFile.arrayBuffer());
        let resumeText = '';
        if (resumeFile.type === 'application/pdf') {
            const data = await pdf(resumeBuffer);
            resumeText = data.text;
        } else if (resumeFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const { value } = await mammoth.extractRawText({ buffer: resumeBuffer });
            resumeText = value;
        } else {
            return new NextResponse('Unsupported file type', { status: 400 });
        }

        const projectsJson = await getFileContent('data/projects.json');
        const contextTs = await getFileContent('lib/ai/context.ts');

        const prompt = `
            Act as an expert Applicant Tracking System (ATS) and a professional resume writer.
            Your task is to help me optimize my resume for a specific job description.

            **My Information (for context):**
            - My professional experience, skills, and projects are detailed in this JSON file: ${projectsJson}
            - The overall context and tone of my professional persona is described here: ${contextTs}

            **My Current Resume:**
            \`\`\`
            ${resumeText}
            \`\`\`

            **The Job Description I'm Targeting:**
            \`\`\`
            ${jobDescription}
            \`\`\`

            **Your Task:**
            1.  **Analyze and Compare:** Carefully analyze my resume against the job description.
            2.  **Identify Keywords:** Identify the most important keywords and skills from the job description that are missing or underrepresented in my resume.
            3.  **Provide Actionable Recommendations:** Provide a concise, bulleted list of specific changes I should make to my resume to make it more ATS-friendly and better aligned with the job description. For each recommendation, briefly explain *why* it's important.
            4.  **Do Not Rewrite the Resume:** Do not provide a full rewrite of the resume. Only provide the list of recommendations.
            5.  **Maintain a Professional Tone:** Your feedback should be encouraging and professional.
            6.  **Formatting**: Do not use any Markdown formatting (no '###', '**', '*', or '-'). Respond in plain text only, using line breaks to separate ideas.
        `;

        const primaryModel = 'gemini-2.5-pro';
        const fallbackModel = 'gemini-pro-latest';

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
            throw new Error("Atheresponse was unexpectedly empty.");
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
        const status = error.status || 500;
        const message = error.message || "An unknown error occurred.";

        if (status === 503) {
            console.warn("ATS Checker API: The request failed after all retries.");
            return new NextResponse(
                "The AI service is currently overloaded. Please try again in a moment.",
                { status: 503, headers: { 'Content-Type': 'text/plain' } }
            );
        }

        console.error('Error in ATS checker API:', error);
        return new NextResponse(`Internal Server Error: ${message}`, { status: status, headers: { 'Content-Type': 'text/plain' } });
    }
}
