import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const SENDER = 'Accugen Dental Lab <orders@accugendental.com>';
const LAB_EMAIL = 'orders@accugendental.com';

interface ScanRequestBody {
  clinicName: string;
  clinicEmail: string;
  contactName: string;
  contactNumber: string;
  preferredDate: string;
  preferredTime: string;
}

function row(label: string, value: string) {
  return `
    <tr>
      <td style="padding:9px 14px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb;color:#374151;width:160px;white-space:nowrap">${label}</td>
      <td style="padding:9px 14px;border:1px solid #e5e7eb;color:#111827">${value}</td>
    </tr>`;
}

function section(title: string, rows: string) {
  return `
    <p style="margin:24px 0 6px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9ca3af">${title}</p>
    <table style="border-collapse:collapse;width:100%;font-size:14px;line-height:1.5">${rows}</table>`;
}

export async function POST(req: NextRequest) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const body: ScanRequestBody = await req.json();

    const { clinicName, clinicEmail, contactName, contactNumber, preferredDate, preferredTime } = body;

    if (!clinicName || !clinicEmail || !preferredDate || !preferredTime) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const labSubject = `New Scan Request — ${clinicName}`;
    const clientSubject = 'New Scan Request Received';

    // ── Lab email ──
    const labHtml = `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
<div style="max-width:640px;margin:32px auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">

  <div style="background:#1d4ed8;padding:20px 28px">
    <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff">New Scan Request Received</p>
  </div>

  <div style="padding:24px 28px">

    ${section('Clinic Details',
      row('Clinic', clinicName) +
      row('Contact', contactName || '—') +
      row('Phone', contactNumber || '—') +
      row('Email', `<a href="mailto:${clinicEmail}" style="color:#2563eb">${clinicEmail}</a>`)
    )}

    ${section('Requested Slot',
      row('Date', preferredDate) +
      row('Time', preferredTime)
    )}

    <p style="margin:20px 0 0;font-size:12px;color:#9ca3af">— Accugen Order System</p>
  </div>
</div>
</body></html>`;

    // ── Client confirmation email ──
    const clientHtml = `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
<div style="max-width:640px;margin:32px auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">

  <div style="background:#1d4ed8;padding:20px 28px">
    <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff">New Scan Request Received</p>
  </div>

  <div style="padding:24px 28px">
    <p style="margin:0 0 20px;font-size:15px;color:#111827">Hi <strong>${clinicName}</strong>,</p>
    <p style="margin:0 0 20px;font-size:14px;color:#374151">Your intraoral scan request has been received.</p>
    <p style="margin:0 0 20px;font-size:14px;color:#374151">We will confirm slot availability shortly.</p>

    ${section('Request Details',
      row('Date', preferredDate) +
      row('Time', preferredTime)
    )}

    <div style="margin-top:24px;padding:14px 16px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;font-size:13px;color:#0369a1">
      <strong>For support:</strong><br>
      <a href="mailto:orders@accugendental.com" style="color:#0369a1">orders@accugendental.com</a><br>
      +91 7075488757
    </div>

    <p style="margin:20px 0 0;font-size:12px;color:#9ca3af">— Accugen Digital Dental Lab</p>
  </div>
</div>
</body></html>`;

    try {
      await resend.emails.send({ from: SENDER, to: LAB_EMAIL, reply_to: clinicEmail, subject: labSubject, html: labHtml });
    } catch (err) {
      console.error('[scan-request] Lab email error:', err);
    }

    try {
      await resend.emails.send({ from: SENDER, to: clinicEmail, subject: clientSubject, html: clientHtml });
    } catch (err) {
      console.error('[scan-request] Client email error:', err);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[scan-request] Unexpected error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
