'use client';

import { useState, useEffect, useRef } from 'react';
import ToothSelector from './ToothSelector';
import FileUpload from './FileUpload';
import SearchableSelect from './SearchableSelect';
import {
  PRODUCT_TYPES, ProductTypeConfig,
  Material, ZirconiaTier,
} from '@/lib/products';
import { submitOrder, Restoration } from '@/lib/submitOrder';
import { cn } from '@/lib/utils';

/* ── Constants ── */

const ALL_TIERS: ZirconiaTier[] = ['Economy', 'Economy Plus', 'Premium', 'Premium Plus'];
const ALL_PRODUCT_LABELS = PRODUCT_TYPES.map(p => p.label);

const MATERIAL_DISPLAY: Partial<Record<Material, string>> = {
  'Lithium Disilicate': 'Lithium Disilicate (e.max)',
};
const DISPLAY_TO_MATERIAL: Record<string, Material> = {
  'Lithium Disilicate (e.max)': 'Lithium Disilicate',
};

/* ── Helpers ── */

function defaultDeliveryDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function newRestoration(): Restoration {
  return {
    id: Math.random().toString(36).slice(2),
    toothNumbers: [], arch: '',
    productType: '', material: '', zirconiaTier: '', variant: '', siteCount: '',
    implantSystem: '', implantPlatform: '',
    shade: '',
  };
}

function getSubLabel(r: Restoration): string {
  const loc = r.arch
    ? `${r.arch} Arch`
    : r.toothNumbers.length === 1 ? `Tooth ${r.toothNumbers[0]}`
    : r.toothNumbers.length > 1
      ? `Teeth ${r.toothNumbers.slice(0, 3).join(', ')}${r.toothNumbers.length > 3 ? '…' : ''}`
      : '';
  const prod = r.productType
    ? r.material ? `${r.material} ${r.productType}` : r.productType
    : '';
  if (loc && prod) return `${loc} – ${prod}`;
  return loc || prod;
}

/* ── Form types ── */

interface FormFields {
  clinicName: string;
  email: string;
  contactName: string;
  contactNumber: string;
  patientName: string;
  generalInstructions: string;
  deliveryDate: string;
  isRush: boolean;
  requireTryIn: boolean;
  dataType: 'scan' | 'pickup';
}

const INITIAL_FORM: FormFields = {
  clinicName: '',
  email: '',
  contactName: '',
  contactNumber: '',
  patientName: '',
  generalInstructions: '',
  deliveryDate: defaultDeliveryDate(),
  isRush: false,
  requireTryIn: false,
  dataType: 'scan',
};

type Stage = 'idle' | 'uploading' | 'submitting' | 'done' | 'error';
type FormErrors = Partial<Record<keyof FormFields, string>>;

interface RestError {
  productType?: string;
  zirconiaTier?: string;
  variant?: string;
  siteCount?: string;
}

interface OrderFormProps {
  onStatusChange?: (stage: string, summary?: string) => void;
}

/* ── Component ── */

