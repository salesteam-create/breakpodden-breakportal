import { useEffect, useRef, useState } from 'react';

/** Animates a displayed number toward the real value (presentation only). */
export function useCountUp(value: number, ms = 900) {
  const [shown, setShown] = useState(() => (matchMedia('(prefers-reduced-motion: reduce)').matches ? value : 0));
  const from = useRef(shown);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(value); return; }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      const v = Math.round(a + (value - a) * e);
      setShown(v);
      from.current = v;
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return shown;
}
