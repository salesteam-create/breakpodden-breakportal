/**
 * "Rain of prizes": a gold gift in the tile, and every few seconds a short
 * shower of small gift boxes falls across the promo card. Decorative only.
 */
function Gift({ body, ribbon, size }: { body: string; ribbon: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="10" width="18" height="12" rx="1.5" fill={body} />
      <rect x="2" y="7" width="20" height="4.5" rx="1.2" fill={body} />
      <rect x="2" y="7" width="20" height="4.5" rx="1.2" fill="#fff" opacity=".18" />
      <rect x="10.6" y="7" width="2.8" height="15" fill={ribbon} />
      <path d="M12 7 C9 2 5 3.5 6.5 6 C7.5 7.4 10 7 12 7 Z M12 7 C15 2 19 3.5 17.5 6 C16.5 7.4 14 7 12 7 Z" fill={ribbon} />
    </svg>
  );
}

// x position (%), delay (s), size (px), spin (deg), colour pair
const DROPS: [number, number, number, number, number][] = [
  [8, 0, 14, -40, 0], [22, .35, 11, 30, 1], [36, .15, 16, 55, 0], [50, .5, 12, -25, 1],
  [63, .2, 15, 45, 0], [76, .6, 11, -50, 1], [88, .3, 13, 35, 0], [44, .8, 10, 60, 1],
];
const PAIRS: [string, string][] = [['#e2b84a', '#ff2e3b'], ['#ff2e3b', '#f6dc8c']];

export function PrizeShower() {
  return (
    <span className="prize-shower" aria-hidden="true">
      {DROPS.map(([x, d, s, r, c], k) => (
        <i key={k} style={{ left: `${x}%`, animationDelay: `${d}s`, ['--spin' as string]: `${r}deg` }}>
          <Gift body={PAIRS[c][0]} ribbon={PAIRS[c][1]} size={s} />
        </i>
      ))}
    </span>
  );
}

export function PrizeTile() {
  return (
    <span className="prize-tile" aria-hidden="true">
      <Gift body="#e2b84a" ribbon="#ff2e3b" size={40} />
    </span>
  );
}
