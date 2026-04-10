/**
 * Stateless order ID generator — safe for Vercel (no filesystem access).
 * Format: REQ-DDMMYYYY-HHMMSS  e.g. REQ-10042026-143022
 */
export function generateRequestId(): string {
  const now = new Date();

  const day   = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year  = String(now.getFullYear());

  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');

  const orderId = `REQ-${day}${month}${year}-${hh}${mm}${ss}`;
  console.log('Generated Order ID:', orderId);
  return orderId;
}
