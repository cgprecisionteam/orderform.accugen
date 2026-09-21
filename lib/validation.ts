import { PRODUCT_TYPES } from './products';

export const MAX_FILES = 20;
export const MAX_FILE_BYTES = 64 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 200 * 1024 * 1024;

// Use the lab's calendar day consistently in browsers and on the server.
export function labDate(daysAhead = 0): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const value = (type: string) => parts.find(p => p.type === type)!.value;
  const date = new Date(`${value('year')}-${value('month')}-${value('day')}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + daysAhead);
  return date.toISOString().slice(0, 10);
}

export function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value && value >= labDate();
}

export function locationError(item: { productType: string; arch?: string; toothNumbers?: number[] }): string | undefined {
  const product = PRODUCT_TYPES.find(p => p.label === item.productType);
  if (!product) return 'Select a valid product.';
  if (product.unitType === 'per_arch') {
    if (!['Upper', 'Lower', 'Both'].includes(item.arch ?? '')) return 'Select an arch.';
  } else if (product.unitType === 'per_tooth') {
    if (!Array.isArray(item.toothNumbers) || !item.toothNumbers.length || item.toothNumbers.some(n =>
      !Number.isInteger(n) || ![1, 2, 3, 4].includes(Math.floor(n / 10)) || n % 10 < 1 || n % 10 > 8
    )) return 'Select at least one valid tooth.';
  }
}

export function uploadError(files: readonly { size: number }[]): string | undefined {
  if (files.length > MAX_FILES) return `You can upload a maximum of ${MAX_FILES} files.`;
  if (files.some(f => !Number.isFinite(f.size) || f.size < 0 || f.size > MAX_FILE_BYTES)) return 'Each file must be no larger than 64 MB.';
  if (files.reduce((sum, f) => sum + f.size, 0) > MAX_TOTAL_BYTES) return 'Total upload size exceeds 200 MB limit.';
}
