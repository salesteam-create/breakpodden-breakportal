// Page hero: a full-bleed stock photo with a soft shade on the left for the text,
// a status pill, outlined chips, title, one primary action and slide dots.
import type { ReactNode } from 'react';
import Icon from './Icons.tsx';

interface Fact { icon?: string; label: string; value: ReactNode }

interface Props {
  image: string;
  badge?: { icon: string; label: string };
  chips?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  stats?: Fact[];
  actions?: ReactNode;
  aside?: ReactNode;
  tabs?: ReactNode;
  compact?: boolean;
  /** Focal point of the photo, CSS object-position. */
  focus?: string;
  dots?: { index: number; total: number; onPick: (i: number) => void; label: string; /** Autoplay interval in ms; shows a progress fill on the active dot. */ duration?: number };
}

export default function Hero({ image, badge, chips, title, lede, stats, actions, aside, tabs, compact, focus, dots }: Props) {
  return (
    <section className={`hero${compact ? ' compact' : ''}`}>
      <img className="hero-img" src={image} alt="" style={focus ? { objectPosition: focus } : undefined} />
      <div className="hero-shade" aria-hidden="true" />

      <div className="hero-body">
        {badge && <span className="hero-badge"><Icon name={badge.icon} size={14} weight="fill" /> {badge.label}</span>}
        {chips && <div className="hero-chips">{chips}</div>}
        <h1 className="hero-title">{title}</h1>
        {lede && <p className="hero-lede">{lede}</p>}
        {stats && stats.length > 0 && (
          <dl className="hero-meta">
            {stats.map((s) => (
              <div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>
            ))}
          </dl>
        )}
        {actions && <div className="hero-actions">{actions}</div>}
        {tabs && <div className="hero-tabs">{tabs}</div>}
      </div>

      {aside && <div className="hero-aside">{aside}</div>}
      {dots && (
        <div className="hero-dots" role="tablist" aria-label={dots.label}>
          {Array.from({ length: dots.total }, (_, i) => (
            <button key={i} role="tab" aria-selected={i === dots.index} aria-label={`${dots.label} ${i + 1}`} className={i === dots.index ? 'on' : ''} onClick={() => dots.onPick(i)}>
              {i === dots.index && dots.duration ? <i key={dots.index} style={{ animationDuration: `${dots.duration}ms` }} /> : null}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

/** Overlapping initials for buyers, "+N" for the rest. */
export function AvatarStack({ names, max = 4, label }: { names: string[]; max?: number; label?: string }) {
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
