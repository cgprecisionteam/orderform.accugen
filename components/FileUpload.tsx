'use client';

import { useRef, useState } from 'react';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'application/zip', 'application/x-zip-compressed'];
const ALLOWED_EXT = ['.png', '.jpg', '.jpeg', '.zip'];
const MAX_FILE_BYTES = 100 * 1024 * 1024;   // 100 MB
const MAX_TOTAL_BYTES = 200 * 1024 * 1024;  // 200 MB

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FileUploadProps {
  files: File[];
  onChange: (files: File[]) => void;
  error?: string;
}

export default function FileUpload({ files, onChange, error }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState('');

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    setValidationError('');

    const toAdd: File[] = [];
    for (const file of Array.from(incoming)) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_EXT.includes(ext) && !ALLOWED_TYPES.includes(file.type)) {
        setValidationError(`"${file.name}" is not allowed. Accepted: PNG, JPG, ZIP.`);
        return;
      }
      if (file.size > MAX_FILE_BYTES) {
        setValidationError(`"${file.name}" exceeds 100 MB limit.`);
        return;
      }
      toAdd.push(file);
    }

    const merged = [...files, ...toAdd];
    const newTotal = merged.reduce((sum, f) => sum + f.size, 0);
    if (newTotal > MAX_TOTAL_BYTES) {
      setValidationError('Total upload size exceeds 200 MB limit.');
      return;
    }
    onChange(merged);
  };

  const remove = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
    setValidationError('');
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}
        `}
      >
        <p className="text-sm text-gray-600">
          Drag & drop files here, or <span className="text-blue-600 font-medium">browse</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">PNG, JPG, ZIP — max 100 MB per file, 200 MB total</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".png,.jpg,.jpeg,.zip"
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {/* Validation error */}
      {(validationError || error) && (
        <p className="text-sm text-red-600">{validationError || error}</p>
      )}

      {/* File list */}
      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center justify-between bg-gray-50 rounded px-3 py-2 text-sm"
            >
              <span className="truncate max-w-xs text-gray-800">{file.name}</span>
              <div className="flex items-center gap-3 shrink-0 ml-2">
                <span className="text-gray-400 text-xs">{formatBytes(file.size)}</span>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Remove file"
                >
                  &times;
                </button>
              </div>
            </li>
          ))}
          <li className="text-xs text-gray-400 text-right">
            Total: {formatBytes(totalSize)} / 200 MB
          </li>
        </ul>
      )}
    </div>
  );
}
