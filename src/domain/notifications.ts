// System → coach alert derivation. ALL items are derived from real client + billing
// fields (no fabricated alerts) and are role-aware: the billing-derived items
// (overdue / expiring) are only produced for the head coach, since juniors never
// receive billing data. There is NO coach-authored notification — this is read-only.
import type { Billing, Client } from './types';
import { paymentStatusFromBilling, daysOverdueFromBilling } from './payments';

export type NotificationKind = 'overdue' | 'expiring' | 'review' | 'assessment' | 'schedule';

export interface Notification {
  id: string;
  kind: NotificationKind;
  clientId: string;
  title: string;
  detail: string;
  section?: string; // hub sub-route to deep-link into (e.g. 'payment')
  billing: boolean; // derived from billing → head coach only
}

const RANK: Record<NotificationKind, number> = { overdue: 0, expiring: 1, review: 2, assessment: 3, schedule: 4 };

/**
 * Build the coach's alert feed. `billings` is the per-client summary map (empty for
 * juniors — so no billing alerts are emitted). Sorted most-urgent first.
 */
export function buildNotifications(
  clients: Client[],
  billings: Record<string, Billing>,
  isMain: boolean,
): Notification[] {
  const out: Notification[] = [];

  for (const c of clients) {
    // A lead awaiting setup — no program / payment / review yet.
    if (!c.scheduleSet) {
      out.push({
        id: `sched-${c.id}`,
        kind: 'schedule',
        clientId: c.id,
        title: `Set up ${c.name}`,
        detail: 'New lead awaiting schedule & coach',
        section: 'schedule',
        billing: false,
      });
      continue;
    }

    // Baseline assessment not yet captured.
    if (!c.assessmentDone) {
      out.push({
        id: `assess-${c.id}`,
        kind: 'assessment',
        clientId: c.id,
        title: `Assessment due for ${c.name}`,
        detail: 'Capture baseline measurements & goals',
        section: 'assessment',
        billing: false,
      });
    }

    // Weekly program review flagged due.
    if (c.status === 'Active' && c.review?.due) {
      out.push({
        id: `review-${c.id}`,
        kind: 'review',
        clientId: c.id,
        title: `Weekly review due for ${c.name}`,
        detail: `Update or confirm their program · ${c.review.ago}`,
        section: 'program',
        billing: false,
      });
    }

    // Billing alerts — head coach only.
    if (isMain) {
      const b = billings[c.id] ?? null;
      const status = paymentStatusFromBilling(b);
      if (status === 'Overdue') {
        out.push({
          id: `pay-${c.id}`,
          kind: 'overdue',
          clientId: c.id,
          title: `Payment overdue for ${c.name}`,
          detail: `Balance empty · ${daysOverdueFromBilling(b)} days overdue — record a payment`,
          section: 'payment',
          billing: true,
        });
      } else if (status === 'DueSoon') {
        out.push({
          id: `pay-${c.id}`,
          kind: 'expiring',
          clientId: c.id,
          title: `Renewal due soon for ${c.name}`,
          detail: 'Balance empty — record a renewal payment',
          section: 'payment',
          billing: true,
        });
      }
    }
  }

  return out.sort((a, b) => RANK[a.kind] - RANK[b.kind]);
}
