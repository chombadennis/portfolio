import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { promises as fs } from 'fs';
import path from 'path';
import mammoth from 'mammoth';

// Correctly import the PDFParse class from 'pdf-parse' using require, as per the v2 documentation
const { PDFParse } = require('pdf-parse');

// Initialize the Gemini AI model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function getFileContent(filePath: string): Promise<string> {
    const absolutePath = path.resolve(process.cwd(), filePath);
    return await fs.readFile(absolutePath, 'utf-8');
}

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const jobDescription = formData.get('jobDescription') as string;
        const resumeFile = formData.get('resume') as File | null;

        if (!jobDescription || !resumeFile) {
            return new NextResponse('Missing job description or resume file', { status: 400 });
        }

        // 1. Read Resume Content
        const resumeBuffer = Buffer.from(await resumeFile.arrayBuffer());
        let resumeText = '';
        if (resumeFile.type === 'application/pdf') {
            // Use the pdf-parse v2 API
            const parser = new PDFParse({ data: resumeBuffer });
            const data = await parser.getText();
            resumeText = data.text;
        } else if (resumeFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const { value } = await mammoth.extractRawText({ buffer: resumeBuffer });
            resumeText = value;
        } else {
            return new NextResponse('Unsupported file type', { status: 400 });
        }

        // 2. Read Additional Context from your project
        const projectsJson = await getFileContent('data/projects.json');
        const contextTs = await getFileContent('lib/ai/context.ts');

        // 3. Construct the Prompt for Gemini
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

        // 4. Generate Content with Gemini - Use the correct model name
        const model = genAI.getGenerativeModel({ model: 'gemini-pro-latest' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = await response.text();

        // Return only the AI recommendations as plain text
        return new NextResponse(text, { 
            status: 200,
            headers: { 'Content-Type': 'text/plain' }
        });

    } catch (error) {
        console.error('Error in ATS checker API:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return new NextResponse(JSON.stringify({ error: 'Internal Server Error', message: errorMessage }), { status: 500 });
    }
}
