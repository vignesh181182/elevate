// Client-list filter predicates — ONE predicate per metric, shared by the Home
// dashboard counts and the Clients-list filter, so a stat can never diverge from
// the list it links to. Payment filters (payment:true) need billing data and are
// head-coach-only (juniors never receive billing).
import type { Billing, Client } from './types';
import { paymentStatusFromBilling } from './payments';

export type FilterKey =
  | 'All'
  | 'Active'
  | 'Leads'
  | 'Paused'
  | 'Assessment due'
  | 'Review due'
  | 'Payment due'
  | 'Membership expiring'
  | 'Payment overdue';

export interface ClientFilter {
  label: string;
  payment?: boolean;
  pred: (c: Client, billing?: Billing | null) => boolean;
}

export const CLIENT_FILTERS: Record<FilterKey, ClientFilter> = {
  All: { label: 'All clients', pred: () => true },
  Active: { label: 'Active clients', pred: (c) => c.status === 'Active' && c.scheduleSet },
  Leads: { label: 'New leads', pred: (c) => !c.scheduleSet },
  Paused: { label: 'Paused clients', pred: (c) => c.status === 'Paused' },
  'Assessment due': {
    label: 'Assessments due',
    pred: (c) => !c.assessmentDone || (c.status === 'Active' && !!c.review?.due),
  },
  'Review due': { label: 'Reviews due', pred: (c) => c.status === 'Active' && !!c.review?.due },
  'Payment due': {
    label: 'Pending payments',
    payment: true,
    pred: (c, b) => c.scheduleSet && ['DueSoon', 'Overdue'].includes(paymentStatusFromBilling(b ?? null)),
  },
  'Membership expiring': {
    label: 'Memberships expiring',
    payment: true,
    pred: (c, b) => c.scheduleSet && paymentStatusFromBilling(b ?? null) === 'DueSoon',
  },
  'Payment overdue': {
    label: 'Payments overdue',
    payment: true,
    pred: (c, b) => c.scheduleSet && paymentStatusFromBilling(b ?? null) === 'Overdue',
  },
};

export function isFilterKey(k: string | null): k is FilterKey {
  return !!k && k in CLIENT_FILTERS;
}
