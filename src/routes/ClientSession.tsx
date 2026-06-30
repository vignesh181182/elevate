import { useRef, useState, type CSSProperties } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, ArrowRight, Clock, Flag, Lock, Pencil } from 'lucide-react';
import {
  useClient,
  useClientExercises,
  useCoachNameMap,
  useCompleteSession,
  useMarkAttendance,
  useSession,
  useSetProgress,
} from '../hooks/useData';
import { useAuth } from '../auth/AuthProvider';
import { useToast } from '../components/Toast';
import AttendanceSheet from '../components/AttendanceSheet';
import { catStyle } from '../lib/categories';
import { initials } from '../lib/format';
import { currentProgramWeek, isRepBased, weekLoad } from '../domain/client';
import {
  ROUNDS,
  activeProgramIndex,
  currentRound,
  nextExercise,
  programComplete,
  progressKey,
  roundComplete,
  roundCounts,
  sessionComplete,
  circuitPrograms,
  type CircuitProgram,
  type Progress,
} from '../domain/session';
import { sessionDayFor } from '../domain/program';
import type { ProgramExercise, SessionLog } from '../domain/types';

const nowTime = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

/** Rounds ticked for one program (≤ ROUNDS) — the per-program `sets` in the archive. */
function programSets(p: CircuitProgram, progress: Progress): number {
  let n = 0;
  for (let r = 1; r <= ROUNDS; r++) if (roundComplete(p, r, progress)) n++;
  return n;
}

const fmtW = (w: number) => (Number.isInteger(w) ? `${w}` : w.toFixed(1));
const todayISO = () => new Date().toISOString().slice(0, 10);

export default function ClientSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { coach } = useAuth();
  const { data: client, isLoading } = useClient(id);
  const { data: exercises = [] } = useClientExercises(id);
  const coachMap = useCoachNameMap();
  const date = todayISO();
  const { data: session } = useSession(id, date);
  const mark = useMarkAttendance(date);
  const setProgress = useSetProgress(id, date);
  const complete = useCompleteSession(id, date);
  const [sheet, setSheet] = useState(false);
  const [endEarly, setEndEarly] = useState(false);

  if (isLoading || !client) {
    return (
      <div className="screen">
        <div className="bar solid">
          <button className="iconbtn" onClick={() => navigate(`/clients/${id}`)} aria-label="Back">
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
  const completed = session?.status === 'completed';
  const list = exercises.filter((e) => !e.future && e.name !== 'Tap to add exercise');
  const day = sessionDayFor(client);
  const clientCoach = client.coachId ? coachMap[client.coachId] ?? 'Not assigned' : 'Not assigned';
  const programs = circuitPrograms(list, day);
  const week = currentProgramWeek(client);
  const activeIdx = activeProgramIndex(programs, progress);

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
    };
  }

  function finish(early: boolean) {
    setEndEarly(false);
    complete.mutate(
      { early, archive: buildArchive(early) },
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

  return (
    <div className="screen">
      <div className="bar solid">
        <button className="iconbtn" onClick={() => navigate(`/clients/${client.id}`)} aria-label="Back">
          <ChevronLeft />
        </button>
        <div className="bar-title">Today&rsquo;s Session</div>
      </div>

      <div className="se-card tap" onClick={() => navigate(`/clients/${client.id}`)}>
        <div className="se-ava tint-cat" style={avaStyle}>
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
            <ProgramBlock key={p.label} program={p} pIdx={i} activeIdx={-1} progress={progress} week={week} />
          ))}
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
        <div className="empty">
          <div className="em">🏋️</div>
          <p>No exercises in this program yet. Add some before starting.</p>
        </div>
      ) : !present ? (
        <>
          <SlideToStart
            label={mark.isPending ? 'Starting…' : 'Slide to mark present & start'}
            disabled={mark.isPending}
            onComplete={markPresent}
          />
          <div className="slide-more">
            <button onClick={() => setSheet(true)}>Not present? More options</button>
          </div>
          <div className="sx-prelock-hint">
            <Lock size={14} /> Slide to mark present to start
          </div>
          <div className="sx-prelock">
            {programs.map((p, i) => (
              <ProgramBlock key={p.label} program={p} pIdx={i} activeIdx={-1} progress={progress} week={week} />
            ))}
          </div>
          <button className="sess-modify2" onClick={() => navigate(`/clients/${client.id}/program`)}>
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
              onToggle={toggleSet}
            />
          ))}
          <button className="sess-modify2" onClick={() => navigate(`/clients/${client.id}/program`)}>
            <span className="sm2-ic">
              <Pencil size={16} />
            </span>
            Create / modify program
          </button>
          <button className="sess-modify2 sess-history" onClick={() => setSheet(true)}>
            <span className="sm2-ic">
              <Clock size={16} />
            </span>
            Change attendance
          </button>
          <div className="bottom-cta sticky-cta">
            {allDone ? (
              <button className="bigbtn" onClick={() => finish(false)} disabled={complete.isPending}>
                <Check size={18} /> {complete.isPending ? 'Saving…' : 'Complete session'}
              </button>
            ) : (
              <button className="bigbtn ghost" onClick={() => setEndEarly(true)} disabled={complete.isPending}>
                <Flag size={16} /> End session early
              </button>
            )}
          </div>
        </>
      )}

      <div className="sp24" />

      {sheet && (
        <AttendanceSheet
          name={client.name}
          current={attendance}
          onPick={pickAttendance}
          onClose={() => setSheet(false)}
        />
      )}

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

