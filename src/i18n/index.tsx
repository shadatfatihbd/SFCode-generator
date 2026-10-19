import React, { createContext, useContext, useEffect, useState } from 'react';
import { en } from './en';
import { bn } from './bn';

export type Language = 'en' | 'bn';
export type TranslationDict = typeof en;

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationDict;
}

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEY = 'sfcode_studio_lang';

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'bn') return saved;
      if (typeof navigator !== 'undefined' && navigator.language.startsWith('bn')) {
        return 'bn';
      }
    } catch {
      // Fallback
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      if (language === 'bn') {
        document.body.classList.add('font-bengali');
      } else {
        document.body.classList.remove('font-bengali');
      }
    }
  }, [language]);

  const t = language === 'bn' ? (bn as unknown as TranslationDict) : en;

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};
