import { BREAKS, kr } from '../lib/data.ts';
import { listDraws, openStreamWindow } from '../lib/store.ts';
import { WORKSPACE } from '../lib/workspace.ts';
import Showcase from '../components/Showcase.tsx';
import PageHeader from '../components/PageHeader.tsx';
import Icon, { type IconName } from '../components/Icon.tsx';

const SOLD: Record<string, [number, number]> = { '394': [18, 18], '403': [33, 43] };

const TOOLS: { href: string; title: string; text: string; icon: IconName }[] = [
  { href: '#/break/394', title: 'Team draw', text: 'Dice, visible shuffle rounds, card reveal', icon: 'dice' },
  { href: '#/break/403', title: 'Filler draw', text: 'Cheap entries compete for open spots', icon: 'ticket' },
  { href: '#/wheel', title: 'Wheel of fortune', text: 'One segment per purchase', icon: 'wheel' },
  { href: '#/duck', title: 'Duck race', text: 'Up to 50 ducks, sealed finish', icon: 'duck' },
];

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Good evening' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

const formatLabel = (f: string) => (f === 'random' ? 'Random team' : 'Pick your team');

export default function Dashboard() {
  const draws = listDraws();
  const recent = draws.slice(0, 5);
  const sealed = draws.filter((d) => !d.revealed).length;
  const verified = draws.filter((d) => d.revealed && !d.voided).length;
  const spots = Object.values(SOLD).reduce((a, [s]) => a + s, 0);
  // Feature the first break that is fully sold and ready to draw.
  const featured = BREAKS.find((b) => { const [s, o] = SOLD[b.id] ?? [0, b.spots]; return s === o; }) ?? BREAKS[0];
  const [fSold, fOf] = SOLD[featured.id] ?? [0, featured.spots];

  return (
    <div className="home">
      <PageHeader
        eyebrow={`Workspace · ${WORKSPACE.name}`}
        title={greeting()}
        actions={<button className="btn btn-secondary" onClick={openStreamWindow}><Icon name="external" size={16} /> Open stream view</button>}
      >
        {BREAKS.length} breaks are ready to draw. Every draw is sealed before the roll and verifiable afterwards.
      </PageHeader>

      <div className="stats" role="list">
        <div className="stat" role="listitem"><b>{BREAKS.length}</b><span>Breaks ready</span></div>
        <div className="stat" role="listitem"><b>{spots}</b><span>Spots to draw</span></div>
        <div className="stat" role="listitem"><b>{sealed}</b><span>Sealed now</span></div>
        <div className="stat" role="listitem"><b>{verified}</b><span>Published proofs</span></div>
      </div>

      <section className="home-grid">
        <div className="home-col">
          <a href={`#/break/${featured.id}`} className="hero-break">
            <div className="hb-art"><img src={featured.image} alt="" /></div>
            <div className="hb-body">
              <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
                <span className="chip chip-good"><Icon name="check" size={12} /> Ready to draw</span>
                <span className="overline">Next up · Break #{featured.number} · {formatLabel(featured.format)}</span>
              </div>
              <h2 className="hb-title">{featured.title}</h2>
              <dl className="meta-row">
                <div><dt>Spots</dt><dd>{featured.spots}</dd></div>
                {featured.slotPrice && <div><dt>Spot price</dt><dd>{kr(featured.slotPrice)}</dd></div>}
                <div><dt>Box</dt><dd>{kr(featured.boxPrice)}</dd></div>
                <div><dt>Starts</dt><dd>{featured.startsAt}</dd></div>
              </dl>
              <div className="hb-foot">
                <div className="hb-progress">
                  <div className="spread"><span className="muted">Sold</span><b className="tnum">{fSold}/{fOf}</b></div>
                  <span className="progress"><span style={{ width: `${(fSold / fOf) * 100}%` }} /></span>
                </div>
                <span className="btn btn-primary btn-lg">Run draw <Icon name="arrowRight" size={18} /></span>
              </div>
            </div>
          </a>

          <div className="card">
            <div className="card-head">
              <h3>Breaks</h3>
              <span className="pill pill-quiet" title="Shopify connection is simulated in this prototype"><span className="dot" /> Synced from Shopify</span>
            </div>
            <div className="queue">
              {BREAKS.map((b) => {
                const [sold, of] = SOLD[b.id] ?? [0, b.spots];
                const ready = sold === of;
                return (
                  <a key={b.id} href={`#/break/${b.id}`} className="queue-row">
                    <span className="q-thumb"><img src={b.image} alt="" /></span>
                    <span className="q-title">
                      <span className="overline">Break #{b.number} · {formatLabel(b.format)}</span>
                      <b>{b.title}</b>
                      <span className="muted">{b.format === 'random' ? `${b.spots} spots · ${kr(b.slotPrice!)}` : `${b.spots} teams and splits`} · box {kr(b.boxPrice)}</span>
                    </span>
                    <span className="q-progress">
                      <span className="spread"><span className="muted">Sold</span><b className="tnum">{sold}/{of}</b></span>
                      <span className="progress"><span style={{ width: `${(sold / of) * 100}%` }} /></span>
                    </span>
                    <span className="q-status">
                      <span className={`chip ${ready ? 'chip-good' : 'chip-gold'}`}>{ready ? 'Ready to draw' : 'Fillers open'}</span>
                      <span className="dim" style={{ fontSize: 12.5 }}>{b.startsAt}</span>
                    </span>
                    <span className={`btn btn-sm ${ready ? 'btn-primary' : 'btn-secondary'}`}>{ready ? 'Run draw' : 'Open board'}</span>
                  </a>
                );
              })}
            </div>
          </div>

          <div className="tools">
            {TOOLS.map((t) => (
              <a key={t.title} href={t.href} className="tool">
                <span className="tool-ic"><Icon name={t.icon} size={22} /></span>
                <span className="tool-t"><b>{t.title}</b><span>{t.text}</span></span>
                <Icon name="arrowRight" size={16} className="tool-go" />
              </a>
            ))}
          </div>
        </div>

        <div className="home-col">
          <div className="card preview arena">
            <div className="card-head">
              <span className="row" style={{ gap: 10 }}><Icon name="broadcast" size={18} /><b>Stream preview</b></span>
              <button className="btn btn-sm btn-secondary" onClick={openStreamWindow}><Icon name="external" size={14} /> Open stream view</button>
            </div>
            <Showcase />
          </div>

          <div className="card">
            <div className="card-head">
              <h3>Recent proofs</h3>
              <a href="#/proofs" className="btn btn-sm btn-ghost">All proofs <Icon name="arrowRight" size={14} /></a>
            </div>
            {recent.length === 0 ? (
              <div className="empty">
                <span className="empty-ic"><Icon name="shield" size={22} /></span>
                <b>No draws yet</b>
                <span>Run a team draw and its public proof appears here.</span>
              </div>
            ) : (
              <div className="activity">
                {recent.map((d) => (
                  <a key={d.id} href={`#/proof/${d.id}`} className="activity-row">
                    <span className={`a-dot ${d.voided ? 'void' : d.revealed ? 'ok' : 'sealed'}`} />
                    <span className="a-text"><b>{d.title}</b><span className="mono dim">{d.id} · {d.commitment.slice(0, 12)}…</span></span>
                    {d.voided ? <span className="chip chip-void">Voided</span> : d.revealed ? <span className="chip chip-good">Verifiable</span> : <span className="chip chip-gold">Sealed</span>}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
