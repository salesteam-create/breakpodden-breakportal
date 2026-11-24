import { useEffect, useState } from 'react';
import { useRoute } from './lib/router.ts';
import { resetDemo } from './lib/store.ts';
import { useTheme } from './lib/theme.ts';
import { PRODUCT, WORKSPACE } from './lib/workspace.ts';
import Icon, { type IconName } from './components/Icon.tsx';
import Dashboard from './pages/Dashboard.tsx';
import RandomBreak from './pages/RandomBreak.tsx';
import PytBreak from './pages/PytBreak.tsx';
import WheelPage from './pages/WheelPage.tsx';
import DuckRacePage from './pages/DuckRacePage.tsx';
import ProofPage from './pages/ProofPage.tsx';
import ChecklistsPage from './pages/ChecklistsPage.tsx';
import StreamView from './pages/StreamView.tsx';

interface NavItem { href: string; label: string; icon: IconName; match: (s: string, id?: string) => boolean }

// Every item points at a route that already exists; grouping is presentation only.
const NAV: { group: string; items: NavItem[] }[] = [
  { group: 'Workspace', items: [{ href: '#/', label: 'Dashboard', icon: 'home', match: (s) => s === '' }] },
  {
    group: 'Breaks',
    items: [
      { href: '#/break/394', label: 'Team draw · #394', icon: 'dice', match: (s, id) => s === 'break' && id === '394' },
      { href: '#/break/403', label: 'Pick your team · #403', icon: 'grid', match: (s, id) => s === 'break' && id === '403' },
    ],
  },
  {
    group: 'Giveaways',
    items: [
      { href: '#/wheel', label: 'Wheel of fortune', icon: 'wheel', match: (s) => s === 'wheel' },
      { href: '#/duck', label: 'Duck race', icon: 'duck', match: (s) => s === 'duck' },
    ],
  },
  {
    group: 'Library',
    items: [
      { href: '#/checklists', label: 'Checklists', icon: 'list', match: (s) => s === 'checklists' },
      { href: '#/proofs', label: 'Fairness proofs', icon: 'shield', match: (s) => s === 'proofs' || s === 'proof' },
    ],
  },
];

const TITLES: Record<string, string> = {
  '': 'Dashboard', break: 'Break', wheel: 'Wheel of fortune', duck: 'Duck race', checklists: 'Checklists', proofs: 'Fairness proofs', proof: 'Fairness proof',
};

export default function App() {
  const [section = '', id] = useRoute();
  const { theme, toggle } = useTheme();
  // Presentation-only shell state (not persisted, never touches draw data).
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  useEffect(() => setDrawer(false), [section, id]);

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
    <div className={`shell${collapsed ? ' is-collapsed' : ''}${drawer ? ' drawer-open' : ''}`}>
      <aside className="sidebar" aria-label="Main navigation">
        <div className="sb-brand">
          <a href="#/" className="sb-logo" aria-label={`${WORKSPACE.name} ${PRODUCT} home`}>
            <img className="logo-full" src={WORKSPACE.logoFull} alt={WORKSPACE.name} />
            <img className="logo-mark" src={WORKSPACE.logoMark} alt="" />
          </a>
          <button className="icon-btn sb-close" onClick={() => setDrawer(false)} aria-label="Close menu"><Icon name="close" /></button>
        </div>
        <div className="sb-product"><span>{PRODUCT}</span></div>
        <nav className="sb-nav">
          {NAV.map((g) => (
            <div key={g.group} className="sb-group">
              <div className="sb-label">{g.group}</div>
              {g.items.map((n) => {
                const active = n.match(section, id);
                return (
                  <a key={n.href} href={n.href} className={`sb-item${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined} title={collapsed ? n.label : undefined}>
                    <Icon name={n.icon} size={20} />
                    <span className="sb-text">{n.label}</span>
                  </a>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="sb-foot">
          <span className="pill pill-quiet" title="Shopify connection is simulated in this prototype">
            <span className="dot" /> <span className="sb-text">Shopify · {WORKSPACE.domain}</span>
          </span>
          <button className="icon-btn sb-collapse" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'} aria-expanded={!collapsed}>
            <Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} />
          </button>
        </div>
      </aside>
      <div className="scrim" onClick={() => setDrawer(false)} aria-hidden="true" />

      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setDrawer(true)} aria-label="Open menu"><Icon name="menu" /></button>
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
    </div>
  );
}
