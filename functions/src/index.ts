import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { generateRequestId } from './requestId';
import { sendEmails, OrderEmailData } from './email';

admin.initializeApp();

export const createOrder = onRequest({ secrets: ['RESEND_API_KEY'], cors: true }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  const body = req.body as {
    clinicName: string;
    email: string;
    contactName?: string;
    contactNumber?: string;
    patientName: string;
    category: string;
    product: string;
    toothNumbers: number[];
    isBridge: boolean;
    shade?: string;
    implantNotes?: string;
    generalInstructions?: string;
    deliveryDate: string;
    isRush: boolean;
    files: Array<{ url: string; name: string; size: number }>;
  };

  const requestId = await generateRequestId();

  const order = {
    ...body,
    requestId,
    status: 'NEW',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await admin.firestore().collection('orders').doc(requestId).set(order);

  const emailData: OrderEmailData = {
    requestId,
    clinicName: body.clinicName,
    email: body.email,
    patientName: body.patientName,
    product: body.product,
    deliveryDate: body.deliveryDate,
    isRush: body.isRush,
    files: body.files ?? [],
  };

  await sendEmails(emailData);

  res.status(200).json({ success: true, requestId });
});
