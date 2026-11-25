import { useEffect, useRef, useState } from 'react';

/** Counts from 0 to `value` once on mount (ease-out). Respects reduced motion. */
export default function CountUp({ value, duration = 1400, format = (n: number) => n.toLocaleString('nb-NO') }: { value: number; duration?: number; format?: (n: number) => string }) {
  const [n, setN] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setN(value); return; }
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration]);
  return <>{format(n)}</>;
}
