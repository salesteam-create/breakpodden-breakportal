import { useMemo, useState } from 'react';
import { BREAKS, CHECKLISTS, ORDERS_394, kr } from '../lib/data.ts';
import { openStreamWindow } from '../lib/store.ts';
import { useShuffleDraw } from '../lib/useShuffleDraw.ts';
import Dice from '../components/Dice.tsx';
import ShuffleBoard from '../components/ShuffleBoard.tsx';
import { FairnessPanel, LogPanel, RevealGrid, Steps, downloadCsv } from '../components/Panels.tsx';

const brk = BREAKS.find((b) => b.id === '394')!;
const STEPS = ['Import buyers', 'Load checklist', 'Seal draw', 'Roll and shuffle', 'Reveal'];

export default function RandomBreak() {
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(0);
  const [teams, setTeams] = useState<string[]>([]);
  const [view, setView] = useState<'cards' | 'list'>('cards');

  // One row per slot bought, in purchase order.
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
  });
  const { phase, addLog } = draw;

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
    setTeams(CHECKLISTS[brk.box]);
    addLog(`Checklist loaded: ${brk.box} (${CHECKLISTS[brk.box].length} teams)`);
  };

  const step = !allImported ? 0 : teams.length === 0 ? 1 : phase === 'ready' ? 2 : phase === 'revealed' ? 5 : phase === 'shuffled' ? 4 : 3;
  const pairs = draw.order.map((team, i) => ({ who: buyers[i], what: team, n: i + 1 }));

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
        <button className="btn btn-gold btn-lg" onClick={loadChecklist}>Load box checklist</button>
        <span className="hint">Box: <b>{brk.box}</b>. 18 teams from the checklist library.</span>
      </>
    );
  else if (step === 2)
    action = (
      <>
        <button className="btn btn-gold btn-lg" onClick={draw.seal}>🔒 Seal the draw</button>
        <span className="hint">Locks both lists and a secret seed. The fingerprint goes on stream before anyone rolls.</span>
      </>
    );
  else if (step === 3)
    action = (
      <>
        <Dice values={draw.dice} rollId={draw.rollId} showTotal={phase !== 'rolling' && phase !== 'sealed'} />
        {phase === 'sealed' ? (
          <button className="btn btn-gold btn-lg" onClick={draw.roll}>🎲 Roll the dice</button>
        ) : (
          <div className="stack" style={{ gap: 8 }}>
            <span className="hint">{phase === 'rolling' ? 'Rolling…' : `Shuffle ${draw.round} of ${draw.dice![0] + draw.dice![1]}`}</span>
            {draw.dice && (
              <div className="round-meter">
                {Array.from({ length: draw.dice[0] + draw.dice[1] }, (_, i) => <span key={i} className={i < draw.round ? 'on' : ''} />)}
              </div>
            )}
          </div>
        )}
      </>
    );
  else if (step === 4)
    action = (
      <>
        <Dice values={draw.dice} rollId={draw.rollId} showTotal />
        <button className="btn btn-gold btn-lg" onClick={draw.reveal}>✨ Reveal results</button>
        <span className="hint">Locks the results and reveals the seed so anyone can verify.</span>
      </>
    );
  else
    action = (
      <>
        <span className="chip chip-good">Break is live</span>
        <span className="hint">Every card pulled for a team goes to its buyer.</span>
        <div className="row" style={{ marginLeft: 'auto' }}>
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
          <LogPanel log={draw.log} />
        </div>
      </div>
    </>
  );
}
