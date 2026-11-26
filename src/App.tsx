import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useCinematicRoute } from './motion/useRoute.ts';
import { installFx, watchPerformance } from './motion/fx.ts';
import { resetDemo } from './lib/store.ts';
import { useTheme } from './lib/theme.ts';
import { PRODUCT, WORKSPACE } from './lib/workspace.ts';
import Icon, { type IconName } from './components/Icon.tsx';
import Atmosphere, { type Scene } from './components/Atmosphere.tsx';
import Dashboard from './pages/Dashboard.tsx';
import RandomBreak from './pages/RandomBreak.tsx';
import PytBreak from './pages/PytBreak.tsx';
import WheelPage from './pages/WheelPage.tsx';
import DuckRacePage from './pages/DuckRacePage.tsx';
import ProofPage from './pages/ProofPage.tsx';
import ChecklistsPage from './pages/ChecklistsPage.tsx';
import StreamView from './pages/StreamView.tsx';

interface NavItem { href: string; label: string; short: string; icon: IconName; match: (s: string, id?: string) => boolean }

// Every item points at a route that already exists; grouping is presentation only.
const NAV: { group: string; items: NavItem[] }[] = [
  { group: 'Arena', items: [{ href: '#/', label: 'Dashboard', short: 'Home', icon: 'home', match: (s) => s === '' }] },
  {
    group: 'Breaks',
    items: [
      { href: '#/break/394', label: 'Team draw · #394', short: 'Draw', icon: 'dice', match: (s, id) => s === 'break' && id === '394' },
      { href: '#/break/403', label: 'Pick your team · #403', short: 'Board', icon: 'grid', match: (s, id) => s === 'break' && id === '403' },
    ],
  },
  {
    group: 'Giveaways',
    items: [
      { href: '#/wheel', label: 'Wheel of fortune', short: 'Wheel', icon: 'wheel', match: (s) => s === 'wheel' },
      { href: '#/duck', label: 'Duck race', short: 'Race', icon: 'duck', match: (s) => s === 'duck' },
    ],
  },
  {
    group: 'Vault',
    items: [
      { href: '#/checklists', label: 'Checklists', short: 'Lists', icon: 'list', match: (s) => s === 'checklists' },
      { href: '#/proofs', label: 'Fairness proofs', short: 'Proofs', icon: 'shield', match: (s) => s === 'proofs' || s === 'proof' },
    ],
  },
];
const ALL = NAV.flatMap((g) => g.items);

const TITLES: Record<string, string> = {
  '': 'The Royal Arena', break: 'Break', wheel: 'Wheel of fortune', duck: 'Duck race', checklists: 'Checklists', proofs: 'Fairness proofs', proof: 'Fairness proof',
};
const SCENES: Record<string, Scene> = { '': 'royal', break: 'draft', wheel: 'wheel', duck: 'aqua', proofs: 'crystal', proof: 'crystal', checklists: 'vault' };

