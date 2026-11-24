import { useMemo, useState } from 'react';
import { commitmentFor, inputsHash, orderHash, runRace, runShuffleDraw, runWheel, type DrawInputs } from '../lib/fair.ts';
import { getDraw, listDraws, type DrawRecord } from '../lib/store.ts';
import Icon from '../components/Icons.tsx';
import Hero from '../components/Hero.tsx';

const KIND_LABEL: Record<string, string> = { team: 'Team draw', filler: 'Filler draw', wheel: 'Wheel of fortune', duck: 'Duck race' };

function recompute(d: DrawRecord, inputs: DrawInputs) {
  if (inputs.kind === 'wheel') return { dice: null, rounds: [], final: runWheel(d.seed, inputs.right, d.spins ?? 0).map((w) => w.name) };
  if (inputs.kind === 'duck') return { dice: null, rounds: [], final: runRace(d.seed, inputs.right) };
  return runShuffleDraw(d.seed, inputs);
}

function Check({ ok, title, detail }: { ok: boolean; title: string; detail: string }) {
  return (
    <div className={`check ${ok ? 'ok' : 'bad'}`}>
      <span className="ic"><Icon name={ok ? 'check' : 'x'} size={14} /></span>
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
        <div className="card proof-cert">
          <div className="card-head">
            <div>
              <div className="eyebrow">{KIND_LABEL[d.inputs.kind]} · {d.id}</div>
              <h2 style={{ marginTop: 6 }}>{d.title}</h2>
            </div>
            <div className="row">
              {d.voided && <span className="chip chip-void">Voided</span>}
              {commitOk && resultOk ? <span className="chip chip-good"><Icon name="shield" size={13} /> Verified fair</span> : <span className="chip chip-void"><Icon name="x" size={13} /> Verification failed</span>}
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
          <button className={`btn btn-sm btn-block${tampered ? ' btn-gold' : ''}`} onClick={() => setTampered(!tampered)}>
            {tampered ? 'Undo tamper test' : 'Tamper test: swap two names'}
          </button>
          <button
            className="btn btn-sm btn-block"
            onClick={() => {
              const a = document.createElement('a');
              a.href = URL.createObjectURL(new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' }));
              a.download = `${d.id}-proof.json`;
              a.click();
            }}
          >
            <Icon name="download" size={15} /> Download proof (JSON)
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
        <a href="#/proofs" className="back-link"><Icon name="back" size={15} /> All proofs</a>
        <ProofDetail d={d} />
      </>
    );
  }
  const draws = listDraws();
  return (
    <>
      <Hero
       
        art={<div className="art-cert"><div className="slab"><div className="slab-label"><span>Certified draw</span><span className="mono">{draws[0]?.id ?? "D-000000"}</span></div><div className="slab-window hashes mono">{(draws[0]?.commitment ?? "9f2c41ab07d3e6c58a1f4b92d07e3c6a5b8d1e0f7c2a9b4d6e8f0a1c3b5d7e9f").match(/.{1,16}/g)!.map((l, k) => <span key={k}>{l}</span>)}<b><Icon name="seal" size={20} weight="fill" /> SHA-256 sealed</b></div></div></div>}
        compact
        badge={{ icon: 'eye', label: 'Public record' }}
        title={<>Fairness proofs</>}
        lede="Every draw gets a public page. Viewers can recompute the dice, every shuffle and the final result from the revealed seed, and confirm it matches what was shown on stream."
        stats={[
          { icon: 'file', label: 'Draws', value: draws.length },
          { icon: 'shield', label: 'Verifiable', value: draws.filter((x) => x.revealed && !x.voided).length },
          { icon: 'lock', label: 'Sealed', value: draws.filter((x) => !x.revealed).length },
        ]}
      />
      <div className="card">
        {draws.length === 0 ? (
          <div className="empty">
            <span className="empty-ic"><Icon name="shield" size={26} /></span>
            <b>No draws yet</b>
            <span>Run a break or a giveaway and its proof appears here.</span>
            <a href="#/break/394" className="btn btn-gold btn-sm">Run a team draw <Icon name="arrow" size={14} /></a>
          </div>
        ) : (
          <table className="plain">
            <thead><tr><th>Draw</th><th>Type</th><th>When</th><th>Status</th><th /></tr></thead>
            <tbody>
              {draws.map((x) => (
                <tr key={x.id}>
                  <td><a href={`#/proof/${x.id}`} className="t-title"><b>{x.title}</b><span className="mono dim">{x.id}</span></a></td>
                  <td className="muted">{KIND_LABEL[x.inputs.kind]}</td>
                  <td className="muted">{new Date(x.createdAt).toLocaleString('nb-NO')}</td>
                  <td>
                    {x.voided ? <span className="chip chip-void">Voided</span> : x.revealed ? <span className="chip chip-good">Verifiable</span> : <span className="chip chip-gold">Sealed</span>}
                  </td>
                  <td className="t-right"><a className="btn btn-sm btn-outline" href={`#/proof/${x.id}`}>Open <Icon name="arrow" size={14} /></a></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
