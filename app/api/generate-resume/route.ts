import { NextRequest, NextResponse } from 'next/server';
// STEP 1: Use the new, correct SDK (`@google/genai`)
import { GoogleGenAI } from '@google/genai';
import mammoth from 'mammoth';
import pdf from 'pdf-parse'; // Corrected import

const API_KEY = process.env.GEMINI_API_KEY || '';

if (!API_KEY) {
  console.warn("Gemini API key is not set. The resume generation feature will be disabled.");
}

// CORRECT INITIALIZATION: The new SDK expects an options object.
const genAI = new GoogleGenAI({ apiKey: API_KEY });


// --- START: Production-Grade Error Handling (Corrected) ---
async function generateWithRetry(modelName: string, prompt: string, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Set a longer timeout for resume generation
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), 90000)
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
        console.warn(`Generate-Resume API: Attempt ${attempt} failed for model ${modelName}. Error: ${err.message}`);
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
    if (!API_KEY) {
        return new NextResponse("AI service API key not configured", { status: 500, headers: { 'Content-Type': 'text/plain' } });
    }
    try {
        const formData = await req.formData();
        const jobDescription = formData.get('jobDescription') as string;
        const resumeFile = formData.get('resume') as File | null;

        if (!jobDescription || !resumeFile) {
            return new NextResponse('Job description and resume file are required.', { status: 400, headers: { 'Content-Type': 'text/plain' } });
        }

        // Re-using the robust file parsing logic from ats-checker
        const resumeBuffer = Buffer.from(await resumeFile.arrayBuffer());
        let resumeText = '';
        if (resumeFile.type === 'application/pdf') {
            const data = await pdf(resumeBuffer);
            resumeText = data.text;
        } else if (resumeFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const { value } = await mammoth.extractRawText({ buffer: resumeBuffer });
            resumeText = value;
        } else {
             // Fallback for plain text files
            resumeText = resumeBuffer.toString('utf-8');
        }


        const primaryModel = 'gemini-2.5-pro';
        const fallbackModel = 'gemini-pro-latest'; 

        const prompt = `You are an expert resume writer in the year 2026. Based on the following resume and job description, please rewrite the resume to be a perfect fit for the job. 
        The output must be only the rewritten resume text, without any additional pleasantries, greetings, or introductory phrases. 
        The tone should be highly professional and confident.

        **Important Context:**
        - The current year is 2026. Ensure all dates and timelines are interpreted from this perspective. Do not use phrases like "projected to complete" for any dates in the past.

        **Structure the Resume:**
        Organize the resume into the following sections, in this order:
        -   Contact Information
        -   Professional Summary
        -   Technical Skills
        -   Relevant Development Experience
        -   Projects
        -   Education
        -   Certifications and Training

        **Formatting Instructions:**
        1.  Start any line that should be **bold** with a '## ' prefix. This includes:
            - Your name
            - Section titles (e.g., 'Professional Summary', 'Technical Skills', 'Relevant Development Experience', 'Projects', 'Education', 'Previous Work Experience', 'Certifications and Training')
            - Each category under 'Technical Skills' (e.g., 'Languages:')
            - The title line for each entry under 'Relevant Development Experience', 'Projects', and 'Previous Work Experience'.
            - The title of your education.
        2.  For the 'Certifications and Training' section, apply the '## ' prefix ONLY to the section title. The body content of this section should NOT have the prefix.
        3.  Do NOT bold the phone number or email address.
        4.  For your LinkedIn and Portfolio, format them exactly as follows on their own lines:
            - LinkedIn: https://www.linkedin.com/in/lukk3vdebarezz99l8yy/
            - Portfolio: https://dennis--dennisportfolio-35723.us-central1.hosted.app/
        5.  Use a standard asterisk ('*') for bullet points.
        6.  Do not use any other markdown or formatting.

        **Job Description:**
        ${jobDescription}

        **Original Resume:**
        ${resumeText}`;

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

        const refinedResume = candidates[0].content.parts[0].text;

        return new NextResponse(refinedResume, { 
            status: 200, 
            headers: { 'Content-Type': 'text/plain' }
        });

    } catch (error: any) {
        const status = error.status || 500;
        const message = error.message || 'An unknown error occurred';

        if (status === 503) {
            console.warn("Generate-Resume API: Final attempt failed with 503. Sending graceful response.");
            return new NextResponse(
                "The AI service is currently overloaded. Please try again in a moment.",
                { status: 503, headers: { 'Content-Type': 'text/plain' } }
            );
        }

        console.error('Error in generate-resume API:', error);
        return new NextResponse(`Internal Server Error: ${message}`, { status: status, headers: { 'Content-Type': 'text/plain' } });
    }
}
