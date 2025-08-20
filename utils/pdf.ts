import jsPDF from "jspdf";

export interface PdfPayload {
  title: string;
  author: string;
  contentHtml: string;
  createdAt?: string;
  updatedAt?: string;
  fileName?: string; // without extension
}

/**
 * Export blog post content as a text-based PDF (images stripped).
 * Produces simple pagination and line-wrapping.
 */
export function exportHtmlToPdf({
  title,
  author,
  contentHtml,
  createdAt,
  updatedAt,
  fileName,
}: PdfPayload): void {
  const doc = new jsPDF({ unit: "pt", format: "a4", compress: true });

  const left = 48;
  const right = 48;
  const top = 64;
  const bottom = 64;
  const lineHeight = 18;
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - left - right;

  // Title
  doc.setFont("Times", "bold");
  doc.setFontSize(20);
  doc.text(title, left, top);

  // Meta
  doc.setFont("Times", "normal");
  doc.setFontSize(11);
  const metaY = top + 24;
  const dateString = updatedAt
    ? new Date(updatedAt).toLocaleString()
    : createdAt
    ? new Date(createdAt).toLocaleString()
    : "";
  const meta = `Author: ${author}${dateString ? ` • ${dateString}` : ""}`;
  doc.text(meta, left, metaY);

  // Body text (strip images, preserve lists)
  const bodyYStart = metaY + 24;
  const plain = htmlToPlainText(contentHtml);
  addWrappedText(doc, plain, left, bodyYStart, maxWidth, lineHeight, bottom);

  doc.save(`${fileName || slugify(title)}.pdf`);
}

function htmlToPlainText(html: string): string {
  const container = document.createElement("div");
  container.innerHTML = html;

  // Remove images explicitly
  container.querySelectorAll("img").forEach((n) => n.remove());

  // Convert list items to lines with bullets/numbers if possible
  container.querySelectorAll("ul").forEach((ul) => {
    ul.querySelectorAll("li").forEach((li) => {
      li.textContent = `• ${li.textContent ?? ""}`;
    });
    ul.replaceWith(document.createTextNode(`${ul.textContent ?? ""}\n`));
  });
  container.querySelectorAll("ol").forEach((ol) => {
    let i = 1;
    ol.querySelectorAll("li").forEach((li) => {
      li.textContent = `${i}. ${li.textContent ?? ""}`;
      i += 1;
    });
    ol.replaceWith(document.createTextNode(`${ol.textContent ?? ""}\n`));
  });

  const text = container.innerText.replace(/\n{3,}/g, "\n\n").trim();
  return text.length > 0 ? text : "";
}

function addWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  bottomMargin: number
): void {
  if (text.length === 0) return;
  doc.setFont("Times", "normal");
  doc.setFontSize(12);

  const pageHeight = doc.internal.pageSize.getHeight();
  const paragraphs = text.split(/\n{2,}/);
  let cursorY = y;

  paragraphs.forEach((p, idx) => {
    const lines: string[] = doc.splitTextToSize(p, maxWidth) as string[];
    lines.forEach((line: string) => {
      if (cursorY > pageHeight - bottomMargin) {
        doc.addPage();
        cursorY = 64; // reset to top margin
      }
      doc.text(line, x, cursorY);
      cursorY += lineHeight;
    });
    if (idx < paragraphs.length - 1) {
      cursorY += lineHeight; // paragraph spacing
    }
  });
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
