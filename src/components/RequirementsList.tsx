import { useI18n } from '../i18n/I18nContext';
import { useTender, useTenderDispatch } from '../store/TenderContext';
import { computeStatus } from '../utils/statusEngine';
import { StatusBadge } from './StatusBadge';

import { exportChecklistCsv } from '../utils/csvExport';

export function RequirementsList() {
  const { t, lang } = useI18n();
  const { tenderData, uploadedFiles, matches, signatureDataUrl } = useTender();
  const dispatch = useTenderDispatch();

  if (!tenderData) return null;

  const { tender, requirements } = tenderData;

  // Files available for matching: not already matched elsewhere, not duplicate
  const matchedFileIds = new Set(
    matches.filter((m) => m.fileId).map((m) => m.fileId!)
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-zinc-900">{t('requirements')}</h2>
        <div className="flex gap-2">
          {uploadedFiles.length > 0 && (
            <button
              onClick={() => dispatch({ type: 'AUTO_MATCH' })}
              className="px-4 py-1.5 bg-zinc-100 text-zinc-800 rounded-full text-sm font-medium hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              Auto-Match Files
            </button>
          )}
          <button
            onClick={() => exportChecklistCsv(tenderData, uploadedFiles, matches, lang, t as any)}
            className="px-4 py-1.5 bg-zinc-900 text-white rounded-full text-sm font-medium hover:bg-zinc-800 transition-colors cursor-pointer shadow-sm"
          >
            Export CSV
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-600">
              <th className="pb-2 pr-3">#</th>
              <th className="pb-2 pr-3">{t('tenderTitle')}</th>
              <th className="pb-2 pr-3">{t('matchFile')}</th>
              {signatureDataUrl && <th className="pb-2 pr-3">Sign</th>}
              <th className="pb-2 pr-3">{t('expiryDate')}</th>
              <th className="pb-2">{t('status')}</th>
            </tr>
          </thead>
          <tbody>
            {requirements.map((req) => {
              const match = matches.find((m) => m.requirementId === req.id);
              const status = computeStatus(req, match, tender.submission_deadline);
              const matchedFile = match?.fileId
                ? uploadedFiles.find((f) => f.id === match.fileId)
                : null;

              // Available files: unmatched + current match (so it shows in dropdown)
              const availableFiles = uploadedFiles.filter(
                (f) => !f.isDuplicate && (!matchedFileIds.has(f.id) || f.id === match?.fileId)
              );

              return (
                <tr key={req.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50 transition-colors">
                  <td className="py-4 pr-3 text-zinc-500 font-medium">{req.order}</td>
                  <td className="py-4 pr-3 text-zinc-900">
                    <div>
                      {lang === 'bn' ? req.title_bn : req.title_en}
                      <span
                        className={`ml-2 text-xs font-medium ${
                          req.mandatory ? 'text-red-500' : 'text-zinc-400'
                        }`}
                      >
                        {req.mandatory ? '*' : `(${t('optional')})`}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 pr-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={match?.fileId ?? ''}
                        onChange={(e) => {
                          const fileId = e.target.value;
                          if (fileId) {
                            dispatch({
                              type: 'MATCH_FILE',
                              payload: { requirementId: req.id, fileId },
                            });
                          } else {
                            dispatch({ type: 'UNMATCH', payload: req.id });
                          }
                        }}
                        className="border border-zinc-200 rounded-lg px-3 py-1.5 text-sm max-w-48 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all"
                      >
                        <option value="">{t('selectFile')}</option>
                        {availableFiles.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({f.pageCount}p)
                          </option>
                        ))}
                      </select>
                      {matchedFile && (
                        <button
                          onClick={() =>
                            dispatch({ type: 'UNMATCH', payload: req.id })
                          }
                          className="text-xs font-medium text-red-500 hover:text-red-700 cursor-pointer transition-colors px-2 py-1 rounded-md hover:bg-red-50"
                        >
                          {t('unmatch')}
                        </button>
                      )}
                    </div>
                  </td>
                  {signatureDataUrl && (
                    <td className="py-4 pr-3">
                      {matchedFile && (
                        <input
                          type="checkbox"
                          checked={match?.applySignature || false}
                          onChange={() =>
                            dispatch({ type: 'TOGGLE_SIGNATURE', payload: req.id })
                          }
                          className="w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-zinc-900 focus:ring-offset-1 transition-all cursor-pointer"
                        />
                      )}
                    </td>
                  )}
                  <td className="py-4 pr-3">
                    {req.has_expiry && match?.fileId ? (
                      <input
                        type="date"
                        value={match.expiryDate ?? ''}
                        onChange={(e) =>
                          dispatch({
                            type: 'SET_EXPIRY',
                            payload: {
                              requirementId: req.id,
                              date: e.target.value,
                            },
                          })
                        }
                        className="border rounded px-2 py-1 text-sm"
                      />
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="py-3">
                    <StatusBadge status={status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
