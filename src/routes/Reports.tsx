import { type CSSProperties, useMemo } from 'react';
import { useClients, useReports } from '../hooks/useData';
import { useToast } from '../components/Toast';
import { catStyle } from '../lib/categories';
import { initials } from '../lib/format';
import type { Report } from '../domain/types';

export default function Reports() {
  const { data: clients = [] } = useClients();
  const { data: reports = [] } = useReports();
  const toast = useToast();

  // Latest report per client (highest week).
  const latestByClient = useMemo(() => {
    const m: Record<string, Report> = {};
    reports.forEach((r) => {
      const cur = m[r.clientId];
      if (!cur || r.week > cur.week) m[r.clientId] = r;
    });
    return m;
  }, [reports]);

  const active = clients.filter((c) => c.status === 'Active' && c.scheduleSet);

  return (
    <div className="fadein">
      <div className="bar">
        <div className="bar-title">Reports</div>
      </div>
      <div className="wkbanner label">Weekly &amp; completion reports</div>

      {active.length === 0 ? (
        <div className="empty">
          <div className="em">📊</div>
          <p>No active clients to report on yet.</p>
        </div>
      ) : (
        active.map((c) => {
          const cat = catStyle(c.category);
          const avaStyle = { '--c-bg': cat.b, '--c-fg': cat.c } as CSSProperties;
          const rep = latestByClient[c.id];
          const sent = rep?.sent;
          return (
            <div className="report-row" key={c.id} onClick={() => toast('Report — coming soon')}>
              <div className="ava sz42 tint-cat" style={avaStyle}>
                {initials(c.name)}
              </div>
              <div className="ac-main">
                <div className="ac-title">{c.name}</div>
                <div className="ac-sub">
                  {sent
                    ? `Week ${rep!.week} sent${rep!.when ? ` · ${rep!.when}` : ''}`
                    : rep
                      ? `Week ${rep.week} · ready to send`
                      : 'Ready to send'}
                </div>
              </div>
              <span className={`sbadge ${sent ? 'gbg' : 'abg'}`}>{sent ? 'Sent' : 'Send'}</span>
            </div>
          );
        })
      )}

      <div className="sp80" />
    </div>
  );
}
