import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { sha256Hex } from '../src/lib/sha256.ts';
import { stream, shuffle, runShuffleDraw, runWheel, runRace, commitmentFor, newSeed } from '../src/lib/fair.ts';

test('sha256 matches node crypto', () => {
  for (const s of ['', 'abc', 'a'.repeat(55), 'a'.repeat(56), 'a'.repeat(64), 'Bayern München ⚽', 'x'.repeat(1000)]) {
    assert.equal(sha256Hex(s), createHash('sha256').update(s).digest('hex'));
  }
});

test('draws are deterministic for a seed and change with the seed', () => {
  const inputs = { kind: 'team' as const, left: ['a', 'b', 'c'], right: ['1', '2', '3', '4', '5', '6'].slice(0, 3) };
  const a = runShuffleDraw('seed-1', inputs);
  assert.deepEqual(a, runShuffleDraw('seed-1', inputs));
  assert.equal(a.rounds.length, a.dice![0] + a.dice![1]);
  assert.ok(a.dice!.every((d) => d >= 1 && d <= 6));
  assert.notEqual(commitmentFor('seed-1', inputs), commitmentFor('seed-2', inputs));
  assert.notEqual(commitmentFor('seed-1', inputs), commitmentFor('seed-1', { ...inputs, right: ['3', '2', '1'] }));
});

test('shuffle is a permutation and roughly uniform', () => {
  const items = ['A', 'B', 'C', 'D'];
  const counts: Record<string, number> = {};
  const N = 24000;
  for (let i = 0; i < N; i++) {
    const s = shuffle(items, `u${i}`, 'x');
    assert.deepEqual([...s].sort(), items);
    counts[s.join('')] = (counts[s.join('')] ?? 0) + 1;
  }
  assert.equal(Object.keys(counts).length, 24);
  for (const c of Object.values(counts)) assert.ok(Math.abs(c - N / 24) < N / 24 * 0.15, `count ${c}`);
});

test('int stays in range', () => {
  const r = stream('s', 'l');
  for (let i = 0; i < 5000; i++) { const v = r.int(7); assert.ok(v >= 0 && v < 7); }
});

test('wheel removes winners, race keeps every duck', () => {
  const w = runWheel(newSeed(), ['a', 'a', 'b', 'c'], 3);
  assert.equal(w.length, 3);
  assert.equal(new Set(w.map((x) => x.index)).size, 3);
  assert.deepEqual([...runRace('s', ['x', 'y', 'z'])].sort(), ['x', 'y', 'z']);
});

test('fixed shuffle count skips dice and is locked by the commitment', () => {
  const base = { kind: 'filler' as const, left: ['t1'], right: ['a', 'b', 'c'] };
  const fixed = runShuffleDraw('s', { ...base, shuffles: 4 });
  assert.equal(fixed.dice, null);
  assert.equal(fixed.rounds.length, 4);
  assert.notEqual(commitmentFor('s', base), commitmentFor('s', { ...base, shuffles: 4 }));
  assert.notEqual(commitmentFor('s', base), commitmentFor('s', { ...base, mode: 'choose' }));
  // Draws without the optional settings keep their original fingerprint.
  assert.equal(commitmentFor('s', base), commitmentFor('s', { ...base, shuffles: undefined, mode: undefined }));
});
