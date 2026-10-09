// Looping preview of the portal's randomizers for the home screen.
// Purely visual sample data: it never touches real draws.

import { useEffect, useState, type CSSProperties } from 'react';
import Wheel, { landingRotation } from './Wheel.tsx';
import DuckRace from './DuckRace.tsx';
import { CHECKLISTS, uniqueEntrants } from '../lib/data.ts';

const SCENE_MS = 6000;
const SCENES = [
  { key: 'cards', label: 'Team draw', note: 'Cards drop into place' },
  { key: 'wheel', label: 'Wheel of fortune', note: 'One segment per entry' },
  { key: 'reel', label: 'Filler draw', note: 'Top entries win a spot' },
  { key: 'duck', label: 'Duck race', note: 'Finishing order sealed first' },
] as const;

const names = uniqueEntrants();
const teams = Object.values(CHECKLISTS)[0] ?? [];

function CardsScene() {
  const picks = teams.slice(0, 6);
  return (
    <div className="sc-cards">
      {picks.map((t, i) => (
        <div key={t} className="sc-card" style={{ animationDelay: `${0.25 + i * 0.32}s` }}>
          <span className="n">#{String(i + 1).padStart(2, '0')}</span>
          <b>{t}</b>
          <span className="who">{names[(i * 3) % names.length]}</span>
        </div>
      ))}
    </div>
  );
}

function WheelScene() {
  const entries = names.slice(0, 12);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(() => {
    const a = window.setTimeout(() => { setSpinning(true); setRotation(landingRotation(0, 7, entries.length, 0.2)); }, 250);
    const b = window.setTimeout(() => { setSpinning(false); setDone(true); }, 250 + 3600);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [entries.length]);
  return (
    <div className="sc-wheel">
      <Wheel entries={entries} rotation={rotation} size={290} spinning={spinning} winner={done ? 7 : null} duration={3600} />
      {done && <div className="sc-win"><span>Winner</span><b>{entries[7]}</b></div>}
    </div>
  );
}

function ReelScene() {
  const ROW = 34;
  const list = Array.from({ length: 34 }, (_, i) => `${names[(i * 5 + 3) % names.length]} · F${String(10 + ((i * 7) % 69)).padStart(2, '0')}`);
  return (
    <div className="sc-reel">
      <div className="sc-reel-window" style={{ height: ROW * 5 }}>
        <div className="sc-reel-list" style={{ '--to': `-${(list.length - 5) * ROW}px` } as CSSProperties}>
          {list.map((l, i) => <div key={i} style={{ height: ROW }}>{l}</div>)}
        </div>
        <div className="sc-reel-frame" style={{ top: 0, height: ROW * 3 }}><span>Top 3 win a spot</span></div>
      </div>
    </div>
  );
}

function DuckScene() {
  const ducks = names.slice(2, 7);
  const [start] = useState(() => Date.now() + 200);
  return (
    <div className="sc-duck">
      <DuckRace ducks={ducks} order={[ducks[3], ducks[0], ducks[4], ducks[1], ducks[2]]} duration={4} startedAt={start} height={200} board={false} />
    </div>
  );
}

export default function Showcase() {
  const [i, setI] = useState(0);
  // Restart the timer whenever the scene changes, so a clicked dot gets its full time.
  useEffect(() => {
    const t = window.setTimeout(() => setI((x) => (x + 1) % SCENES.length), SCENE_MS);
    return () => clearTimeout(t);
  }, [i]);
  const scene = SCENES[i];
  return (
    <div className="showcase">
      <div className="showcase-stage" key={i}>
        {scene.key === 'cards' && <CardsScene />}
        {scene.key === 'wheel' && <WheelScene />}
        {scene.key === 'reel' && <ReelScene />}
        {scene.key === 'duck' && <DuckScene />}
      </div>
      <div className="showcase-bar">
        <div>
          <b>{scene.label}</b>
          <span>{scene.note}</span>
        </div>
        <div className="showcase-dots">
          {SCENES.map((s, k) => (
            <button key={s.key} className={k === i ? 'on' : ''} aria-label={s.label} onClick={() => setI(k)}>
              {k === i && <i style={{ animationDuration: `${SCENE_MS}ms` }} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
