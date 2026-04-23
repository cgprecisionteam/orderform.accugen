import { uploadFiles } from './uploadthing-client';
import {
  Material, ZirconiaTier,
  PRODUCT_TYPES, resolveProductName, getRestorationCategory,
} from './products';

export type { Material, ZirconiaTier };

export interface Restoration {
  id: string;
  // Location
  toothNumbers: number[];
  arch: 'Upper' | 'Lower' | 'Both' | '';
  // Product
  productType: string;
  material: Material | '';
  zirconiaTier: ZirconiaTier | '';
  variant: string;
  siteCount: string;
  // Implant details
  implantSystem: string;
  implantPlatform: string;
  // Common
  shade: string;
}

export interface UploadedFile {
  url: string;
  name: string;
  size: number;
}

export interface OrderPayload {
  clinicName: string;
  email: string;
  contactName: string;
  contactNumber: string;
  patientName: string;
  restorations: Restoration[];
  generalInstructions: string;
  deliveryDate: string;
  isRush: boolean;
  requireTryIn: boolean;
  dataType: 'scan' | 'pickup';
  files: File[];
}

function buildApiItem(r: Restoration) {
  const productName = resolveProductName(r.productType, r.material, r.zirconiaTier, r.variant, r.siteCount);
  const category    = getRestorationCategory(r.productType);
  const pt          = PRODUCT_TYPES.find(p => p.label === r.productType);
  const unitType    = pt?.unitType ?? 'per_tooth';

  const implantNotes = [
    r.implantSystem   ? `System: ${r.implantSystem}` : '',
    r.implantPlatform ? `Platform: ${r.implantPlatform}` : '',
  ].filter(Boolean).join(' | ');

  return {
    category,
    product: productName,
    productType: r.productType,
    material: r.material,
    zirconiaTier: r.zirconiaTier,
    variant: r.variant,
    siteCount: r.siteCount,
    qty: r.arch === 'Both' ? 2 : 1,
    unitType,
    toothNumbers: r.toothNumbers,
    arch: r.arch,
    shade: r.shade,
    implantNotes,
  };
}

export async function submitOrder(
  payload: OrderPayload,
  onUploaded?: () => void,
): Promise<string> {
  // Step 1 — Upload files
  let uploadedFiles: UploadedFile[] = [];
  if (payload.files.length > 0) {
    const results = await uploadFiles('orderFiles', { files: payload.files });
    uploadedFiles = results.map(r => ({ url: r.ufsUrl, name: r.name, size: r.size }));
  }

  onUploaded?.();

  // Step 2 — POST to API
  const response = await fetch('/api/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clinicName:          payload.clinicName,
      email:               payload.email,
      contactName:         payload.contactName,
      contactNumber:       payload.contactNumber,
      patientName:         payload.patientName,
      items:               payload.restorations.map(buildApiItem),
      generalInstructions: payload.generalInstructions,
      deliveryDate:        payload.deliveryDate,
      isRush:              payload.isRush,
      requireTryIn:        payload.requireTryIn,
      dataType:            payload.dataType,
      files:               uploadedFiles,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Order submission failed: ${text}`);
  }

  const json = (await response.json()) as { success: boolean; requestId: string };
  return json.requestId;
}
