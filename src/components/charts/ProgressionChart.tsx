import type { ProgPoint } from '../../domain/progress';

// Exercise progression chart (ported from progressionChart): solid accent
// estimated-1RM line + dashed dim actual-weight line, W-axis, start/end labels.
export default function ProgressionChart({ pts }: { pts: ProgPoint[] }) {
  if (!pts.length) return <div className="pg-empty">No logged data for this exercise yet.</div>;
  if (pts.length === 1) {
    const p = pts[0];
    return (
      <div className="pg-single">
        <div className="pg-single-v">
          {p.e1rm}
          <small> kg est. 1RM</small>
        </div>
        <div className="pg-single-l">
          W{p.week} · {p.weight}kg × {p.reps}
        </div>
      </div>
    );
  }

  const w = 320;
  const h = 180;
  const padX = 30;
  const padT = 22;
  const padB = 28;
  const e1 = pts.map((p) => p.e1rm);
  const wt = pts.map((p) => p.weight);
  const allv = e1.concat(wt);
  const min = Math.min(...allv);
  const max = Math.max(...allv);
  const rng = max - min || 1;
  const X = (i: number) => padX + (i * (w - 2 * padX)) / (pts.length - 1);
  const Y = (v: number) => h - padB - ((v - min) / rng) * (h - padT - padB);
  const ln = (arr: number[]) => arr.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1)).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="chart-svg">
      {[0, 0.5, 1].map((t) => {
        const y = (padT + t * (h - padT - padB)).toFixed(1);
        return <line key={t} x1={padX} y1={y} x2={w - padX} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />;
      })}
      <path d={ln(wt)} fill="none" stroke="var(--text-dim)" strokeWidth={1.8} strokeDasharray="4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d={ln(e1)} fill="none" stroke="var(--accent)" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => {
        const last = i === pts.length - 1;
        return (
          <circle
            key={i}
            cx={X(i).toFixed(1)}
            cy={Y(p.e1rm).toFixed(1)}
            r={last ? 4 : 3}
            fill={last ? 'var(--accent)' : '#fff'}
            stroke="var(--accent)"
            strokeWidth={2}
          />
        );
      })}
      {pts.map((p, i) => (
        <text key={`x${i}`} x={X(i).toFixed(1)} y={h - 8} fontSize={9} fill="var(--muted)" textAnchor="middle">
          W{p.week}
        </text>
      ))}
      <text x={padX} y={(Y(e1[0]) - 8).toFixed(1)} fontSize={10} fontWeight={700} fill="var(--muted)">
        {e1[0]}
      </text>
      <text x={(w - padX).toFixed(1)} y={(Y(e1[e1.length - 1]) - 8).toFixed(1)} fontSize={11} fontWeight={700} fill="var(--accent)" textAnchor="end">
        {e1[e1.length - 1]}
      </text>
    </svg>
  );
}
