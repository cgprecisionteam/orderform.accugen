'use client';

import { useState } from 'react';

interface ToothSelectorProps {
  selected: number[];
  onChange: (teeth: number[]) => void;
  isBridge: boolean;
  onBridgeChange: (v: boolean) => void;
}

// FDI layout rows
const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11]; // UR — right to left visually
const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];  // UL — left to right visually
const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];  // LL — left to right visually
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41]; // LR — right to left visually

const ALL_TEETH = [...UPPER_RIGHT, ...UPPER_LEFT, ...LOWER_LEFT, ...LOWER_RIGHT];

function ToothButton({
  number,
  selected,
  onClick,
}: {
  number: number;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-8 h-8 text-xs font-medium rounded border transition-colors
        ${selected
          ? 'bg-blue-600 border-blue-600 text-white'
          : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:bg-blue-50'
        }
      `}
      title={`Tooth ${number}`}
    >
      {number}
    </button>
  );
}

export default function ToothSelector({ selected, onChange, isBridge, onBridgeChange }: ToothSelectorProps) {
  const toggle = (n: number) => {
    if (selected.includes(n)) {
      onChange(selected.filter((t) => t !== n));
    } else {
      onChange([...selected, n]);
    }
  };

  const selectAll = () => onChange([...ALL_TEETH]);
  const clearAll = () => onChange([]);

  return (
    <div className="space-y-3">
      {/* Upper arch */}
      <div>
        <p className="text-xs text-gray-400 mb-1 text-center">Upper</p>
        <div className="flex justify-center gap-1">
          {UPPER_RIGHT.map((n) => (
            <ToothButton key={n} number={n} selected={selected.includes(n)} onClick={() => toggle(n)} />
          ))}
          <div className="w-px bg-gray-200 mx-1" />
          {UPPER_LEFT.map((n) => (
            <ToothButton key={n} number={n} selected={selected.includes(n)} onClick={() => toggle(n)} />
          ))}
        </div>
      </div>

      {/* Lower arch */}
      <div>
        <div className="flex justify-center gap-1">
          {LOWER_RIGHT.map((n) => (
            <ToothButton key={n} number={n} selected={selected.includes(n)} onClick={() => toggle(n)} />
          ))}
          <div className="w-px bg-gray-200 mx-1" />
          {LOWER_LEFT.map((n) => (
            <ToothButton key={n} number={n} selected={selected.includes(n)} onClick={() => toggle(n)} />
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1 text-center">Lower</p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <button
          type="button"
          onClick={selectAll}
          className="text-xs text-blue-600 hover:underline"
        >
          Select All
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="text-xs text-gray-500 hover:underline"
        >
          Clear
        </button>
        {selected.length > 0 && (
          <span className="text-xs text-gray-500">
            {selected.length} tooth{selected.length !== 1 ? 'e' : ''}s selected
          </span>
        )}

        <label className="flex items-center gap-2 ml-auto cursor-pointer">
          <input
            type="checkbox"
            checked={isBridge}
            onChange={(e) => onBridgeChange(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Mark as Bridge</span>
        </label>
      </div>
    </div>
  );
}
