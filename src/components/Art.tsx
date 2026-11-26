import type React from 'react';
// Signature dimensional artwork for the dashboard tools. Decorative only:
// SVG and CSS 3D, no data, no images to load.
import { useId } from 'react';

const PIPS: Record<number, number[]> = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };

function CubeFace({ n, cls }: { n: number; cls: string }) {
  return (
    <span className={`cface ${cls}`}>
      {PIPS[n].map((p) => <i key={p} style={{ gridRow: Math.ceil(p / 3), gridColumn: ((p - 1) % 3) + 1 }} />)}
    </span>
  );
}

/** Two floating crystal dice with gold pips. */
export function CrystalDice() {
  return (
    <div className="art-dice" aria-hidden="true">
      {[0, 1].map((k) => (
        <div key={k} className={`ccube c${k}`}>
          <CubeFace n={k ? 5 : 6} cls="fr" />
          <CubeFace n={k ? 2 : 3} cls="bk" />
          <CubeFace n={k ? 4 : 2} cls="rt" />
          <CubeFace n={k ? 3 : 5} cls="lt" />
          <CubeFace n={1} cls="tp" />
          <CubeFace n={k ? 6 : 4} cls="bt" />
        </div>
      ))}
      <span className="art-floor" />
    </div>
  );
}

/** Fanned stack of holographic collectible cards. */
export function CardVault() {
  return (
    <div className="art-vault" aria-hidden="true">
      {[0, 1, 2].map((k) => (
        <span key={k} className={`vcard v${k}`}><i /></span>
      ))}
    </div>
  );
}

/** Faceted crystal security shield. */
export function CrystalShield() {
  const id = useId().replace(/:/g, '');
  return (
    <svg className="art-shield" viewBox="0 0 120 132" aria-hidden="true">
      <defs>
        <linearGradient id={`sa-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E2E8F0" /><stop offset=".45" stopColor="#67E8F9" /><stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id={`sb-${id}`} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F5DEB3" /><stop offset=".5" stopColor="#D4AF37" /><stop offset="1" stopColor="#7A5C12" />
        </linearGradient>
      </defs>
      <path d="M60 4 112 20v40c0 34-22 56-52 68C30 116 8 94 8 60V20z" fill={`url(#sb-${id})`} />
      <path d="M60 12 104 26v34c0 29-18 48-44 59C34 108 16 89 16 60V26z" fill="#0d0b18" />
      <path d="M60 12 104 26 60 66z" fill={`url(#sa-${id})`} opacity=".85" />
      <path d="M60 12 16 26 60 66z" fill={`url(#sa-${id})`} opacity=".45" />
      <path d="M16 26v34c0 29 18 48 44 59V66z" fill={`url(#sa-${id})`} opacity=".3" />
      <path d="M104 26v34c0 29-18 48-44 59V66z" fill={`url(#sa-${id})`} opacity=".6" />
      <path d="M44 62l12 12 22-26" fill="none" stroke="#F5DEB3" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Metallic mini wheel with illuminated segments. */
export function MiniWheel() {
  const id = useId().replace(/:/g, '');
  const n = 12;
  const segs = Array.from({ length: n }, (_, i) => {
    const a0 = (i * 2 * Math.PI) / n, a1 = ((i + 1) * 2 * Math.PI) / n;
    return `M50 50 L${50 + 40 * Math.sin(a0)} ${50 - 40 * Math.cos(a0)} A40 40 0 0 1 ${50 + 40 * Math.sin(a1)} ${50 - 40 * Math.cos(a1)}Z`;
  });
  const fills = ['#D4AF37', '#171225', '#C4B5FD', '#121222', '#F5DEB3', '#8B5CF6'];
  return (
    <div className="art-wheel" aria-hidden="true">
      <svg viewBox="0 0 100 100">
        <defs>
          <linearGradient id={`wr-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F5DEB3" /><stop offset=".35" stopColor="#D4AF37" /><stop offset=".65" stopColor="#7A5C12" /><stop offset="1" stopColor="#F5DEB3" />
          </linearGradient>
        </defs>
        <g className="aw-spin">{segs.map((d, i) => <path key={i} d={d} fill={fills[i % fills.length]} stroke="#3a2a05" strokeWidth=".4" />)}</g>
        <circle cx="50" cy="50" r="44" fill="none" stroke={`url(#wr-${id})`} strokeWidth="7" />
        {Array.from({ length: 16 }, (_, i) => <circle key={i} className="aw-stud" cx={50 + 44 * Math.sin((i * Math.PI) / 8)} cy={50 - 44 * Math.cos((i * Math.PI) / 8)} r="1.4" style={{ animationDelay: `${i * 0.09}s` }} />)}
        <circle cx="50" cy="50" r="9" fill="#0d0b18" stroke={`url(#wr-${id})`} strokeWidth="2.5" />
      </svg>
      <span className="aw-pointer" />
    </div>
  );
}

/** Stylised dimensional duck with aquatic reflection. */
export function Duck3D() {
  const id = useId().replace(/:/g, '');
  return (
    <div className="art-duck" aria-hidden="true">
      <svg viewBox="0 0 120 100">
        <defs>
          <radialGradient id={`db-${id}`} cx="38%" cy="30%" r="75%">
            <stop offset="0" stopColor="#FFF7C2" /><stop offset=".5" stopColor="#F5C842" /><stop offset="1" stopColor="#B8770F" />
          </radialGradient>
          <linearGradient id={`dw-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#67E8F9" stopOpacity=".55" /><stop offset="1" stopColor="#8B5CF6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g className="ad-bob">
          <path d="M14 52 Q10 32 26 38 Q32 56 54 56 L82 56 Q98 56 98 70 Q86 82 52 82 Q18 82 14 52Z" fill={`url(#db-${id})`} />
          <circle cx="76" cy="34" r="19" fill={`url(#db-${id})`} />
          <path d="M92 32 Q108 31 107 39 Q99 44 90 40Z" fill="#F2711C" />
          <circle cx="80" cy="29" r="3.6" fill="#111" /><circle cx="81.3" cy="27.7" r="1.2" fill="#fff" />
          <path d="M30 58 Q46 72 66 60 Q54 54 42 56Z" fill="#B8770F" opacity=".5" />
          <ellipse cx="62" cy="22" rx="8" ry="3.5" fill="#fff" opacity=".5" />
        </g>
        <ellipse cx="56" cy="86" rx="48" ry="7" fill={`url(#dw-${id})`} />
        <ellipse className="ad-ripple r1" cx="56" cy="86" rx="30" ry="4" fill="none" stroke="#67E8F9" strokeOpacity=".5" />
        <ellipse className="ad-ripple r2" cx="56" cy="86" rx="30" ry="4" fill="none" stroke="#C4B5FD" strokeOpacity=".45" />
      </svg>
    </div>
  );
}

/** Holographic sparks rising behind a winner announcement (decorative, fixed layout). */
export function Sparks({ n = 18 }: { n?: number }) {
  const cols = ['#F5DEB3', '#E879F9', '#67E8F9', '#C4B5FD', '#D4AF37'];
  return (
    <span className="sparks" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <i key={i} style={{ '--x': `${(i * 53) % 100}%`, '--d': `${(i % 6) * 0.12 + 0.2}s`, '--c': cols[i % cols.length] } as React.CSSProperties} />
      ))}
    </span>
  );
}
