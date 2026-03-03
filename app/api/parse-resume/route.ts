import { NextResponse } from 'next/server';
import mammoth from 'mammoth';
const { PDFParse } = require('pdf-parse');

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const resumeFile = formData.get('resume') as File | null;

        if (!resumeFile) {
            return new NextResponse("No resume file provided", { status: 400, headers: { 'Content-Type': 'text/plain' } });
        }

        const resumeBuffer = Buffer.from(await resumeFile.arrayBuffer());
        let resumeText = '';

        if (resumeFile.type === 'application/pdf') {
            const parser = new PDFParse({ data: resumeBuffer });
            const data = await parser.getText();
            resumeText = data.text;
        } else if (resumeFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const { value } = await mammoth.extractRawText({ buffer: resumeBuffer });
            resumeText = value;
        } else {
            return new NextResponse("Unsupported file type. Please upload a .pdf or .docx file.", { status: 400, headers: { 'Content-Type': 'text/plain' } });
        }

        return new NextResponse(resumeText, { status: 200, headers: { 'Content-Type': 'text/plain' } });

    } catch (error) {
        console.error('Error in parse-resume API:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return new NextResponse(`Internal Server Error: ${errorMessage}`, { status: 500, headers: { 'Content-Type': 'text/plain' } });
    }
}
