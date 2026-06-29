import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Wallet, Calendar, ClipboardList, Users, UserPlus } from 'lucide-react';
import { useAuth, useIsMainCoach } from '../auth/AuthProvider';
import { useToast } from '../components/Toast';
import { useClients, useSessionLogs, useBillings } from '../hooks/useData';
import { relativeDay } from '../lib/format';
import { CLIENT_FILTERS, type FilterKey } from '../domain/filters';

export default function Home() {
  const { coach } = useAuth();
  const isMain = useIsMainCoach();
  const toast = useToast();
  const navigate = useNavigate();
  const { data: clients = [] } = useClients();
  const { data: logs = [] } = useSessionLogs();
  const ids = useMemo(() => clients.map((c) => c.id), [clients]);
  const { data: billings = {} } = useBillings(ids);

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

  const { sessions, days } = useMemo(() => {
    const month = new Date().toISOString().slice(0, 7);
    const mine = logs.filter((l) => coach && clientById[l.clientId]?.coachId === coach.id);
    const monthLogs = mine.filter((l) => (l.date || '').slice(0, 7) === month);
    return { sessions: monthLogs.length, days: new Set(monthLogs.map((l) => l.date)).size };
  }, [logs, clientById, coach]);

  const count = (key: FilterKey) => clients.filter((c) => CLIENT_FILTERS[key].pred(c, billings[c.id])).length;
  const go = (key: FilterKey) => navigate(`/clients?filter=${encodeURIComponent(key)}`);

  // Critical alerts — only categories that have items. Payment ones main-only.
  const alerts: { key: FilterKey; icon: typeof Wallet; cls: string; title: string; sub: string }[] = [];
  if (isMain && count('Payment overdue') > 0) {
    const n = count('Payment overdue');
    alerts.push({ key: 'Payment overdue', icon: Wallet, cls: 'ic-red', title: 'Payment overdue', sub: `${n} client${n === 1 ? '' : 's'} with pending payments` });
  }
  if (isMain && count('Membership expiring') > 0) {
    const n = count('Membership expiring');
    alerts.push({ key: 'Membership expiring', icon: Calendar, cls: 'ic-amber', title: 'Membership expiring', sub: `${n} client${n === 1 ? '' : 's'} in next 7 days` });
  }
  if (count('Review due') > 0) {
    const n = count('Review due');
    alerts.push({ key: 'Review due', icon: ClipboardList, cls: 'ic-amber', title: 'Reviews due', sub: `${n} client${n === 1 ? '' : 's'} need a weekly review` });
  }

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

      {/* Critical alerts */}
      <div className="eh-card">
        <div className="eh-card-h">
          <div className="eh-card-t">
            Critical Alerts {alerts.length > 0 && <span className="eh-badge">{alerts.length}</span>}
          </div>
        </div>
        {alerts.length === 0 ? (
          <div className="ea-empty">All clear — no critical alerts.</div>
        ) : (
          alerts.map((a) => (
            <div className="ea-row" key={a.key} onClick={() => go(a.key)}>
              <div className={`ea-ic ${a.cls}`}>
                <a.icon size={18} />
              </div>
              <div className="ea-main">
                <div className="ea-t">{a.title}</div>
                <div className="ea-s">{a.sub}</div>
              </div>
              <div className="ea-chev">›</div>
            </div>
          ))
        )}
      </div>

      {/* Quick stats — each a deep link into the matching filtered list */}
      <div className="eh-card">
        <div className="eh-card-h">
          <div className="eh-card-t">Quick Stats</div>
        </div>
        <div className="eq-grid">
          <div className="eq-tile" onClick={() => go('Active')}>
            <div className="eq-ic ic-red">
              <Users size={18} />
            </div>
            <div className="eq-tx">
              <div className="eq-v">{count('Active')}</div>
              <div className="eq-l">Active Clients</div>
            </div>
          </div>
          <div className="eq-tile" onClick={() => go('Leads')}>
            <div className="eq-ic ic-grey">
              <UserPlus size={18} />
            </div>
            <div className="eq-tx">
              <div className="eq-v">{count('Leads')}</div>
              <div className="eq-l">New Leads</div>
            </div>
          </div>
          <div className="eq-tile" onClick={() => go('Assessment due')}>
            <div className="eq-ic ic-amber">
              <ClipboardList size={18} />
            </div>
            <div className="eq-tx">
              <div className="eq-v">{count('Assessment due')}</div>
              <div className="eq-l">Assessments Due</div>
            </div>
          </div>
          {isMain && (
            <div className="eq-tile" onClick={() => go('Payment due')}>
              <div className="eq-ic ic-purple">
                <Wallet size={18} />
              </div>
              <div className="eq-tx">
                <div className="eq-v">{count('Payment due')}</div>
                <div className="eq-l">Pending Payments</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent activity */}
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
