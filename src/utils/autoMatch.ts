import type { TenderRequirement, UploadedFile } from '../types/tender';

/**
 * Auto-match uploaded files to requirements by fuzzy filename matching.
 * Returns a map of requirementId -> fileId for suggested matches.
 * Only suggests non-duplicate files. Each file and requirement matched at most once.
 */
export function autoMatchFiles(
  requirements: TenderRequirement[],
  files: UploadedFile[]
): Map<string, string> {
  const result = new Map<string, string>();
  const usedFiles = new Set<string>();
  const usedReqs = new Set<string>();

  const scores: { reqId: string; fileId: string; score: number }[] = [];

  for (const req of requirements) {
    // Extract keywords from both English and Bangla titles
    const reqKeywordsEn = extractKeywords(req.title_en);
    const reqKeywordsBn = extractKeywords(req.title_bn);
    const reqKeywords = [...new Set([...reqKeywordsEn, ...reqKeywordsBn])];
    
    for (const file of files) {
      if (file.isDuplicate) continue;

      const fileKeywords = extractKeywords(
        file.name.replace(/\.pdf$/i, '').replace(/[_\-()]/g, ' ')
      );

      let score = 0;
      let matchedReqKeywords = new Set<string>();

      for (const reqKw of reqKeywords) {
        for (const fileKw of fileKeywords) {
          if (reqKw === fileKw) {
            score += 15; // Exact match is best
            matchedReqKeywords.add(reqKw);
          } else {
            // Use Levenshtein distance for typos (e.g., "lisence" vs "license")
            const dist = levenshtein(reqKw, fileKw);
            const maxLength = Math.max(reqKw.length, fileKw.length);
            
            // Allow 1 typo for every 4 characters
            if (dist > 0 && dist <= Math.floor(maxLength / 4)) {
              score += 10 - dist; 
              matchedReqKeywords.add(reqKw);
            } else if (fileKw.includes(reqKw) || reqKw.includes(fileKw)) {
              // Substring match
              const overlap = Math.min(reqKw.length, fileKw.length);
              if (overlap >= 4) {
                score += overlap;
                matchedReqKeywords.add(reqKw);
              }
            }
          }
        }
      }

      // Massive bonus if all English keywords are found (strongest indicator)
      if (reqKeywordsEn.length > 0 && reqKeywordsEn.every(kw => matchedReqKeywords.has(kw))) {
        score += 30;
      }

      if (score > 0) {
        scores.push({ reqId: req.id, fileId: file.id, score });
      }
    }
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  // Assign greedily
  for (const match of scores) {
    if (!usedReqs.has(match.reqId) && !usedFiles.has(match.fileId)) {
      if (match.score >= 5) {
        result.set(match.reqId, match.fileId);
        usedReqs.add(match.reqId);
        usedFiles.add(match.fileId);
      }
    }
  }

  return result;
}

function extractKeywords(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .split(/[\s'0-9]+/)
    .filter((w) => w.length >= 3)
    .filter((w) => !['the', 'and', 'for', 'of', 'certificate', 'statement', 'proposal'].includes(w));
}

// Basic Levenshtein distance for typo tolerance
function levenshtein(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () => 
    new Array(b.length + 1).fill(0)
  );

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[a.length][b.length];
}
