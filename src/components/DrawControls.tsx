import { useState } from 'react';
import Dice from './Dice.tsx';
import type { Phase } from '../lib/useShuffleDraw.ts';

/** Host choice before sealing: roll the dice, or a fixed number of shuffles. */
export function ShuffleModeControl({ value, onChange }: { value: number | undefined; onChange: (v: number | undefined) => void }) {
  return (
    <div className="seg" role="group" aria-label="Shuffle count">
      <button className={value === undefined ? 'on' : ''} onClick={() => onChange(undefined)}>🎲 Dice</button>
      <button className={value !== undefined ? 'on' : ''} onClick={() => onChange(value ?? 7)}>Fixed</button>
      {value !== undefined && (
        <input
          type="number"
          min={1}
          max={20}
          value={value}
          aria-label="Number of shuffles"
          onChange={(e) => onChange(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
        />
      )}
    </div>
  );
}

/** Dice (or the fixed count) plus the shuffle progress meter. */
export function RollProgress({
  phase, dice, rollId, round, total, fixed,
}: { phase: Phase; dice: [number, number] | null; rollId: number; round: number; total: number; fixed?: number }) {
  const meter = total > 0 && (
    <div className="round-meter">
      {Array.from({ length: total }, (_, i) => <span key={i} className={i < round ? 'on' : ''} />)}
    </div>
  );
  return (
    <>
      {fixed ? (
        <div className="dice-total">{fixed}<small>fixed shuffles</small></div>
      ) : (
        <Dice values={dice} rollId={rollId} showTotal={phase === 'shuffling' || phase === 'shuffled' || phase === 'revealed'} />
      )}
      {(phase === 'rolling' || phase === 'shuffling') && (
        <div className="stack" style={{ gap: 8 }}>
          <span className="hint">{phase === 'rolling' ? 'Rolling…' : `Shuffle ${round} of ${total}`}</span>
          {meter}
        </div>
      )}
    </>
  );
}

/** Void the current draw with a mandatory reason; it stays on the proof page. */
export function VoidButton({ onVoid, disabled }: { onVoid: (reason: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  if (!open)
    return (
      <button className="btn btn-sm btn-ghost" disabled={disabled} onClick={() => setOpen(true)} title="Void this draw and run it again">
        ⟲ Void and re-draw
      </button>
    );
  return (
    <div className="void-form fade-in">
      <input
        type="text"
        autoFocus
        placeholder="Reason, e.g. wrong buyer list imported"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && reason.trim()) onVoid(reason.trim());
          if (e.key === 'Escape') setOpen(false);
        }}
      />
      <button className="btn btn-sm" disabled={!reason.trim()} onClick={() => onVoid(reason.trim())}>Void draw</button>
      <button className="btn btn-sm btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
    </div>
  );
}
