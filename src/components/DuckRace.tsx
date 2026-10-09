import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { sha256 } from '../lib/sha256.ts';

// The finishing order is decided by the seeded draw before the start.
// Each duck's path wobbles (so the lead changes) but crosses the line at its
// pre-drawn rank: the winner first at 78% of the race time, the last at 100%.

const enc = new TextEncoder();
const WIN_AT = 0.78;

function wobble(name: string) {
  const b = sha256(enc.encode(`wobble:${name}`));
  return { amp: 0.06 + (b[0] / 255) * 0.08, freq: 1 + (b[1] / 255) * 2, phase: (b[2] / 255) * Math.PI * 2 };
}

const finishTime = (rank: number, total: number, duration: number) =>
  duration * (WIN_AT + (total > 1 ? ((1 - WIN_AT) * rank) / (total - 1) : 0));

export function duckProgress(rank: number, total: number, elapsed: number, duration: number, name: string) {
  const u = Math.max(0, Math.min(1, elapsed / finishTime(rank, total, duration)));
  const w = wobble(name);
  return Math.max(0, Math.min(1, u + w.amp * Math.sin(Math.PI * u) * Math.sin(2 * Math.PI * w.freq * u + w.phase)));
}

/** Rubber duck, side view, facing right. `num` is printed on the body. */
export function DuckIcon({ size, gold, num }: { size: number; gold?: boolean; num?: number }) {
  const body = gold ? ['#fff1b8', '#d9b654', '#8a6b1e'] : ['#fff6a8', '#f7c531', '#d98a10'];
  const id = `d${gold ? 'g' : 'y'}`;
  return (
    <svg width={size * 1.3} height={size} viewBox="0 0 52 40" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-b`} cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor={body[0]} />
          <stop offset=".55" stopColor={body[1]} />
          <stop offset="1" stopColor={body[2]} />
        </radialGradient>
      </defs>
      <path d="M4 22 Q2 12 9 15 Q12 26 22 26 L38 26 Q46 26 46 33 Q40 39 22 39 Q6 39 4 22 Z" fill={`url(#${id}-b)`} />
      <circle cx="36" cy="15" r="10" fill={`url(#${id}-b)`} />
      <path d="M44 14 Q52 14 51 18 Q47 20 43 18 Z" fill="#f2711c" />
      <path d="M44 18 Q48 19 50 18" stroke="#b44b07" strokeWidth="1" fill="none" />
      <circle cx="38" cy="12" r="2.2" fill="#111" />
      <circle cx="38.8" cy="11.2" r=".8" fill="#fff" />
      <path d="M14 26 Q22 33 32 27 Q26 24 20 25 Z" fill={body[2]} opacity=".55" />
      <ellipse cx="28" cy="10" rx="4" ry="2" fill="#fff" opacity=".45" />
      {num !== undefined && (
        <>
          <circle cx="22" cy="32" r="6" fill="#111" stroke={gold ? '#fff1b8' : '#fff'} strokeWidth="1.2" />
          <text x="22" y="32.6" textAnchor="middle" dominantBaseline="middle" fontSize={num > 9 ? 6.5 : 8} fontWeight="800" fill="#fff" fontFamily="Inter, sans-serif">{num}</text>
        </>
      )}
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
  /** Live standings panel next to the pond. */
  board?: boolean;
}

export default function DuckRace({ ducks, order, duration, startedAt, height = 520, fontScale = 1, board = true }: Props) {
  const [now, setNow] = useState(Date.now());
  const leaderRef = useRef<string | null>(null);
  const [callout, setCallout] = useState<{ text: string; at: number } | null>(null);
  const total = ducks.length;
  const endAt = startedAt === null ? null : startedAt + duration * 1000;

  useEffect(() => {
    leaderRef.current = null;
    setCallout(null);
    if (startedAt === null) return;
    let raf = 0;
    const tick = () => {
      setNow(Date.now());
      if (Date.now() < startedAt + duration * 1000 + 4000) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [startedAt, duration]);

  const laneH = Math.max(16, Math.min(48, height / Math.max(total, 1)));
  const elapsed = startedAt === null ? 0 : Math.max(0, now - startedAt) / 1000;
  const countdown = startedAt !== null && now < startedAt ? Math.ceil((startedAt - now) / 1000) : null;
  const showGo = startedAt !== null && now >= startedAt && now < startedAt + 700;
  const rankOf = new Map(order.map((d, i) => [d, i]));
  const racing = startedAt !== null && now >= startedAt && endAt !== null && now < endAt + 400;
  const winnerIn = startedAt !== null && elapsed >= finishTime(0, total, duration);
  const finished = endAt !== null && now >= endAt + 400;

  // Positions this frame; finished ducks rank by their sealed finishing order.
  const pos = ducks.map((d, lane) => {
    const rank = rankOf.get(d) ?? 0;
    const x = startedAt === null ? 0 : duckProgress(rank, total, elapsed, duration, d);
    const done = startedAt !== null && elapsed >= finishTime(rank, total, duration);
    return { d, lane, rank, x, done, key: done ? 2 + (total - rank) / total : x };
  });
  const standings = [...pos].sort((a, b) => b.key - a.key);

  // Announce lead changes while racing (not before the first second, not after the winner is in).
  const leader = standings[0]?.d ?? null;
  useEffect(() => {
    if (!racing || winnerIn || elapsed < 1) {
      if (racing) leaderRef.current = leader;
      return;
    }
    if (leader && leader !== leaderRef.current) {
      if (leaderRef.current !== null) setCallout({ text: `${leader} takes the lead`, at: Date.now() });
      leaderRef.current = leader;
    }
  }, [leader, racing, winnerIn, elapsed]);
  const showCallout = callout && now - callout.at < 1500 && !winnerIn;

  return (
    <div className={`race${board ? ' with-board' : ''}`}>
      <div className="pond" style={{ height: laneH * total + 34 }}>
        <div className="water" />
        <div className="pond-head">
          <span>Start</span>
          <span>25 m</span>
          <span>50 m</span>
          <span>75 m</span>
          <span className="gold">Finish</span>
        </div>
        <div className="lanes">
          <div className="startline" />
          {[25, 50, 75].map((m) => <div key={m} className="marker" style={{ left: `calc(var(--track-start) + ${m / 100} * (100% - var(--track-start) - var(--track-end)))` }} />)}
          <div className="finishline"><span>FINISH</span></div>
          {pos.map(({ d, lane, rank, x, done }) => {
            const isWinner = winnerIn && rank === 0;
            const moving = racing && !done;
            return (
              <div key={d} className="lane" style={{ height: laneH }}>
                <div
                  className={`duck${moving ? ' swimming' : ''}${isWinner ? ' champ' : ''}`}
                  style={{ left: `calc(var(--track-start) + ${x} * (100% - var(--track-start) - var(--track-end)))`, '--bob': `${(lane % 7) * 0.11}s` } as CSSProperties}
                >
                  <span className="label" style={{ fontSize: Math.max(9, Math.min(12.5, laneH * 0.36)) * fontScale }}>
                    {done && rank < 3 ? `${rank + 1}. ` : ''}{d}
                  </span>
                  <span className="duck-body">
                    {moving && <i className="wake" />}
                    <DuckIcon size={laneH * 0.82} gold={isWinner} num={lane + 1} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        {countdown !== null && (
          <div className="race-overlay">
            <span key={countdown} className="count" style={{ fontSize: 130 * fontScale }}>{countdown}</span>
          </div>
        )}
        {showGo && (
          <div className="race-overlay clear">
            <span className="count go" style={{ fontSize: 120 * fontScale }}>GO!</span>
          </div>
        )}
        {showCallout && <div key={callout!.at} className="callout">{callout!.text}</div>}
        {winnerIn && (
          <>
            <div className="photo-flash" />
            <div className="winner-ribbon" style={{ fontSize: 15 * fontScale }}>
              <span className="eyebrow">Winner</span>
              <b style={{ fontSize: 28 * fontScale }}>{order[0]}</b>
            </div>
            <div className="confetti" aria-hidden="true">
              {Array.from({ length: 28 }, (_, i) => (
                <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 7) * 0.12}s`, '--r': `${(i * 53) % 360}deg` } as CSSProperties} />
              ))}
            </div>
          </>
        )}
      </div>

      {board && (
        <div className="standings">
          <div className="standings-head">
            <span className="eyebrow">{finished ? 'Final' : startedAt !== null ? 'Live standings' : 'Line-up'}</span>
            <span className="mono dim">{total} ducks</span>
          </div>
          {(startedAt === null ? pos.slice(0, 6) : standings.slice(0, 6)).map((p, i) => (
            <div key={p.d} className={`standing${i === 0 && startedAt !== null ? ' lead' : ''}`}>
              <span className={`place${finished && i < 3 ? ` m${i + 1}` : ''}`}>{i + 1}</span>
              <span className="who">
                <b>{p.d}</b>
                <span className="bar"><i style={{ width: `${Math.round(p.x * 100)}%` }} /></span>
              </span>
              <span className="lane-no">#{p.lane + 1}</span>
            </div>
          ))}
          {startedAt === null && total > 6 && <div className="dim" style={{ fontSize: 12.5, padding: '6px 2px' }}>+ {total - 6} more ducks</div>}
        </div>
      )}
    </div>
  );
}
