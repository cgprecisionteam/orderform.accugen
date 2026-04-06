import { doc, runTransaction } from 'firebase/firestore';
import { db } from './firebase';

// Financial year prefix — update each year (e.g. "2728" for FY 2027-28)
const FY_PREFIX = '2627';

/**
 * Atomically increments the order counter and returns a formatted request ID.
 * Format: REQ-2627-00001
 */
export async function generateRequestId(): Promise<string> {
  const counterRef = doc(db, 'counters', 'orders');

  const newCount = await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(counterRef);
    const current: number = snap.exists() ? (snap.data().count as number) : 0;
    const next = current + 1;
    transaction.set(counterRef, { count: next }, { merge: true });
    return next;
  });

  const padded = String(newCount).padStart(5, '0');
  return `REQ-${FY_PREFIX}-${padded}`;
}
