import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addProgramExercises,
  createClient,
  fetchClient,
  fetchClientExercises,
  fetchClients,
  removeProgramExercise,
  setClientSchedule,
  type NewClientInput,
  type NewProgramExercise,
  type ScheduleInput,
} from '../services/clients';
import { fetchCoaches } from '../services/coaches';
import { fetchLibrary } from '../services/library';
import { fetchAllSessionLogs, fetchDaySessions, fetchSessionLog, markAttendance } from '../services/sessions';
import { fetchMedia } from '../services/media';
import { fetchReports } from '../services/reports';
import { fetchBilling, fetchBillingSummaries, fetchPayments, savePayment } from '../services/payments';
import { billingAdjustment } from '../domain/payments';
import { useIsMainCoach } from '../auth/AuthProvider';
import type { Attendance, Coach, Payment } from '../domain/types';

export function useClients() {
  return useQuery({ queryKey: ['clients'], queryFn: fetchClients });
}

/** Create a new client (lead). Invalidates the clients list; resolves to the new id. */
export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewClientInput) => createClient(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}

/** Assign schedule & coach (activates the client). Invalidates the client + list. */
export function useSetSchedule(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ScheduleInput) => setClientSchedule(id as string, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client', id] });
      qc.invalidateQueries({ queryKey: ['clients'] });
    },
  });
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

/** Append picked library exercises to a client's program. Invalidates their exercises. */
export function useAddProgramExercises(clientId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: NewProgramExercise[]) => addProgramExercises(clientId as string, items),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exercises', clientId] }),
  });
}

/** Remove one exercise from a client's program. Invalidates their exercises. */
export function useRemoveProgramExercise(clientId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (exId: string) => removeProgramExercise(clientId as string, exId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exercises', clientId] }),
  });
}

export function useCoaches() {
  return useQuery({ queryKey: ['coaches'], queryFn: fetchCoaches });
}

export function useLibrary() {
  return useQuery({ queryKey: ['library'], queryFn: fetchLibrary });
}

export function useReports() {
  return useQuery({ queryKey: ['reports'], queryFn: fetchReports });
}

export function useSessionLogs() {
  return useQuery({ queryKey: ['sessionLogs'], queryFn: fetchAllSessionLogs });
}

/** Every listed client's session doc for one date — attendance, etc. Shared across coaches. */
export function useDaySessions(clientIds: string[], date: string) {
  return useQuery({
    queryKey: ['daySessions', date, clientIds.slice().sort()],
    queryFn: () => fetchDaySessions(clientIds, date),
    enabled: clientIds.length > 0,
  });
}

/** Mark attendance for `date`; invalidates that day's session docs. `markedBy` = coach uid. */
export function useMarkAttendance(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, status, markedBy }: { clientId: string; status: Attendance; markedBy: string }) =>
      markAttendance(clientId, date, status, markedBy),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['daySessions', date] }),
  });
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

/**
 * Add or edit a payment — MAIN COACH ONLY. Pass the full payment and the prior
 * record (null when adding); the billing delta is derived here. Invalidates the
 * payment + billing queries so the card refreshes.
 */
export function useSavePayment(clientId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ payment, prev }: { payment: Payment; prev: Payment | null }) =>
      savePayment(clientId as string, payment, billingAdjustment(payment, prev)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments', clientId] });
      qc.invalidateQueries({ queryKey: ['billing', clientId] });
    },
  });
}
