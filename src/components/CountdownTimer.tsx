import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  endDate: string;
  className?: string;
}

export function CountdownTimer({ endDate, className = '' }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    const calc = () => {
      const now = Date.now();
      const end = new Date(endDate).getTime();
      const diff = end - now;
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
      return {
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
        expired: false,
      };
    };
    setTimeLeft(calc());
    const interval = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  if (timeLeft.expired) {
    return (
      <div className={`flex items-center gap-1.5 text-destructive ${className}`}>
        <Clock className="h-4 w-4" />
        <span className="text-xs font-medium">Encerrado</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xs text-muted-foreground">Encerra em</span>
      <div className="flex items-center gap-1">
        {timeLeft.days > 0 && (
          <div className="flex flex-col items-center">
            <span className="text-lg md:text-xl font-bold text-primary tabular-nums">{timeLeft.days}</span>
            <span className="text-[10px] uppercase text-muted-foreground tracking-wider">Dias</span>
          </div>
        )}
        {timeLeft.days > 0 && <span className="text-lg font-bold text-muted-foreground/50 mx-0.5">:</span>}
        <div className="flex flex-col items-center">
          <span className="text-lg md:text-xl font-bold text-primary tabular-nums">{String(timeLeft.hours).padStart(2, '0')}</span>
          <span className="text-[10px] uppercase text-muted-foreground tracking-wider">Hrs</span>
        </div>
        <span className="text-lg font-bold text-muted-foreground/50 mx-0.5">:</span>
        <div className="flex flex-col items-center">
          <span className="text-lg md:text-xl font-bold text-primary tabular-nums">{String(timeLeft.minutes).padStart(2, '0')}</span>
          <span className="text-[10px] uppercase text-muted-foreground tracking-wider">Min</span>
        </div>
        <span className="text-lg font-bold text-muted-foreground/50 mx-0.5">:</span>
        <div className="flex flex-col items-center">
          <span className="text-lg md:text-xl font-bold text-primary tabular-nums">{String(timeLeft.seconds).padStart(2, '0')}</span>
          <span className="text-[10px] uppercase text-muted-foreground tracking-wider">Seg</span>
        </div>
      </div>
    </div>
  );
}
