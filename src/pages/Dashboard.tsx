import { useEffect, useRef, useState } from 'react';
import { BREAKS, ORDERS_394, giveawayEntries, initialPytSlots, uniqueEntrants, kr } from '../lib/data.ts';
import { listDraws, openStreamWindow } from '../lib/store.ts';
import { MEDIA } from '../lib/media.ts';
import Showcase from '../components/Showcase.tsx';
import Icon from '../components/Icons.tsx';
import CountUp from '../components/CountUp.tsx';
import Crest from '../components/Crest.tsx';

const SOLD: Record<string, [number, number]> = { '394': [18, 18], '403': [33, 43] };
const HERO: Record<string, { img: string; word: string; photo: string; caption: string }> = {
  '394': { img: MEDIA.arena, word: 'Draw night', photo: MEDIA.heroKick, caption: 'Every team, one fair roll' },
  '403': { img: MEDIA.studio, word: 'Pick & win', photo: MEDIA.heroTrophy, caption: 'Your club, your spot' },
};

const ROOMS = [
  { href: '#/wheel', img: MEDIA.roomWheel, tone: 'gold', hot: true, badge: 'Giveaway', title: 'Wheel of fortune', meta: [['entries', String(giveawayEntries().length)], ['spins', '∞']], cta: 'Spin' },
  { href: '#/duck', img: MEDIA.roomDuck, tone: 'red', badge: 'Giveaway', title: 'Duck race', meta: [['ducks', String(uniqueEntrants().length)], ['length', '10 s']], cta: 'Race' },
  { href: '#/checklists', img: MEDIA.roomCards, tone: 'gold', badge: 'Library', title: 'Box checklists', meta: [['boxes', '2'], ['teams', '61']], cta: 'Open' },
  { href: '#/proofs', img: MEDIA.roomLock, tone: 'red', badge: 'Public', title: 'Fairness proofs', meta: [['hash', 'SHA-256'], ['open', 'yes']], cta: 'Verify' },
] as const;

const FEATURE = [
  { href: '#/break/394', tone: 'gold', img: MEDIA.featDice, title: 'Team draw', text: 'Break #394 · Topps Bundesliga Gold. Every team assigned by a sealed roll.' },
  { href: '#/break/403', tone: 'red', img: MEDIA.heroBall, title: 'Pick your team', text: 'Break #403 · Futera World. 10 teams still open, fillers from 49 kr.' },
];

const TONIGHT = [
  { href: '#/break/394', title: 'Break #394 · Topps Bundesliga', image: MEDIA.arena, left: 'Random team', right: '18/18 sold', progress: 1 },
  { href: '#/break/403', title: 'Break #403 · Futera World', image: MEDIA.studio, left: 'Pick your team', right: '33/43 sold', progress: 33 / 43 },
  { href: '#/wheel', title: 'Wheel of fortune', image: MEDIA.party, left: 'Giveaway', right: `${giveawayEntries().length} entries`, progress: 0 },
  { href: '#/duck', title: 'Duck race', image: MEDIA.ducks, left: 'Giveaway', right: `${uniqueEntrants().length} ducks`, progress: 0 },
];

/** Live feed: recent purchases, newest first, with relative times. */
const FEED = [
  ...ORDERS_394.slice(-7).reverse().map((o, k) => ({ who: o.buyer, what: `bought ${o.qty} spot${o.qty > 1 ? 's' : ''}`, where: 'Break #394', mins: 2 + k * 3 })),
  ...initialPytSlots().filter((s) => s.owner).slice(0, 4).map((s, k) => ({ who: s.owner!, what: `took ${s.team}`, where: 'Break #403', mins: 24 + k * 5 })),
];
const SLIDE_MS = 6000;
const repeat = (() => { const m = new Map<string, number>(); ORDERS_394.forEach((o) => m.set(o.buyer, (m.get(o.buyer) ?? 0) + 1)); return [...m.values()].filter((n) => n > 1).length; })();
const totalSpots = Object.values(SOLD).reduce((a, [, of]) => a + of, 0);

/** Split-flap number: each digit on its own tile, flipping in one after another. */
function Flap({ value, pad = 1, suffix }: { value: number; pad?: number; suffix?: string }) {
  const digits = String(value).padStart(pad, '0').split('');
  return (
    <span className="flap" aria-label={`${value}${suffix ?? ''}`}>
      {digits.map((d, k) => <span key={k} className="flap-d" style={{ animationDelay: `${300 + k * 90}ms` }}>{d}</span>)}
      {suffix && <span className="flap-sfx">{suffix}</span>}
    </span>
  );
}

