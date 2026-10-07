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
  /** Fixed number of shuffles set by the host; undefined = roll the dice. */
  shuffles?: number;
  mode?: 'choose';
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
  const [totalRounds, setTotalRounds] = useState(0);
  const [order, setOrder] = useState<string[]>(cfg.right);
  const [log, setLog] = useState<{ at: number; text: string }[]>([]);
  const [voided, setVoided] = useState<DrawRecord[]>([]);
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
    const inputs: DrawInputs = {
      kind: cfg.kind,
      left: cfg.left,
      right: cfg.right,
      ...(cfg.shuffles ? { shuffles: cfg.shuffles } : {}),
      ...(cfg.mode ? { mode: cfg.mode } : {}),
    };
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
      ...(voided.length ? { replaces: voided[0].id } : {}),
    };
    persist(r);
    setPhase('sealed');
    addLog(
      `Draw sealed${cfg.shuffles ? ` with ${cfg.shuffles} fixed shuffles` : ''}. Commitment ${r.commitment.slice(0, 12)}… published`,
    );
  };

  const runRounds = (all: string[][]) => {
    setPhase('shuffling');
    all.forEach((o, i) => {
      timers.current.push(
        window.setTimeout(() => {
          setOrder(o);
          setRound(i + 1);
          addLog(`Shuffle ${i + 1}/${all.length} · order ${orderHash(o)}`);
          if (i + 1 === all.length) timers.current.push(window.setTimeout(() => setPhase('shuffled'), ROUND_MS));
        }, i * ROUND_MS),
      );
    });
  };

  const roll = () => {
    if (!record) return;
    const outcome = runShuffleDraw(record.seed, record.inputs);
    rounds.current = outcome.rounds;
    setTotalRounds(outcome.rounds.length);
    setRound(0);
    if (!outcome.dice) {
      addLog(`Host set ${outcome.rounds.length} shuffles`);
      runRounds(outcome.rounds);
      return;
    }
    setDice(outcome.dice);
    setRollId((n) => n + 1);
    setPhase('rolling');
    timers.current.push(
      window.setTimeout(() => {
        addLog(`Dice rolled ${outcome.dice![0]} + ${outcome.dice![1]} = ${outcome.rounds.length} shuffles`);
        runRounds(outcome.rounds);
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

  /** Saves the teams chosen by filler winners onto the draw record. */
  const savePicks = (picks: { entry: string; team: string }[]) => {
    if (record) persist({ ...record, picks });
  };

  /**
   * Voids the current draw with a reason. The record stays public (seed revealed,
   * marked voided) and the next seal starts a fresh draw that references it.
   */
  const voidDraw = (reason: string) => {
    if (!record) return;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const v: DrawRecord = {
      ...record,
      revealed: true,
      voided: { reason, at: Date.now() },
      log: [...log].reverse(),
    };
    saveDraw(v);
    setVoided((list) => [v, ...list]);
    setRecord(null);
    setDice(null);
    setRound(0);
    setTotalRounds(0);
    setOrder(cfg.right);
    setPhase('ready');
    addLog(`Draw ${record.id} voided by host: "${reason}". Ready to re-draw`);
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
      totalRounds,
      commitment: record?.commitment ?? '',
      highlightTop: cfg.winTop,
    });
  }, [cfg.title, cfg.subtitle, cfg.leftLabel, cfg.rightLabel, cfg.left, cfg.winTop, order, phase, dice, round, totalRounds, record]);

  return { phase, record, dice, rollId, round, totalRounds, order, log, voided, addLog, seal, roll, reveal, voidDraw, savePicks };
}
