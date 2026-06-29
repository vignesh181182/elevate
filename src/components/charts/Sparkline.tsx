// Tiny sparkline (ported from miniSparkline). Survives sparse data: 0 → empty,
// 1 → a dot, 2+ → a line.
export default function Sparkline({ vals, stroke = 'var(--accent)' }: { vals: number[]; stroke?: string }) {
  if (!vals || !vals.length) return <svg viewBox="0 0 100 30" className="spark-svg" />;
  if (vals.length === 1)
    return (
      <svg viewBox="0 0 100 30" className="spark-svg">
        <circle cx={50} cy={15} r={3} fill={stroke} />
      </svg>
    );
  const w = 100;
  const h = 30;
  const pad = 4;
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const rng = max - min || 1;
  const pts = vals.map((v, i) => [pad + (i * (w - 2 * pad)) / (vals.length - 1), h - pad - ((v - min) / rng) * (h - 2 * pad)]);
  const path = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="spark-svg">
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
