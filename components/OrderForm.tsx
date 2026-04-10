'use client';

import { useState, useEffect, useRef } from 'react';
import ToothSelector from './ToothSelector';
import FileUpload from './FileUpload';
import SearchableSelect from './SearchableSelect';
import { CATEGORIES, getProductNamesByCategory, getUnitType, isImplantProduct } from '@/lib/products';
import { submitOrder, OrderItem } from '@/lib/submitOrder';
import { cn } from '@/lib/utils';

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

const INITIAL_ITEM: OrderItem = {
  category: '',
  product: '',
  qty: 1,
  unitType: 'per_tooth',
  toothNumbers: [],
  arch: '',
  shade: '',
  implantNotes: '',
};

interface FormFields {
  clinicName: string;
  email: string;
  contactName: string;
  contactNumber: string;
  patientName: string;
  generalInstructions: string;
  deliveryDate: string;
  isRush: boolean;
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
};

type Stage = 'idle' | 'uploading' | 'submitting' | 'done' | 'error';

type FormErrors = Partial<Record<keyof FormFields | 'files', string>>;
type ItemErrors = Partial<Record<'category' | 'product', string>>;

interface OrderFormProps {
  onStatusChange?: (stage: string, summary?: string) => void;
}

/* ── Component ── */

export default function OrderForm({ onStatusChange }: OrderFormProps) {
  const [form, setForm] = useState<FormFields>(INITIAL_FORM);
  const [items, setItems] = useState<OrderItem[]>([{ ...INITIAL_ITEM }]);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [itemErrors, setItemErrors] = useState<ItemErrors[]>([{}]);
  const [stage, setStage] = useState<Stage>('idle');
  const [successId, setSuccessId] = useState('');
  const lastItemRef = useRef<HTMLDivElement>(null);

  const busy = stage === 'uploading' || stage === 'submitting';

  const setField = <K extends keyof FormFields>(k: K, v: FormFields[K]) => {
    setForm(prev => ({ ...prev, [k]: v }));
    setErrors(prev => ({ ...prev, [k]: '' }));
  };

  /* ── Item handlers ── */

  const addItem = () => {
    setItems(prev => [...prev, { ...INITIAL_ITEM }]);
    setItemErrors(prev => [...prev, {}]);
    // scroll to new item after paint
    setTimeout(() => lastItemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
    setItemErrors(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, updates: Partial<OrderItem>) => {
    setItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
    // Clear field-level errors touched by this update
    const clearedKeys = Object.keys(updates) as Array<keyof ItemErrors>;
    setItemErrors(prev => {
      const next = [...prev];
      const cleared = { ...next[index] };
      clearedKeys.forEach(k => { if (k in cleared) delete cleared[k]; });
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

    const ie: ItemErrors[] = items.map(item => {
      const err: ItemErrors = {};
      if (!item.category) err.category = 'Select a category.';
      if (!item.product) err.product = 'Select a product.';
      return err;
    });
    setItemErrors(ie);

    const itemsValid = ie.every(err => Object.keys(err).length === 0);
    return Object.keys(e).length === 0 && itemsValid;
  };

  /* ── Submit ── */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setStage(files.length > 0 ? 'uploading' : 'submitting');
      const requestId = await submitOrder(
        { ...form, items, files },
        () => setStage('submitting'),
      );
      setSuccessId(requestId);
      setStage('done');
      setForm(INITIAL_FORM);
      setItems([{ ...INITIAL_ITEM }]);
      setFiles([]);
    } catch (err) {
      console.error(err);
      setStage('error');
    }
  };

  /* ── Status sync (must be above early returns) ── */

  const firstProduct = items[0]?.product;
  const summary = form.patientName
    ? `${form.patientName}${firstProduct ? ` · ${firstProduct}` : ''}${items.length > 1 ? ` +${items.length - 1} more` : ''}${files.length > 0 ? ` · ${files.length} file${files.length > 1 ? 's' : ''}` : ''}`
    : undefined;

  useEffect(() => {
    onStatusChange?.(stage, summary);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, form.patientName, firstProduct, items.length, files.length]);

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

        {/* ── Items ── */}
        <div className="space-y-4">
          {items.map((item, index) => (
            <ItemCard
              key={index}
              containerRef={index === items.length - 1 ? lastItemRef : undefined}
              item={item}
              index={index}
              errors={itemErrors[index] ?? {}}
              showRemove={items.length > 1}
              onUpdate={updates => updateItem(index, updates)}
              onRemove={() => removeItem(index)}
            />
          ))}

          <button
            type="button"
            onClick={addItem}
            className="w-full py-3 border-2 border-dashed border-blue-200 rounded-2xl text-sm font-medium text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            + Add Another Item
          </button>
        </div>

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
          </div>
        </Card>

        {/* ── Files ── */}
        <Card title="Files">
          <FileUpload files={files} onChange={setFiles} error={errors.files} />
        </Card>

        <div className="h-4" />
      </div>
    </form>
  );
}

/* ── Item Card ── */

interface ItemCardProps {
  item: OrderItem;
  index: number;
  errors: ItemErrors;
  showRemove: boolean;
  onUpdate: (updates: Partial<OrderItem>) => void;
  onRemove: () => void;
  containerRef?: React.RefObject<HTMLDivElement>;
}

const ItemCard = function ItemCard({
  item, index, errors, showRemove, onUpdate, onRemove, containerRef,
}: ItemCardProps) {
  const products = item.category ? getProductNamesByCategory(item.category) : [];
  const unitType = getUnitType(item.product);
  const isImplant = isImplantProduct(item.product);

  return (
    <div
      ref={containerRef}
      className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-visible"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60 rounded-t-2xl flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700 tracking-wide uppercase">
          Item {index + 1}
        </h2>
        {showRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
          >
            Remove
          </button>
        )}
      </div>

      <div className="px-6 py-5 space-y-4">
        {/* Category + Product */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Category" required error={errors.category}>
            <SearchableSelect
              options={CATEGORIES}
              value={item.category}
              onChange={v => onUpdate({
                category: v, product: '', qty: 1, unitType: 'per_tooth',
                toothNumbers: [], arch: '',
              })}
              placeholder="Select category…"
              hasError={!!errors.category}
            />
          </Field>
          <Field label="Product" required error={errors.product}>
            <SearchableSelect
              options={products}
              value={item.product}
              onChange={v => onUpdate({
                product: v,
                unitType: getUnitType(v),
                qty: 1, toothNumbers: [], arch: '',
              })}
              placeholder={item.category ? 'Select product…' : 'Select category first…'}
              disabled={!item.category}
              hasError={!!errors.product}
            />
          </Field>
        </div>

        {/* Shade */}
        {item.product && (
          <Field label="Shade">
            <input
              type="text"
              value={item.shade}
              onChange={e => onUpdate({ shade: e.target.value })}
              className={inp(false)}
              placeholder="e.g. A2, B1 (optional)"
            />
          </Field>
        )}

        {/* Unit-type UI */}
        {item.product && unitType === 'per_tooth' && (
          <Field label="Tooth Numbers">
            <div className="mt-1 overflow-x-auto">
              <ToothSelector
                selected={item.toothNumbers}
                onChange={v => onUpdate({ toothNumbers: v })}
              />
            </div>
          </Field>
        )}

        {item.product && unitType === 'per_arch' && (
          <Field label="Arch">
            <div className="flex gap-3 flex-wrap">
              {(['Upper', 'Lower', 'Both'] as const).map(a => (
                <button
                  key={a}
                  type="button"
                  onClick={() => onUpdate({ arch: a, qty: a === 'Both' ? 2 : 1 })}
                  className={cn(
                    'px-5 py-2 rounded-lg border text-sm font-medium transition-colors',
                    item.arch === a
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400',
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
            {item.arch && (
              <p className="text-xs text-gray-400 mt-1">
                {item.arch} — {item.qty} {item.qty === 1 ? 'arch' : 'arches'}
              </p>
            )}
          </Field>
        )}

        {item.product && unitType === 'per_unit' && (
          <Field label="Quantity">
            <div className="flex items-center gap-3">
              <button type="button"
                onClick={() => onUpdate({ qty: Math.max(1, item.qty - 1) })}
                className="w-9 h-9 rounded-lg border border-gray-300 text-gray-600 text-lg font-medium hover:border-blue-400 hover:text-blue-600 transition-colors"
              >−</button>
              <span className="w-10 text-center text-sm font-semibold text-gray-900">{item.qty}</span>
              <button type="button"
                onClick={() => onUpdate({ qty: item.qty + 1 })}
                className="w-9 h-9 rounded-lg border border-gray-300 text-gray-600 text-lg font-medium hover:border-blue-400 hover:text-blue-600 transition-colors"
              >+</button>
              <span className="text-sm text-gray-400">units</span>
            </div>
          </Field>
        )}

        {/* Implant notes */}
        {item.product && isImplant && (
          <Field label="Implant Notes">
            <textarea
              value={item.implantNotes}
              onChange={e => onUpdate({ implantNotes: e.target.value })}
              className={`${inp(false)} resize-none`}
              rows={2}
              placeholder="Implant system, platform size, connection type…"
            />
          </Field>
        )}
      </div>
    </div>
  );
};

/* ── Shared UI helpers ── */

function Card({ title, children, allowOverflow }: { title: string; children: React.ReactNode; allowOverflow?: boolean }) {
  return (
    <div className={cn('bg-white border border-gray-200 rounded-2xl shadow-sm', allowOverflow ? 'overflow-visible' : 'overflow-hidden')}>
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60 rounded-t-2xl">
        <h2 className="text-sm font-semibold text-gray-700 tracking-wide uppercase">{title}</h2>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
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
