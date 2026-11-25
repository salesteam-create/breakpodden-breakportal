/**
 * Club-style crest used as a buyer's profile badge instead of an initial.
 * Original artwork (no real club marks), built from the brand palette and
 * picked deterministically from the name, so the same buyer always gets
 * the same crest.
 */
const PALETTES: [string, string, string][] = [
  // field, pattern, emblem
  ['#e2b84a', '#c79a2f', '#17120a'],
  ['#c8102e', '#ff2e3b', '#f3d47a'],
  ['#1c1d24', '#2a2c34', '#e2b84a'],
  ['#f6dc8c', '#e2b84a', '#c8102e'],
  ['#ff2e3b', '#c8102e', '#ffffff'],
  ['#2a2c34', '#e2b84a', '#e2b84a'],
];
const PATTERNS = ['plain', 'stripes', 'halves', 'chevron', 'sash'] as const;
const EMBLEMS = ['star', 'crown', 'ball', 'bolt', 'stars'] as const;

const SHIELD = 'M20 2 L37 8 V23 C37 34 29.5 41.5 20 46 C10.5 41.5 3 34 3 23 V8 Z';

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function Emblem({ kind, c }: { kind: (typeof EMBLEMS)[number]; c: string }) {
  switch (kind) {
    case 'star':
      return <path d="M20 13 l2.6 5.4 5.9.8-4.3 4.1 1 5.8L20 26.4l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z" fill={c} />;
    case 'crown':
      return <path d="M12 28 L11 17 L16 21 L20 14 L24 21 L29 17 L28 28 Z M12 30 h16 v2.5 h-16z" fill={c} />;
    case 'ball':
      return (
        <g>
          <circle cx="20" cy="23" r="7.5" fill="none" stroke={c} strokeWidth="2" />
          <path d="M20 19.6 l3.2 2.3-1.2 3.8h-4l-1.2-3.8z" fill={c} />
        </g>
      );
    case 'bolt':
      return <path d="M22.5 12 L14 25 h5.2 L17.5 34 L26 21 h-5.2z" fill={c} />;
    case 'stars':
      return (
        <g fill={c}>
          <path d="M14 18 l1.6 3.3 3.6.5-2.6 2.5.6 3.6L14 26.2l-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z" />
          <path d="M26 18 l1.6 3.3 3.6.5-2.6 2.5.6 3.6L26 26.2l-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z" />
          <rect x="15" y="31" width="10" height="2.2" rx="1.1" />
        </g>
      );
  }
}

export default function Crest({ name, size = 34 }: { name: string; size?: number }) {
  const h = hash(name);
  const [field, pat, ink] = PALETTES[h % PALETTES.length];
  const pattern = PATTERNS[(h >>> 4) % PATTERNS.length];
  const emblem = EMBLEMS[(h >>> 8) % EMBLEMS.length];
  const id = `cr${h.toString(36)}`;
  return (
    <svg className="crest" width={size} height={size} viewBox="0 0 40 48" role="img" aria-label={`${name} crest`}>
      <defs>
        <clipPath id={id}><path d={SHIELD} /></clipPath>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".28" />
          <stop offset=".5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${id})`}>
        <rect width="40" height="48" fill={field} />
        {pattern === 'stripes' && [8, 18, 28].map((x) => <rect key={x} x={x} y="0" width="5" height="48" fill={pat} />)}
        {pattern === 'halves' && <rect x="20" y="0" width="20" height="48" fill={pat} />}
        {pattern === 'chevron' && <path d="M0 30 L20 40 L40 30 V48 H0z" fill={pat} />}
        {pattern === 'sash' && <path d="M0 6 L10 0 L40 40 V48 H34 Z" fill={pat} />}
        <rect width="40" height="48" fill={`url(#${id}g)`} />
      </g>
      <path d={SHIELD} fill="none" stroke="rgba(0,0,0,.35)" strokeWidth="1.5" />
      <path d={SHIELD} fill="none" stroke="rgba(255,255,255,.25)" strokeWidth=".8" transform="translate(20 24) scale(.9) translate(-20 -24)" />
      {pattern !== 'plain' && <circle cx="20" cy="23" r="10.5" fill={field} />}
      <Emblem kind={emblem} c={ink} />
    </svg>
  );
}
