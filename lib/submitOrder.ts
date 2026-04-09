import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

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
  // Step 1 — Upload files to Storage using a temporary ID.
  // The Cloud Function will use the real requestId when saving.
  const tempId = `tmp-${Date.now()}`;
  const uploadedFiles: OrderFile[] = [];

  for (const file of payload.files) {
    const storageRef = ref(storage, `orders/${tempId}/files/${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    uploadedFiles.push({ url, name: file.name, size: file.size });
  }

  // Step 2 — POST to Cloud Function with form data + uploaded file metadata.
  const functionUrl = process.env.NEXT_PUBLIC_CREATE_ORDER_URL;
  if (!functionUrl) throw new Error('NEXT_PUBLIC_CREATE_ORDER_URL is not set');

  const response = await fetch(functionUrl, {
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
