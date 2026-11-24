// Shared page hero: a dark, gradient-lit banner with artwork on the right,
// in the spirit of the reference "featured" banners. Stays dark in light mode.
import type { ReactNode } from 'react';
import Icon from './Icons.tsx';

export type Tone = 'gold' | 'violet' | 'aqua' | 'rose';

interface Stat { icon: string; label: string; value: ReactNode }

interface Props {
  tone?: Tone;
  chips?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  stats?: Stat[];
  actions?: ReactNode;
  /** Product image (box) or an icon name used as large line artwork. */
  image?: string;
  glyph?: string;
  aside?: ReactNode;
  tabs?: ReactNode;
  compact?: boolean;
}

export function HeroArt({ image, glyph }: { image?: string; glyph?: string }) {
  if (image) {
    return (
      <div className="hero-art box-art" aria-hidden="true">
        <span className="card-ghost c1" />
        <span className="card-ghost c2" />
        <span className="card-ghost c3" />
        <div className="box-frame"><img src={image} alt="" /></div>
      </div>
    );
  }
  return (
    <div className="hero-art glyph-art" aria-hidden="true">
      <span className="orbit o1" />
      <span className="orbit o2" />
      <span className="orbit o3" />
      <span className="glyph-core"><Icon name={glyph ?? 'sparkle'} size={88} strokeWidth={1.1} /></span>
    </div>
  );
}

export default function Hero({ tone = 'violet', chips, title, lede, stats, actions, image, glyph, aside, tabs, compact }: Props) {
  return (
    <section className={`hero tone-${tone}${compact ? ' compact' : ''}`}>
      <div className="hero-bg" aria-hidden="true"><i /><i /><i /></div>
      <div className="hero-body">
        {chips && <div className="hero-chips">{chips}</div>}
        <h1 className="display">{title}</h1>
        {lede && <p className="hero-lede">{lede}</p>}
        {stats && stats.length > 0 && (
          <dl className="hero-stats">
            {stats.map((s) => (
              <div key={s.label}>
                <span className="hs-ic"><Icon name={s.icon} size={16} /></span>
                <dt>{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {actions && <div className="hero-actions">{actions}</div>}
      </div>
      <HeroArt image={image} glyph={glyph} />
      {aside && <div className="hero-aside">{aside}</div>}
      {tabs && <div className="hero-tabs">{tabs}</div>}
    </section>
  );
}

/** Overlapping avatar initials, "+N" for the rest (reference: player stack). */
export function AvatarStack({ names, max = 5, label }: { names: string[]; max?: number; label?: string }) {
  const uniq = [...new Set(names)];
  return (
    <div className="avatar-stack" aria-label={label ?? `${uniq.length} people`}>
      {uniq.slice(0, max).map((n, i) => (
        <span key={n} className={`av h${i % 6}`} title={n}>{n.replace(/[^a-z]/gi, '').slice(0, 2).toUpperCase()}</span>
      ))}
      {uniq.length > max && <span className="av more">+{uniq.length - max}</span>}
      {label && <span className="as-label">{label}</span>}
    </div>
  );
}
