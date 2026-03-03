import { NextResponse } from 'next/server';
import mammoth from 'mammoth';
import pdf from 'pdf-parse';

export const runtime = 'nodejs';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const resumeFile = formData.get('resume') as File | null;

        if (!resumeFile) {
            return NextResponse.json(
                { error: "No resume file provided" },
                { status: 400 }
            );
        }

        const resumeBuffer = Buffer.from(await resumeFile.arrayBuffer());
        let resumeText = '';

        if (resumeFile.type === 'application/pdf') {
            const data = await pdf(resumeBuffer);
            resumeText = data.text;

        } else if (
            resumeFile.type ===
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
            const { value } = await mammoth.extractRawText({
                buffer: resumeBuffer,
            });
            resumeText = value;

        } else {
            return NextResponse.json(
                { error: "Unsupported file type. Please upload a .pdf or .docx file." },
                { status: 400 }
            );
        }

        return NextResponse.json({ resumeText });

    } catch (error: any) {
        console.error('Unexpected parse-resume error:', error);
        return NextResponse.json(
            { error: 'Internal server error.' },
            { status: 500 }
        );
    }
}