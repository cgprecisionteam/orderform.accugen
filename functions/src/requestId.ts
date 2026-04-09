import * as admin from 'firebase-admin';

const FY_PREFIX = '2627';

export async function generateRequestId(): Promise<string> {
  const db = admin.firestore();
  const counterRef = db.collection('counters').doc('orders');

  const newCount = await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(counterRef);
    const current: number = snap.exists ? (snap.data()!.count as number) : 0;
    const next = current + 1;
    transaction.set(counterRef, { count: next }, { merge: true });
    return next;
  });

  const padded = String(newCount).padStart(5, '0');
  return `REQ-${FY_PREFIX}-${padded}`;
}
