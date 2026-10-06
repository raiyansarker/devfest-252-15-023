import { GoogleGenerativeAI } from '@google/generative-ai';
import type { TenderRequirement, UploadedFile } from '../types/tender';

export async function aiAutoMatchFiles(
  apiKey: string,
  requirements: TenderRequirement[],
  uploadedFiles: UploadedFile[]
): Promise<Map<string, string>> {
  if (!apiKey) throw new Error('API Key is missing');

  const genAI = new GoogleGenerativeAI(apiKey);
  // Using flash for fast JSON extraction
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: "application/json",
    }
  });

  const prompt = `
You are an expert procurement assistant. Match the uploaded files to the tender requirements based on file names and titles.

Requirements:
${requirements.map(r => `{"id": "${r.id}", "title": "${r.title_en} / ${r.title_bn}"}`).join(',\n')}

Uploaded Files:
${uploadedFiles.filter(f => !f.isDuplicate).map(f => `{"id": "${f.id}", "name": "${f.name}"}`).join(',\n')}

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
