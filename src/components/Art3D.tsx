// Original 3D-style artwork (SVG): soft gradients, rim light, glossy highlights
// and a ground shadow, in the spirit of game-dashboard icons. No external assets.
import { useId } from 'react';

type Kind = 'gift' | 'dice' | 'wheel' | 'duck' | 'trophy' | 'cards' | 'shield' | 'ticket';

export default function Art3D({ kind, size = 140, className = '' }: { kind: Kind; size?: number; className?: string }) {
  const u = useId().replace(/:/g, '');
  const g = (id: string) => `url(#${id}-${u})`;
  const shadow = <ellipse cx="60" cy="112" rx="34" ry="6" fill="#000" opacity=".35" filter={g('blur')} />;
  const defs = (
    <defs>
      <filter id={`blur-${u}`}><feGaussianBlur stdDeviation="3" /></filter>
      <linearGradient id={`gold-${u}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff0b0" /><stop offset=".45" stopColor="#f2c14e" /><stop offset="1" stopColor="#a8741a" /></linearGradient>
      <linearGradient id={`violet-${u}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#d6a8ff" /><stop offset=".5" stopColor="#9b4dff" /><stop offset="1" stopColor="#4b16b8" /></linearGradient>
      <linearGradient id={`violetD-${u}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7a2fe0" /><stop offset="1" stopColor="#3a0f8f" /></linearGradient>
      <linearGradient id={`blue-${u}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#9fd0ff" /><stop offset=".5" stopColor="#3d8bff" /><stop offset="1" stopColor="#1640b8" /></linearGradient>
      <linearGradient id={`red-${u}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff9aa8" /><stop offset=".5" stopColor="#ff3d6e" /><stop offset="1" stopColor="#b3123e" /></linearGradient>
      <linearGradient id={`lime-${u}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e9ffb0" /><stop offset=".5" stopColor="#a6ff3d" /><stop offset="1" stopColor="#4f9e0f" /></linearGradient>
      <linearGradient id={`white-${u}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#d9dcf0" /></linearGradient>
      <linearGradient id={`duck-${u}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff6a0" /><stop offset=".55" stopColor="#ffd12e" /><stop offset="1" stopColor="#e58f0c" /></linearGradient>
      <radialGradient id={`gloss-${u}`} cx=".35" cy=".25" r=".6"><stop offset="0" stopColor="#fff" stopOpacity=".75" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
    </defs>
  );

  let body: React.ReactNode = null;
  if (kind === 'gift') {
    body = <>
      <path d="M22 54h76v48a6 6 0 0 1-6 6H28a6 6 0 0 1-6-6z" fill={g('violetD')} />
      <path d="M22 54h76v14H22z" fill="#000" opacity=".18" />
      <rect x="16" y="40" width="88" height="18" rx="5" fill={g('violet')} />
      <rect x="53" y="40" width="14" height="68" fill={g('gold')} />
      <path d="M60 40c-10-18-30-18-30-6 0 8 14 8 30 6zM60 40c10-18 30-18 30-6 0 8-14 8-30 6z" fill={g('gold')} stroke="#a8741a" strokeWidth="1" />
      <ellipse cx="44" cy="46" rx="22" ry="4" fill={g('gloss')} />
    </>;
  } else if (kind === 'dice') {
    const die = (x: number, y: number, r: number, pips: [number, number][]) => (
      <g transform={`translate(${x} ${y}) rotate(${r})`}>
        <rect x="-22" y="-22" width="44" height="44" rx="10" fill={g('white')} />
        <rect x="-22" y="-22" width="44" height="44" rx="10" fill="none" stroke="#b7bbd8" />
        <path d="M-22 12a10 10 0 0 0 10 10h24a10 10 0 0 0 10-10z" fill="#000" opacity=".08" />
        {pips.map(([px, py], i) => <circle key={i} cx={px} cy={py} r="4.2" fill={i === 0 && pips.length === 1 ? '#ff3d6e' : '#1b1d3a'} />)}
        <ellipse cx="-8" cy="-12" rx="12" ry="5" fill={g('gloss')} />
      </g>
    );
    body = <>
      {die(44, 74, -14, [[-10, -10], [0, 0], [10, 10]])}
      {die(78, 58, 16, [[0, 0]])}
    </>;
  } else if (kind === 'wheel') {
    const cols = ['#ff3d6e', '#f2c14e', '#3d8bff', '#a6ff3d', '#9b4dff', '#ffa53d', '#3d8bff', '#ff3d9a'];
    body = <>
      <circle cx="60" cy="62" r="44" fill={g('gold')} />
      {cols.map((c, i) => {
        const a0 = (i * 45 - 90) * Math.PI / 180, a1 = ((i + 1) * 45 - 90) * Math.PI / 180;
        return <path key={i} d={`M60 62L${60 + 38 * Math.cos(a0)} ${62 + 38 * Math.sin(a0)}A38 38 0 0 1 ${60 + 38 * Math.cos(a1)} ${62 + 38 * Math.sin(a1)}Z`} fill={c} />;
      })}
      <circle cx="60" cy="62" r="38" fill={g('gloss')} opacity=".6" />
      <circle cx="60" cy="62" r="10" fill="#1b1d3a" stroke={g('gold')} strokeWidth="3" />
      <path d="M60 12l-7 12h14z" fill="#fff" stroke="#a8741a" />
    </>;
  } else if (kind === 'duck') {
    body = <>
      <path d="M18 70q-4-18 10-14 6 18 24 18h26q16 0 16 14-8 16-38 16-34 0-38-34z" fill={g('duck')} />
      <circle cx="74" cy="46" r="20" fill={g('duck')} />
      <path d="M90 44q16-2 16 6-8 6-18 2z" fill="#ff8a1c" />
      <circle cx="78" cy="40" r="4" fill="#1b1d3a" /><circle cx="79.5" cy="38.5" r="1.4" fill="#fff" />
      <path d="M34 80q14 14 36 4-12-6-24-6z" fill="#e58f0c" opacity=".6" />
      <ellipse cx="66" cy="36" rx="10" ry="5" fill={g('gloss')} />
    </>;
  } else if (kind === 'trophy') {
    body = <>
      <path d="M36 22h48v22a24 24 0 0 1-48 0z" fill={g('gold')} />
      <path d="M36 28H24a12 12 0 0 0 14 18M84 28h12a12 12 0 0 1-14 18" fill="none" stroke={g('gold')} strokeWidth="6" />
      <rect x="54" y="66" width="12" height="16" fill={g('gold')} />
      <path d="M40 82h40l4 18H36z" fill={g('violet')} />
      <rect x="34" y="98" width="52" height="8" rx="3" fill={g('violetD')} />
      <path d="M52 36l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="#fff" opacity=".9" />
      <ellipse cx="48" cy="30" rx="8" ry="4" fill={g('gloss')} />
    </>;
  } else if (kind === 'cards') {
    const card = (x: number, r: number, fill: string, star?: boolean) => (
      <g transform={`translate(${x} 64) rotate(${r})`}>
        <rect x="-22" y="-32" width="44" height="64" rx="7" fill={fill} stroke="#fff" strokeOpacity=".5" />
        <rect x="-17" y="-27" width="34" height="38" rx="4" fill="#fff" opacity=".2" />
        {star && <path d="M0 -18l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" fill="#fff" />}
        <rect x="-17" y="16" width="24" height="4" rx="2" fill="#fff" opacity=".6" />
      </g>
    );
    body = <>{card(36, -16, g('blue'))}{card(84, 16, g('red'))}{card(60, 0, g('violet'), true)}</>;
  } else if (kind === 'shield') {
    body = <>
      <path d="M60 14l38 14v28c0 26-16 44-38 52-22-8-38-26-38-52V28z" fill={g('lime')} />
      <path d="M60 22l30 11v23c0 21-12 36-30 43z" fill="#000" opacity=".12" />
      <path d="M43 60l12 12 22-24" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="46" cy="34" rx="12" ry="6" fill={g('gloss')} />
    </>;
  } else if (kind === 'ticket') {
    body = <>
      <g transform="rotate(-12 60 62)">
        <path d="M18 40h84v14a8 8 0 0 0 0 16v14H18V70a8 8 0 0 0 0-16z" fill={g('blue')} />
        <path d="M74 40v44" stroke="#fff" strokeWidth="2" strokeDasharray="4 4" opacity=".7" />
        <text x="44" y="68" textAnchor="middle" fontFamily="Unbounded, sans-serif" fontWeight="800" fontSize="16" fill="#fff">VIP</text>
        <ellipse cx="38" cy="46" rx="16" ry="4" fill={g('gloss')} />
      </g>
    </>;
  }

  return (
    <svg className={`art3d ${className}`} width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
      {defs}
      {shadow}
      <g className="art3d-float">{body}</g>
    </svg>
  );
}
