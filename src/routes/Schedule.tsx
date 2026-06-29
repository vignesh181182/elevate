import { type CSSProperties, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useClients, useCoachNameMap } from '../hooks/useData';
import { catStyle } from '../lib/categories';
import { initials } from '../lib/format';
import { parseDays } from '../domain/client';
import type { Client } from '../domain/types';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function timeToMinutes(t: string): number {
  const m = String(t || '').match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return 9999;
  let h = +m[1] % 12;
  if (/pm/i.test(m[3])) h += 12;
  return h * 60 + +m[2];
}

export default function Schedule() {
  const navigate = useNavigate();
  const { data: clients = [] } = useClients();
  const coachName = useCoachNameMap();

  // Default to today's weekday (Mon–Sat); Sunday falls back to Mon.
  const todayAbbr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];
  const [day, setDay] = useState(DAYS.includes(todayAbbr) ? todayAbbr : 'Mon');

  const sessions = useMemo(() => {
    return clients
      .filter((c) => c.scheduleSet && parseDays(c.days).includes(day))
      .map((c) => ({ time: c.time || '—', c }))
      .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
  }, [clients, day]);

  return (
    <div className="fadein">
      <div className="bar">
        <div className="bar-title">Schedule</div>
      </div>

      <div className="filters">
        {DAYS.map((d) => (
          <button key={d} className={`fchip${day === d ? ' on' : ''}`} onClick={() => setDay(d)}>
            {d}
          </button>
        ))}
      </div>

      <div className="wkbanner pad-h">
        {day} · {sessions.length} session{sessions.length === 1 ? '' : 's'} — tap a client to open
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
          const coach = c.coachId ? coachName[c.coachId] ?? 'Unassigned' : 'Unassigned';
          return (
            <div className="sess-row tap" key={c.id} onClick={() => navigate(`/clients/${c.id}`)}>
              <span className="sess-time">{time}</span>
              <div className="ava sz38 tint-cat" style={avaStyle}>
                {initials(c.name)}
              </div>
              <div className="sess-main">
                <div className="sess-name">{c.name}</div>
                <div className="sess-sub">
                  {c.category} · Coach {coach}
                </div>
              </div>
              <div className="cr-chev">
                <ChevronRight size={18} />
              </div>
            </div>
          );
        })
      )}

      <div className="sp80" />
    </div>
  );
}
