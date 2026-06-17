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

async function authFetch(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers: HeadersInit = { Accept: 'application/json', ...options.headers };
  if (token) (headers as any).Authorization = `Bearer ${token}`;
  const res = await fetch(`${getApiUrl()}${endpoint}`, { ...options, credentials: 'include', headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Une erreur est survenue');
  return data;
}

export interface SupplementaryFile {
  id: number;
  dossier_id: number;
  label: string;
  original_filename: string;
  mime_type?: string;
  size: number;
  created_at?: string;
}

export interface ExportCatalogItem {
  id: number;
  kind: 'ircc' | 'fo' | 'supplementary' | 'client_upload';
  name: string;
  filename?: string;
  size?: number;
  mime_type?: string;
  has_filled?: boolean;
  status?: string;
  invitation_email?: string;
}

export interface ExportCatalog {
  ircc: ExportCatalogItem[];
  fo: ExportCatalogItem[];
  supplementary: ExportCatalogItem[];
  client_uploads: ExportCatalogItem[];
}

export const dossierSupplementaryService = {
  async list(dossierId: number): Promise<SupplementaryFile[]> {
    const res = await authFetch(`/admin/dossiers/${dossierId}/supplementary-files`);
    return res.data;
  },
  async upload(dossierId: number, file: File, label: string): Promise<SupplementaryFile> {
    const fd = new FormData();
    fd.append('label', label);
    fd.append('file', file);
    const res = await authFetch(`/admin/dossiers/${dossierId}/supplementary-files`, {
      method: 'POST',
      body: fd,
    });
    return res.data;
  },
  async remove(id: number): Promise<void> {
    await authFetch(`/admin/dossier-supplementary-files/${id}`, { method: 'DELETE' });
  },
  getFileUrl(id: number, download = false): string {
    return `${getApiUrl()}/admin/dossier-supplementary-files/${id}${download ? '?download=1' : ''}`;
  },
  async exportCatalog(dossierId: number): Promise<ExportCatalog> {
    const res = await authFetch(`/admin/dossiers/${dossierId}/export-catalog`);
    return res.data;
  },
  async exportZip(dossierId: number, items: { kind: string; id: number; filled?: boolean }[]): Promise<Blob> {
    const token = getAuthToken();
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) (headers as any).Authorization = `Bearer ${token}`;
    const res = await fetch(`${getApiUrl()}/admin/dossiers/export-zip`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({ dossier_id: dossierId, items }),
    });
    if (!res.ok) {
      try {
        const j = await res.json();
        throw new Error(j.message || 'Export impossible');
      } catch {
        throw new Error('Export impossible');
      }
    }
    return res.blob();
  },

  // Inline endpoints (notes + collab access)
  async updateNotes(dossierId: number, notes: string): Promise<void> {
    await authFetch(`/admin/dossiers/${dossierId}/notes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
  },
  async toggleCollabAccess(dossierId: number, revoked: boolean): Promise<void> {
    await authFetch(`/admin/dossiers/${dossierId}/collab-access`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collab_access_revoked: revoked }),
    });
  },
};
