import { useEffect, useRef, useState } from 'react';

// Cube rotation that brings each face to the front (see .f1-.f6 in styles.css).
const FACE: Record<number, [number, number]> = { 1: [0, 0], 2: [0, -90], 3: [-90, 0], 4: [90, 0], 5: [0, 90], 6: [0, 180] };
const PIPS: Record<number, number[]> = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };

function Face({ n }: { n: number }) {
  return (
    <div className={`face f${n}`}>
      {PIPS[n].map((p) => (
        <span key={p} className="pip" style={{ gridRow: Math.ceil(p / 3), gridColumn: ((p - 1) % 3) + 1 }} />
      ))}
    </div>
  );
}

/** A resting tilt so each die always shows its top and one side, like a real die on a table. */
function Die({ value, rollId, delay = 0, tilt }: { value: number | null; rollId: number; delay?: number; tilt: string }) {
  const turns = useRef(0);
  const [rot, setRot] = useState<[number, number]>([0, 0]);
  useEffect(() => {
    if (!value || !rollId) return;
    turns.current += 3;
    const [x, y] = FACE[value];
    // Whole extra turns only add spin; the face that ends up in front is set by FACE.
    setRot([x + 360 * turns.current, y + 360 * (turns.current + 1)]);
  }, [value, rollId]);
  return (
    <div className="die-wrap">
      <span className="die-shadow" aria-hidden="true" />
      <div className="die-tilt" style={{ transform: tilt }}>
        <div className="die" style={{ transform: `rotateX(${rot[0]}deg) rotateY(${rot[1]}deg)`, transitionDelay: `${delay}ms` }}>
          {/* Inner planes fill the cube so the rounded corners never show a gap. */}
          <span className="die-core cx" /><span className="die-core cy" /><span className="die-core cz" />
          {[1, 2, 3, 4, 5, 6].map((n) => <Face key={n} n={n} />)}
        </div>
      </div>
    </div>
  );
}

export default function Dice({ values, rollId, showTotal }: { values: [number, number] | null; rollId: number; showTotal: boolean }) {
  return (
    <div className="dice" role="img" aria-label={values ? `Dice: ${values[0]} and ${values[1]}` : 'Dice'}>
      <Die value={values?.[0] ?? null} rollId={rollId} tilt="rotateX(-20deg) rotateY(-26deg)" />
      <Die value={values?.[1] ?? null} rollId={rollId} delay={120} tilt="rotateX(-20deg) rotateY(22deg) rotateZ(4deg)" />
      {values && showTotal && (
        <div className="dice-total fade-in">
          {values[0] + values[1]}
          <small>shuffles</small>
        </div>
      )}
    </div>
  );
}
