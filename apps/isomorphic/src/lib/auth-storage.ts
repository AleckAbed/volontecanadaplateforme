/**
 * Stockage du token d'auth : localStorage, sessionStorage et cookie (persistance au refresh).
 * Une seule clé partagée pour que ProtectedRoute et l'API lisent la même valeur.
 */

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_TOKEN_COOKIE = 'auth_token';
const COOKIE_MAX_AGE_DAYS = 7;

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const parts = document.cookie.split(';');
    for (const part of parts) {
      const [key, ...valueParts] = part.split('=');
      const k = key?.trim();
      if (k === name && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        if (!value) return null;
        try {
          return decodeURIComponent(value);
        } catch {
          return value;
        }
      }
    }
    return null;
  } catch {
    const match = document.cookie.match(new RegExp('(^|;\\s*)' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'));
    const value = match ? match[2].trim() : null;
    if (!value) return null;
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
}

function setCookie(name: string, value: string, maxAgeDays: number) {
  if (typeof document === 'undefined') return;
  if (!value || typeof value !== 'string') return;
  try {
    const maxAge = maxAgeDays * 24 * 60 * 60;
    const encoded = encodeURIComponent(value);
    document.cookie = `${name}=${encoded}; path=/; max-age=${maxAge}; SameSite=Lax`;
  } catch {
    // ignore
  }
}

function removeCookie(name: string) {
  if (typeof document === 'undefined') return;
  try {
    document.cookie = `${name}=; path=/; max-age=0`;
  } catch {
    // ignore
  }
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    let out: string | null = null;
    const fromCookie = getCookie(AUTH_TOKEN_COOKIE);
    if (fromCookie && fromCookie.length > 0) {
      out = fromCookie;
      try {
        localStorage.setItem(AUTH_TOKEN_KEY, fromCookie);
        sessionStorage.setItem(AUTH_TOKEN_KEY, fromCookie);
      } catch {
        // ignore sync
      }
    }
    if (!out) {
      const fromLocal = localStorage.getItem(AUTH_TOKEN_KEY);
      if (fromLocal && fromLocal.length > 0) out = fromLocal;
    }
    if (!out) {
      const fromSession = sessionStorage.getItem(AUTH_TOKEN_KEY);
      if (fromSession && fromSession.length > 0) out = fromSession;
    }
    return out;
  } catch {
    return null;
  }
}

export const AUTH_TOKEN_SET_EVENT = 'auth-token-set';

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  const t = typeof token === 'string' ? token.trim() : '';
  if (!t) return;
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, t);
    sessionStorage.setItem(AUTH_TOKEN_KEY, t);
    setCookie(AUTH_TOKEN_COOKIE, t, COOKIE_MAX_AGE_DAYS);
    window.dispatchEvent(new CustomEvent(AUTH_TOKEN_SET_EVENT));
  } catch {
    // ignore
  }
}

export function removeAuthToken(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    removeCookie(AUTH_TOKEN_COOKIE);
  } catch {
    // ignore
  }
}

export { AUTH_TOKEN_KEY };

/** Nom du cookie posé par le middleware quand il voit auth_token (évite redirection prématurée). */
export const AUTH_SEEN_COOKIE = 'auth_seen';

/** Lecture d’un cookie côté client (pour auth_seen notamment). */
export function getCookieValue(name: string): string | null {
  return getCookie(name);
}
