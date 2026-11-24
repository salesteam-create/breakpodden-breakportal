import { useEffect, useState } from 'react';
import { BREAKS, ORDERS_394, giveawayEntries, initialPytSlots, uniqueEntrants, kr } from '../lib/data.ts';
import { listDraws, openStreamWindow } from '../lib/store.ts';
import { MEDIA } from '../lib/media.ts';
import Showcase from '../components/Showcase.tsx';
import Hero, { AvatarStack } from '../components/Hero.tsx';
import Icon from '../components/Icons.tsx';

const SOLD: Record<string, [number, number]> = { '394': [18, 18], '403': [33, 43] };
const BUYERS: Record<string, string[]> = {
  '394': ORDERS_394.map((o) => o.buyer),
  '403': initialPytSlots().filter((s) => s.owner).map((s) => s.owner!),
};
const HERO_IMG: Record<string, { src: string; focus?: string }> = {
  '394': { src: MEDIA.cards },
  '403': { src: MEDIA.pitch },
};

/** "Continue watching" style row: tonight's runs with a progress bar. */
const TONIGHT = [
  { href: '#/break/394', title: 'Break #394 · Topps Bundesliga', image: MEDIA.cards, left: 'Random team', right: '18/18 sold', progress: 1 },
  { href: '#/break/403', title: 'Break #403 · Futera World', image: MEDIA.pitch, left: 'Pick your team', right: '33/43 sold', progress: 33 / 43 },
  { href: '#/wheel', title: 'Wheel of fortune', image: MEDIA.confetti, left: 'Giveaway', right: `${giveawayEntries().length} entries`, progress: 0 },
  { href: '#/duck', title: 'Duck race', image: MEDIA.ducks, left: 'Giveaway', right: `${uniqueEntrants().length} ducks`, progress: 0 },
];

/** "You might like" style row: poster cards for the tools. */
const QUICK = [
  { href: '#/break/394', title: 'Team draw', tags: ['Dice', 'Shuffle'], image: MEDIA.dice },
  { href: '#/checklists', title: 'Box checklists', tags: ['Library'], image: MEDIA.cardwall },
  { href: '#/proofs', title: 'Fairness proofs', tags: ['Public', 'SHA-256'], image: MEDIA.abstract },
  { href: '#/stream', title: 'Stream view', tags: ['OBS', '1080p'], image: MEDIA.stream, stream: true },
];

const SLIDE_MS = 6000;

export default function Dashboard() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const autoplay = !paused && !reduced;

  // Featured breaks loop on their own; hovering or focusing the hero pauses it.
  useEffect(() => {
    if (!autoplay) return;
    const t = window.setTimeout(() => setI((x) => (x + 1) % BREAKS.length), SLIDE_MS);
    return () => clearTimeout(t);
  }, [i, autoplay]);
  const draws = listDraws();
  const recent = draws.slice(0, 5);

  const b = BREAKS[i];
  const [sold, of] = SOLD[b.id] ?? [0, b.spots];
  const ready = sold === of;

  return (
    <div className="dash">
      <div
        key={b.id}
        className="fade-swap"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <Hero
          image={HERO_IMG[b.id].src}
          focus={HERO_IMG[b.id].focus}
          badge={{ icon: ready ? 'fire' : 'bolt', label: ready ? 'Sold out tonight' : 'Fillers open' }}
          chips={<><span className="tag">{b.format === 'random' ? 'Random team' : 'Pick your team'}</span><span className="tag">{b.startsAt}</span></>}
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
              <a href={`#/break/${b.id}`} className="btn btn-primary"><Icon name="play" size={16} weight="fill" /> {ready ? 'Run the draw' : 'Open team board'}</a>
              <button className="icon-btn glass" aria-label="Open stream view" title="Stream view" onClick={openStreamWindow}><Icon name="popout" size={18} /></button>
              <a className="icon-btn glass" aria-label="Fairness proofs" title="Fairness proofs" href="#/proofs"><Icon name="shield" size={18} /></a>
            </>
          }
          aside={<AvatarStack names={BUYERS[b.id] ?? []} label="buyers" />}
          dots={{ index: i, total: BREAKS.length, label: 'Featured break', onPick: setI, duration: autoplay ? SLIDE_MS : undefined }}
        />
      </div>

      <section>
        <div className="row-head">
          <h2>Tonight</h2>
          <a href="#/proofs" className="see-all">See all</a>
        </div>
        <div className="scroller">
          {TONIGHT.map((t) => (
            <a key={t.href} href={t.href} className="wide-card">
              <img src={t.image} alt="" loading="lazy" />
              <span className="wc-shade" />
              <span className="wc-body">
                <b>{t.title}</b>
                <span className="wc-meta"><span>{t.left}</span><span>{t.right}</span></span>
                <span className="wc-bar"><i style={{ width: `${Math.max(t.progress, 0) * 100}%` }} /></span>
              </span>
            </a>
          ))}
        </div>
      </section>

      <section>
        <div className="row-head">
          <h2>Quick access</h2>
        </div>
        <div className="posters">
          {QUICK.map((q) => (
            <a
              key={q.title}
              href={q.href}
              className="poster"
              onClick={q.stream ? (e) => { e.preventDefault(); openStreamWindow(); } : undefined}
            >
              <img src={q.image} alt="" loading="lazy" />
              <span className="pc-shade" />
              <span className="pc-body">
                <b>{q.title}</b>
                <span className="tags">{q.tags.map((x) => <span key={x} className="tag sm">{x}</span>)}</span>
              </span>
            </a>
          ))}
        </div>
      </section>

      <div className="dash-bottom">
        <section className="panel">
          <div className="row-head">
            <h2>Proof ledger</h2>
            <a href="#/proofs" className="see-all">See all</a>
          </div>
          {recent.length === 0 ? (
            <div className="empty">
              <span className="empty-ic"><Icon name="seal" size={24} /></span>
              <b>Nothing sealed yet</b>
              <span>Each draw you run gets a public, verifiable record here.</span>
              <a href="#/break/394" className="btn btn-primary btn-sm">Run break #394</a>
            </div>
          ) : (
            <div className="ledger-list">
              {recent.map((d) => (
                <a key={d.id} href={`#/proof/${d.id}`} className="ledger-row">
                  <span className={`lr-ic ${d.voided ? 'void' : d.revealed ? 'ok' : 'sealed'}`}><Icon name={d.voided ? 'x' : d.revealed ? 'seal' : 'lock'} size={17} /></span>
                  <span className="lr-text"><b>{d.title}</b><span className="mono">{d.id} · {d.commitment.slice(0, 14)}…</span></span>
                  <span className={`status ${d.voided ? 'void' : d.revealed ? 'ok' : 'sealed'}`}>{d.voided ? 'Voided' : d.revealed ? 'Verified' : 'Sealed'}</span>
                </a>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="row-head">
            <h2>Stream preview</h2>
            <button className="see-all" onClick={openStreamWindow}>Pop out</button>
          </div>
          <div className="preview"><Showcase /></div>
        </section>
      </div>
    </div>
  );
}
