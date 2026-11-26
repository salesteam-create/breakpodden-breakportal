import { useState, type CSSProperties } from 'react';
import { BREAKS, kr } from '../lib/data.ts';
import { listDraws, openStreamWindow } from '../lib/store.ts';
import { WORKSPACE } from '../lib/workspace.ts';
import Showcase from '../components/Showcase.tsx';
import Icon from '../components/Icon.tsx';
import { CardVault, CrystalDice, CrystalShield, Duck3D, MiniWheel } from '../components/Art.tsx';
import { useCountUp } from '../motion/useCountUp.ts';

const SOLD: Record<string, [number, number]> = { '394': [18, 18], '403': [33, 43] };
const formatLabel = (f: string) => (f === 'random' ? 'Random team' : 'Pick your team');

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Good evening' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

function Stat({ value, label }: { value: number; label: string }) {
  const n = useCountUp(value);
  return <div className="stat" role="listitem"><b>{n}</b><span>{label}</span></div>;
}

const st = (i: number) => ({ '--i': i }) as CSSProperties;

export default function Dashboard() {
  const draws = listDraws();
  const recent = draws.slice(0, 4);
  const sealed = draws.filter((d) => !d.revealed).length;
  const published = draws.filter((d) => d.revealed && !d.voided).length;
  const spots = Object.values(SOLD).reduce((a, [s]) => a + s, 0);
  // Feature the first break that is fully sold and ready to draw; the host can flip to the other.
  const firstReady = Math.max(0, BREAKS.findIndex((b) => { const [s, o] = SOLD[b.id] ?? [0, b.spots]; return s === o; }));
  const [fi, setFi] = useState(firstReady);
  const b = BREAKS[fi];
  const [sold, of] = SOLD[b.id] ?? [0, b.spots];
  const ready = sold === of;

  return (
    <div className="arena-home">
      {/* ---------- Hero: the launch showcase ---------- */}
      <section className="hero" data-spot>
        <div className="hero-copy" key={b.id}>
          <div className="hero-kicker reveal-up" style={st(0)}>
            <span className="live-dot" aria-hidden="true" /> {greeting()} · {WORKSPACE.name} · Tonight in the arena
          </div>
          <h1 className="hero-title reveal-up" style={st(1)}>
            <span className="ht-small">Break #{b.number} · {formatLabel(b.format)}</span>
            <span className="holo-text">{b.title}</span>
          </h1>
          <dl className="hero-meta reveal-up" style={st(2)}>
            <div><dt>Spots</dt><dd>{b.spots}</dd></div>
            {b.slotPrice && <div><dt>Spot price</dt><dd>{kr(b.slotPrice)}</dd></div>}
            <div><dt>Box</dt><dd>{kr(b.boxPrice)}</dd></div>
            <div><dt>Starts</dt><dd>{b.startsAt}</dd></div>
          </dl>
          <div className="hero-sold reveal-up" style={st(3)}>
            <div className="spread"><span className={`chip ${ready ? 'chip-good' : 'chip-gold'}`}>{ready ? 'Ready to draw' : 'Fillers open'}</span><b className="tnum">{sold}/{of} sold</b></div>
            <span className="progress glow"><span style={{ width: `${(sold / of) * 100}%` }} /></span>
          </div>
          <div className="hero-actions reveal-up" style={st(4)}>
            <a href={`#/break/${b.id}`} className="btn btn-primary btn-xl" data-magnetic>
              {ready ? 'Run draw' : 'Open board'} <Icon name="arrowRight" size={18} />
            </a>
            <button className="btn btn-glass btn-xl" onClick={openStreamWindow}><Icon name="broadcast" size={18} /> Open stream view</button>
          </div>
        </div>

        <div className="hero-stage" data-tilt>
          <span className="hs-ring r1" aria-hidden="true" />
          <span className="hs-ring r2" aria-hidden="true" />
          <span className="hs-glow" aria-hidden="true" />
          <div className="hs-art" key={b.id}>
            <img src={b.image} alt={b.title} style={{ viewTransitionName: `art-${b.id}` } as CSSProperties} />
            <span className="hs-sheen" aria-hidden="true" />
          </div>
          <span className="hs-floor" aria-hidden="true" />
        </div>

        <div className="hero-switch" role="tablist" aria-label="Featured break">
          {BREAKS.map((x, i) => (
            <button key={x.id} role="tab" aria-selected={i === fi} className={`hsw${i === fi ? ' on' : ''}`} onClick={() => setFi(i)}>
              <img src={x.image} alt="" />
              <span><b>#{x.number}</b><small>{x.startsAt}</small></span>
            </button>
          ))}
        </div>
      </section>

      <div className="stats reveal-up" role="list" style={st(5)}>
        <Stat value={BREAKS.length} label="Breaks ready" />
        <Stat value={spots} label="Spots to draw" />
        <Stat value={sealed} label="Sealed now" />
        <Stat value={published} label="Published proofs" />
      </div>

      {/* ---------- Bento ---------- */}
      <section className="bento">
        <div className="tile-monitor reveal-up" style={st(6)}>
          <div className="monitor arena">
            <div className="mon-bar">
              <span className="row" style={{ gap: 10 }}><span className="rec" aria-hidden="true" /><b>Stream preview</b><span className="dim">· format loop</span></span>
              <button className="btn btn-sm btn-glass" onClick={openStreamWindow}><Icon name="external" size={14} /> Open stream view</button>
            </div>
            <div className="mon-screen"><Showcase /></div>
          </div>
        </div>

        <a href="#/break/394" className="tool t-draw reveal-up" style={st(7)} data-tilt>
          <span className="tool-art"><CrystalDice /></span>
          <span className="tool-copy">
            <span className="overline">Break tool</span>
            <b>Team draw</b>
            <span>Dice, visible shuffle rounds, card reveal</span>
          </span>
          <Icon name="arrowRight" size={18} className="tool-go" />
        </a>

        <a href="#/wheel" className="tool t-wheel reveal-up" style={st(8)} data-tilt>
          <span className="tool-art"><MiniWheel /></span>
          <span className="tool-copy"><span className="overline">Giveaway</span><b>Wheel of fortune</b><span>One segment per purchase</span></span>
          <Icon name="arrowRight" size={18} className="tool-go" />
        </a>
        <a href="#/duck" className="tool t-duck reveal-up" style={st(9)} data-tilt>
          <span className="tool-art"><Duck3D /></span>
          <span className="tool-copy"><span className="overline">Giveaway</span><b>Duck race</b><span>Up to 50 ducks, sealed finish</span></span>
          <Icon name="arrowRight" size={18} className="tool-go" />
        </a>
        <a href="#/break/403" className="tool t-filler reveal-up" style={st(10)} data-tilt>
          <span className="tool-art"><span className="art-tickets" aria-hidden="true"><i /><i /><i /></span></span>
          <span className="tool-copy"><span className="overline">Break tool</span><b>Filler draw</b><span>Cheap entries compete for open spots</span></span>
          <Icon name="arrowRight" size={18} className="tool-go" />
        </a>
        <a href="#/checklists" className="tool t-vault reveal-up" style={st(11)} data-tilt>
          <span className="tool-art"><CardVault /></span>
          <span className="tool-copy"><span className="overline">Library</span><b>Box checklists</b><span>Team lists and player splits</span></span>
          <Icon name="arrowRight" size={18} className="tool-go" />
        </a>

        <div className="tonight glass reveal-up" style={st(12)}>
          <div className="panel-head">
            <div><span className="overline">Tonight</span><h3>Breaks</h3></div>
            <span className="pill pill-quiet" title="Shopify connection is simulated in this prototype"><span className="dot" /> Synced from Shopify</span>
          </div>
          {BREAKS.map((x) => {
            const [s, o] = SOLD[x.id] ?? [0, x.spots];
            const r = s === o;
            return (
              <a key={x.id} href={`#/break/${x.id}`} className="ticket" data-tilt="soft">
                <span className="tk-art"><img src={x.image} alt="" /></span>
                <span className="tk-body">
                  <span className="overline">Break #{x.number} · {formatLabel(x.format)}</span>
                  <b>{x.title}</b>
                  <span className="muted">{x.format === 'random' ? `${x.spots} spots · ${kr(x.slotPrice!)}` : `${x.spots} teams and splits`} · box {kr(x.boxPrice)}</span>
                  <span className="tk-progress"><span className="progress"><span style={{ width: `${(s / o) * 100}%` }} /></span><b className="tnum">{s}/{o}</b></span>
                </span>
                <span className="tk-side">
                  <span className={`chip ${r ? 'chip-good' : 'chip-gold'}`}>{r ? 'Ready to draw' : 'Fillers open'}</span>
                  <span className="dim">{x.startsAt}</span>
                  <span className={`btn btn-sm ${r ? 'btn-primary' : 'btn-glass'}`}>{r ? 'Run draw' : 'Open board'}</span>
                </span>
              </a>
            );
          })}
        </div>

        <div className="trust glass reveal-up" style={st(13)}>
          <div className="trust-art"><CrystalShield /></div>
          <div className="trust-body">
            <div className="panel-head">
              <div><span className="overline">Trust vault</span><h3>Recent proofs</h3></div>
              <a href="#/proofs" className="btn btn-sm btn-ghost">All proofs <Icon name="arrowRight" size={14} /></a>
            </div>
            {recent.length === 0 ? (
              <div className="empty slim">
                <b>The vault is empty</b>
                <span>Every sealed draw lands here with its public proof. Run a team draw to add the first one.</span>
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
