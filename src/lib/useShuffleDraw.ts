import { useCallback, useEffect, useRef, useState } from 'react';
import { commitmentFor, newSeed, orderHash, runShuffleDraw, type DrawInputs } from './fair.ts';
import { newDrawId, publishStream, saveDraw, type DrawRecord } from './store.ts';

export type Phase = 'ready' | 'sealed' | 'rolling' | 'shuffling' | 'shuffled' | 'revealed';

interface Config {
  kind: 'team' | 'filler';
  title: string;
  subtitle: string;
  left: string[];
  right: string[];
  leftLabel: string;
  rightLabel: string;
  winTop?: number;
}

const ROUND_MS = 950;
const DICE_MS = 2000;

/** Runs a dice-and-shuffle draw: seal (commit) → roll → visible rounds → reveal seed. */
export function useShuffleDraw(cfg: Config) {
  const [phase, setPhase] = useState<Phase>('ready');
  const [record, setRecord] = useState<DrawRecord | null>(null);
  const [dice, setDice] = useState<[number, number] | null>(null);
  const [rollId, setRollId] = useState(0);
  const [round, setRound] = useState(0);
  const [order, setOrder] = useState<string[]>(cfg.right);
  const [log, setLog] = useState<{ at: number; text: string }[]>([]);
  const timers = useRef<number[]>([]);
  const rounds = useRef<string[][]>([]);

  const addLog = useCallback((text: string) => setLog((l) => [{ at: Date.now(), text }, ...l]), []);

  // Keep the right column in sync while the inputs are still being prepared.
  useEffect(() => {
    if (phase === 'ready') setOrder(cfg.right);
  }, [cfg.right, phase]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const persist = (r: DrawRecord) => {
    saveDraw(r);
    setRecord(r);
  };

  const seal = () => {
    const inputs: DrawInputs = { kind: cfg.kind, left: cfg.left, right: cfg.right };
    const seed = newSeed();
    const r: DrawRecord = {
      id: newDrawId(),
      title: cfg.title,
      createdAt: Date.now(),
      seed,
      commitment: commitmentFor(seed, inputs),
      inputs,
      revealed: false,
      log: [],
    };
    persist(r);
    setPhase('sealed');
    addLog(`Draw sealed. Commitment ${r.commitment.slice(0, 12)}… published`);
  };

  const roll = () => {
    if (!record) return;
    const outcome = runShuffleDraw(record.seed, record.inputs);
    rounds.current = outcome.rounds;
    setDice(outcome.dice);
    setRollId((n) => n + 1);
    setPhase('rolling');
    const total = outcome.rounds.length;
    timers.current.push(
      window.setTimeout(() => {
        addLog(`Dice rolled ${outcome.dice![0]} + ${outcome.dice![1]} = ${total} shuffles`);
        setPhase('shuffling');
        outcome.rounds.forEach((o, i) => {
          timers.current.push(
            window.setTimeout(() => {
              setOrder(o);
              setRound(i + 1);
              addLog(`Shuffle ${i + 1}/${total} · order ${orderHash(o)}`);
              if (i + 1 === total) {
                timers.current.push(window.setTimeout(() => setPhase('shuffled'), ROUND_MS));
              }
            }, i * ROUND_MS),
          );
        });
      }, DICE_MS),
    );
  };

  const reveal = () => {
    if (!record) return;
    const r = { ...record, revealed: true, result: rounds.current.at(-1), log: [...log].reverse() };
    persist(r);
    setPhase('revealed');
    addLog(`Results locked. Seed revealed for verification`);
  };

  // Mirror every state change to the pop-out stream window.
  useEffect(() => {
    publishStream({
      kind: 'shuffle',
      title: cfg.title,
      subtitle: cfg.subtitle,
      leftLabel: cfg.leftLabel,
      rightLabel: cfg.rightLabel,
      left: cfg.left,
      order,
      phase: phase === 'shuffled' ? 'shuffling' : phase,
      dice,
      round,
      totalRounds: dice ? dice[0] + dice[1] : 0,
      commitment: record?.commitment ?? '',
      highlightTop: cfg.winTop,
    });
  }, [cfg.title, cfg.subtitle, cfg.leftLabel, cfg.rightLabel, cfg.left, cfg.winTop, order, phase, dice, round, record]);

  return { phase, record, dice, rollId, round, order, log, addLog, seal, roll, reveal };
}
