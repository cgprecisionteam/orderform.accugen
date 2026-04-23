'use client';

interface ToothSelectorProps {
  selected: number[];
  onChange: (teeth: number[]) => void;
}

// FDI quadrants — display order matches visual mouth orientation
const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11]; // right → midline
const UPPER_LEFT  = [21, 22, 23, 24, 25, 26, 27, 28]; // midline → left
const LOWER_LEFT  = [31, 32, 33, 34, 35, 36, 37, 38];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];

const ALL_TEETH = [...UPPER_RIGHT, ...UPPER_LEFT, ...LOWER_LEFT, ...LOWER_RIGHT];

function ToothButton({ number, selected, onClick }: { number: number; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`Tooth ${number}`}
      className={[
        'w-8 h-8 sm:w-8 sm:h-8 text-[11px] font-semibold rounded-md border transition-colors touch-manipulation select-none',
        selected
          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
          : 'bg-white border-gray-300 text-gray-600 hover:border-blue-400 hover:bg-blue-50',
      ].join(' ')}
    >
      {number}
    </button>
  );
}

function QuadrantRow({ teeth, selected, onToggle }: { teeth: number[]; selected: number[]; onToggle: (n: number) => void }) {
  return (
    <div className="flex justify-center gap-[3px] sm:gap-1">
      {teeth.map(n => (
        <ToothButton key={n} number={n} selected={selected.includes(n)} onClick={() => onToggle(n)} />
      ))}
    </div>
  );
}

export default function ToothSelector({ selected, onChange }: ToothSelectorProps) {
  const toggle = (n: number) => {
    onChange(selected.includes(n) ? selected.filter(t => t !== n) : [...selected, n]);
  };

  return (
    <div className="space-y-2.5">

      {/* ── Upper arch ── */}
      <div className="space-y-1">
        <p className="text-[10px] font-semibold tracking-widest text-gray-400 text-center uppercase">Upper</p>

        {/* Mobile: two quadrant rows */}
        <div className="sm:hidden space-y-[3px]">
          <QuadrantRow teeth={UPPER_RIGHT} selected={selected} onToggle={toggle} />
          <div className="flex justify-center">
            <div className="w-3/4 border-t border-dashed border-gray-200" />
          </div>
          <QuadrantRow teeth={UPPER_LEFT} selected={selected} onToggle={toggle} />
        </div>

        {/* Desktop: single row with midline divider */}
        <div className="hidden sm:flex justify-center items-center gap-1">
          <QuadrantRow teeth={UPPER_RIGHT} selected={selected} onToggle={toggle} />
          <div className="w-px h-5 bg-gray-300 mx-0.5 shrink-0" />
          <QuadrantRow teeth={UPPER_LEFT} selected={selected} onToggle={toggle} />
        </div>
      </div>

      {/* ── Arch divider ── */}
      <div className="flex justify-center">
        <div className="w-2/3 border-t border-gray-200" />
      </div>

      {/* ── Lower arch ── */}
      <div className="space-y-1">
        {/* Mobile: two quadrant rows */}
        <div className="sm:hidden space-y-[3px]">
          <QuadrantRow teeth={LOWER_RIGHT} selected={selected} onToggle={toggle} />
          <div className="flex justify-center">
            <div className="w-3/4 border-t border-dashed border-gray-200" />
          </div>
          <QuadrantRow teeth={LOWER_LEFT} selected={selected} onToggle={toggle} />
        </div>

        {/* Desktop: single row with midline divider */}
        <div className="hidden sm:flex justify-center items-center gap-1">
          <QuadrantRow teeth={LOWER_RIGHT} selected={selected} onToggle={toggle} />
          <div className="w-px h-5 bg-gray-300 mx-0.5 shrink-0" />
          <QuadrantRow teeth={LOWER_LEFT} selected={selected} onToggle={toggle} />
        </div>

        <p className="text-[10px] font-semibold tracking-widest text-gray-400 text-center uppercase">Lower</p>
      </div>

      {/* ── Controls ── */}
      <div className="flex items-center gap-3 pt-0.5">
        <button
          type="button"
          onClick={() => onChange([...ALL_TEETH])}
          className="text-xs text-blue-600 hover:underline touch-manipulation"
        >
          Select All
        </button>
        <button
          type="button"
          onClick={() => onChange([])}
          className="text-xs text-gray-500 hover:underline touch-manipulation"
        >
          Clear
        </button>
        {selected.length > 0 && (
          <span className="text-xs text-gray-500 ml-auto">
            {selected.length} {selected.length === 1 ? 'tooth' : 'teeth'} selected
          </span>
        )}
      </div>
    </div>
  );
}
