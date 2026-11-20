/**
 * 2.7 — Quand le cabinet exige la double authentification et que la personne ne l'a pas
 * encore activée, l'API répond 403 « two_factor_setup_required » : on l'envoie sur la
 * page Sécurité pour l'activer.
 */
export const TWO_FACTOR_PAGE = '/admin/securite';

// Plusieurs appels partent en même temps au chargement d'une page : une seule redirection,
// sinon elles s'annulent l'une l'autre et la page reste en chargement sans fin.
let redirecting = false;

export function redirectIfTwoFactorRequired(status: number, data: any): boolean {
  if (status !== 403 || data?.code !== 'two_factor_setup_required' || typeof window === 'undefined') {
    return false;
  }
  if (!redirecting && !window.location.pathname.startsWith(TWO_FACTOR_PAGE)) {
    redirecting = true;
    window.location.assign(`${TWO_FACTOR_PAGE}?obligatoire=1`);
  }
  return true;
}
