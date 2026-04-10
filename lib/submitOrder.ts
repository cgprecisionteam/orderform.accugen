import { uploadFiles } from './uploadthing-client';
import { UnitType } from './products';

export interface OrderItem {
  category: string;
  product: string;
  qty: number;
  unitType: UnitType;
  toothNumbers: number[];
  arch: string;
  shade: string;
  implantNotes: string;
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
  items: OrderItem[];
  generalInstructions: string;
  deliveryDate: string;
  isRush: boolean;
  files: File[];
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
      clinicName: payload.clinicName,
      email: payload.email,
      contactName: payload.contactName,
      contactNumber: payload.contactNumber,
      patientName: payload.patientName,
      items: payload.items,
      generalInstructions: payload.generalInstructions,
      deliveryDate: payload.deliveryDate,
      isRush: payload.isRush,
      files: uploadedFiles,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Order submission failed: ${text}`);
  }

  const json = (await response.json()) as { success: boolean; requestId: string };
  return json.requestId;
}
