// Sample data for the prototype.
// Break titles, team checklists and prices come from breakpodden.com (October 2026).
// Buyer names are invented usernames: no real customer data is used.

import bundesligaImg from '../assets/box-bundesliga.webp';
import futeraImg from '../assets/box-futera.webp';

export interface Slot {
  team: string;
  price: number;
  owner: string | null;
  viaFiller?: boolean;
}

export interface Break {
  id: string;
  number: number;
  title: string;
  box: string;
  format: 'random' | 'pyt';
  image: string;
  boxPrice: number;
  slotPrice?: number;
  spots: number;
  status: string;
  startsAt: string;
}

export const BREAKS: Break[] = [
  {
    id: '394',
    number: 394,
    title: '2025-26 Topps Bundesliga Gold',
    box: '2025-26 Topps Bundesliga Gold Hobby Boks',
    format: 'random',
    image: bundesligaImg,
    boxPrice: 3299,
    slotPrice: 199,
    spots: 18,
    status: 'Sold out, ready to draw',
    startsAt: 'Tonight 20:00',
  },
  {
    id: '403',
    number: 403,
    title: 'Futera World Unique 2025/26',
    box: 'Futera World Unique 2025/26 Display Boks',
    format: 'pyt',
    image: futeraImg,
    boxPrice: 6999,
    spots: 43,
    status: '77% sold, fillers open',
    startsAt: 'Tonight 21:00',
  },
];

/** Box checklist library: the team list that loads when a box is picked. */
export const CHECKLISTS: Record<string, string[]> = {
  '2025-26 Topps Bundesliga Gold Hobby Boks': [
    'FC Bayern München', 'Borussia Dortmund', 'Bayer 04 Leverkusen', 'RB Leipzig',
    'Eintracht Frankfurt', 'VfB Stuttgart', 'SC Freiburg', 'VfL Wolfsburg',
    'Borussia Mönchengladbach', '1. FC Union Berlin', 'SV Werder Bremen', 'TSG Hoffenheim',
    'FC Augsburg', '1. FSV Mainz 05', '1. FC Heidenheim', 'FC St. Pauli',
    '1. FC Köln', 'Hamburger SV',
  ],
};

/** Mock Shopify orders for break #394, in purchase order. Some buyers hold several spots. */
export const ORDERS_394: { order: string; buyer: string; qty: number }[] = [
  { order: '#10482', buyer: 'kortkongen', qty: 2 },
  { order: '#10485', buyer: 'nordic_pulls', qty: 1 },
  { order: '#10487', buyer: 'fjordfan88', qty: 1 },
  { order: '#10490', buyer: 'ripit_rune', qty: 3 },
  { order: '#10491', buyer: 'golden_goal_gro', qty: 1 },
  { order: '#10496', buyer: 'bergen_breaks', qty: 1 },
  { order: '#10498', buyer: 'stavanger_slabs', qty: 2 },
  { order: '#10503', buyer: 'pakkeprinsen', qty: 1 },
  { order: '#10507', buyer: 'trondheim_tops', qty: 1 },
  { order: '#10511', buyer: 'auto_anders', qty: 2 },
  { order: '#10514', buyer: 'refractor_rita', qty: 1 },
  { order: '#10519', buyer: 'kortkongen', qty: 1 },
  { order: '#10522', buyer: 'hobbyboks_henrik', qty: 1 },
];

