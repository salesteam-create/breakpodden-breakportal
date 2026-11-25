// Stock photography, all from Unsplash (free to use under the Unsplash License,
// https://unsplash.com/license). Re-encoded to WebP at 1600x900; the abstract gradient
// was hue-shifted to the brand gold, the notebook mirrored and the card deck placed
// on an extended black canvas so each subject sits clear of the text.
import cards from '../assets/stock/cards.webp';
import pitch from '../assets/stock/pitch.webp';
import dice from '../assets/stock/dice.webp';
import confetti from '../assets/stock/confetti.webp';
import ducks from '../assets/stock/ducks.webp';
import stream from '../assets/stock/stream.webp';
import abstract from '../assets/stock/abstract.webp';
import cardwall from '../assets/stock/cardwall.webp';
import avatar from '../assets/stock/avatar.webp';
import arena from '../assets/stock/arena.webp';
import studio from '../assets/stock/studio.webp';
import party from '../assets/stock/party.webp';

export const MEDIA = { cards, pitch, dice, confetti, ducks, stream, abstract, cardwall, avatar, arena, studio, party };

/** Credits, kept with the images. Chosen for one calm subject and empty space for text. */
export const CREDITS = [
  { key: 'cards', by: 'Klim Musalimov', url: 'https://unsplash.com/photos/yJ0pNMKbyas' },
  { key: 'pitch', by: 'Michal Balog', url: 'https://unsplash.com/photos/YERcZ48CyVc' },
  { key: 'dice', by: 'Alois Komenda', url: 'https://unsplash.com/photos/hAdfTKFXmwM' },
  { key: 'confetti', by: 'Ivona Rož', url: 'https://unsplash.com/photos/UIGSQ8K9xDU' },
  { key: 'ducks', by: 'Matthew McBrayer', url: 'https://unsplash.com/photos/67eas7lSruI' },
  { key: 'stream', by: 'Klim Musalimov', url: 'https://unsplash.com/photos/1vfuVGy5rYM' },
  { key: 'abstract', by: 'Gradient Wallpapers', url: 'https://unsplash.com/photos/5Q9Gf0WSyLk' },
  { key: 'cardwall', by: 'Kelly Sikkema', url: 'https://unsplash.com/photos/XH0VCNKhEkM' },
  { key: 'arena', by: 'Karsten Winegeart', url: 'https://unsplash.com/photos/DtjUdpHuc-I' },
  { key: 'studio', by: 'Danny Pérez', url: 'https://unsplash.com/photos/yjlTDZdsvak' },
  { key: 'party', by: 'Aaron Paul', url: 'https://unsplash.com/photos/JMpnwlDTSBM' },
  { key: 'avatar', by: 'SABBIR BHUIYAN', url: 'https://unsplash.com/photos/DDqybibS980' },
];
