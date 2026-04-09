import { Resend } from 'resend';

export interface OrderEmailData {
  requestId: string;
  clinicName: string;
  email: string;
  patientName: string;
  product: string;
  deliveryDate: string;
  isRush: boolean;
  files: Array<{ url: string; name: string; size: number }>;
}

const SENDER = 'noreply@accugendental.com';
const LAB_EMAIL = 'orders@accugendental.com';

export async function sendEmails(order: OrderEmailData): Promise<void> {
  const {
    requestId,
    clinicName,
    email,
    patientName,
    product,
    deliveryDate,
    isRush,
    files,
  } = order;

  const resend = new Resend(process.env.RESEND_API_KEY);

  const rushSuffix = isRush ? ' [RUSH]' : '';

  const fileList =
    files.length > 0
      ? files.map((f) => `  - ${f.name} (${(f.size / 1024 / 1024).toFixed(1)} MB): ${f.url}`).join('\n')
      : '  No files attached';

  const clientText = `Hi ${clinicName},

Your lab order has been received.

  Request ID : ${requestId}
  Patient    : ${patientName}
  Product    : ${product}
  Required By: ${deliveryDate}${rushSuffix}

— Accugen Dental Lab`;

  const labText = `  Request ID : ${requestId}
  Clinic     : ${clinicName}
  Patient    : ${patientName}
  Product    : ${product}
  Required By: ${deliveryDate}
  Rush       : ${isRush ? 'YES' : 'No'}

Files:
${fileList}`;

  try {
    await resend.emails.send({
      from: SENDER,
      to: email,
      subject: `Order Received - ${requestId}`,
      text: clientText,
    });
  } catch (err) {
    console.error(`[sendEmails] Failed to send client email for ${requestId}:`, err);
  }

  try {
    await resend.emails.send({
      from: SENDER,
      to: LAB_EMAIL,
      subject: `New Order Received - ${requestId}${rushSuffix}`,
      text: labText,
    });
  } catch (err) {
    console.error(`[sendEmails] Failed to send lab email for ${requestId}:`, err);
  }
}
