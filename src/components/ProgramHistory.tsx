import { Dumbbell } from 'lucide-react';
import { fmtShortDate, fmtProgRange } from '../lib/format';
import { programDisplayName } from '../domain/client';
import type { Client, ProgramExercise, ProgramHistory as ProgramHistoryRec } from '../domain/types';

// One program card — the live program (current) or an archived record.
type CardRec = {
  name: string;
  no: number;
  startDate?: string;
  endDate?: string;
  weeks: number;
  perWeek: number;
  sessionsCompleted: number;
  exercises: { name: string }[];
};

function ProgramCard({ rec, current }: { rec: CardRec; current: boolean }) {
  const total = rec.weeks * rec.perWeek;
  const names = rec.exercises.map((e) => e.name);
  const shown = names.slice(0, 5).join(' · ') + (names.length > 5 ? ' · …' : '');
  const range = current
    ? `Started ${rec.startDate ? fmtShortDate(rec.startDate) : '—'} · ongoing`
    : fmtProgRange(rec.startDate, rec.endDate);
  return (
    <div className={`ph-card${current ? ' current' : ''}`}>
      {current && <div className="ph-curlabel">Current program</div>}
      <div className="ph-top">
        <div className="ph-name">{rec.name}</div>
        <span className="ph-no">Program #{rec.no}</span>
      </div>
      <div className="ph-range">{range}</div>
      <div className="ph-stats">
        {rec.weeks} weeks · {rec.perWeek}/week · {rec.sessionsCompleted} of {total} sessions completed
      </div>
      <div className="ph-exlist">{names.length ? shown : 'No exercises'}</div>
    </div>
  );
}

// Program history view: the current program plus archived records (newest first).
export default function ProgramHistory({
  client,
  exercises,
  history,
}: {
  client: Client;
  exercises: ProgramExercise[];
  history: ProgramHistoryRec[];
}) {
  const first = client.name.split(' ')[0];
  const liveExercises = exercises.filter((e) => !e.future && e.name !== 'Tap to add exercise');
  const hasCurrent = !!client.program && liveExercises.length > 0;
  const p = client.program;

  const currentRec: CardRec | null =
    hasCurrent && p
      ? {
          name: programDisplayName(p),
          no: p.no ?? 1,
          startDate: p.startDate,
          weeks: p.weeks,
          perWeek: p.perWeek,
          sessionsCompleted: p.done ?? 0,
          exercises: liveExercises.map((e) => ({ name: e.name })),
        }
      : null;

  const past = [...history].reverse(); // service sorts by no asc → newest first

  return (
    <div className="pad">
      {currentRec && <ProgramCard rec={currentRec} current />}
      {past.length > 0 ? (
        <>
          <div className="ph-sec">History</div>
          {past.map((r) => (
            <ProgramCard key={r.id} rec={r} current={false} />
          ))}
        </>
      ) : hasCurrent ? (
        <div className="ph-empty-inline">
          No program history yet — {first}&rsquo;s first program is the one running now.
        </div>
      ) : (
        <div className="ph-empty">
          <div className="ph-empty-ic">
            <Dumbbell />
          </div>
          <div className="ph-empty-t">No programs yet</div>
        </div>
      )}
    </div>
  );
}
