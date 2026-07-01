import { type CSSProperties, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import {
  useClients,
  useClientsExercises,
  useDaySessions,
  useMarkAttendance,
} from '../hooks/useData';
import { useAuth } from '../auth/AuthProvider';
import { useToast } from '../components/Toast';
import AttendanceSheet from '../components/AttendanceSheet';
import { catStyle } from '../lib/categories';
import { initials } from '../lib/format';
import { parseDays } from '../domain/client';
import { daySummary } from '../domain/session';
import { isPlannable } from '../domain/program';
import type { Attendance, Client } from '../domain/types';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Week offset bounds: negative = past weeks (review older sessions), positive = ahead.
const MIN_WEEK = -26;
const MAX_WEEK = 8;

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

  // Default to today's weekday (Mon–Sat); Sunday falls back to Mon.
  const now = new Date();
  const todayAbbr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];
  const todayISO = now.toISOString().slice(0, 10);

  // Selected day + week live in the URL (?day=&week=) so that opening a client and
  // pressing back restores the exact day/week the coach was viewing. Defaults to today.
  const [sp, setSp] = useSearchParams();
  const dayParam = sp.get('day');
  const day = dayParam && DAYS.includes(dayParam) ? dayParam : DAYS.includes(todayAbbr) ? todayAbbr : 'Mon';
  const weekParam = parseInt(sp.get('week') ?? '', 10);
  const week = Number.isFinite(weekParam) ? Math.min(MAX_WEEK, Math.max(MIN_WEEK, weekParam)) : 0; // 0 = this week; <0 = past

  // Patch day/week in place (replace: true — chip taps shouldn't stack history entries).
  const patchParams = (next: { day?: string; week?: number }) => {
    const p = new URLSearchParams(sp);
    if (next.day !== undefined) p.set('day', next.day);
    if (next.week !== undefined) {
      if (next.week === 0) p.delete('week');
      else p.set('week', String(next.week));
    }
    setSp(p, { replace: true });
  };

  // Attendance is today-only: only the current week's actual today maps to a real date.
  const isToday = week === 0 && day === todayAbbr;
  // Offer a "jump to today" only when today is a schedulable weekday (Mon–Sat) and we're
  // not already there (a different day and/or a different week).
  const showJumpToday = DAYS.includes(todayAbbr) && !isToday;
  const jumpToToday = () => patchParams({ day: todayAbbr, week: 0 });

  // Week context — Monday of (this week + offset), its date range, and the selected
  // day's date. Mirrors the prototype's schedWeekInfo (anchored to the real week).
  const fmt = (d: Date) => `${d.getDate()} ${d.toLocaleDateString('en-GB', { month: 'short' })}`;
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const weekInfo = useMemo(() => {
    const dow = (now.getDay() + 6) % 7; // Mon=0 … Sun=6
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(now.getDate() - dow + 7 * week);
    const end = new Date(start);
    end.setDate(end.getDate() + 5);
    const label =
      week === 0
        ? 'This week'
        : week === 1
          ? 'Next week'
          : week === -1
            ? 'Last week'
            : week > 0
              ? `In ${week} weeks`
              : `${-week} weeks ago`;
    const sel = new Date(start);
    sel.setDate(start.getDate() + DAYS.indexOf(day));
    return { label, range: `${fmt(start)} – ${fmt(end)}`, selDateLabel: fmt(sel), selISO: iso(sel) };
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
  // Each shown client's program exercises, for the "N exercises · M muscle groups" summary.
  const { data: exMap = {} } = useClientsExercises(dayIds);
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
          onClick={() => patchParams({ week: Math.max(MIN_WEEK, week - 1) })}
          disabled={week <= MIN_WEEK}
          aria-label="Previous week"
        >
          ‹
        </button>
        <div className="sw-label">
          <b>{weekInfo.label}</b>
          <span>{weekInfo.range}</span>
        </div>
        {showJumpToday && (
          <button className="fchip today-jump" onClick={jumpToToday}>
            Today
          </button>
        )}
        <button
          className="sw-arrow"
          onClick={() => patchParams({ week: Math.min(MAX_WEEK, week + 1) })}
          disabled={week >= MAX_WEEK}
          aria-label="Next week"
        >
          ›
        </button>
      </div>

      <div className="filters sched-days">
        {DAYS.map((d) => (
          <button key={d} className={`fchip${day === d ? ' on' : ''}`} onClick={() => patchParams({ day: d })}>
            {d}
          </button>
        ))}
      </div>

      <div className="wkbanner pad-h">
        {day} {selDateLabel} · {sessions.length} session{sessions.length === 1 ? '' : 's'}
        {isToday ? ' — tap to open · ⋯ to mark attendance' : ' — tap to view the session'}
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
          const att = daySessions[c.id]?.attendance;
          // At-a-glance load for the selected day, from the client's standing program.
          const list = (exMap[c.id] ?? []).filter(isPlannable);
          const { exercises: nEx, groups: nGroups } = daySummary(list, day, c.program?.sets ?? undefined);
          const summary =
            nEx === 0
              ? 'No program yet'
              : [
                  `${nEx} exercise${nEx === 1 ? '' : 's'}`,
                  ...(nGroups > 0 ? [`${nGroups} muscle group${nGroups === 1 ? '' : 's'}`] : []),
                ].join(' · ');
          return (
            <div
              className="sess-row tap"
              key={c.id}
              onClick={() =>
                navigate(isToday ? `/clients/${c.id}/session` : `/clients/${c.id}/session?date=${weekInfo.selISO}`)
              }
            >
              <span className="sess-time">{time}</span>
              <div className="ava sz38 tint-cat" style={avaStyle}>
                {initials(c.name)}
              </div>
              <div className="sess-main">
                <div className="sess-name">{c.name}</div>
                <div className="sess-sub">{summary}</div>
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
