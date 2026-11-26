import { useEffect, useMemo, useRef, useState } from 'react';
import { giveawayEntries, uniqueEntrants } from '../lib/data.ts';
import { commitmentFor, newSeed, runRace, type DrawInputs } from '../lib/fair.ts';
import { newDrawId, openStreamWindow, publishStream, saveDraw, type DrawRecord } from '../lib/store.ts';
import DuckRace from '../components/DuckRace.tsx';
import { FairnessPanel, LogPanel } from '../components/Panels.tsx';
import PageHeader from '../components/PageHeader.tsx';
import Icon from '../components/Icon.tsx';

const MAX_DUCKS = 50;
const COUNTDOWN_MS = 3000;

/** Makes names unique so every duck is its own entry ("kortkongen", "kortkongen #2"). */
const uniqueNames = (names: string[]) => {
  const seen = new Map<string, number>();
  return names.map((n) => {
    const c = (seen.get(n) ?? 0) + 1;
    seen.set(n, c);
    return c === 1 ? n : `${n} #${c}`;
  });
};

export default function DuckRacePage() {
  const [text, setText] = useState(uniqueEntrants().join('\n'));
  const [duration, setDuration] = useState(10);
  const [record, setRecord] = useState<DrawRecord | null>(null);
  const [order, setOrder] = useState<string[]>([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [log, setLog] = useState<{ at: number; text: string }[]>([]);
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  const addLog = (t: string) => setLog((l) => [{ at: Date.now(), text: t }, ...l]);
  const ducks = useMemo(
    () => (record ? record.inputs.right : uniqueNames(text.split('\n').map((s) => s.trim()).filter(Boolean)).slice(0, MAX_DUCKS)),
    [record, text],
  );

  useEffect(() => {
    publishStream({
      kind: 'duck',
      title: 'Giveaway · Duck race',
      subtitle: `${ducks.length} ducks · ${duration} second race`,
      ducks,
      order,
      duration,
      startedAt,
      commitment: record?.commitment ?? '',
    });
  }, [ducks, order, duration, startedAt, record]);

  const seal = () => {
    const inputs: DrawInputs = { kind: 'duck', left: [], right: ducks };
    const seed = newSeed();
    const r: DrawRecord = { id: newDrawId(), title: 'Giveaway · Duck race', createdAt: Date.now(), seed, commitment: commitmentFor(seed, inputs), inputs, revealed: false, log: [] };
    saveDraw(r);
    setRecord(r);
    addLog(`Race sealed with ${ducks.length} ducks. Commitment ${r.commitment.slice(0, 12)}…`);
  };

  const start = () => {
    if (!record) return;
    const o = runRace(record.seed, record.inputs.right);
    setOrder(o);
    const at = Date.now() + COUNTDOWN_MS;
    setStartedAt(at);
    addLog(`Race started: ${duration} seconds`);
    timer.current = window.setTimeout(() => {
      setFinished(true);
      addLog(`Winner: ${o[0]}. 2nd ${o[1] ?? '-'}, 3rd ${o[2] ?? '-'}`);
    }, COUNTDOWN_MS + duration * 1000 + 700);
  };

  const reveal = () => {
    if (!record) return;
    const r = { ...record, revealed: true, result: order, log: [...log].reverse() };
    saveDraw(r);
    setRecord(r);
    setRevealed(true);
    addLog('Seed revealed for verification');
  };

  return (
    <>
      <PageHeader
        eyebrow="Giveaway"
        title="Duck race"
        actions={<button className="btn btn-secondary" onClick={openStreamWindow}><Icon name="external" size={16} /> Pop out stream view</button>}
      >
        Up to {MAX_DUCKS} ducks. The finishing order is drawn and sealed before the start; the race plays it out.
      </PageHeader>

      <div className="workspace ws-wide">
        <div className="card">
          <div className="action-bar" key={`${!!record}-${startedAt !== null}-${finished}-${revealed}`}>
            {!record && (
              <>
                <div className="field" style={{ width: 240 }}>
                  <label htmlFor="race-length">Race length: <span className="tnum">{duration}</span> s</label>
                  <input id="race-length" type="range" min={5} max={30} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
                </div>
                <button className="btn btn-gold btn-lg" data-magnetic onClick={seal} disabled={ducks.length < 2}><Icon name="lock" size={18} /> Seal race</button>
                <span className="hint">{ducks.length} ducks ready.</span>
              </>
            )}
            {record && startedAt === null && (
              <>
                <button className="btn btn-gold btn-lg" data-magnetic onClick={start}><Icon name="flag" size={18} /> Start the race</button>
                <span className="hint">{ducks.length} ducks, {duration} seconds. Commitment is on stream.</span>
              </>
            )}
            {startedAt !== null && !finished && <span className="hint row" style={{ gap: 10 }}><span className="live-dot" />Race in progress…</span>}
            {finished && !revealed && (
              <>
                <span className="chip chip-gold"><Icon name="trophy" size={12} /> Winner: {order[0]}</span>
                <button className="btn btn-gold" onClick={reveal}><Icon name="shield" size={16} /> Reveal seed</button>
              </>
            )}
            {revealed && <span className="chip chip-good"><Icon name="check" size={12} /> Seed revealed · proof published</span>}
          </div>
          <div style={{ padding: 20 }}>
            <DuckRace ducks={ducks} order={order} duration={duration} startedAt={startedAt} />
          </div>
          {finished && order.length >= 3 && (
            <div className="podium fade-in" style={{ padding: '0 20px 24px' }}>
              <div className="p2"><b>2</b>{order[1]}</div>
              <div className="p1"><b>1</b>{order[0]}</div>
              <div className="p3"><b>3</b>{order[2]}</div>
            </div>
          )}
        </div>

        <div className="side">
          <FairnessPanel record={record} revealed={revealed} />
          <div className="card card-pad stack">
            <div className="spread"><h3>Ducks</h3><span className="dim mono">{ducks.length}/{MAX_DUCKS}</span></div>
            <textarea value={text} onChange={(e) => setText(e.target.value)} disabled={!!record} aria-label="Duck names, one per line" />
            <div className="row">
              <button className="btn btn-sm" disabled={!!record} onClick={() => setText(uniqueEntrants().join('\n'))}>One per buyer</button>
              <button className="btn btn-sm" disabled={!!record} onClick={() => setText(giveawayEntries().join('\n'))}>One per purchase</button>
            </div>
          </div>
          <LogPanel log={log} />
        </div>
      </div>
    </>
  );
}
