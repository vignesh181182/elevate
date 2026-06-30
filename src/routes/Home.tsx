import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Wallet, Calendar, ClipboardList, Users, UserPlus, UserCheck, ChevronDown } from 'lucide-react';
import { useAuth, useIsMainCoach } from '../auth/AuthProvider';
import { useToast } from '../components/Toast';
import { useClients, useCoaches, useSessionLogs, useBillings } from '../hooks/useData';
import { parseDays } from '../domain/client';
import { initials, relativeDay } from '../lib/format';
import { CLIENT_FILTERS, type FilterKey } from '../domain/filters';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Home() {
  const { coach } = useAuth();
  const isMain = useIsMainCoach();
  const toast = useToast();
  const navigate = useNavigate();
  const { data: clients = [] } = useClients();
  const { data: coaches = [] } = useCoaches();
  const { data: logs = [] } = useSessionLogs();
  const ids = useMemo(() => clients.map((c) => c.id), [clients]);
  const { data: billings = {} } = useBillings(ids);

  // Coach switcher — scope the whole dashboard to one coach's roster (or All).
  const [homeCoach, setHomeCoach] = useState<string>(coach?.id ?? 'All');
  const [menuOpen, setMenuOpen] = useState(false);

  const scoped = useMemo(
    () => (homeCoach === 'All' ? clients : clients.filter((c) => c.coachId === homeCoach)),
    [clients, homeCoach],
  );
  const scopedIds = useMemo(() => new Set(scoped.map((c) => c.id)), [scoped]);

  const greet = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  })();
  const selectedName = homeCoach === 'All' ? '' : coaches.find((c) => c.id === homeCoach)?.name ?? coach?.name ?? '';
  const switcherLabel = homeCoach === 'All' ? 'All coaches' : selectedName || 'Coach';

  const coachOpts = [
    { id: 'All', name: 'All coaches', role: 'Every coach', photo: undefined as string | undefined },
    ...coaches.map((c) => ({
      id: c.id,
      name: c.name,
      role: c.role === 'main' ? 'Head coach' : 'Junior coach',
      photo: c.photo,
    })),
  ];

  const count = (key: FilterKey) => scoped.filter((c) => CLIENT_FILTERS[key].pred(c, billings[c.id])).length;
  const go = (key: FilterKey) => navigate(`/clients?filter=${encodeURIComponent(key)}`);

  // Stats strip — all derived from real data (scoped to the selected coach).
  const now = new Date();
  const todayAbbr = WEEKDAYS[now.getDay()];
  const todayISO = now.toISOString().slice(0, 10);
  const sessionsToday = scoped.filter((c) => c.scheduleSet && parseDays(c.days).includes(todayAbbr)).length;
  const completedToday = logs.filter((l) => l.date === todayISO && scopedIds.has(l.clientId)).length;
  const remaining = Math.max(0, sessionsToday - completedToday);

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

  const activity = logs.filter((l) => scopedIds.has(l.clientId)).slice(0, 6);
  const clientName = (cid: string) => clients.find((c) => c.id === cid)?.name ?? 'Client';

  return (
    <div className="fadein eh">
      <div className="eh-top sticky-top">
        <button
          className={`eh-brand eh-coachsw${menuOpen ? ' open' : ''}`}
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Switch coach"
        >
          <img src="/assets/images/logo.jpg" alt="Elevate Fitness" />
          <span className="eh-csw-lbl">{switcherLabel}</span>
          <ChevronDown size={16} className="eh-csw-chev" />
        </button>
        <div className="eh-top-act">
          <button
            className="eh-calbtn eh-notifbtn"
            onClick={() => toast('Notifications — coming soon')}
            aria-label="Notifications"
          >
            <Bell size={20} />
          </button>
        </div>
        {menuOpen && (
          <div className="profile-menu coach-menu">
            <div className="pm-title">View clients by coach</div>
            {coachOpts.map((o) => (
              <button
                key={o.id}
                className={`pm-opt${homeCoach === o.id ? ' on' : ''}`}
                onClick={() => {
                  setHomeCoach(o.id);
                  setMenuOpen(false);
                }}
              >
                <div className="pm-ava">
                  {o.id === 'All' ? '👥' : o.photo ? <img src={o.photo} alt={o.name} /> : initials(o.name)}
                </div>
                <div className="pm-tx">
                  <div className="pm-n">{o.name}</div>
                  <div className="pm-r">{o.role}</div>
                </div>
                {homeCoach === o.id && <span className="pm-ck">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>
      {menuOpen && <div className="pm-overlay" onClick={() => setMenuOpen(false)} />}

      <div className="eh-greet">
        {homeCoach === 'All' ? 'Viewing all coaches' : `${greet}, ${selectedName.split(' ')[0]} 👋`}
      </div>

      <div className="eh-stats">
        <div className="eh-stat" onClick={() => navigate('/schedule')}>
          <div className="eh-stat-ic ic-red">
            <Calendar size={18} />
          </div>
          <div className="eh-stat-tx">
            <div className="eh-stat-v">{sessionsToday}</div>
            <div className="eh-stat-l">Sessions Today</div>
            <div className="eh-stat-s">{remaining} remaining</div>
          </div>
        </div>
        <div className="eh-stat" onClick={() => navigate('/schedule')}>
          <div className="eh-stat-ic ic-grey">
            <UserCheck size={18} />
          </div>
          <div className="eh-stat-tx">
            <div className="eh-stat-v">{completedToday}</div>
            <div className="eh-stat-l">Completed</div>
            <div className="eh-stat-s">Today</div>
          </div>
        </div>
        <div className="eh-stat" onClick={() => go('Assessment due')}>
          <div className="eh-stat-ic ic-amber">
            <ClipboardList size={18} />
          </div>
          <div className="eh-stat-tx">
            <div className="eh-stat-v">{count('Assessment due')}</div>
            <div className="eh-stat-l">Assessments Due</div>
            <div className="eh-stat-s">Today</div>
          </div>
        </div>
        <div className="eh-stat" onClick={() => go('Active')}>
          <div className="eh-stat-ic ic-grey">
            <Users size={18} />
          </div>
          <div className="eh-stat-tx">
            <div className="eh-stat-v">{count('Active')}</div>
            <div className="eh-stat-l">Active Clients</div>
            <div className="eh-stat-s">This Month</div>
          </div>
        </div>
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
          activity.map((a) => (
            <div className="act-row" key={`${a.clientId}-${a.date}`}>
              <div className="act-ic ai-green">
                <Check size={16} />
              </div>
              <div className="act-body">
                <div className="act-tx">
                  {a.early ? 'Ended session early with' : 'Completed session with'} {clientName(a.clientId)}
                </div>
                <div className="act-tm">{relativeDay(a.date)}</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="sp80" />
    </div>
  );
}
