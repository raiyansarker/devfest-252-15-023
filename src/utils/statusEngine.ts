import {
  type RequirementStatus,
  type TenderRequirement,
  type RequirementMatch,
} from '../types/tender';

/**
 * Compute status for a single requirement per Section 5 rules.
 */
export function computeStatus(
  req: TenderRequirement,
  match: RequirementMatch | undefined,
  submissionDeadline: string
): RequirementStatus {
  const fileMatched = match?.fileId != null;

  if (!fileMatched) {
    return req.mandatory ? 'missing' : 'not_provided';
  }

  if (req.has_expiry) {
    if (!match.expiryDate) {
      return 'expiry_date_needed';
    }
    // Expired if expiry date is strictly before submission deadline
    // Same day = OK
    if (match.expiryDate < submissionDeadline) {
      return 'expired';
    }
  }

  return 'ok';
}
