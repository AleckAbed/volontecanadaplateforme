'use client';

import { atomWithStorage } from 'jotai/utils';

/** Langue des questionnaires (partagée entre client-form, sponsor-form, pstq-form) */
export type FormLocale = 'fr' | 'en';

export const questionnaireLocaleAtom = atomWithStorage<FormLocale>(
  'questionnaireFormLocale',
  'fr'
);
