'use client';

import { useState, useEffect } from 'react';
import SearchableSelect from './SearchableSelect';
import { cn } from '@/lib/utils';

function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

const TIME_SLOTS = [
  '10:00 AM – 10:30 AM',
  '10:30 AM – 11:00 AM',
  '11:00 AM – 11:30 AM',
  '11:30 AM – 12:00 PM',
  '12:00 PM – 12:30 PM',
  '12:30 PM – 1:00 PM',
  '1:00 PM – 1:30 PM',
  '1:30 PM – 2:00 PM',
  '2:00 PM – 2:30 PM',
  '2:30 PM – 3:00 PM',
  '3:00 PM – 3:30 PM',
  '3:30 PM – 4:00 PM',
  '4:00 PM – 4:30 PM',
  '4:30 PM – 5:00 PM',
  '5:00 PM – 5:30 PM',
  '5:30 PM – 6:00 PM',
  '6:00 PM – 6:30 PM',
  '6:30 PM – 7:00 PM',
  '7:00 PM – 7:30 PM',
  '7:30 PM – 8:00 PM',
];

interface FormState {
  clinicName: string;
  clinicEmail: string;
  contactName: string;
  contactNumber: string;
  preferredDate: string;
  preferredTime: string;
}

const INITIAL: FormState = {
  clinicName: '',
  clinicEmail: '',
  contactName: '',
  contactNumber: '',
  preferredDate: '',
  preferredTime: '',
};

type Stage = 'idle' | 'submitting' | 'done' | 'error';

interface ScanRequestFormProps {
  onStatusChange?: (stage: string, summary?: string) => void;
}

export default function ScanRequestForm({ onStatusChange }: ScanRequestFormProps) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [stage, setStage] = useState<Stage>('idle');

  const set = <K extends keyof FormState>(k: K, v: string) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => ({ ...prev, [k]: '' }));
  };

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.clinicName.trim()) e.clinicName = 'Clinic name is required.';
    if (!form.clinicEmail.trim()) e.clinicEmail = 'Email is required.';
    else if (!isValidEmail(form.clinicEmail)) e.clinicEmail = 'Enter a valid email address.';
    if (!form.preferredDate) e.preferredDate = 'Select a preferred date.';
    if (!form.preferredTime) e.preferredTime = 'Select a preferred time.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStage('submitting');
    try {
      const res = await fetch('/api/scan-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      setStage('done');
      setForm(INITIAL);
    } catch (err) {
      console.error(err);
      setStage('error');
    }
  };

  // Must be above any early return so hook count is stable across all renders
  useEffect(() => {
    const summary = form.clinicName
      ? `${form.clinicName}${form.preferredDate ? ` · ${form.preferredDate}` : ''}`
      : undefined;
    onStatusChange?.(stage, summary);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, form.clinicName, form.preferredDate]);

  if (stage === 'done') {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center shadow-sm">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Scan Request Sent</h2>
        <p className="text-gray-400 text-sm mb-8">
          We have received your request. Our team will confirm your slot shortly.
        </p>
        <button
          onClick={() => setStage('idle')}
          className="bg-blue-600 text-white px-7 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <form id="scan-form" onSubmit={handleSubmit} noValidate>
      <div className="space-y-5">

        {stage === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-sm text-red-700">
            Submission failed. Please check your connection and try again.
          </div>
        )}

        {/* Clinic Details */}
        <Card title="Clinic Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Clinic Name" required error={errors.clinicName}>
              <input type="text" value={form.clinicName} onChange={(e) => set('clinicName', e.target.value)}
                className={inp(!!errors.clinicName)} placeholder="e.g. Smile Dental Centre" />
            </Field>
            <Field label="Clinic Email" required error={errors.clinicEmail}>
              <input type="email" value={form.clinicEmail} onChange={(e) => set('clinicEmail', e.target.value)}
                className={inp(!!errors.clinicEmail)} placeholder="clinic@example.com" />
            </Field>
            <Field label="Contact Name">
              <input type="text" value={form.contactName} onChange={(e) => set('contactName', e.target.value)}
                className={inp(false)} placeholder="Optional" />
            </Field>
            <Field label="Contact Number">
              <input type="tel" value={form.contactNumber} onChange={(e) => set('contactNumber', e.target.value)}
                className={inp(false)} placeholder="Optional" />
            </Field>
          </div>
        </Card>

        {/* Appointment */}
        <Card title="Preferred Appointment" allowOverflow>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Preferred Date" required error={errors.preferredDate}>
              <input type="date" value={form.preferredDate} min={todayStr()}
                onChange={(e) => set('preferredDate', e.target.value)}
                className={inp(!!errors.preferredDate)} />
            </Field>
            <Field label="Preferred Time" required error={errors.preferredTime}>
              <SearchableSelect
                options={TIME_SLOTS}
                value={form.preferredTime}
                onChange={(v) => set('preferredTime', v)}
                placeholder="Select a time slot…"
                hasError={!!errors.preferredTime}
              />
            </Field>
          </div>
        </Card>

        <div className="h-4" />
      </div>
    </form>
  );
}

function Card({ title, children, allowOverflow }: { title: string; children: React.ReactNode; allowOverflow?: boolean }) {
  return (
    <div className={cn('bg-white border border-gray-200 rounded-2xl shadow-sm', allowOverflow ? 'overflow-visible' : 'overflow-hidden')}>
      <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-gray-50/60 rounded-t-2xl">
        <h2 className="text-sm font-semibold text-gray-700 tracking-wide uppercase">{title}</h2>
      </div>
      <div className="px-4 sm:px-6 py-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function inp(hasError: boolean) {
  return cn(
    'w-full rounded-lg border px-3 py-2 text-sm text-gray-900 bg-white placeholder-gray-400',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 transition',
    hasError ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 hover:border-gray-400'
  );
}

