import { useMemo, useState } from 'react';
import { BREAKS, FILLER_PRICE, entryBuyer, fillerEntries, initialPytSlots, kr, type Slot } from '../lib/data.ts';
import { openStreamWindow } from '../lib/store.ts';
import { useShuffleDraw } from '../lib/useShuffleDraw.ts';
import ShuffleBoard from '../components/ShuffleBoard.tsx';
import { FairnessPanel, LogPanel, RevealGrid, Steps, VoidedPanel } from '../components/Panels.tsx';
import { RollProgress, ShuffleModeControl, VoidButton } from '../components/DrawControls.tsx';

const brk = BREAKS.find((b) => b.id === '403')!;
const STEPS = ['Open spots', 'Seal draw', 'Roll and shuffle', 'Reveal winners', 'Assign teams'];
type Assign = 'draw' | 'choose';

export default function PytBreak() {
  const [slots, setSlots] = useState<Slot[]>(initialPytSlots);
  const [mode, setMode] = useState<'board' | 'filler'>('board');
  const [assign, setAssign] = useState<Assign>('draw');
  const [fixed, setFixed] = useState<number | undefined>(undefined);
  const [picks, setPicks] = useState<{ entry: string; team: string }[]>([]);
  const entries = useMemo(fillerEntries, []);
  const openTeams = useMemo(() => initialPytSlots().filter((s) => !s.owner).map((s) => s.team), []);

  const sold = slots.filter((s) => s.owner).length;
  const openValue = initialPytSlots().filter((s) => !s.owner).reduce((a, s) => a + s.price, 0);
  const soldValue = slots.filter((s) => s.owner && !s.viaFiller).reduce((a, s) => a + s.price, 0);
  const priceOf = (team: string) => slots.find((s) => s.team === team)?.price ?? 0;

  const draw = useShuffleDraw({
    kind: 'filler',
    title: `Break #${brk.number} · Filler draw`,
    subtitle: `${openTeams.length} open teams · ${entries.length} filler entries`,
    left: openTeams,
    right: entries,
    leftLabel: assign === 'choose' ? 'Pick order' : 'Open team',
    rightLabel: 'Filler entry',
    winTop: openTeams.length,
    shuffles: fixed,
    mode: assign === 'choose' ? 'choose' : undefined,
  });
  const { phase, addLog } = draw;
  const winners = draw.order.slice(0, openTeams.length);

  const assignTeams = (pairs: { entry: string; team: string }[]) => {
    const byTeam = new Map(pairs.map((p) => [p.team, p.entry]));
    setSlots((s) => s.map((x) => (byTeam.has(x.team) ? { ...x, owner: entryBuyer(byTeam.get(x.team)!), viaFiller: true } : x)));
  };

  const reveal = () => {
    draw.reveal();
    if (assign === 'draw') assignTeams(openTeams.map((team, i) => ({ team, entry: draw.order[i] })));
    else addLog(`Pick round open: ${winners.length} winners choose in winning order`);
  };

  const pick = (team: string) => {
    const entry = winners[picks.length];
    const next = [...picks, { entry, team }];
    setPicks(next);
    addLog(`Pick ${next.length}: ${entryBuyer(entry)} chose ${team}`);
    if (next.length === winners.length) {
      draw.savePicks(next);
      assignTeams(next);
      addLog('All open teams assigned');
    }
  };

  const voidDraw = (reason: string) => {
    draw.voidDraw(reason);
    setPicks([]);
    setSlots(initialPytSlots());
  };

  const picking = phase === 'revealed' && assign === 'choose' && picks.length < winners.length;
  const done = phase === 'revealed' && (assign === 'draw' || picks.length === winners.length);
  const step = phase === 'ready' ? 1 : phase === 'shuffled' ? 3 : phase === 'revealed' ? (done ? 5 : 4) : 2;
  const takenTeams = new Set(picks.map((p) => p.team));

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
              <div className="spread muted" style={{ fontSize: 13.5 }}><span>Open teams</span><b style={{ color: 'var(--text)' }}>{slots.length - sold}</b></div>
              <div className="spread muted" style={{ fontSize: 13.5 }}><span>Value before fillers</span><b style={{ color: 'var(--text)' }}>{kr(openValue)} open</b></div>
            </div>
            <div className="card card-pad stack">
              <h3>Fillers</h3>
              <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>
                The top teams rarely sell. Fillers sell the remaining {kr(openValue)} as cheap entries. A seeded draw decides
                which {openTeams.length} entries win the open teams.
              </p>
              <div className="spread muted" style={{ fontSize: 13.5 }}><span>Entry price</span><b style={{ color: 'var(--text)' }}>{kr(FILLER_PRICE)}</b></div>
              <div className="spread muted" style={{ fontSize: 13.5 }}><span>Entries sold</span><b style={{ color: 'var(--text)' }}>{entries.length} ({kr(entries.length * FILLER_PRICE)})</b></div>
              <button className="btn btn-gold" onClick={() => setMode('filler')} disabled={done}>
                {done ? 'Filler draw done' : 'Start filler draw'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="workspace">
          <div className="card">
            <Steps labels={STEPS} current={step} />
            <div className="action-bar" style={{ flexWrap: 'wrap' }}>
              {phase === 'ready' && (
                <>
                  <div className="stack" style={{ gap: 8 }}>
                    <div className="seg" role="group" aria-label="How winners get teams">
                      <button className={assign === 'draw' ? 'on' : ''} onClick={() => setAssign('draw')}>Paired by draw</button>
                      <button className={assign === 'choose' ? 'on' : ''} onClick={() => setAssign('choose')}>Winners choose</button>
                    </div>
                    <ShuffleModeControl value={fixed} onChange={setFixed} />
                  </div>
                  <button className="btn btn-gold btn-lg" onClick={draw.seal}>🔒 Seal the filler draw</button>
                  <span className="hint" style={{ maxWidth: 320 }}>
                    {assign === 'draw'
                      ? `Top ${openTeams.length} entries are paired with the open teams in list order.`
                      : `Top ${openTeams.length} entries pick a team, #1 first. The pick order is locked in the proof.`}
                  </span>
                </>
              )}
              {(phase === 'sealed' || phase === 'rolling' || phase === 'shuffling') && (
                <>
                  <RollProgress phase={phase} dice={draw.dice} rollId={draw.rollId} round={draw.round} total={draw.totalRounds} fixed={fixed} />
                  {phase === 'sealed' && (
                    <>
                      <button className="btn btn-gold btn-lg" onClick={draw.roll}>{fixed ? '🔀 Start shuffling' : '🎲 Roll the dice'}</button>
                      <span style={{ marginLeft: 'auto' }}><VoidButton onVoid={voidDraw} /></span>
                    </>
                  )}
                </>
              )}
              {phase === 'shuffled' && (
                <>
                  <RollProgress phase={phase} dice={draw.dice} rollId={draw.rollId} round={draw.round} total={draw.totalRounds} fixed={fixed} />
                  <button className="btn btn-gold btn-lg" onClick={reveal}>✨ Reveal winners</button>
                  <span style={{ marginLeft: 'auto' }}><VoidButton onVoid={voidDraw} /></span>
                </>
              )}
              {picking && (
                <>
                  <span className="chip chip-gold">Pick {picks.length + 1} of {winners.length}</span>
                  <span className="hint">
                    <b style={{ color: 'var(--gold-hi)' }}>{entryBuyer(winners[picks.length])}</b> ({winners[picks.length].split(' · ')[1]}) chooses a team
                  </span>
                </>
              )}
              {done && (
                <>
                  <span className="chip chip-good">{openTeams.length} filler winners assigned</span>
                  <span className="hint">All {slots.length} teams are owned. The break can start.</span>
                  <div className="row" style={{ marginLeft: 'auto' }}>
                    <VoidButton onVoid={voidDraw} />
                    <button className="btn btn-sm" onClick={() => setMode('board')}>View team board →</button>
                  </div>
                </>
              )}
            </div>

            {picking ? (
              <div className="pick-layout">
                <div className="pick-order">
                  <div className="board-label">Pick order</div>
                  {winners.map((w, i) => (
                    <div key={w} className={`pick-row${i === picks.length ? ' now' : i < picks.length ? ' done' : ''}`}>
                      <span className="mono dim">{i + 1}</span>
                      <span>{entryBuyer(w)}</span>
                      <span className="tag">{picks[i]?.team ?? ''}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="board-label">Open teams</div>
                  <div className="pick-grid">
                    {openTeams.map((t) => (
                      <button key={t} className={`tile open pick-tile${takenTeams.has(t) ? ' taken' : ''}`} disabled={takenTeams.has(t)} onClick={() => pick(t)}>
                        <span className="t">{t}</span>
                        <span className="o"><span>{takenTeams.has(t) ? entryBuyer(picks.find((p) => p.team === t)!.entry) : 'Pick'}</span><span>{kr(priceOf(t))}</span></span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : done ? (
              <RevealGrid
                pairs={(assign === 'choose' ? picks : openTeams.map((team, i) => ({ team, entry: draw.order[i] }))).map((p, i) => ({
                  who: p.entry,
                  what: p.team,
                  n: i + 1,
                }))}
              />
            ) : (
              <div className="board-scroll">
                <ShuffleBoard
                  left={assign === 'choose' ? openTeams.map((_, i) => `Pick #${i + 1}`) : openTeams}
                  order={draw.order}
                  leftLabel={assign === 'choose' ? 'Pick order' : 'Open team'}
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
            <VoidedPanel voided={draw.voided} />
            <LogPanel log={draw.log} />
          </div>
        </div>
      )}
    </>
  );
}
