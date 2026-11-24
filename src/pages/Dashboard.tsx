import { useRef, useState } from 'react';
import { BREAKS, ORDERS_394, fillerEntries, giveawayEntries, initialPytSlots, uniqueEntrants, kr } from '../lib/data.ts';
import { listDraws, openStreamWindow } from '../lib/store.ts';
import Showcase from '../components/Showcase.tsx';
import Hero, { AvatarStack } from '../components/Hero.tsx';
import Icon from '../components/Icons.tsx';
import Wheel from '../components/Wheel.tsx';
import { DuckIcon } from '../components/DuckRace.tsx';

const SOLD: Record<string, [number, number]> = { '394': [18, 18], '403': [33, 43] };
const BUYERS: Record<string, string[]> = {
  '394': ORDERS_394.map((o) => o.buyer),
  '403': initialPytSlots().filter((s) => s.owner).map((s) => s.owner!),
};
const [b394, b403] = BREAKS;
const wheelNames = uniqueEntrants().slice(0, 12);

const UP_NEXT = [
  { href: '#/break/394', title: `Break #${b394.number}`, image: b394.image, tags: ['Random team', '20:00'], ready: true },
  { href: '#/break/403', title: `Break #${b403.number}`, image: b403.image, tags: ['Pick your team', '21:00'], ready: false },
  { href: '#/wheel', title: 'Wheel of fortune', icon: 'wheel', tags: ['Giveaway', `${giveawayEntries().length} entries`] },
  { href: '#/duck', title: 'Duck race', icon: 'duck', tags: ['Giveaway', `${uniqueEntrants().length} ducks`] },
];

const TOOLS = [
  { href: '#/break/394', title: 'Team draw', count: `${b394.spots} spots`, tags: ['Dice', 'Shuffle', 'Reveal'], scene: 'team' },
  { href: '#/break/403', title: 'Filler draw', count: `${fillerEntries().length} entries`, tags: ['Open teams', 'Top 10 win'], scene: 'filler' },
  { href: '#/wheel', title: 'Wheel of fortune', count: `${giveawayEntries().length} entries`, tags: ['Giveaway', 'Per purchase'], scene: 'wheel' },
  { href: '#/duck', title: 'Duck race', count: `${uniqueEntrants().length} ducks`, tags: ['Giveaway', 'Sealed finish'], scene: 'duck' },
] as const;

function Scene({ kind }: { kind: (typeof TOOLS)[number]['scene'] }) {
  if (kind === 'team' || kind === 'filler') {
    const img = kind === 'team' ? b394.image : b403.image;
    return (
      <span className="scene scene-box">
        <img className="blur" src={img} alt="" />
        <img className="sharp" src={img} alt="" />
      </span>
    );
  }
  if (kind === 'wheel') {
    return (
      <span className="scene scene-wheel">
        <Wheel entries={wheelNames} rotation={-18} size={300} />
      </span>
    );
  }
  return (
    <span className="scene scene-duck">
      <span className="ripple" />
      <span className="d d1"><DuckIcon size={46} gold num={1} /></span>
      <span className="d d2"><DuckIcon size={38} num={2} /></span>
      <span className="d d3"><DuckIcon size={32} num={3} /></span>
    </span>
  );
}

