import { useRef, useState, type CSSProperties } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronDown, Check, ArrowRight, Calendar, Flag, Lock, Pencil, MoreVertical, Plus, SkipForward, Trash2, X } from 'lucide-react';
import {
  useClient,
  useClientExercises,
  useClientSessionLog,
  useCoachNameMap,
  useCompleteSession,
  useMarkAttendance,
  useSession,
  useSessionComments,
  useSetProgress,
  useSetSessionSetLog,
  useSkipSet,
} from '../hooks/useData';
import { useAuth } from '../auth/AuthProvider';
import { useToast } from '../components/Toast';
import AttendanceSheet from '../components/AttendanceSheet';
import EditableNumber from '../components/EditableNumber';
import { catStyle } from '../lib/categories';
import { initials } from '../lib/format';
import { currentProgramWeek, isRepBased, weekLoad } from '../domain/client';
import {
  activeProgramIndex,
  currentRound,
  exerciseTopSet,
  nextExercise,
  programComplete,
  programRounds,
  progressKey,
  roundComplete,
  roundCounts,
  sessionComplete,
  setLogFor,
  sortedComments,
  circuitPrograms,
  ROUNDS,
  type CircuitProgram,
  type CommentWithId,
  type ProgramLabel,
  type Progress,
  type SetLoad,
  type SetLogs,
  type Skips,
} from '../domain/session';
import { sessionDayFor } from '../domain/program';
import { nextWeight, prevWeight } from '../domain/weights';
import type { ProgramExercise, SessionLog } from '../domain/types';

const nowTime = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

/** Rounds ticked for one program (≤ its sets) — the per-program `sets` in the archive. */
function programSets(p: CircuitProgram, progress: Progress): number {
  let n = 0;
  const rounds = programRounds(p);
  for (let r = 1; r <= rounds; r++) if (roundComplete(p, r, progress)) n++;
  return n;
}

const fmtW = (w: number) => (Number.isInteger(w) ? `${w}` : w.toFixed(1));
const round1 = (n: number) => Math.round(n * 10) / 10;
const todayISO = () => new Date().toISOString().slice(0, 10);

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
/** The 3-letter weekday for a YYYY-MM-DD date (local). */
const isoWeekday = (d: string) => WEEKDAY[new Date(d + 'T00:00:00').getDay()];
/** A human date label like "Wed 1 Jul" for the read-only header. */
const isoDateLabel = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

/**
 * Rebuild a completed session's circuit from its permanent archive (sessionLog),
 * so a past session shows the SAME screen a coach sees on completion. The archive
 * holds each program's label, completed rounds (`sets`), and exercise names; we
 * enrich names with the client's current exercise details (reps/weights) when they
 * still exist, and synthesize an all-ticked progress map so every program renders
 * "Completed". Seeded archives predate `setLogs`, so those fall back to prescriptions.
 */
function circuitFromArchive(
  archive: SessionLog,
  list: ProgramExercise[],
): { programs: CircuitProgram[]; progress: Progress } {
  const byName = new Map(list.map((e) => [e.name, e]));
  const programs: CircuitProgram[] = archive.programs.map((ap) => {
    const label = ap.label.replace('Program ', '').trim() as ProgramLabel;
    const exercises = ap.exercises.map(
      (name, i) => byName.get(name) ?? ({ name, target: '', order: i + 1, logs: {} } as ProgramExercise),
    );
    return { label, exercises, sets: ap.sets };
  });
  const progress: Progress = {};
  for (const p of programs) {
    const rounds = p.sets ?? ROUNDS;
    for (let r = 1; r <= rounds; r++) for (const e of p.exercises) progress[progressKey(p.label, r, e.name)] = true;
  }
  return { programs, progress };
}

