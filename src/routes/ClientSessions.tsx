import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Calendar, TrendingUp } from 'lucide-react';
import { ClientDrillHead } from '../components/ClientDrill';
import { useClient, useClientSessionLog, useSession } from '../hooks/useData';
import type { Client, SessionLog } from '../domain/types';

const WD = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

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

function CalendarMonth({ client, log }: { client: Client; log: SessionLog[] }) {
  const navigate = useNavigate();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthName = now.toLocaleDateString('en-GB', { month: 'long' });
  const todayK = dateKey(now);

  // This-month count: completed sessions logged in the current calendar month.
  const thisMonth = log.filter((r) => {
    const d = new Date(r.date + 'T00:00:00');
    return !isNaN(+d) && d.getFullYear() === year && d.getMonth() === month;
  }).length;

  const p = client.program;
  const total = p ? p.weeks * p.perWeek : 0;
  const done = p?.done ?? 0;
  const pct = total ? Math.round((done / total) * 100) : 0;

  // Today's live attendance — the only source of a "missed" marker (no fabricated pattern).
  const { data: today } = useSession(client.id, todayK);
  const hasAbsent = today?.attendance === 'absent' || today?.attendance === 'cancelled';

  const sessDates = new Set(log.map((r) => r.date));
  const startCol = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-first
  const dim = new Date(year, month + 1, 0).getDate();

  const cells: { key: string; n?: number; st: string }[] = [];
  for (let i = 0; i < startCol; i++) cells.push({ key: `e${i}`, st: 'empty' });
  for (let d = 1; d <= dim; d++) {
    const dk = dateKey(new Date(year, month, d));
    const st = sessDates.has(dk) ? 'present' : dk === todayK && hasAbsent ? 'absent' : '';
    cells.push({ key: dk, n: d, st });
  }

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
        <div className="ov-h">
          <div className="ov-h-t">{monthName} sessions</div>
        </div>
        <div className="att-cal">
          {WD.map((d, i) => (
            <div className="cal-h" key={`h${i}`}>
              {d}
            </div>
          ))}
          {cells.map((c) => (
            <div className={`cal-d ${c.st}`} key={c.key}>
              {c.n ?? ''}
            </div>
          ))}
        </div>
        <div className="att-legend">
          <span>
            <i className="att-dot present" />
            Session completed
          </span>
          {hasAbsent && (
            <span>
              <i className="att-dot absent" />
              Missed
            </span>
          )}
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
          <button className="iconbtn" onClick={() => navigate('/clients')} aria-label="Back">
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
      <ClientDrillHead clientId={client.id} name={client.name} label="Sessions" />
      <CalendarMonth client={client} log={log} />
    </div>
  );
}
