// Wheel of fortune: one segment per entry, so more purchases mean a bigger share.
// The landing segment is decided by the seeded draw; the spin only animates it.
// Static layers (gold rim, chasing lights, gloss, crest hub, pointer) sit on top of
// the rotating segment layer, so only the segments turn.

import { useEffect, useId, useRef, type CSSProperties } from 'react';
import { WORKSPACE } from '../lib/workspace.ts';

// Luxury palette: onyx, crimson, gold, charcoal. Each segment shades darker toward the hub.
const TONES = [
  { id: 'onyx', inner: '#050506', outer: '#1d1e24', ink: '#e9c766' },
  { id: 'crimson', inner: '#3d040b', outer: '#b3121f', ink: '#ffe7a8' },
  { id: 'gold', inner: '#7a5a14', outer: '#f1cf6e', ink: '#1a1203' },
  { id: 'char', inner: '#101014', outer: '#34353d', ink: '#f6dc8c' },
];
const STUDS = 36;
const PARTICLES = 22;

const pt = (cx: number, cy: number, r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.sin(a), cy - r * Math.cos(a)];
};

/** Current rotation of an element in degrees, read from its live (mid-transition) transform. */
function liveAngle(el: Element) {
  const m = getComputedStyle(el).transform;
  if (!m || m === 'none') return 0;
  const [a, b] = m.slice(m.indexOf('(') + 1, -1).split(',').map(Number);
  return (Math.atan2(b, a) * 180) / Math.PI;
}

interface Props {
  entries: string[];
  rotation: number;
  size?: number;
  instant?: boolean;
  spinning?: boolean;
  /** Index (in `entries`) of the segment to highlight once the wheel has stopped. */
  winner?: number | null;
  /** Spin duration in ms, kept in sync with the CSS transition. */
  duration?: number;
}

