import { useMemo, useState } from 'react';
import { BREAKS, FILLER_PRICE, entryBuyer, fillerEntries, initialPytSlots, kr, type Slot } from '../lib/data.ts';
import { openStreamWindow } from '../lib/store.ts';
import { useShuffleDraw } from '../lib/useShuffleDraw.ts';
import Dice from '../components/Dice.tsx';
import ShuffleBoard from '../components/ShuffleBoard.tsx';
import { FairnessPanel, LogPanel, RevealGrid, Steps } from '../components/Panels.tsx';

const brk = BREAKS.find((b) => b.id === '403')!;
const STEPS = ['Open slots', 'Seal draw', 'Roll and shuffle', 'Reveal winners'];

export default function PytBreak() {
  const [slots, setSlots] = useState<Slot[]>(initialPytSlots);
  const [mode, setMode] = useState<'board' | 'filler'>('board');
  const entries = useMemo(fillerEntries, []);
  const openTeams = useMemo(() => initialPytSlots().filter((s) => !s.owner).map((s) => s.team), []);

  const sold = slots.filter((s) => s.owner).length;
  const openValue = initialPytSlots().filter((s) => !s.owner).reduce((a, s) => a + s.price, 0);
  const soldValue = slots.filter((s) => s.owner && !s.viaFiller).reduce((a, s) => a + s.price, 0);

  const draw = useShuffleDraw({
    kind: 'filler',
    title: `Break #${brk.number} · Filler draw`,
    subtitle: `${openTeams.length} open teams · ${entries.length} filler entries`,
    left: openTeams,
    right: entries,
    leftLabel: 'Open team',
    rightLabel: 'Filler entry',
    winTop: openTeams.length,
  });
  const { phase } = draw;

  const reveal = () => {
    draw.reveal();
    const winners = new Map(openTeams.map((t, i) => [t, draw.order[i]]));
    setSlots((s) => s.map((x) => (winners.has(x.team) ? { ...x, owner: entryBuyer(winners.get(x.team)!), viaFiller: true } : x)));
  };

  const step = phase === 'ready' ? 1 : phase === 'revealed' ? 4 : phase === 'shuffled' ? 3 : phase === 'sealed' ? 2 : 2;

  return (
    <>
      <div className="break-head">
        <div className="thumb"><img src={brk.image} alt="" /></div>
        <div>
          <div className="eyebrow">Break #{brk.number} · Pick your team</div>
          <h1 style={{ fontSize: 38, marginTop: 6 }}>{brk.title}</h1>
          <div className="facts">
            <span>Box <b>{kr(brk.boxPrice)}</b></span>
            <span>Teams and player splits <b>{slots.length}</b></span>
            <span>Sold <b>{sold}/{slots.length}</b></span>
            <span>{brk.startsAt}</span>
          </div>
        </div>
        <div className="row">
          {mode === 'board' ? (
            <button className="btn" onClick={() => setMode('filler')}>Filler draw</button>
          ) : (
            <button className="btn" onClick={() => setMode('board')}>Team board</button>
          )}
          <button className="btn" onClick={openStreamWindow}>⧉ Pop out stream view</button>
        </div>
      </div>

      {mode === 'board' ? (
        <div className="workspace">
          <div className="card">
            <div className="card-head">
              <h3>Team board</h3>
              <span className="muted" style={{ fontSize: 13 }}>Prices and splits from breakpodden.com</span>
            </div>
            <div className="team-grid">
              {slots.map((s) => (
                <div key={s.team} className={`tile${s.owner ? (s.viaFiller ? ' filled' : '') : ' open'}`}>
                  <span className="t">{s.team}</span>
                  <span className="o">
                    <span>{s.owner ? (s.viaFiller ? `★ ${s.owner}` : s.owner) : 'OPEN'}</span>
                    <span>{kr(s.price)}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="side">
            <div className="card card-pad stack">
              <div className="spread"><h3>Sales</h3><span className="chip chip-gold">{Math.round((sold / slots.length) * 100)}% sold</span></div>
              <div className="progress"><div style={{ width: `${(sold / slots.length) * 100}%` }} /></div>
              <div className="spread muted" style={{ fontSize: 13.5 }}><span>Sold value</span><b style={{ color: 'var(--text)' }}>{kr(soldValue)}</b></div>
              <div className="spread muted" style={{ fontSize: 13.5 }}><span>Open teams</span><b style={{ color: 'var(--text)' }}>{openTeams.length - (slots.filter((s) => s.viaFiller).length)}</b></div>
              <div className="spread muted" style={{ fontSize: 13.5 }}><span>Open value</span><b style={{ color: 'var(--text)' }}>{kr(openValue)}</b></div>
            </div>
            <div className="card card-pad stack">
              <h3>Fillers</h3>
              <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>
                The top teams rarely sell. Fillers sell the remaining {kr(openValue)} as cheap entries. A seeded draw decides
                which {openTeams.length} entries win the open teams.
              </p>
              <div className="spread muted" style={{ fontSize: 13.5 }}><span>Entry price</span><b style={{ color: 'var(--text)' }}>{kr(FILLER_PRICE)}</b></div>
              <div className="spread muted" style={{ fontSize: 13.5 }}><span>Entries sold</span><b style={{ color: 'var(--text)' }}>{entries.length} ({kr(entries.length * FILLER_PRICE)})</b></div>
              <button className="btn btn-gold" onClick={() => setMode('filler')} disabled={phase === 'revealed'}>
                {phase === 'revealed' ? 'Filler draw done' : 'Start filler draw'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="workspace">
          <div className="card">
            <Steps labels={STEPS} current={step} />
            <div className="action-bar">
              {phase === 'ready' && (
                <>
                  <button className="btn btn-gold btn-lg" onClick={draw.seal}>🔒 Seal the filler draw</button>
                  <span className="hint">{openTeams.length} open teams on the left, {entries.length} entries on the right. Top {openTeams.length} after the shuffles win.</span>
                </>
              )}
              {(phase === 'sealed' || phase === 'rolling' || phase === 'shuffling') && (
                <>
                  <Dice values={draw.dice} rollId={draw.rollId} showTotal={phase === 'shuffling'} />
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
              )}
              {phase === 'shuffled' && (
                <>
                  <Dice values={draw.dice} rollId={draw.rollId} showTotal />
                  <button className="btn btn-gold btn-lg" onClick={reveal}>✨ Reveal winners</button>
                </>
              )}
              {phase === 'revealed' && (
                <>
                  <span className="chip chip-good">{openTeams.length} filler winners</span>
                  <span className="hint">All {slots.length} teams are now owned. The break can start.</span>
                  <button className="btn btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setMode('board')}>View team board →</button>
                </>
              )}
            </div>
            {phase === 'revealed' ? (
              <RevealGrid pairs={openTeams.map((t, i) => ({ who: draw.order[i], what: t, n: i + 1 }))} />
            ) : (
              <div className="board-scroll">
                <ShuffleBoard
                  left={openTeams}
                  order={draw.order}
                  leftLabel="Open team"
                  rightLabel="Filler entry"
                  shuffling={phase === 'shuffling'}
                  winTop={openTeams.length}
                  rowH={32}
                />
              </div>
            )}
          </div>
          <div className="side">
            <FairnessPanel record={draw.record} revealed={phase === 'revealed'} />
            <LogPanel log={draw.log} />
          </div>
        </div>
      )}
    </>
  );
}
