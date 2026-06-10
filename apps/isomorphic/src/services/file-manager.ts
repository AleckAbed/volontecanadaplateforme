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
  if (!res.ok && res.status !== 423) {
    throw new Error((data as any).message || 'Une erreur est survenue');
  }
  return { status: res.status, body: data };
}

export interface FolderSummary {
  id: number;
  name: string;
  color?: string | null;
  visibility?: 'public' | 'private';
  is_private?: boolean;
  is_locked: boolean;
  is_owner?: boolean;
  items_count: number;
  children_count: number;
  created_at?: string;
}

export interface AdminOption {
  id: number;
  name: string;
  email: string;
}

export interface FolderPermissions {
  visibility: 'public' | 'private';
  owner_id: number | null;
  permitted_admin_ids: number[];
  admins: AdminOption[];
}

export interface FileItemSummary {
  id: number;
  name: string;
  original_filename: string;
  mime_type?: string | null;
  size: number;
  is_favorite: boolean;
  created_at?: string;
}

export interface FolderListing {
  folder: { id: number; name: string; parent_id: number | null; is_locked: boolean } | null;
  breadcrumb: { id: number; name: string }[];
  folders: FolderSummary[];
  items: FileItemSummary[];
}

export const fileManagerService = {
  async list(folderId?: number | null, unlock?: string): Promise<{ ok: true; data: FolderListing } | { ok: false; locked: true; message: string }> {
    const qs = new URLSearchParams();
    if (folderId) qs.set('folder_id', String(folderId));
    if (unlock) qs.set('unlock', unlock);
    const { status, body } = await authFetch(`/admin/file-manager?${qs}`);
    if (status === 423) {
      return { ok: false, locked: true, message: (body as any).message || 'Dossier verrouillé' };
    }
    return { ok: true, data: (body as any).data };
  },

  async getFolderPermissions(id: number): Promise<FolderPermissions> {
    const { body } = await authFetch(`/admin/file-manager/folders/${id}/permissions`);
    return (body as any).data;
  },

  async updateFolderPermissions(id: number, payload: { visibility: 'public' | 'private'; admin_ids: number[] }): Promise<void> {
    const { status, body } = await authFetch(`/admin/file-manager/folders/${id}/permissions`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (status >= 400) throw new Error((body as any)?.message || 'Échec de la mise à jour du partage');
  },

  async createFolder(payload: { name: string; parent_id?: number | null; color?: string; lock_code?: string; visibility?: 'public' | 'private' }): Promise<FolderSummary> {
    const { body } = await authFetch('/admin/file-manager/folders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return (body as any).data;
  },

  async updateFolder(id: number, payload: { name?: string; color?: string | null; lock_code?: string; remove_lock?: boolean; current_unlock?: string }): Promise<void> {
    const { status, body } = await authFetch(`/admin/file-manager/folders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (status >= 400) {
      throw new Error((body as any)?.message || 'Échec de la mise à jour');
    }
  },

  async deleteFolder(id: number, unlock?: string): Promise<void> {
    const qs = unlock ? `?unlock=${encodeURIComponent(unlock)}` : '';
    const { status, body } = await authFetch(`/admin/file-manager/folders/${id}${qs}`, { method: 'DELETE' });
    if (status >= 400) throw new Error((body as any)?.message || 'Suppression impossible');
  },

  async verifyLock(id: number, code: string): Promise<boolean> {
    const { status } = await authFetch(`/admin/file-manager/folders/${id}/verify-lock`, {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    return status === 200;
  },

  async upload(folderId: number | null | undefined, files: File[], unlock?: string): Promise<FileItemSummary[]> {
    const fd = new FormData();
    if (folderId) fd.append('folder_id', String(folderId));
    if (unlock) fd.append('unlock', unlock);
    files.forEach((f) => fd.append('files[]', f));
    const { body } = await authFetch('/admin/file-manager/items', { method: 'POST', body: fd }, false);
    return (body as any).data;
  },

  async toggleFavorite(id: number, unlock?: string): Promise<boolean> {
    const { body } = await authFetch(`/admin/file-manager/items/${id}/favorite`, {
      method: 'POST',
      body: JSON.stringify(unlock ? { unlock } : {}),
    });
    return (body as any).data?.is_favorite ?? false;
  },

  async deleteItem(id: number, unlock?: string): Promise<void> {
    const qs = unlock ? `?unlock=${encodeURIComponent(unlock)}` : '';
    const { status, body } = await authFetch(`/admin/file-manager/items/${id}${qs}`, { method: 'DELETE' });
    if (status >= 400) throw new Error((body as any)?.message || 'Suppression impossible');
  },

  downloadUrl(id: number, unlock?: string): string {
    const token = getAuthToken();
    const params = new URLSearchParams();
    if (unlock) params.set('unlock', unlock);
    if (token) params.set('access_token', token); // visible URL — see note in component
    return `${getApiUrl()}/admin/file-manager/items/${id}/download${params.toString() ? `?${params}` : ''}`;
  },
};
