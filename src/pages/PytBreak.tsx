import { useMemo, useState } from 'react';
import { MEDIA } from '../lib/media.ts';
import { BREAKS, FILLER_PRICE, entryBuyer, fillerEntries, initialPytSlots, kr, type Slot } from '../lib/data.ts';
import { openStreamWindow } from '../lib/store.ts';
import { useShuffleDraw } from '../lib/useShuffleDraw.ts';
import ShuffleBoard from '../components/ShuffleBoard.tsx';
import { FairnessPanel, LogPanel, RevealGrid, Steps, VoidedPanel } from '../components/Panels.tsx';
import { RollProgress, ShuffleModeControl, VoidButton } from '../components/DrawControls.tsx';
import Hero, { AvatarStack } from '../components/Hero.tsx';
import Icon from '../components/Icons.tsx';

const brk = BREAKS.find((b) => b.id === '403')!;
const STEPS = ['Open spots', 'Seal draw', 'Roll and shuffle', 'Reveal winners', 'Assign teams'];
type Assign = 'draw' | 'choose';
/** Lets long names like "Czechia/Slovakia/Serbia" wrap after each slash. */
const breakable = (name: string) => name.replace(/\//g, '/\u200b');
type TileKind = 'sold' | 'open' | 'filler';
const kindOf = (s: Slot): TileKind => (!s.owner ? 'open' : s.viaFiller ? 'filler' : 'sold');
const LEGEND: { kind: TileKind; label: string }[] = [
  { kind: 'sold', label: 'Sold' },
  { kind: 'open', label: 'Open' },
  { kind: 'filler', label: 'Won via filler' },
];

export default function PytBreak() {
  const [slots, setSlots] = useState<Slot[]>(initialPytSlots);
  const [mode, setMode] = useState<'board' | 'filler'>('board');
  const [show, setShow] = useState<TileKind | null>(null);
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
      <Hero
        image={MEDIA.futeraHero}
        vivid
       
        compact
        badge={{ icon: 'bolt', label: `Break #${brk.number}` }}
        chips={
          <>
            
            <span className="tag"><Icon name="ticket" size={13} /> Pick your team</span>
            <span className="tag"><Icon name="clock" size={13} /> {brk.startsAt}</span>
            <span className="tag">{Math.round((sold / slots.length) * 100)}% sold</span>
          </>
        }
        title={brk.title}
        stats={[
          { icon: 'box', label: 'Box', value: kr(brk.boxPrice) },
          { icon: 'grid', label: 'Teams and splits', value: slots.length },
          { icon: 'users', label: 'Sold', value: `${sold}/${slots.length}` },
        ]}
        actions={<button className="btn btn-outline" onClick={openStreamWindow}><Icon name="popout" size={17} /> Pop out stream view</button>}
        aside={<AvatarStack names={slots.filter((x) => x.owner).map((x) => x.owner!)} label="team owners" />}
        tabs={
          <div className="tabs" role="tablist" aria-label="Break view">
            <button role="tab" aria-selected={mode === 'board'} className={mode === 'board' ? 'on' : ''} onClick={() => setMode('board')}><Icon name="grid" size={16} /> Team board</button>
            <button role="tab" aria-selected={mode === 'filler'} className={mode === 'filler' ? 'on' : ''} onClick={() => setMode('filler')}><Icon name="ticket" size={16} /> Filler draw {done && <Icon name="check" size={14} />}</button>
          </div>
        }
      />

      {mode === 'board' ? (
        <div className="workspace">
          <div className="card">
            <div className="card-head">
              <div>
                <h3>Team board</h3>
                <span className="muted sm">Prices and splits from breakpodden.com</span>
              </div>
              <div className="legend" role="group" aria-label="Filter teams">
                {LEGEND.map((l) => {
                  const n = slots.filter((x) => kindOf(x) === l.kind).length;
                  return (
                    <button
                      key={l.kind}
                      className={show === l.kind ? 'on' : ''}
                      aria-pressed={show === l.kind}
                      disabled={n === 0}
                      title={n === 0 ? `No teams ${l.label.toLowerCase()} yet` : `Show only ${l.label.toLowerCase()} teams`}
                      onClick={() => setShow(show === l.kind ? null : l.kind)}
                    >
                      <i className={`lg-${l.kind}`} /> {l.label} <em>{n}</em>
                    </button>
                  );
                })}
                {show && <button className="lg-clear" onClick={() => setShow(null)}>Show all</button>}
              </div>
            </div>
            <div className="team-grid">
              {slots.filter((s) => !show || kindOf(s) === show).map((s) => (
                <div key={s.team} className={`tile${s.owner ? (s.viaFiller ? ' filled' : '') : ' open'}`}>
                  <span className="t">{breakable(s.team)}</span>
                  <span className="o">
                    <span>{s.owner ? (s.viaFiller ? <><Icon name="trophy" size={12} /> {s.owner}</> : s.owner) : 'Open'}</span>
                    <span>{kr(s.price)}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="side">
            <div className="card card-pad stack">
              <div className="spread"><h3>Sales</h3><span className="chip chip-gold">{Math.round((sold / slots.length) * 100)}% sold</span></div>
              <div className="progress"><span style={{ width: `${(sold / slots.length) * 100}%` }} /></div>
              <div className="spread muted" style={{ fontSize: 13.5 }}><span>Sold value</span><b className="strong">{kr(soldValue)}</b></div>
              <div className="spread muted" style={{ fontSize: 13.5 }}><span>Open teams</span><b className="strong">{slots.length - sold}</b></div>
              <div className="spread muted" style={{ fontSize: 13.5 }}><span>Value before fillers</span><b className="strong">{kr(openValue)} open</b></div>
            </div>
            <div className="card card-pad stack">
              <h3>Fillers</h3>
              <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>
                The top teams rarely sell. Fillers sell the remaining {kr(openValue)} as cheap entries. A seeded draw decides
                which {openTeams.length} entries win the open teams.
              </p>
              <div className="spread muted" style={{ fontSize: 13.5 }}><span>Entry price</span><b className="strong">{kr(FILLER_PRICE)}</b></div>
              <div className="spread muted" style={{ fontSize: 13.5 }}><span>Entries sold</span><b className="strong">{entries.length} ({kr(entries.length * FILLER_PRICE)})</b></div>
              <button className="btn btn-primary btn-block" onClick={() => setMode('filler')} disabled={done}>
                {done ? <><Icon name="check" size={16} /> Filler draw done</> : <>Start filler draw <Icon name="arrow" size={16} /></>}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="workspace">
          <div className="card stage">
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
                  <button className="btn btn-primary btn-lg" onClick={draw.seal}><Icon name="lock" size={18} /> Seal the filler draw</button>
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
                      <button className="btn btn-primary btn-lg" onClick={draw.roll}><Icon name={fixed ? 'shuffle' : 'dice'} size={18} /> {fixed ? 'Start shuffling' : 'Roll the dice'}</button>
                      <span style={{ marginLeft: 'auto' }}><VoidButton onVoid={voidDraw} /></span>
                    </>
                  )}
                </>
              )}
              {phase === 'shuffled' && (
                <>
                  <RollProgress phase={phase} dice={draw.dice} rollId={draw.rollId} round={draw.round} total={draw.totalRounds} fixed={fixed} />
                  <button className="btn btn-primary btn-lg" onClick={reveal}><Icon name="sparkle" size={18} /> Reveal winners</button>
                  <span style={{ marginLeft: 'auto' }}><VoidButton onVoid={voidDraw} /></span>
                </>
              )}
              {picking && (
                <>
                  <span className="chip chip-gold">Pick {picks.length + 1} of {winners.length}</span>
                  <span className="hint">
                    <b className="gold">{entryBuyer(winners[picks.length])}</b> ({winners[picks.length].split(' · ')[1]}) chooses a team
                  </span>
                </>
              )}
              {done && (
                <>
                  <span className="chip chip-good">{openTeams.length} filler winners assigned</span>
                  <span className="hint">All {slots.length} teams are owned. The break can start.</span>
                  <div className="row" style={{ marginLeft: 'auto' }}>
                    <VoidButton onVoid={voidDraw} />
                    <button className="btn btn-sm" onClick={() => setMode('board')}>View team board <Icon name="arrow" size={14} /></button>
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
                        <span className="t">{breakable(t)}</span>
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
