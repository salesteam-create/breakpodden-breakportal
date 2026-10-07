import { useMemo, useState } from 'react';
import { commitmentFor, inputsHash, orderHash, runRace, runShuffleDraw, runWheel, type DrawInputs } from '../lib/fair.ts';
import { getDraw, listDraws, type DrawRecord } from '../lib/store.ts';

const KIND_LABEL: Record<string, string> = { team: 'Team draw', filler: 'Filler draw', wheel: 'Wheel of fortune', duck: 'Duck race' };

function recompute(d: DrawRecord, inputs: DrawInputs) {
  if (inputs.kind === 'wheel') return { dice: null, rounds: [], final: runWheel(d.seed, inputs.right, d.spins ?? 0).map((w) => w.name) };
  if (inputs.kind === 'duck') return { dice: null, rounds: [], final: runRace(d.seed, inputs.right) };
  return runShuffleDraw(d.seed, inputs);
}

function Check({ ok, title, detail }: { ok: boolean; title: string; detail: string }) {
  return (
    <div className={`check ${ok ? 'ok' : 'bad'}`}>
      <span className="ic">{ok ? '✓' : '✕'}</span>
      <div>
        <div style={{ fontWeight: 600 }}>{title}</div>
        <div className="mono dim" style={{ wordBreak: 'break-all' }}>{detail}</div>
      </div>
      <span className={`chip ${ok ? 'chip-good' : ''}`}>{ok ? 'Match' : 'Mismatch'}</span>
    </div>
  );
}

