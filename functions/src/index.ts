import * as admin from 'firebase-admin';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as nodemailer from 'nodemailer';

admin.initializeApp();

// ---------------------------------------------------------------------------
// Email transporter
// Configure via Firebase environment config or Secret Manager in production.
// ---------------------------------------------------------------------------
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const SENDER = 'noreply@accugendental.com';
const LAB_EMAIL = 'orders@accugendental.com';

// ---------------------------------------------------------------------------
// Trigger: send emails when a new order document is created
// ---------------------------------------------------------------------------
export const onOrderCreated = onDocumentCreated('orders/{orderId}', async (event) => {
  const data = event.data?.data();
  if (!data) return;

  const {
    requestId,
    clinicName,
    email,
    patientName,
    product,
    deliveryDate,
    isRush,
    files,
  } = data as {
    requestId: string;
    clinicName: string;
    email: string;
    patientName: string;
    product: string;
    deliveryDate: string;
    isRush: boolean;
    files: Array<{ url: string; name: string; size: number }>;
  };

  const fileLinks = files && files.length > 0
    ? files.map((f) => `<li><a href="${f.url}">${f.name}</a> (${(f.size / 1024 / 1024).toFixed(1)} MB)</li>`).join('')
    : '<li>No files attached</li>';

  // 1. Client confirmation email
  const clientHtml = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;color:#111">
      <h2 style="color:#2563eb">Order Received</h2>
      <p>Thank you, <strong>${clinicName}</strong>. We have received your lab order.</p>
      <table style="border-collapse:collapse;width:100%;margin:16px 0">
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:600">Request ID</td>
            <td style="padding:8px;border:1px solid #e5e7eb;font-family:monospace;color:#2563eb">${requestId}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:600">Patient</td>
            <td style="padding:8px;border:1px solid #e5e7eb">${patientName}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:600">Product</td>
            <td style="padding:8px;border:1px solid #e5e7eb">${product}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:600">Required By</td>
            <td style="padding:8px;border:1px solid #e5e7eb">${deliveryDate}${isRush ? ' <span style="color:#ea580c;font-weight:600">(RUSH)</span>' : ''}</td></tr>
      </table>
      <p style="color:#6b7280;font-size:13px">If you have any questions, please contact us at <a href="mailto:orders@accugendental.com">orders@accugendental.com</a>.</p>
      <p style="color:#6b7280;font-size:13px">— Accugen Dental Lab</p>
    </div>
  `;

  // 2. Lab notification email
  const labHtml = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;color:#111">
      <h2 style="color:#2563eb">New Order — ${requestId}${isRush ? ' <span style="color:#ea580c">[RUSH]</span>' : ''}</h2>
      <table style="border-collapse:collapse;width:100%;margin:16px 0">
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:600">Request ID</td>
            <td style="padding:8px;border:1px solid #e5e7eb;font-family:monospace">${requestId}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:600">Clinic</td>
            <td style="padding:8px;border:1px solid #e5e7eb">${clinicName}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:600">Patient</td>
            <td style="padding:8px;border:1px solid #e5e7eb">${patientName}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:600">Product</td>
            <td style="padding:8px;border:1px solid #e5e7eb">${product}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:600">Required By</td>
            <td style="padding:8px;border:1px solid #e5e7eb">${deliveryDate}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:600">Rush</td>
            <td style="padding:8px;border:1px solid #e5e7eb;color:${isRush ? '#ea580c' : '#6b7280'}">${isRush ? 'YES' : 'No'}</td></tr>
      </table>
      <h3 style="margin-top:16px">Files</h3>
      <ul>${fileLinks}</ul>
    </div>
  `;

  await Promise.all([
    transporter.sendMail({
      from: SENDER,
      to: email,
      subject: `Order Received - ${requestId}`,
      html: clientHtml,
    }),
    transporter.sendMail({
      from: SENDER,
      to: LAB_EMAIL,
      subject: `New Order Received - ${requestId}${isRush ? ' [RUSH]' : ''}`,
      html: labHtml,
    }),
  ]);
});

// ---------------------------------------------------------------------------
// Scheduled placeholder — file expiry / reminder emails (future use)
// Runs daily at 8 AM UTC.
// ---------------------------------------------------------------------------
export const dailyMaintenance = onSchedule('0 8 * * *', async () => {
  // TODO: Implement file expiry cleanup and reminder emails
  console.log('dailyMaintenance: placeholder — no-op for now');
});
