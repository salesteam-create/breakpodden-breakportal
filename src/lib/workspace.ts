// Workspace settings: everything that belongs to one business lives here, so the
// portal itself stays generic. Another business would swap this file (later: a
// database row per workspace) and keep every screen as it is.

import logoMark from '../assets/logo-mark.svg';
import logoFull from '../assets/logo-full.svg';

export interface Workspace {
  name: string;
  domain: string;
  logoMark: string;
  logoFull: string;
  currency: string;
  host: { name: string; initials: string };
}

export const WORKSPACE: Workspace = {
  name: 'Breakpodden',
  domain: 'breakpodden.com',
  logoMark,
  logoFull,
  currency: 'NOK',
  host: { name: 'Host', initials: 'BP' },
};

export const PRODUCT = 'Break Portal';
