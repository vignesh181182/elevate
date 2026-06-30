import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Download } from 'lucide-react';
import { useClient, useClientExercises, useClientSessionLog, useCoachNameMap } from '../hooks/useData';
import { useToast } from '../components/Toast';
import { catStyle } from '../lib/categories';
import { initials } from '../lib/format';
import { downloadElementPdf } from '../lib/pdf';
import { programDisplayName } from '../domain/client';
import { reportPeriod, weekSessions, performanceRows, GYM, type PerfRow, type ReportDay } from '../domain/report';
import type { Client, ProgramExercise, SessionLog } from '../domain/types';

const GOAL_ICONS = ['📅', '🏋️', '🤸', '❤️'];
const DOC_WIDTH = 794;

interface Goal {
  t: string;
  s: string;
}

export default function ClientReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: client, isLoading } = useClient(id);
  const { data: exercises = [] } = useClientExercises(id);
  const { data: log = [] } = useClientSessionLog(id);
  const coachName = useCoachNameMap();

  if (isLoading) return <div className="screen"><div className="cl-loading">Loading…</div></div>;
  if (!client)
    return (
      <div className="screen">
        <div className="bar solid">
          <button className="iconbtn" onClick={() => navigate('/reports')} aria-label="Back">
            <ChevronLeft />
          </button>
          <div className="bar-title">Weekly report</div>
        </div>
        <div className="empty"><div className="em">🔍</div><p>Client not found.</p></div>
      </div>
    );

  const coach = client.coachId ? coachName[client.coachId] ?? 'Not assigned' : 'Not assigned';
  return <Composer key={client.id} client={client} exercises={exercises} log={log} coach={coach} navigate={navigate} />;
}

