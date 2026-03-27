import { cn } from '@/lib/utils';

interface LiveIndicatorProps {
  connected?: boolean;
  className?: string;
  size?: 'sm' | 'md';
  label?: string;
}

export function LiveIndicator({ connected = true, className, size = 'sm', label = 'LIVE' }: LiveIndicatorProps) {
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';
  const ringSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';

  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <span className="relative flex items-center justify-center">
        {connected && (
          <span
            className={cn('absolute animate-ping rounded-full opacity-50', ringSize)}
            style={{ backgroundColor: 'hsl(var(--red, 0 84% 60%))' }}
          />
        )}
        <span
          className={cn('relative rounded-full', dotSize)}
          style={{ backgroundColor: connected ? 'hsl(var(--red, 0 84% 60%))' : 'hsl(var(--muted-foreground))' }}
        />
      </span>
      <span
        className={cn('font-bold tracking-wider', textSize)}
        style={{ color: connected ? 'hsl(var(--red, 0 84% 60%))' : 'hsl(var(--muted-foreground))' }}
      >
        {label}
      </span>
    </span>
  );
}
