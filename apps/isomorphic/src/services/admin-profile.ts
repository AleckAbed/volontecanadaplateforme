import { getAuthToken } from '@/lib/auth-storage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

function getApiUrl(): string {
  if (typeof window !== 'undefined') {
    const fromEnv = process.env.NEXT_PUBLIC_API_URL;
    if (fromEnv?.trim()) return fromEnv.trim().replace(/\/+$/, '');
    return `${window.location.protocol}//${window.location.hostname}:8000/api`;
  }
  return API_BASE_URL;
}

async function authFetch(endpoint: string, options: RequestInit = {}, asJson = true) {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (asJson && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${getApiUrl()}${endpoint}`, { ...options, credentials: 'include', headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any)?.message || 'Une erreur est survenue');
  return data;
}

export interface LockBackground {
  filename: string;
  url: string; // relative API path (without API base) — e.g. /admin/profile/lock-screen-backgrounds/xxx.jpg
}

export interface LockScreenSettings {
  interval: number;
  backgrounds: LockBackground[];
}

export const adminProfileService = {
  async updateProfile(payload: { name?: string; email?: string }) {
    const res = await authFetch('/admin/profile', { method: 'PUT', body: JSON.stringify(payload) });
    return res.data;
  },

  async changePassword(payload: { current_password: string; new_password: string; new_password_confirmation: string }) {
    await authFetch('/admin/profile/change-password', { method: 'POST', body: JSON.stringify(payload) });
  },

  async getLockScreenSettings(): Promise<LockScreenSettings> {
    const res = await authFetch('/admin/profile/lock-screen-settings');
    return res.data;
  },

  async updateLockScreenSettings(payload: { interval: number }): Promise<void> {
    await authFetch('/admin/profile/lock-screen-settings', { method: 'PUT', body: JSON.stringify(payload) });
  },

  async uploadLockScreenBackgrounds(files: File[]): Promise<LockScreenSettings> {
    const fd = new FormData();
    files.forEach((f) => fd.append('images[]', f));
    const res = await authFetch('/admin/profile/lock-screen-backgrounds', { method: 'POST', body: fd }, false);
    return res.data;
  },

  async deleteLockScreenBackground(filename: string): Promise<void> {
    await authFetch(`/admin/profile/lock-screen-backgrounds/${encodeURIComponent(filename)}`, { method: 'DELETE' });
  },

  /**
   * Récupère l'image protégée et renvoie une Blob URL utilisable dans <img src>.
   * Penser à révoquer l'URL avec URL.revokeObjectURL quand elle n'est plus utilisée.
   */
  async fetchBackgroundBlobUrl(filename: string): Promise<string> {
    const token = getAuthToken();
    const headers: Record<string, string> = { Accept: 'image/*' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${getApiUrl()}/admin/profile/lock-screen-backgrounds/${encodeURIComponent(filename)}`, { credentials: 'include', headers });
    if (!res.ok) throw new Error('Image introuvable');
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },
};