export default function OrderForm({ onStatusChange }: OrderFormProps) {
  const [form, setForm] = useState<FormFields>(INITIAL_FORM);
  const [restorations, setRestorations] = useState<Restoration[]>([newRestoration()]);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [restErrors, setRestErrors] = useState<RestError[]>([{}]);
  const [stage, setStage] = useState<Stage>('idle');
  const [successId, setSuccessId] = useState('');
  const lastCardRef = useRef<HTMLDivElement>(null);

  const setField = <K extends keyof FormFields>(k: K, v: FormFields[K]) => {
    setForm(prev => ({ ...prev, [k]: v }));
    setErrors(prev => ({ ...prev, [k]: '' }));
  };

  /* ── Restoration handlers ── */

  const addRestoration = () => {
    setRestorations(prev => [...prev, newRestoration()]);
    setRestErrors(prev => [...prev, {}]);
    setTimeout(() => lastCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  const removeRestoration = (index: number) => {
    if (restorations.length === 1) return;
    setRestorations(prev => prev.filter((_, i) => i !== index));
    setRestErrors(prev => prev.filter((_, i) => i !== index));
  };

  const updateRestoration = (index: number, updates: Partial<Restoration>) => {
    setRestorations(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
    const clearedKeys = Object.keys(updates) as Array<keyof RestError>;
    setRestErrors(prev => {
      const next = [...prev];
      const cleared = { ...next[index] };
      clearedKeys.forEach(k => { if (k in cleared) delete (cleared as Record<string, unknown>)[k]; });
      next[index] = cleared;
      return next;
    });
  };

  /* ── Validation ── */

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.clinicName.trim()) e.clinicName = 'Clinic name is required.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!isValidEmail(form.email)) e.email = 'Enter a valid email address.';
    if (!form.patientName.trim()) e.patientName = 'Patient name is required.';
    if (!form.deliveryDate) e.deliveryDate = 'Select a delivery date.';
    setErrors(e);

    const re: RestError[] = restorations.map(r => {
      const err: RestError = {};
      if (!r.productType) { err.productType = 'Select a restoration type.'; return err; }
      const pt = PRODUCT_TYPES.find(p => p.label === r.productType);
      if (pt?.siteCounts && !r.siteCount) err.siteCount = 'Select implant site count.';
      if (pt?.variants && !r.variant) err.variant = 'Select a sub-type.';
      if (!pt?.noMaterial && r.material === 'Zirconia' && !r.zirconiaTier) err.zirconiaTier = 'Select a Zirconia tier.';
      return err;
    });
    setRestErrors(re);

    return Object.keys(e).length === 0 && re.every(err => Object.keys(err).length === 0);
  };

  /* ── Submit ── */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setStage(files.length > 0 ? 'uploading' : 'submitting');
      const requestId = await submitOrder(
        { ...form, restorations, files },
        () => setStage('submitting'),
      );
      setSuccessId(requestId);
      setStage('done');
      setForm(INITIAL_FORM);
      setRestorations([newRestoration()]);
      setFiles([]);
    } catch (err) {
      console.error(err);
      setStage('error');
    }
  };

  /* ── Status sync (must be above early returns) ── */

  const firstType = restorations[0]?.productType;
  const summary = form.patientName
    ? `${form.patientName}${firstType ? ` · ${firstType}` : ''}${restorations.length > 1 ? ` +${restorations.length - 1} more` : ''}`
    : undefined;

  useEffect(() => {
    onStatusChange?.(stage, summary);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, form.patientName, firstType, restorations.length]);

  /* ── Success screen ── */

  if (stage === 'done' && successId) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center shadow-sm">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Order Submitted</h2>
        <p className="text-gray-400 text-sm mb-5">Your request ID</p>
        <div className="inline-block bg-blue-50 border border-blue-200 rounded-xl px-6 py-3 text-blue-700 font-mono text-xl font-bold tracking-widest mb-6">
          {successId}
        </div>
        <p className="text-gray-400 text-sm mb-8">A confirmation email has been sent to your clinic.</p>
        <button
          onClick={() => { setStage('idle'); setSuccessId(''); }}
          className="bg-blue-600 text-white px-7 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          Submit Another Order
        </button>
      </div>
    );
  }

  /* ── Form ── */

  return (
    <form id="order-form" onSubmit={handleSubmit} noValidate>
      <div className="space-y-5">

        {stage === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-sm text-red-700">
            Submission failed. Please check your connection and try again.
          </div>
        )}

        {/* ── Clinic Details ── */}
        <Card title="Clinic Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Clinic Name" required error={errors.clinicName}>
              <input type="text" value={form.clinicName} onChange={e => setField('clinicName', e.target.value)}
                className={inp(!!errors.clinicName)} placeholder="e.g. Smile Dental Centre" />
            </Field>
            <Field label="Email" required error={errors.email}>
              <input type="email" value={form.email} onChange={e => setField('email', e.target.value)}
                className={inp(!!errors.email)} placeholder="clinic@example.com" />
            </Field>
            <Field label="Contact Name">
              <input type="text" value={form.contactName} onChange={e => setField('contactName', e.target.value)}
                className={inp(false)} placeholder="Optional" />
            </Field>
            <Field label="Contact Number">
              <input type="tel" value={form.contactNumber} onChange={e => setField('contactNumber', e.target.value)}
                className={inp(false)} placeholder="Optional" />
            </Field>
          </div>
        </Card>

        {/* ── Case Details ── */}
        <Card title="Case Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Patient Name" required error={errors.patientName}>
              <input type="text" value={form.patientName} onChange={e => setField('patientName', e.target.value)}
                className={inp(!!errors.patientName)} placeholder="Patient full name" />
            </Field>
          </div>
        </Card>

        {/* ── Restorations ── */}
        <div className="space-y-4">
          {restorations.map((r, index) => (
            <RestorationCard
              key={r.id}
              containerRef={index === restorations.length - 1 ? lastCardRef : undefined}
              restoration={r}
              index={index}
              errors={restErrors[index] ?? {}}
              showRemove={restorations.length > 1}
              onUpdate={updates => updateRestoration(index, updates)}
              onRemove={() => removeRestoration(index)}
            />
          ))}

          <button
            type="button"
            onClick={addRestoration}
            className="w-full py-3 border-2 border-dashed border-blue-200 rounded-2xl text-sm font-medium text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            + Add Another Restoration
          </button>
        </div>

        {/* ── Data Input ── */}
        <Card title="Data Input">
          <div className="flex gap-2 mb-4">
            {(['scan', 'pickup'] as const).map(dt => (
              <button
                key={dt}
                type="button"
                onClick={() => { setField('dataType', dt); if (dt === 'pickup') setFiles([]); }}
                className={cn(
                  'px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
                  form.dataType === dt
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400',
                )}
              >
                {dt === 'scan' ? 'Digital Scan' : 'Request Impression Pickup'}
              </button>
            ))}
          </div>
          {form.dataType === 'scan' && (
            <>
              <p className="text-xs text-gray-400 mb-3">Attach Intraoral Scan and patient intraoral pics for shade matching</p>
              <FileUpload files={files} onChange={setFiles} />
            </>
          )}
        </Card>

        {/* ── Notes ── */}
        <Card title="Notes">
          <Field label="General Instructions">
            <textarea
              value={form.generalInstructions}
              onChange={e => setField('generalInstructions', e.target.value)}
              className={`${inp(false)} resize-none`}
              rows={3}
              placeholder="Any additional instructions or special requests…"
            />
          </Field>
        </Card>

        {/* ── Delivery ── */}
        <Card title="Delivery">
          <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-end">
            <Field label="Required By" required error={errors.deliveryDate}>
              <input type="date" value={form.deliveryDate} min={todayStr()}
                onChange={e => setField('deliveryDate', e.target.value)}
                className={`${inp(!!errors.deliveryDate)} w-48`} />
            </Field>
            <div className="flex items-center gap-3 pb-0.5">
              <button
                type="button" role="switch" aria-checked={form.isRush}
                onClick={() => setField('isRush', !form.isRush)}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
                  form.isRush ? 'bg-orange-500' : 'bg-gray-200',
                )}
              >
                <span className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                  form.isRush ? 'translate-x-6' : 'translate-x-1',
                )} />
              </button>
              <span className="text-sm font-medium text-gray-700">
                Rush Order
                {form.isRush && <span className="ml-1.5 text-orange-600 text-xs font-semibold bg-orange-50 px-1.5 py-0.5 rounded">(RUSH)</span>}
              </span>
            </div>
            <div className="flex items-center gap-3 pb-0.5">
              <button
                type="button" role="switch" aria-checked={form.requireTryIn}
                onClick={() => setField('requireTryIn', !form.requireTryIn)}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
                  form.requireTryIn ? 'bg-blue-600' : 'bg-gray-200',
                )}
              >
                <span className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                  form.requireTryIn ? 'translate-x-6' : 'translate-x-1',
                )} />
              </button>
              <span className="text-sm font-medium text-gray-700">
                Require Try-in
                {form.requireTryIn && <span className="ml-1.5 text-blue-600 text-xs font-semibold bg-blue-50 px-1.5 py-0.5 rounded">(Try-in)</span>}
              </span>
            </div>
          </div>
        </Card>

        <div className="h-4" />
      </div>
    </form>
  );
}

