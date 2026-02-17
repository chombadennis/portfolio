import { NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun, ExternalHyperlink } from 'docx';

export async function POST(req: Request) {
    try {
        const { resumeText } = await req.json();
        if (!resumeText) {
            return new NextResponse(JSON.stringify({ message: 'Resume text is required' }), { status: 400 });
        }

        const paragraphs: Paragraph[] = [];
        const lines = resumeText.split('\n');

        for (const line of lines) {
            const processedLine = line.trim();

            const linkedinUrl = 'https://www.linkedin.com/in/lukk3vdebarezz99l8yy/';
            const portfolioUrl = 'https://dennis--dennisportfolio-35723.us-central1.hosted.app/';

            if (processedLine.includes(linkedinUrl)) {
                const [preText] = processedLine.split(linkedinUrl);
                paragraphs.push(new Paragraph({
                    children: [
                        new TextRun(preText),
                        new ExternalHyperlink({
                            children: [ new TextRun({ text: "linkedin.com", style: "Hyperlink" }) ],
                            link: linkedinUrl,
                        }),
                    ],
                }));
                continue;
            }

            if (processedLine.includes(portfolioUrl)) {
                const [preText] = processedLine.split(portfolioUrl);
                paragraphs.push(new Paragraph({
                    children: [
                        new TextRun(preText),
                        new ExternalHyperlink({
                            children: [ new TextRun({ text: "my-portfolio", style: "Hyperlink" }) ],
                            link: portfolioUrl,
                        }),
                    ],
                }));
                continue;
            }

            if (processedLine.includes('## ')) {
                const boldText = processedLine.replace(/(\*\*|## ?)/g, '').trim();
                if (boldText) {
                    paragraphs.push(new Paragraph({ children: [new TextRun({ text: boldText, bold: true })] }));
                }
            } else if (processedLine.startsWith('* ')) {
                const bulletText = processedLine.substring(2).trim();
                if (bulletText) {
                    paragraphs.push(new Paragraph({
                        text: bulletText,
                        numbering: {
                            reference: 'default-bullet',
                            level: 0,
                        },
                    }));
                }
            } else if (processedLine) {
                paragraphs.push(new Paragraph({ children: [new TextRun(processedLine)] }));
            }
        }

        const doc = new Document({
            numbering: {
                config: [
                    {
                        levels: [
                            {
                                level: 0,
                                format: 'bullet',
                                text: '\u2022',
                                style: {
                                    paragraph: {
                                        indent: { left: 720, hanging: 260 },
                                    },
                                },
                            },
                        ],
                        reference: 'default-bullet',
                    },
                ],
            },
            styles: {
                characterStyles: [
                    {
                        id: 'Hyperlink',
                        name: 'Hyperlink',
                        basedOn: 'DefaultParagraphFont',
                        run: {
                            color: '0000FF',
                            underline: {
                                type: 'single',
                                color: '0000FF',
                            },
                        },
                    },
                ],
                paragraphStyles: [
                    {
                        id: "Normal",
                        name: "Normal",
                        basedOn: "Normal",
                        next: "Normal",
                        quickFormat: true,
                        run: {
                            font: "Times New Roman",
                            size: 24, // 12pt
                        },
                    },
                ],
            },
            sections: [{
                children: paragraphs,
            }],
        });

        const buffer = await Packer.toBuffer(doc);
        const uint8Array = new Uint8Array(buffer);

        const blob = new Blob([uint8Array], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

        return new NextResponse(blob, {
            status: 200,
            headers: {
                'Content-Disposition': 'attachment; filename="resume.docx"',
            },
        });

    } catch (error) {
        console.error('Error generating DOCX:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return new NextResponse(JSON.stringify({ message: `Internal Server Error: ${errorMessage}` }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
