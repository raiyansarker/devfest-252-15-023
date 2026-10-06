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
    <div className="bg-white rounded-lg shadow p-6 space-y-4 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Seal or Signature</h2>
        {signatureDataUrl && (
          <button
            onClick={() => dispatch({ type: 'SET_SIGNATURE', payload: null })}
            className="text-red-500 hover:text-red-700 text-sm"
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
          className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
          }`}
        >
          <p className="text-gray-500">Click or drop a PNG signature image here</p>
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
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex items-center justify-center">
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
