import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const LAB_EMAIL = 'orders@accugendental.com';
const SENDER = 'noreply@accugendental.com';

interface OrderFile {
  url: string;
  name: string;
  size: number;
}

interface OrderBody {
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
  files: OrderFile[];
}

function generateRequestId(): string {
  const FY_PREFIX = '2627';
  const random = Math.floor(10000 + Math.random() * 90000);
  return `REQ-${FY_PREFIX}-${random}`;
}

export async function POST(req: NextRequest) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const body: OrderBody = await req.json();

    const {
      clinicName,
      email,
      contactName,
      patientName,
      product,
      deliveryDate,
      isRush,
      files = [],
    } = body;

    if (!clinicName || !email || !patientName || !product || !deliveryDate) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const requestId = generateRequestId();
    const rushSuffix = isRush ? ' [RUSH]' : '';

    const fileList =
      files.length > 0
        ? files
            .map(
              (f) =>
                `<li><a href="${f.url}" style="color:#2563eb">${f.name}</a> &nbsp;(${(f.size / 1024 / 1024).toFixed(1)} MB)</li>`
            )
            .join('')
        : '<li style="color:#6b7280">No files attached</li>';

    // ── Client confirmation email ──
    const clientHtml = `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;color:#111827">
        <h2 style="color:#2563eb;margin-bottom:4px">Order Received</h2>
        <p>Hi <strong>${clinicName}</strong>,</p>
        <p>Your lab order has been received. We will be in touch shortly.</p>
        <table style="border-collapse:collapse;width:100%;margin:20px 0;font-size:14px">
          <tr>
            <td style="padding:10px 12px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb;width:140px">Request ID</td>
            <td style="padding:10px 12px;border:1px solid #e5e7eb;font-family:monospace;color:#2563eb;font-weight:700">${requestId}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb">Patient</td>
            <td style="padding:10px 12px;border:1px solid #e5e7eb">${patientName}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb">Product</td>
            <td style="padding:10px 12px;border:1px solid #e5e7eb">${product}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb">Required By</td>
            <td style="padding:10px 12px;border:1px solid #e5e7eb">${deliveryDate}${isRush ? ' <span style="color:#ea580c;font-weight:700">[RUSH]</span>' : ''}</td>
          </tr>
        </table>
        <p style="color:#6b7280;font-size:13px">Questions? Contact us at <a href="mailto:${LAB_EMAIL}" style="color:#2563eb">${LAB_EMAIL}</a></p>
        <p style="color:#6b7280;font-size:13px">— Accugen Dental Lab</p>
      </div>
    `;

    // ── Lab notification email ──
    const labHtml = `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;color:#111827">
        <h2 style="color:#2563eb;margin-bottom:4px">New Order — ${requestId}${isRush ? ' <span style="color:#ea580c">[RUSH]</span>' : ''}</h2>
        <table style="border-collapse:collapse;width:100%;margin:20px 0;font-size:14px">
          <tr>
            <td style="padding:10px 12px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb;width:140px">Request ID</td>
            <td style="padding:10px 12px;border:1px solid #e5e7eb;font-family:monospace">${requestId}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb">Clinic</td>
            <td style="padding:10px 12px;border:1px solid #e5e7eb">${clinicName}${contactName ? ` (${contactName})` : ''}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb">Patient</td>
            <td style="padding:10px 12px;border:1px solid #e5e7eb">${patientName}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb">Product</td>
            <td style="padding:10px 12px;border:1px solid #e5e7eb">${product}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb">Required By</td>
            <td style="padding:10px 12px;border:1px solid #e5e7eb">${deliveryDate}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb">Rush</td>
            <td style="padding:10px 12px;border:1px solid #e5e7eb;color:${isRush ? '#ea580c' : '#6b7280'};font-weight:${isRush ? '700' : '400'}">${isRush ? 'YES' : 'No'}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb">Reply To</td>
            <td style="padding:10px 12px;border:1px solid #e5e7eb"><a href="mailto:${email}" style="color:#2563eb">${email}</a></td>
          </tr>
        </table>
        <h3 style="font-size:14px;margin-bottom:8px">Attached Files</h3>
        <ul style="margin:0;padding-left:20px;font-size:14px">${fileList}</ul>
      </div>
    `;

    const [clientResult, labResult] = await Promise.allSettled([
      resend.emails.send({
        from: SENDER,
        to: email,
        subject: `Order Received - ${requestId}`,
        html: clientHtml,
      }),
      resend.emails.send({
        from: SENDER,
        to: LAB_EMAIL,
        subject: `New Order - ${requestId}${rushSuffix}`,
        html: labHtml,
      }),
    ]);

    if (clientResult.status === 'rejected') {
      console.error('[order] Client email failed:', clientResult.reason);
    }
    if (labResult.status === 'rejected') {
      console.error('[order] Lab email failed:', labResult.reason);
    }

    return NextResponse.json({ success: true, requestId });
  } catch (err) {
    console.error('[order] Unexpected error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
