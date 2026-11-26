import { useEffect, useRef } from 'react';

/**
 * Shows a still frame at `still` seconds; plays only while the parent card is
 * hovered or focused, then returns to the still frame.
 */
export default function HoverVideo({ src, poster, still }: { src: string; poster: string; still: number }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const card = v.closest('a, .feat') as HTMLElement | null;
    const rest = () => { v.pause(); v.currentTime = still; };
    const play = () => { v.play().catch(() => {}); };
    const ready = () => { if (v.paused) v.currentTime = still; };
    v.addEventListener('loadedmetadata', ready);
    if (v.readyState >= 1) ready();
    card?.addEventListener('mouseenter', play);
    card?.addEventListener('mouseleave', rest);
    card?.addEventListener('focusin', play);
    card?.addEventListener('focusout', rest);
    return () => {
      v.removeEventListener('loadedmetadata', ready);
      card?.removeEventListener('mouseenter', play);
      card?.removeEventListener('mouseleave', rest);
      card?.removeEventListener('focusin', play);
      card?.removeEventListener('focusout', rest);
    };
  }, [still]);

  return <video ref={ref} src={src} poster={poster} muted loop playsInline preload="auto" aria-hidden="true" />;
}
