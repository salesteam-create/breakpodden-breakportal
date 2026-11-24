import { useEffect, useState } from 'react';
import { BREAKS, ORDERS_394, initialPytSlots, kr } from '../lib/data.ts';
import { listDraws, openStreamWindow } from '../lib/store.ts';
import Showcase from '../components/Showcase.tsx';
import Hero, { AvatarStack, type Tone } from '../components/Hero.tsx';
import Icon from '../components/Icons.tsx';

const SOLD: Record<string, [number, number]> = { '394': [18, 18], '403': [33, 43] };
const BUYERS: Record<string, string[]> = {
  '394': ORDERS_394.map((o) => o.buyer),
  '403': initialPytSlots().filter((s) => s.owner).map((s) => s.owner!),
};

const TOOLS: { href: string; title: string; text: string; icon: string; tone: Tone; tag: string; cta: string }[] = [
  { href: '#/break/394', title: 'Team draw', text: 'Dice, visible shuffle rounds and a card-by-card reveal.', icon: 'dice', tone: 'gold', tag: 'Break #394', cta: 'Run draw' },
  { href: '#/break/403', title: 'Filler draw', text: 'Cheap entries compete for the teams that did not sell.', icon: 'ticket', tone: 'violet', tag: 'Break #403', cta: 'Open board' },
  { href: '#/wheel', title: 'Wheel of fortune', text: 'One segment per purchase. More spots, bigger share.', icon: 'wheel', tone: 'rose', tag: 'Giveaway', cta: 'Spin' },
  { href: '#/duck', title: 'Duck race', text: 'Up to 50 ducks. The finishing order is sealed first.', icon: 'duck', tone: 'aqua', tag: 'Giveaway', cta: 'Race' },
];

const SLIDE_MS = 7000;

