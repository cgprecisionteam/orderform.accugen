'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchableSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  disabled = false,
  hasError = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const select = (opt: string) => {
    onChange(opt);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={cn(
          'w-full flex items-center justify-between rounded-lg border px-3 py-2 text-sm text-left transition',
          'bg-white focus:outline-none focus:ring-2 focus:ring-blue-500',
          hasError ? 'border-red-400 focus:ring-red-400' : 'border-gray-300',
          disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:border-gray-400 cursor-pointer'
        )}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {value || placeholder}
        </span>
        <ChevronDown
          className={cn('w-4 h-4 text-gray-400 shrink-0 transition-transform', open && 'rotate-180')}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="flex-1 text-sm outline-none bg-transparent text-gray-900 placeholder-gray-400"
            />
          </div>

          {/* Options */}
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-400">No results</li>
            ) : (
              filtered.map((opt) => (
                <li
                  key={opt}
                  onClick={() => select(opt)}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 text-sm cursor-pointer transition-colors',
                    opt === value
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-800 hover:bg-gray-50'
                  )}
                >
                  {opt}
                  {opt === value && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
