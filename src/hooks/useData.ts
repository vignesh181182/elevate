import { useQuery } from '@tanstack/react-query';
import { fetchClient, fetchClientExercises, fetchClients } from '../services/clients';
import { fetchCoaches } from '../services/coaches';
import { fetchLibrary } from '../services/library';
import { fetchAllSessionLogs, fetchSessionLog } from '../services/sessions';
import { fetchMedia } from '../services/media';
import { fetchBilling, fetchBillingSummaries, fetchPayments } from '../services/payments';
import { useIsMainCoach } from '../auth/AuthProvider';
import type { Coach } from '../domain/types';

export function useClients() {
  return useQuery({ queryKey: ['clients'], queryFn: fetchClients });
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: ['client', id],
    queryFn: () => fetchClient(id as string),
    enabled: !!id,
  });
}

export function useClientExercises(id: string | undefined) {
  return useQuery({
    queryKey: ['exercises', id],
    queryFn: () => fetchClientExercises(id as string),
    enabled: !!id,
  });
}

export function useCoaches() {
  return useQuery({ queryKey: ['coaches'], queryFn: fetchCoaches });
}

export function useLibrary() {
  return useQuery({ queryKey: ['library'], queryFn: fetchLibrary });
}

export function useSessionLogs() {
  return useQuery({ queryKey: ['sessionLogs'], queryFn: fetchAllSessionLogs });
}

export function useClientSessionLog(id: string | undefined) {
  return useQuery({
    queryKey: ['sessionLog', id],
    queryFn: () => fetchSessionLog(id as string),
    enabled: !!id,
  });
}

export function useClientMedia(id: string | undefined) {
  return useQuery({
    queryKey: ['media', id],
    queryFn: () => fetchMedia(id as string),
    enabled: !!id,
  });
}

/** id → coach name map, for resolving a client's coachId to a display name. */
export function useCoachNameMap(): Record<string, string> {
  const { data } = useCoaches();
  const map: Record<string, string> = {};
  (data ?? []).forEach((c: Coach) => (map[c.id] = c.name));
  return map;
}

/** Billing summaries keyed by client id — MAIN COACH ONLY (disabled for juniors). */
export function useBillings(clientIds: string[]) {
  const isMain = useIsMainCoach();
  return useQuery({
    queryKey: ['billings', clientIds.slice().sort()],
    queryFn: () => fetchBillingSummaries(clientIds),
    enabled: isMain && clientIds.length > 0,
  });
}

/** One client's billing summary — MAIN COACH ONLY. */
export function useBilling(clientId: string | undefined) {
  const isMain = useIsMainCoach();
  return useQuery({
    queryKey: ['billing', clientId],
    queryFn: () => fetchBilling(clientId as string),
    enabled: isMain && !!clientId,
  });
}

/** One client's payment history — MAIN COACH ONLY. */
export function usePayments(clientId: string | undefined) {
  const isMain = useIsMainCoach();
  return useQuery({
    queryKey: ['payments', clientId],
    queryFn: () => fetchPayments(clientId as string),
    enabled: isMain && !!clientId,
  });
}
