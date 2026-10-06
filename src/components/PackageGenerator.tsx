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
    <div className="bg-white rounded-lg shadow p-6 border-t-4 border-blue-600">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">{t('generate')}</h2>
          {hasBlockingIssues ? (
            <div className="text-sm text-red-600">
              <p className="font-medium mb-1">{t('blockingIssues')}:</p>
              <ul className="list-disc list-inside space-y-1">
                {blockingIssues.map(({ req }) => (
                  <li key={req.id}>{req.title_en}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-green-600 font-medium">
              Ready to generate package
            </p>
          )}
        </div>

        <button
          onClick={handleGenerate}
          disabled={hasBlockingIssues || isGenerating}
          className={`px-8 py-3 rounded-lg font-medium text-white shadow-sm transition-all ${
            hasBlockingIssues || isGenerating
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md active:transform active:scale-95 cursor-pointer'
          }`}
        >
          {isGenerating ? 'Generating...' : t('generate')}
        </button>
      </div>
    </div>
  );
}
