import { useEffect, useState } from 'react';
import { useStream } from '../lib/store.ts';
import logoFull from '../assets/logo-full.svg';
import logoMark from '../assets/logo-mark.svg';
import ShuffleBoard from '../components/ShuffleBoard.tsx';
import Dice from '../components/Dice.tsx';
import Wheel from '../components/Wheel.tsx';
import DuckRace from '../components/DuckRace.tsx';
import Icon from '../components/Icon.tsx';
import { Sparks } from '../components/Art.tsx';
import { BREAKS } from '../lib/data.ts';
import markLogo from '../assets/logo-mark.svg';

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
  let scene = 'idle';
  let title = 'Break Portal';
  let subtitle = 'Waiting for the next draw';
  let commitment = '';

  if (s.kind === 'shuffle') {
    title = s.title;
    subtitle = s.subtitle;
    commitment = s.commitment;
    const rows = Math.min(Math.max(s.left.length, s.order.length), MAX_ROWS);
    const rowH = Math.min(52, (720 - 8 * (rows - 1)) / rows);
    const pad = (n: number) => String(n).padStart(2, '0');
    // Product art for the pre-draw showcase, matched from the break number in the published title.
    const brk = BREAKS.find((b) => s.title.includes(`#${b.number}`));
    const filler = s.highlightTop !== undefined;
    // Final cards straight from the published state: team draw = buyer gets team; filler = open team goes to entry.
    const cards = (filler ? s.order.slice(0, s.highlightTop) : s.order)
      .slice(0, MAX_ROWS)
      .map((o, i) => (filler ? { what: s.left[i], who: o } : { what: o, who: s.left[i] }));
    const cols = cards.length <= 6 ? Math.max(cards.length, 3) : 6;
    scene = s.phase === 'ready' || s.phase === 'sealed' ? 'showcase' : s.phase === 'revealed' ? 'results' : 'draw';
    if (scene === 'showcase') body = (
      <div className="stream-showcase">
        <div className="ss-art">{brk && <img src={brk.image} alt="" />}</div>
        <div className="ss-copy">
          <span className="ss-tag">{s.phase === 'sealed' ? <><Icon name="lock" size={24} /> Sealed · rolling next</> : 'Preparing the draw'}</span>
          <h2>{brk ? brk.title : s.title}</h2>
          <p>{s.left.length} {filler ? 'open teams' : 'spots'} · {s.order.length} {filler ? 'filler entries' : 'teams'}{s.totalRounds ? ` · ${s.totalRounds} shuffles set by host` : ''}</p>
        </div>
      </div>
    );
    else if (scene === 'results') body = (
      <div className="stream-cards" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {cards.map((c, i) => (
          <div key={i} className="rcard flipped" style={{ animation: `riseIn .6s var(--ease-reveal) ${Math.min(i * 40, 700)}ms both` }}>
            <div className="rcard-inner">
              <div className="rcard-face rcard-front">
                <div className="rc-in">
                  <span className="rc-foil" aria-hidden="true" />
                  <div className="rc-top"><span className="rc-num">#{pad(i + 1)}</span><img className="rc-brand" src={markLogo} alt="" /></div>
                  <span className="rc-team" style={{ marginTop: 'auto' }}>{c.what}</span>
                  <span className="rc-rule" />
                  <span className="rc-buyer">{c.who}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
    else body = (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 520px', gap: 56, flex: 1, minHeight: 0 }}>
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
          {s.phase === 'ready' && <h2 style={{ fontSize: 48, color: 'var(--text-secondary)' }}>Preparing the draw</h2>}
          {s.phase !== 'ready' && (s.dice || s.totalRounds === 0) && (
            <div style={{ transform: 'scale(1.9)', margin: '40px 0' }}>
              <Dice values={s.dice} rollId={rollId} showTotal={s.phase !== 'sealed' && s.phase !== 'rolling'} />
            </div>
          )}
          {s.phase !== 'ready' && !s.dice && s.totalRounds > 0 && (
            <div className="dice-total" style={{ fontSize: 140, lineHeight: '130px' }}>{s.totalRounds}<small style={{ fontSize: 22, lineHeight: '30px' }}>shuffles set by host</small></div>
          )}
          {s.phase === 'sealed' && <h2 style={{ fontSize: 52 }}><Icon name="lock" size={40} className="inline-ico" /> Draw sealed. Rolling next</h2>}
          {(s.phase === 'shuffling' || s.phase === 'rolling') && s.totalRounds > 0 && (
            <>
              {s.phase === 'rolling' ? (
                <h2 style={{ fontSize: 64 }}>Rolling</h2>
              ) : (
                <span className="round-count">Round <em>{pad(s.round)}</em> <small>/ {pad(s.totalRounds)}</small></span>
              )}
              <div className="round-meter">
                {Array.from({ length: s.totalRounds }, (_, i) => <span key={i} className={i < s.round ? 'on' : ''} />)}
              </div>
            </>
          )}
          {s.phase === 'revealed' && <h2 style={{ fontSize: 72, color: 'var(--brand-highlight)' }}>Results locked</h2>}
        </div>
      </div>
    );
  } else if (s.kind === 'wheel') {
    title = s.title;
    subtitle = s.subtitle;
    commitment = s.commitment;
    scene = s.winner ? 'wheel-win' : 'wheel';
    body = (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 600px', gap: 40, alignItems: 'center', flex: 1 }}>
        <div style={{ display: 'grid', placeItems: 'center' }}>
          <Wheel entries={s.entries} rotation={s.rotation} size={720} spinning={s.spinning} />
        </div>
        <div>
          {s.winner ? (
            <div className="winner-banner" key={s.winner} style={{ padding: '48px 40px 52px' }}>
              <span className="eyebrow" style={{ fontSize: 24, lineHeight: '30px' }}>Winner</span>
              <b style={{ fontSize: 96, lineHeight: '96px', marginTop: 14 }}>{s.winner}</b>
              <Sparks n={26} />
            </div>
          ) : (
            <h2 style={{ fontSize: 72, color: 'var(--text-secondary)' }}>{s.spinning ? 'Spinning…' : 'Get ready'}</h2>
          )}
        </div>
      </div>
    );
  } else if (s.kind === 'duck') {
    title = s.title;
    subtitle = s.subtitle;
    commitment = s.commitment;
    scene = 'duck';
    body = (
      <div style={{ flex: 1, minHeight: 0 }}>
        <DuckRace ducks={s.ducks} order={s.order} duration={s.duration} startedAt={s.startedAt} height={690} fontScale={1.4} />
      </div>
    );
  } else {
    body = (
      <div className="stream-idle">
        <div>
          <img src={logoFull} alt="Breakpodden" />
          <p>{subtitle}</p>
        </div>
      </div>
    );
  }

  // Badge text comes straight from the published draw state, never decoration.
  const status: { label: string; active: boolean } | null =
    s.kind === 'shuffle'
      ? { ready: { label: 'Preparing', active: false }, sealed: { label: 'Sealed', active: false }, rolling: { label: 'Rolling', active: true }, shuffling: { label: 'Shuffling', active: true }, revealed: { label: 'Results locked', active: false } }[s.phase]
      : s.kind === 'wheel'
        ? s.spinning ? { label: 'Spinning', active: true } : s.winner ? { label: 'Winner drawn', active: false } : { label: s.commitment ? 'Sealed' : 'Preparing', active: false }
        : s.kind === 'duck'
          ? s.startedAt !== null ? { label: 'Race', active: false } : { label: s.commitment ? 'Sealed' : 'Line-up', active: false }
          : null;

  return (
    <div className={`stream-root${green ? ' green' : ''}`}>
      <div className="stream-controls">
        <button className="btn btn-sm btn-secondary" onClick={() => setGreen(!green)}>{green ? 'Dark background' : 'Green screen'}</button>
      </div>
      <div className="stream-stage" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        <div className="stream-frame">
          <div className="stream-head">
            <img src={logoMark} alt="" />
            <div>
              <h1>{title}</h1>
              <div className="sub">{subtitle}</div>
            </div>
            {status && <span className={`live-badge${status.active ? '' : ' quiet'}`}>{status.active && <span className="live-dot" />}{status.label}</span>}
          </div>
          <div className="scene" key={scene}>{body}</div>
          <div className="stream-foot">
            <span><Icon name="shield" size={24} />Provably fair{commitment && <> · commitment <span className="mono gold">{commitment.slice(0, 16)}…</span></>}</span>
            <span>breakpodden.com</span>
          </div>
        </div>
      </div>
    </div>
  );
}
