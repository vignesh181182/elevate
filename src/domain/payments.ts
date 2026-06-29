// Pure payment-status logic, ported verbatim from the prototype's package-based
// model. Operates on the billing summary + payment history (no hardcoded values).
import type { Billing, Payment, PaymentStatus } from './types';

export const OVERDUE_DAYS_AFTER_BALANCE_ZERO = 7;
export const PACKAGE_SIZES = [12, 16, 24];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Whole-day difference (b − a) between two YYYY-MM-DD dates. */
export function daysBetween(aISO: string, bISO: string): number {
  const a = new Date(aISO + 'T00:00:00');
  const b = new Date(bISO + 'T00:00:00');
  if (isNaN(+a) || isNaN(+b)) return 0;
  return Math.round((+b - +a) / 86400000);
}

export function paymentStatus(billing: Billing | null, payments: Payment[]): PaymentStatus {
  if (!payments || payments.length === 0) return 'New';
  if (!billing) return 'New';
  if (billing.sessionsRemaining > 0) return 'Paid';
  if (!billing.lastSessionDate) return 'DueSoon';
  const daysSince = daysBetween(billing.lastSessionDate, todayISO());
  return daysSince > OVERDUE_DAYS_AFTER_BALANCE_ZERO ? 'Overdue' : 'DueSoon';
}

/**
 * Status from the billing summary alone (no payment history needed). Used in list
 * rows for already-set-up clients, which always have payments — so the 'New' case
 * (no payments yet) never applies there and lifecycle pills handle leads instead.
 */
export function paymentStatusFromBilling(billing: Billing | null): Exclude<PaymentStatus, 'New'> {
  if (!billing || billing.sessionsRemaining > 0) return 'Paid';
  if (!billing.lastSessionDate) return 'DueSoon';
  const daysSince = daysBetween(billing.lastSessionDate, todayISO());
  return daysSince > OVERDUE_DAYS_AFTER_BALANCE_ZERO ? 'Overdue' : 'DueSoon';
}

/** Days past the grace window from a billing summary (0 unless overdue). */
export function daysOverdueFromBilling(billing: Billing | null): number {
  if (!billing?.lastSessionDate || paymentStatusFromBilling(billing) !== 'Overdue') return 0;
  return daysBetween(billing.lastSessionDate, todayISO()) - OVERDUE_DAYS_AFTER_BALANCE_ZERO;
}

export function daysOverdue(billing: Billing | null, payments: Payment[]): number {
  if (paymentStatus(billing, payments) !== 'Overdue' || !billing?.lastSessionDate) return 0;
  return daysBetween(billing.lastSessionDate, todayISO()) - OVERDUE_DAYS_AFTER_BALANCE_ZERO;
}

/** Estimate when the balance runs out, from remaining sessions and weekly cadence. */
export function projectedRenewalDate(billing: Billing | null, days: string | undefined): string | null {
  if (!billing || billing.sessionsRemaining <= 0) return null;
  if (!days || days === '—') return null;
  const perWeek = days.split(',').length;
  if (perWeek <= 0) return null;
  const weeksLeft = billing.sessionsRemaining / perWeek;
  const d = new Date();
  d.setDate(d.getDate() + Math.ceil(weeksLeft * 7));
  return d.toISOString().slice(0, 10);
}

/** Total package sessions ever purchased (assessment fees add 0). */
export function lifetimeSessions(payments: Payment[]): number {
  return (payments || []).reduce((s, p) => s + (p.type === 'package' ? p.sessions ?? 0 : 0), 0);
}

/** Sessions purchased for the current cycle (falls back to the last package size). */
export function totalPurchased(payments: Payment[], packageSize: number): number {
  return lifetimeSessions(payments) || packageSize || 0;
}

/** Most recent payment by date (newest), or null. */
export function lastPayment(payments: Payment[]): Payment | null {
  if (!payments || payments.length === 0) return null;
  return [...payments].sort((a, b) => (a.date < b.date ? 1 : -1))[0];
}

/** Human label for a payment record — money-free (no amount). */
export function paymentLabel(p: Payment): string {
  if (p.type === 'assessment') return 'Assessment fee';
  return p.sessions ? `Package · ${p.sessions} sessions` : 'Package';
}

/** Next numeric payment id (max existing + 1), starting at 1. */
export function nextPaymentId(payments: Payment[]): number {
  return (payments || []).reduce((m, p) => Math.max(m, p.id), 0) + 1;
}

/**
 * Billing-summary adjustment when saving a payment. `prev` is the payment being
 * edited (null for a new one). Only package sessions move the running balance —
 * the delta lets edits self-correct (e.g. 12 → 16 adds 4). packageSize is set to
 * the package's sessions, or left untouched (null) for assessment fees.
 */
export function billingAdjustment(
  next: Payment,
  prev: Payment | null,
): { sessionsDelta: number; packageSize: number | null } {
  const sessionsOf = (p: Payment | null) => (p && p.type === 'package' ? p.sessions ?? 0 : 0);
  return {
    sessionsDelta: sessionsOf(next) - sessionsOf(prev),
    packageSize: next.type === 'package' ? next.sessions ?? next.packageSize : null,
  };
}
