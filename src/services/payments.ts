// Payment data-access — MAIN COACH ONLY. Firestore Security Rules reject these
// reads for junior coaches (403), so callers must gate by role before invoking
// (see useIsMainCoach). billing is the per-client summary; payments is history.
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
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

/** Billing summaries for many clients (main coach only). Returns a id→Billing map. */
export async function fetchBillingSummaries(clientIds: string[]): Promise<Record<string, Billing>> {
  const entries = await Promise.all(
    clientIds.map(async (id) => [id, await fetchBilling(id)] as const),
  );
  const out: Record<string, Billing> = {};
  for (const [id, b] of entries) if (b) out[id] = b;
  return out;
}
