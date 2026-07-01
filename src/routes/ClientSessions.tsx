import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Calendar, TrendingUp } from 'lucide-react';
import { ClientDrillHead } from '../components/ClientDrill';
import { useClient, useClientSessionLog } from '../hooks/useData';
import { parseDays } from '../domain/client';
import type { Client, SessionLog } from '../domain/types';

const WD = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const WD_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Local YYYY-MM-DD (matches the prototype's dateKey + the seeded log dates). */
function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/** Program-completion ring (green arc over a faint track), sized to the stat tile. */
function OvRing({ pct }: { pct: number }) {
  const r = 13;
  const cc = 2 * Math.PI * r;
  const dash = (cc * pct) / 100;
  return (
    <svg viewBox="0 0 32 32" width="36" height="36">
      <circle cx="16" cy="16" r={r} fill="none" stroke="var(--green-bg)" strokeWidth="5" />
      <circle
        cx="16"
        cy="16"
        r={r}
        fill="none"
        stroke="var(--green)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={`${dash.toFixed(1)} ${cc.toFixed(1)}`}
        transform="rotate(-90 16 16)"
      />
    </svg>
  );
}

// One archived completed session — date chip + circuit summary + rounds badge.
function SessHistRow({ rec }: { rec: SessionLog }) {
  const d = new Date(rec.date + 'T00:00:00');
  const valid = !isNaN(+d);
  const dnum = valid ? d.getDate() : '—';
  const mon = valid ? d.toLocaleDateString('en-GB', { month: 'short' }) : '';
  const summary = rec.programs.map((p) => `${p.label.replace('Program ', '')} ×${p.sets}`).join(' · ') || 'Circuit';
  return (
    <div className="sh-row">
      <div className="sh-date">
        <b>{dnum}</b>
        {mon}
      </div>
      <div className="sh-main">
        <div className="sh-focus">Circuit · Programs {summary}</div>
        <div className="sh-sub">{rec.when || '—'}</div>
      </div>
      {rec.early ? (
        <span className="sh-badge cancelled">
          Ended early · {rec.roundsCompleted}/{rec.totalRounds}
        </span>
      ) : (
        <span className="sh-badge done">
          ✓ {rec.roundsCompleted}/{rec.totalRounds} rounds
        </span>
      )}
    </div>
  );
}

// Permanent completed-session archive (newest first) — real logs only, no filler.
function SessionHistory({ client, log }: { client: Client; log: SessionLog[] }) {
  return (
    <div className="block">
      <div className="ov-h">
        <div className="ov-h-t">Session history</div>
      </div>
      {log.length ? (
        <>
          <div className="sh-list">
            {log.map((rec) => (
              <SessHistRow key={rec.date} rec={rec} />
            ))}
          </div>
          <div className="tab-cap foot">Showing completed sessions</div>
        </>
      ) : (
        <div className="ph-empty-inline">
          No completed sessions yet — they&rsquo;ll appear here after {client.name.split(' ')[0]}&rsquo;s first session.
        </div>
      )}
    </div>
  );
}

function CalendarMonth({ client, log }: { client: Client; log: SessionLog[] }) {
  const navigate = useNavigate();
  const now = new Date();
  const todayK = dateKey(now);

  // The browsed month — starts on the real current month, navigable past & future so a
  // coach can review any month and open that day's session (completed, live, or planned).
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const monthName = new Date(view.y, view.m, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const atToday = view.y === now.getFullYear() && view.m === now.getMonth();
  const shiftMonth = (delta: number) =>
    setView((v) => {
      const d = new Date(v.y, v.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  // Stats are lifetime / current-month KPIs — independent of the browsed month.
  const thisMonth = log.filter((r) => {
    const d = new Date(r.date + 'T00:00:00');
    return !isNaN(+d) && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

  const p = client.program;
  const total = p ? p.weeks * p.perWeek : 0;
  const done = p?.done ?? 0;
  const pct = total ? Math.round((done / total) * 100) : 0;

  // Completed-session archive keyed by date — the source of the success/partial colour.
  const logByDate = new Map(log.map((r) => [r.date, r]));
  // The client's scheduled training weekdays — future ones are shown as upcoming.
  const sessionDays = new Set(parseDays(client.days));
  const startCol = (new Date(view.y, view.m, 1).getDay() + 6) % 7; // Monday-first
  const dim = new Date(view.y, view.m + 1, 0).getDate();

  // Per-day status → colour: a completed log is 'done' (green) when fully finished or
  // 'early' (red) when it ended early / short of its rounds; a scheduled weekday still
  // ahead is 'upcoming' (amber); everything else is an inert non-session day.
  const cells: { key: string; n?: number; dk?: string; st: string }[] = [];
  for (let i = 0; i < startCol; i++) cells.push({ key: `e${i}`, st: 'empty' });
  for (let d = 1; d <= dim; d++) {
    const dObj = new Date(view.y, view.m, d);
    const dk = dateKey(dObj);
    const isToday = dk === todayK;
    const rec = logByDate.get(dk);
    let status = 'off';
    if (rec) status = !rec.early && rec.roundsCompleted >= rec.totalRounds ? 'done' : 'early';
    else if (dk >= todayK && sessionDays.has(WD_ABBR[dObj.getDay()])) status = 'upcoming';
    const st = [status, isToday ? 'today' : ''].filter(Boolean).join(' ');
    // Days with a state are openable; inert non-session days carry no dk.
    cells.push({ key: dk, n: d, dk: status === 'off' ? undefined : dk, st });
  }

  // A session day opens its session: today → live; other days → read-only (archive or plan).
  const openDate = (dk: string) =>
    navigate(dk === todayK ? `/clients/${client.id}/session` : `/clients/${client.id}/session?date=${dk}`);

  return (
    <div className="fadein">
      <div className="ov-stats">
        <div className="ov-stat">
          <div className="ov-stat-ic bg-accent-soft">
            <Calendar size={18} />
          </div>
          <div className="ov-stat-v">{client.sessions}</div>
          <div className="ov-stat-l">Total Sessions</div>
        </div>
        <div className="ov-stat">
          <div className="ov-stat-ic bg-accent-soft">
            <TrendingUp size={18} />
          </div>
          <div className="ov-stat-v">{thisMonth}</div>
          <div className="ov-stat-l">This Month</div>
        </div>
        <div className="ov-stat">
          <div className="ov-stat-ring">
            <OvRing pct={pct} />
          </div>
          <div className="ov-stat-v">{pct}%</div>
          <div className="ov-stat-l">Program</div>
        </div>
      </div>

      <div className="block">
        <div className="cal-nav">
          <button className="sw-arrow" onClick={() => shiftMonth(-1)} aria-label="Previous month">
            ‹
          </button>
          <div className="sw-label">
            <b>{monthName}</b>
          </div>
          {!atToday && (
            <button
              className="fchip today-jump"
              onClick={() => setView({ y: now.getFullYear(), m: now.getMonth() })}
            >
              Today
            </button>
          )}
          <button className="sw-arrow" onClick={() => shiftMonth(1)} aria-label="Next month">
            ›
          </button>
        </div>
        <div className="att-cal">
          {WD.map((d, i) => (
            <div className="cal-h" key={`h${i}`}>
              {d}
            </div>
          ))}
          {cells.map((c) =>
            c.dk ? (
              <button className={`cal-d ${c.st}`} key={c.key} onClick={() => openDate(c.dk!)}>
                {c.n}
              </button>
            ) : (
              <div className={`cal-d ${c.st}`} key={c.key}>
                {c.n}
              </div>
            ),
          )}
        </div>
        <div className="att-legend">
          <span>
            <i className="att-dot done" />
            Completed
          </span>
          <span>
            <i className="att-dot early" />
            Ended early
          </span>
          <span>
            <i className="att-dot upcoming" />
            Upcoming
          </span>
        </div>
      </div>

      <div className="bottom-cta">
        <button className="bigbtn" onClick={() => navigate(`/clients/${client.id}/session`)}>
          Open today&rsquo;s session
        </button>
      </div>
    </div>
  );
}

// "Sessions" drill — month attendance calendar + Total / This-month / Program tiles.
export default function ClientSessions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: client, isLoading } = useClient(id);
  const { data: log = [] } = useClientSessionLog(id);

  if (isLoading)
    return (
      <div className="screen center-screen">
        <div className="cl-loading">Loading…</div>
      </div>
    );
  if (!client)
    return (
      <div className="screen">
        <div className="bar solid">
          <button className="iconbtn" onClick={() => navigate(-1)} aria-label="Back">
            <ChevronLeft />
          </button>
        </div>
        <div className="empty">
          <div className="em">🔍</div>
          <p>Client not found.</p>
        </div>
      </div>
    );

  return (
    <div className="screen">
      <ClientDrillHead name={client.name} label="Sessions" />
      <CalendarMonth client={client} log={log} />
      <SessionHistory client={client} log={log} />
      <div className="sp24" />
    </div>
  );
}
