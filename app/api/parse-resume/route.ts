import { NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import path from 'node:path';

// Construct a more robust path to the worker script for the Vercel environment
const workerPath = path.resolve(process.cwd(), 'node_modules/pdf-parse/lib/pdf.worker.js');
PDFParse.setWorker(workerPath);

export const runtime = 'nodejs';

export async function POST(req: Request) {
    let parser: PDFParse | null = null;
    try {
        const formData = await req.formData();
        const resumeFile = formData.get('resume') as File | null;

        if (!resumeFile) {
            return NextResponse.json({ error: "No resume file provided" }, { status: 400 });
        }

        const resumeBuffer = Buffer.from(await resumeFile.arrayBuffer());
        let resumeText = '';

        if (resumeFile.type === 'application/pdf') {
            try {
                // Diagnostic Step 1: Check if the constructor fails
                parser = new PDFParse({ data: resumeBuffer });
            } catch (initError: any) {
                return NextResponse.json({ error: 'DIAGNOSTIC_ERROR: Failed at PDFParse constructor', message: initError.message, stack: initError.stack }, { status: 500 });
            }

            try {
                // Diagnostic Step 2: Check if getText() fails
                const data = await parser.getText();
                resumeText = data.text;
            } catch (getTextError: any) {
                return NextResponse.json({ error: 'DIAGNOSTIC_ERROR: Failed at parser.getText()', message: getTextError.message, stack: getTextError.stack }, { status: 500 });
            }

        } else if (resumeFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const { value } = await mammoth.extractRawText({ buffer: resumeBuffer });
            resumeText = value;
        } else {
            return NextResponse.json({ error: "Unsupported file type. Please upload a .pdf or .docx file." }, { status: 400 });
        }

        return NextResponse.json({ resumeText });

    } catch (error: any) {
        // This is the generic catch-all for other unexpected errors
        return NextResponse.json({ error: 'DIAGNOSTIC_ERROR: Crashed in outer catch block', message: error.message, stack: error.stack }, { status: 500 });
    } finally {
        if (parser) {
            try {
                // Diagnostic Step 3: Check if destroy() fails
                await parser.destroy();
            } catch (destroyError: any) {
                // This is less likely to be the main issue, but good to log
                console.error("Diagnostic: Failed to destroy parser", destroyError);
            }
        }
    }
}
