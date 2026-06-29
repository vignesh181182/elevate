// Payment data-access — MAIN COACH ONLY. Firestore Security Rules reject these
// reads for junior coaches (403), so callers must gate by role before invoking
// (see useIsMainCoach). billing is the per-client summary; payments is history.
import { collection, doc, getDoc, getDocs, increment, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { Billing, Payment } from '../domain/types';

export async function fetchBilling(clientId: string): Promise<Billing | null> {
  const snap = await getDoc(doc(db, 'clients', clientId, 'billing', 'summary'));
  return snap.exists() ? (snap.data() as Billing) : null;
}

export async function fetchPayments(clientId: string): Promise<Payment[]> {
  const snap = await getDocs(collection(db, 'clients', clientId, 'payments'));
  return snap.docs
    .map((d) => d.data() as Payment)
    .sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first
}

/**
 * Add or edit a payment (main coach only — Security Rules enforce it). Writes the
 * payment doc, then nudges the billing summary: `sessionsDelta` increments the
 * running balance (negative when an edit shrinks a package), `packageSize` updates
 * the current package size (null = leave it, e.g. assessment fees). merge:true so a
 * missing summary is created and untouched fields (lastSessionDate) are preserved.
 */
export async function savePayment(
  clientId: string,
  payment: Payment,
  billing: { sessionsDelta: number; packageSize: number | null },
): Promise<void> {
  await setDoc(doc(db, 'clients', clientId, 'payments', `p${payment.id}`), payment);

  const patch: Record<string, unknown> = {};
  if (billing.sessionsDelta !== 0) patch.sessionsRemaining = increment(billing.sessionsDelta);
  if (billing.packageSize != null) patch.packageSize = billing.packageSize;
  if (Object.keys(patch).length > 0) {
    await setDoc(doc(db, 'clients', clientId, 'billing', 'summary'), patch, { merge: true });
  }
}

/** Billing summaries for many clients (main coach only). Returns a id→Billing map. */
export async function fetchBillingSummaries(clientIds: string[]): Promise<Record<string, Billing>> {
  const entries = await Promise.all(
    clientIds.map(async (id) => [id, await fetchBilling(id)] as const),
  );
  const out: Record<string, Billing> = {};
  for (const [id, b] of entries) if (b) out[id] = b;
  return out;
}
