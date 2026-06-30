import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addProgramExercises,
  createClient,
  fetchClient,
  fetchClientExercises,
  fetchClients,
  removeProgramExercise,
  reorderProgramExercises,
  patchClient,
  saveAssessment,
  saveWeekLoads,
  saveWelcomeMessage,
  setClientSchedule,
  updateClient,
  updateProgramExercise,
  type AssessmentInput,
  type EditClientInput,
  type NewClientInput,
  type NewProgramExercise,
  type ScheduleInput,
  type WeekLoad,
} from '../services/clients';
import { fetchCoaches, saveCoachProfile, type CoachProfilePatch } from '../services/coaches';
import {
  addLibraryExercise,
  deleteLibraryExercise,
  fetchLibrary,
  updateLibraryExercise,
  type LibraryExerciseInput,
} from '../services/library';
import {
  completeSession,
  fetchAllSessionLogs,
  fetchDaySessions,
  fetchSession,
  fetchSessionLog,
  markAttendance,
  setSessionProgress,
} from '../services/sessions';
import { addMedia, deleteMedia, fetchMedia, type NewMedia } from '../services/media';
import { fetchReports, markReportSent } from '../services/reports';
import { fetchBilling, fetchBillingSummaries, fetchPayments, savePayment } from '../services/payments';
import { billingAdjustment } from '../domain/payments';
import { useIsMainCoach } from '../auth/AuthProvider';
import type { Attendance, ClientStatus, Coach, Payment, ProgramExercise, SessionDoc, SessionLog } from '../domain/types';

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

/**
 * Save a client's first-assessment. Invalidates the client (report + measures) and
 * the clients list (the "Assessment pending" pill + "Assessment due" filter depend
 * on assessmentDone).
 */
export function useSaveAssessment(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AssessmentInput) => saveAssessment(id as string, input),
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

/** Update a client's profile (identity + category + coach). Invalidates client + list. */
export function useUpdateClient(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: EditClientInput) => updateClient(id as string, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client', id] });
      qc.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

/** Persist the client's welcome note. Invalidates the client. */
export function useSaveWelcome(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (message: string) => saveWelcomeMessage(id as string, message),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client', id] }),
  });
}

/** Quick status/coach patch from the client menu. Invalidates client + list. */
export function usePatchClient(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: { status?: ClientStatus; coachId?: string | null }) => patchClient(id as string, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client', id] });
      qc.invalidateQueries({ queryKey: ['clients'] });
    },
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

/** Save per-week loads for one program week. Invalidates the client's exercises. */
export function useSaveWeekLoads(clientId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ week, loads }: { week: number; loads: WeekLoad[] }) =>
      saveWeekLoads(clientId as string, week, loads),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exercises', clientId] }),
  });
}

/** Persist a new exercise order. Invalidates the client's exercises. */
export function useReorderProgramExercises(clientId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderProgramExercises(clientId as string, orderedIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exercises', clientId] }),
  });
}

/** Patch a program exercise (e.g. its target). Invalidates the client's exercises. */
export function useUpdateProgramExercise(clientId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ exId, patch }: { exId: string; patch: Partial<ProgramExercise> }) =>
      updateProgramExercise(clientId as string, exId, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exercises', clientId] }),
  });
}

export function useCoaches() {
  return useQuery({ queryKey: ['coaches'], queryFn: fetchCoaches });
}

export function useLibrary() {
  return useQuery({ queryKey: ['library'], queryFn: fetchLibrary });
}

/** Add or edit a shared library exercise (id present ⇒ edit). Invalidates the library. */
export function useSaveLibraryExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: LibraryExerciseInput }) => {
      if (id) await updateLibraryExercise(id, input);
      else await addLibraryExercise(input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['library'] }),
  });
}

/** Delete a shared library exercise. Invalidates the library. */
export function useDeleteLibraryExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteLibraryExercise(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['library'] }),
  });
}

export function useReports() {
  return useQuery({ queryKey: ['reports'], queryFn: fetchReports });
}

/** Mark a client's week-N report sent. Invalidates the reports list. */
export function useMarkReportSent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, week, when }: { clientId: string; week: number; when: string }) =>
      markReportSent(clientId, week, when),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  });
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
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['daySessions', date] });
      qc.invalidateQueries({ queryKey: ['session', vars.clientId, date] });
    },
  });
}

/** One client's session doc for a date (attendance + circuit progress). */
export function useSession(clientId: string | undefined, date: string) {
  return useQuery({
    queryKey: ['session', clientId, date],
    queryFn: () => fetchSession(clientId as string, date),
    enabled: !!clientId,
  });
}

/**
 * Tick/untick one circuit set. Optimistic: the cached session updates instantly so
 * the grid responds, rolls back on error, and re-syncs on settle.
 */
export function useSetProgress(clientId: string | undefined, date: string) {
  const qc = useQueryClient();
  const qk = ['session', clientId, date];
  return useMutation({
    mutationFn: ({ key, done }: { key: string; done: boolean }) =>
      setSessionProgress(clientId as string, date, key, done),
    onMutate: async ({ key, done }) => {
      await qc.cancelQueries({ queryKey: qk });
      const prev = qc.getQueryData<SessionDoc | null>(qk);
      qc.setQueryData<SessionDoc | null>(qk, (old) => {
        const progress = { ...(old?.progress ?? {}) };
        if (done) progress[key] = true;
        else delete progress[key];
        return { ...(old ?? {}), progress };
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(qk, ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: qk }),
  });
}

/**
 * Complete (or end-early) a session: the once-only guard + money side-effects live in
 * the service. Not optimistic — billing decrements only on a confirmed server win.
 * Invalidates the session, the client (sessions/program.done changed), and both the
 * per-client and cross-client session-log views.
 */
export function useCompleteSession(clientId: string | undefined, date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { early: boolean; archive: SessionLog }) =>
      completeSession(clientId as string, date, vars),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['session', clientId, date] });
      qc.invalidateQueries({ queryKey: ['client', clientId] });
      qc.invalidateQueries({ queryKey: ['sessionLog', clientId] });
      qc.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

/**
 * Update the signed-in coach's own profile doc. The coach object lives in
 * AuthProvider (not React Query), so the caller refreshes it via refreshCoach() on
 * success rather than invalidating a query key.
 */
export function useSaveProfile(uid: string | undefined) {
  return useMutation({
    mutationFn: (patch: CoachProfilePatch) => saveCoachProfile(uid as string, patch),
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

/** Add a (compressed) progress photo. Invalidates the client's media. */
export function useAddMedia(clientId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (media: NewMedia) => addMedia(clientId as string, media),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['media', clientId] }),
  });
}

/** Delete a progress photo. Invalidates the client's media. */
export function useDeleteMedia(clientId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mediaId: string) => deleteMedia(clientId as string, mediaId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['media', clientId] }),
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
