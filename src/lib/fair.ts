// Provably fair draws.
//
// 1. Before the draw the portal creates a secret 256-bit seed with the browser's
//    cryptographic random generator and publishes only a commitment:
//       commitment = SHA-256(seed + "|" + SHA-256(inputs))
//    so neither the seed nor the buyer/team lists can change afterwards.
// 2. All randomness (dice, every shuffle round, wheel spins, race order) is derived
//    from that seed with SHA-256 in counter mode, using unbiased rejection sampling.
// 3. After the draw the seed is revealed. Anyone can recompute every step.

import { sha256, sha256Hex, toHex } from './sha256.ts';

export type DrawKind = 'team' | 'filler' | 'wheel' | 'duck';

export interface DrawInputs {
  kind: DrawKind;
  /** Fixed column: buyers (team draw) or open slots (filler draw). Empty for wheel/duck. */
  left: string[];
  /** Column that gets randomized: teams, filler entries, wheel entries or ducks. */
  right: string[];
  /** Fixed number of shuffle rounds set by the host instead of a dice roll. */
  shuffles?: number;
  /** Filler draw: winners pick their team in winning order instead of being paired by draw. */
  mode?: 'choose';
}

export interface DrawOutcome {
  dice: [number, number] | null;
  /** Order of `right` after each shuffle round. */
  rounds: string[][];
  final: string[];
}

const encoder = new TextEncoder();

export function newSeed(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

// Optional settings are only part of the fingerprint when used, so they are locked by the commitment too.
export const inputsHash = (inputs: DrawInputs) =>
  sha256Hex(
    JSON.stringify({
      kind: inputs.kind,
      left: inputs.left,
      right: inputs.right,
      ...(inputs.shuffles ? { shuffles: inputs.shuffles } : {}),
      ...(inputs.mode ? { mode: inputs.mode } : {}),
    }),
  );

export const commitmentFor = (seed: string, inputs: DrawInputs) =>
  sha256Hex(`${seed}|${inputsHash(inputs)}`);

/** Deterministic random stream: SHA-256(seed:label:counter), read as 32-bit words. */
export function stream(seed: string, label: string) {
  let counter = 0;
  let buf: Uint8Array = new Uint8Array(0);
  let pos = 0;
  const nextU32 = () => {
    if (pos + 4 > buf.length) {
      buf = sha256(encoder.encode(`${seed}:${label}:${counter++}`));
      pos = 0;
    }
    const v = ((buf[pos] << 24) | (buf[pos + 1] << 16) | (buf[pos + 2] << 8) | buf[pos + 3]) >>> 0;
    pos += 4;
    return v;
  };
  /** Uniform integer in [0, n) without modulo bias. */
  const int = (n: number) => {
    const limit = Math.floor(0x100000000 / n) * n;
    let v: number;
    do v = nextU32(); while (v >= limit);
    return v % n;
  };
  return { int };
}

/** Fisher-Yates shuffle driven by the seeded stream. */
export function shuffle<T>(list: readonly T[], seed: string, label: string): T[] {
  const rng = stream(seed, label);
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = rng.int(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function rollDice(seed: string): [number, number] {
  const rng = stream(seed, 'dice');
  return [rng.int(6) + 1, rng.int(6) + 1];
}

/** Recomputes a team or filler draw: dice total (or the host's fixed count) = number of shuffle rounds. */
export function runShuffleDraw(seed: string, inputs: DrawInputs): DrawOutcome {
  const dice = inputs.shuffles ? null : rollDice(seed);
  const total = dice ? dice[0] + dice[1] : inputs.shuffles!;
  const rounds: string[][] = [];
  let order = inputs.right.slice();
  for (let r = 1; r <= total; r++) {
    order = shuffle(order, seed, `round-${r}`);
    rounds.push(order);
  }
  return { dice, rounds, final: order };
}

/** Wheel: each spin picks one of the remaining entries; winners are removed. */
export function runWheel(seed: string, entries: string[], spins: number) {
  const remaining = entries.map((name, i) => ({ name, i }));
  const winners: { name: string; index: number }[] = [];
  for (let s = 1; s <= spins && remaining.length > 0; s++) {
    const pick = stream(seed, `spin-${s}`).int(remaining.length);
    winners.push({ name: remaining[pick].name, index: remaining[pick].i });
    remaining.splice(pick, 1);
  }
  return winners;
}

/** Duck race: finishing order is one seeded shuffle of the ducks. */
export const runRace = (seed: string, ducks: string[]) => shuffle(ducks, seed, 'race');

export const orderHash = (order: string[]) => sha256Hex(order.join('\n')).slice(0, 12);

export const short = (hex: string, n = 10) => `${hex.slice(0, n)}…${hex.slice(-4)}`;
