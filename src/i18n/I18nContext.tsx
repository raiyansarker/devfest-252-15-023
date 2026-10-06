import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { en } from './en';
import { bn } from './bn';
import type { TranslationKey } from './en';

export type Language = 'en' | 'bn';

interface I18nContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const translations = { en, bn } as const;

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('appLang');
      if (saved === 'en' || saved === 'bn') return saved;
    }
    return 'en';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('appLang', lang);
    }
  }, [lang]);

  const t = (key: TranslationKey): string => translations[lang][key];

  return (
    <I18nContext value={{ lang, setLang, t }}>
      {children}
    </I18nContext>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