function ProofDetail({ d }: { d: DrawRecord }) {
  const [tampered, setTampered] = useState(false);
  // Tamper test: swap two names in the inputs to show the commitment check failing.
  const inputs = useMemo<DrawInputs>(() => {
    if (!tampered || d.inputs.right.length < 2) return d.inputs;
    const r = d.inputs.right.slice();
    [r[0], r[1]] = [r[1], r[0]];
    return { ...d.inputs, right: r };
  }, [d, tampered]);

  if (!d.revealed) {
    return (
      <div className="card card-pad">
        <h2>{d.title}</h2>
        <p className="muted">This draw is sealed and still in progress. The seed is revealed when the results are locked.</p>
        <div className="kv"><label>Commitment</label><div className="val gold">{d.commitment}</div></div>
      </div>
    );
  }

  const re = recompute(d, inputs);
  const commitOk = commitmentFor(d.seed, inputs) === d.commitment;
  // A draw voided before its reveal has no published result to compare against.
  const hasResult = d.result !== undefined;
  const resultOk = !hasResult || JSON.stringify(re.final) === JSON.stringify(d.result);
  const choose = inputs.mode === 'choose';
  const isShuffle = inputs.kind === 'team' || inputs.kind === 'filler';
  const pairs =
    inputs.kind === 'team' ? inputs.left.map((l, i) => [l, re.final[i]])
    : inputs.kind === 'filler' && choose ? inputs.left.map((_, i) => [`Pick #${i + 1}`, re.final[i]])
    : inputs.kind === 'filler' ? inputs.left.map((l, i) => [l, re.final[i]])
    : re.final.map((w, i) => [`${i + 1}`, w]);

  return (
    <div className="workspace">
      <div className="stack" style={{ gap: 20 }}>
        <div className="card">
          <div className="card-head">
            <div>
              <div className="eyebrow">{KIND_LABEL[d.inputs.kind]} · {d.id}</div>
              <h2 style={{ marginTop: 6 }}>{d.title}</h2>
            </div>
            <div className="row">
              {d.voided && <span className="chip chip-void">Voided</span>}
              {commitOk && resultOk ? <span className="chip chip-good">Verified fair</span> : <span className="chip" style={{ color: '#ff8a8a' }}>Verification failed</span>}
            </div>
          </div>
          {d.voided && (
            <div className="card-pad" style={{ paddingBottom: 0 }}>
              <div className="warn-box">
                Voided by the host at {new Date(d.voided.at).toLocaleTimeString('nb-NO')}: "{d.voided.reason}". The seed is still published so
                anyone can confirm the voided draw was genuine.
              </div>
            </div>
          )}
          {d.replaces && (
            <div className="card-pad" style={{ paddingBottom: 0 }}>
              <span className="muted" style={{ fontSize: 13.5 }}>This draw replaces voided draw <a className="gold" href={`#/proof/${d.replaces}`}>{d.replaces}</a>.</span>
            </div>
          )}
          <div className="card-pad" style={{ paddingTop: 4 }}>
            <Check ok={commitOk} title="Commitment matches the seed and the locked lists" detail={`SHA-256(seed | inputs) = ${commitmentFor(d.seed, inputs).slice(0, 32)}…`} />
            {isShuffle && re.dice && (
              <Check ok title={`Dice recomputed: ${re.dice[0]} + ${re.dice[1]} = ${re.rounds.length} shuffles`} detail={`Derived from SHA-256(seed:dice:0)`} />
            )}
            {isShuffle && !re.dice && (
              <Check ok title={`Fixed shuffle count: ${re.rounds.length}`} detail="Set by the host and locked into the commitment before the draw" />
            )}
            {hasResult ? (
              <Check ok={resultOk} title="Result recomputed from the seed matches the published result" detail={`Result fingerprint ${orderHash(re.final)}`} />
            ) : (
              <div className="check"><span className="ic">–</span><div><div style={{ fontWeight: 600 }}>No result was published</div><div className="mono dim">Voided before the reveal</div></div><span className="chip">n/a</span></div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Result</h3><span className="dim mono">recomputed in your browser</span></div>
          <div style={{ maxHeight: 520, overflowY: 'auto' }}>
            <table className="plain">
              <thead>
                <tr>
                  <th>{isShuffle ? '#' : 'Place'}</th>
                  {isShuffle && <th>{inputs.kind === 'team' ? 'Buyer' : choose ? 'Pick order' : 'Open team'}</th>}
                  <th>{inputs.kind === 'team' ? 'Team' : inputs.kind === 'filler' ? 'Winning entry' : inputs.kind === 'duck' ? 'Duck' : 'Winner'}</th>
                </tr>
              </thead>
              <tbody>
                {pairs.map((p, i) => (
                  <tr key={i}>
                    <td className="mono dim">{i + 1}</td>
                    {isShuffle && <td>{p[0]}</td>}
                    <td className="gold">{p[1]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {d.picks && d.picks.length > 0 && (
          <div className="card">
            <div className="card-head"><h3>Teams chosen by the winners</h3><span className="dim mono">in winning order</span></div>
            <table className="plain">
              <tbody>
                {d.picks.map((p, i) => (
                  <tr key={i}><td className="mono dim">{i + 1}</td><td>{p.entry}</td><td className="gold">{p.team}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isShuffle && (
          <div className="card">
            <div className="card-head"><h3>Every shuffle round</h3></div>
            <div className="card-pad">
              {re.rounds.map((r, i) => (
                <div key={i} className="spread" style={{ padding: '6px 0', borderBottom: '1px solid var(--line)', fontSize: 13.5 }}>
                  <span>Round {i + 1} · first in list: <b>{r[0]}</b></span>
                  <span className="mono dim">order {orderHash(r)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="side">
        <div className="card">
          <div className="card-head"><h3>Published values</h3></div>
          <div className="card-pad" style={{ paddingTop: 4, paddingBottom: 4 }}>
            <div className="kv"><label>Commitment (before draw)</label><div className="val gold">{d.commitment}</div></div>
            <div className="kv"><label>Seed (after draw)</label><div className="val">{d.seed}</div></div>
            <div className="kv"><label>Inputs fingerprint</label><div className="val">{inputsHash(inputs)}</div></div>
            <div className="kv"><label>Entries</label><div className="val">{d.inputs.left.length ? `${d.inputs.left.length} + ` : ''}{d.inputs.right.length}</div></div>
          </div>
        </div>
        <div className="card card-pad stack">
          <h3>How to check it yourself</h3>
          <div className="formula">{`commitment = SHA-256(seed + "|" + SHA-256(inputs))
random     = SHA-256(seed:label:counter)
dice       = label "dice"
round r    = Fisher-Yates, label "round-r"
wheel spin = label "spin-k"
duck race  = label "race"`}</div>
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            The commitment is shown on stream before the dice roll. Because SHA-256 cannot be reversed, nobody can know or
            change the outcome after that point.
          </p>
          <button className={`btn btn-sm${tampered ? ' btn-gold' : ''}`} onClick={() => setTampered(!tampered)}>
            {tampered ? 'Undo tamper test' : 'Tamper test: swap two names'}
          </button>
          <button
            className="btn btn-sm"
            onClick={() => {
              const a = document.createElement('a');
              a.href = URL.createObjectURL(new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' }));
              a.download = `${d.id}-proof.json`;
              a.click();
            }}
          >
            Download proof (JSON)
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProofPage({ id }: { id?: string }) {
  const d = id ? getDraw(id) : null;
  if (id && d) {
    return (
      <>
        <a href="#/proofs" className="muted" style={{ fontSize: 13 }}>← All proofs</a>
        <div style={{ height: 16 }} />
        <ProofDetail d={d} />
      </>
    );
  }
  const draws = listDraws();
  return (
    <>
      <div className="eyebrow">Public</div>
      <h1 style={{ marginTop: 6, marginBottom: 8 }}>Fairness proofs</h1>
      <p className="muted" style={{ marginTop: 0, maxWidth: 640 }}>
        Every draw gets a public page. Viewers can recompute the dice, every shuffle and the final result from the revealed
        seed, and confirm it matches what was shown on stream.
      </p>
      <div className="card" style={{ marginTop: 20 }}>
        {draws.length === 0 ? (
          <div className="empty">No draws yet. Run a break or a giveaway and its proof appears here.</div>
        ) : (
          <table className="plain">
            <thead><tr><th>Draw</th><th>Type</th><th>When</th><th>Status</th><th /></tr></thead>
            <tbody>
              {draws.map((x) => (
                <tr key={x.id}>
                  <td><b>{x.title}</b><div className="mono dim">{x.id}</div></td>
                  <td className="muted">{KIND_LABEL[x.inputs.kind]}</td>
                  <td className="muted">{new Date(x.createdAt).toLocaleString('nb-NO')}</td>
                  <td>
                    {x.voided ? <span className="chip chip-void">Voided</span> : x.revealed ? <span className="chip chip-good">Verifiable</span> : <span className="chip chip-gold">Sealed</span>}
                  </td>
                  <td><a className="btn btn-sm" href={`#/proof/${x.id}`}>Open</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
