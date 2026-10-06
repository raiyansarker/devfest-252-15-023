import { GoogleGenerativeAI } from '@google/generative-ai';
import type { TenderRequirement, UploadedFile } from '../types/tender';
import { getPdfFirstPageText } from './pdfUtils';

export async function aiAutoMatchFiles(
  apiKey: string,
  requirements: TenderRequirement[],
  uploadedFiles: UploadedFile[]
): Promise<Map<string, string>> {
  if (!apiKey) throw new Error('API Key is missing');

  const validFiles = uploadedFiles.filter(f => !f.isDuplicate);
  
  // Extract first page content for better context
  const filesWithContent = await Promise.all(
    validFiles.map(async (f) => {
      try {
        const buffer = await f.file.arrayBuffer();
        const text = await getPdfFirstPageText(buffer);
        // Collapse whitespace
        const cleanText = text.replace(/\s+/g, ' ').trim();
        return { id: f.id, name: f.name, content: cleanText };
      } catch (e) {
        return { id: f.id, name: f.name, content: '' };
      }
    })
  );

  const genAI = new GoogleGenerativeAI(apiKey);
  // Using flash for fast JSON extraction
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: "application/json",
    }
  });

  const prompt = `
You are an expert procurement assistant. Match the uploaded files to the tender requirements based on file names, titles, and the extracted text from the first page of each file.

Requirements:
${requirements.map(r => `{"id": "${r.id}", "title": "${r.title_en} / ${r.title_bn}"}`).join(',\n')}

Uploaded Files:
${filesWithContent.map(f => `{"id": "${f.id}", "name": "${f.name}", "firstPageContent": "${f.content.replace(/(["\\])/g, '\\$1')}"}`).join(',\n')}

Return a valid JSON object mapping requirement IDs to file IDs. Example:
{
  "req-1": "file-1",
  "req-2": "file-3"
}
Only map confident matches.
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanText) as Record<string, string>;
    
    const matches = new Map<string, string>();
    for (const [reqId, fileId] of Object.entries(parsed)) {
      if (typeof fileId === 'string' && requirements.some(r => r.id === reqId) && uploadedFiles.some(f => f.id === fileId)) {
        matches.set(reqId, fileId);
      }
    }
    return matches;
  } catch (error) {
    console.error('AI Auto-Match Failed:', error);
    throw error;
  }
}
