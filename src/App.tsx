import { useEffect, useMemo, useRef, useState } from 'react';
import { useRoute, go } from './lib/router.ts';
import { listDraws, openStreamWindow, resetDemo } from './lib/store.ts';
import { useTheme } from './lib/theme.ts';
import { BREAKS } from './lib/data.ts';
import { PRODUCT, WORKSPACE } from './lib/workspace.ts';
import Icon from './components/Icons.tsx';
import Dashboard from './pages/Dashboard.tsx';
import RandomBreak from './pages/RandomBreak.tsx';
import PytBreak from './pages/PytBreak.tsx';
import WheelPage from './pages/WheelPage.tsx';
import DuckRacePage from './pages/DuckRacePage.tsx';
import ProofPage from './pages/ProofPage.tsx';
import ChecklistsPage from './pages/ChecklistsPage.tsx';
import StreamView from './pages/StreamView.tsx';

const GIVEAWAYS = [
  { href: '#/wheel', label: 'Wheel of fortune', icon: 'wheel', match: 'wheel' },
  { href: '#/duck', label: 'Duck race', icon: 'duck', match: 'duck' },
];

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Good evening' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

/** Every place the search box can take you. */
function destinations() {
  const base = [
    { href: '#/', label: 'Dashboard', meta: 'Overview', icon: 'home' },
    ...BREAKS.map((b) => ({ href: `#/break/${b.id}`, label: `Break #${b.number} · ${b.title}`, meta: b.format === 'random' ? 'Random team' : 'Pick your team', icon: b.format === 'random' ? 'dice' : 'ticket' })),
    { href: '#/wheel', label: 'Wheel of fortune', meta: 'Giveaway', icon: 'wheel' },
    { href: '#/duck', label: 'Duck race', meta: 'Giveaway', icon: 'duck' },
    { href: '#/checklists', label: 'Box checklists', meta: 'Library', icon: 'list' },
    { href: '#/proofs', label: 'Fairness proofs', meta: 'Public', icon: 'shield' },
  ];
  const draws = listDraws().map((d) => ({ href: `#/proof/${d.id}`, label: d.title, meta: `Proof ${d.id}`, icon: 'file' }));
  return [...base, ...draws];
}

