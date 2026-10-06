let pdfjsLib: typeof import('pdfjs-dist') | null = null;

async function getPdfjs() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.mjs',
      import.meta.url
    ).toString();
  }
  return pdfjsLib;
}

/** SHA-256 hex hash of an ArrayBuffer */
export async function hashFile(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Get page count from a PDF ArrayBuffer. Throws on bad/password-protected files. */
export async function getPdfPageCount(buffer: ArrayBuffer): Promise<number> {
  const pdfjs = await getPdfjs();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  const count = doc.numPages;
  doc.cleanup();
  return count;
}

/** Extract text from the first page of a PDF for AI analysis */
export async function getPdfFirstPageText(buffer: ArrayBuffer): Promise<string> {
  const pdfjs = await getPdfjs();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  try {
    const page = await doc.getPage(1);
    const content = await page.getTextContent();
    // @ts-ignore
    const text = content.items.map((item) => item.str).join(' ');
    page.cleanup();
    return text.substring(0, 3000); // Limit to 3000 chars to save tokens
  } catch (e) {
    console.error('Failed to extract PDF text', e);
    return '';
  } finally {
    doc.cleanup();
  }
}
