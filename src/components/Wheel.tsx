// Wheel of fortune: one segment per entry, so more purchases mean a bigger share.
// The landing segment is decided by the seeded draw; the spin only animates it.

// Breakpodden palette: gold, black, cream, navy, light gold, near-black.
const COLORS = ['#b08d2f', '#111111', '#e5dec9', '#1d243d', '#d9b654', '#000000'];
const INK = ['#ffffff', '#ffffff', '#1d243d', '#ffffff', '#111111', '#d9b654'];

const pt = (cx: number, cy: number, r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.sin(a), cy - r * Math.cos(a)];
};

export default function Wheel({ entries, rotation, size = 520, instant }: { entries: string[]; rotation: number; size?: number; instant?: boolean }) {
  const n = Math.max(entries.length, 1);
  const seg = 360 / n;
  const c = size / 2;
  const r = c - 8;
  const fontSize = Math.max(8, Math.min(15, (seg / 360) * 2 * Math.PI * r * 0.55));

  return (
    <div className="wheel-stage">
      <div className="wheel-pointer" />
      <svg
        className={`wheel-svg${instant ? ' instant' : ''}`}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: `rotate(${rotation}deg)`, maxWidth: '100%', height: 'auto' }}
      >
        <circle cx={c} cy={c} r={c - 2} fill="#000" stroke="#b08d2f" strokeWidth="6" />
        {entries.map((name, i) => {
          const a0 = i * seg;
          const a1 = a0 + seg;
          const [x0, y0] = pt(c, c, r, a0);
          const [x1, y1] = pt(c, c, r, a1);
          const mid = a0 + seg / 2;
          const k = n % COLORS.length === 1 && i === n - 1 ? 2 : i % COLORS.length;
          return (
            <g key={i}>
              <path
                d={n === 1 ? `M${c} ${c - r}A${r} ${r} 0 1 1 ${c - 0.01} ${c - r}Z` : `M${c} ${c}L${x0} ${y0}A${r} ${r} 0 ${seg > 180 ? 1 : 0} 1 ${x1} ${y1}Z`}
                fill={COLORS[k]}
                stroke="#000"
                strokeWidth="1"
              />
              <text
                x={c}
                y={c - r + 14}
                transform={`rotate(${mid} ${c} ${c}) rotate(90 ${c} ${c - r + 14})`}
                fill={INK[k]}
                fontSize={fontSize}
                fontFamily="Inter, sans-serif"
                fontWeight="600"
                dominantBaseline="middle"
              >
                {name.length > 16 ? `${name.slice(0, 15)}…` : name}
              </text>
            </g>
          );
        })}
        <circle cx={c} cy={c} r={size * 0.09} fill="#000" stroke="#b08d2f" strokeWidth="3" />
        <text x={c} y={c + 1} textAnchor="middle" dominantBaseline="middle" fill="#d9b654" fontFamily="Outfit, sans-serif" fontSize={size * 0.045} fontWeight="600">
          SPIN
        </text>
      </svg>
    </div>
  );
}

/** Rotation that lands segment `index` under the top pointer, after several full turns. */
export function landingRotation(current: number, index: number, count: number, jitter: number) {
  const seg = 360 / count;
  const target = -((index + 0.5) * seg + jitter * seg * 0.35);
  const base = current + 360 * 7;
  const delta = (((target - base) % 360) + 360) % 360;
  return base + delta;
}
