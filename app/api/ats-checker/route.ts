import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, GoogleGenerativeAIFetchError } from '@google/generative-ai';
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

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function getFileContent(filePath: string): Promise<string> {
    const absolutePath = path.resolve(process.cwd(), filePath);
    return await fs.readFile(absolutePath, 'utf-8');
}


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
          console.warn(`ATS Checker API: generateContent timed out (Attempt ${attempt + 1})`);
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
        console.warn(`ATS Checker API: Received 503, retrying in ${delay}ms... (Attempt ${attempt + 1})`);
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

        const modelsToTry = ['gemini-pro-latest', 'gemini-flash-latest'];
        let result;
        let lastError;

        for (const modelName of modelsToTry) {
            try {
                console.log(`Attempting to generate content with model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });
                
                result = await generateWithRetry(model, prompt); 
                
                if (result) {
                    console.log(`Successfully generated content with model: ${modelName}`);
                    break; // Success, exit the loop
                }
            } catch (error) {
                lastError = error;
                if (error instanceof GoogleGenerativeAIFetchError && error.status === 503) {
                    console.warn(`Model ${modelName} failed with 503. Trying next model.`);
                    continue; // Try the next model
                } else {
                    // For other errors (like 404), fail fast
                    throw error;
                }
            }
        }

        if (!result) {
            console.error("All models failed to generate a response.");
            throw lastError || new Error("AI response was unexpectedly empty after all fallbacks.");
        }
        
        const response = await result.response;
        const text = await response.text();

        return new NextResponse(text, { 
            status: 200,
            headers: { 'Content-Type': 'text/plain' }
        });

    } catch (error: any) {
        if (error instanceof GoogleGenerativeAIFetchError && error.status === 503) {
            console.warn("ATS Checker API: Final attempt failed with 503 after all fallbacks. Sending graceful response.");
            return new NextResponse(
                "The AI service is currently overloaded. Please try again in a moment.",
                { status: 503, headers: { 'Content-Type': 'text/plain' } }
            );
        }

        console.error('Error in ATS checker API:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return new NextResponse(`Internal Server Error: ${errorMessage}`, { status: 500, headers: { 'Content-Type': 'text/plain' } });
    }
}
