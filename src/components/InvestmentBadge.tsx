import { getInvestmentLevel } from '@/lib/investmentLevels';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface InvestmentBadgeProps {
  totalVolume: number;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export function InvestmentBadge({ totalVolume, size = 'sm', showLabel = false }: InvestmentBadgeProps) {
  const level = getInvestmentLevel(totalVolume);
  const Icon = level.icon;
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4.5 w-4.5';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center gap-1 rounded-full font-semibold ${
              size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1'
            }`}
            style={{ backgroundColor: level.bgColor, color: level.textColor }}
          >
            <Icon className={iconSize} />
            {showLabel && level.name}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Nível {level.name} — R$ {totalVolume.toLocaleString('pt-BR')} investidos</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