/** Break #403, pick your team. Prices from breakpodden.com, sold status mocked to ~77%. */
const PYT_403: [string, number, string | null][] = [
  ['Argentina - Lionel Messi', 399, null],
  ['Argentina - Others', 399, null],
  ['Belgium', 149, 'fjordfan88'],
  ['Brazil - Estevao/Endrick', 99, 'pakkeprinsen'],
  ['Brazil - Ronaldinho', 129, 'golden_goal_gro'],
  ['Brazil - Kaka/R9', 149, 'kortkongen'],
  ['Brazil - Others (Pele incl.)', 399, null],
  ['Cameroon/Ghana', 129, 'bergen_breaks'],
  ['Croatia', 149, 'ripit_rune'],
  ['Czechia/Slovakia/Serbia', 69, 'nordic_pulls'],
  ['Ecuador/Colombia', 69, 'auto_anders'],
  ['Egypt', 69, 'stavanger_slabs'],
  ['England - Gerrard/Rooney', 129, 'trondheim_tops'],
  ['England - Jude/Jobe', 129, 'refractor_rita'],
  ['England - Saka/Rice', 149, 'hobbyboks_henrik'],
  ['England - Others', 349, null],
  ['France - Mbappe', 149, 'kortkongen'],
  ['France - Zidane', 129, 'ripit_rune'],
  ['France - Henry/Cantona/Pires', 199, 'tromso_trades'],
  ['France - Others', 499, null],
  ['Georgia/Uzbekistan', 49, 'nordic_pulls'],
  ['Germany', 349, null],
  ['Italy', 399, null],
  ['Ivory Coast/Nigeria', 129, 'bergen_breaks'],
  ['Japan/Australia/New Zealand', 39, 'pakkeprinsen'],
  ['Morocco/Algeria', 69, 'golden_goal_gro'],
  ['Netherlands', 199, 'auto_anders'],
  ['Norway', 399, 'kortkongen'],
  ['Poland/Ukraine', 69, 'fjordfan88'],
  ['Portugal - Cristiano', 249, null],
  ['Portugal - Others', 249, 'stavanger_slabs'],
  ['Rest of the World', 199, 'ripit_rune'],
  ['Scotland/Republic of Ireland', 49, 'trondheim_tops'],
  ['Senegal/DR Congo', 69, 'refractor_rita'],
  ['South Korea', 69, 'hobbyboks_henrik'],
  ['Spain - Lamine Yamal', 399, null],
  ['Spain - Others', 499, null],
  ['Sweden/Denmark', 149, 'tromso_trades'],
  ['Switzerland/Slovenia', 69, 'auto_anders'],
  ['Türkiye/Greece', 99, 'nordic_pulls'],
  ['United States/Mexico/Canada', 149, 'bodo_binders'],
  ['Uruguay/Paraguay/Chile', 69, 'bodo_binders'],
  ['Wales/Northern Ireland', 49, 'pakkeprinsen'],
];

CHECKLISTS['Futera World Unique 2025/26 Display Boks'] = PYT_403.map(([team]) => team);

export const initialPytSlots = (): Slot[] =>
  PYT_403.map(([team, price, owner]) => ({ team, price, owner }));

export const FILLER_PRICE = 49;

/** Mock filler entries for break #403: [username, number of entries]. */
const FILLER_BUYERS: [string, number][] = [
  ['kortkongen', 6], ['nordic_pulls', 3], ['fjordfan88', 4], ['ripit_rune', 8],
  ['golden_goal_gro', 2], ['bergen_breaks', 5], ['stavanger_slabs', 3], ['pakkeprinsen', 4],
  ['trondheim_tops', 2], ['auto_anders', 6], ['refractor_rita', 3], ['hobbyboks_henrik', 2],
  ['tromso_trades', 5], ['bodo_binders', 3], ['oslo_owls', 4], ['drammen_drops', 2],
  ['lofoten_lots', 3], ['kristiansand_kid', 2], ['molde_mint', 4], ['tonsberg_tins', 3],
  ['haugesund_hits', 2], ['alesund_autos', 3],
];

/** One line per entry, made unique with a running entry number so each can be tracked. */
export const fillerEntries = (): string[] => {
  const out: string[] = [];
  let n = 1;
  for (const [buyer, qty] of FILLER_BUYERS) {
    for (let i = 0; i < qty; i++) out.push(`${buyer} · F${String(n++).padStart(2, '0')}`);
  }
  return out;
};

export const entryBuyer = (entry: string) => entry.split(' · ')[0];

/** Giveaway entries: one per purchase across tonight's breaks. */
export const giveawayEntries = (): string[] => {
  const out: string[] = [];
  for (const o of ORDERS_394) for (let i = 0; i < o.qty; i++) out.push(o.buyer);
  for (const [, , owner] of PYT_403) if (owner) out.push(owner);
  return out;
};

export const uniqueEntrants = () => [...new Set(giveawayEntries())];

export const kr = (n: number) => `${n.toLocaleString('nb-NO')} kr`;
