import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fileSaver from 'file-saver';
const { saveAs } = fileSaver;
import type { TenderData, UploadedFile, RequirementMatch } from '../types/tender';

export async function generatePackage(
  tenderData: TenderData,
  uploadedFiles: UploadedFile[],
  matches: RequirementMatch[],
  lang: 'en' | 'bn'
) {
  const { tender, requirements } = tenderData;
  const mergedPdf = await PDFDocument.create();
  
  // 1. Create Cover Page
  const coverPage = mergedPdf.addPage([595.28, 841.89]); // A4 size
  const font = await mergedPdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await mergedPdf.embedFont(StandardFonts.HelveticaBold);
  const { height } = coverPage.getSize();
  
  let y = height - 80;
  const margin = 50;

  const drawText = (text: string, size: number, isBold = false, xPos = margin) => {
    coverPage.drawText(text, {
      x: xPos,
      y,
      size,
      font: isBold ? boldFont : font,
      color: rgb(0, 0, 0),
    });
    y -= (size + 10);
  };

  // Using English for cover page as per Section 6.1: "Page 1 is a cover page, in English."
  drawText('TENDER DOCUMENT PACKAGE', 24, true);
  y -= 20;

  const details = [
    ['Tender ID:', tender.tender_id],
    ['Title:', tender.title],
    ['Procuring Entity:', tender.procuring_entity],
    ['Bidder:', tender.bidder],
    ['Submission Deadline:', tender.submission_deadline],
    ['Generated On:', new Date().toISOString().split('T')[0]],
  ];

  details.forEach(([label, value]) => {
    coverPage.drawText(label, { x: margin, y, size: 12, font: boldFont });
    coverPage.drawText(value, { x: margin + 150, y, size: 12, font });
    y -= 20;
  });

  y -= 20;
  drawText('Included Documents:', 16, true);
  y -= 10;

  // 2. Add Documents to Cover List & Merge PDFs
  const includedDocs: { reqTitle: string; startPage: number }[] = [];
  
  // Requirements are already sorted by order, process them sequentially
  for (const req of requirements) {
    const match = matches.find(m => m.requirementId === req.id);
    if (!match?.fileId) continue; // Skip optional unmatched docs

    const file = uploadedFiles.find(f => f.id === match.fileId);
    if (!file) continue;

    const reqTitle = lang === 'bn' ? req.title_bn : req.title_en;
    includedDocs.push({ reqTitle, startPage: mergedPdf.getPageCount() + 1 });
    
    // Add to cover page list
    drawText(`${req.order}. ${reqTitle}`, 12);

    // Merge PDF
    try {
      const fileBuffer = await file.file.arrayBuffer();
      const pdfToMerge = await PDFDocument.load(fileBuffer);
      const copiedPages = await mergedPdf.copyPages(pdfToMerge, pdfToMerge.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    } catch (e) {
      console.error(`Failed to merge ${file.name}`, e);
    }
  }

  // 3. Add Footers (tender_id | Page X of Y)
  const totalPages = mergedPdf.getPageCount();
  const footerFont = font;
  
  for (let i = 0; i < totalPages; i++) {
    const page = mergedPdf.getPage(i);
    const { width } = page.getSize();
    const footerText = `${tender.tender_id} | Page ${i + 1} of ${totalPages}`;
    const textWidth = footerFont.widthOfTextAtSize(footerText, 10);
    
    // Draw footer at bottom center
    page.drawText(footerText, {
      x: (width - textWidth) / 2,
      y: 20,
      size: 10,
      font: footerFont,
      color: rgb(0, 0, 0),
    });
  }

  // 4. Save and Download
  const pdfBytes = await mergedPdf.save();
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  saveAs(blob, `${tender.tender_id}_Package.pdf`);
}