function FeaturedBreaks() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const t = window.setTimeout(() => setI((x) => (x + 1) % BREAKS.length), SLIDE_MS);
    return () => clearTimeout(t);
  }, [i, paused]);
  const b = BREAKS[i];
  const [sold, of] = SOLD[b.id] ?? [0, b.spots];
  const ready = sold === of;

  return (
    <div className="featured" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div key={b.id} className="slide-in">
        <Hero
          tone={b.format === 'random' ? 'gold' : 'violet'}
          image={b.image}
          chips={
            <>
              <span className="chip chip-glass"><Icon name="clock" size={13} /> {b.startsAt}</span>
              <span className="chip chip-glass">{b.format === 'random' ? 'Random team' : 'Pick your team'}</span>
              <span className={`chip ${ready ? 'chip-good' : 'chip-gold'}`}>{ready ? 'Ready to draw' : 'Fillers open'}</span>
            </>
          }
          title={<>Break #{b.number}<br /><span className="grad-text">{b.title}</span></>}
          lede={b.format === 'random'
            ? 'Sold out. Import the buyers, seal the draw and roll live. Every step is verifiable after the reveal.'
            : `${of - sold} teams are still open. Run a sealed filler draw so cheap entries can win the rest.`}
          stats={[
            { icon: 'box', label: 'Box', value: kr(b.boxPrice) },
            { icon: 'users', label: 'Sold', value: `${sold}/${of}` },
            { icon: 'cart', label: b.format === 'random' ? 'Spot price' : 'Teams', value: b.format === 'random' ? kr(b.slotPrice!) : b.spots },
          ]}
          actions={
            <>
              <a href={`#/break/${b.id}`} className="btn btn-primary btn-lg">{ready ? 'Run the draw' : 'Open team board'} <Icon name="arrow" size={18} /></a>
              <button className="btn btn-glass btn-lg" onClick={openStreamWindow}><Icon name="popout" size={18} /> Pop out stream</button>
            </>
          }
          aside={<AvatarStack names={BUYERS[b.id] ?? []} label="buyers in" />}
        />
      </div>
      <div className="featured-nav">
        <button className="icon-btn glass" aria-label="Previous break" onClick={() => setI((i - 1 + BREAKS.length) % BREAKS.length)}><Icon name="back" size={16} /></button>
        <div className="dots" role="tablist" aria-label="Featured breaks">
          {BREAKS.map((x, k) => (
            <button key={x.id} role="tab" aria-selected={k === i} aria-label={`Break #${x.number}`} className={k === i ? 'on' : ''} onClick={() => setI(k)}>
              {k === i && !paused && <i style={{ animationDuration: `${SLIDE_MS}ms` }} />}
            </button>
          ))}
        </div>
        <button className="icon-btn glass" aria-label="Next break" onClick={() => setI((i + 1) % BREAKS.length)}><Icon name="arrow" size={16} /></button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const draws = listDraws();
  const recent = draws.slice(0, 6);
  const sealed = draws.filter((d) => !d.revealed).length;
  const verified = draws.filter((d) => d.revealed && !d.voided).length;
  const spots = Object.values(SOLD).reduce((a, [s]) => a + s, 0);

  return (
    <div className="dash">
      <div className="dash-top">
        <FeaturedBreaks />

        <aside className="rail card">
          <div className="rail-head">
            <h3>Tonight</h3>
            <span className="chip chip-live"><span className="live-dot sm" /> 2 breaks</span>
          </div>
          <div className="kpis">
            <div className="kpi"><span className="kpi-ic gold"><Icon name="box" size={16} /></span><b>{BREAKS.length}</b><span>Breaks ready</span></div>
            <div className="kpi"><span className="kpi-ic violet"><Icon name="users" size={16} /></span><b>{spots}</b><span>Spots to draw</span></div>
            <div className="kpi"><span className="kpi-ic rose"><Icon name="lock" size={16} /></span><b>{sealed}</b><span>Sealed now</span></div>
            <div className="kpi"><span className="kpi-ic aqua"><Icon name="shield" size={16} /></span><b>{verified}</b><span>Verified</span></div>
          </div>
          <div className="rail-head sub">
            <h4>Proof feed</h4>
            <a href="#/proofs" className="link">View all</a>
          </div>
          {recent.length === 0 ? (
            <div className="rail-empty">
              <span className="empty-ic"><Icon name="shield" size={22} /></span>
              <b>No proofs yet</b>
              <span>Run a draw and its public proof shows up here.</span>
            </div>
          ) : (
            <div className="feed">
              {recent.map((d) => (
                <a key={d.id} href={`#/proof/${d.id}`} className="feed-row">
                  <span className={`feed-ic ${d.voided ? 'void' : d.revealed ? 'ok' : 'sealed'}`}><Icon name={d.voided ? 'x' : d.revealed ? 'check' : 'lock'} size={14} /></span>
                  <span className="feed-text">
                    <b>{d.title}</b>
                    <span className="mono">{d.id} · {d.commitment.slice(0, 10)}…</span>
                  </span>
                  <span className={`state ${d.voided ? 'void' : d.revealed ? 'ok' : 'sealed'}`}>{d.voided ? 'Voided' : d.revealed ? 'Verified' : 'Sealed'}</span>
                </a>
              ))}
            </div>
          )}
        </aside>
      </div>

      <section>
        <div className="section-head">
          <div>
            <h2>Randomizers</h2>
            <p className="muted">Every draw is sealed before the roll and can be checked by anyone afterwards.</p>
          </div>
        </div>
        <div className="tools">
          {TOOLS.map((t) => (
            <a key={t.title} href={t.href} className={`tool tone-${t.tone}`}>
              <span className="tool-art" aria-hidden="true">
                <i className="ring r1" /><i className="ring r2" />
                <Icon name={t.icon} size={54} strokeWidth={1.2} />
                <span className="chip chip-glass tool-tag">{t.tag}</span>
              </span>
              <span className="tool-body">
                <b>{t.title}</b>
                <span>{t.text}</span>
              </span>
              <span className="tool-foot">
                <span className="pill-gold"><Icon name="shield" size={13} /> Provably fair</span>
                <span className="tool-cta" title={t.cta}><Icon name="arrow" size={16} /></span>
              </span>
            </a>
          ))}
        </div>
      </section>

      <div className="dash-bottom">
        <section className="card">
          <div className="card-head">
            <div>
              <h3>Break queue</h3>
              <span className="muted sm">Synced from Shopify</span>
            </div>
            <span className="chip chip-good"><span className="dot" /> Live sync</span>
          </div>
          <div className="queue">
            {BREAKS.map((b) => {
              const [sold, of] = SOLD[b.id] ?? [0, b.spots];
              const ready = sold === of;
              return (
                <a key={b.id} href={`#/break/${b.id}`} className="queue-row">
                  <span className="q-thumb"><img src={b.image} alt="" /></span>
                  <span className="q-title">
                    <span className="overline">#{b.number} · {b.format === 'random' ? 'Random team' : 'Pick your team'}</span>
                    <b>{b.title}</b>
                    <span className="muted">{b.format === 'random' ? `${b.spots} spots · ${kr(b.slotPrice!)}` : `${b.spots} teams and splits`} · box {kr(b.boxPrice)}</span>
                  </span>
                  <span className="q-progress">
                    <span className="spread"><span className="muted">{b.startsAt}</span><b>{sold}/{of}</b></span>
                    <span className="progress"><span style={{ width: `${(sold / of) * 100}%` }} /></span>
                  </span>
                  <span className={`btn btn-sm ${ready ? 'btn-primary' : 'btn-soft'}`}>{ready ? 'Run draw' : 'Open board'}</span>
                </a>
              );
            })}
          </div>
        </section>

        <section className="preview card">
          <div className="card-head">
            <span className="row"><span className="live-dot" /> <h3>Stream preview</h3></span>
            <button className="btn btn-sm btn-glass" onClick={openStreamWindow}><Icon name="popout" size={15} /> Open</button>
          </div>
          <Showcase />
        </section>
      </div>
    </div>
  );
}
