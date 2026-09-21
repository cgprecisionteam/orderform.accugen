'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubmitBarProps {
  label: string;
  stage: string;
  formId: string;
  uploadingLabel?: string;
  submittingLabel?: string;
  summary?: string;
  placement?: 'fixed' | 'inline';
}

export default function SubmitBar({
  label,
  stage,
  formId,
  uploadingLabel = 'Uploading files…',
  submittingLabel = 'Submitting…',
  summary,
  placement = 'fixed',
}: SubmitBarProps) {
  const busy = stage === 'uploading' || stage === 'submitting';
  const buttonText =
    stage === 'uploading' ? uploadingLabel :
    stage === 'submitting' ? submittingLabel :
    label;

  if (stage === 'done') return null;

  return (
    // Keep the fixed version at the page root. The inline version provides a
    // scrollable submit action when browser UI obscures the viewport footer.
    <div
      style={placement === 'fixed' ? {
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      } : undefined}
      className={cn(
        'bg-white border-gray-200',
        placement === 'fixed'
          ? 'border-t shadow-[0_-2px_12px_rgba(0,0,0,0.06)]'
          : 'border rounded-2xl shadow-sm',
      )}
    >
      {/* Progress bar — only while uploading / submitting */}
      {busy && (
        <div className="px-4 sm:px-6 pt-3 pb-1 max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-blue-700">
              {stage === 'uploading' ? 'Uploading files…' : 'Submitting…'}
            </span>
            <span className="text-xs text-blue-400">Please wait</span>
          </div>
          <div className="w-full bg-blue-100 rounded-full h-1.5">
            <div
              className={cn(
                'h-1.5 rounded-full bg-blue-500 transition-all duration-700',
                stage === 'uploading' ? 'w-1/2' : 'w-full',
              )}
            />
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 min-h-16 py-3 flex items-center justify-between gap-4">
        {/* Left — context hint */}
        <p className="text-sm text-gray-400 truncate hidden sm:block">
          {summary || 'Fill in the form above to submit'}
        </p>

        {/* Right — submit button */}
        <button
          type="submit"
          form={formId}
          disabled={busy}
          className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          {buttonText}
        </button>
      </div>
    </div>
  );
}
