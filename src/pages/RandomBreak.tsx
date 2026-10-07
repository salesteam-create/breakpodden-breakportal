import { useMemo, useState } from 'react';
import { BREAKS, ORDERS_394, kr } from '../lib/data.ts';
import { getChecklists, openStreamWindow } from '../lib/store.ts';
import { useShuffleDraw } from '../lib/useShuffleDraw.ts';
import ShuffleBoard from '../components/ShuffleBoard.tsx';
import { FairnessPanel, LogPanel, RevealGrid, Steps, VoidedPanel, downloadCsv } from '../components/Panels.tsx';
import { RollProgress, ShuffleModeControl, VoidButton } from '../components/DrawControls.tsx';

const brk = BREAKS.find((b) => b.id === '394')!;
const STEPS = ['Import buyers', 'Load checklist', 'Seal draw', 'Roll and shuffle', 'Reveal'];

export default function RandomBreak() {
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(0);
  const [teams, setTeams] = useState<string[]>([]);
  const [view, setView] = useState<'cards' | 'list'>('cards');
  const [fixed, setFixed] = useState<number | undefined>(undefined);
  const checklists = useMemo(getChecklists, []);
  const [box, setBox] = useState(checklists[brk.box] ? brk.box : Object.keys(checklists)[0]);

  // One row per spot bought, in purchase order.
  const slots = useMemo(
    () => ORDERS_394.flatMap((o) => Array.from({ length: o.qty }, () => ({ buyer: o.buyer, order: o.order }))),
    [],
  );
  const buyers = useMemo(() => slots.slice(0, imported).map((s) => s.buyer), [slots, imported]);
  const tags = useMemo(() => slots.map((s) => s.order), [slots]);
  const allImported = imported === slots.length;

  const draw = useShuffleDraw({
    kind: 'team',
    title: `Break #${brk.number} · ${brk.title}`,
    subtitle: 'Random team · team draw',
    left: buyers,
    right: teams,
    leftLabel: 'Buyer (purchase order)',
    rightLabel: 'Team',
    shuffles: fixed,
  });
  const { phase, addLog } = draw;
  const mismatch = teams.length > 0 && teams.length !== buyers.length;

  const importOrders = () => {
    setImporting(true);
    addLog(`Fetching paid orders for Shopify product "Break #${brk.number}"`);
    let n = 0;
    const t = window.setInterval(() => {
      n++;
      setImported(n);
      if (n >= slots.length) {
        clearInterval(t);
        setImporting(false);
        addLog(`Imported ${ORDERS_394.length} orders, ${slots.length} spots`);
      }
    }, 110);
  };

  const loadChecklist = () => {
    setTeams(checklists[box]);
    addLog(`Checklist loaded: ${box} (${checklists[box].length} teams)`);
  };

  const step = !allImported ? 0 : teams.length === 0 ? 1 : phase === 'ready' ? 2 : phase === 'revealed' ? 5 : phase === 'shuffled' ? 4 : 3;
  const pairs = draw.order.map((team, i) => ({ who: buyers[i], what: team, n: i + 1 }));
  const canVoid = phase === 'sealed' || phase === 'shuffled' || phase === 'revealed';

  let action;
  if (step === 0)
    action = (
      <>
        <button className="btn btn-gold btn-lg" onClick={importOrders} disabled={importing}>
          {importing ? <><span className="spinner" /> Importing…</> : 'Import buyers from Shopify'}
        </button>
        <span className="hint">Pulls every paid order for this break product. One row per spot bought.</span>
      </>
    );
  else if (step === 1)
    action = (
      <>
        <div className="field" style={{ flex: 1, maxWidth: 380 }}>
          <label>Box checklist</label>
          <select value={box} onChange={(e) => setBox(e.target.value)}>
            {Object.keys(checklists).map((b) => (
              <option key={b} value={b}>{b} ({checklists[b].length} teams)</option>
            ))}
          </select>
        </div>
        <button className="btn btn-gold btn-lg" onClick={loadChecklist}>Load checklist</button>
        <a className="hint" href="#/checklists">Edit checklists →</a>
      </>
    );
  else if (step === 2)
    action = mismatch ? (
      <>
        <div className="warn-box">⚠ {buyers.length} spots but {teams.length} teams. Every spot needs exactly one team.</div>
        <button className="btn btn-sm" onClick={() => setTeams([])}>Pick another checklist</button>
      </>
    ) : (
      <>
        <ShuffleModeControl value={fixed} onChange={setFixed} />
        <button className="btn btn-gold btn-lg" onClick={draw.seal}>🔒 Seal the draw</button>
        <span className="hint">Locks both lists, the shuffle setting and a secret seed.</span>
      </>
    );
  else if (step === 3)
    action = (
      <>
        <RollProgress phase={phase} dice={draw.dice} rollId={draw.rollId} round={draw.round} total={draw.totalRounds} fixed={fixed} />
        {phase === 'sealed' && (
          <button className="btn btn-gold btn-lg" onClick={draw.roll}>{fixed ? '🔀 Start shuffling' : '🎲 Roll the dice'}</button>
        )}
        {phase === 'sealed' && <span style={{ marginLeft: 'auto' }}><VoidButton onVoid={draw.voidDraw} /></span>}
      </>
    );
  else if (step === 4)
    action = (
      <>
        <RollProgress phase={phase} dice={draw.dice} rollId={draw.rollId} round={draw.round} total={draw.totalRounds} fixed={fixed} />
        <button className="btn btn-gold btn-lg" onClick={draw.reveal}>✨ Reveal results</button>
        <span style={{ marginLeft: 'auto' }}><VoidButton onVoid={draw.voidDraw} /></span>
      </>
    );
  else
    action = (
      <>
        <span className="chip chip-good">Break is live</span>
        <div className="row" style={{ marginLeft: 'auto', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button className="btn btn-sm" onClick={() => setView(view === 'cards' ? 'list' : 'cards')}>
            {view === 'cards' ? 'List view' : 'Card view'}
          </button>
          <button
            className="btn btn-sm"
            onClick={() => downloadCsv(`break-${brk.number}-results.csv`, [['#', 'Order', 'Buyer', 'Team'], ...pairs.map((p, i) => [String(p.n), tags[i], p.who, p.what])])}
          >
            Export CSV
          </button>
          <button className="btn btn-sm" onClick={() => addLog('Results written to Shopify orders (simulated)')}>Write to Shopify</button>
          <VoidButton onVoid={draw.voidDraw} disabled={!canVoid} />
        </div>
      </>
    );

  return (
    <>
      <div className="break-head">
        <div className="thumb"><img src={brk.image} alt="" /></div>
        <div>
          <div className="eyebrow">Break #{brk.number} · Random team</div>
          <h1 style={{ fontSize: 38, marginTop: 6 }}>{brk.title}</h1>
          <div className="facts">
            <span>Box <b>{kr(brk.boxPrice)}</b></span>
            <span>Spot price <b>{kr(brk.slotPrice!)}</b></span>
            <span>Spots <b>{brk.spots}</b></span>
            <span>Sold <b>{brk.spots}/{brk.spots}</b></span>
            <span>{brk.startsAt}</span>
          </div>
        </div>
        <button className="btn" onClick={openStreamWindow}>⧉ Pop out stream view</button>
      </div>

      <div className="workspace">
        <div className="card">
          <Steps labels={STEPS} current={step} />
          <div className="action-bar">{action}</div>
          {phase === 'revealed' && view === 'cards' ? (
            <RevealGrid pairs={pairs} />
          ) : (
            <ShuffleBoard
              left={buyers}
              order={draw.order}
              leftTags={tags}
              leftLabel="Buyer (purchase order)"
              rightLabel="Team"
              leftPlaceholder="Waiting for Shopify import"
              rightPlaceholder="Load the box checklist"
              shuffling={phase === 'shuffling'}
              done={phase === 'revealed'}
            />
          )}
        </div>
        <div className="side">
          <FairnessPanel record={draw.record} revealed={phase === 'revealed'} />
          <VoidedPanel voided={draw.voided} />
          <LogPanel log={draw.log} />
        </div>
      </div>
    </>
  );
}