function Search() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(0);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const results = useMemo(() => {
    const all = destinations();
    const s = q.trim().toLowerCase();
    return (s ? all.filter((d) => `${d.label} ${d.meta}`.toLowerCase().includes(s)) : all).slice(0, 8);
  }, [q, open]);

  const pick = (href: string) => {
    go(href.slice(1));
    setQ('');
    setOpen(false);
    ref.current?.blur();
  };

  return (
    <div className="search">
      <Icon name="search" size={17} />
      <input
        ref={ref}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls="search-results"
        aria-label="Search breaks, giveaways and proofs"
        placeholder="Search breaks, giveaways, proofs…"
        value={q}
        onFocus={() => { setOpen(true); setSel(0); }}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onChange={(e) => { setQ(e.target.value); setSel(0); }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, results.length - 1)); }
          if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
          if (e.key === 'Enter' && results[sel]) pick(results[sel].href);
          if (e.key === 'Escape') ref.current?.blur();
        }}
      />
      <kbd>/</kbd>
      {open && (
        <div className="search-pop" id="search-results" role="listbox">
          {results.length === 0 && <div className="search-empty">Nothing matches "{q}"</div>}
          {results.map((r, i) => (
            <button
              key={r.href}
              role="option"
              aria-selected={i === sel}
              className={i === sel ? 'on' : ''}
              onMouseEnter={() => setSel(i)}
              onMouseDown={(e) => { e.preventDefault(); pick(r.href); }}
            >
              <span className="si"><Icon name={r.icon} size={16} /></span>
              <span className="st">{r.label}</span>
              <span className="sm">{r.meta}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [section = '', id] = useRoute();
  const { theme, toggle } = useTheme();
  const [drawer, setDrawer] = useState(false);

  useEffect(() => setDrawer(false), [section, id]);

  if (section === 'stream') return <StreamView />;

  let page;
  let crumbs: { label: string; href?: string }[] = [];
  const brk = section === 'break' ? BREAKS.find((b) => b.id === id) : undefined;
  if (brk && brk.id === '394') page = <RandomBreak />;
  else if (brk && brk.id === '403') page = <PytBreak />;
  else if (section === 'wheel') page = <WheelPage />;
  else if (section === 'duck') page = <DuckRacePage />;
  else if (section === 'proofs' || section === 'proof') page = <ProofPage id={id} />;
  else if (section === 'checklists') page = <ChecklistsPage />;
  else page = <Dashboard />;

  if (brk) crumbs = [{ label: 'Breaks', href: '#/' }, { label: `Break #${brk.number}` }];
  else if (section === 'wheel') crumbs = [{ label: 'Giveaways' }, { label: 'Wheel of fortune' }];
  else if (section === 'duck') crumbs = [{ label: 'Giveaways' }, { label: 'Duck race' }];
  else if (section === 'checklists') crumbs = [{ label: 'Library' }, { label: 'Box checklists' }];
  else if (section === 'proofs') crumbs = [{ label: 'Public' }, { label: 'Fairness proofs' }];
  else if (section === 'proof') crumbs = [{ label: 'Fairness proofs', href: '#/proofs' }, { label: id ?? '' }];
  else crumbs = [{ label: WORKSPACE.name }, { label: 'Dashboard' }];

  const proofs = listDraws().length;
  const navItem = (href: string, label: string, icon: string, active: boolean, extra?: React.ReactNode) => (
    <a key={href} href={href} className={`nav-item${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined}>
      <Icon name={icon} size={18} />
      <span>{label}</span>
      {extra}
    </a>
  );

  return (
    <div className={`shell${drawer ? ' drawer-open' : ''}`}>
      <aside className="sidebar" aria-label="Main navigation">
        <div className="sb-top">
          <a href="#/" className="brand" aria-label={`${PRODUCT} home`}>
            <span className="brand-mark"><img src={WORKSPACE.logoMark} alt="" /></span>
            <span className="brand-text"><b>{PRODUCT}</b><span>{WORKSPACE.name}</span></span>
          </a>
          <button className="icon-btn sb-close" aria-label="Close menu" onClick={() => setDrawer(false)}><Icon name="close" /></button>
        </div>

        <div className="sb-profile">
          <span className="avatar lg">{WORKSPACE.host.initials}<i className="online" /></span>
          <span>
            <span className="dim">{greeting()},</span>
            <b>{WORKSPACE.name} host</b>
          </span>
        </div>

        <nav className="sb-nav">
          <div className="sb-label">Navigation</div>
          {navItem('#/', 'Dashboard', 'home', section === '')}
          {navItem('#/proofs', 'Fairness proofs', 'shield', section === 'proofs' || section === 'proof', proofs > 0 ? <em className="count">{proofs}</em> : null)}
          {navItem('#/checklists', 'Box checklists', 'list', section === 'checklists')}

          <div className="sb-label">Tonight's breaks</div>
          {BREAKS.map((b) => (
            <a key={b.id} href={`#/break/${b.id}`} className={`nav-break${brk?.id === b.id ? ' active' : ''}`} aria-current={brk?.id === b.id ? 'page' : undefined}>
              <span className="nb-thumb"><img src={b.image} alt="" /></span>
              <span className="nb-text">
                <b>#{b.number} · {b.format === 'random' ? 'Random team' : 'Pick your team'}</b>
                <span>{b.startsAt}</span>
              </span>
            </a>
          ))}

          <div className="sb-label">Giveaways</div>
          {GIVEAWAYS.map((g) => navItem(g.href, g.label, g.icon, section === g.match))}
        </nav>

        <div className="sb-promo">
          <span className="promo-ic"><Icon name="live" size={18} /></span>
          <b>Go live on stream</b>
          <p>A 1920×1080 overlay for OBS or Streamlabs that follows every draw.</p>
          <button className="btn btn-primary btn-sm btn-block" onClick={openStreamWindow}>Open stream view</button>
        </div>

        <div className="sb-foot">
          <span className="status"><span className="dot" /> Shopify · {WORKSPACE.domain}</span>
          <button
            className="nav-item ghost"
            onClick={() => {
              if (confirm('Reset the demo? All draws and proofs on this device are cleared.')) resetDemo();
            }}
          >
            <Icon name="reset" size={18} /><span>Reset demo</span>
          </button>
        </div>
      </aside>
      <div className="scrim" onClick={() => setDrawer(false)} aria-hidden="true" />

      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" aria-label="Open menu" onClick={() => setDrawer(true)}><Icon name="menu" /></button>
          <nav className="crumbs" aria-label="Breadcrumb">
            {crumbs.map((c, i) => (
              <span key={i} className="crumb">
                {i > 0 && <Icon name="chevron" size={14} className="sep" />}
                {c.href ? <a href={c.href}>{c.label}</a> : <span aria-current={i === crumbs.length - 1 ? 'page' : undefined}>{c.label}</span>}
              </span>
            ))}
          </nav>
          <Search />
          <div className="topbar-right">
            <button className="btn btn-sm btn-live" onClick={openStreamWindow}><span className="live-dot" /> <span className="hide-sm">Stream view</span></button>
            <button className="icon-btn" aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} title={theme === 'dark' ? 'Light mode' : 'Dark mode'} onClick={toggle}>
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
            </button>
            <span className="avatar" title={WORKSPACE.host.name}>{WORKSPACE.host.initials}</span>
          </div>
        </header>

        <main className="page" key={`${section}/${id ?? ''}`}>{page}</main>

        <footer className="app-footer">
          <span><b>{PRODUCT}</b> · Workspace {WORKSPACE.name}</span>
          <span>Prototype · sample buyers are invented · Shopify connection simulated</span>
        </footer>
      </div>
    </div>
  );
}
