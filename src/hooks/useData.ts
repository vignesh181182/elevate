import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addProgramExercises,
  createClient,
  fetchClient,
  fetchClientExercises,
  fetchClients,
  removeProgramExercise,
  reorderProgramExercises,
  completeWelcome,
  fetchProgramHistory,
  patchClient,
  saveAssessment,
  saveWeekLoads,
  setClientSchedule,
  setProgramSets,
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
  setSessionSetLog,
  type WeekLogWrite,
} from '../services/sessions';
import { addMedia, deleteMedia, fetchMedia, type NewMedia } from '../services/media';
import { fetchReports, markReportSent } from '../services/reports';
import { fetchBilling, fetchBillingSummaries, fetchPayments, savePayment } from '../services/payments';
import { billingAdjustment } from '../domain/payments';
import { useIsMainCoach } from '../auth/AuthProvider';
import type { Attendance, Client, ClientStatus, Coach, Payment, ProgramExercise, SessionDoc, SessionLog } from '../domain/types';

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

/** Complete onboarding: save the welcome note + activate. Invalidates client + list. */
export function useCompleteWelcome(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (message: string) => completeWelcome(id as string, message),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client', id] });
      qc.invalidateQueries({ queryKey: ['clients'] });
    },
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

/** A client's archived past programs (newest-first handled in the UI). */
export function useProgramHistory(id: string | undefined) {
  return useQuery({
    queryKey: ['programHistory', id],
    queryFn: () => fetchProgramHistory(id as string),
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

/** Append picked library exercises to a client's program (optionally into a day's A/B slot). */
export function useAddProgramExercises(clientId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ items, slot }: { items: NewProgramExercise[]; slot?: { day: string; prog: 'A' | 'B' } }) =>
      addProgramExercises(clientId as string, items, slot),
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

/**
 * Set a program's session-circuit sets (A or B). Optimistic: the cached client
 * updates instantly so the stepper responds, rolls back on error, re-syncs on settle.
 */
export function useSetProgramSets(clientId: string | undefined) {
  const qc = useQueryClient();
  const qk = ['client', clientId];
  return useMutation({
    mutationFn: ({ label, n }: { label: 'A' | 'B'; n: number }) =>
      setProgramSets(clientId as string, label, n),
    onMutate: async ({ label, n }) => {
      await qc.cancelQueries({ queryKey: qk });
      const prev = qc.getQueryData<Client | null>(qk);
      qc.setQueryData<Client | null>(qk, (old) =>
        old?.program ? { ...old, program: { ...old.program, sets: { ...old.program.sets, [label]: n } } } : old,
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(qk, ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: qk }),
  });
}

/**
 * Persist a new exercise order. Optimistic: the cached exercises reorder instantly
 * (and their `order` fields update) so inline drag-to-reorder sticks without a
 * refetch flicker; rolls back on error, re-syncs on settle.
 */
export function useReorderProgramExercises(clientId: string | undefined) {
  const qc = useQueryClient();
  const qk = ['exercises', clientId];
  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderProgramExercises(clientId as string, orderedIds),
    onMutate: async (orderedIds) => {
      await qc.cancelQueries({ queryKey: qk });
      const prev = qc.getQueryData<ProgramExercise[]>(qk);
      if (prev) {
        const rank = new Map(orderedIds.map((id, i) => [id, i + 1]));
        const next = prev
          .map((e) => (rank.has(e.id as string) ? { ...e, order: rank.get(e.id as string)! } : e))
          .sort((a, b) => a.order - b.order);
        qc.setQueryData<ProgramExercise[]>(qk, next);
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(qk, ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: qk }),
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
 * Record one set's actual weight/reps. Optimistic: the cached session's setLogs updates
 * instantly so the editor + carry-forward respond, rolls back on error, re-syncs on settle.
 */
export function useSetSessionSetLog(clientId: string | undefined, date: string) {
  const qc = useQueryClient();
  const qk = ['session', clientId, date];
  return useMutation({
    mutationFn: ({ key, load }: { key: string; load: { w: number; r: number } }) =>
      setSessionSetLog(clientId as string, date, key, load),
    onMutate: async ({ key, load }) => {
      await qc.cancelQueries({ queryKey: qk });
      const prev = qc.getQueryData<SessionDoc | null>(qk);
      qc.setQueryData<SessionDoc | null>(qk, (old) => ({
        ...(old ?? {}),
        setLogs: { ...(old?.setLogs ?? {}), [key]: load },
      }));
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
    mutationFn: (vars: { early: boolean; archive: SessionLog; weekLogs?: WeekLogWrite[] }) =>
      completeSession(clientId as string, date, vars),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['session', clientId, date] });
      qc.invalidateQueries({ queryKey: ['client', clientId] });
      qc.invalidateQueries({ queryKey: ['sessionLog', clientId] });
      qc.invalidateQueries({ queryKey: ['exercises', clientId] }); // top sets folded into per-week logs → charts
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
