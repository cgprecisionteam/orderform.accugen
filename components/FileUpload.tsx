'use client';

import { useRef, useState } from 'react';

const ALLOWED_EXT = ['.stl', '.zip', '.jpg', '.jpeg', '.png', '.pdf'];
const ALLOWED_TYPES = [
  'image/png',
  'image/jpeg',
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'model/stl',
  'application/octet-stream', // .stl files often arrive as this
];
const MAX_FILE_BYTES = 64 * 1024 * 1024;   // must match uploadthing.ts maxFileSize
const MAX_TOTAL_BYTES = 200 * 1024 * 1024;

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileBadge(name: string): { label: string; color: string } {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'stl': return { label: '3D Model', color: 'bg-purple-100 text-purple-700' };
    case 'zip': return { label: 'Case Files', color: 'bg-yellow-100 text-yellow-700' };
    case 'pdf': return { label: 'PDF', color: 'bg-red-100 text-red-700' };
    case 'jpg':
    case 'jpeg':
    case 'png': return { label: 'Image', color: 'bg-blue-100 text-blue-700' };
    default:    return { label: ext?.toUpperCase() ?? 'File', color: 'bg-gray-100 text-gray-600' };
  }
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
      const typeOk = ALLOWED_TYPES.includes(file.type);
      const extOk = ALLOWED_EXT.includes(ext);

      if (!typeOk && !extOk) {
        setValidationError(`"${file.name}" is not allowed. Accepted: STL, ZIP, JPG, PNG, PDF.`);
        return;
      }
      if (file.size > MAX_FILE_BYTES) {
        setValidationError(`"${file.name}" exceeds 64 MB limit.`);
        return;
      }
      toAdd.push(file);
    }

    const merged = [...files, ...toAdd];
    if (merged.reduce((sum, f) => sum + f.size, 0) > MAX_TOTAL_BYTES) {
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
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
      >
        <p className="text-sm text-gray-600">
          Drag & drop files here, or <span className="text-blue-600 font-medium">browse</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">Upload Files (STL, ZIP, Images) — max 64 MB per file, 200 MB total</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".stl,.zip,.jpg,.jpeg,.png,.pdf"
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
          {files.map((file, i) => {
            const badge = fileBadge(file.name);
            return (
              <li
                key={`${file.name}-${i}`}
                className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${badge.color}`}>
                    {badge.label}
                  </span>
                  <span className="truncate text-gray-800">{file.name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <span className="text-gray-400 text-xs">{formatBytes(file.size)}</span>
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="text-gray-400 hover:text-red-500 transition-colors text-base leading-none"
                    aria-label="Remove file"
                  >
                    &times;
                  </button>
                </div>
              </li>
            );
          })}
          <li className="text-xs text-gray-400 text-right">
            Total: {formatBytes(totalSize)} / 200 MB
          </li>
        </ul>
      )}
    </div>
  );
}
