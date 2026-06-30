import { useRef, useState, type CSSProperties } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronDown, Check, ArrowRight, Calendar, Flag, Lock, Pencil, MoreVertical, X } from 'lucide-react';
import {
  useClient,
  useClientExercises,
  useCoachNameMap,
  useCompleteSession,
  useMarkAttendance,
  useSession,
  useSetProgress,
  useSetSessionSetLog,
} from '../hooks/useData';
import { useAuth } from '../auth/AuthProvider';
import { useToast } from '../components/Toast';
import AttendanceSheet from '../components/AttendanceSheet';
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
  circuitPrograms,
  type CircuitProgram,
  type Progress,
  type SetLoad,
  type SetLogs,
} from '../domain/session';
import { sessionDayFor } from '../domain/program';
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
  const setSetLog = useSetSessionSetLog(id, date);
  const complete = useCompleteSession(id, date);
  const [sheet, setSheet] = useState(false);
  const [endEarly, setEndEarly] = useState(false);
  const [menu, setMenu] = useState(false);

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
  const completed = session?.status === 'completed';
  const list = exercises.filter((e) => !e.future && e.name !== 'Tap to add exercise');
  const day = sessionDayFor(client);
  const clientCoach = client.coachId ? coachMap[client.coachId] ?? 'Not assigned' : 'Not assigned';
  const programs = circuitPrograms(list, day, client.program?.sets);
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

  // Persist one set's worked load (weight/reps). Stored on the session doc so it
  // survives reload and folds into the per-week log on completion.
  function logSet(key: string, load: SetLoad) {
    setSetLog.mutate({ key, load });
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
    };
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

  return (
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
            <ProgramBlock key={p.label} program={p} pIdx={i} activeIdx={-1} progress={progress} week={week} setLogs={setLogs} />
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
              <ProgramBlock key={p.label} program={p} pIdx={i} activeIdx={-1} progress={progress} week={week} setLogs={setLogs} />
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
              setLogs={setLogs}
              collapsible
              onToggle={toggleSet}
              onLogSet={logSet}
            />
          ))}
          <button className="sess-modify2" onClick={() => navigate(`/clients/${client.id}/program`)}>
            <span className="sm2-ic">
              <Pencil size={16} />
            </span>
            Create / modify program
          </button>
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
                  navigate(`/clients/${client.id}/program`);
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
  collapsible = false,
  onToggle,
  onLogSet,
}: {
  program: CircuitProgram;
  pIdx: number;
  activeIdx: number;
  progress: Progress;
  week: number;
  setLogs: SetLogs;
  collapsible?: boolean;
  onToggle?: (key: string, done: boolean) => void;
  onLogSet?: (key: string, load: SetLoad) => void;
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
                    const cellDone = !!progress[progressKey(program.label, r, ex.name)];
                    const curCell = active && r === curR && isCur && !cellDone;
                    return (
                      <span className="pgm-cell" key={r}>
                        <span className={`pgm-set${cellDone ? ' done' : curCell ? ' cur' : ''}`}>
                          {cellDone ? <Check size={13} /> : curCell ? <ArrowRight size={13} /> : ''}
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
}: {
  rep: boolean;
  load: SetLoad;
  editing: boolean;
  onToggleEdit: () => void;
  onBump: (k: 'w' | 'r', delta: number) => void;
}) {
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
          <button className="psc-stp" onClick={() => onBump('w', -1)} aria-label="Less">
            −
          </button>
          <span className="psc-step-val">
            {wDisp}
            {unit}
          </span>
          <button className="psc-stp" onClick={() => onBump('w', 1)} aria-label="More">
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
