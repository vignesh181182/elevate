import { useState, type CSSProperties } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Check, ArrowRight, PlayCircle, Clock } from 'lucide-react';
import { useClient, useClientExercises, useMarkAttendance, useSession } from '../hooks/useData';
import { useAuth } from '../auth/AuthProvider';
import { useToast } from '../components/Toast';
import AttendanceSheet from '../components/AttendanceSheet';
import { catStyle } from '../lib/categories';
import { initials } from '../lib/format';
import { currentProgramWeek, weekLoad } from '../domain/client';
import {
  ROUNDS,
  activeProgramIndex,
  currentRound,
  nextExercise,
  programComplete,
  progressKey,
  splitPrograms,
  type CircuitProgram,
  type Progress,
} from '../domain/session';
import type { ProgramExercise } from '../domain/types';

const fmtW = (w: number) => (Number.isInteger(w) ? `${w}` : w.toFixed(1));
const todayISO = () => new Date().toISOString().slice(0, 10);

export default function ClientSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { coach } = useAuth();
  const { data: client, isLoading } = useClient(id);
  const { data: exercises = [] } = useClientExercises(id);
  const date = todayISO();
  const { data: session } = useSession(id, date);
  const mark = useMarkAttendance(date);
  const [sheet, setSheet] = useState(false);

  if (isLoading || !client) {
    return (
      <div className="screen">
        <div className="bar solid">
          <button className="iconbtn" onClick={() => navigate(`/clients/${id}`)} aria-label="Back">
            <ChevronLeft />
          </button>
          <div className="bar-title">Today&rsquo;s session</div>
        </div>
        <div className="cl-loading">Loading…</div>
      </div>
    );
  }

  const attendance = session?.attendance;
  const progress: Progress = session?.progress ?? {};
  const completed = session?.status === 'completed';
  const list = exercises.filter((e) => !e.future && e.name !== 'Tap to add exercise');
  const programs = splitPrograms(list);
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

  const cat = catStyle(client.category);
  const avaStyle = { '--c-bg': cat.b, '--c-fg': cat.c } as CSSProperties;
  const present = attendance === 'present';
  const closed = attendance === 'absent' || attendance === 'cancelled';

  return (
    <div className="screen">
      <div className="bar solid">
        <button className="iconbtn" onClick={() => navigate(`/clients/${client.id}`)} aria-label="Back">
          <ChevronLeft />
        </button>
        <div className="bar-title">Today&rsquo;s session</div>
      </div>

      <div className="se-card">
        <div className="se-ava tint-cat" style={avaStyle}>
          {initials(client.name)}
        </div>
        <div className="se-id">
          <div className="se-name-row">
            <span className="se-name">{client.name}</span>
            {present && !completed && <span className="se-present">✓ Present</span>}
          </div>
          <div className="se-meta">
            Week {week} · {client.time}
          </div>
        </div>
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
          <div className="sp-intro">Mark present to start the circuit.</div>
          {programs.map((p, i) => (
            <ProgramBlock key={p.label} program={p} pIdx={i} activeIdx={-1} progress={progress} week={week} />
          ))}
          <div className="bottom-cta sticky-cta cta-row">
            <button className="bigbtn ghost" onClick={() => setSheet(true)} disabled={mark.isPending}>
              Not present
            </button>
            <button className="bigbtn" onClick={markPresent} disabled={mark.isPending}>
              <PlayCircle size={18} /> {mark.isPending ? 'Starting…' : 'Mark present & start'}
            </button>
          </div>
        </>
      ) : (
        <>
          {programs.map((p, i) => (
            <ProgramBlock key={p.label} program={p} pIdx={i} activeIdx={activeIdx} progress={progress} week={week} />
          ))}
          <button className="sess-modify2 sess-history" onClick={() => setSheet(true)}>
            <span className="sm2-ic">
              <Clock size={16} />
            </span>
            Change attendance
          </button>
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
}: {
  program: CircuitProgram;
  pIdx: number;
  activeIdx: number;
  progress: Progress;
  week: number;
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
          const isCur = active && ex.name === nextName;
          return (
            <div className={`pgm-ex${idle ? ' idle' : ''}`} key={ex.id ?? ex.name}>
              <div className="pgm-ex-main">
                <div className="pgm-ex-name">{ex.name}</div>
                <div className="pgm-ex-sub">
                  <span>{load.w > 0 ? `${fmtW(load.w)}kg` : 'Bodyweight'}</span>
                  <i className="pgm-dot" />
                  <span>{load.r} reps</span>
                </div>
              </div>
              {!idle && (
                <div className="pgm-cells">
                  {Array.from({ length: ROUNDS }, (_, i) => {
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
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
