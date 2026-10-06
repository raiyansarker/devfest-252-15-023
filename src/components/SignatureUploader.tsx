import { useCallback, useState } from 'react';
import { useTender, useTenderDispatch } from '../store/TenderContext';

export function SignatureUploader() {
  const { signatureDataUrl } = useTender();
  const dispatch = useTenderDispatch();
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (file.type !== 'image/png') {
      alert('Only PNG images are supported for signatures.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        dispatch({ type: 'SET_SIGNATURE', payload: e.target.result });
      }
    };
    reader.readAsDataURL(file);
  }, [dispatch]);

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
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 space-y-4 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-zinc-900">Seal or Signature</h2>
        {signatureDataUrl && (
          <button
            onClick={() => dispatch({ type: 'SET_SIGNATURE', payload: null })}
            className="text-red-500 hover:text-red-700 text-sm font-medium"
          >
            Clear Signature
          </button>
        )}
      </div>

      {!signatureDataUrl ? (
        <label
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-zinc-900 bg-zinc-100' : 'border-zinc-300 hover:border-zinc-900'
          }`}
        >
          <p className="text-zinc-500 font-medium">Click or drop a PNG signature image here</p>
          <input
            type="file"
            accept=".png,image/png"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            className="hidden"
          />
        </label>
      ) : (
        <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50 flex items-center justify-center h-full">
          <img
            src={signatureDataUrl}
            alt="Signature Preview"
            className="max-h-24 object-contain mix-blend-multiply"
          />
        </div>
      )}
    </div>
  );
}
