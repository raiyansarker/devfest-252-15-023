import { useCallback } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { useTender, useTenderDispatch } from '../store/TenderContext';
import type { TenderData } from '../types/tender';

export function TenderLoader() {
  const { t } = useI18n();
  const dispatch = useTenderDispatch();

  const handleFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data: TenderData = JSON.parse(text);
        // Sort requirements by order
        data.requirements.sort((a, b) => a.order - b.order);
        dispatch({ type: 'LOAD_TENDER', payload: data });
      } catch {
        alert('Invalid requirements.json file');
      }
    },
    [dispatch]
  );

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
      <label className="cursor-pointer inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
        {t('loadRequirements')}
        <input
          type="file"
          accept=".json"
          onChange={handleFile}
          className="hidden"
        />
      </label>
    </div>
  );
}

export function TenderInfo() {
  const { t, lang } = useI18n();
  const { tenderData } = useTender();

  if (!tenderData) return null;

  const { tender, requirements } = tenderData;

  return (
    <div className="space-y-6">
      {/* Tender details card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">{t('tenderDetails')}</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <dt className="font-medium text-gray-600">{t('tenderId')}</dt>
          <dd>{tender.tender_id}</dd>
          <dt className="font-medium text-gray-600">{t('tenderTitle')}</dt>
          <dd>{tender.title}</dd>
          <dt className="font-medium text-gray-600">{t('procuringEntity')}</dt>
          <dd>{tender.procuring_entity}</dd>
          <dt className="font-medium text-gray-600">{t('bidder')}</dt>
          <dd>{tender.bidder}</dd>
          <dt className="font-medium text-gray-600">{t('submissionDeadline')}</dt>
          <dd>{tender.submission_deadline}</dd>
        </dl>
      </div>

      {/* Requirements list */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">{t('requirements')}</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-600">
              <th className="pb-2 pr-4">{t('order')}</th>
              <th className="pb-2 pr-4">ID</th>
              <th className="pb-2 pr-4">{t('tenderTitle')}</th>
              <th className="pb-2">{t('status')}</th>
            </tr>
          </thead>
          <tbody>
            {requirements.map((req) => (
              <tr key={req.id} className="border-b last:border-0">
                <td className="py-2 pr-4">{req.order}</td>
                <td className="py-2 pr-4 font-mono">{req.id}</td>
                <td className="py-2 pr-4">
                  {lang === 'bn' ? req.title_bn : req.title_en}
                </td>
                <td className="py-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      req.mandatory
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {req.mandatory ? t('mandatory') : t('optional')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
