import { useCallback, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { useTender, useTenderDispatch } from '../store/TenderContext';
import type { TenderData } from '../types/tender';

export function TenderLoader() {
  const { t } = useI18n();
  const dispatch = useTenderDispatch();
  const [dragOver, setDragOver] = useState(false);

  const processFile = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        const data: TenderData = JSON.parse(text);
        data.requirements.sort((a, b) => a.order - b.order);
        dispatch({ type: 'LOAD_TENDER', payload: data });
      } catch {
        alert('Invalid requirements.json file');
      }
    },
    [dispatch]
  );

  const handleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file && (file.type === 'application/json' || file.name.endsWith('.json'))) {
        processFile(file);
      } else {
        alert('Please drop a valid .json file');
      }
    },
    [processFile]
  );

  return (
    <label
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`border-2 border-dashed rounded-2xl p-16 text-center flex flex-col items-center justify-center cursor-pointer transition-colors ${
        dragOver ? 'border-black bg-zinc-100' : 'border-zinc-300 hover:border-black'
      }`}
    >
      <div className="inline-block px-8 py-2.5 bg-black text-white rounded-full font-medium hover:bg-zinc-800 transition-colors pointer-events-none shadow-sm">
        {t('loadRequirements')}
      </div>
      <p className="mt-4 text-zinc-500 pointer-events-none font-medium">Or drag and drop requirements.json here</p>
      <input
        type="file"
        accept=".json"
        onChange={handleFile}
        className="hidden"
      />
    </label>
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
      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
        <h2 className="text-xl font-bold tracking-tight mb-6">{t('tenderDetails')}</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
          <dt className="font-semibold text-zinc-500">{t('tenderId')}</dt>
          <dd className="font-medium">{tender.tender_id}</dd>
          <dt className="font-semibold text-zinc-500">{t('tenderTitle')}</dt>
          <dd className="font-medium">{tender.title}</dd>
          <dt className="font-semibold text-zinc-500">{t('procuringEntity')}</dt>
          <dd className="font-medium">{tender.procuring_entity}</dd>
          <dt className="font-semibold text-zinc-500">{t('bidder')}</dt>
          <dd className="font-medium">{tender.bidder}</dd>
          <dt className="font-semibold text-zinc-500">{t('submissionDeadline')}</dt>
          <dd className="font-medium">{tender.submission_deadline}</dd>
        </dl>
      </div>

      {/* Requirements list */}
      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
        <h2 className="text-xl font-bold tracking-tight mb-6">{t('requirements')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-zinc-500">
                <th className="pb-3 pr-4 font-semibold">{t('order')}</th>
                <th className="pb-3 pr-4 font-semibold">ID</th>
                <th className="pb-3 pr-4 font-semibold">{t('tenderTitle')}</th>
                <th className="pb-3 font-semibold">{t('status')}</th>
              </tr>
            </thead>
            <tbody>
              {requirements.map((req) => (
                <tr key={req.id} className="border-b border-zinc-100 last:border-0">
                  <td className="py-4 pr-4 text-zinc-500">{req.order}</td>
                  <td className="py-4 pr-4 font-mono text-zinc-500">{req.id}</td>
                  <td className="py-4 pr-4 font-medium">
                    {lang === 'bn' ? req.title_bn : req.title_en}
                  </td>
                  <td className="py-4">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        req.mandatory
                          ? 'bg-zinc-900 text-white'
                          : 'bg-zinc-100 text-zinc-600'
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
    </div>
  );
}
