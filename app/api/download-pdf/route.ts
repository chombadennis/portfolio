import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb, PDFName, PDFArray, PDFString } from 'pdf-lib';

const sectionTitles = [
    'PROFESSIONAL SUMMARY',
    'TECHNICAL SKILLS',
    'RELEVANT DEVELOPMENT EXPERIENCE',
    'PROJECTS',
    'EDUCATION',
    'PREVIOUS WORK EXPERIENCE',
    'CERTIFICATIONS AND TRAINING'
].map(t => t.toUpperCase());

export async function POST(req: Request) {
    try {
        const { resumeText } = await req.json();
        if (!resumeText) {
            return new NextResponse(JSON.stringify({ message: 'Resume text is required' }), { status: 400 });
        }

        const pdfDoc = await PDFDocument.create();
        let page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        
        const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
        const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
        
        const fontSize = 12;
        const margin = 50;
        let y = height - margin;
        const lineHeight = fontSize * 1.2;
        const sectionSpacing = lineHeight * 0.5;
        const bulletIndent = 20;
        const maxWidth = width - margin * 2;

        const addLink = (url: string, displayText: string, preText: string, x_offset: number) => {
            const preWidth = font.widthOfTextAtSize(preText, fontSize);
            const linkWidth = font.widthOfTextAtSize(displayText, fontSize);

            page.drawText(preText, { x: x_offset, y, font, size: fontSize });
            page.drawText(displayText, { x: x_offset + preWidth, y, font, size: fontSize, color: rgb(0, 0, 1) });

            let annots = page.node.lookup(PDFName.of('Annots'), PDFArray);
            if (!annots) {
                annots = pdfDoc.context.obj([]);
                page.node.set(PDFName.of('Annots'), annots);
            }
            
            const linkAnnotation = pdfDoc.context.obj({
                Type: 'Annot', Subtype: 'Link', Border: [0, 0, 0],
                Rect: [x_offset + preWidth, y - 2, x_offset + preWidth + linkWidth, y + lineHeight - 2],
                A: { Type: 'Action', S: 'URI', URI: PDFString.of(url) },
            });
            annots.push(linkAnnotation);
            y -= lineHeight;
        };

        const lines = resumeText.split('\n');

        for (let line of lines) {
            line = line.trim();
            if (!line) continue; // Skip blank lines, letting the section logic handle spacing

            if (y < margin) {
                page = pdfDoc.addPage();
                y = height - margin;
            }

            const isBold = line.includes('##') || line.startsWith('**');
            const isBullet = ['*', '•', '●'].includes(line.substring(0, 1));
            const lineText = line.replace(/(\*\*|## ?)/g, '').replace(/^[*•●] /, '').trim();

            if (isBold && sectionTitles.includes(lineText.toUpperCase())) {
                y -= sectionSpacing;
            }

            const currentFont = isBold ? boldFont : font;
            const x_offset = isBullet ? margin + bulletIndent : margin;
            const effectiveMaxWidth = maxWidth - (isBullet ? bulletIndent : 0);
            
            const linkedinUrl = 'https://www.linkedin.com/in/lukk3vdebarezz99l8yy/';
            const portfolioUrl = 'https://dennis--dennisportfolio-35723.us-central1.hosted.app/';

            if (lineText.includes(linkedinUrl)) {
                const [pre] = lineText.split(linkedinUrl);
                addLink(linkedinUrl, 'linkedin.com', pre, x_offset);
                continue;
            } else if (lineText.includes(portfolioUrl)) {
                const [pre] = lineText.split(portfolioUrl);
                addLink(portfolioUrl, 'my-portfolio', pre, x_offset);
                continue;
            }

            if (isBullet) {
                page.drawText('•', { x: margin, y, font, size: fontSize });
            }

            let words = lineText.split(' ');
            let currentLine = '';

            for (const word of words) {
                const testLine = currentLine + (currentLine ? ' ' : '') + word;
                if (currentFont.widthOfTextAtSize(testLine, fontSize) > effectiveMaxWidth) {
                    page.drawText(currentLine, { x: x_offset, y, font: currentFont, size: fontSize });
                    y -= lineHeight;
                    currentLine = word;
                    if (y < margin) { 
                        page = pdfDoc.addPage(); 
                        y = height - margin; 
                        if (isBullet) { page.drawText('•', { x: margin, y, font, size: fontSize }); }
                    }
                } else {
                    currentLine = testLine;
                }
            }
            
            page.drawText(currentLine, { x: x_offset, y, font: currentFont, size: fontSize });
            y -= lineHeight;
        }

        const pdfBytes = await pdfDoc.save();
        return new NextResponse(pdfBytes, { status: 200, headers: { 'Content-Type': 'application/pdf' } });

    } catch (error) {
        console.error('Error generating PDF:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return new NextResponse(JSON.stringify({ message: `Internal Server Error: ${errorMessage}` }), {
             status: 500, headers: { 'Content-Type': 'application/json' } 
        });
    }
}
