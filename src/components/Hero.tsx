// Page hero in the "vault" language: smoked glass over a blurred, warm-lit copy
// of the real box image, a single gold action, round arrow controls.
import type { ReactNode } from 'react';
import Icon from './Icons.tsx';

export type Tone = 'gold' | 'violet' | 'aqua' | 'rose';

interface Fact { icon?: string; label: string; value: ReactNode }

interface Props {
  tone?: Tone;
  badge?: { icon: string; label: string };
  chips?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  stats?: Fact[];
  actions?: ReactNode;
  /** Real product image: blurred as atmosphere and shown sharp in a card slab. */
  image?: string;
  /** Custom artwork for pages without a product image. */
  art?: ReactNode;
  glyph?: string;
  aside?: ReactNode;
  tabs?: ReactNode;
  compact?: boolean;
  pager?: { index: number; total: number; onPrev: () => void; onNext: () => void; label: string };
}

export default function Hero({ badge, chips, title, lede, stats, actions, image, art, aside, tabs, compact, pager }: Props) {
  return (
    <section className={`hero${compact ? ' compact' : ''}${image ? ' has-image' : ''}`}>
      <div className="hero-atmos" aria-hidden="true">
        {image && <img src={image} alt="" />}
        <i className="glow g1" /><i className="glow g2" />
      </div>

      <div className="hero-body">
        {(badge || chips) && (
          <div className="hero-chips">
            {badge && <span className="badge"><span className="badge-ic"><Icon name={badge.icon} size={13} weight="fill" /></span>{badge.label}</span>}
            {chips}
          </div>
        )}
        <h1 className="hero-title">{title}</h1>
        {lede && <p className="hero-lede">{lede}</p>}
        {stats && stats.length > 0 && (
          <dl className="ledger">
            {stats.map((s) => (
              <div key={s.label}>
                <dt>{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {actions && <div className="hero-actions">{actions}</div>}
      </div>

      <div className="hero-art" aria-hidden="true">
        {image ? (
          <div className="slab">
            <div className="slab-label"><span>Hobby box</span><span className="mono">BP · 2026</span></div>
            <div className="slab-window"><img src={image} alt="" /></div>
          </div>
        ) : art}
      </div>

      {(pager || aside) && (
        <div className="hero-foot">
          {pager ? (
            <div className="pager">
              <button className="round-btn" aria-label={`Previous ${pager.label}`} onClick={pager.onPrev}><Icon name="back" size={16} /></button>
              <button className="round-btn on" aria-label={`Next ${pager.label}`} onClick={pager.onNext}><Icon name="arrow" size={16} /></button>
            </div>
          ) : <span />}
          <div className="hero-foot-right">
            {aside}
            {pager && (
              <span className="counter" aria-live="polite">
                <span className="frac"><b>{pager.index + 1}</b>/{pager.total}</span>
                <svg viewBox="0 0 20 20" width="20" height="20"><circle cx="10" cy="10" r="8" /><circle className="arc" cx="10" cy="10" r="8" style={{ strokeDasharray: `${((pager.index + 1) / pager.total) * 50.3} 50.3` }} /></svg>
              </span>
            )}
          </div>
        </div>
      )}
      {tabs && <div className="hero-tabs">{tabs}</div>}
    </section>
  );
}

/** Overlapping initials for buyers, "+N" for the rest. */
export function AvatarStack({ names, max = 5, label }: { names: string[]; max?: number; label?: string }) {
  const uniq = [...new Set(names)];
  return (
    <div className="avatar-stack" aria-label={label ? `${uniq.length} ${label}` : `${uniq.length} people`}>
      <span className="avs">
        {uniq.slice(0, max).map((n, i) => (
          <span key={n} className={`av h${i % 5}`} title={n}>{n.replace(/[^a-z]/gi, '').slice(0, 1).toUpperCase()}</span>
        ))}
        {uniq.length > max && <span className="av more">+{uniq.length - max}</span>}
      </span>
      {label && <span className="as-label">{label}</span>}
    </div>
  );
}

/** A trading-card frame used as artwork: serial number, name, foil edge. */
export function TradingCard({ serial, name, sub, className = '' }: { serial: string; name: string; sub?: string; className?: string }) {
  return (
    <div className={`tcard ${className}`}>
      <span className="tc-serial mono">{serial}</span>
      <span className="tc-art" />
      <b>{name}</b>
      {sub && <span className="tc-sub">{sub}</span>}
    </div>
  );
}
