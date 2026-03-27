import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'translation_cache_v1';
const MAX_CACHE_ENTRIES = 2000;

// In-memory cache hydrated from localStorage
const cache = new Map<string, string>();
let cacheHydrated = false;

function hydrateCache() {
  if (cacheHydrated) return;
  cacheHydrated = true;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const entries: [string, string][] = JSON.parse(stored);
      entries.forEach(([k, v]) => cache.set(k, v));
    }
  } catch {
    // ignore corrupt data
  }
}

function persistCache() {
  try {
    const entries = [...cache.entries()];
    // Keep only the most recent entries if exceeding limit
    const toStore = entries.length > MAX_CACHE_ENTRIES
      ? entries.slice(entries.length - MAX_CACHE_ENTRIES)
      : entries;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch {
    // storage full — silently ignore
  }
}

// Debounced persist to avoid thrashing localStorage
let persistTimer: ReturnType<typeof setTimeout> | null = null;
function debouncedPersist() {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(persistCache, 1000);
}

export function useTranslateContent() {
  const { i18n } = useTranslation();
  const [loading, setLoading] = useState(false);

  // Hydrate on first use
  useEffect(() => { hydrateCache(); }, []);

  const needsTranslation = i18n.language !== 'en';

  const translateTexts = useCallback(async (texts: string[]): Promise<string[]> => {
    if (!needsTranslation || texts.length === 0) return texts;

    const lang = i18n.language;
    const results: string[] = new Array(texts.length);
    const toTranslate: { index: number; text: string }[] = [];

    // Check cache first (in-memory, backed by localStorage)
    texts.forEach((text, i) => {
      const key = `${lang}:${text}`;
      const cached = cache.get(key);
      if (cached) {
        results[i] = cached;
      } else {
        toTranslate.push({ index: i, text });
      }
    });

    if (toTranslate.length === 0) return results;

    try {
      setLoading(true);
      
      const BATCH_SIZE = 50;
      for (let b = 0; b < toTranslate.length; b += BATCH_SIZE) {
        const batch = toTranslate.slice(b, b + BATCH_SIZE);
        const { data, error } = await supabase.functions.invoke('translate-content', {
          body: { texts: batch.map(t => t.text), targetLang: lang },
        });

        if (error || !data?.translated) {
          batch.forEach(({ index, text }) => { results[index] = text; });
        } else {
          batch.forEach(({ index, text }, i) => {
            const translated = data.translated[i] || text;
            results[index] = translated;
            cache.set(`${lang}:${text}`, translated);
          });
        }
      }
      // Persist new translations to localStorage
      debouncedPersist();
    } catch {
      toTranslate.forEach(({ index, text }) => { results[index] = text; });
    } finally {
      setLoading(false);
    }

    return results;
  }, [needsTranslation, i18n.language]);

  return { translateTexts, needsTranslation, translating: loading };
}
