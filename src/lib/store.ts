// Prototype persistence: draws live in localStorage, the stream window is fed
// through BroadcastChannel (with a storage-event fallback).

import { useEffect, useState } from 'react';
import type { DrawInputs } from './fair.ts';
import { CHECKLISTS } from './data.ts';

export interface DrawRecord {
  id: string;
  title: string;
  createdAt: number;
  seed: string;
  commitment: string;
  inputs: DrawInputs;
  revealed: boolean;
  /** Wheel: number of spins made. */
  spins?: number;
  /** Published result, compared against the recomputation on the proof page. */
  result?: string[];
  /** Set when the host voids the draw; the record stays public with its reason. */
  voided?: { reason: string; at: number };
  /** ID of the voided draw this one replaces. */
  replaces?: string;
  /** Filler draw in "winners choose" mode: team picked by each winner, in winning order. */
  picks?: { entry: string; team: string }[];
  log: { at: number; text: string }[];
}

const DRAWS_KEY = 'bp-draws';
const STREAM_KEY = 'bp-stream';
const CHECKLISTS_KEY = 'bp-checklists';

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: the prototype keeps working in memory */
  }
};

let memoryDraws: DrawRecord[] = read(DRAWS_KEY, []);

export const listDraws = () => memoryDraws.slice().sort((a, b) => b.createdAt - a.createdAt);
export const getDraw = (id: string) => listDraws().find((d) => d.id === id) ?? null;

export function saveDraw(d: DrawRecord) {
  memoryDraws = [d, ...memoryDraws.filter((x) => x.id !== d.id)];
  write(DRAWS_KEY, memoryDraws);
}

export const newDrawId = () => `D-${Date.now().toString(36).toUpperCase().slice(-6)}`;

// ---- Box checklist library ------------------------------------------------

export const getChecklists = (): Record<string, string[]> => read(CHECKLISTS_KEY, CHECKLISTS);
export const saveChecklists = (c: Record<string, string[]>) => write(CHECKLISTS_KEY, c);

// ---- Stream channel -------------------------------------------------------

export type StreamPayload =
  | {
      kind: 'shuffle';
      title: string;
      subtitle: string;
      leftLabel: string;
      rightLabel: string;
      left: string[];
      order: string[];
      phase: 'ready' | 'sealed' | 'rolling' | 'shuffling' | 'revealed';
      dice: [number, number] | null;
      round: number;
      totalRounds: number;
      commitment: string;
      highlightTop?: number;
    }
  | {
      kind: 'wheel';
      title: string;
      subtitle: string;
      entries: string[];
      rotation: number;
      spinning: boolean;
      winner: string | null;
      commitment: string;
    }
  | {
      kind: 'duck';
      title: string;
      subtitle: string;
      ducks: string[];
      order: string[];
      duration: number;
      startedAt: number | null;
      commitment: string;
    }
  | { kind: 'idle' };

let channel: BroadcastChannel | null = null;
try {
  channel = new BroadcastChannel('bp-stream');
} catch {
  channel = null;
}

export function publishStream(p: StreamPayload) {
  write(STREAM_KEY, p);
  channel?.postMessage(p);
}

export function useStream(): StreamPayload {
  const [state, setState] = useState<StreamPayload>(() => read(STREAM_KEY, { kind: 'idle' }));
  useEffect(() => {
    const onMsg = (e: MessageEvent) => setState(e.data as StreamPayload);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STREAM_KEY && e.newValue) setState(JSON.parse(e.newValue));
    };
    channel?.addEventListener('message', onMsg);
    window.addEventListener('storage', onStorage);
    return () => {
      channel?.removeEventListener('message', onMsg);
      window.removeEventListener('storage', onStorage);
    };
  }, []);
  return state;
}

export function openStreamWindow() {
  const url = `${location.href.split('#')[0]}#/stream`;
  window.open(url, 'bp-stream', 'width=1280,height=720');
}

/** Clears every draw and the stream state, then reloads on the dashboard. */
export function resetDemo() {
  try {
    localStorage.removeItem(DRAWS_KEY);
    localStorage.removeItem(STREAM_KEY);
    localStorage.removeItem(CHECKLISTS_KEY);
  } catch {
    /* storage unavailable: nothing persisted to clear */
  }
  memoryDraws = [];
  publishStream({ kind: 'idle' });
  location.hash = '#/';
  location.reload();
}
