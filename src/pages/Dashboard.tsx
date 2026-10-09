import { BREAKS, kr } from '../lib/data.ts';
import { listDraws, openStreamWindow } from '../lib/store.ts';
import { WORKSPACE } from '../lib/workspace.ts';
import Showcase from '../components/Showcase.tsx';

const SOLD: Record<string, [number, number]> = { '394': [18, 18], '403': [33, 43] };

const TOOLS = [
  { href: '#/break/394', title: 'Team draw', text: 'Dice, visible shuffle rounds, card reveal', icon: 'dice' },
  { href: '#/break/403', title: 'Filler draw', text: 'Cheap entries compete for open spots', icon: 'ticket' },
  { href: '#/wheel', title: 'Wheel of fortune', text: 'One segment per purchase', icon: 'wheel' },
  { href: '#/duck', title: 'Duck race', text: 'Up to 50 ducks, sealed finish', icon: 'duck' },
];

function ToolIcon({ name }: { name: string }) {
  const common = { width: 26, height: 26, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (name === 'dice') return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" /><circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /></svg>;
  if (name === 'ticket') return <svg {...common}><path d="M3 8a2 2 0 0 0 0 4v4h18v-4a2 2 0 0 1 0-4V4H3z" transform="translate(0 2)" /><path d="M14 6v12" strokeDasharray="2 2" /></svg>;
  if (name === 'wheel') return <svg {...common}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2" /><path d="M12 3v7M12 14v7M3 12h7M14 12h7M5.6 5.6l5 5M13.4 13.4l5 5M18.4 5.6l-5 5M10.6 13.4l-5 5" /></svg>;
  return <svg {...common}><path d="M4 14q-1-4 2-3 1 4 5 4h5q3 0 3 3-2 3-8 3-6 0-7-7z" /><circle cx="15" cy="8" r="3.5" /><path d="M18.5 7.5H21l-2.5 1.5" /></svg>;
}

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Good evening' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export default function Dashboard() {
  const draws = listDraws();
  const recent = draws.slice(0, 5);
  const sealed = draws.filter((d) => !d.revealed).length;
  const verified = draws.filter((d) => d.revealed && !d.voided).length;
  const spots = Object.values(SOLD).reduce((a, [s]) => a + s, 0);

  return (
    <div className="home">
      <section className="home-top">
        <div className="welcome card">
          <div className="welcome-head">
            <span className="eyebrow">Workspace · {WORKSPACE.name}</span>
            <h1>{greeting()}</h1>
            <p className="muted">{BREAKS.length} breaks are ready to draw. Every draw is sealed before the roll and verifiable afterwards.</p>
          </div>
          <div className="kpis">
            <div className="kpi"><b>{BREAKS.length}</b><span>Breaks ready</span></div>
            <div className="kpi"><b>{spots}</b><span>Spots to draw</span></div>
            <div className="kpi"><b>{sealed}</b><span>Sealed now</span></div>
            <div className="kpi"><b>{verified}</b><span>Verified proofs</span></div>
          </div>
          <div className="quick">
            {TOOLS.map((t) => (
              <a key={t.title} href={t.href} className="quick-tile">
                <span className="qi"><ToolIcon name={t.icon} /></span>
                <span className="qt"><b>{t.title}</b><span>{t.text}</span></span>
                <span className="go">→</span>
              </a>
            ))}
          </div>
        </div>

        <div className="preview card theme-dark">
          <div className="preview-head">
            <span className="row" style={{ gap: 8 }}><span className="live-dot" /> <b>Stream preview</b></span>
            <button className="btn btn-sm" onClick={openStreamWindow}>⧉ Open stream view</button>
          </div>
          <Showcase />
        </div>
      </section>

      <section className="home-main">
        <div className="card">
          <div className="card-head">
            <h3>Breaks</h3>
            <span className="pill"><span className="dot" /> Synced from Shopify</span>
          </div>
          <div className="queue">
            {BREAKS.map((b) => {
              const [sold, of] = SOLD[b.id] ?? [0, b.spots];
              const ready = sold === of;
              return (
                <a key={b.id} href={`#/break/${b.id}`} className="queue-row">
                  <span className="q-thumb"><img src={b.image} alt="" /></span>
                  <span className="q-title">
                    <span className="overline">Break #{b.number} · {b.format === 'random' ? 'Random team' : 'Pick your team'}</span>
                    <b>{b.title}</b>
                    <span className="muted">{b.format === 'random' ? `${b.spots} spots · ${kr(b.slotPrice!)}` : `${b.spots} teams and splits`} · box {kr(b.boxPrice)}</span>
                  </span>
                  <span className="q-progress">
                    <span className="row" style={{ justifyContent: 'space-between' }}><span className="muted">Sold</span><b>{sold}/{of}</b></span>
                    <span className="progress"><span style={{ width: `${(sold / of) * 100}%` }} /></span>
                  </span>
                  <span className="q-status">
                    <span className={`chip ${ready ? 'chip-good' : 'chip-gold'}`}>{ready ? 'Ready to draw' : 'Fillers open'}</span>
                    <span className="dim" style={{ fontSize: 12.5 }}>{b.startsAt}</span>
                  </span>
                  <span className={`btn btn-sm ${ready ? 'btn-gold' : ''}`}>{ready ? 'Run draw' : 'Open board'}</span>
                </a>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Recent proofs</h3>
            <a href="#/proofs" className="btn btn-sm btn-ghost">All proofs →</a>
          </div>
          {recent.length === 0 ? (
            <div className="empty" style={{ padding: '40px 20px' }}>
              No draws yet. Run a team draw and its public proof appears here.
            </div>
          ) : (
            <div className="activity">
              {recent.map((d) => (
                <a key={d.id} href={`#/proof/${d.id}`} className="activity-row">
                  <span className={`a-dot ${d.voided ? 'void' : d.revealed ? 'ok' : 'sealed'}`} />
                  <span className="a-text"><b>{d.title}</b><span className="mono dim">{d.id} · {d.commitment.slice(0, 12)}…</span></span>
                  {d.voided ? <span className="chip chip-void">Voided</span> : d.revealed ? <span className="chip chip-good">Verified</span> : <span className="chip chip-gold">Sealed</span>}
                </a>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