export default function Dashboard() {
  const [i, setI] = useState(0);
  const rowRef = useRef<HTMLDivElement>(null);
  const draws = listDraws();
  const recent = draws.slice(0, 5);

  const b = BREAKS[i];
  const [sold, of] = SOLD[b.id] ?? [0, b.spots];
  const ready = sold === of;
  const scrollRow = (dir: 1 | -1) => rowRef.current?.scrollBy({ left: dir * (rowRef.current.clientWidth * 0.8), behavior: 'smooth' });

  return (
    <div className="dash">
      <div className="dash-top">
        <div key={b.id} className="fade-swap">
          <Hero
            image={b.image}
            badge={{ icon: ready ? 'fire' : 'bolt', label: ready ? 'Sold out tonight' : 'Fillers open' }}
            chips={<span className="tag">{b.startsAt}</span>}
            title={b.title}
            lede={b.format === 'random'
              ? 'Import the buyers, seal the draw and roll live on stream. Every shuffle can be checked by anyone afterwards.'
              : `${of - sold} teams are still open. A sealed filler draw lets 49 kr entries win the rest.`}
            stats={[
              { label: 'Box', value: kr(b.boxPrice) },
              { label: 'Sold', value: `${sold}/${of}` },
              b.format === 'random' ? { label: 'Spot', value: kr(b.slotPrice!) } : { label: 'Open', value: of - sold },
            ]}
            actions={
              <>
                <a href={`#/break/${b.id}`} className="btn btn-gold">{ready ? 'Run the draw' : 'Open team board'}</a>
                <button className="btn btn-outline" onClick={openStreamWindow}><Icon name="popout" size={17} /> Stream view</button>
              </>
            }
            aside={<AvatarStack names={BUYERS[b.id] ?? []} label="buyers" />}
            pager={{ index: i, total: BREAKS.length, label: 'break', onPrev: () => setI((i - 1 + BREAKS.length) % BREAKS.length), onNext: () => setI((i + 1) % BREAKS.length) }}
          />
        </div>

        <aside className="glass up-next">
          <h2 className="panel-title">Up next tonight</h2>
          <div className="un-list">
            {UP_NEXT.map((u, k) => (
              <a key={u.href} href={u.href} className="un-row">
                <span className="un-thumb">
                  {'image' in u && u.image ? <><img className="blur" src={u.image} alt="" /><img className="sharp" src={u.image} alt="" /></> : <Icon name={(u as { icon: string }).icon} size={26} />}
                </span>
                <span className="un-text">
                  <b>{u.title}</b>
                  <span className="tags">{u.tags.map((t) => <span key={t} className="tag sm">{t}</span>)}</span>
                </span>
                <span className={`round-btn sm${k === 0 ? ' ring' : ''}`} aria-hidden="true"><Icon name="arrow" size={15} /></span>
              </a>
            ))}
          </div>
        </aside>
      </div>

      <section>
        <div className="row-head">
          <h2 className="panel-title">Randomizers</h2>
          <div className="pager">
            <button className="round-btn" aria-label="Scroll randomizers left" onClick={() => scrollRow(-1)}><Icon name="back" size={16} /></button>
            <button className="round-btn on" aria-label="Scroll randomizers right" onClick={() => scrollRow(1)}><Icon name="arrow" size={16} /></button>
          </div>
        </div>
        <div className="tool-row" ref={rowRef}>
          {TOOLS.map((t) => (
            <a key={t.title} href={t.href} className="tool">
              <Scene kind={t.scene} />
              <span className="tool-count"><Icon name="users" size={15} /> {t.count}</span>
              <span className="tool-body">
                <b>{t.title}</b>
                <span className="tags">{t.tags.map((x) => <span key={x} className="tag">{x}</span>)}</span>
              </span>
            </a>
          ))}
        </div>
      </section>

      <div className="dash-bottom">
        <section className="glass ledger-panel">
          <div className="row-head">
            <h2 className="panel-title">Proof ledger</h2>
            <a href="#/proofs" className="text-link">All proofs <Icon name="arrow" size={14} /></a>
          </div>
          {recent.length === 0 ? (
            <div className="empty">
              <Icon name="seal" size={34} />
              <b>Nothing sealed yet</b>
              <span>Each draw you run gets a public, verifiable record here.</span>
              <a href="#/break/394" className="btn btn-gold btn-sm">Run break #394</a>
            </div>
          ) : (
            <div className="ledger-list">
              {recent.map((d) => (
                <a key={d.id} href={`#/proof/${d.id}`} className="ledger-row">
                  <span className="cert mono">{d.id}</span>
                  <span className="lr-text"><b>{d.title}</b><span className="mono">{d.commitment.slice(0, 18)}…</span></span>
                  <span className={`status ${d.voided ? 'void' : d.revealed ? 'ok' : 'sealed'}`}>
                    <Icon name={d.voided ? 'x' : d.revealed ? 'seal' : 'lock'} size={15} weight="regular" />
                    {d.voided ? 'Voided' : d.revealed ? 'Verified' : 'Sealed'}
                  </span>
                </a>
              ))}
            </div>
          )}
        </section>

        <section className="glass preview">
          <div className="row-head">
            <h2 className="panel-title">On stream</h2>
            <button className="btn btn-outline btn-sm" onClick={openStreamWindow}><Icon name="popout" size={15} /> Pop out</button>
          </div>
          <Showcase />
        </section>
      </div>
    </div>
  );
}
