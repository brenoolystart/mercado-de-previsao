import { useState, useEffect, useRef } from 'react';
import { useTranslateContent } from '@/hooks/useTranslateContent';
import type { PredictionMarket } from '@/hooks/useNews';

/**
 * Takes an array of markets and returns them with translated questions
 * when the user's language requires translation (e.g. PT-BR).
 * Uses AI-based batch translation with in-memory caching.
 */
export function useTranslatedMarkets(markets: PredictionMarket[]): {
  translatedMarkets: PredictionMarket[];
  translating: boolean;
} {
  const { translateTexts, needsTranslation, translating } = useTranslateContent();
  const [translatedMap, setTranslatedMap] = useState<Map<string, string>>(new Map());
  const pendingRef = useRef<Set<string>>(new Set());
  const batchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!needsTranslation || markets.length === 0) return;

    // Use originalQuestion (pure English from API) as source for translation
    const untranslated = markets
      .map(m => m.originalQuestion || m.question)
      .filter(q => !translatedMap.has(q) && !pendingRef.current.has(q));

    if (untranslated.length === 0) return;

    // Mark as pending
    untranslated.forEach(q => pendingRef.current.add(q));

    // Debounce to batch nearby renders
    if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
    batchTimerRef.current = setTimeout(async () => {
      const unique = [...new Set(untranslated)];
      try {
        const translated = await translateTexts(unique);
        setTranslatedMap(prev => {
          const next = new Map(prev);
          unique.forEach((q, i) => {
            next.set(q, translated[i]);
            pendingRef.current.delete(q);
          });
          return next;
        });
      } catch {
        unique.forEach(q => pendingRef.current.delete(q));
      }
    }, 300);

    return () => {
      if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
    };
  }, [markets, needsTranslation, translateTexts, translatedMap]);

  // If no translation needed, return originals
  if (!needsTranslation) return { translatedMarkets: markets, translating: false };

  // Apply translations using originalQuestion as the key
  const translatedMarkets = markets.map(m => {
    const sourceKey = m.originalQuestion || m.question;
    const translated = translatedMap.get(sourceKey);
    if (translated && translated !== sourceKey) {
      return { ...m, question: translated, originalQuestion: m.originalQuestion || m.question };
    }
    return m;
  });

  return { translatedMarkets, translating };
}
