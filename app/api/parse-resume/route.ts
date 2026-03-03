import { NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

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
            parser = new PDFParse({ data: resumeBuffer });
            const data = await parser.getText();
            resumeText = data.text;
        } else if (resumeFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            // Mammoth does not require a manual destroy step
            const { value } = await mammoth.extractRawText({ buffer: resumeBuffer });
            resumeText = value;
        } else {
            return NextResponse.json({ error: "Unsupported file type. Please upload a .pdf or .docx file." }, { status: 400 });
        }

        return NextResponse.json({ resumeText });

    } catch (error) {
        console.error('Error in parse-resume API:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Internal Server Error', message: errorMessage }, { status: 500 });
    } finally {
        if (parser) {
            await parser.destroy();
        }
    }
}
