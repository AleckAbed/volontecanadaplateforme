'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from '@/locales/fr.json';
import en from '@/locales/en.json';
import es from '@/locales/es.json';

export const LANG_STORAGE_KEY = 'app_language';
export type Lang = 'fr' | 'en' | 'es';
export const SUPPORTED_LANGS: Lang[] = ['fr', 'en', 'es'];

function getInitialLang(): Lang {
  if (typeof window === 'undefined') return 'fr';
  try {
    const v = localStorage.getItem(LANG_STORAGE_KEY);
    if (v === 'fr' || v === 'en' || v === 'es') return v;
  } catch {}
  return 'fr';
}

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources: {
        fr: { translation: fr },
        en: { translation: en },
        es: { translation: es },
      },
      lng: getInitialLang(),
      fallbackLng: 'fr',
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    });
}

export default i18n;

export function changeLanguage(lang: Lang) {
  try { localStorage.setItem(LANG_STORAGE_KEY, lang); } catch {}
  i18n.changeLanguage(lang);
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app:language-changed', { detail: lang }));
  }
}

export function getCurrentLanguage(): Lang {
  return getInitialLang();
}
