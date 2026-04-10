import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { generateRequestId } from '@/lib/counter';

const SENDER = 'Accugen Dental Lab <orders@accugendental.com>';
const LAB_EMAIL = 'orders@accugendental.com';

interface OrderFile {
  url: string;
  name: string;
  size: number;
}

interface OrderItem {
  category: string;
  product: string;
  qty: number;
  unitType: 'per_tooth' | 'per_arch' | 'per_unit';
  toothNumbers: number[];
  isBridge: boolean;
  arch: string;
  shade: string;
  implantNotes: string;
}

interface OrderBody {
  clinicName: string;
  email: string;
  contactName?: string;
  contactNumber?: string;
  patientName: string;
  items: OrderItem[];
  generalInstructions?: string;
  deliveryDate: string;
  isRush: boolean;
  files: OrderFile[];
}

/* ── Email helpers ── */

function wrap(title: string, content: string): string {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
<div style="max-width:640px;margin:24px auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
  <div style="background-color:#2563eb;padding:14px 20px;color:white;font-weight:700;font-size:16px;">${title}</div>
  <div style="font-family:Arial,sans-serif;font-size:14px;color:#111;padding:20px 24px;line-height:1.6;">
    ${content}
  </div>
</div>
</body></html>`;
}

function tableSection(heading: string, rows: [string, string][]): string {
  const trs = rows.map(([label, value]) => `
    <tr>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600;color:#374151;width:38%;vertical-align:top;">${label}</td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;color:#111827;">${value || '—'}</td>
    </tr>`).join('');

  return `
    <p style="margin:20px 0 6px;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#9ca3af;">${heading}</p>
    <table style="border-collapse:collapse;width:100%;font-size:14px;">${trs}</table>`;
}

function itemsTable(items: OrderItem[]): string {
  const th = (t: string) =>
    `<th style="padding:8px 12px;border:1px solid #e5e7eb;background:#f3f4f6;font-weight:700;color:#374151;text-align:left;">${t}</th>`;

  function qtyDisplay(item: OrderItem): string {
    if (item.unitType === 'per_tooth') {
      return item.toothNumbers?.length > 0 ? item.toothNumbers.join(', ') : '—';
    }
    if (item.unitType === 'per_arch') {
      return item.arch || '—';
    }
    return String(item.qty ?? 1);
  }

  const rows = items.map((item, i) => `
    <tr>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;color:#6b7280;text-align:center;">${i + 1}</td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;">${item.category}</td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;">${item.product}</td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;text-align:center;">${qtyDisplay(item)}</td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;">${item.shade || '—'}</td>
    </tr>`).join('');

  // Implant notes as footnotes beneath the table
  const implantNotes = items
    .map((item, i) => item.implantNotes ? `<p style="margin:4px 0;font-size:13px;color:#374151;">Item ${i + 1} — ${item.implantNotes}</p>` : '')
    .filter(Boolean).join('');

  return `
    <p style="margin:20px 0 6px;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#9ca3af;">Order Items</p>
    <table style="border-collapse:collapse;width:100%;font-size:14px;">
      <thead><tr>${th('#')}${th('Category')}${th('Product')}${th('Qty / Teeth / Arch')}${th('Shade')}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
    ${implantNotes ? `<div style="margin-top:10px;padding:10px 12px;background:#fff7ed;border:1px solid #fed7aa;border-radius:4px;"><p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#9a3412;">Implant Notes</p>${implantNotes}</div>` : ''}`;
}

/* ── Route handler ── */

export async function POST(req: NextRequest) {
  try {
    // ── Env guard ──
    const apiKey = process.env.RESEND_API_KEY;
    console.log('[order] RESEND_API_KEY present:', !!apiKey);
    if (!apiKey) {
      console.error('[order] RESEND_API_KEY is not set — emails will not send');
    }

    const resend = new Resend(apiKey);
    const body: OrderBody = await req.json();

    const {
      clinicName, email, contactName, contactNumber,
      patientName, items, generalInstructions,
      deliveryDate, isRush, files = [],
    } = body;

    if (!clinicName || !email || !patientName || !deliveryDate) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }
    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'No items provided' }, { status: 400 });
    }

    const requestId = generateRequestId();
    const rushSuffix = isRush ? ' (Rush)' : '';

    const labSubject    = `New Order: ${clinicName} - Pt. ${patientName}${rushSuffix}`;
    const clientSubject = `New Order Received for Pt. ${patientName}${rushSuffix} — Accugen Digital Dental Lab`;

    // File rows
    const fileRows: [string, string][] = files.length > 0
      ? files.map((f, i) => [`File ${i + 1}`, `<a href="${f.url}" style="color:#2563eb;">${f.name}</a>`])
      : [];

    /* ── Lab email ── */
    const labBody = `
      ${tableSection('Clinic Details', [
        ['Clinic',  clinicName],
        ['Doctor',  contactName || '—'],
        ['Phone',   contactNumber || '—'],
        ['Email',   `<a href="mailto:${email}" style="color:#2563eb;">${email}</a>`],
      ])}
      ${tableSection('Case Details', [
        ['Request ID',  `<span style="font-family:monospace;">${requestId}</span>`],
        ['Patient',     patientName],
        ['Required By', deliveryDate],
        ['Rush',        isRush ? '<span style="color:#dc2626;font-weight:600;">Yes</span>' : 'No'],
      ])}
      ${itemsTable(items)}
      ${tableSection('Instructions', [['General Instructions', generalInstructions || '—']])}
      ${fileRows.length > 0 ? tableSection('Files', fileRows) : ''}`;

    /* ── Client email ── */
    const clientBody = `
      <p style="margin:0 0 16px;">Hi <strong>${clinicName}</strong>,</p>
      <p style="margin:0 0 16px;">Your lab order has been successfully received and is now being processed.</p>
      ${tableSection('Case Details', [
        ['Patient',     patientName],
        ['Required By', deliveryDate],
        ['Rush',        isRush ? '<span style="color:#dc2626;font-weight:600;">Yes</span>' : 'No'],
      ])}
      ${itemsTable(items)}
      <div style="margin-top:20px;padding:12px 14px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:4px;font-size:13px;color:#0369a1;">
        <strong>For support:</strong><br/>
        <a href="mailto:orders@accugendental.com" style="color:#0369a1;">orders@accugendental.com</a><br/>
        +91 7075488757
      </div>`;

    // Track email results so we can log them clearly
    let labEmailError: string | null = null;
    let clientEmailError: string | null = null;

    try {
      console.log('[order] Sending lab email to', LAB_EMAIL);
      const result = await resend.emails.send({
        from: SENDER, to: LAB_EMAIL, reply_to: email,
        subject: labSubject,
        html: wrap('New Order Received', labBody),
      });
      console.log('[order] Lab email result:', JSON.stringify(result));
    } catch (err: unknown) {
      labEmailError = err instanceof Error ? err.message : String(err);
      console.error('[order] Lab email FAILED:', labEmailError);
    }

    try {
      console.log('[order] Sending client email to', email);
      const result = await resend.emails.send({
        from: SENDER, to: email,
        subject: clientSubject,
        html: wrap('New Order Received', clientBody),
      });
      console.log('[order] Client email result:', JSON.stringify(result));
    } catch (err: unknown) {
      clientEmailError = err instanceof Error ? err.message : String(err);
      console.error('[order] Client email FAILED:', clientEmailError);
    }

    // Always return success so the order is not lost even if emails fail.
    // Email errors are visible in Vercel function logs.
    return NextResponse.json({
      success: true,
      requestId,
      emailStatus: {
        lab:    labEmailError    ? `failed: ${labEmailError}`    : 'sent',
        client: clientEmailError ? `failed: ${clientEmailError}` : 'sent',
      },
    });

  } catch (err) {
    console.error('[order] Unexpected error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
