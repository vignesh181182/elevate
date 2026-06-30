import { useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Wallet,
  Calendar,
  ClipboardList,
  ClipboardCheck,
  CircleAlert,
  Users,
  UserPlus,
  UserCheck,
  ChevronDown,
} from 'lucide-react';
import { useAuth, useIsMainCoach } from '../auth/AuthProvider';
import { useClients, useCoaches, useCoachNameMap, useDaySessions, useBillings } from '../hooks/useData';
import { parseDays } from '../domain/client';
import { catStyle } from '../lib/categories';
import { initials } from '../lib/format';
import { CLIENT_FILTERS, type FilterKey } from '../domain/filters';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const ROW_CAP = 12;

type SessState = 'done' | 'absent' | 'cancelled' | 'inprogress' | 'upcoming';
const TAGS: Record<SessState, { label: string; cls: string } | undefined> = {
  done: { label: 'Done', cls: 'done' },
  absent: { label: 'Absent', cls: 'missed' },
  cancelled: { label: 'Cancelled', cls: 'missed' },
  inprogress: { label: 'In progress', cls: 'prog' },
  upcoming: undefined,
};

function timeToMinutes(t: string): number {
  const m = String(t || '').match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return 9999;
  let h = +m[1] % 12;
  if (/pm/i.test(m[3])) h += 12;
  return h * 60 + +m[2];
}

