import { useEffect, useState } from 'react';

const parse = () => location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);

/** Minimal hash router: works from a file:// copy and inside the pop-out window. */
export function useRoute() {
  const [parts, setParts] = useState(parse);
  useEffect(() => {
    const on = () => {
      setParts(parse());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return parts;
}

export const go = (path: string) => {
  location.hash = path;
};
