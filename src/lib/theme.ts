import { useState } from 'react';

export type Theme = 'light' | 'dark';
const KEY = 'bp-theme';

/** Theme set by the inline script in index.html (saved choice, else the system setting). */
const current = (): Theme => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(current);
  const setTheme = (t: Theme) => {
    const root = document.documentElement;
    // Brief colour transition only while switching, so normal animations stay unaffected.
    root.classList.add('theme-anim');
    root.dataset.theme = t;
    window.setTimeout(() => root.classList.remove('theme-anim'), 400);
    try {
      localStorage.setItem(KEY, t);
    } catch {
      /* storage unavailable: the choice lasts for this visit only */
    }
    setThemeState(t);
  };
  return { theme, toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark') };
}
