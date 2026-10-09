import { useEffect, useState } from 'react';
import { BREAKS, kr } from '../lib/data.ts';
import { listDraws } from '../lib/store.ts';
import cardGoldAuto from '../assets/card-gold-auto.webp';
import cardDowman from '../assets/card-dowman.webp';
import boxChrome from '../assets/box-chrome.webp';
import boxFutera from '../assets/box-futera.webp';
import { DuckIcon } from '../components/DuckRace.tsx';

const TOOLS = [
  { href: '#/break/394', n: '01', title: 'Team randomizer', text: 'Dice roll, visible shuffle rounds and a card reveal. Replaces Excel and random.org.', cta: 'Run break #394', art: cardGoldAuto },
  { href: '#/break/403', n: '02', title: 'Filler draw', text: 'Sell the unsold top teams as cheap entries. The top N after the shuffle win.', cta: 'Open break #403', art: boxFutera },
  { href: '#/wheel', n: '03', title: 'Wheel of fortune', text: 'One segment per purchase. More spots bought, more chances to win.', cta: 'Spin the wheel', art: cardDowman },
  { href: '#/duck', n: '04', title: 'Duck race', text: 'Up to 50 ducks, a set race length, one sealed winner.', cta: 'Start a race' },
];

const STRIP = ['Live breaks', 'Provably fair', 'Big hits', 'Sealed draws', 'Rare cards', 'Card hotel'];

/** Time left until tonight's first break at 20:00 (or tomorrow's, once it has passed). */
function useCountdown() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const target = new Date(now);
  target.setHours(20, 0, 0, 0);
  if (target.getTime() <= now) target.setDate(target.getDate() + 1);
  const s = Math.floor((target.getTime() - now) / 1000);
  return [Math.floor(s / 86400), Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60].map((n) => String(n).padStart(2, '0'));
}

export default function Dashboard() {
  const draws = listDraws().slice(0, 5);
  const [dd, hh, mm, ss] = useCountdown();

  return (
    <>
      <section className="hero bleed theme-dark">
        <div className="hero-copy">
          <span className="eyebrow">Breakpodden · Break portal</span>
          <h1>Every draw. One portal. Provably fair.</h1>
          <p>Import buyers from Shopify, load the box checklist, roll and shuffle on stream, and give every viewer a proof they can check themselves.</p>
          <div className="hero-actions">
            <a className="btn btn-gold" href="#/break/394">Run the next break</a>
            <a className="btn" href="#/proofs">Fairness proofs</a>
          </div>
          <div className="hero-stats">
            <div className="stat"><b>2</b><span>Breaks tonight</span></div>
            <div className="stat"><b>61</b><span>Spots to draw</span></div>
            <div className="stat"><b>{listDraws().length}</b><span>Draws with proof</span></div>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <img className="fan fan-1" src={cardDowman} alt="" />
          <img className="fan fan-2" src={cardGoldAuto} alt="" />
          <img className="fan fan-3" src={boxChrome} alt="" />
          <div className="countdown">
            <div className="countdown-head">
              <span className="t">Neste break</span>
              <span className="s">Tonight · 20:00</span>
            </div>
            <div className="clock">
              {[
                [dd, 'Days'], [hh, 'Hours'], [mm, 'Minutes'], [ss, 'Seconds'],
              ].map(([v, l], i) => (
                <div key={l} className="row" style={{ gap: 6 }}>
                  {i > 0 && <span className="sep"><i /><i /></span>}
                  <div className="unit"><b>{v}</b><span>{l}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Tonight's breaks</h2>
          <span className="btn btn-black btn-sm" style={{ cursor: 'default' }}><span className="dot" /> Synced from Shopify</span>
        </div>
        <div className="product-grid">
          {BREAKS.map((b) => (
            <a key={b.id} href={`#/break/${b.id}`} className="product">
              <div className="product-img">
                <img src={b.image} alt="" />
                {b.format === 'random' && <span className="ribbon">Sold out</span>}
              </div>
              <div className="product-meta">
                <span className="overline">Break #{b.number} · {b.format === 'random' ? 'Random team' : 'Pick your team'}</span>
                <span className="title">{b.title}</span>
                <span className="price">
                  {b.format === 'random' ? `${b.spots} spots · ${kr(b.slotPrice!)}` : `${b.spots} teams and splits · from 39 kr`}
                </span>
                <span className="status">
                  <span className="dot" style={{ background: b.format === 'random' ? 'var(--good)' : 'var(--warn)' }} />
                  {b.status} · {b.startsAt}
                </span>
              </div>
            </a>
          ))}
          <a href="#/break/394" className="feature-tile theme-dark">
            <img src={boxChrome} alt="" />
            <div className="stack" style={{ gap: 20 }}>
              <span className="eyebrow">Live break</span>
              <h2>The box is sealed. The spots are open.</h2>
            </div>
            <div className="next">
              <span className="label-gold">Neste break</span>
              <b>Break #394</b>
              <span>2025-26 Topps Bundesliga Gold · Tonight 20:00</span>
            </div>
            <span className="btn btn-gold" style={{ alignSelf: 'flex-start' }}>Start the draw</span>
          </a>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div className="stack" style={{ gap: 10 }}>
            <span className="eyebrow">How it works</span>
            <h2>Every randomizer, one place</h2>
          </div>
        </div>
        <div className="tool-grid">
          {TOOLS.map((t) => (
            <a key={t.title} href={t.href} className="tool-tile theme-dark">
              {t.art ? <img className="tool-art" src={t.art} alt="" /> : <span className="tool-glyph" aria-hidden="true"><DuckIcon size={150} gold /></span>}
              <div>
                <span className="eyebrow">{t.n}</span>
                <h2 style={{ marginTop: 18 }}>{t.title}</h2>
                <p>{t.text}</p>
              </div>
              <span className="btn btn-gold">{t.cta}</span>
            </a>
          ))}
        </div>
      </section>

      <div className="strip bleed" aria-hidden="true">
        <div className="strip-track">
          {[0, 1].flatMap((k) => STRIP.map((w, i) => (
            <span key={`${k}-${w}`} className="row" style={{ gap: 28 }}>
              <span className={i % 2 ? 'outline' : ''}>{w}</span>
              <i className="star gold" />
            </span>
          )))}
        </div>
      </div>

      <section>
        <div className="section-head">
          <h2>Recent proofs</h2>
          <a href="#/proofs" className="btn btn-black btn-sm">All proofs</a>
        </div>
        <div className="card">
          {draws.length === 0 ? (
            <div className="empty">No draws yet. Start with break #394 to see the full flow.</div>
          ) : (
            <table className="plain">
              <tbody>
                {draws.map((d) => (
                  <tr key={d.id}>
                    <td><b>{d.title}</b></td>
                    <td className="mono dim">{d.commitment.slice(0, 16)}…</td>
                    <td>{d.voided ? <span className="chip chip-void">Voided</span> : d.revealed ? <span className="chip chip-good">Verifiable</span> : <span className="chip chip-gold">Sealed</span>}</td>
                    <td style={{ textAlign: 'right' }}><a className="btn btn-sm" href={`#/proof/${d.id}`}>Proof</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </>
  );
}
