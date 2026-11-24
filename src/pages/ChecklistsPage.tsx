import { useState } from 'react';
import { getChecklists, saveChecklists } from '../lib/store.ts';
import PageHeader from '../components/PageHeader.tsx';
import Icon from '../components/Icon.tsx';

/** Box checklist library: the team list that loads when a host picks a box. */
export default function ChecklistsPage() {
  const [lists, setLists] = useState<Record<string, string[]>>(getChecklists);
  const [box, setBox] = useState(Object.keys(lists)[0] ?? '');
  const [newBox, setNewBox] = useState('');
  const [newTeam, setNewTeam] = useState('');
  const [splitting, setSplitting] = useState<string | null>(null);
  const [players, setPlayers] = useState('');
  const [paste, setPaste] = useState<string | null>(null);

  const teams = lists[box] ?? [];

  const update = (next: Record<string, string[]>) => {
    setLists(next);
    saveChecklists(next);
  };
  const setTeams = (t: string[]) => update({ ...lists, [box]: t });

  const addBox = () => {
    const name = newBox.trim();
    if (!name || lists[name]) return;
    update({ ...lists, [name]: [] });
    setBox(name);
    setNewBox('');
  };

  const deleteBox = () => {
    if (!confirm(`Delete the checklist for "${box}"?`)) return;
    const next = { ...lists };
    delete next[box];
    update(next);
    setBox(Object.keys(next)[0] ?? '');
  };

  const addTeam = () => {
    const t = newTeam.trim();
    if (!t || teams.includes(t)) return;
    setTeams([...teams, t]);
    setNewTeam('');
  };

  // "Portugal" + "Cristiano" → "Portugal - Cristiano", "Portugal - Others", in place.
  const split = (team: string) => {
    const names = players.split(',').map((p) => p.trim()).filter(Boolean);
    if (names.length === 0) return;
    const parts = [...names.map((p) => `${team} - ${p}`), `${team} - Others`].filter((p) => !teams.includes(p));
    const i = teams.indexOf(team);
    setTeams([...teams.slice(0, i), ...parts, ...teams.slice(i + 1)]);
    setSplitting(null);
    setPlayers('');
  };

  const duplicates = teams.filter((t, i) => teams.indexOf(t) !== i);

  return (
    <>
      <PageHeader eyebrow="Library" title="Box checklists">
        The team list that loads when a host picks a box. Split a valuable team by star player to sell it as separate spots.
      </PageHeader>

      <div className="workspace checklists-ws">
        <div className="side" style={{ position: 'static' }}>
          <div className="card">
            <div className="card-head"><h3>Boxes</h3><span className="dim mono">{Object.keys(lists).length}</span></div>
            <div className="card-pad stack" style={{ gap: 8 }}>
              {Object.keys(lists).map((b) => (
                <button key={b} className={`box-item${b === box ? ' on' : ''}`} onClick={() => { setBox(b); setPaste(null); setSplitting(null); }}>
                  <span>{b}</span>
                  <span className="mono dim">{lists[b].length}</span>
                </button>
              ))}
              <div className="row" style={{ marginTop: 8 }}>
                <input type="text" placeholder="New box name" aria-label="New box name" value={newBox} onChange={(e) => setNewBox(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addBox()} style={{ flex: 1, minWidth: 0 }} />
                <button className="btn btn-sm" onClick={addBox} disabled={!newBox.trim()}><Icon name="plus" size={15} /> Add</button>
              </div>
              <button className="btn btn-sm btn-ghost" disabled title="Planned for a later phase"><Icon name="sparkle" size={15} /> Draft a checklist with AI (later phase)</button>
            </div>
          </div>
        </div>

        {box ? (
          <div className="card">
            <div className="card-head">
              <div>
                <h3>{box}</h3>
                <span className="dim" style={{ fontSize: 13 }}>{teams.length} teams and splits · saved automatically</span>
              </div>
              <div className="row">
                <button className="btn btn-sm" onClick={() => setPaste(paste === null ? teams.join('\n') : null)}><Icon name="paste" size={15} /> {paste === null ? 'Paste list' : 'Cancel paste'}</button>
                <button className="btn btn-sm btn-ghost" onClick={deleteBox}><Icon name="trash" size={15} /> Delete box</button>
              </div>
            </div>

            {paste !== null ? (
              <div className="card-pad stack">
                <span className="muted" style={{ fontSize: 13.5 }}>One team per line, for example copied from the manufacturer's checklist.</span>
                <textarea value={paste} onChange={(e) => setPaste(e.target.value)} style={{ minHeight: 320 }} aria-label="Team list, one per line" />
                <div className="row">
                  <button
                    className="btn btn-gold"
                    onClick={() => {
                      setTeams([...new Set(paste.split('\n').map((t) => t.trim()).filter(Boolean))]);
                      setPaste(null);
                    }}
                  >
                    Replace list
                  </button>
                  <span className="dim" style={{ fontSize: 13 }}>{paste.split('\n').filter((t) => t.trim()).length} lines</span>
                </div>
              </div>
            ) : (
              <div className="card-pad stack" style={{ gap: 6 }}>
                {duplicates.length > 0 && <div className="warn-box" role="alert"><Icon name="alert" size={16} /> Duplicate teams: {[...new Set(duplicates)].join(', ')}</div>}
                {teams.length === 0 && <p className="dim" style={{ padding: '8px 0' }}>No teams yet. Add them below or paste a list.</p>}
                {teams.map((t, i) => (
                  <div key={`${t}-${i}`} className="team-row">
                    <span className="mono dim">{i + 1}</span>
                    <input
                      type="text"
                      defaultValue={t}
                      aria-label={`Team ${i + 1}`}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v && v !== t) setTeams(teams.map((x, j) => (j === i ? v : x)));
                      }}
                    />
                    {splitting === t ? (
                      <div className="row fade-in" style={{ gap: 6 }}>
                        <input
                          type="text"
                          autoFocus
                          placeholder="Players, e.g. Cristiano"
                          aria-label={`Players to split from ${t}`}
                          value={players}
                          onChange={(e) => setPlayers(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') split(t);
                            if (e.key === 'Escape') setSplitting(null);
                          }}
                          style={{ width: 200 }}
                        />
                        <button className="btn btn-sm" onClick={() => split(t)} disabled={!players.trim()}>Split</button>
                        <button className="btn btn-sm btn-ghost" onClick={() => setSplitting(null)}>Cancel</button>
                      </div>
                    ) : (
                      <div className="row" style={{ gap: 6 }}>
                        {!t.includes(' - ') && (
                          <button className="btn btn-sm btn-ghost" onClick={() => { setSplitting(t); setPlayers(''); }} title="Split this team by star player"><Icon name="split" size={15} /> Split by player</button>
                        )}
                        <button className="btn btn-sm btn-ghost" onClick={() => setTeams(teams.filter((_, j) => j !== i))} aria-label={`Remove ${t}`}><Icon name="x" size={15} /></button>
                      </div>
                    )}
                  </div>
                ))}
                <div className="row" style={{ marginTop: 10 }}>
                  <input type="text" placeholder="Add a team" aria-label="Add a team" value={newTeam} onChange={(e) => setNewTeam(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTeam()} style={{ flex: 1 }} />
                  <button className="btn btn-sm" onClick={addTeam} disabled={!newTeam.trim()}><Icon name="plus" size={15} /> Add team</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="card empty"><span className="empty-ic"><Icon name="list" size={22} /></span><b>No boxes yet</b><span>Add one on the left.</span></div>
        )}
      </div>
    </>
  );
}