// One program (A/B) as a per-set grid: each exercise × ROUNDS cells (done / current /
// pending). Read-only here; tap-to-tick lands in the next slice.
function ProgramBlock({
  program,
  pIdx,
  activeIdx,
  progress,
  week,
  onToggle,
}: {
  program: CircuitProgram;
  pIdx: number;
  activeIdx: number;
  progress: Progress;
  week: number;
  onToggle?: (key: string, done: boolean) => void;
}) {
  const done = programComplete(program, progress);
  const active = pIdx === activeIdx && !done;
  const idle = !done && !active;
  const curR = active ? currentRound(program, progress) : 0;
  const nextName = active ? nextExercise(program, curR, progress) : null;
  const state = done ? 'done' : active ? 'active' : 'idle';
  const pill = done ? (
    <span className="pgm-pill done">
      <Check size={13} /> Completed
    </span>
  ) : active ? (
    <span className="pgm-pill live">In progress</span>
  ) : (
    <span className="pgm-pill idle">Yet to start</span>
  );
  const setsLbl = done ? `${ROUNDS}/${ROUNDS} sets` : active ? `${curR}/${ROUNDS} sets` : '';

  return (
    <div className={`pgm-card ${state}`}>
      <div className="pgm-head">
        <div className="pgm-title-wrap">
          <span className="pgm-title">Program {program.label}</span>
          {pill}
        </div>
        <span className="pgm-head-right">{setsLbl && <span className="pgm-sets">{setsLbl}</span>}</span>
      </div>

      <div className="pgm-cols">
        <span className="pgm-cols-lbl">Exercises</span>
        {!idle && (
          <span className="pgm-setcols">
            {Array.from({ length: ROUNDS }, (_, i) => (
              <span key={i}>Set {i + 1}</span>
            ))}
          </span>
        )}
      </div>

      <div className="pgm-rows">
        {program.exercises.map((ex: ProgramExercise) => {
          const load = weekLoad(ex, week);
          const rep = isRepBased(ex);
          const isCur = active && ex.name === nextName;
          return (
            <div className={`pgm-ex${idle ? ' idle' : ''}`} key={ex.id ?? ex.name}>
              <div className="pgm-ex-main">
                <div className="pgm-ex-name">{ex.name}</div>
                {/* reps · weight, matching the prototype. Rep/time exercises (walks,
                    planks) carry no external load — never print a bogus weight. */}
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
              {!idle && (
                <div className="pgm-cells">
                  {Array.from({ length: ROUNDS }, (_, i) => {
                    const r = i + 1;
                    const cellDone = !!progress[progressKey(program.label, r, ex.name)];
                    const curCell = active && r === curR && isCur && !cellDone;
                    const interactive = active && r === curR && !!onToggle;
                    const inner = (
                      <span className={`pgm-set${cellDone ? ' done' : curCell ? ' cur' : ''}`}>
                        {cellDone ? <Check size={13} /> : curCell ? <ArrowRight size={13} /> : ''}
                      </span>
                    );
                    return interactive ? (
                      <span
                        className="pgm-cell tap"
                        key={r}
                        role="button"
                        tabIndex={0}
                        aria-label={`${cellDone ? 'Undo' : 'Complete'} ${ex.name} set ${r}`}
                        onClick={() => onToggle!(progressKey(program.label, r, ex.name), !cellDone)}
                      >
                        {inner}
                      </span>
                    ) : (
                      <span className="pgm-cell" key={r}>
                        {inner}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