/* ── Restoration Card ── */

interface RestorationCardProps {
  restoration: Restoration;
  index: number;
  errors: RestError;
  showRemove: boolean;
  onUpdate: (updates: Partial<Restoration>) => void;
  onRemove: () => void;
  containerRef?: React.RefObject<HTMLDivElement>;
}

function RestorationCard({
  restoration: r, index, errors, showRemove, onUpdate, onRemove, containerRef,
}: RestorationCardProps) {
  const pt: ProductTypeConfig | undefined = PRODUCT_TYPES.find(p => p.label === r.productType);
  const isFullArch = pt?.unitType === 'per_arch';
  const tiers = pt?.availableTiers ?? ALL_TIERS;
  const subLabel = getSubLabel(r);

  const materialOptions = (pt?.availableMaterials ?? []).map(m => MATERIAL_DISPLAY[m] ?? m);
  const materialValue   = r.material ? (MATERIAL_DISPLAY[r.material as Material] ?? r.material) : '';

  const selectProductType = (label: string) => {
    const newPt = PRODUCT_TYPES.find(p => p.label === label);
    const switchesToArch = newPt?.unitType === 'per_arch';
    const currentIsArch  = pt?.unitType === 'per_arch';
    onUpdate({
      productType:  label,
      material:     '',
      zirconiaTier: '',
      variant:      '',
      siteCount:    '',
      ...(switchesToArch && !currentIsArch ? { toothNumbers: [] } : {}),
      ...(!switchesToArch && currentIsArch ? { arch: '' } : {}),
    });
  };

  return (
    <div
      ref={containerRef}
      className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-visible"
    >
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-gray-50/60 rounded-t-2xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-sm font-semibold text-gray-700 tracking-wide uppercase shrink-0">
            Restoration {index + 1}
          </h2>
          {subLabel && (
            <span className="text-sm text-gray-400 truncate">{subLabel}</span>
          )}
        </div>
        {showRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors shrink-0"
          >
            Remove
          </button>
        )}
      </div>

      <div className="px-4 sm:px-6 py-5 space-y-5">

        {/* 1. Tooth / Arch selector */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            {isFullArch ? 'Arch' : 'Tooth Selection'}
          </p>
          {isFullArch ? (
            <div className="flex gap-3 flex-wrap">
              {(['Upper', 'Lower', 'Both'] as const).map(a => (
                <button
                  key={a}
                  type="button"
                  onClick={() => onUpdate({ arch: a })}
                  className={cn(
                    'px-5 py-2 rounded-lg border text-sm font-medium transition-colors touch-manipulation',
                    r.arch === a
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400',
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          ) : (
            <ToothSelector
              selected={r.toothNumbers}
              onChange={v => onUpdate({ toothNumbers: v })}
            />
          )}
        </div>

        {/* 2. Product dropdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Product" required error={errors.productType}>
            <SearchableSelect
              options={ALL_PRODUCT_LABELS}
              value={r.productType}
              onChange={selectProductType}
              placeholder="Select product…"
              hasError={!!errors.productType}
            />
          </Field>

          {/* 3. Material dropdown */}
          {r.productType && !pt?.noMaterial && materialOptions.length > 0 && (
            <Field label="Material">
              <SearchableSelect
                options={materialOptions}
                value={materialValue}
                onChange={v => {
                  const mat = (DISPLAY_TO_MATERIAL[v] ?? v) as Material;
                  onUpdate({ material: mat, zirconiaTier: '' });
                }}
                placeholder="Select material…"
              />
            </Field>
          )}
        </div>

        {/* 4. Sub-type dropdown (variants or site counts) */}
        {r.productType && pt?.variants && (
          <Field label="Sub-type" required error={errors.variant}>
            <SearchableSelect
              options={pt.variants}
              value={r.variant}
              onChange={v => onUpdate({ variant: v })}
              placeholder="Select sub-type…"
              hasError={!!errors.variant}
            />
          </Field>
        )}

        {r.productType && pt?.siteCounts && (
          <Field label="Implant Sites" required error={errors.siteCount}>
            <SearchableSelect
              options={pt.siteCounts}
              value={r.siteCount}
              onChange={s => onUpdate({ siteCount: s })}
              placeholder="Select implant site count…"
              hasError={!!errors.siteCount}
            />
          </Field>
        )}

        {/* 5. Zirconia Tier dropdown */}
        {r.material === 'Zirconia' && (
          <Field label="Zirconia Tier" required error={errors.zirconiaTier}>
            <SearchableSelect
              options={tiers}
              value={r.zirconiaTier}
              onChange={t => onUpdate({ zirconiaTier: t as ZirconiaTier })}
              placeholder="Select tier…"
              hasError={!!errors.zirconiaTier}
            />
          </Field>
        )}

        {/* 6. Implant details */}
        {r.productType && pt?.isImplant && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Implant Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={r.implantSystem}
                onChange={e => onUpdate({ implantSystem: e.target.value })}
                className={inp(false)}
                placeholder="Implant System"
              />
              <input
                type="text"
                value={r.implantPlatform}
                onChange={e => onUpdate({ implantPlatform: e.target.value })}
                className={inp(false)}
                placeholder="Platform / Size"
              />
            </div>
          </div>
        )}

        {/* 7. Shade */}
        {r.productType && !pt?.noMaterial && (
          <Field label="Shade">
            <input
              type="text"
              value={r.shade}
              onChange={e => onUpdate({ shade: e.target.value })}
              className={inp(false)}
              placeholder="e.g. A2, B1 (optional)"
            />
          </Field>
        )}



      </div>
    </div>
  );
}

/* ── Shared UI helpers ── */

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
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
    hasError ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 hover:border-gray-400',
  );
}
