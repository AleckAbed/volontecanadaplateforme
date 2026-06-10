/**
 * Helper de localisation pour les messages Zod.
 *
 * Lit `localStorage.app_language` au chargement du module et retourne la
 * traduction correspondante. Les messages sont capturés une fois au build des
 * schémas (module-load) — pour changer de langue, rafraîchir la page.
 */
export function tMsg(fr: string, en: string, es: string): string {
  if (typeof window === 'undefined') return fr;
  try {
    const v = localStorage.getItem('app_language');
    if (v === 'en') return en;
    if (v === 'es') return es;
  } catch {}
  return fr;
}
