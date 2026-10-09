import { useEffect, useState } from 'react';
import { sha256 } from '../lib/sha256.ts';

// The finishing order is decided by the seeded draw before the start.
// Each duck's path wobbles (so the lead changes) but crosses the line at its
// pre-drawn rank: the winner first at 78% of the race time, the last at 100%.

const enc = new TextEncoder();

function wobble(name: string) {
  const b = sha256(enc.encode(`wobble:${name}`));
  return { amp: 0.06 + (b[0] / 255) * 0.08, freq: 1 + (b[1] / 255) * 2, phase: (b[2] / 255) * Math.PI * 2 };
}

export function duckProgress(rank: number, total: number, elapsed: number, duration: number, name: string) {
  const finishAt = duration * (0.78 + (total > 1 ? (0.22 * rank) / (total - 1) : 0));
  const u = Math.max(0, Math.min(1, elapsed / finishAt));
  const w = wobble(name);
  return Math.max(0, Math.min(1, u + w.amp * Math.sin(Math.PI * u) * Math.sin(2 * Math.PI * w.freq * u + w.phase)));
}

export function DuckIcon({ size, gold }: { size: number; gold?: boolean }) {
  return (
    <svg width={size * 1.25} height={size} viewBox="0 0 50 40">
      <ellipse cx="22" cy="27" rx="18" ry="10" fill={gold ? '#d9b654' : '#f3d34a'} />
      <path d="M6 24 Q2 18 8 20" fill={gold ? '#d9b654' : '#f3d34a'} />
      <circle cx="34" cy="15" r="9" fill={gold ? '#d9b654' : '#f3d34a'} />
      <path d="M42 14 L50 17 L42 19 Z" fill="#f08a24" />
      <circle cx="36" cy="12.5" r="1.8" fill="#111" />
      <path d="M14 26 Q22 31 28 25" stroke="#c9a400" strokeWidth="2" fill="none" />
    </svg>
  );
}

interface Props {
  ducks: string[];
  order: string[];
  duration: number;
  startedAt: number | null;
  height?: number;
  fontScale?: number;
}

export default function DuckRace({ ducks, order, duration, startedAt, height = 520, fontScale = 1 }: Props) {
  const [now, setNow] = useState(Date.now());
  const running = startedAt !== null && now < startedAt + duration * 1000 + 600;

  useEffect(() => {
    if (startedAt === null) return;
    let raf = 0;
    const tick = () => {
      setNow(Date.now());
      if (Date.now() < startedAt + duration * 1000 + 800) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [startedAt, duration]);

  const laneH = Math.max(14, Math.min(46, height / Math.max(ducks.length, 1)));
  const elapsed = startedAt === null ? 0 : Math.max(0, now - startedAt) / 1000;
  const countdown = startedAt !== null && now < startedAt ? Math.ceil((startedAt - now) / 1000) : null;
  const rankOf = new Map(order.map((d, i) => [d, i]));
  const finished = startedAt !== null && !running;

  return (
    <div className="pond" style={{ height: laneH * ducks.length }}>
      <div className="waves" />
      <div className="finish" style={{ right: 36 }} />
      {ducks.map((d) => {
        const rank = rankOf.get(d) ?? 0;
        const x = startedAt === null ? 0 : duckProgress(rank, ducks.length, elapsed, duration, d);
        const isWinner = finished && rank === 0;
        return (
          <div key={d} className="lane" style={{ height: laneH }}>
            <div className="duck" style={{ left: `calc(190px + ${x} * (100% - 236px))` }}>
              <span className="label" style={{ fontSize: Math.max(9, Math.min(12, laneH * 0.42)) * fontScale, color: isWinner ? 'var(--gold-hi)' : undefined }}>
                {finished && rank < 3 ? `${rank + 1}. ` : ''}{d}
              </span>
              <DuckIcon size={laneH * 0.78} gold={isWinner} />
            </div>
          </div>
        );
      })}
      {countdown !== null && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,.35)' }}>
          <span key={countdown} className="fade-in" style={{ fontFamily: 'var(--display)', fontSize: 120 * fontScale, color: 'var(--gold-hi)' }}>{countdown}</span>
        </div>
      )}
    </div>
  );
}
