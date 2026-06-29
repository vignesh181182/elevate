// Pure client-lifecycle helpers ported from the prototype.
import type { Client } from './types';

export type ClientStage = 'Assessment pending' | 'Schedule pending' | 'Welcome note pending' | null;

/** Onboarding stage during the staged add-client flow; null once fully set up. */
export function clientStage(c: Pick<Client, 'assessmentDone' | 'scheduleDone' | 'scheduleSet'>): ClientStage {
  if (!c.assessmentDone) return 'Assessment pending';
  if (!c.scheduleDone) return 'Schedule pending';
  if (!c.scheduleSet) return 'Welcome note pending';
  return null;
}

/** A fully set-up client (renders the rich detail page rather than the pending overview). */
export function isActiveClient(c: Pick<Client, 'scheduleSet'>): boolean {
  return c.scheduleSet;
}
