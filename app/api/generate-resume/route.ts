import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, GoogleGenerativeAIFetchError } from '@google/generative-ai';
import mammoth from 'mammoth';
const { PDFParse } = require('pdf-parse');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function getFileText(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (file.type === 'application/pdf') {
        const parser = new PDFParse({ data: buffer });
        const data = await parser.getText();
        return data.text;
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const { value } = await mammoth.extractRawText({ buffer });
        return value;
    } else {
        return new TextDecoder().decode(arrayBuffer);
    }
}

// --- START: Production-Grade Error Handling ---
async function generateWithRetry(model: any, prompt: string, retries = 3) {
  let attempt = 0;
  while (attempt < retries) {
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), 90000) // 90-second timeout for longer resume generation
      );
      
      const result = await Promise.race([
        model.generateContent(prompt),
        timeoutPromise
      ]);
      return result;

    } catch (err: any) {
      if (err.message === 'Request timed out') {
          console.warn(`Generate-Resume API: generateContent timed out (Attempt ${attempt + 1})`);
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
        console.warn(`Generate-Resume API: Received 503, retrying in ${delay}ms... (Attempt ${attempt + 1})`);
        await new Promise(res => setTimeout(res, delay));
        attempt++;
      } else {
        throw err;
      }
    }
  }
}
// --- END: Production-Grade Error Handling ---

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const jobDescription = formData.get('jobDescription') as string;
        const resumeFile = formData.get('resume') as File;

        if (!jobDescription || !resumeFile) {
            return new NextResponse('Job description and resume file are required.', { status: 400, headers: { 'Content-Type': 'text/plain' } });
        }

        const resumeText = await getFileText(resumeFile);

        const model = genAI.getGenerativeModel({ model: 'gemini-pro-latest' });

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

        // Replace direct call with the new retry mechanism
        const result = await generateWithRetry(model, prompt);
        
        if (!result) {
            throw new Error("AI response was unexpectedly empty after retries.");
        }

        const response = await result.response;
        const refinedResume = await response.text();

        return new NextResponse(refinedResume, { 
            status: 200, 
            headers: { 'Content-Type': 'text/plain' }
        });

    } catch (error: any) {
        if (error instanceof GoogleGenerativeAIFetchError && error.status === 503) {
            console.warn("Generate-Resume API: Final attempt failed with 503. Sending graceful response.");
            return new NextResponse(
                "The AI service is currently overloaded. Please try again in a moment.",
                { status: 503, headers: { 'Content-Type': 'text/plain' } }
            );
        }

        console.error('Error in generate-resume API:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return new NextResponse(`Internal Server Error: ${errorMessage}`, { status: 500, headers: { 'Content-Type': 'text/plain' } });
    }
}
