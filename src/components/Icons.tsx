// Icon set: Phosphor (light weight by default), mapped to the names the portal uses.
import {
  House, DiceFive, Ticket, Aperture, Bird, ListBullets, ShieldCheck, LockSimple, LockSimpleOpen,
  Sparkle, Shuffle, FlagCheckered, ArrowSquareOut, MagnifyingGlass, Bell, Sun, Moon,
  ArrowCounterClockwise, List, X, ArrowRight, ArrowLeft, CaretRight, CaretDown, Check,
  DownloadSimple, UploadSimple, ShoppingCartSimple, UsersThree, SquaresFour, Rows, Clock,
  Package, Trophy, Scissors, Plus, Trash, ClipboardText, Broadcast, Lightning, Eye, FileText,
  MagicWand, Cards, SealCheck, GearSix, ArrowDown, Fire, Crown, SignOut, Hash, Storefront,
  type Icon as PhosphorIcon, type IconWeight,
} from '@phosphor-icons/react';

const MAP: Record<string, PhosphorIcon> = {
  home: House, dice: DiceFive, ticket: Ticket, wheel: Aperture, duck: Bird, list: ListBullets,
  shield: ShieldCheck, lock: LockSimple, unlock: LockSimpleOpen, sparkle: Sparkle, shuffle: Shuffle,
  flag: FlagCheckered, popout: ArrowSquareOut, search: MagnifyingGlass, bell: Bell, sun: Sun, moon: Moon,
  reset: ArrowCounterClockwise, menu: List, close: X, x: X, arrow: ArrowRight, back: ArrowLeft,
  chevron: CaretRight, caret: CaretDown, check: Check, download: DownloadSimple, upload: UploadSimple,
  cart: ShoppingCartSimple, users: UsersThree, grid: SquaresFour, rows: Rows, clock: Clock, box: Package,
  trophy: Trophy, scissors: Scissors, plus: Plus, trash: Trash, paste: ClipboardText, live: Broadcast,
  bolt: Lightning, eye: Eye, file: FileText, ai: MagicWand, cards: Cards, seal: SealCheck, gear: GearSix,
  down: ArrowDown, fire: Fire, crown: Crown, signout: SignOut, hash: Hash, store: Storefront,
};

interface Props {
  name: string;
  size?: number;
  weight?: IconWeight;
  className?: string;
  /** Accepted for backwards compatibility; Phosphor sets its own stroke. */
  strokeWidth?: number;
}

export default function Icon({ name, size = 18, weight = 'light', className }: Props) {
  const C = MAP[name] ?? Sparkle;
  return <C size={size} weight={weight} className={className} aria-hidden="true" focusable="false" />;
}
