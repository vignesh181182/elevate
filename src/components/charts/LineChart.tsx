// Body-measurement line chart (ported from lineChart). One value per program week.
export default function LineChart({ data }: { data: number[] }) {
  if (!data.length) return null;
  const w = 320;
  const h = 130;
  const pad = 24;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const rng = max - min || 1;
  const pts = data.map((v, i) => {
    const x = pad + (i * (w - 2 * pad)) / (data.length - 1 || 1);
    const y = h - pad - ((v - min) / rng) * (h - 2 * pad);
    return [x, y] as const;
  });
  const path = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="chart-w">
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0].toFixed(1)} cy={p[1].toFixed(1)} r={4} fill="var(--accent)" />
      ))}
      {data.map((_, i) => (
        <text key={`l${i}`} x={pts[i][0].toFixed(1)} y={h - 6} fontSize={9} fill="var(--muted)" textAnchor="middle">
          W{i + 1}
        </text>
      ))}
      <text x={pad} y={14} fontSize={10} fontWeight={700} fill="var(--ink)">
        {data[0]}
      </text>
      <text x={w - pad} y={14} fontSize={10} fontWeight={700} fill="var(--accent)" textAnchor="end">
        {data[data.length - 1]}
      </text>
    </svg>
  );
}
