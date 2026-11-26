import { useEffect, useState } from 'react';
import { inputsHash } from '../lib/fair.ts';
import type { DrawRecord } from '../lib/store.ts';
import markLogo from '../assets/logo-mark.svg';
import Icon from './Icon.tsx';

export function Steps({ labels, current }: { labels: string[]; current: number }) {
  return (
    <div className="steps">
      {labels.map((l, i) => (
        <div key={l} className={`step${i < current ? ' done' : i === current ? ' now' : ''}`}>
          <i>{i < current ? <Icon name="check" size={13} /> : i + 1}</i>
          {l}
        </div>
      ))}
    </div>
  );
}

export function FairnessPanel({ record, revealed }: { record: DrawRecord | null; revealed: boolean }) {
  return (
    <div className="card">
      <div className="card-head">
        <h3>Fairness</h3>
        {record ? (
          revealed ? <span className="chip chip-good">Verifiable</span> : <span className="chip chip-gold">Sealed</span>
        ) : (
          <span className="chip">Not sealed</span>
        )}
      </div>
      <div className="card-pad" style={{ paddingTop: 6, paddingBottom: 6 }}>
        {!record && (
          <p className="muted" style={{ fontSize: 13.5, margin: '10px 0' }}>
            Sealing locks the buyer list, the team list and a secret random seed before anyone rolls. The fingerprint is
            shown on stream so nothing can be changed afterwards.
          </p>
        )}
        {record && (
          <>
            <div className="kv">
              <label>Draw ID</label>
              <div className="val">
                {record.id}
                {record.replaces && <span className="dim"> · replaces voided {record.replaces}</span>}
              </div>
            </div>
            {record.inputs.shuffles && (
              <div className="kv">
                <label>Shuffle count</label>
                <div className="val">{record.inputs.shuffles}, set by host and locked at seal</div>
              </div>
            )}
            <div className="kv">
              <label>Commitment (shown before roll)</label>
              <div className="val hash gold">{record.commitment}</div>
            </div>
            <div className="kv">
              <label>Inputs fingerprint</label>
              <div className="val hash">{inputsHash(record.inputs)}</div>
            </div>
            <div className="kv">
              <label>Secret seed</label>
              <div className="val">
                {revealed ? <span className="hash">{record.seed}</span> : <span className="lock"><Icon name="lock" size={14} /> Revealed after the results are locked</span>}
              </div>
            </div>
            {revealed && (
              <div style={{ padding: '12px 0' }}>
                <a className="btn btn-sm btn-outline" href={`#/proof/${record.id}`}><Icon name="shield" size={15} /> Open public proof page</a>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function VoidedPanel({ voided }: { voided: DrawRecord[] }) {
  if (voided.length === 0) return null;
  return (
    <div className="card">
      <div className="card-head"><h3>Voided draws</h3><span className="chip chip-void">{voided.length}</span></div>
      <div className="card-pad" style={{ paddingTop: 6, paddingBottom: 6 }}>
        {voided.map((v) => (
          <div key={v.id} className="kv">
            <label>{v.id} · {new Date(v.voided!.at).toLocaleTimeString('nb-NO')}</label>
            <div style={{ fontSize: 13.5 }}>"{v.voided!.reason}"</div>
            <a className="hint" style={{ fontSize: 12.5 }} href={`#/proof/${v.id}`}>Public record →</a>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LogPanel({ log }: { log: { at: number; text: string }[] }) {
  return (
    <div className="card">
      <div className="card-head"><h3>Audit log</h3><span className="dim mono">{log.length} events</span></div>
      <div className="card-pad log" style={{ paddingTop: 4, paddingBottom: 4 }}>
        {log.length === 0 && <p className="dim" style={{ margin: '10px 0' }}>Every step is time-stamped here.</p>}
        {log.map((l, i) => (
          <div key={log.length - i}>
            <time>{new Date(l.at).toLocaleTimeString('nb-NO')}</time>
            <span>{l.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Neutral crest fallback: a shield outline with the team's initials (no real crests are bundled). */
function crestInitials(team: string) {
  const base = team.split(' - ')[0];
  const words = base.split(/\s+/).filter((w) => /[A-Za-zÀ-ÿ0-9]/.test(w));
  return (words.length === 1 ? words[0].slice(0, 3) : words.slice(0, 3).map((w) => w[0]).join('')).toUpperCase();
}

/**
 * Trading-card reveal of who got what. Cards flip in a quick stagger so the whole
 * set settles in about two seconds whatever the count; every card is treated alike.
 */
export function RevealGrid({ pairs }: { pairs: { who: string; what: string; n: number }[] }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    setShown(0);
    const step = Math.max(40, Math.min(180, 1100 / Math.max(pairs.length, 1)));
    const t = window.setInterval(() => setShown((s) => (s >= pairs.length ? s : s + 1)), step);
    return () => clearInterval(t);
  }, [pairs]);
  return (
    <div className="reveal" aria-live="polite">
      {pairs.map((p, i) => (
        <div key={i} className={`rcard${i < shown ? ' flipped' : ''}`} aria-label={`#${p.n} ${p.what}: ${p.who}`} data-tilt>
          <div className="rcard-inner">
            <div className="rcard-face rcard-back" aria-hidden="true"><img src={markLogo} alt="" /></div>
            <div className="rcard-face rcard-front">
              <div className="rc-in">
                <span className="rc-foil" aria-hidden="true" />
                <span className="rc-glare" aria-hidden="true" />
                <div className="rc-top">
                  <span className="rc-num">#{String(p.n).padStart(2, '0')}</span>
                  <img className="rc-brand" src={markLogo} alt="" />
                </div>
                <div className="rc-crest" aria-hidden="true">
                  <svg viewBox="0 0 60 66"><path d="M30 2 56 10v22c0 16-11 27-26 32C15 59 4 48 4 32V10z" fill="rgba(212,181,109,.08)" stroke="rgba(212,181,109,.6)" strokeWidth="1.5" /><path d="M30 8 50 14v18c0 12-8 21-20 25-12-4-20-13-20-25V14z" fill="none" stroke="rgba(212,181,109,.25)" /></svg>
                  <span>{crestInitials(p.what)}</span>
                </div>
                <span className="rc-team">{p.what}</span>
                <span className="rc-rule" />
                <span className="rc-buyer">{p.who}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
