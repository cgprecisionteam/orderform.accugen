import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { generateRequestId } from './requestId';

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
  const requestId = await generateRequestId();

  // Upload files to Firebase Storage
  const uploadedFiles: OrderFile[] = [];
  for (const file of payload.files) {
    const storageRef = ref(storage, `orders/${requestId}/files/${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    uploadedFiles.push({ url, name: file.name, size: file.size });
  }

  // Save order document to Firestore
  await addDoc(collection(db, 'orders'), {
    requestId,
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
    status: 'NEW',
    createdAt: serverTimestamp(),
  });

  return requestId;
}