export default function Home() {
  const { coach } = useAuth();
  const isMain = useIsMainCoach();
  const navigate = useNavigate();
  const { data: clients = [] } = useClients();
  const { data: coaches = [] } = useCoaches();
  const coachName = useCoachNameMap();
  const ids = useMemo(() => clients.map((c) => c.id), [clients]);
  const { data: billings = {} } = useBillings(ids);

  // Coach switcher — scope the whole dashboard to one coach's roster (or All).
  const [homeCoach, setHomeCoach] = useState<string>(coach?.id ?? 'All');
  const [menuOpen, setMenuOpen] = useState(false);

  const scoped = useMemo(
    () => (homeCoach === 'All' ? clients : clients.filter((c) => c.coachId === homeCoach)),
    [clients, homeCoach],
  );

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

  // Today's schedule — derived from real client schedules (scoped), chronological.
  const now = new Date();
  const todayAbbr = WEEKDAYS[now.getDay()];
  const todayISO = now.toISOString().slice(0, 10);
  const todaySched = useMemo(
    () =>
      scoped
        .filter((c) => c.scheduleSet && parseDays(c.days).includes(todayAbbr))
        .map((c) => ({ c, time: c.time || '—' }))
        .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time)),
    [scoped, todayAbbr],
  );
  const todayIds = useMemo(() => todaySched.map((s) => s.c.id), [todaySched]);
  const { data: daySessions = {} } = useDaySessions(todayIds, todayISO);

  // Each row's live state from real attendance + completion (present ⇒ circuit started).
  const stateOf = (id: string): SessState => {
    const s = daySessions[id];
    if (s?.status === 'completed') return 'done';
    if (s?.attendance === 'absent') return 'absent';
    if (s?.attendance === 'cancelled') return 'cancelled';
    if (s?.attendance === 'present') return 'inprogress';
    return 'upcoming';
  };

  const sessionsToday = todaySched.length;
  const completedToday = todaySched.filter((s) => stateOf(s.c.id) === 'done').length;
  const remaining = Math.max(0, sessionsToday - completedToday);

  // Show only the live part of the day: current + upcoming; hide finished; keep a
  // missed/cancelled slot only if it's still ahead of the earliest live session.
  const liveTimes = todaySched
    .filter((s) => stateOf(s.c.id) === 'inprogress' || stateOf(s.c.id) === 'upcoming')
    .map((s) => timeToMinutes(s.time));
  const nowMin = liveTimes.length ? Math.min(...liveTimes) : Infinity;
  const visible = todaySched.filter((s) => {
    const st = stateOf(s.c.id);
    if (st === 'inprogress' || st === 'upcoming') return true;
    if (st === 'done') return false;
    return timeToMinutes(s.time) >= nowMin;
  });
  const rows = visible.slice(0, ROW_CAP);
  const hiddenCount = visible.length - rows.length;
  const groups: { time: string; items: typeof rows }[] = [];
  rows.forEach((s) => {
    const g = groups[groups.length - 1];
    if (g && g.time === s.time) g.items.push(s);
    else groups.push({ time: s.time, items: [s] });
  });

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

  // Client Insights — every card is a real filter (no fabricated rates/deltas).
  // Billing-dependent cards are head-coach only (juniors never receive billing).
  const insights: { key: FilterKey; icon: typeof Wallet; cls: string; label: string; sub: string; main?: boolean }[] = [
    { key: 'Leads', icon: UserPlus, cls: 'ic-grey', label: 'New Leads', sub: 'Not yet activated' },
    { key: 'Assessment due', icon: ClipboardList, cls: 'ic-amber', label: 'Assessments Due', sub: 'Today' },
    { key: 'Review due', icon: ClipboardCheck, cls: 'ic-grey', label: 'Reviews Due', sub: 'Weekly check-in' },
    { key: 'Payment due', icon: Wallet, cls: 'ic-red', label: 'Pending Payments', sub: 'Awaiting payment', main: true },
    { key: 'Membership expiring', icon: Calendar, cls: 'ic-purple', label: 'Memberships Expiring', sub: 'In next 7 days', main: true },
    { key: 'Payment overdue', icon: CircleAlert, cls: 'ic-orange', label: 'Payment Overdue', sub: 'Needs follow-up', main: true },
  ];

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
            onClick={() => navigate('/notifications')}
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

      <div className="eh-cols">
        {/* Today's Schedule — live timeline */}
        <div className="es-col eh-card">
          <div className="eh-card-h">
            <div className="eh-card-t">Today&rsquo;s Schedule</div>
            <button className="eh-viewall" onClick={() => navigate('/schedule')}>
              View all
            </button>
          </div>
          {visible.length === 0 ? (
            <div className="es-empty">No upcoming sessions today.</div>
          ) : (
            <>
              <div className="es-list">
                {groups.map((g) => (
                  <div className="es-group" key={g.time}>
                    <div className="es-ghead">{g.time}</div>
                    {g.items.map(({ c }) => {
                      const st = stateOf(c.id);
                      const cat = catStyle(c.category);
                      const avaStyle = { '--c-bg': cat.b, '--c-fg': cat.c } as CSSProperties;
                      const rowCls = st === 'inprogress' ? ' live' : st === 'absent' || st === 'cancelled' ? ' missed' : '';
                      const tag = TAGS[st];
                      const dest =
                        st === 'inprogress' || st === 'upcoming' ? `/clients/${c.id}/session` : `/clients/${c.id}`;
                      return (
                        <div className={`es-row${rowCls}`} key={c.id} onClick={() => navigate(dest)}>
                          <span className="es-node">
                            <span className="es-dot" />
                          </span>
                          <div className="es-ava tint-cat" style={avaStyle}>
                            {initials(c.name)}
                          </div>
                          <div className="es-main">
                            <div className="es-name">{c.name}</div>
                            <div className="es-prog">
                              {c.category}
                              {homeCoach === 'All' && c.coachId && (
                                <>
                                  {' · '}
                                  <span className="es-coach">{coachName[c.coachId] ?? 'Unassigned'}</span>
                                </>
                              )}
                            </div>
                          </div>
                          {tag && <span className={`es-tag ${tag.cls}`}>{tag.label}</span>}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
              {hiddenCount > 0 && (
                <button className="es-more" onClick={() => navigate('/schedule')}>
                  +{hiddenCount} more session{hiddenCount === 1 ? '' : 's'} ›
                </button>
              )}
            </>
          )}
        </div>

        {/* Right column — alerts + quick stats */}
        <div className="ea-col">
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
        </div>
      </div>

      <div className="ei-wrap">
        <div className="ei-h">Client Insights</div>
        <div className="ei-grid">
          {insights
            .filter((i) => !i.main || isMain)
            .map((i) => (
              <div className="ei-card" key={i.key} onClick={() => go(i.key)}>
                <div className="ei-top">
                  <div className={`ei-ic ${i.cls}`}>
                    <i.icon size={18} />
                  </div>
                  <div className="ei-v">{count(i.key)}</div>
                </div>
                <div className="ei-l">{i.label}</div>
                <div className="ei-s">{i.sub}</div>
              </div>
            ))}
        </div>
      </div>

      <div className="sp80" />
    </div>
  );
}
