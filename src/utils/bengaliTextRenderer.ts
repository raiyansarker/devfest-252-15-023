import { PDFDocument, PDFPage } from 'pdf-lib';

export async function drawBengaliText(
  pdfDoc: PDFDocument,
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  size: number,
  isBold: boolean = false
) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Use a higher scale for sharper text in the PDF
  const scale = 4;
  const scaledSize = size * scale;
  const fontStr = `${isBold ? 'bold ' : ''}${scaledSize}px "Noto Sans Bengali", sans-serif`;

  ctx.font = fontStr;
  const metrics = ctx.measureText(text);

  const width = Math.ceil(metrics.width);
  // actualBoundingBox isn't always perfectly tight, adding a little padding
  const ascent = Math.ceil(metrics.actualBoundingBoxAscent || scaledSize);
  const descent = Math.ceil(metrics.actualBoundingBoxDescent || scaledSize * 0.3);
  
  // Some browsers might return 0 for actualBoundingBox if text is empty or special chars
  const safeAscent = ascent > 0 ? ascent : scaledSize;
  const safeDescent = descent > 0 ? descent : scaledSize * 0.3;
  const height = safeAscent + safeDescent;

  // If width or height is 0, nothing to draw
  if (width <= 0 || height <= 0) return;

  canvas.width = width;
  // Pad the canvas height a bit to avoid clipping the bottom or top of tall letters
  canvas.height = height + 10; 

  // Must set font again after canvas resize
  ctx.font = fontStr;
  ctx.fillStyle = '#000000';
  ctx.textBaseline = 'alphabetic';
  
  // We draw the text so its baseline is at safeAscent
  ctx.fillText(text, 0, safeAscent);

  const dataUrl = canvas.toDataURL('image/png');
  const base64Data = dataUrl.split(',')[1];
  if (!base64Data) return;

  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const image = await pdfDoc.embedPng(bytes);

  // page.drawImage expects (x,y) at the bottom-left of the image.
  // The baseline is at `y` in PDF coordinates.
  // The image's baseline is `safeDescent / scale` above its bottom edge.
  page.drawImage(image, {
    x: x,
    y: y - (safeDescent / scale),
    width: canvas.width / scale,
    height: canvas.height / scale,
  });
}