/** Highlight that glides to the active item instead of jumping. */
function useIndicator(active: number, deps: unknown[]) {
  const nav = useRef<HTMLElement>(null);
  const [box, setBox] = useState<{ top: number; left: number; w: number; h: number } | null>(null);
  useLayoutEffect(() => {
    const measure = () => {
      const el = nav.current?.querySelectorAll<HTMLElement>('.nv-item')[active];
      setBox(el ? { top: el.offsetTop, left: el.offsetLeft, w: el.offsetWidth, h: el.offsetHeight } : null);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [active, ...deps]);
  return { nav, box };
}

export default function App() {
  const [section = '', id] = useCinematicRoute();
  const { theme, toggle } = useTheme();
  // Presentation-only shell state (not persisted, never touches draw data).
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => { installFx(); watchPerformance(); }, []);

  const active = ALL.findIndex((n) => n.match(section, id));
  const rail = useIndicator(active, [collapsed]);
  const dock = useIndicator(active, []);

  if (section === 'stream') return <StreamView />;

  let page;
  if (section === 'break' && id === '394') page = <RandomBreak />;
  else if (section === 'break' && id === '403') page = <PytBreak />;
  else if (section === 'wheel') page = <WheelPage />;
  else if (section === 'duck') page = <DuckRacePage />;
  else if (section === 'proofs' || section === 'proof') page = <ProofPage id={id} />;
  else if (section === 'checklists') page = <ChecklistsPage />;
  else page = <Dashboard />;

  const crumb = section === 'break' ? `Break #${id}` : section === 'proof' && id ? id : null;

  return (
    <div className={`shell${collapsed ? ' is-collapsed' : ''}`}>
      <Atmosphere scene={SCENES[section] ?? 'royal'} />

      <aside className="rail" aria-label="Main navigation">
        <a href="#/" className="rail-brand" aria-label={`${WORKSPACE.name} ${PRODUCT} home`}>
          <img className="logo-full" src={WORKSPACE.logoFull} alt={WORKSPACE.name} />
          <img className="logo-mark" src={WORKSPACE.logoMark} alt="" />
          <span className="rail-product">{PRODUCT}</span>
        </a>
        <nav className="rail-nav" ref={rail.nav}>
          {rail.box && <span className="nv-glow" style={{ transform: `translate(${rail.box.left}px, ${rail.box.top}px)`, width: rail.box.w, height: rail.box.h }} aria-hidden="true" />}
          {NAV.map((g) => (
            <div key={g.group} className="nv-group">
              <div className="nv-label">{g.group}</div>
              {g.items.map((n) => {
                const on = n.match(section, id);
                return (
                  <a key={n.href} href={n.href} className={`nv-item${on ? ' active' : ''}`} aria-current={on ? 'page' : undefined} data-tip={n.label}>
                    <span className="nv-ic"><Icon name={n.icon} size={20} /></span>
                    <span className="nv-text">{n.label}</span>
                  </a>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="rail-foot">
          <span className="pill pill-quiet rail-sync" title="Shopify connection is simulated in this prototype">
            <span className="dot" /> <span className="nv-text">Shopify · {WORKSPACE.domain}</span>
          </span>
          <button className="icon-btn" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'} aria-expanded={!collapsed}>
            <Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} />
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <a href="#/" className="tb-mark" aria-label="Home"><img src={WORKSPACE.logoMark} alt="" /></a>
          <div className="tb-title">
            <span className="tb-ws">{WORKSPACE.name}</span>
            <Icon name="chevronRight" size={14} />
            <span className={crumb ? 'tb-dim' : ''}>{TITLES[section] ?? 'Dashboard'}</span>
            {crumb && (<><Icon name="chevronRight" size={14} /><span className="mono-inline">{crumb}</span></>)}
          </div>
          <div className="tb-right">
            <button
              className="theme-toggle"
              role="switch"
              aria-checked={theme === 'dark'}
              aria-label="Dark mode"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={toggle}
            >
              <span className="knob"><Icon name={theme === 'dark' ? 'moon' : 'sun'} size={14} /></span>
            </button>
            <button
              className="btn btn-sm btn-ghost"
              title="Clear all draws and start the demo from scratch"
              onClick={() => {
                if (confirm('Reset the demo? All draws and proofs on this device are cleared.')) resetDemo();
              }}
            >
              <Icon name="reset" size={16} /> <span className="hide-sm">Reset demo</span>
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

      <nav className="dock" aria-label="Quick navigation" ref={dock.nav}>
        {dock.box && <span className="nv-glow" style={{ transform: `translate(${dock.box.left}px, ${dock.box.top}px)`, width: dock.box.w, height: dock.box.h }} aria-hidden="true" />}
        {ALL.map((n) => {
          const on = n.match(section, id);
          return (
            <a key={n.href} href={n.href} className={`nv-item${on ? ' active' : ''}`} aria-current={on ? 'page' : undefined} aria-label={n.label}>
              <Icon name={n.icon} size={20} />
              <span>{n.short}</span>
            </a>
          );
        })}
      </nav>
    </div>
  );
}