export default function ClientSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { coach } = useAuth();
  const { data: client, isLoading } = useClient(id);
  const { data: exercises = [] } = useClientExercises(id);
  const coachMap = useCoachNameMap();
  // A `?date=` in the past/future opens the session read-only; no date = today, live.
  const [params] = useSearchParams();
  const dateParam = params.get('date');
  const date = dateParam || todayISO();
  const readOnly = date !== todayISO();
  // For a read-only date, the completed-session archive is the source of truth (the
  // live sessions/{date} doc may not exist for older/seeded sessions).
  const { data: sessionLogs = [] } = useClientSessionLog(readOnly ? id : undefined);
  const archived = readOnly ? sessionLogs.find((r) => r.date === date) : undefined;
  const { data: session } = useSession(id, date);
  const mark = useMarkAttendance(date);
  const setProgress = useSetProgress(id, date);
  const setSetLog = useSetSessionSetLog(id, date);
  const comments = useSessionComments(id, date);
  const skipSet = useSkipSet(id, date);
  const complete = useCompleteSession(id, date);
  const [sheet, setSheet] = useState(false);
  const [endEarly, setEndEarly] = useState(false);
  const [menu, setMenu] = useState(false);
  // The set awaiting a skip reason (the reason modal target); null when closed.
  const [skipFor, setSkipFor] = useState<{ key: string; name: string } | null>(null);

  if (isLoading || !client) {
    return (
      <div className="screen">
        <div className="bar solid">
          <button className="iconbtn" onClick={() => navigate(-1)} aria-label="Back">
            <ChevronLeft />
          </button>
          <div className="bar-title">Today&rsquo;s Session</div>
        </div>
        <div className="cl-loading">Loading…</div>
      </div>
    );
  }

  const attendance = session?.attendance;
  const progress: Progress = session?.progress ?? {};
  const setLogs: SetLogs = session?.setLogs ?? {};
  const skips: Skips = session?.skips ?? {};
  const commentList = sortedComments(session?.comments);
  const note = session?.note ?? '';
  const completed = session?.status === 'completed';
  const list = exercises.filter((e) => !e.future && e.name !== 'Tap to add exercise');
  // Live view plans for today's (or the next) training day; a read-only view plans for
  // exactly the date being viewed, so the shown program matches that weekday.
  const day = readOnly ? isoWeekday(date) : sessionDayFor(client);
  const clientCoach = client.coachId ? coachMap[client.coachId] ?? 'Not assigned' : 'Not assigned';
  const programs = circuitPrograms(list, day, client.program?.sets);
  const week = currentProgramWeek(client);
  const activeIdx = activeProgramIndex(programs, progress);

  // Open the dedicated program editor for today's day + current week.
  function openProgramEdit() {
    const q = new URLSearchParams();
    if (day) q.set('day', day);
    q.set('week', String(week));
    navigate(`/clients/${client!.id}/program/edit?${q.toString()}`);
  }

  function markPresent() {
    if (!coach?.id) return toast('Not signed in');
    mark.mutate({ clientId: client!.id, status: 'present', markedBy: coach.id }, { onError: () => toast('Could not start') });
  }

  function pickAttendance(status: 'present' | 'absent' | 'cancelled') {
    if (!coach?.id) return toast('Not signed in');
    mark.mutate({ clientId: client!.id, status, markedBy: coach.id }, { onError: () => toast('Could not save') });
    setSheet(false);
  }

  function toggleSet(key: string, done: boolean) {
    setProgress.mutate({ key, done });
  }

  // Persist one set's worked load (weight/reps). Stored on the session doc so it
  // survives reload and folds into the per-week log on completion.
  function logSet(key: string, load: SetLoad) {
    setSetLog.mutate({ key, load });
  }

  // Skip flow: a kebab "Skip this set" opens the reason modal (requestSkip); confirming
  // records the reason + ticks the set so the circuit advances to the next exercise.
  function requestSkip(key: string, name: string) {
    setSkipFor({ key, name });
  }
  function confirmSkip(reason: string) {
    if (skipFor) skipSet.mutate({ key: skipFor.key, reason }, { onError: () => toast('Could not skip set') });
    setSkipFor(null);
  }

  function buildArchive(early: boolean): SessionLog {
    const counts = roundCounts(programs, progress);
    return {
      date,
      when: nowTime(),
      early,
      roundsCompleted: counts.done,
      totalRounds: counts.total,
      programs: programs.map((p) => ({
        label: p.label,
        sets: programSets(p, progress),
        exercises: p.exercises.map((e) => e.name),
      })),
      setLogs,
      ...(Object.keys(skips).length ? { skips } : {}),
      ...(session?.comments && Object.keys(session.comments).length ? { comments: session.comments } : {}),
      ...(note ? { note } : {}),
    };
  }

  // Comment thread handlers (add / edit / delete). Each stamps the authoring coach + time.
  function addComment(text: string) {
    if (!coach?.id) return toast('Not signed in');
    const id = `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
    comments.add.mutate(
      { id, comment: { by: coach.id, text, at: new Date().toISOString() } },
      { onError: () => toast('Could not add comment') },
    );
  }
  function editComment(id: string, text: string) {
    comments.edit.mutate({ id, text, editedAt: new Date().toISOString() }, { onError: () => toast('Could not save comment') });
  }
  function deleteComment(id: string) {
    comments.remove.mutate({ id }, { onError: () => toast('Could not delete comment') });
  }

  // Each performed exercise's top set → its per-week log, so the progress charts
  // reflect what was actually worked this session.
  function buildWeekLogs() {
    const out: { exId: string; week: number; w: number; r: number }[] = [];
    for (const p of programs) {
      for (const ex of p.exercises) {
        const top = exerciseTopSet(setLogs, p.label, ex.name, programRounds(p));
        if (top && ex.id) out.push({ exId: ex.id, week, w: top.w, r: top.r });
      }
    }
    return out;
  }

  function finish(early: boolean) {
    setEndEarly(false);
    complete.mutate(
      { early, archive: buildArchive(early), weekLogs: buildWeekLogs() },
      {
        onError: () => toast('Could not complete session'),
        onSuccess: () => toast(early ? 'Session ended early' : 'Session completed'),
      },
    );
  }

  const cat = catStyle(client.category);
  const avaStyle = { '--c-bg': cat.b, '--c-fg': cat.c } as CSSProperties;
  const present = attendance === 'present';
  const closed = attendance === 'absent' || attendance === 'cancelled';
  const allDone = sessionComplete(programs, progress);
  const counts = roundCounts(programs, progress);
  // Pre-start: not yet present, with a program to run — the state that shows the
  // slide-to-start footer (rendered outside .screen so it's pinned to the frame bottom).
  const preStart = !completed && !closed && !present && programs.length > 0;

  // Read-only view of a past/future session: no attendance controls, no ticking —
  // just what happened (completed / attendance) or, for an untouched day, the plan.
  if (readOnly) {
    const past = date < todayISO();
    // A completed session is reconstructed from its archive (the permanent record);
    // this drives the SAME completed screen the coach sees right after finishing.
    const rebuilt = archived ? circuitFromArchive(archived, list) : null;
    const isCompleted = !!archived || completed;
    const dispPrograms = rebuilt ? rebuilt.programs : programs;
    const dispProgress = rebuilt ? rebuilt.progress : progress;
    const dispSetLogs = archived?.setLogs ?? setLogs;
    const dispSkips = archived?.skips ?? skips;
    const roundsDone = archived ? archived.roundsCompleted : counts.done;
    const roundsTotal = archived ? archived.totalRounds : counts.total;
    const endedEarly = archived ? archived.early : !!session?.early;
    const recorded = !!session; // a live session doc exists ⇒ something was marked
    return (
      <div className="screen">
        <div className="bar solid">
          <button className="iconbtn" onClick={() => navigate(-1)} aria-label="Back">
            <ChevronLeft />
          </button>
          <div className="bar-title">Session · {isoDateLabel(date)}</div>
        </div>

        <div className="se-card tap" onClick={() => navigate(`/clients/${client.id}`)}>
          <div className="dava se-ava tint-cat" style={avaStyle}>
            {initials(client.name)}
          </div>
          <div className="se-id">
            <div className="se-name-row">
              <span className="se-name">{client.name}</span>
            </div>
            <div className="se-meta">
              {day ? `${day} · ` : ''}Week {week} · {client.time} · {clientCoach}
            </div>
          </div>
          <span className="se-chev">
            <ChevronRight />
          </span>
        </div>

        {isCompleted ? (
          <div className="sx-complete2">
            <div className="scx-row">
              <span className="scx-ic">
                <Check size={15} />
              </span>
              <span className="scx-t">Session completed</span>
            </div>
            <span className="scx-s">
              {roundsDone}/{roundsTotal} rounds{endedEarly ? ' · ended early' : ''}
            </span>
          </div>
        ) : closed ? (
          <div className="sx-closed">
            <div className="sx-closed-ic">{attendance === 'absent' ? '✕' : '🚫'}</div>
            <div className="sx-closed-t">Session {attendance}</div>
            <div className="sx-closed-s">
              {attendance === 'absent' ? 'Marked as a missed session.' : 'This session was cancelled.'}
            </div>
          </div>
        ) : recorded ? (
          <div className="wkbanner pad-h">Session started but not completed — {counts.done}/{counts.total} rounds.</div>
        ) : dispPrograms.length ? (
          <div className="wkbanner pad-h">
            {past ? 'No session was recorded for this day.' : 'Upcoming session — not started yet.'} Showing the planned
            program.
          </div>
        ) : null}

        {closed || dispPrograms.length === 0 ? (
          dispPrograms.length === 0 && (
            <div className="empty">
              <div className="em">🏋️</div>
              <p>No exercises planned for this day.</p>
            </div>
          )
        ) : (
          dispPrograms.map((p, i) => (
            <ProgramBlock
              key={p.label}
              program={p}
              pIdx={i}
              activeIdx={-1}
              progress={dispProgress}
              week={week}
              setLogs={dispSetLogs}
              skips={dispSkips}
            />
          ))
        )}

        <CommentsView
          comments={sortedComments(archived?.comments ?? session?.comments)}
          legacyNote={archived?.note ?? session?.note}
          coachMap={coachMap}
        />

        <div className="sp24" />
      </div>
    );
  }

  return (
    <>
    <div className="screen">
      <div className="bar solid">
        <button className="iconbtn" onClick={() => navigate(-1)} aria-label="Back">
          <ChevronLeft />
        </button>
        <div className="bar-title">Today&rsquo;s Session</div>
        <button className="iconbtn" onClick={() => setMenu(true)} aria-label="Session options">
          <MoreVertical />
        </button>
      </div>

      <div className="se-card tap" onClick={() => navigate(`/clients/${client.id}`)}>
        <div className="dava se-ava tint-cat" style={avaStyle}>
          {initials(client.name)}
        </div>
        <div className="se-id">
          <div className="se-name-row">
            <span className="se-name">{client.name}</span>
            {present && !completed && <span className="se-present">✓ Present</span>}
          </div>
          <div className="se-meta">
            {day ? `${day} · ` : ''}Week {week} · {client.time} · {clientCoach}
          </div>
        </div>
        <span className="se-chev">
          <ChevronRight />
        </span>
      </div>

      {completed ? (
        <>
          <div className="sx-complete2">
            <div className="scx-row">
              <span className="scx-ic">
                <Check size={15} />
              </span>
              <span className="scx-t">Session completed</span>
            </div>
            <span className="scx-s">All done for today.</span>
          </div>
          {programs.map((p, i) => (
            <ProgramBlock key={p.label} program={p} pIdx={i} activeIdx={-1} progress={progress} week={week} setLogs={setLogs} skips={skips} />
          ))}
          <CommentsView comments={commentList} legacyNote={note} coachMap={coachMap} />
        </>
      ) : closed ? (
        <div className="sx-closed">
          <div className="sx-closed-ic">{attendance === 'absent' ? '✕' : '🚫'}</div>
          <div className="sx-closed-t">Session {attendance}</div>
          <div className="sx-closed-s">
            {attendance === 'absent' ? 'Marked as a missed session.' : 'This session was cancelled.'}
          </div>
          <button className="sx-undo" onClick={() => pickAttendance('present')}>
            Mark present instead
          </button>
        </div>
      ) : programs.length === 0 ? (
        <div className="se-empty">
          <img className="se-art" src="/assets/images/empty-session.png" alt="" />
          <div className="se-title">No programs yet</div>
          <div className="se-sub">
            Add a program and exercises to build<br />the perfect workout for your client.
          </div>
          <button className="bigbtn se-add" onClick={openProgramEdit}>
            <Plus size={18} /> Add program
          </button>
          <div className="se-or">OR</div>
          <button className="se-notpresent" onClick={() => setSheet(true)}>
            <Calendar /> Mark as not present
          </button>
        </div>
      ) : !present ? (
        <>
          <div className="sx-prelock-hint">
            <Lock size={14} /> Slide to mark present to start
          </div>
          <div className="sx-prelock">
            {programs.map((p, i) => (
              <ProgramBlock key={p.label} program={p} pIdx={i} activeIdx={-1} progress={progress} week={week} setLogs={setLogs} skips={skips} />
            ))}
          </div>
          <button className="sess-modify2" onClick={openProgramEdit}>
            <span className="sm2-ic">
              <Pencil size={16} />
            </span>
            Create / modify program
          </button>
        </>
      ) : (
        <>
          {programs.map((p, i) => (
            <ProgramBlock
              key={p.label}
              program={p}
              pIdx={i}
              activeIdx={activeIdx}
              progress={progress}
              week={week}
              setLogs={setLogs}
              skips={skips}
              collapsible
              onToggle={toggleSet}
              onLogSet={logSet}
              onRequestSkip={requestSkip}
            />
          ))}
          <SessionComments
            comments={commentList}
            legacyNote={note}
            coachId={coach?.id}
            coachMap={coachMap}
            onAdd={addComment}
            onEdit={editComment}
            onDelete={deleteComment}
          />
          {allDone && (
            <div className="bottom-cta sticky-cta">
              <button className="bigbtn" onClick={() => finish(false)} disabled={complete.isPending}>
                <Check size={18} /> {complete.isPending ? 'Saving…' : 'Complete session'}
              </button>
            </div>
          )}
        </>
      )}

      <div className="sp24" />

      {menu && (
        <div className="modal-overlay" onClick={() => setMenu(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">Session options</div>
            <div className="modal-opts">
              <button
                className="modal-opt"
                onClick={() => {
                  setMenu(false);
                  setSheet(true);
                }}
              >
                <span className="mo-ic bg-amber t-amber">
                  <Calendar size={20} />
                </span>
                Change attendance
                <span className="mo-cur" />
              </button>
              <button
                className="modal-opt"
                onClick={() => {
                  setMenu(false);
                  openProgramEdit();
                }}
              >
                <span className="mo-ic bg-blue t-blue">
                  <Pencil size={20} />
                </span>
                Edit programs &amp; rounds
                <span className="mo-cur" />
              </button>
              {present && !completed && !allDone && (
                <button
                  className="modal-opt"
                  onClick={() => {
                    setMenu(false);
                    setEndEarly(true);
                  }}
                >
                  <span className="mo-ic bg-amber t-amber">
                    <Flag size={20} />
                  </span>
                  End session early
                  <span className="mo-cur" />
                </button>
              )}
            </div>
            <button className="modal-cancel" onClick={() => setMenu(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {sheet && (
        <AttendanceSheet
          name={client.name}
          current={attendance}
          onPick={pickAttendance}
          onClose={() => setSheet(false)}
        />
      )}

      {skipFor && <SkipReasonSheet name={skipFor.name} onSkip={confirmSkip} onCancel={() => setSkipFor(null)} />}

      {endEarly && (
        <div className="modal-overlay" onClick={() => setEndEarly(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">End session early?</div>
            <p className="modal-note">
              {counts.done} of {counts.total} rounds done. This counts as a completed session and uses one from
              {' '}
              {client.name.split(' ')[0]}&rsquo;s package.
            </p>
            <div className="modal-opts">
              <button className="bigbtn" onClick={() => finish(true)} disabled={complete.isPending}>
                <Flag size={16} /> {complete.isPending ? 'Saving…' : 'End session early'}
              </button>
            </div>
            <button className="modal-cancel" onClick={() => setEndEarly(false)}>
              Keep going
            </button>
          </div>
        </div>
      )}
    </div>

    {/* Rendered outside .screen so the flex column pins it to the bottom of the frame,
        regardless of how short the (locked) program preview is. */}
    {preStart && (
      <div className="sx-start-bar">
        <SlideToStart
          label={mark.isPending ? 'Starting…' : 'Slide to mark present & start'}
          disabled={mark.isPending}
          onComplete={markPresent}
        />
        <div className="slide-more">
          <button onClick={() => setSheet(true)}>Not present? More options</button>
        </div>
      </div>
    )}
    </>
  );
}

// Slide-to-mark-present, ported from the prototype wireSlide(): drag the knob right;
// release past the end commits (onComplete), otherwise it springs back. Knob position
// is set imperatively during the gesture (transient state, not rendered markup).
function SlideToStart({
  label,
  disabled,
  onComplete,
}: {
  label: string;
  disabled?: boolean;
  onComplete: () => void;
}) {
  const PAD = 4;
  const KNOB = 54;
  const trackRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, x: 0 });

  const maxX = () => Math.max(0, (trackRef.current?.clientWidth ?? 0) - KNOB - PAD * 2);
  const moveTo = (px: number) => {
    const m = maxX();
    const x = Math.max(0, Math.min(m, px));
    drag.current.x = x;
    if (knobRef.current) knobRef.current.style.left = `${PAD + x}px`;
    if (fillRef.current) fillRef.current.style.width = `${KNOB + x}px`;
    if (labelRef.current) labelRef.current.style.opacity = String(1 - (m ? x / m : 0) * 1.4);
  };
  const clearTransition = () => {
    if (knobRef.current) knobRef.current.style.transition = '';
    if (fillRef.current) fillRef.current.style.transition = '';
  };

  function onDown(e: React.PointerEvent) {
    if (disabled) return;
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    clearTransition();
    drag.current.active = true;
    drag.current.startX = e.clientX - drag.current.x;
  }
  function onMove(e: React.PointerEvent) {
    if (!drag.current.active) return;
    moveTo(e.clientX - drag.current.startX);
  }
  function onUp() {
    if (!drag.current.active) return;
    drag.current.active = false;
    const m = maxX();
    if (drag.current.x >= m - 6) {
      moveTo(m);
      onComplete();
      return;
    }
    if (knobRef.current) knobRef.current.style.transition = 'left .2s';
    if (fillRef.current) fillRef.current.style.transition = 'width .2s';
    moveTo(0);
    if (labelRef.current) labelRef.current.style.opacity = '1';
    setTimeout(clearTransition, 220);
  }

  return (
    <div className="slide-wrap">
      <div className="slide-track" ref={trackRef}>
        <div className="slide-fill" ref={fillRef} />
        <div className="slide-label" ref={labelRef}>
          {label}
        </div>
        <div
          className="slide-knob"
          ref={knobRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          aria-label="Slide to mark present"
        >
          ›
        </div>
      </div>
    </div>
  );
}

// One program (A/B) as a per-set grid. Idle/done programs fold to a mini header
// (when collapsible); the active program's current exercise gets an editable
// weight/reps card and the whole card taps to tick the current set.
function ProgramBlock({
  program,
  pIdx,
  activeIdx,
  progress,
  week,
  setLogs,
  skips,
  collapsible = false,
  onToggle,
  onLogSet,
  onRequestSkip,
}: {
  program: CircuitProgram;
  pIdx: number;
  activeIdx: number;
  progress: Progress;
  week: number;
  setLogs: SetLogs;
  skips: Skips;
  collapsible?: boolean;
  onToggle?: (key: string, done: boolean) => void;
  onLogSet?: (key: string, load: SetLoad) => void;
  onRequestSkip?: (key: string, name: string) => void;
}) {
  const rounds = programRounds(program);
  const done = programComplete(program, progress);
  const active = pIdx === activeIdx && !done;
  const idle = !done && !active;
  const curR = active ? currentRound(program, progress) : 0;
  const nextName = active ? nextExercise(program, curR, progress) : null;
  const state = done ? 'done' : active ? 'active' : 'idle';

  // Idle/done programs can fold away; the active one always stays open.
  const foldable = collapsible && !active;
  const [open, setOpen] = useState(false);
  const expanded = !foldable || open;
  // The current set's editable card (only one set is edited at a time).
  const [editName, setEditName] = useState<string | null>(null);
  const editing = !!nextName && editName === nextName;

  const pill = done ? (
    <span className="pgm-pill done">
      <Check size={13} /> Completed
    </span>
  ) : active ? (
    <span className="pgm-pill live">In progress</span>
  ) : (
    <span className="pgm-pill idle">Yet to start</span>
  );
  const setsLbl = done ? `${rounds}/${rounds} sets` : active ? `${curR}/${rounds} sets` : '';

  // The load shown for one row: its session per-set value (carried forward) when the
  // program has started, else the week's prescription. Mirrors the editable card.
  const rowLoad = (ex: ProgramExercise): SetLoad =>
    idle ? weekLoad(ex, week) : setLogFor(setLogs, program.label, active ? curR : 0, ex.name, weekLoad(ex, week));

  function bump(name: string, k: 'w' | 'r', delta: number) {
    if (!onLogSet) return;
    const cur = setLogFor(setLogs, program.label, curR, name, weekLoad(program.exercises.find((e) => e.name === name)!, week));
    const next: SetLoad =
      k === 'w' ? { w: Math.max(0, round1(cur.w + delta * 2.5)), r: cur.r } : { w: cur.w, r: Math.max(1, cur.r + delta) };
    onLogSet(progressKey(program.label, curR, name), next);
  }

  // Set an exact weight from the gym-weights picker (reps untouched).
  function setWeightAbs(name: string, w: number) {
    if (!onLogSet) return;
    const cur = setLogFor(setLogs, program.label, curR, name, weekLoad(program.exercises.find((e) => e.name === name)!, week));
    onLogSet(progressKey(program.label, curR, name), { w, r: cur.r });
  }

  function tickCurrent(name: string) {
    if (!onToggle) return;
    setEditName(null);
    const key = progressKey(program.label, curR, name);
    onToggle(key, !progress[key]);
  }

  return (
    <div className={`pgm-card ${state}${foldable && !open ? ' mini' : ''}${foldable ? ' foldable' : ''}`}>
      <div className="pgm-head" onClick={foldable ? () => setOpen((o) => !o) : undefined}>
        <div className="pgm-title-wrap">
          <span className="pgm-title">Program {program.label}</span>
          {pill}
        </div>
        <span className="pgm-head-right">
          {setsLbl && <span className="pgm-sets">{setsLbl}</span>}
          {foldable && (
            <span className={`pgm-chev${open ? ' up' : ''}`}>
              <ChevronDown size={18} />
            </span>
          )}
        </span>
      </div>

      {expanded && (
        <>
          <div className="pgm-cols">
            <span className="pgm-cols-lbl">Exercises</span>
            {!idle && (
              <span className="pgm-setcols">
                {Array.from({ length: rounds }, (_, i) => (
                  <span key={i}>Set {i + 1}</span>
                ))}
              </span>
            )}
          </div>

          <div className="pgm-rows">
            {program.exercises.map((ex: ProgramExercise) => {
              const load = rowLoad(ex);
              const rep = isRepBased(ex);
              const isCur = active && ex.name === nextName;
              const main = (
                <div className="pgm-ex-main">
                  <div className="pgm-ex-name">{ex.name}</div>
                  {/* reps · weight. Rep/time exercises (walks, planks) carry no external
                      load — never print a bogus weight. */}
                  <div className="pgm-ex-sub">
                    {rep ? (
                      <span>Bodyweight</span>
                    ) : (
                      <>
                        <span>
                          {load.r} rep{load.r === 1 ? '' : 's'}
                        </span>
                        <i className="pgm-dot" />
                        <span>{load.w > 0 ? `${fmtW(load.w)}kg weights` : 'No weights'}</span>
                      </>
                    )}
                  </div>
                </div>
              );
              const cells = !idle && (
                <div className="pgm-cells">
                  {Array.from({ length: rounds }, (_, i) => {
                    const r = i + 1;
                    const key = progressKey(program.label, r, ex.name);
                    const cellSkipped = !!skips[key];
                    const cellDone = !!progress[key] && !cellSkipped;
                    const curCell = active && r === curR && isCur && !cellDone && !cellSkipped;
                    return (
                      <span className="pgm-cell" key={r}>
                        <span
                          className={`pgm-set${cellSkipped ? ' skipped' : cellDone ? ' done' : curCell ? ' cur' : ''}`}
                          title={cellSkipped ? `Skipped${skips[key]?.reason ? `: ${skips[key]!.reason}` : ''}` : undefined}
                        >
                          {cellSkipped ? (
                            <SkipForward size={12} />
                          ) : cellDone ? (
                            <Check size={13} />
                          ) : curCell ? (
                            <ArrowRight size={13} />
                          ) : (
                            ''
                          )}
                        </span>
                      </span>
                    );
                  })}
                </div>
              );

              // The current exercise: orange card wrapping the (bare) row + editable
              // set card. The whole card ticks the current set on tap (unless editing).
              if (isCur) {
                return (
                  <div
                    key={ex.id ?? ex.name}
                    className={`pgm-cur-card${editing ? '' : ' tap'}`}
                    {...(editing
                      ? {}
                      : {
                          role: 'button',
                          tabIndex: 0,
                          'aria-label': `Complete ${ex.name} set ${curR}`,
                          onClick: () => tickCurrent(ex.name),
                        })}
                  >
                    <div className="pgm-ex bare">
                      {main}
                      {cells}
                    </div>
                    <SetCard
                      rep={rep}
                      load={load}
                      editing={editing}
                      onToggleEdit={() => setEditName((p) => (p === ex.name ? null : ex.name))}
                      onBump={(k, d) => bump(ex.name, k, d)}
                      onSetWeight={onLogSet ? (w) => setWeightAbs(ex.name, w) : undefined}
                      onSkip={
                        onRequestSkip
                          ? () => onRequestSkip(progressKey(program.label, curR, ex.name), ex.name)
                          : undefined
                      }
                    />
                  </div>
                );
              }
              return (
                <div className={`pgm-ex${idle ? ' idle' : ''}`} key={ex.id ?? ex.name}>
                  {main}
                  {cells}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// The editable weight/reps card under the current exercise: two value pills + a pencil
// (collapsed), or two steppers + cancel/confirm (editing). Steppers persist live, so
// both ✕ and ✓ simply collapse the editor (the edited load is already saved).
function SetCard({
  rep,
  load,
  editing,
  onToggleEdit,
  onBump,
  onSetWeight,
  onSkip,
}: {
  rep: boolean;
  load: SetLoad;
  editing: boolean;
  onToggleEdit: () => void;
  onBump: (k: 'w' | 'r', delta: number) => void;
  onSetWeight?: (w: number) => void;
  onSkip?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const unit = rep ? '' : ' kg';
  const lbl = rep ? 'Level' : 'Weight';
  const wDisp = fmtW(load.w);
  if (!editing) {
    return (
      <div className="pgm-setcard">
        <div className="psc-pill">
          <span className="psc-lbl">Rep</span>
          <span className="psc-val">{load.r}</span>
        </div>
        <div className="psc-pill">
          <span className="psc-lbl">{lbl}</span>
          <span className="psc-val">
            {wDisp}
            {unit}
          </span>
        </div>
        <button
          className="psc-edit"
          onClick={(e) => {
            e.stopPropagation();
            onToggleEdit();
          }}
          aria-label="Edit set load"
        >
          <Pencil size={16} />
        </button>
        {onSkip && (
          <div className="psc-more">
            <button
              className="psc-edit"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((o) => !o);
              }}
              aria-label="More set options"
            >
              <MoreVertical size={16} />
            </button>
            {menuOpen && (
              <>
                <div
                  className="psc-menu-backdrop"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                  }}
                />
                <div className="psc-menu" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="psc-menu-item"
                    onClick={() => {
                      setMenuOpen(false);
                      onSkip();
                    }}
                  >
                    <SkipForward size={15} /> Skip this set
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="pgm-setcard editing" onClick={(e) => e.stopPropagation()}>
      <div className="psc-step">
        <div className="psc-step-lbl">Rep</div>
        <div className="psc-step-ctl">
          <button className="psc-stp" onClick={() => onBump('r', -1)} aria-label="Fewer reps">
            −
          </button>
          <span className="psc-step-val">{load.r}</span>
          <button className="psc-stp" onClick={() => onBump('r', 1)} aria-label="More reps">
            +
          </button>
        </div>
      </div>
      <div className="psc-step">
        <div className="psc-step-lbl">{lbl}</div>
        <div className="psc-step-ctl">
          <button
            className="psc-stp"
            onClick={() => (rep || !onSetWeight ? onBump('w', -1) : onSetWeight(prevWeight(load.w)))}
            aria-label="Less"
          >
            −
          </button>
          {rep || !onSetWeight ? (
            <span className="psc-step-val">
              {wDisp}
              {unit}
            </span>
          ) : (
            <EditableNumber
              value={load.w}
              onCommit={onSetWeight}
              className="psc-step-val"
              inputClassName="psc-step-val psc-step-input"
              suffix={unit}
            />
          )}
          <button
            className="psc-stp"
            onClick={() => (rep || !onSetWeight ? onBump('w', 1) : onSetWeight(nextWeight(load.w)))}
            aria-label="More"
          >
            +
          </button>
        </div>
      </div>
      <div className="psc-acts">
        <button className="psc-x" onClick={onToggleEdit} aria-label="Cancel">
          <X size={16} />
        </button>
        <button className="psc-ok" onClick={onToggleEdit} aria-label="Save set">
          <Check size={16} />
        </button>
      </div>
    </div>
  );
}

// "Wed 1 Jul, 14:30" — the human stamp shown under a comment's author.
const fmtCommentTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

// One comment: author + timestamp header, its text, and — when the current coach owns
// it — a kebab holding Edit / Delete (edit opens the shared bottom-sheet composer).
function CommentBubble({
  c,
  coachMap,
  editable = false,
  onEditReq,
  onDelete,
}: {
  c: CommentWithId;
  coachMap: Record<string, string>;
  editable?: boolean;
  onEditReq?: (c: CommentWithId) => void;
  onDelete?: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const name = coachMap[c.by] || 'Coach';
  return (
    <div className="cmt">
      <div className="cmt-head">
        <span className="cmt-name">{name}</span>
        <span className="cmt-time">
          {fmtCommentTime(c.at)}
          {c.editedAt ? ' · edited' : ''}
        </span>
        {editable && (
          <div className="cmt-more">
            <button className="cmt-tool" aria-label="Comment options" onClick={() => setMenuOpen((o) => !o)}>
              <MoreVertical size={16} />
            </button>
            {menuOpen && (
              <>
                <div className="psc-menu-backdrop" onClick={() => setMenuOpen(false)} />
                <div className="psc-menu cmt-menu">
                  <button
                    className="psc-menu-item"
                    onClick={() => {
                      setMenuOpen(false);
                      onEditReq?.(c);
                    }}
                  >
                    <Pencil size={15} /> Edit
                  </button>
                  <button
                    className="psc-menu-item danger"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete?.(c.id);
                    }}
                  >
                    <Trash2 size={15} /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <div className="cmt-text">{c.text}</div>
    </div>
  );
}

// Bottom-sheet composer for adding or editing a comment (mobile-first, not an inline box).
function CommentSheet({
  title,
  initial,
  submitLabel,
  onSubmit,
  onClose,
}: {
  title: string;
  initial: string;
  submitLabel: string;
  onSubmit: (text: string) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(initial);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-title">{title}</div>
        <div className="cmt-sheet-field">
          <textarea
            className="as-textarea sess-notes-ta"
            value={text}
            placeholder="Form cues, pain, PRs, things to carry into next session…"
            onChange={(e) => setText(e.target.value)}
            autoFocus
          />
        </div>
        <div className="modal-opts cmt-sheet-acts">
          <button className="bigbtn" disabled={!text.trim()} onClick={() => onSubmit(text.trim())}>
            {submitLabel}
          </button>
          <button className="bigbtn ghost cmt-sheet-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// Editable comment thread (present, in-progress session): header + "Add comment" button,
// the list (or an empty state), and the bottom-sheet composer for add / edit.
function SessionComments({
  comments,
  legacyNote,
  coachId,
  coachMap,
  onAdd,
  onEdit,
  onDelete,
}: {
  comments: CommentWithId[];
  legacyNote?: string;
  coachId?: string;
  coachMap: Record<string, string>;
  onAdd: (text: string) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}) {
  // null = closed; {} = add; {c} = editing that comment.
  const [sheet, setSheet] = useState<{ c?: CommentWithId } | null>(null);
  return (
    <div className="sess-notes">
      <div className="sess-notes-h">
        <div className="sess-notes-lbl">Session notes</div>
        <button className="cmt-add-btn" onClick={() => setSheet({})}>
          <Plus size={15} /> Add comment
        </button>
      </div>
      {legacyNote && <div className="cmt-legacy">{legacyNote}</div>}
      {comments.length > 0 ? (
        <div className="cmt-list">
          {comments.map((c) => (
            <CommentBubble
              key={c.id}
              c={c}
              coachMap={coachMap}
              editable={!!coachId && c.by === coachId}
              onEditReq={(cc) => setSheet({ c: cc })}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        !legacyNote && <div className="cmt-empty">No comment added</div>
      )}

      {sheet && (
        <CommentSheet
          title={sheet.c ? 'Edit comment' : 'Add comment'}
          initial={sheet.c?.text ?? ''}
          submitLabel={sheet.c ? 'Save changes' : 'Add comment'}
          onSubmit={(text) => {
            if (sheet.c) onEdit(sheet.c.id, text);
            else onAdd(text);
            setSheet(null);
          }}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  );
}

// Read-only comment thread (completed / past sessions). Hidden entirely when empty.
function CommentsView({
  comments,
  legacyNote,
  coachMap,
}: {
  comments: CommentWithId[];
  legacyNote?: string;
  coachMap: Record<string, string>;
}) {
  if (comments.length === 0 && !legacyNote) return null;
  return (
    <div className="sess-notes">
      <div className="sess-notes-lbl">Session notes</div>
      {legacyNote && <div className="cmt-legacy">{legacyNote}</div>}
      {comments.length > 0 && (
        <div className="cmt-list">
          {comments.map((c) => (
            <CommentBubble key={c.id} c={c} coachMap={coachMap} />
          ))}
        </div>
      )}
    </div>
  );
}

// Reason prompt shown before a set is skipped. The reason is optional (Skip stays
// enabled) but persisted with the skip so the coach's context isn't lost.
function SkipReasonSheet({
  name,
  onSkip,
  onCancel,
}: {
  name: string;
  onSkip: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-title">Skip this set?</div>
        <p className="modal-note">
          Skipping {name} moves on to the next exercise. Add a reason so it&rsquo;s recorded with the session.
        </p>
        <textarea
          className="as-textarea sess-notes-ta"
          value={reason}
          placeholder="Reason (e.g. shoulder pain, ran out of time, equipment busy)…"
          onChange={(e) => setReason(e.target.value)}
          autoFocus
        />
        <div className="modal-opts">
          <button className="bigbtn" onClick={() => onSkip(reason.trim())}>
            <SkipForward size={16} /> Skip this set
          </button>
        </div>
        <button className="modal-cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
