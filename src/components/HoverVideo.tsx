import { useEffect, useRef } from 'react';

/**
 * Shows a still frame at `still` seconds.
 * - Mouse devices: plays while its card is hovered or focused.
 * - Touch devices: plays only the one video whose card is closest to the
 *   centre of the screen (vertically and horizontally); every other video
 *   rests on its still frame.
 */

type Entry = { v: HTMLVideoElement; card: HTMLElement; still: number };
const entries = new Set<Entry>();
let current: Entry | null = null;
let queued = false;
let listening = false;

const isTouch = () => typeof matchMedia !== 'undefined' && matchMedia('(hover: none)').matches;

function rest(e: Entry) {
  e.v.pause();
  if (e.v.readyState >= 1) e.v.currentTime = e.still;
}

/** Pick the card nearest the viewport centre; play it, rest the others. */
function pick() {
  queued = false;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let best: Entry | null = null;
  let bestD = Infinity;
  for (const e of entries) {
    const r = e.card.getBoundingClientRect();
    if (!r.width || r.bottom <= 0 || r.top >= vh || r.right <= 0 || r.left >= vw) continue;
    // Mostly on screen: at least 60% of the card visible in both directions.
    const visW = Math.min(r.right, vw) - Math.max(r.left, 0);
    const visH = Math.min(r.bottom, vh) - Math.max(r.top, 0);
    if (visW < r.width * 0.6 || visH < r.height * 0.6) continue;
    const dx = (r.left + r.width / 2 - vw / 2) / vw;
    const dy = (r.top + r.height / 2 - vh / 2) / vh;
    // Only cards in the middle band of the screen qualify.
    if (Math.abs(dy) > 0.3) continue;
    const d = dx * dx + dy * dy;
    if (d < bestD) { bestD = d; best = e; }
  }
  if (best === current) return;
  if (current) rest(current);
  current = best;
  current?.v.play().catch(() => {});
}

const schedule = () => {
  if (!queued) { queued = true; requestAnimationFrame(pick); }
};

function listen() {
  if (listening) return;
  listening = true;
  // Capture phase catches scrolling inside horizontal carousels too.
  window.addEventListener('scroll', schedule, { passive: true, capture: true });
  window.addEventListener('resize', schedule, { passive: true });
}

export default function HoverVideo({ src, poster, still }: { src: string; poster: string; still: number }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const card = (v.closest('a, .feat') as HTMLElement | null) ?? v;
    const ready = () => { if (v.paused) v.currentTime = still; };
    v.addEventListener('loadedmetadata', ready);
    if (v.readyState >= 1) ready();

    if (isTouch()) {
      const entry: Entry = { v, card, still };
      entries.add(entry);
      listen();
      schedule();
      v.addEventListener('loadeddata', schedule);
      return () => {
        entries.delete(entry);
        if (current === entry) current = null;
        v.removeEventListener('loadedmetadata', ready);
        v.removeEventListener('loadeddata', schedule);
      };
    }

    const restMe = () => { v.pause(); v.currentTime = still; };
    const play = () => { v.play().catch(() => {}); };
    card.addEventListener('mouseenter', play);
    card.addEventListener('mouseleave', restMe);
    card.addEventListener('focusin', play);
    card.addEventListener('focusout', restMe);
    return () => {
      v.removeEventListener('loadedmetadata', ready);
      card.removeEventListener('mouseenter', play);
      card.removeEventListener('mouseleave', restMe);
      card.removeEventListener('focusin', play);
      card.removeEventListener('focusout', restMe);
    };
  }, [still]);

  return <video ref={ref} src={src} poster={poster} muted loop playsInline preload="auto" aria-hidden="true" />;
}
