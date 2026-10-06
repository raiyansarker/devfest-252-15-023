/** Shape of requirements.json */
export interface TenderRequirement {
  id: string;
  order: number;
  title_en: string;
  title_bn: string;
  mandatory: boolean;
  has_expiry: boolean;
}

export interface TenderInfo {
  tender_id: string;
  title: string;
  procuring_entity: string;
  bidder: string;
  submission_deadline: string; // YYYY-MM-DD
}

export interface TenderData {
  tender: TenderInfo;
  requirements: TenderRequirement[];
}

/** Runtime state for an uploaded file */
export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  pageCount: number;
  hash: string; // SHA-256 hex for duplicate detection
  isDuplicate: boolean;
}

/** A match between a requirement and an uploaded file */
export interface RequirementMatch {
  requirementId: string;
  fileId: string | null;
  expiryDate: string | null; // YYYY-MM-DD, only when has_expiry
  applySignature?: boolean; // Deprecated
  signaturePages?: string; // e.g. "1, 3", "all", "last"
}

/** Status per Section 5 of the problem */
export type RequirementStatus =
  | 'missing'
  | 'expiry_date_needed'
  | 'expired'
  | 'not_provided'
  | 'ok';

export function isBlockingStatus(status: RequirementStatus): boolean {
  return status === 'missing' || status === 'expiry_date_needed' || status === 'expired';
}
