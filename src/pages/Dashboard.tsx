import { BREAKS, kr } from '../lib/data.ts';
import { listDraws } from '../lib/store.ts';

const TOOLS = [
  { href: '#/break/394', icon: '🎲', title: 'Team randomizer', text: 'Dice roll, visible shuffle rounds and a card reveal. Replaces Excel and random.org.' },
  { href: '#/break/403', icon: '🎟️', title: 'Filler draw', text: 'Sell the unsold top teams as cheap entries. The top N after the shuffle win.' },
  { href: '#/wheel', icon: '🎡', title: 'Wheel of fortune', text: 'One segment per purchase. More spots bought, more chances to win.' },
  { href: '#/duck', icon: '🦆', title: 'Duck race', text: 'Up to 50 ducks, a set race length, one sealed winner.' },
];

export default function Dashboard() {
  const draws = listDraws().slice(0, 5);
  return (
    <>
      <section className="hero">
        <div className="eyebrow">Breakpodden · Break Portal</div>
        <h1 style={{ marginTop: 12 }}>Every draw. One portal. Provably fair.</h1>
        <p>
          Import buyers from Shopify, load the box checklist, roll and shuffle on stream, and give every viewer a proof
          they can check themselves.
        </p>
        <div className="hero-stats">
          <div className="stat"><b>2</b><span>Breaks tonight</span></div>
          <div className="stat"><b>61</b><span>Spots to draw</span></div>
          <div className="stat"><b>{listDraws().length}</b><span>Draws with proof</span></div>
        </div>
      </section>

      <div className="spread" style={{ marginBottom: 14 }}>
        <h2>Tonight's breaks</h2>
        <span className="pill"><span className="dot" /> Synced from Shopify</span>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(420px, 100%), 1fr))', marginBottom: 36 }}>
        {BREAKS.map((b) => (
          <a key={b.id} href={`#/break/${b.id}`} className="card break-card">
            <div className="img"><img src={b.image} alt="" /></div>
            <div className="body">
              <div className="row" style={{ gap: 8 }}>
                <span className="chip chip-gold">Break #{b.number}</span>
                <span className="chip">{b.format === 'random' ? 'Random team' : 'Pick your team'}</span>
              </div>
              <h3 style={{ fontSize: 22 }}>{b.title}</h3>
              <div className="muted" style={{ fontSize: 13.5 }}>
                {b.format === 'random' ? `${b.spots} spots at ${kr(b.slotPrice!)}` : `${b.spots} teams and player splits`} · Box {kr(b.boxPrice)}
              </div>
              <div className="spread" style={{ marginTop: 'auto' }}>
                <span style={{ fontSize: 13.5 }}><span className="dot" style={{ display: 'inline-block', marginRight: 8, background: b.format === 'random' ? 'var(--good)' : 'var(--warn)' }} />{b.status}</span>
                <span className="muted" style={{ fontSize: 13 }}>{b.startsAt}</span>
              </div>
            </div>
          </a>
        ))}
      </div>

      <h2 style={{ marginBottom: 14 }}>Randomizers</h2>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginBottom: 36 }}>
        {TOOLS.map((t) => (
          <a key={t.title} href={t.href} className="card tool-card">
            <span className="tool-icon">{t.icon}</span>
            <h3>{t.title}</h3>
            <span className="muted" style={{ fontSize: 13.5 }}>{t.text}</span>
          </a>
        ))}
      </div>

      <div className="spread" style={{ marginBottom: 14 }}>
        <h2>Recent proofs</h2>
        <a href="#/proofs" className="muted" style={{ fontSize: 13.5 }}>All proofs →</a>
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

      <p className="footer-note">Prototype for Breakpodden · sample buyers are invented · Shopify connection simulated</p>
    </>
  );
}
