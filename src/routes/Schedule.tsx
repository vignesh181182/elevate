import { type CSSProperties, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useClients, useCoachNameMap, useDaySessions, useMarkAttendance } from '../hooks/useData';
import { useAuth } from '../auth/AuthProvider';
import { useToast } from '../components/Toast';
import AttendanceSheet from '../components/AttendanceSheet';
import { catStyle } from '../lib/categories';
import { initials } from '../lib/format';
import { parseDays } from '../domain/client';
import type { Attendance, Client } from '../domain/types';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ATT_CHIP: Record<Attendance, { cls: string; label: string }> = {
  present: { cls: 'ap', label: '✓ Present' },
  absent: { cls: 'aa', label: '✕ Absent' },
  cancelled: { cls: 'ac2', label: '🚫 Cancelled' },
};

function timeToMinutes(t: string): number {
  const m = String(t || '').match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return 9999;
  let h = +m[1] % 12;
  if (/pm/i.test(m[3])) h += 12;
  return h * 60 + +m[2];
}

export default function Schedule() {
  const navigate = useNavigate();
  const toast = useToast();
  const { coach } = useAuth();
  const { data: clients = [] } = useClients();
  const coachName = useCoachNameMap();

  // Default to today's weekday (Mon–Sat); Sunday falls back to Mon.
  const now = new Date();
  const todayAbbr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];
  const todayISO = now.toISOString().slice(0, 10);
  const [day, setDay] = useState(DAYS.includes(todayAbbr) ? todayAbbr : 'Mon');
  const [week, setWeek] = useState(0); // 0 = this week, up to 8 weeks ahead
  // Attendance is today-only: only the current week's actual today maps to a real date.
  const isToday = week === 0 && day === todayAbbr;

  // Week context — Monday of (this week + offset), its date range, and the selected
  // day's date. Mirrors the prototype's schedWeekInfo (anchored to the real week).
  const fmt = (d: Date) => `${d.getDate()} ${d.toLocaleDateString('en-GB', { month: 'short' })}`;
  const weekInfo = useMemo(() => {
    const dow = (now.getDay() + 6) % 7; // Mon=0 … Sun=6
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(now.getDate() - dow + 7 * week);
    const end = new Date(start);
    end.setDate(end.getDate() + 5);
    const label = week === 0 ? 'This week' : week === 1 ? 'Next week' : `In ${week} weeks`;
    const sel = new Date(start);
    sel.setDate(start.getDate() + DAYS.indexOf(day));
    return { label, range: `${fmt(start)} – ${fmt(end)}`, selDateLabel: fmt(sel) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, week]);
  const selDateLabel = weekInfo.selDateLabel;

  const sessions = useMemo(() => {
    return clients
      .filter((c) => c.scheduleSet && parseDays(c.days).includes(day))
      .map((c) => ({ time: c.time || '—', c }))
      .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
  }, [clients, day]);

  // Attendance is a today-only action — other weekday columns don't map to a real date.
  const dayIds = useMemo(() => sessions.map((s) => s.c.id), [sessions]);
  const { data: daySessions = {} } = useDaySessions(isToday ? dayIds : [], todayISO);
  const mark = useMarkAttendance(todayISO);

  const [sheetFor, setSheetFor] = useState<Client | null>(null);

  function pick(status: Attendance) {
    const c = sheetFor;
    if (!c) return;
    if (!coach?.id) return toast('Not signed in');
    mark.mutate(
      { clientId: c.id, status, markedBy: coach.id },
      {
        onSuccess: () => toast(`${c.name.split(' ')[0]} — ${status}`),
        onError: () => toast('Could not save attendance'),
      },
    );
    setSheetFor(null);
  }

  return (
    <div className="fadein">
      <div className="bar">
        <div className="bar-title">Schedule</div>
      </div>

      <div className="sched-week">
        <button
          className="sw-arrow"
          onClick={() => setWeek((w) => Math.max(0, w - 1))}
          disabled={week <= 0}
          aria-label="Previous week"
        >
          ‹
        </button>
        <div className="sw-label">
          <b>{weekInfo.label}</b>
          <span>{weekInfo.range}</span>
        </div>
        <button
          className="sw-arrow"
          onClick={() => setWeek((w) => Math.min(8, w + 1))}
          aria-label="Next week"
        >
          ›
        </button>
      </div>

      <div className="filters">
        {DAYS.map((d) => (
          <button key={d} className={`fchip${day === d ? ' on' : ''}`} onClick={() => setDay(d)}>
            {d}
          </button>
        ))}
      </div>

      <div className="wkbanner pad-h">
        {day} {selDateLabel} · {sessions.length} session{sessions.length === 1 ? '' : 's'}
        {isToday ? ' — tap to open · ⋯ to mark attendance' : ' — tap a client to open'}
      </div>

      {sessions.length === 0 ? (
        <div className="empty">
          <div className="em">📅</div>
          <p>No sessions on {day}.</p>
        </div>
      ) : (
        sessions.map(({ time, c }: { time: string; c: Client }) => {
          const cat = catStyle(c.category);
          const avaStyle = { '--c-bg': cat.b, '--c-fg': cat.c } as CSSProperties;
          const coachLabel = c.coachId ? coachName[c.coachId] ?? 'Unassigned' : 'Unassigned';
          const att = daySessions[c.id]?.attendance;
          return (
            <div
              className="sess-row tap"
              key={c.id}
              onClick={() => navigate(isToday ? `/clients/${c.id}/session` : `/clients/${c.id}`)}
            >
              <span className="sess-time">{time}</span>
              <div className="ava sz38 tint-cat" style={avaStyle}>
                {initials(c.name)}
              </div>
              <div className="sess-main">
                <div className="sess-name">{c.name}</div>
                <div className="sess-sub">
                  {c.category} · Coach {coachLabel}
                </div>
              </div>
              {isToday ? (
                <div className="sess-att" onClick={(e) => e.stopPropagation()}>
                  {att && <span className={`att-chip ${ATT_CHIP[att].cls}`}>{ATT_CHIP[att].label}</span>}
                  <button className="att-dots" onClick={() => setSheetFor(c)} aria-label="Mark attendance">
                    ⋯
                  </button>
                </div>
              ) : (
                <div className="cr-chev">
                  <ChevronRight size={18} />
                </div>
              )}
            </div>
          );
        })
      )}

      <div className="sp80" />

      {sheetFor && (
        <AttendanceSheet
          name={sheetFor.name}
          current={daySessions[sheetFor.id]?.attendance}
          onPick={pick}
          onClose={() => setSheetFor(null)}
        />
      )}
    </div>
  );
}
