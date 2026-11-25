/**
 * Real club and national-team crests (Wikimedia Commons) used as buyer badges.
 * Demo only: these marks are trademarks of their clubs and federations and must
 * be licensed or replaced before the portal goes live.
 */
import bayern from '../assets/crests/bayern.svg';
import dortmund from '../assets/crests/dortmund.svg';
import gladbach from '../assets/crests/gladbach.svg';
import union from '../assets/crests/union.svg';
import hsv from '../assets/crests/hsv.svg';
import hoffenheim from '../assets/crests/hoffenheim.svg';
import werder from '../assets/crests/werder.svg';
import stuttgart from '../assets/crests/stuttgart.svg';
import brazil from '../assets/crests/brazil.svg';
import { ORDERS_394, initialPytSlots } from '../lib/data.ts';

const CLUBS = [bayern, dortmund, gladbach, union, hsv, hoffenheim, werder, stuttgart];

// Hand out clubs in purchase order so neighbouring buyers rarely share a crest.
const ORDER = [...new Set([...ORDERS_394.map((o) => o.buyer), ...initialPytSlots().flatMap((x) => (x.owner ? [x.owner] : []))])];
const CLUB_OF = new Map(ORDER.map((n, i) => [n, CLUBS[i % CLUBS.length]]));

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Belgian tricolour, drawn (public-domain flag). */
function BelgiumFlag({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" role="img" aria-label="Belgium">
      <clipPath id="be-c"><rect x="3" y="6" width="24" height="18" rx="3" /></clipPath>
      <g clipPath="url(#be-c)">
        <rect x="3" y="6" width="8" height="18" fill="#000" />
        <rect x="11" y="6" width="8" height="18" fill="#fdda24" />
        <rect x="19" y="6" width="8" height="18" fill="#ef3340" />
      </g>
    </svg>
  );
}

/** Pick the crest for a row: the team they took if known, else the buyer's club. */
export default function TeamLogo({ name, team, size = 30 }: { name: string; team?: string; size?: number }) {
  if (team?.startsWith('Belgium')) return <BelgiumFlag size={size} />;
  const src = team?.startsWith('Brazil') ? brazil : CLUB_OF.get(name) ?? CLUBS[hash(name) % CLUBS.length];
  return <img className="team-logo" src={src} width={size} height={size} alt="" />;
}
