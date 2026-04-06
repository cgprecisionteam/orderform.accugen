'use client';

import { useState } from 'react';
import ToothSelector from './ToothSelector';
import FileUpload from './FileUpload';
import { PRODUCT_CONFIG } from '@/config/products';
import { submitOrder } from '@/lib/submitOrder';

// Default delivery date = today + 1 business day
function defaultDeliveryDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

interface FormState {
  clinicName: string;
  email: string;
  contactName: string;
  contactNumber: string;
  patientName: string;
  category: string;
  product: string;
  toothNumbers: number[];
  isBridge: boolean;
  shade: string;
  implantNotes: string;
  generalInstructions: string;
  deliveryDate: string;
  isRush: boolean;
}

const INITIAL: FormState = {
  clinicName: '',
  email: '',
  contactName: '',
  contactNumber: '',
  patientName: '',
  category: '',
  product: '',
  toothNumbers: [],
  isBridge: false,
  shade: '',
  implantNotes: '',
  generalInstructions: '',
  deliveryDate: defaultDeliveryDate(),
  isRush: false,
};

function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export default function OrderForm() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'files', string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successId, setSuccessId] = useState('');

  const categories = Object.keys(PRODUCT_CONFIG);
  const products = form.category ? PRODUCT_CONFIG[form.category] : [];
  const isImplant = form.category === 'Implant';

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => ({ ...prev, [k]: '' }));
  };

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.clinicName.trim()) e.clinicName = 'Clinic name is required.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!isValidEmail(form.email)) e.email = 'Enter a valid email address.';
    if (!form.patientName.trim()) e.patientName = 'Patient name is required.';
    if (!form.category) e.category = 'Select a category.';
    if (!form.product) e.product = 'Select a product.';
    if (!form.deliveryDate) e.deliveryDate = 'Select a delivery date.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const requestId = await submitOrder({ ...form, files });
      setSuccessId(requestId);
      setForm(INITIAL);
      setFiles([]);
    } catch (err) {
      console.error(err);
      alert('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (successId) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Order Submitted</h2>
        <p className="text-gray-500 text-sm mb-4">Your request ID is</p>
        <div className="inline-block bg-blue-50 border border-blue-200 rounded-lg px-5 py-2 text-blue-700 font-mono text-lg font-bold tracking-wide mb-6">
          {successId}
        </div>
        <p className="text-gray-500 text-sm mb-6">A confirmation email has been sent to your clinic.</p>
        <button
          onClick={() => setSuccessId('')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Submit Another Order
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">

      {/* ── Section A: Clinic Details ── */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
          Clinic Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Clinic Name" required error={errors.clinicName}>
            <input
              type="text"
              value={form.clinicName}
              onChange={(e) => set('clinicName', e.target.value)}
              className={input(!!errors.clinicName)}
              placeholder="e.g. Smile Dental Centre"
            />
          </Field>

          <Field label="Email" required error={errors.email}>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              className={input(!!errors.email)}
              placeholder="clinic@example.com"
            />
          </Field>

          <Field label="Contact Name">
            <input
              type="text"
              value={form.contactName}
              onChange={(e) => set('contactName', e.target.value)}
              className={input(false)}
              placeholder="Optional"
            />
          </Field>

          <Field label="Contact Number">
            <input
              type="tel"
              value={form.contactNumber}
              onChange={(e) => set('contactNumber', e.target.value)}
              className={input(false)}
              placeholder="Optional"
            />
          </Field>
        </div>
      </section>

      {/* ── Section B: Case Details ── */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
          Case Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Patient Name" required error={errors.patientName}>
            <input
              type="text"
              value={form.patientName}
              onChange={(e) => set('patientName', e.target.value)}
              className={input(!!errors.patientName)}
              placeholder="Patient full name"
            />
          </Field>

          <Field label="Shade">
            <input
              type="text"
              value={form.shade}
              onChange={(e) => set('shade', e.target.value)}
              className={input(false)}
              placeholder="e.g. A2, B1"
            />
          </Field>

          <Field label="Category" required error={errors.category}>
            <select
              value={form.category}
              onChange={(e) => { set('category', e.target.value); set('product', ''); }}
              className={select(!!errors.category)}
            >
              <option value="">Select category…</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>

          <Field label="Product" required error={errors.product}>
            <select
              value={form.product}
              onChange={(e) => set('product', e.target.value)}
              className={select(!!errors.product)}
              disabled={!form.category}
            >
              <option value="">Select product…</option>
              {products.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* Tooth Selector */}
        <Field label="Tooth Numbers">
          <div className="mt-1 overflow-x-auto">
            <ToothSelector
              selected={form.toothNumbers}
              onChange={(v) => set('toothNumbers', v)}
              isBridge={form.isBridge}
              onBridgeChange={(v) => set('isBridge', v)}
            />
          </div>
        </Field>

        {/* Implant Notes — conditional */}
        {isImplant && (
          <Field label="Implant Notes">
            <textarea
              value={form.implantNotes}
              onChange={(e) => set('implantNotes', e.target.value)}
              className={`${input(false)} resize-none`}
              rows={3}
              placeholder="Implant system, platform size, connection type…"
            />
          </Field>
        )}

        <Field label="General Instructions">
          <textarea
            value={form.generalInstructions}
            onChange={(e) => set('generalInstructions', e.target.value)}
            className={`${input(false)} resize-none`}
            rows={3}
            placeholder="Any additional instructions or special requests…"
          />
        </Field>
      </section>

      {/* ── Section C: Delivery ── */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
          Delivery
        </h2>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <Field label="Required By" required error={errors.deliveryDate}>
            <input
              type="date"
              value={form.deliveryDate}
              min={todayStr()}
              onChange={(e) => set('deliveryDate', e.target.value)}
              className={`${input(!!errors.deliveryDate)} w-48`}
            />
          </Field>

          {/* Rush toggle */}
          <label className="flex items-center gap-3 cursor-pointer pb-1">
            <button
              type="button"
              role="switch"
              aria-checked={form.isRush}
              onClick={() => set('isRush', !form.isRush)}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none
                ${form.isRush ? 'bg-orange-500' : 'bg-gray-200'}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
                  ${form.isRush ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
            <span className="text-sm font-medium text-gray-700">
              Rush Order
              {form.isRush && <span className="ml-1 text-orange-600 text-xs font-semibold">(RUSH)</span>}
            </span>
          </label>
        </div>
      </section>

      {/* ── Section D: File Upload ── */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
          Files
        </h2>
        <FileUpload files={files} onChange={setFiles} error={errors.files} />
      </section>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {submitting ? 'Submitting…' : 'Submit Order'}
        </button>
      </div>
    </form>
  );
}

/* ── Helpers ── */

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function input(hasError: boolean) {
  return `w-full rounded-lg border px-3 py-2 text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
    hasError ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'
  }`;
}

function select(hasError: boolean) {
  return `w-full rounded-lg border px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
    hasError ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'
  }`;
}
