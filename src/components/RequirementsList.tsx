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
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">{t('requirements')}</h2>
        <div className="flex gap-2">
          {uploadedFiles.length > 0 && (
            <button
              onClick={() => dispatch({ type: 'AUTO_MATCH' })}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Auto-Match Files
            </button>
          )}
          <button
            onClick={() => exportChecklistCsv(tenderData, uploadedFiles, matches, lang, t as any)}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors cursor-pointer"
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
                <tr key={req.id} className="border-b last:border-0">
                  <td className="py-3 pr-3">{req.order}</td>
                  <td className="py-3 pr-3">
                    <div>
                      {lang === 'bn' ? req.title_bn : req.title_en}
                      <span
                        className={`ml-2 text-xs ${
                          req.mandatory ? 'text-red-500' : 'text-gray-400'
                        }`}
                      >
                        {req.mandatory ? '*' : `(${t('optional')})`}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 pr-3">
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
                        className="border rounded px-2 py-1 text-sm max-w-48"
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
                          className="text-xs text-red-500 hover:text-red-700 cursor-pointer"
                        >
                          {t('unmatch')}
                        </button>
                      )}
                    </div>
                  </td>
                  {signatureDataUrl && (
                    <td className="py-3 pr-3">
                      {matchedFile && (
                        <input
                          type="checkbox"
                          checked={match?.applySignature || false}
                          onChange={() =>
                            dispatch({ type: 'TOGGLE_SIGNATURE', payload: req.id })
                          }
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                      )}
                    </td>
                  )}
                  <td className="py-3 pr-3">
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
