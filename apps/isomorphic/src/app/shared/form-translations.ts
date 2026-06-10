/**
 * Traductions communes pour les formulaires questionnaire (FR/EN).
 * Utilisé par client-form, sponsor-form, pstq-form.
 */

export type FormLocale = 'fr' | 'en' | 'es';

export const commonT = {
  fr: {
    select: 'Sélectionner',
    yes: 'Oui',
    no: 'Non',
    step: 'Étape',
    of: 'sur',
    save: 'Sauvegarder',
    quit: 'Quitter',
    questions: 'Questions?',
    language: 'Langue',
    french: 'Français',
    english: 'English',
    dateFormat: 'Date (AAAA/MM/JJ):',
    dateFormatEn: 'Date (YYYY/MM/DD):',
    surname: 'Nom(s) de famille:',
    givenName: 'Prénom(s):',
    country: 'Pays:',
    place: 'Lieu:',
  },
  en: {
    select: 'Select',
    yes: 'Yes',
    no: 'No',
    step: 'Step',
    of: 'of',
    save: 'Save',
    quit: 'Quit',
    questions: 'Questions?',
    language: 'Language',
    french: 'French',
    english: 'English',
    dateFormat: 'Date (YYYY/MM/DD):',
    dateFormatEn: 'Date (YYYY/MM/DD):',
    surname: 'Surname(s):',
    givenName: 'Given name(s):',
    country: 'Country:',
    place: 'Place:',
  },
  es: {
    select: 'Seleccionar',
    yes: 'Sí',
    no: 'No',
    step: 'Paso',
    of: 'de',
    save: 'Guardar',
    quit: 'Salir',
    questions: '¿Preguntas?',
    language: 'Idioma',
    french: 'Francés',
    english: 'Inglés',
    dateFormat: 'Fecha (AAAA/MM/DD):',
    dateFormatEn: 'Date (YYYY/MM/DD):',
    surname: 'Apellido(s):',
    givenName: 'Nombre(s):',
    country: 'País:',
    place: 'Lugar:',
  },
} as const;

export function getCommonT(locale: FormLocale) {
  return commonT[locale] || commonT.fr;
}
