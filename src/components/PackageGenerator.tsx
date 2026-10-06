import { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { useTender } from '../store/TenderContext';
import { computeStatus } from '../utils/statusEngine';
import { isBlockingStatus } from '../types/tender';
import { generatePackage } from '../utils/pdfGenerator';

export function PackageGenerator() {
  const { t, lang } = useI18n();
  const { tenderData, matches, uploadedFiles, signatureDataUrl } = useTender();
  const [isGenerating, setIsGenerating] = useState(false);

  if (!tenderData) return null;

  const { tender, requirements } = tenderData;

  // Check for blocking statuses
  const blockingIssues = requirements
    .map((req) => {
      const match = matches.find((m) => m.requirementId === req.id);
      const status = computeStatus(req, match, tender.submission_deadline);
      if (isBlockingStatus(status)) {
        return { req, status };
      }
      return null;
    })
    .filter((issue): issue is NonNullable<typeof issue> => issue !== null);

  const hasBlockingIssues = blockingIssues.length > 0;

  const handleGenerate = async () => {
    if (hasBlockingIssues) return;
    setIsGenerating(true);
    
    try {
      await generatePackage(tenderData, uploadedFiles, matches, signatureDataUrl, lang);
    } catch (error) {
      console.error('Error generating package:', error);
      alert('Failed to generate package. See console for details.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-zinc-200/50 border border-zinc-200 p-10 flex flex-col items-center justify-center text-center">
      {hasBlockingIssues ? (
        <>
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-5 border border-red-100">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-2 tracking-tight">Package Incomplete</h2>
          <p className="text-zinc-500 mb-6 max-w-md">
            Please resolve the following missing or expired mandatory requirements before generating the final package.
          </p>
          <div className="w-full max-w-lg bg-red-50/50 border border-red-100 rounded-xl p-5 text-left mb-8 shadow-sm">
            <ul className="space-y-3">
              {blockingIssues.map(({ req }) => (
                <li key={req.id} className="flex items-start gap-3 text-red-800 text-sm font-medium">
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                  <span>{req.title_en}</span>
                </li>
              ))}
            </ul>
          </div>
          <button disabled className="px-8 py-3.5 bg-zinc-100 text-zinc-400 rounded-full font-bold text-base cursor-not-allowed w-full max-w-xs transition-colors">
            {t('generate')}
          </button>
        </>
      ) : (
        <>
          <div className="w-16 h-16 bg-zinc-950 text-white rounded-full flex items-center justify-center mb-5 shadow-sm">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-2 tracking-tight">Ready to Generate</h2>
          <p className="text-zinc-500 mb-8 max-w-md">
            All mandatory requirements are met. Your package is ready to be compiled into a single PDF document.
          </p>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-8 py-4 bg-zinc-950 text-white rounded-full font-bold text-lg hover:bg-zinc-800 active:scale-[0.98] transition-all w-full max-w-sm shadow-md flex justify-center items-center gap-3 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              t('generate')
            )}
          </button>
        </>
      )}
    </div>
  );
}
