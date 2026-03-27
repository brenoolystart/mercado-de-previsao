import { FlaskConical, X, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDemoContext } from '@/contexts/DemoContext';
import { useTranslation } from 'react-i18next';

export function DemoModeBanner() {
  const { demoState, deactivateDemo } = useDemoContext();
  const { t } = useTranslation();

  if (!demoState.isActive) return null;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30">
      <div className="container flex items-center justify-between py-2 px-4">
        <div className="flex items-center gap-2 text-sm">
          <FlaskConical className="h-4 w-4 text-amber-500" />
          <span className="font-medium text-amber-600 dark:text-amber-400">
            {t('demo.bannerActive')}
          </span>
          <Badge variant="outline" className="border-amber-500/50 text-amber-600 dark:text-amber-400 text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {t('demo.daysRemaining', { count: demoState.daysRemaining })}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-amber-600 hover:text-amber-700 dark:text-amber-400"
          onClick={deactivateDemo}
        >
          <X className="h-3 w-3 mr-1" />
          {t('demo.exit')}
        </Button>
      </div>
    </div>
  );
}