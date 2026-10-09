import { useEffect, useState } from 'react';
import { useStream } from '../lib/store.ts';
import logoFull from '../assets/logo-full.svg';
import logoMark from '../assets/logo-mark.svg';
import ShuffleBoard from '../components/ShuffleBoard.tsx';
import Dice from '../components/Dice.tsx';
import Wheel from '../components/Wheel.tsx';
import DuckRace from '../components/DuckRace.tsx';

const MAX_ROWS = 18;

/** Chrome-free 1920x1080 view for OBS/Streamlabs window capture, scaled to the window. */
export default function StreamView() {
  const s = useStream();
  const [scale, setScale] = useState(1);
  const [green, setGreen] = useState(false);
  const [rollId, setRollId] = useState(0);

  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const diceKey = s.kind === 'shuffle' && s.dice ? s.dice.join('-') + s.commitment : '';
  useEffect(() => {
    if (diceKey) setRollId((n) => n + 1);
  }, [diceKey]);

  let body;
  let title = 'Break Portal';
  let subtitle = 'Waiting for the next draw';
  let commitment = '';

  if (s.kind === 'shuffle') {
    title = s.title;
    subtitle = s.subtitle;
    commitment = s.commitment;
    const rows = Math.min(Math.max(s.left.length, s.order.length), MAX_ROWS);
    const rowH = Math.min(52, (720 - 8 * (rows - 1)) / rows);
    body = (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 40, flex: 1, minHeight: 0 }}>
        <div style={{ overflow: 'hidden' }}>
          <ShuffleBoard
            left={s.left.slice(0, MAX_ROWS)}
            order={s.order.slice(0, MAX_ROWS)}
            leftLabel={s.leftLabel}
            rightLabel={s.rightLabel}
            shuffling={s.phase === 'shuffling'}
            done={s.phase === 'revealed'}
            winTop={s.highlightTop}
            rowH={rowH / 1.5}
            scale={1.5}
          />
        </div>
        <div className="stack" style={{ gap: 28, justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          {s.phase === 'ready' && <h2 style={{ fontSize: 40, color: 'var(--muted)' }}>Preparing the draw</h2>}
          {s.phase !== 'ready' && (s.dice || s.totalRounds === 0) && (
            <div style={{ transform: 'scale(1.9)', margin: '40px 0' }}>
              <Dice values={s.dice} rollId={rollId} showTotal={s.phase !== 'sealed' && s.phase !== 'rolling'} />
            </div>
          )}
          {s.phase !== 'ready' && !s.dice && s.totalRounds > 0 && (
            <div className="dice-total" style={{ fontSize: 96 }}>{s.totalRounds}<small style={{ fontSize: 20 }}>shuffles set by host</small></div>
          )}
          {s.phase === 'sealed' && <h2 style={{ fontSize: 40 }}>Draw sealed. Rolling next</h2>}
          {(s.phase === 'shuffling' || s.phase === 'rolling') && s.totalRounds > 0 && (
            <>
              <h2 style={{ fontSize: 44 }}>{s.phase === 'rolling' ? 'Rolling' : `Shuffle ${s.round} / ${s.totalRounds}`}</h2>
              <div className="round-meter" style={{ transform: 'scale(1.8)' }}>
                {Array.from({ length: s.totalRounds }, (_, i) => <span key={i} className={i < s.round ? 'on' : ''} />)}
              </div>
            </>
          )}
          {s.phase === 'revealed' && <h2 style={{ fontSize: 52, color: 'var(--gold-hi)' }}>Results locked</h2>}
        </div>
      </div>
    );
  } else if (s.kind === 'wheel') {
    title = s.title;
    subtitle = s.subtitle;
    commitment = s.commitment;
    body = (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 560px', gap: 40, alignItems: 'center', flex: 1 }}>
        <div style={{ display: 'grid', placeItems: 'center' }}>
          <Wheel entries={s.entries} rotation={s.rotation} size={720} spinning={s.spinning} />
        </div>
        <div>
          {s.winner ? (
            <div className="winner-banner" style={{ padding: 40 }}>
              <span className="eyebrow" style={{ fontSize: 20 }}>Winner</span>
              <b style={{ fontSize: 72 }}>{s.winner}</b>
            </div>
          ) : (
            <h2 style={{ fontSize: 56, color: 'var(--muted)' }}>{s.spinning ? 'Spinning…' : 'Get ready'}</h2>
          )}
        </div>
      </div>
    );
  } else if (s.kind === 'duck') {
    title = s.title;
    subtitle = s.subtitle;
    commitment = s.commitment;
    body = (
      <div style={{ flex: 1, minHeight: 0 }}>
        <DuckRace ducks={s.ducks} order={s.order} duration={s.duration} startedAt={s.startedAt} height={690} fontScale={1.4} />
      </div>
    );
  } else {
    body = (
      <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
        <img src={logoFull} alt="Breakpodden" style={{ height: 420 }} />
      </div>
    );
  }

  return (
    <div className={`stream-root${green ? ' green' : ''}`}>
      <div className="stream-controls">
        <button className="btn btn-sm" onClick={() => setGreen(!green)}>{green ? 'Dark background' : 'Green screen'}</button>
      </div>
      <div className="stream-stage" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        <div className="stream-frame">
          <div className="stream-head">
            <img src={logoMark} alt="" />
            <div>
              <h1>{title}</h1>
              <div className="sub">{subtitle}</div>
            </div>
          </div>
          {body}
          <div className="stream-foot">
            <span>🔒 Provably fair{commitment && <> · commitment <span className="mono gold">{commitment.slice(0, 16)}…</span></>}</span>
            <span>breakpodden.com</span>
          </div>
        </div>
      </div>
    </div>
  );
}
