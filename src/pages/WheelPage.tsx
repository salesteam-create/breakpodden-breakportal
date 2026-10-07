import { useEffect, useMemo, useRef, useState } from 'react';
import { giveawayEntries } from '../lib/data.ts';
import { commitmentFor, newSeed, runWheel, type DrawInputs } from '../lib/fair.ts';
import { newDrawId, openStreamWindow, publishStream, saveDraw, type DrawRecord } from '../lib/store.ts';
import Wheel, { landingRotation } from '../components/Wheel.tsx';
import { FairnessPanel, LogPanel } from '../components/Panels.tsx';

const SPIN_MS = 6400;

export default function WheelPage() {
  const entries = useMemo(giveawayEntries, []);
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    entries.forEach((e) => m.set(e, (m.get(e) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [entries]);

  const [record, setRecord] = useState<DrawRecord | null>(null);
  const [winners, setWinners] = useState<{ name: string; index: number; prize: string }[]>([]);
  const [pending, setPending] = useState<{ name: string; index: number; prize: string } | null>(null);
  const [rotation, setRotation] = useState(0);
  const [instant, setInstant] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [prize, setPrize] = useState('Topps Chrome UCC Blaster pack');
  const [log, setLog] = useState<{ at: number; text: string }[]>([]);
  const [revealed, setRevealed] = useState(false);
  const timer = useRef<number>(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  const addLog = (text: string) => setLog((l) => [{ at: Date.now(), text }, ...l]);

  // Wheel shows the entries still in play; a winner leaves the wheel before the next spin.
  const taken = new Set(winners.map((w) => w.index));
  const remaining = entries.map((name, index) => ({ name, index })).filter((e) => !taken.has(e.index));
  const latest = pending ?? null;

  useEffect(() => {
    publishStream({
      kind: 'wheel',
      title: 'Giveaway · Wheel of fortune',
      subtitle: `${remaining.length} entries · one per purchase · prize: ${prize}`,
      entries: remaining.map((e) => e.name),
      rotation,
      spinning,
      winner: !spinning && latest ? latest.name : null,
      commitment: record?.commitment ?? '',
    });
  }, [rotation, spinning, latest, record, prize, remaining.length]);

  const seal = () => {
    const inputs: DrawInputs = { kind: 'wheel', left: [], right: entries };
    const seed = newSeed();
    const r: DrawRecord = { id: newDrawId(), title: 'Giveaway · Wheel of fortune', createdAt: Date.now(), seed, commitment: commitmentFor(seed, inputs), inputs, revealed: false, spins: 0, log: [] };
    saveDraw(r);
    setRecord(r);
    addLog(`Giveaway sealed with ${entries.length} entries. Commitment ${r.commitment.slice(0, 12)}…`);
  };

  const spin = () => {
    if (!record || spinning) return;
    // Bank the previous winner so they leave the wheel, then snap the wheel to rest.
    let done = winners;
    if (pending) {
      done = [...winners, pending];
      setWinners(done);
      setPending(null);
    }
    const k = done.length + 1;
    const w = runWheel(record.seed, entries, k).at(-1)!;
    const left = entries.map((name, index) => ({ name, index })).filter((e) => !done.some((d) => d.index === e.index));
    const pos = left.findIndex((e) => e.index === w.index);
    const rest = rotation % 360;
    setInstant(true);
    setRotation(rest);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setInstant(false);
        setSpinning(true);
        setRotation(landingRotation(rest, pos, left.length, Math.random() * 2 - 1));
      }),
    );
    const updated = { ...record, spins: k };
    saveDraw(updated);
    setRecord(updated);
    timer.current = window.setTimeout(() => {
      setSpinning(false);
      setPending({ name: w.name, index: w.index, prize });
      addLog(`Spin ${k}: ${w.name} wins ${prize}`);
    }, SPIN_MS + 300);
  };

  const finish = () => {
    if (!record) return;
    const all = pending ? [...winners, pending] : winners;
    const r = { ...record, revealed: true, spins: all.length, result: all.map((w) => w.name), log: [...log].reverse() };
    saveDraw(r);
    setRecord(r);
    setRevealed(true);
    addLog('Giveaway closed. Seed revealed for verification');
  };

  const allWinners = pending ? [...winners, pending] : winners;

  return (
    <>
      <div className="spread" style={{ marginBottom: 24, alignItems: 'flex-end' }}>
        <div>
          <div className="eyebrow">Giveaway</div>
          <h1 style={{ marginTop: 6 }}>Wheel of fortune</h1>
          <p className="muted" style={{ margin: '8px 0 0' }}>One segment per purchase tonight. Buy three spots, get three chances.</p>
        </div>
        <button className="btn" onClick={openStreamWindow}>⧉ Pop out stream view</button>
      </div>

      <div className="workspace">
        <div className="card">
          <div className="action-bar">
            {!record && (
              <>
                <button className="btn btn-gold btn-lg" onClick={seal}>🔒 Seal giveaway</button>
                <span className="hint">Locks the {entries.length} entries and a secret seed before the first spin.</span>
              </>
            )}
            {record && !revealed && (
              <>
                <div className="field" style={{ flex: 1, maxWidth: 320 }}>
                  <label>Prize for this spin</label>
                  <input type="text" value={prize} onChange={(e) => setPrize(e.target.value)} />
                </div>
                <button className="btn btn-gold btn-lg" onClick={spin} disabled={spinning || remaining.length - (pending ? 1 : 0) === 0}>
                  {spinning ? 'Spinning…' : allWinners.length ? 'Spin again' : 'Spin the wheel'}
                </button>
                <button className="btn" onClick={finish} disabled={spinning || allWinners.length === 0}>Close and reveal</button>
              </>
            )}
            {revealed && (
              <>
                <span className="chip chip-good">Giveaway closed</span>
                <span className="hint">{allWinners.length} winners. The proof page lets anyone recompute every spin.</span>
              </>
            )}
          </div>
          <Wheel entries={remaining.map((e) => e.name)} rotation={rotation} instant={instant} />
          {latest && !spinning && (
            <div style={{ padding: '0 20px 20px' }}>
              <div className="winner-banner">
                <span className="eyebrow">Winner · {latest.prize}</span>
                <b>{latest.name}</b>
              </div>
            </div>
          )}
        </div>

        <div className="side">
          <FairnessPanel record={record} revealed={revealed} />
          <div className="card">
            <div className="card-head"><h3>Winners</h3><span className="dim mono">{allWinners.length}</span></div>
            <div className="card-pad" style={{ paddingTop: 8, paddingBottom: 8 }}>
              {allWinners.length === 0 && <p className="dim" style={{ margin: '8px 0' }}>No spins yet.</p>}
              {allWinners.map((w, i) => (
                <div key={i} className="spread" style={{ padding: '8px 0', borderBottom: '1px solid var(--line)', fontSize: 13.5 }}>
                  <span><b className="gold">{i + 1}.</b> {w.name}</span>
                  <span className="muted">{w.prize}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="card-head"><h3>Entries</h3><span className="dim mono">{entries.length}</span></div>
            <div className="card-pad log" style={{ paddingTop: 4, paddingBottom: 4 }}>
              {counts.map(([name, c]) => (
                <div key={name} style={{ gridTemplateColumns: '1fr auto' }}>
                  <span>{name}</span>
                  <span className="mono dim">×{c}</span>
                </div>
              ))}
            </div>
          </div>
          <LogPanel log={log} />
        </div>
      </div>
    </>
  );
}
