import { uploadFiles } from './uploadthing-client';

export interface OrderFile {
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
  category: string;
  product: string;
  toothNumbers: number[];
  isBridge: boolean;
  shade: string;
  implantNotes: string;
  generalInstructions: string;
  deliveryDate: string;
  isRush: boolean;
  files: File[];
}

export async function submitOrder(payload: OrderPayload): Promise<string> {
  // Step 1 — Upload files to UploadThing CDN
  let uploadedFiles: OrderFile[] = [];

  if (payload.files.length > 0) {
    const results = await uploadFiles('orderFiles', { files: payload.files });
    uploadedFiles = results.map((r) => ({
      url: r.url,
      name: r.name,
      size: r.size,
    }));
  }

  // Step 2 — POST order data + file URLs to Next.js API route
  const response = await fetch('/api/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clinicName: payload.clinicName,
      email: payload.email,
      contactName: payload.contactName,
      contactNumber: payload.contactNumber,
      patientName: payload.patientName,
      category: payload.category,
      product: payload.product,
      toothNumbers: payload.toothNumbers,
      isBridge: payload.isBridge,
      shade: payload.shade,
      implantNotes: payload.implantNotes,
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