export default function Wheel({ entries, rotation, size = 520, instant, spinning, winner = null, duration = 6200 }: Props) {
  const uid = useId().replace(/:/g, '');
  const svgRef = useRef<SVGSVGElement>(null);
  const pointerRef = useRef<HTMLDivElement>(null);
  const n = Math.max(entries.length, 1);
  const seg = 360 / n;
  const c = size / 2;
  const rim = size * 0.055;
  const r = c - rim - 3;
  const fontSize = Math.max(8, Math.min(14, (seg / 360) * 2 * Math.PI * r * 0.5));

  // Pointer flicks each time a segment boundary passes under it, in sync with the real rotation.
  useEffect(() => {
    if (!spinning || !svgRef.current) return;
    let raf = 0;
    let last = -1;
    const loop = () => {
      const a = liveAngle(svgRef.current!);
      const idx = Math.floor(((((-a) % 360) + 360) % 360) / seg);
      if (idx !== last && last !== -1) {
        pointerRef.current?.animate(
          [{ transform: 'translateX(-50%) rotate(-16deg)' }, { transform: 'translateX(-50%) rotate(0deg)' }],
          { duration: 140, easing: 'cubic-bezier(.3,1.6,.5,1)' },
        );
      }
      last = idx;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [spinning, seg]);

  const showWinner = !spinning && winner !== null && winner >= 0 && winner < entries.length;

  return (
    <div className="wheel-stage">
      <div className={`wheel-wrap${spinning ? ' is-spinning' : ''}`} style={{ width: size, maxWidth: '100%' }}>
        <div className="wheel-rays" aria-hidden="true" />
        <div ref={pointerRef} className="wheel-pointer" style={{ width: size * 0.09, height: size * 0.13 }}>
          <svg viewBox="0 0 40 58" width="100%" height="100%">
            <defs>
              <linearGradient id={`pf-${uid}`} x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stopColor="#f3e6c0" />
                <stop offset=".45" stopColor="#b8973f" />
                <stop offset="1" stopColor="#6e561a" />
              </linearGradient>
            </defs>
            <path d="M20 57 L3 18 A17 17 0 1 1 37 18 Z" fill={`url(#pf-${uid})`} stroke="#2a2210" strokeWidth="1.5" />
            <circle cx="20" cy="17" r="7.5" fill="#b3121f" stroke="#f3e6c0" strokeWidth="2" />
            <circle cx="20" cy="17" r="4" fill="#ff4b57" opacity=".7" />
            <circle cx="17.5" cy="14.5" r="2" fill="#fff" opacity=".7" />
          </svg>
        </div>

        <svg
          ref={svgRef}
          className={`wheel-svg${instant ? ' instant' : ''}`}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: `rotate(${rotation}deg)`, transitionDuration: `${duration}ms` }}
        >
          <defs>
            <radialGradient id={`sh-${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset=".25" stopColor="#fff" stopOpacity=".14" />
              <stop offset=".7" stopColor="#000" stopOpacity="0" />
              <stop offset="1" stopColor="#000" stopOpacity=".45" />
            </radialGradient>
            {TONES.map((t) => (
              <radialGradient key={t.id} id={`seg-${t.id}-${uid}`} cx={c} cy={c} r={r} gradientUnits="userSpaceOnUse">
                <stop offset=".18" stopColor={t.inner} />
                <stop offset="1" stopColor={t.outer} />
              </radialGradient>
            ))}
            <filter id={`gl-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" />
            </filter>
          </defs>
          {entries.map((name, i) => {
            const a0 = i * seg;
            const [x0, y0] = pt(c, c, r, a0);
            const [x1, y1] = pt(c, c, r, a0 + seg);
            const mid = a0 + seg / 2;
            const k = n % TONES.length === 1 && i === n - 1 ? 1 : i % TONES.length;
            const d = n === 1 ? `M${c} ${c - r}A${r} ${r} 0 1 1 ${c - 0.01} ${c - r}Z` : `M${c} ${c}L${x0} ${y0}A${r} ${r} 0 ${seg > 180 ? 1 : 0} 1 ${x1} ${y1}Z`;
            return (
              <g key={i}>
                <path d={d} fill={`url(#seg-${TONES[k].id}-${uid})`} stroke="#d9b65a" strokeOpacity=".55" strokeWidth="1.1" />
                <text
                  x={c}
                  y={c - r + 20}
                  transform={`rotate(${mid} ${c} ${c}) rotate(90 ${c} ${c - r + 20})`}
                  fill={TONES[k].ink}
                  fontSize={fontSize}
                  fontFamily="Manrope, sans-serif"
                  fontWeight="700"
                  letterSpacing=".02em"
                  dominantBaseline="middle"
                >
                  {name.length > 14 ? `${name.slice(0, 13)}…` : name}
                </text>
              </g>
            );
          })}
          <circle cx={c} cy={c} r={r} fill={`url(#sh-${uid})`} pointerEvents="none" />
          {showWinner && (() => {
            const a0 = winner! * seg;
            const [x0, y0] = pt(c, c, r, a0);
            const [x1, y1] = pt(c, c, r, a0 + seg);
            const d = n === 1 ? `M${c} ${c - r}A${r} ${r} 0 1 1 ${c - 0.01} ${c - r}Z` : `M${c} ${c}L${x0} ${y0}A${r} ${r} 0 ${seg > 180 ? 1 : 0} 1 ${x1} ${y1}Z`;
            return (
              <g className="win-seg">
                <path d={d} fill="#f0dc9e" fillOpacity=".22" stroke="#f0dc9e" strokeWidth="6" filter={`url(#gl-${uid})`} />
                <path d={d} fill="none" stroke="#ffffff" strokeWidth="2.5" />
              </g>
            );
          })()}
        </svg>

        <svg className="wheel-overlay" viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
          <defs>
            <linearGradient id={`rim-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#f3e6c0" />
              <stop offset=".25" stopColor="#9c7c27" />
              <stop offset=".5" stopColor="#e8d49a" />
              <stop offset=".75" stopColor="#6e561a" />
              <stop offset="1" stopColor="#d4b25a" />
            </linearGradient>
            <radialGradient id={`bulb-${uid}`} cx="40%" cy="35%" r="65%">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset=".45" stopColor="#ffe9a8" />
              <stop offset="1" stopColor="#d79a1e" />
            </radialGradient>
            <radialGradient id={`halo-${uid}`}>
              <stop offset="0" stopColor="#ffd970" stopOpacity=".85" />
              <stop offset="1" stopColor="#ffb31a" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={`hub-${uid}`} cx="40%" cy="35%" r="70%">
              <stop offset="0" stopColor="#34343b" />
              <stop offset=".6" stopColor="#111114" />
              <stop offset="1" stopColor="#050506" />
            </radialGradient>
          </defs>
          {/* bevelled gold rim */}
          <circle cx={c} cy={c} r={c - 2 - rim / 2} fill="none" stroke={`url(#rim-${uid})`} strokeWidth={rim} />
          <circle cx={c} cy={c} r={c - 2 - rim / 2} fill="none" stroke="#120d04" strokeOpacity=".55" strokeWidth={rim * 0.42} />
          <circle cx={c} cy={c} r={c - 2.5} fill="none" stroke="#fff3cf" strokeOpacity=".55" strokeWidth="1.2" />
          <circle cx={c} cy={c} r={c - rim - 2} fill="none" stroke="#1b1407" strokeWidth="3" />
          <circle cx={c} cy={c} r={c - rim - 4.5} fill="none" stroke="#f1d27a" strokeOpacity=".8" strokeWidth="1.2" />
          {/* marquee bulbs */}
          {Array.from({ length: STUDS }, (_, i) => {
            const [x, y] = pt(c, c, c - 2 - rim / 2, (360 / STUDS) * i);
            return (
              <g key={i} className={`bulb ${i % 2 ? 'b-odd' : 'b-even'}`}>
                <circle cx={x} cy={y} r={rim * 0.34} fill={`url(#halo-${uid})`} className="bulb-halo" />
                <circle cx={x} cy={y} r={rim * 0.17} fill={`url(#bulb-${uid})`} className="bulb-core" />
              </g>
            );
          })}
          {/* glass gloss */}
          <path d={`M ${c - r * 0.92} ${c - r * 0.1} A ${r * 0.95} ${r * 0.95} 0 0 1 ${c + r * 0.92} ${c - r * 0.1} A ${r * 1.4} ${r * 0.9} 0 0 0 ${c - r * 0.92} ${c - r * 0.1} Z`} fill="#fff" opacity=".07" />
          {/* jewelled hub */}
          <circle cx={c} cy={c} r={size * 0.135} fill="#0a0a0c" opacity=".55" />
          <circle cx={c} cy={c} r={size * 0.118} fill={`url(#hub-${uid})`} stroke={`url(#rim-${uid})`} strokeWidth={size * 0.016} />
          <circle cx={c} cy={c} r={size * 0.096} fill="none" stroke="#f1d27a" strokeOpacity=".45" strokeWidth="1" strokeDasharray="2 4" />
          <image href={WORKSPACE.logoMark} x={c - size * 0.07} y={c - size * 0.068} width={size * 0.14} height={size * 0.13} />
        </svg>

        {showWinner && (
          <div className="dust" aria-hidden="true">
            {Array.from({ length: PARTICLES }, (_, i) => (
              <i key={i} style={{ '--a': `${(360 / PARTICLES) * i + (i % 3) * 7}deg`, '--d': `${size * (0.22 + (i % 5) * 0.06)}px`, animationDelay: `${(i % 4) * 0.04}s` } as CSSProperties} />
            ))}
          </div>
        )}
      </div>
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
