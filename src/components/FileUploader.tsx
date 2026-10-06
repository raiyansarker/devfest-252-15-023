import { useCallback, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { useTender, useTenderDispatch } from '../store/TenderContext';
import { hashFile, getPdfPageCount } from '../utils/pdfUtils';
import type { UploadedFile } from '../types/tender';

export function FileUploader() {
  const { t } = useI18n();
  const { tenderData } = useTender();
  const dispatch = useTenderDispatch();

  const handleFiles = useCallback(
    async (filesArray: File[]) => {
      const newFiles: UploadedFile[] = [];
      const errors: string[] = [];

      for (const file of filesArray) {
        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
          errors.push(`"${file.name}" ${t('notPdf')}`);
          continue;
        }

        try {
          const buffer = await file.arrayBuffer();
          const [hash, pageCount] = await Promise.all([
            hashFile(buffer),
            getPdfPageCount(buffer),
          ]);

          newFiles.push({
            id: crypto.randomUUID(),
            file,
            name: file.name,
            pageCount,
            hash,
            isDuplicate: false, // reducer recalculates
          });
        } catch {
          errors.push(`"${file.name}" — could not read (damaged or password-protected)`);
        }
      }

      if (errors.length > 0) {
        alert(errors.join('\n'));
      }
      if (newFiles.length > 0) {
        dispatch({ type: 'ADD_FILES', payload: newFiles });
      }
    },
    [dispatch, t]
  );

  const getFilesFromEntry = async (entry: any): Promise<File[]> => {
    if (entry.isFile) {
      return new Promise((resolve) => {
        entry.file((file: File) => resolve([file]));
      });
    } else if (entry.isDirectory) {
      const dirReader = entry.createReader();
      return new Promise((resolve) => {
        dirReader.readEntries(async (entries: any[]) => {
          let files: File[] = [];
          for (const e of entries) {
            files = files.concat(await getFilesFromEntry(e));
          }
          resolve(files);
        });
      });
    }
    return [];
  };

  if (!tenderData) return null;

  const [dragOver, setDragOver] = useState(false);

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
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);

      if (e.dataTransfer.items) {
        let allDroppedFiles: File[] = [];
        for (let i = 0; i < e.dataTransfer.items.length; i++) {
          const item = e.dataTransfer.items[i];
          if (item.kind === 'file') {
            const entry = item.webkitGetAsEntry();
            if (entry) {
              const files = await getFilesFromEntry(entry);
              allDroppedFiles = allDroppedFiles.concat(files);
            }
          }
        }
        if (allDroppedFiles.length > 0) {
          handleFiles(allDroppedFiles);
        }
      } else if (e.dataTransfer.files.length > 0) {
        handleFiles(Array.from(e.dataTransfer.files));
      }
    },
    [handleFiles]
  );

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <h2 className="text-lg font-semibold">{t('uploadFiles')}</h2>

      <label
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`block border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400'
        }`}
      >
        <p className={dragOver ? 'text-blue-600' : 'text-gray-500'}>
          {t('dropOrClick')}
        </p>
        <input
          type="file"
          accept=".pdf"
          multiple
          onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
          className="hidden"
        />
      </label>

      <UploadedFilesList />
    </div>
  );
}

function UploadedFilesList() {
  const { t } = useI18n();
  const { uploadedFiles } = useTender();
  const dispatch = useTenderDispatch();

  if (uploadedFiles.length === 0) return null;

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-gray-600">
          <th className="pb-2 pr-4">{t('fileName')}</th>
          <th className="pb-2 pr-4">{t('pages')}</th>
          <th className="pb-2">{t('actions')}</th>
        </tr>
      </thead>
      <tbody>
        {uploadedFiles.map((f) => (
          <tr key={f.id} className="border-b last:border-0">
            <td className="py-2 pr-4 flex items-center gap-2">
              {f.name}
              {f.isDuplicate && (
                <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                  {t('duplicate')}
                </span>
              )}
            </td>
            <td className="py-2 pr-4">{f.pageCount}</td>
            <td className="py-2">
              <button
                onClick={() => dispatch({ type: 'REMOVE_FILE', payload: f.id })}
                className="text-red-600 hover:text-red-800 text-xs cursor-pointer"
              >
                {t('remove')}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
