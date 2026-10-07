import { useEffect, useState } from 'react';
import { inputsHash } from '../lib/fair.ts';
import type { DrawRecord } from '../lib/store.ts';
import markLogo from '../assets/logo-mark.svg';

export function Steps({ labels, current }: { labels: string[]; current: number }) {
  return (
    <div className="steps">
      {labels.map((l, i) => (
        <div key={l} className={`step${i < current ? ' done' : i === current ? ' now' : ''}`}>
          <i>{i < current ? '✓' : i + 1}</i>
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
              <div className="val">{record.id}</div>
            </div>
            <div className="kv">
              <label>Commitment (shown before roll)</label>
              <div className="val gold">{record.commitment}</div>
            </div>
            <div className="kv">
              <label>Inputs fingerprint</label>
              <div className="val">{inputsHash(record.inputs)}</div>
            </div>
            <div className="kv">
              <label>Secret seed</label>
              <div className="val">
                {revealed ? record.seed : <span className="lock">🔒 Revealed after the results are locked</span>}
              </div>
            </div>
            {revealed && (
              <div style={{ padding: '12px 0' }}>
                <a className="btn btn-sm" href={`#/proof/${record.id}`}>Open public proof page →</a>
              </div>
            )}
          </>
        )}
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

/** Card-style reveal of who got what, flipping one card at a time. */
export function RevealGrid({ pairs }: { pairs: { who: string; what: string; n: number }[] }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    setShown(0);
    const t = window.setInterval(() => setShown((s) => (s >= pairs.length ? s : s + 1)), 180);
    return () => clearInterval(t);
  }, [pairs]);
  return (
    <div className="reveal">
      {pairs.map((p, i) => (
        <div key={i} className={`rcard${i < shown ? ' flipped' : ''}`}>
          <div className="rcard-inner">
            <div className="rcard-face rcard-back"><img src={markLogo} alt="" /></div>
            <div className="rcard-face rcard-front">
              <span className="num">#{String(p.n).padStart(2, '0')}</span>
              <span className="what">{p.what}</span>
              <span className="who">{p.who}</span>
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
