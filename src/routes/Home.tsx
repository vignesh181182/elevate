import { useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Wallet,
  Calendar,
  ClipboardList,
  CircleAlert,
  TriangleAlert,
  Users,
  UserCheck,
  ChevronDown,
} from 'lucide-react';
import { useAuth, useIsMainCoach } from '../auth/AuthProvider';
import { useClients, useCoaches, useCoachNameMap, useDaySessions, useBillings } from '../hooks/useData';
import { parseDays } from '../domain/client';
import { buildNotifications } from '../domain/notifications';
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
  // Bell badge — same feed the Notifications screen shows (all clients, role-aware).
  const notifCount = useMemo(() => buildNotifications(clients, billings, isMain).length, [clients, billings, isMain]);

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

  // Logged-in coach first, then the rest — so the current user is always on top.
  const orderedCoaches = useMemo(
    () => [...coaches].sort((a, b) => (a.id === coach?.id ? -1 : b.id === coach?.id ? 1 : 0)),
    [coaches, coach?.id],
  );

  const coachOpts = [
    { id: 'All', name: 'All coaches', role: 'Every coach', photo: undefined as string | undefined },
    ...orderedCoaches.map((c) => ({
      id: c.id,
      name: c.name,
      role: c.role === 'main' ? 'Head coach' : 'Coach',
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

  // Missed sessions today — real, from attendance (absent/cancelled). Any coach
  // (not billing-gated). Links to Schedule, where today's attendance is managed.
  const missedToday = todaySched.filter((s) => {
    const st = stateOf(s.c.id);
    return st === 'absent' || st === 'cancelled';
  }).length;

  // Today's attendance rate — attended (present/done) over every session with a recorded
  // outcome. Real data only: null (shown as '—') until something is marked, no fake default.
  const markedStates = todaySched.map((s) => stateOf(s.c.id)).filter((st) => st !== 'upcoming');
  const attendedCount = markedStates.filter((st) => st === 'done' || st === 'inprogress').length;
  const attRate = markedStates.length ? Math.round((attendedCount / markedStates.length) * 100) : null;

  // Critical alerts — only categories that have items. Missed leads (most urgent,
  // matching the prototype); payment ones are main-only.
  const alerts: { id: string; icon: typeof Wallet; cls: string; title: string; sub: string; onClick: () => void }[] = [];
  if (missedToday > 0) {
    alerts.push({
      id: 'missed',
      icon: TriangleAlert,
      cls: 'ic-red',
      title: `${missedToday} Missed Session${missedToday === 1 ? '' : 's'}`,
      sub: `${missedToday} client${missedToday === 1 ? '' : 's'} ${missedToday === 1 ? 'needs' : 'need'} attention`,
      onClick: () => navigate('/schedule'),
    });
  }
  if (isMain && count('Membership expiring') > 0) {
    const n = count('Membership expiring');
    alerts.push({ id: 'expiring', icon: Calendar, cls: 'ic-amber', title: 'Membership expiring', sub: `${n} client${n === 1 ? '' : 's'} in next 7 days`, onClick: () => go('Membership expiring') });
  }
  if (isMain && count('Payment overdue') > 0) {
    const n = count('Payment overdue');
    alerts.push({ id: 'overdue', icon: Wallet, cls: 'ic-red', title: 'Payment overdue', sub: `${n} client${n === 1 ? '' : 's'} with pending payments`, onClick: () => go('Payment overdue') });
  }
  if (count('Review due') > 0) {
    const n = count('Review due');
    alerts.push({ id: 'review', icon: ClipboardList, cls: 'ic-amber', title: 'Reviews due', sub: `${n} client${n === 1 ? '' : 's'} need a weekly review`, onClick: () => go('Review due') });
  }

  // Client Insights — merged with the old Quick Stats into one grid. Every card is real
  // (no fabricated rates/deltas): attendance + missed are attendance-derived; billing
  // cards are head-coach only (juniors never receive billing). `value` overrides the
  // big number when it isn't a plain count (e.g. the attendance %).
  const insights: {
    id: string;
    icon: typeof Wallet;
    cls: string;
    label: string;
    sub: string;
    count: number;
    value?: string;
    onClick: () => void;
    main?: boolean;
  }[] = [
    { id: 'Attendance', icon: UserCheck, cls: 'ic-green', label: 'Attendance Rate', sub: 'Today', count: attRate ?? 0, value: attRate == null ? '—' : `${attRate}%`, onClick: () => navigate('/schedule') },
    { id: 'Payment overdue', icon: CircleAlert, cls: 'ic-orange', label: 'Payment Overdue', sub: 'Needs follow-up', count: count('Payment overdue'), onClick: () => go('Payment overdue'), main: true },
    { id: 'Membership expiring', icon: Calendar, cls: 'ic-purple', label: 'Memberships Expiring', sub: 'In next 7 days', count: count('Membership expiring'), onClick: () => go('Membership expiring'), main: true },
    { id: 'missed', icon: CircleAlert, cls: 'ic-orange', label: 'Missed Sessions', sub: 'Clients need attention', count: missedToday, onClick: () => navigate('/schedule') },
    { id: 'Active', icon: Users, cls: 'ic-red', label: 'Active Clients', sub: 'Currently active', count: count('Active'), onClick: () => go('Active') },
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
            {notifCount > 0 && <span className="eh-nbadge">{notifCount}</span>}
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
        {homeCoach === 'All' ? 'View all coaches' : `${greet}, ${selectedName.split(' ')[0]} 👋`}
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
              {alerts.length > 0 && (
                <button className="eh-viewall" onClick={() => go('All')}>
                  View all
                </button>
              )}
            </div>
            {alerts.length === 0 ? (
              <div className="ea-empty">All clear — no critical alerts.</div>
            ) : (
              alerts.map((a) => (
                <div className="ea-row" key={a.id} onClick={a.onClick}>
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
        </div>
      </div>

      <div className="ei-wrap">
        <div className="ei-h">Client Insights</div>
        <div className="ei-grid">
          {insights
            .filter((i) => !i.main || isMain)
            .map((i) =>
              i.id === 'Attendance' ? (
                // Full-width hero: ring graph + label, so the remaining cards form a
                // balanced 2-up grid beneath it.
                <div className="ei-card ei-att" key={i.id} onClick={i.onClick}>
                  <AttRing pct={attRate ?? 0} label={i.value ?? String(i.count)} />
                  <div className="ei-att-tx">
                    <div className="ei-att-l">{i.label}</div>
                    <div className="ei-att-s">{i.sub}</div>
                  </div>
                </div>
              ) : (
                <div className="ei-card" key={i.id} onClick={i.onClick}>
                  <div className="ei-top">
                    <div className={`ei-ic ${i.cls}`}>
                      <i.icon size={18} />
                    </div>
                    <div className="ei-v">{i.value ?? i.count}</div>
                  </div>
                  <div className="ei-l">{i.label}</div>
                  <div className="ei-s">{i.sub}</div>
                </div>
              ),
            )}
        </div>
      </div>

      <div className="sp80" />
    </div>
  );
}

// Attendance ring — green arc over a faint track, with the % (or '—') centered inside.
function AttRing({ pct, label }: { pct: number; label: string }) {
  const r = 30;
  const cc = 2 * Math.PI * r;
  const dash = (cc * Math.max(0, Math.min(100, pct))) / 100;
  return (
    <div className="ei-ringwrap">
      <svg viewBox="0 0 72 72" className="ei-ring">
        <circle cx="36" cy="36" r={r} fill="none" stroke="var(--green-bg)" strokeWidth="7" />
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke="var(--green)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${dash.toFixed(1)} ${cc.toFixed(1)}`}
          transform="rotate(-90 36 36)"
        />
      </svg>
      <span className="ei-ring-v">{label}</span>
    </div>
  );
}
