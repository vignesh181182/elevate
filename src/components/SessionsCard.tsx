import { CalendarCheck } from 'lucide-react';
import { useClientSessionLog } from '../hooks/useData';
import type { Client, SessionLog } from '../domain/types';

// Read-only completed-session history. Each row: date, the circuit summary
// (programs × rounds), the session time, and a done / ended-early badge.
function Row({ rec }: { rec: SessionLog }) {
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

export default function SessionsCard({ client }: { client: Client }) {
  const { data: log = [], isLoading } = useClientSessionLog(client.id);
  const first = client.name.split(' ')[0];

  return (
    <div className="cp-card">
      <div className="cp-sec">
        <div className="cp-sec-t">
          <CalendarCheck size={16} className="t-green" />
          Session history
        </div>
      </div>
      {isLoading ? (
        <div className="cl-loading">Loading sessions…</div>
      ) : log.length === 0 ? (
        <div className="ph-empty-inline">
          No completed sessions yet — they'll appear here after {first}'s first session.
        </div>
      ) : (
        <div className="sh-list">
          {log.map((rec) => (
            <Row key={rec.date} rec={rec} />
          ))}
        </div>
      )}
    </div>
  );
}