export default function Dashboard() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const autoplay = !paused && !reduced;
  useEffect(() => {
    if (!autoplay) return;
    const t = window.setTimeout(() => setI((x) => (x + 1) % BREAKS.length), SLIDE_MS);
    return () => clearTimeout(t);
  }, [i, autoplay]);

  const draws = listDraws();
  const b = BREAKS[i];
  const [sold, of] = SOLD[b.id] ?? [0, b.spots];
  const ready = sold === of;
  const h = HERO[b.id];
  const buyers = new Set([...ORDERS_394.map((o) => o.buyer), ...initialPytSlots().filter((s) => s.owner).map((s) => s.owner!)]).size;
  const spots = Object.values(SOLD).reduce((a, [s]) => a + s, 0);
  const boxValue = BREAKS.reduce((a, x) => a + x.boxPrice, 0);
  const scroll = (d: 1 | -1) => rowRef.current?.scrollBy({ left: d * 300, behavior: 'smooth' });

  return (
    <div className="neo-dash">
      <div className="neo-main">
        <section
          key={b.id}
          className="neo-hero reveal-up"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          <img className="neo-hero-img" src={h.photo} alt="" />
          <div className="neo-hero-tint" aria-hidden="true" />
          <div className="neo-hero-body">
            <div className="neo-pills">
              <span className="neo-pill live"><i className="live-dot sm" /> {ready ? 'Sold out tonight' : 'Fillers open'}</span>
              <span className="neo-pill">{b.format === 'random' ? 'Random team' : 'Pick your team'}</span>
              <span className="neo-pill">{b.startsAt}</span>
            </div>
            <h1 className="neo-title">
              <span className="neo-grad">{h.word}</span>
              <span>{b.title}</span>
            </h1>
            <p className="neo-lede">
              {b.format === 'random'
                ? 'Import the buyers, seal the draw and roll live on stream. Every shuffle is verifiable afterwards.'
                : `${of - sold} teams still open. A sealed filler draw lets 49 kr entries win the rest.`}
            </p>
            <div className="neo-actions">
              <a href={`#/break/${b.id}`} className="btn-neon"><Icon name="play" size={16} weight="fill" /> {ready ? 'Run the draw' : 'Open team board'}</a>
              <button className="btn-glass" onClick={openStreamWindow}><Icon name="live" size={17} /> Stream view</button>
            </div>
            <div className="neo-dots" role="tablist" aria-label="Featured break">
              {BREAKS.map((x, k) => (
                <button key={x.id} role="tab" aria-selected={k === i} aria-label={`Break #${x.number}`} className={k === i ? 'on' : ''} onClick={() => setI(k)}>
                  {k === i && autoplay && <i style={{ animationDuration: `${SLIDE_MS}ms` }} />}
                </button>
              ))}
            </div>
          </div>
          
        </section>

        <section className="feat-grid" aria-label="Tonight's breaks">
          {FEATURE.map((f) => (
            <a key={f.href} href={f.href} className={`feat t-${f.tone}`}>
              <span className="feat-txt"><b>{f.title}</b><span>{f.text}</span></span>
              <img src={f.img} alt="" loading="lazy" />
            </a>
          ))}
        </section>

        <a href="#/proofs" className="slim-row">
          <span className="slim-ic"><Icon name="shield" size={18} weight="fill" /></span>
          <b>Fairness proofs</b>
          <span className="slim-txt">Every draw is sealed with a SHA-256 fingerprint before the roll. Anyone can verify it afterwards.</span>
          <Icon name="arrow" size={16} />
        </a>

        <section className="scoreboard reveal-up" aria-label="Tonight in numbers">
          <div className="sb-tag">
            <span className="sb-live"><i className="live-dot sm" /> Live</span>
            <b>Tonight</b>
            <span className="sb-sub">Breaks from 20:00</span>
          </div>
          <div className="sb-cell">
            <span className="sb-label">Buyers</span>
            <Flap value={buyers} />
            <span className="sb-ctx"><em>{repeat}</em> came back for more</span>
          </div>
          <div className="sb-cell">
            <span className="sb-label">Spots sold</span>
            <Flap value={spots} suffix={`/${totalSpots}`} />
            <span className="sb-meter" aria-hidden="true">{Array.from({ length: 20 }, (_, k) => <i key={k} className={k < Math.round((spots / totalSpots) * 20) ? 'on' : ''} />)}</span>
          </div>
          <div className="sb-cell">
            <span className="sb-label">Draws sealed</span>
            <Flap value={draws.length} pad={2} />
            <span className="sb-ctx">{draws.length ? <><em>{draws.filter((d) => d.revealed).length}</em> already verified</> : <>Next: <em>#394</em> at 20:00</>}</span>
          </div>
          <div className="sb-cell">
            <span className="sb-label">On the table</span>
            <Flap value={boxValue} suffix=" kr" />
            <span className="sb-ctx"><em>{BREAKS.length}</em> boxes to open</span>
          </div>
        </section>

        <section className="neo-rooms">
          <div className="neo-rooms-head">
            <div>
              <span className="neo-kicker">Giveaways and tools</span>
              <h2 className="neo-h2">Game <span className="neo-grad">rooms</span></h2>
            </div>
            <div className="pager">
              <button className="round-nav" aria-label="Scroll rooms left" onClick={() => scroll(-1)}><Icon name="back" size={16} /></button>
              <button className="round-nav" aria-label="Scroll rooms right" onClick={() => scroll(1)}><Icon name="arrow" size={16} /></button>
            </div>
          </div>
          <div className="room-row" ref={rowRef}>
            {ROOMS.map((r, k) => (
              <a key={r.title} href={r.href} className={`room t-${r.tone} reveal-up`} style={{ animationDelay: `${120 + k * 60}ms` }}>
                <span className="room-badge">{r.badge}</span>
                {'hot' in r && r.hot && <span className="room-hot"><Icon name="fire" size={12} weight="fill" /> Hot</span>}
                <span className="room-art"><img src={r.img} alt="" loading="lazy" /></span>
                <b className="room-title">{r.title}</b>
                <span className="room-meta">
                  {r.meta.map(([k2, v]) => <span key={k2}><em>{k2}</em>{v}</span>)}
                </span>
                <span className="room-cta">{r.cta}</span>
              </a>
            ))}
          </div>
        </section>

        <section>
          <div className="neo-rooms-head">
            <div>
              <span className="neo-kicker">Tonight</span>
              <h2 className="neo-h2">On the <span className="neo-grad">schedule</span></h2>
            </div>
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

        <section className="panel neo-preview">
          <div className="row-head">
            <h2>Stream preview</h2>
            <button className="see-all" onClick={openStreamWindow}>Pop out</button>
          </div>
          <div className="preview"><Showcase /></div>
        </section>
      </div>

      <aside className="neo-live" aria-label="Live activity">
        <div className="live-head">
          <span className="row"><span className="live-ic"><Icon name="live" size={16} /></span><b>Live activity</b></span>
          <span className="live-online"><i className="live-dot sm" /> <CountUp value={buyers * 7 + 3} /> watching</span>
        </div>

        <a href="#/wheel" className="promo-card">
          <span className="promo-art"><img src={MEDIA.promo} alt="" /></span>
          <span className="promo-txt">
            <b>Rain of prizes</b>
            <span>Every purchase tonight is a ticket in the giveaway wheel.</span>
          </span>
        </a>

        <div className="feed-list">
          {draws.slice(0, 3).map((d) => (
            <a key={d.id} href={`#/proof/${d.id}`} className="feed-item proof">
              <span className="fi-av" style={{ background: 'linear-gradient(135deg,#ff2e3b,#c8102e)' }}><Icon name="seal" size={15} weight="fill" /></span>
              <span className="fi-txt"><b>{d.title}</b><span>{d.revealed ? 'Verified' : 'Sealed'} · {d.id}</span></span>
            </a>
          ))}
          {FEED.map((f, k) => (
            <div key={k} className="feed-item" style={{ animationDelay: `${200 + k * 60}ms` }}>
              <span className="fi-av crest-av"><Crest name={f.who} /></span>
              <span className="fi-txt"><b>{f.who}</b><span>{f.what} · {f.where}</span></span>
              <span className="fi-time">{f.mins}m</span>
            </div>
          ))}
        </div>

        <div className="live-foot">
          <span>Prize pool tonight</span>
          <b className="neo-grad"><CountUp value={boxValue} format={(n) => kr(n)} /></b>
        </div>
      </aside>
    </div>
  );
}
