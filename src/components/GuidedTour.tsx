import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronRight, ChevronLeft, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TourStep {
  selector: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    selector: '[data-tour="search"]',
    title: '🔍 Pesquise Mercados',
    description: 'Use a barra de pesquisa para encontrar qualquer mercado de palpites. Digite um tema e veja os resultados em tempo real.',
    position: 'bottom',
  },
  {
    selector: '[data-tour="categories"]',
    title: '📂 Categorias',
    description: 'Navegue entre as categorias para filtrar os mercados por tema: cripto, política, esportes e muito mais.',
    position: 'bottom',
  },
  {
    selector: '[data-tour="market-card"]',
    title: '📊 Cartões de Mercado',
    description: 'Cada cartão mostra um mercado ativo. Veja a probabilidade atual, clique em "Sim" ou "Não" para dar seu palpite!',
    position: 'top',
  },
  {
    selector: '[data-tour="wallet"]',
    title: '💰 Sua Carteira',
    description: 'Aqui fica seu saldo. Clique para ver detalhes, depositar via PIX, sacar seus ganhos e acompanhar seu histórico.',
    position: 'bottom',
  },
  {
    selector: '[data-tour="notifications"]',
    title: '🔔 Notificações',
    description: 'Receba alertas quando alguém curtir ou comentar nos seus posts da comunidade. Fique por dentro de tudo!',
    position: 'bottom',
  },
  {
    selector: '[data-tour="community"]',
    title: '💬 Comunidade',
    description: 'Acesse o feed social, compartilhe análises e interaja com outros usuários. Construa sua reputação!',
    position: 'bottom',
  },
];

const TOUR_STORAGE_KEY = 'onchoice-tour-completed';

export function GuidedTour() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});
  const [arrowPosition, setArrowPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('top');
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Listen for custom event to start tour from "Como funciona" button
  useEffect(() => {
    const handler = () => {
      setCurrentStep(0);
      setIsActive(true);
    };
    window.addEventListener('start-guided-tour', handler);
    return () => window.removeEventListener('start-guided-tour', handler);
  }, []);

  const positionTooltip = useCallback(() => {
    const step = TOUR_STEPS[currentStep];
    const el = document.querySelector(step.selector);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const padding = 8;
    const tooltipWidth = 320;
    const tooltipHeight = tooltipRef.current?.offsetHeight || 180;

    // Highlight
    setHighlightStyle({
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    });

    const pos = step.position || 'bottom';
    let top = 0;
    let left = 0;

    switch (pos) {
      case 'bottom':
        top = rect.bottom + 16;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        setArrowPosition('top');
        break;
      case 'top':
        top = rect.top - tooltipHeight - 16;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        setArrowPosition('bottom');
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - 16;
        setArrowPosition('right');
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + 16;
        setArrowPosition('left');
        break;
    }

    // Keep tooltip within viewport
    left = Math.max(12, Math.min(left, window.innerWidth - tooltipWidth - 12));
    top = Math.max(12, top);

    setTooltipStyle({ top, left, width: tooltipWidth });
  }, [currentStep]);

  useEffect(() => {
    if (!isActive) return;

    const step = TOUR_STEPS[currentStep];
    const el = document.querySelector(step.selector);
    if (!el) return;

    // Desktop: avoid forcing scroll position (prevents scroll lock feeling)
    if (window.innerWidth >= 1024) {
      positionTooltip();
      return;
    }

    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, [isActive, currentStep, positionTooltip]);

  useEffect(() => {
    if (!isActive) return;

    const timer = setTimeout(positionTooltip, 100);
    const shouldTrackScroll = window.innerWidth < 1024;
    let scrollRaf: number | null = null;

    const handleScroll = () => {
      if (scrollRaf != null) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = null;
        positionTooltip();
      });
    };

    window.addEventListener('resize', positionTooltip);
    if (shouldTrackScroll) {
      window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    }

    return () => {
      clearTimeout(timer);
      if (scrollRaf != null) cancelAnimationFrame(scrollRaf);
      window.removeEventListener('resize', positionTooltip);
      if (shouldTrackScroll) {
        window.removeEventListener('scroll', handleScroll, true);
      }
    };
  }, [isActive, positionTooltip]);

  const endTour = useCallback(() => {
    setIsActive(false);
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
  }, []);

  const nextStep = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      endTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  if (!isActive) return null;

  const step = TOUR_STEPS[currentStep];
  const isLast = currentStep === TOUR_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Overlay visual only (does not block page scroll) */}
      <div className="absolute inset-0 bg-black/60 transition-opacity duration-300 pointer-events-none" />

      {/* Highlight cutout */}
      <div
        className="absolute rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-transparent z-[10000] transition-all duration-300 pointer-events-none"
        style={{
          ...highlightStyle,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
        }}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="absolute z-[10001] animate-scale-in pointer-events-auto"
        style={tooltipStyle}
      >
        <div className={cn(
          "bg-card border border-border rounded-xl shadow-2xl p-5 relative",
        )}>
          {/* Arrow */}
          <div className={cn(
            "absolute w-3 h-3 bg-card border border-border rotate-45",
            arrowPosition === 'top' && '-top-1.5 left-1/2 -translate-x-1/2 border-b-0 border-r-0',
            arrowPosition === 'bottom' && '-bottom-1.5 left-1/2 -translate-x-1/2 border-t-0 border-l-0',
            arrowPosition === 'left' && '-left-1.5 top-1/2 -translate-y-1/2 border-t-0 border-r-0',
            arrowPosition === 'right' && '-right-1.5 top-1/2 -translate-y-1/2 border-b-0 border-l-0',
          )} />

          {/* Close */}
          <button onClick={endTour} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>

          {/* Content */}
          <h3 className="text-base font-bold text-foreground mb-2 pr-6">{step.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">{step.description}</p>

          {/* Progress */}
          <div className="flex items-center gap-1.5 mb-4">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === currentStep ? 'w-6 bg-primary' : i < currentStep ? 'w-3 bg-primary/50' : 'w-3 bg-muted',
                )}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={endTour} className="text-muted-foreground">
              Pular tour
            </Button>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="outline" size="sm" onClick={prevStep}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              <Button size="sm" onClick={nextStep} className="gap-1.5">
                {isLast ? (
                  <>
                    Começar <Rocket className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Próximo <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-3 text-center">
            {currentStep + 1} de {TOUR_STEPS.length}
          </p>
        </div>
      </div>
    </div>
  );
}