function Composer({
  client,
  exercises,
  log,
  coach,
  navigate,
}: {
  client: Client;
  exercises: ProgramExercise[];
  log: SessionLog[];
  coach: string;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const toast = useToast();
  const first = client.name.split(' ')[0];
  const [note, setNote] = useState('');
  const [goals, setGoals] = useState<Goal[]>([
    { t: '', s: '' },
    { t: '', s: '' },
    { t: '', s: '' },
  ]);
  const [busy, setBusy] = useState(false);

  const period = reportPeriod();
  const sessions = weekSessions(client.days, log);
  const rows = performanceRows(exercises.filter((e) => !e.future && e.name !== 'Tap to add exercise'));
  const program = programDisplayName(client.program);

  const docRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  // Scale the fixed-width A4 doc to fit the phone frame (data value → CSS custom prop).
  useLayoutEffect(() => {
    function fit() {
      const frame = frameRef.current;
      const scaleEl = scaleRef.current;
      const doc = docRef.current;
      if (!frame || !scaleEl || !doc) return;
      const scale = Math.min(1, frame.clientWidth / DOC_WIDTH);
      scaleEl.style.setProperty('--rd-scale', String(scale));
      frame.style.setProperty('--rd-h', `${doc.offsetHeight * scale}px`);
    }
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  });

  const setGoal = (i: number, k: keyof Goal, v: string) =>
    setGoals((g) => g.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  async function onDownload() {
    if (!docRef.current) return;
    setBusy(true);
    try {
      await downloadElementPdf(docRef.current, `${client.name.replace(/\s+/g, '-')}-report.pdf`);
    } catch {
      toast('Could not generate the PDF');
    } finally {
      setBusy(false);
    }
  }

  const filledGoals = goals.filter((g) => g.t.trim() || g.s.trim());

  return (
    <div className="screen">
      <div className="bar solid">
        <button className="iconbtn" onClick={() => navigate('/reports')} aria-label="Back">
          <ChevronLeft />
        </button>
        <div className="bar-title">Weekly report</div>
      </div>

      <div className="cmp-head">
        <div className="cmp-h-name">{client.name}</div>
        <div className="cmp-h-sub">
          Progress Report · {program} · {period}
        </div>
      </div>

      <div className="block">
        <div className="block-t">Auto-included from logged data</div>
        <div className="cmp-auto">
          <span>✅ Sessions {sessions.done}/{sessions.total}</span>
          <span>📊 {rows.length} exercises</span>
          <span>📈 Previous best → this week</span>
        </div>
        <div className="cmp-auto-note">
          Sessions, the performance table and progress are pulled automatically. Add a note and next-week goals below.
        </div>
      </div>

      <div className="block">
        <div className="block-t">Coach note</div>
        <textarea
          className="cmp-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={`Write a note to ${first}…`}
        />
      </div>

      <div className="block">
        <div className="block-t">Next week goals</div>
        {goals.map((g, i) => (
          <div className="cmp-goal" key={i}>
            <div className="cmp-goal-ic">{GOAL_ICONS[i]}</div>
            <div className="cmp-goal-f">
              <input
                className="cmp-goal-t"
                value={g.t}
                onChange={(e) => setGoal(i, 't', e.target.value)}
                placeholder={`Goal ${i + 1}`}
              />
              <input
                className="cmp-goal-s"
                value={g.s}
                onChange={(e) => setGoal(i, 's', e.target.value)}
                placeholder="Short description"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="rdoc-hint">This is the PDF your client receives. Preview below, then download.</div>
      <div className="rdoc-wrap">
        <div className="rdoc-frame scaled" ref={frameRef}>
          <div className="rdoc-scale" ref={scaleRef}>
            <ReportDoc
              ref={docRef}
              client={client}
              coach={coach}
              program={program}
              period={period}
              sessions={sessions}
              rows={rows}
              note={note}
              goals={filledGoals}
            />
          </div>
        </div>
      </div>

      <div className="rdoc-actions">
        <button className={`bigbtn${busy ? ' dim' : ''}`} onClick={onDownload} disabled={busy}>
          <Download size={18} /> {busy ? 'Preparing…' : 'Download PDF'}
        </button>
      </div>
      <div className="sp24" />
    </div>
  );
}

function Ring({ pct, done, total }: { pct: number; done: number; total: number }) {
  const R = 52;
  const CIRC = 2 * Math.PI * R;
  const dash = (CIRC * pct) / 100;
  return (
    <div className="rd-ring">
      <svg viewBox="0 0 130 130" className="rd-ring-svg">
        <circle cx="65" cy="65" r={R} fill="none" stroke="#F1DCDB" strokeWidth="13" />
        <circle
          cx="65"
          cy="65"
          r={R}
          fill="none"
          stroke="#E5322B"
          strokeWidth="13"
          strokeLinecap="round"
          strokeDasharray={`${dash.toFixed(1)} ${CIRC.toFixed(1)}`}
          transform="rotate(-90 65 65)"
        />
      </svg>
      <div className="rd-ring-c">
        <div className="rd-ring-v">{done}/{total || 0}</div>
        <div className="rd-ring-p">{pct}%</div>
        <div className="rd-ring-l">Completed</div>
      </div>
    </div>
  );
}

interface ReportDocProps {
  client: Client;
  coach: string;
  program: string;
  period: string;
  sessions: { days: ReportDay[]; done: number; total: number; pct: number };
  rows: PerfRow[];
  note: string;
  goals: Goal[];
}

// The printable A4 report document (light-themed; matches the prototype reportDocHTML).
const ReportDoc = ({ ref, ...p }: ReportDocProps & { ref: React.Ref<HTMLDivElement> }) => {
  const cat = catStyle(p.client.category);
  const avaStyle = { '--c-bg': cat.b, '--c-fg': cat.c } as CSSProperties;
  return (
    <div className="rdoc" id="rdoc" ref={ref}>
      <div className="rd-deco" />
      <div className="rd-head">
        <img className="rd-logo" src="/assets/images/logo.jpg" alt="Elevate Fitness" />
        <div className="rd-head-div" />
        <div className="rd-head-tx">
          <div className="rd-title">
            <b>PROGRESS</b> REPORT
          </div>
          <div className="rd-kicker">
            <span />
            WEEKLY SUMMARY
            <span />
          </div>
          <div className="rd-date">📅 {p.period}</div>
        </div>
      </div>

      <div className="rd-client">
        <div className="rd-avatar tint-cat" style={avaStyle}>
          {initials(p.client.name)}
        </div>
        <div className="rd-client-m">
          <div className="rd-cname">{p.client.name.toUpperCase()}</div>
          <div className="rd-crow">
            <span className="rd-cic">▸</span>Program: <b>{p.program}</b>
          </div>
          <div className="rd-crow">
            <span className="rd-cic">▸</span>Coach: <b>{p.coach}</b>
          </div>
          <div className="rd-crow">
            <span className="rd-cic">▸</span>Reporting Period: <b>{p.period}</b>
          </div>
        </div>
        {p.note.trim() && (
          <div className="rd-note">
            <div className="rd-note-h">
              <span className="rd-quote">❝</span>COACH NOTE
            </div>
            <div className="rd-note-tx">{p.note}</div>
          </div>
        )}
      </div>

      <div className="rd-sec">
        <div className="rd-sec-h">
          <span className="rd-num">1.</span>SESSIONS COMPLETED <span className="rd-sec-sub">(ATTENDANCE)</span>
        </div>
        <div className="rd-att">
          <Ring pct={p.sessions.pct} done={p.sessions.done} total={p.sessions.total} />
          <div className="rd-week">
            {p.sessions.days.map((x, i) => (
              <div className="rd-wd" key={i}>
                <div className="rd-wd-l">{x.d.toUpperCase()}</div>
                <div className={`rd-wd-c ${x.st}`}>{x.st === 'done' ? '✓' : x.st === 'missed' ? '✕' : ''}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rd-sec">
        <div className="rd-sec-h">
          <span className="rd-num">2.</span>WORKOUT PERFORMANCE
        </div>
        <table className="rd-table">
          <thead>
            <tr>
              <th>EXERCISE</th>
              <th>PREVIOUS BEST</th>
              <th>THIS WEEK</th>
              <th>IMPROVEMENT</th>
            </tr>
          </thead>
          <tbody>
            {perfTableRows(p.rows)}
          </tbody>
        </table>
      </div>

      <div className="rd-sec">
        <div className="rd-sec-h">
          <span className="rd-num">3.</span>NEXT WEEK GOALS
        </div>
        <div className="rd-goals">
          {p.goals.length === 0 ? (
            <div className="rd-empty">No goals set for next week.</div>
          ) : (
            p.goals.map((g, i) => (
              <div className="rd-goal" key={i}>
                <div className="rd-goal-ic">{GOAL_ICONS[i]}</div>
                <div>
                  <div className="rd-goal-t">{g.t || '—'}</div>
                  <div className="rd-goal-s">{g.s}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rd-quote-band">
        <span className="rd-bq">“</span>
        <div className="rd-quote-tx">
          Discipline today, strength tomorrow,
          <br />
          <i>transformation forever.</i>
        </div>
        <span className="rd-bq rd-bq-r">”</span>
      </div>
      <div className="rd-contact">
        <span>📍 {GYM.name}</span>
        <span>📞 {GYM.phone}</span>
        <span>✉️ {GYM.email}</span>
        <span>🌐 {GYM.web}</span>
      </div>
    </div>
  );
};

function perfTableRows(perf: PerfRow[]) {
  if (perf.length === 0)
    return (
      <tr>
        <td colSpan={4} className="rd-empty">
          No exercises logged this week.
        </td>
      </tr>
    );
  return perf.map((r, i) => (
    <tr key={i}>
      <td className="rd-x">
        <span className="rd-x-ic">{r.ic}</span>
        {r.name}
      </td>
      <td>{r.prev}</td>
      <td>{r.now}</td>
      <td className={`rd-imp ${r.cls}`}>
        {r.imp} <span>{r.arr}</span>
      </td>
    </tr>
  ));
}
