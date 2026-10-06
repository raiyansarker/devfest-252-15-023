import fileSaver from 'file-saver';
const { saveAs } = fileSaver;
import type { TenderData, UploadedFile, RequirementMatch } from '../types/tender';
import { computeStatus } from './statusEngine';

export function exportChecklistCsv(
  tenderData: TenderData,
  uploadedFiles: UploadedFile[],
  matches: RequirementMatch[],
  lang: 'en' | 'bn',
  translateStatus: (status: string) => string
) {
  const { tender, requirements } = tenderData;

  // CSV Headers
  const headers = ['Order', 'Document', 'File Name', 'Pages', 'Expiry Date', 'Status'];
  const rows = [headers];

  for (const req of requirements) {
    const match = matches.find((m) => m.requirementId === req.id);
    const file = match?.fileId ? uploadedFiles.find((f) => f.id === match.fileId) : null;
    const status = computeStatus(req, match, tender.submission_deadline);

    const docName = lang === 'bn' ? req.title_bn : req.title_en;
    const fileName = file ? file.name : 'None';
    const pages = file ? file.pageCount.toString() : '0';
    const expiry = match?.expiryDate || 'N/A';
    
    // Convert status to readable text using the provided translation function
    const statusKeyMap: Record<string, string> = {
      missing: 'missing',
      expiry_date_needed: 'expiryDateNeeded',
      expired: 'expired',
      not_provided: 'notProvided',
      ok: 'ok',
    };
    const readableStatus = translateStatus(statusKeyMap[status]);

    rows.push([
      req.order.toString(),
      docName,
      fileName,
      pages,
      expiry,
      readableStatus
    ]);
  }

  // Escape CSV fields
  const csvContent = rows
    .map((row) =>
      row
        .map((field) => {
          if (field.includes(',') || field.includes('"') || field.includes('\n')) {
            return `"${field.replace(/"/g, '""')}"`;
          }
          return field;
        })
        .join(',')
    )
    .join('\n');

  // Add BOM for Excel UTF-8 support
  const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
  const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, `${tender.tender_id}_Checklist.csv`);
}
