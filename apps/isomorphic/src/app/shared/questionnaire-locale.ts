'use client';

import { atomWithStorage } from 'jotai/utils';

/** Langue des questionnaires (partagée entre client-form, sponsor-form, pstq-form) */
export type FormLocale = 'fr' | 'en' | 'es';

/**
 * Initial value picked from the main app language switcher when first read.
 * Falls back to 'fr' if neither key is set.
 */
function pickInitialLocale(): FormLocale {
  if (typeof window === 'undefined') return 'fr';
  try {
    const stored = localStorage.getItem('questionnaireFormLocale');
    if (stored === 'fr' || stored === 'en' || stored === 'es') return stored;
    const app = localStorage.getItem('app_language');
    if (app === 'fr' || app === 'en' || app === 'es') return app;
  } catch {}
  return 'fr';
}

export const questionnaireLocaleAtom = atomWithStorage<FormLocale>(
  'questionnaireFormLocale',
  pickInitialLocale()
);
