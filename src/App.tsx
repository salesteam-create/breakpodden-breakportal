import { useRoute } from './lib/router.ts';
import { resetDemo } from './lib/store.ts';
import { useTheme } from './lib/theme.ts';
import logo from './assets/logo-full.svg';
import Dashboard from './pages/Dashboard.tsx';
import RandomBreak from './pages/RandomBreak.tsx';
import PytBreak from './pages/PytBreak.tsx';
import WheelPage from './pages/WheelPage.tsx';
import DuckRacePage from './pages/DuckRacePage.tsx';
import ProofPage from './pages/ProofPage.tsx';
import ChecklistsPage from './pages/ChecklistsPage.tsx';
import StreamView from './pages/StreamView.tsx';

const ANNOUNCE = ['Breaks every Tuesday', 'Provably fair draws', 'New cards & boxes', 'Live pulls', 'Football cards', 'Join the break'];

const NAV = [
  { href: '#/', label: 'Breaks', match: ['', 'break'] },
  { href: '#/wheel', label: 'Wheel of fortune', match: ['wheel'] },
  { href: '#/duck', label: 'Duck race', match: ['duck'] },
  { href: '#/checklists', label: 'Checklists', match: ['checklists'] },
  { href: '#/proofs', label: 'Fairness proofs', match: ['proofs', 'proof'] },
];

export default function App() {
  const [section = '', id] = useRoute();
  const { theme, toggle } = useTheme();

  if (section === 'stream') return <StreamView />;

  let page;
  if (section === 'break' && id === '394') page = <RandomBreak />;
  else if (section === 'break' && id === '403') page = <PytBreak />;
  else if (section === 'wheel') page = <WheelPage />;
  else if (section === 'duck') page = <DuckRacePage />;
  else if (section === 'proofs' || section === 'proof') page = <ProofPage id={id} />;
  else if (section === 'checklists') page = <ChecklistsPage />;
  else page = <Dashboard />;

  return (
    <>
      <div className="announce" aria-hidden="true">
        <div className="announce-track">
          {[0, 1, 2, 3].flatMap((k) => ANNOUNCE.map((a) => (
            <span key={`${k}-${a}`} className="row" style={{ gap: 20 }}>{a}<i className="star" /></span>
          )))}
        </div>
      </div>
      <header className="topbar">
        <a href="#/" className="brand">
          <img src={logo} alt="Breakpodden" />
          <span className="brand-name">Break<br />Portal</span>
        </a>
        <nav className="nav">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className={n.match.includes(section) ? 'active' : ''}>
              {n.label}
            </a>
          ))}
        </nav>
        <div className="topbar-right">
          <span className="pill"><span className="dot" /> Shopify connected · breakpodden.com</span>
          <button
            className="theme-toggle"
            role="switch"
            aria-checked={theme === 'dark'}
            aria-label="Dark mode"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={toggle}
          >
            <svg className="ico sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
            <svg className="ico moon" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
            <span className="knob">
              {theme === 'dark' ? (
                <svg viewBox="0 0 24 24" fill="#fff"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
              )}
            </span>
          </button>
          <button
            className="btn btn-sm btn-ghost"
            title="Clear all draws and start the demo from scratch"
            onClick={() => {
              if (confirm('Reset the demo? All draws and proofs on this device are cleared.')) resetDemo();
            }}
          >
            ↺ Reset demo
          </button>
          <span className="avatar" title="Host">BP</span>
        </div>
      </header>
      <main className="page" key={`${section}/${id ?? ''}`}>{page}</main>
      <footer className="site-footer">
        <div className="inner">
          <div className="stack" style={{ gap: 20 }}>
            <span className="eyebrow" style={{ color: 'var(--gold)' }}>Break Portal</span>
            <h2>Every draw.<br />Provably fair.</h2>
          </div>
          <img src={logo} alt="Breakpodden" />
          <div className="legal">
            <span>© 2026 Breakpodden AS · Prototype · sample buyers are invented · Shopify connection simulated</span>
            <span>breakpodden.com</span>
          </div>
        </div>
      </footer>
    </>
  );
}
