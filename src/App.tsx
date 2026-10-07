import { useRoute } from './lib/router.ts';
import logo from './assets/logo-mark.svg';
import Dashboard from './pages/Dashboard.tsx';
import RandomBreak from './pages/RandomBreak.tsx';
import PytBreak from './pages/PytBreak.tsx';
import WheelPage from './pages/WheelPage.tsx';
import DuckRacePage from './pages/DuckRacePage.tsx';
import ProofPage from './pages/ProofPage.tsx';
import StreamView from './pages/StreamView.tsx';

const NAV = [
  { href: '#/', label: 'Breaks', match: ['', 'break'] },
  { href: '#/wheel', label: 'Wheel of fortune', match: ['wheel'] },
  { href: '#/duck', label: 'Duck race', match: ['duck'] },
  { href: '#/proofs', label: 'Fairness proofs', match: ['proofs', 'proof'] },
];

export default function App() {
  const [section = '', id] = useRoute();

  if (section === 'stream') return <StreamView />;

  let page;
  if (section === 'break' && id === '394') page = <RandomBreak />;
  else if (section === 'break' && id === '403') page = <PytBreak />;
  else if (section === 'wheel') page = <WheelPage />;
  else if (section === 'duck') page = <DuckRacePage />;
  else if (section === 'proofs' || section === 'proof') page = <ProofPage id={id} />;
  else page = <Dashboard />;

  return (
    <>
      <header className="topbar">
        <a href="#/" className="brand">
          <img src={logo} alt="Breakpodden" />
          <span className="brand-name">Break Portal<small>Breakpodden</small></span>
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
          <span className="avatar" title="Host">BP</span>
        </div>
      </header>
      <main className="page" key={`${section}/${id ?? ''}`}>{page}</main>
    </>
  );
}
