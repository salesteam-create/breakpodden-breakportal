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

function destinations() {
  const base = [
    { href: '#/', label: 'Dashboard', meta: 'Overview', icon: 'home' },
    ...BREAKS.map((b) => ({ href: `#/break/${b.id}`, label: `Break #${b.number} · ${b.title}`, meta: b.format === 'random' ? 'Random team' : 'Pick your team', icon: b.format === 'random' ? 'dice' : 'ticket' })),
    { href: '#/wheel', label: 'Wheel of fortune', meta: 'Giveaway', icon: 'wheel' },
    { href: '#/duck', label: 'Duck race', meta: 'Giveaway', icon: 'duck' },
    { href: '#/checklists', label: 'Box checklists', meta: 'Library', icon: 'list' },
    { href: '#/proofs', label: 'Fairness proofs', meta: 'Public', icon: 'shield' },
  ];
  const draws = listDraws().map((d) => ({ href: `#/proof/${d.id}`, label: d.title, meta: d.id, icon: 'seal' }));
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

  const results = useMemo(() => {
    const all = destinations();
    const s = q.trim().toLowerCase();
    return (s ? all.filter((d) => `${d.label} ${d.meta}`.toLowerCase().includes(s)) : all).slice(0, 8);
  }, [q, open]); // eslint-disable-line react-hooks/exhaustive-deps

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
        placeholder="Search breaks, giveaways or proofs…"
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
      {open && (
        <div className="search-pop" id="search-results" role="listbox">
          {results.length === 0 && <div className="search-empty">Nothing matches “{q}”</div>}
          {results.map((r, i) => (
            <button
              key={r.href}
              role="option"
              aria-selected={i === sel}
              className={i === sel ? 'on' : ''}
              onMouseEnter={() => setSel(i)}
              onMouseDown={(e) => { e.preventDefault(); pick(r.href); }}
            >
              <Icon name={r.icon} size={17} />
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
  const brk = section === 'break' ? BREAKS.find((b) => b.id === id) : undefined;
  if (brk && brk.id === '394') page = <RandomBreak />;
  else if (brk && brk.id === '403') page = <PytBreak />;
  else if (section === 'wheel') page = <WheelPage />;
  else if (section === 'duck') page = <DuckRacePage />;
  else if (section === 'proofs' || section === 'proof') page = <ProofPage id={id} />;
  else if (section === 'checklists') page = <ChecklistsPage />;
  else page = <Dashboard />;

  const proofs = listDraws().length;
  const link = (href: string, label: string, icon: string, active: boolean, extra?: React.ReactNode) => (
    <a key={href} href={href} className={`nav-item${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined}>
      <Icon name={icon} size={18} weight={active ? 'fill' : 'regular'} />
      <span>{label}</span>
      {extra}
    </a>
  );
  const dark = theme === 'dark';

  return (
    <div className={`frame${drawer ? ' drawer-open' : ''}`}>
      {/* Soft gold clouds drifting behind the glass panels. Decorative only. */}
      <div className="ambient" aria-hidden="true"><i /><i /><i /></div>
      <aside className="sidebar" aria-label="Main navigation">
        <div className="sb-top">
          <a href="#/" className="brand" aria-label={`${PRODUCT} home`}>
            <span className="brand-mark"><img src={WORKSPACE.logoMark} alt="" /></span>
            <b>{PRODUCT}</b>
          </a>
          <button className="icon-btn ghost sb-close" aria-label="Close menu" onClick={() => setDrawer(false)}><Icon name="close" size={18} /></button>
        </div>

        <nav className="sb-nav">
          <div className="sb-group">
            {link('#/', 'Dashboard', 'home', section === '')}
            {BREAKS.map((b) => link(`#/break/${b.id}`, `Break #${b.number}`, b.format === 'random' ? 'dice' : 'ticket', brk?.id === b.id, <em className="nav-meta">{b.startsAt.replace('Tonight ', '')}</em>))}
          </div>
          <div className="sb-group">
            {link('#/wheel', 'Wheel of fortune', 'wheel', section === 'wheel')}
            {link('#/duck', 'Duck race', 'duck', section === 'duck')}
          </div>
          <div className="sb-group">
            {link('#/checklists', 'Box checklists', 'list', section === 'checklists')}
            {link('#/proofs', 'Fairness proofs', 'shield', section === 'proofs' || section === 'proof', proofs > 0 ? <em className="nav-count">{proofs}</em> : null)}
          </div>
          <div className="sb-group">
            <button className="nav-item" onClick={openStreamWindow}><Icon name="live" size={18} /><span>Stream view</span></button>
            <button className="nav-item" role="switch" aria-checked={dark} onClick={toggle}>
              <Icon name={dark ? 'moon' : 'sun'} size={18} />
              <span>Dark mode</span>
              <span className={`switch${dark ? ' on' : ''}`} aria-hidden="true"><i /></span>
            </button>
          </div>
        </nav>

        <button
          className="nav-item sb-reset"
          onClick={() => {
            if (confirm('Reset the demo? All draws and proofs on this device are cleared.')) resetDemo();
          }}
        >
          <Icon name="reset" size={18} /><span>Reset demo</span>
        </button>
      </aside>
      <div className="scrim" onClick={() => setDrawer(false)} aria-hidden="true" />

      <div className="main">
        <header className="topbar">
          <button className="icon-btn ghost menu-btn" aria-label="Open menu" onClick={() => setDrawer(true)}><Icon name="menu" size={20} /></button>
          <Search />
          <div className="topbar-right">
            <button className="icon-btn" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} title={dark ? 'Light mode' : 'Dark mode'} onClick={toggle}>
              <Icon name={dark ? 'sun' : 'moon'} size={18} />
            </button>
            <button className="icon-btn" aria-label="Open stream view" title="Stream view" onClick={openStreamWindow}>
              <Icon name="live" size={18} /><i className="pip" />
            </button>
            <span className="avatar" title={`${WORKSPACE.name} · Shopify connected`}>{WORKSPACE.host.initials}</span>
          </div>
        </header>

        <main className="page" key={`${section}/${id ?? ''}`}>{page}</main>

        <footer className="app-footer">
          <span>{PRODUCT} · {WORKSPACE.domain} · Shopify connected</span>
          <span>Prototype · sample buyers are invented · photos from Unsplash</span>
        </footer>
      </div>
    </div>
  );
}
