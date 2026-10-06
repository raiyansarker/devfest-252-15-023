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
    <div
      className={`rounded-2xl shadow-sm p-8 transition-colors duration-300 border ${
        hasBlockingIssues
          ? 'bg-red-50/50 border-red-200'
          : 'bg-zinc-950 border-zinc-900 text-white'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-1">
          <h2 className={`text-2xl font-bold mb-2 tracking-tight ${hasBlockingIssues ? 'text-red-900' : 'text-white'}`}>
            {t('generate')}
          </h2>
          {hasBlockingIssues ? (
            <div className="text-sm text-red-800 bg-red-100/50 p-4 rounded-xl mt-3 border border-red-200/50">
              <p className="font-semibold mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {t('blockingIssues')}:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-1 text-red-700">
                {blockingIssues.map(({ req }) => (
                  <li key={req.id}>{req.title_en}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-zinc-400 font-medium text-lg">
              All requirements met. Ready to compile your final PDF package.
            </p>
          )}
        </div>

        <div className="flex-shrink-0">
          <button
            onClick={handleGenerate}
            disabled={hasBlockingIssues || isGenerating}
            className={`px-8 py-3.5 rounded-full font-bold text-base shadow-sm transition-all flex items-center justify-center gap-2 border ${
              hasBlockingIssues || isGenerating
                ? 'bg-red-50 text-red-400 border-red-200 cursor-not-allowed shadow-none'
                : 'bg-white text-zinc-900 border-transparent hover:bg-zinc-200 active:scale-[0.98] cursor-pointer'
            }`}
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {t('generate')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
