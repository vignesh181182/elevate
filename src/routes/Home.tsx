import { useMemo } from 'react';
import { Bell, Check } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { useToast } from '../components/Toast';
import { useClients, useSessionLogs } from '../hooks/useData';
import { relativeDay } from '../lib/format';

export default function Home() {
  const { coach } = useAuth();
  const toast = useToast();
  const { data: clients = [] } = useClients();
  const { data: logs = [] } = useSessionLogs();

  const greet = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  })();
  const firstName = coach?.name.split(' ')[0] ?? 'Coach';

  const clientById = useMemo(() => {
    const m: Record<string, { name: string; coachId: string | null }> = {};
    clients.forEach((c) => (m[c.id] = { name: c.name, coachId: c.coachId }));
    return m;
  }, [clients]);

  // This-month activity for the signed-in coach (their assigned clients).
  const { sessions, days } = useMemo(() => {
    const month = new Date().toISOString().slice(0, 7);
    const mine = logs.filter((l) => coach && clientById[l.clientId]?.coachId === coach.id);
    const monthLogs = mine.filter((l) => (l.date || '').slice(0, 7) === month);
    return { sessions: monthLogs.length, days: new Set(monthLogs.map((l) => l.date)).size };
  }, [logs, clientById, coach]);

  // Recent activity feed — completed sessions across all clients (everyone sees all).
  const activity = logs.slice(0, 6);

  return (
    <div className="fadein">
      <div className="topbar">
        <img className="topbar-logo" src="/assets/images/logo.jpg" alt="Elevate Fitness" />
        <div className="topbar-act">
          <button className="topbar-icbtn" onClick={() => toast('Notifications — coming soon')} aria-label="Notifications">
            <Bell size={20} />
          </button>
        </div>
      </div>

      <div className="eh-greet">
        {greet}, {firstName} 👋
      </div>
      <div className="eh-derived">
        This month · {sessions} session{sessions === 1 ? '' : 's'} · {days} day{days === 1 ? '' : 's'} active
      </div>

      <div className="eh-card">
        <div className="eh-card-h">
          <div className="eh-card-t">Activity</div>
        </div>
        {activity.length === 0 ? (
          <div className="es-empty">No recent activity yet.</div>
        ) : (
          activity.map((a) => {
            const name = clientById[a.clientId]?.name ?? 'Client';
            return (
              <div className="act-row" key={`${a.clientId}-${a.date}`}>
                <div className="act-ic ai-green">
                  <Check size={16} />
                </div>
                <div className="act-body">
                  <div className="act-tx">
                    {a.early ? 'Ended session early with' : 'Completed session with'} {name}
                  </div>
                  <div className="act-tm">{relativeDay(a.date)}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="sp80" />
    </div>
  );
}
