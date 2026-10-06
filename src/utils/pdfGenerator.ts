import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fileSaver from 'file-saver';
const { saveAs } = fileSaver;
import type { TenderData, UploadedFile, RequirementMatch } from '../types/tender';

export async function generatePackage(
  tenderData: TenderData,
  uploadedFiles: UploadedFile[],
  matches: RequirementMatch[],
  signatureDataUrl: string | null,
  lang: 'en' | 'bn'
) {
  const { tender, requirements } = tenderData;
  const mergedPdf = await PDFDocument.create();
  mergedPdf.registerFontkit(fontkit);
  
  // 1. Create Cover Page
  const coverPage = mergedPdf.addPage([595.28, 841.89]); // A4 size
  const font = await mergedPdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await mergedPdf.embedFont(StandardFonts.HelveticaBold);
  
  let bengaliFont: any = font;
  try {
    const fontBytes = await fetch('/NotoSansBengali-Regular.ttf').then(res => res.arrayBuffer());
    bengaliFont = await mergedPdf.embedFont(fontBytes);
  } catch (e) {
    console.error('Failed to load Bengali font', e);
  }

  const { height } = coverPage.getSize();
  
  // Load Signature Image if provided
  let signatureImage: any = null;
  if (signatureDataUrl) {
    try {
      const base64Data = signatureDataUrl.split(',')[1];
      if (base64Data) {
        const binaryString = atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        signatureImage = await mergedPdf.embedPng(bytes);
      }
    } catch (e) {
      console.error('Failed to embed signature image', e);
    }
  }

  let y = height - 80;
  const margin = 50;

  const drawText = (text: string, size: number, isBold = false, xPos = margin) => {
    // If text contains Bengali characters, use bengaliFont
    const hasBengali = /[\u0980-\u09FF]/.test(text);
    const selectedFont = hasBengali ? bengaliFont : (isBold ? boldFont : font);
    coverPage.drawText(text, {
      x: xPos,
      y,
      size,
      font: selectedFont,
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
  // Documents list moved to Index page

  // 1.5 Create Index Page
  const indexPage = mergedPdf.addPage([595.28, 841.89]);
  let indexY = height - 80;

  const drawIndexText = (text: string, size: number, isBold = false, xPos = margin) => {
    const hasBengali = /[\u0980-\u09FF]/.test(text);
    const selectedFont = hasBengali ? bengaliFont : (isBold ? boldFont : font);
    indexPage.drawText(text, {
      x: xPos,
      y: indexY,
      size,
      font: selectedFont,
      color: rgb(0, 0, 0),
    });
    indexY -= (size + 10);
  };

  drawIndexText('INDEX', 24, true);
  indexY -= 20;

  // 2. Add Documents to Cover List & Merge PDFs
  const includedDocs: { reqTitle: string; startPage: number }[] = [];
  
  // Requirements are already sorted by order, process them sequentially
  for (const req of requirements) {
    const match = matches.find(m => m.requirementId === req.id);
    if (!match?.fileId) continue; // Skip optional unmatched docs

    const file = uploadedFiles.find(f => f.id === match.fileId);
    if (!file) continue;

    const reqTitle = lang === 'bn' ? req.title_bn : req.title_en;
    const startPage = mergedPdf.getPageCount() + 1;
    includedDocs.push({ reqTitle, startPage });
    
    // Add to index page list
    drawIndexText(`${req.order}. ${reqTitle}`, 12);
    // Draw page number on the right
    indexPage.drawText(`Page ${startPage}`, {
      x: 500,
      y: indexY + 22, // adjust for the subtraction in drawIndexText
      size: 12,
      font: font,
    });

    // Merge PDF
    try {
      const fileBuffer = await file.file.arrayBuffer();
      const pdfToMerge = await PDFDocument.load(fileBuffer);
      const copiedPages = await mergedPdf.copyPages(pdfToMerge, pdfToMerge.getPageIndices());
      
      copiedPages.forEach((page) => {
        mergedPdf.addPage(page);
        
        // Bonus: Draw signature if requested
        if (signatureImage && match.applySignature) {
          const { width: pageWidth } = page.getSize();
          const sigDims = signatureImage.scale(0.5); // scale down
          page.drawImage(signatureImage, {
            x: pageWidth - sigDims.width - 50, // 50px margin from right
            y: 50, // 50px margin from bottom
            width: sigDims.width,
            height: sigDims.height,
          });
        }
      });
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
