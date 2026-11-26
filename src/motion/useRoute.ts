import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

// Same hash parsing and scroll behaviour as lib/router.ts (routes are unchanged);
// the only addition is that the page swap runs inside a View Transition, so the
// shell stays put while content and shared elements (product art, titles) morph.

const parse = () => location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);

type Transition = { ready: Promise<void>; finished: Promise<void>; updateCallbackDone: Promise<void>; skipTransition: () => void };
type VT = { startViewTransition?: (cb: () => void) => Transition };

export function useCinematicRoute() {
  const [parts, setParts] = useState(parse);
  useEffect(() => {
    const on = () => {
      const next = parse();
      const swap = () => {
        flushSync(() => setParts(next));
        window.scrollTo(0, 0);
      };
      const doc = document as unknown as VT;
      const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (doc.startViewTransition && !calm && !document.hidden) {
        // A quick second navigation skips the running transition; that is expected, not an error.
        const t = doc.startViewTransition(swap);
        const quiet = () => {};
        t.ready.catch(quiet); t.finished.catch(quiet); t.updateCallbackDone.catch(quiet);
      } else swap();
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return parts;
}
