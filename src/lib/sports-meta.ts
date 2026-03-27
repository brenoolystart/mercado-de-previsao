import {
  Trophy, Dribbble, CircleDot, Gamepad2, Swords, Target,
  Bike, Flag, Crown, Dumbbell, Flame, Crosshair, Award,
  Volleyball, Timer, Zap
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const SPORT_BADGE_MAP: Record<string, string> = {
  nba: 'NBA',
  ncaab: 'NCAA',
  nhl: 'NHL',
  soccer: 'FC',
  esports: 'GG',
  tennis: 'ACE',
  cricket: 'CRI',
  basketball: 'BB',
  baseball: 'MLB',
  hockey: 'HKY',
  rugby: 'RUG',
  lacrosse: 'LAX',
  ufc: 'UFC',
  football: 'NFL',
  'table-tennis': 'TT',
  golf: 'PGA',
  'formula-1': 'F1',
  chess: 'CH',
  boxing: 'KO',
  pickleball: 'PB',
};

export const SPORT_ICON_COMPONENT: Record<string, LucideIcon> = {
  nba: Dribbble,
  ncaab: Trophy,
  nhl: Target,
  soccer: CircleDot,
  esports: Gamepad2,
  tennis: Zap,
  cricket: Award,
  basketball: Dribbble,
  baseball: Crosshair,
  hockey: Target,
  rugby: Volleyball,
  lacrosse: Swords,
  ufc: Flame,
  football: Dumbbell,
  'table-tennis': Timer,
  golf: Flag,
  'formula-1': Bike,
  chess: Crown,
  boxing: Flame,
  pickleball: CircleDot,
};

export function getSportIcon(sportId: string): LucideIcon {
  return SPORT_ICON_COMPONENT[sportId] || Trophy;
}

export function getSportBadgeLabel(sportId: string, fallbackLabel: string) {
  return SPORT_BADGE_MAP[sportId] || fallbackLabel.slice(0, 3).toUpperCase();
}

/** @deprecated Use getSportIcon instead */
export function getSportIconGlyph(sportId: string) {
  return '•';
}

export function getLabelInitials(label: string) {
  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}
