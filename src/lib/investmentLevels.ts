import { Shield, Gem, Crown, Star, Award } from 'lucide-react';

export interface InvestmentLevel {
  name: string;
  minAmount: number;
  icon: typeof Shield;
  color: string; // HSL token-compatible
  bgColor: string;
  textColor: string;
}

export const INVESTMENT_LEVELS: InvestmentLevel[] = [
  {
    name: 'Bronze',
    minAmount: 0,
    icon: Shield,
    color: 'hsl(30, 60%, 50%)',
    bgColor: 'hsl(30, 60%, 50%, 0.15)',
    textColor: 'hsl(30, 60%, 50%)',
  },
  {
    name: 'Prata',
    minAmount: 500,
    icon: Award,
    color: 'hsl(210, 10%, 60%)',
    bgColor: 'hsl(210, 10%, 60%, 0.15)',
    textColor: 'hsl(210, 10%, 60%)',
  },
  {
    name: 'Ouro',
    minAmount: 2000,
    icon: Star,
    color: 'hsl(45, 93%, 47%)',
    bgColor: 'hsl(45, 93%, 47%, 0.15)',
    textColor: 'hsl(45, 93%, 47%)',
  },
  {
    name: 'Diamante',
    minAmount: 10000,
    icon: Gem,
    color: 'hsl(200, 98%, 55%)',
    bgColor: 'hsl(200, 98%, 55%, 0.15)',
    textColor: 'hsl(200, 98%, 55%)',
  },
  {
    name: 'Lenda',
    minAmount: 50000,
    icon: Crown,
    color: 'hsl(280, 87%, 65%)',
    bgColor: 'hsl(280, 87%, 65%, 0.15)',
    textColor: 'hsl(280, 87%, 65%)',
  },
];

export function getInvestmentLevel(totalVolume: number): InvestmentLevel {
  let level = INVESTMENT_LEVELS[0];
  for (const l of INVESTMENT_LEVELS) {
    if (totalVolume >= l.minAmount) {
      level = l;
    }
  }
  return level;
}

export function getNextLevel(totalVolume: number): { level: InvestmentLevel; remaining: number } | null {
  const currentIdx = INVESTMENT_LEVELS.findIndex((l, i) => {
    const next = INVESTMENT_LEVELS[i + 1];
    return totalVolume >= l.minAmount && (!next || totalVolume < next.minAmount);
  });

  if (currentIdx === INVESTMENT_LEVELS.length - 1) return null;

  const next = INVESTMENT_LEVELS[currentIdx + 1];
  return { level: next, remaining: next.minAmount - totalVolume };
}
