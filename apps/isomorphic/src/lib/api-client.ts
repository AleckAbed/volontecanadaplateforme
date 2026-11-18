/**
 * Client API unique — remplace les copies locales de getApiUrl/authFetch
 * dupliquées dans chaque fichier de src/services/.
 *
 * Auth : cookie HttpOnly (credentials: 'include') + Authorization Bearer en
 * secours (indispensable en prod cross-origin Vercel ↔ API, où le cookie
 * SameSite peut ne pas suivre — cf. correctifs PDF preview).
 */

import { getAuthToken } from '@/lib/auth-storage';
import { redirectIfTwoFactorRequired } from '@/lib/two-factor-guard';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

/** URL de l'API : NEXT_PUBLIC_API_URL si défini, sinon même host que la page sur le port 8000. */
export function getApiUrl(): string {
  if (typeof window !== 'undefined') {
    const fromEnv = process.env.NEXT_PUBLIC_API_URL;
    if (fromEnv?.trim()) return fromEnv.trim().replace(/\/+$/, '');
    return `${window.location.protocol}//${window.location.hostname}:8000/api`;
  }
  return API_BASE_URL;
}

/** En-têtes standard (Accept + Bearer si token présent), fusionnés avec `extra`. */
export function authHeaders(extra?: HeadersInit): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...((extra as Record<string, string>) || {}),
  };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/**
 * Fetch authentifié, parse JSON, jette une Error(message) si !ok.
 * - Ajoute Content-Type: application/json automatiquement sauf si le body est
 *   un FormData (le navigateur pose alors la boundary multipart) ou si
 *   `asJson` est false.
 */
export async function authFetch(endpoint: string, options: RequestInit = {}, asJson = true): Promise<any> {
  const headers = authHeaders(options.headers);
  if (asJson && options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${getApiUrl()}${endpoint}`, { ...options, credentials: 'include', headers });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    redirectIfTwoFactorRequired(res.status, data);
    throw new Error((data as any)?.message || 'Une erreur est survenue');
  }
  return data;
}

/**
 * Fetch public (pages client sans compte). Envoie quand même le Bearer s'il
 * existe — certains endpoints publics personnalisent la réponse pour un admin
 * connecté (ex. sources news suivies) ; les autres l'ignorent.
 */
export async function publicFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const headers = authHeaders(options.headers);
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${getApiUrl()}${endpoint}`, { ...options, credentials: 'include', headers });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any)?.message || 'Une erreur est survenue');
  return data;
}
