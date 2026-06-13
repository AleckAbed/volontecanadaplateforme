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

export interface DossierDocument {
  id: number;
  dossier_id: number;
  document_template_id?: number | null;
  name: string;
  description?: string;
  status: 'in_progress' | 'completed';
  has_filled_pdf: boolean;
  sort_order: number;
  last_saved_at?: string;
  completed_at?: string;
  created_at?: string;
}

export const dossierDocumentsService = {
  async list(dossierId: number): Promise<DossierDocument[]> {
    const res = await authFetch(`/admin/dossiers/${dossierId}/documents`);
    return res.data;
  },
  async create(dossierId: number, name: string, file: File, description?: string): Promise<DossierDocument> {
    const fd = new FormData();
    fd.append('name', name);
    if (description) fd.append('description', description);
    fd.append('pdf', file);
    const res = await authFetch(`/admin/dossiers/${dossierId}/documents`, {
      method: 'POST',
      body: fd,
    });
    return res.data;
  },
  async createFromTemplate(
    dossierId: number,
    documentTemplateId: number,
    name?: string,
    description?: string,
  ): Promise<DossierDocument> {
    const fd = new FormData();
    fd.append('document_template_id', String(documentTemplateId));
    if (name) fd.append('name', name);
    if (description) fd.append('description', description);
    const res = await authFetch(`/admin/dossiers/${dossierId}/documents`, {
      method: 'POST',
      body: fd,
    });
    return res.data;
  },
  async update(id: number, payload: Partial<Pick<DossierDocument, 'name' | 'description' | 'sort_order'>>): Promise<DossierDocument> {
    const res = await authFetch(`/admin/dossier-documents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.data;
  },
  async remove(id: number): Promise<void> {
    await authFetch(`/admin/dossier-documents/${id}`, { method: 'DELETE' });
  },
  getTemplateUrl(id: number): string {
    return `${getApiUrl()}/admin/dossier-documents/${id}/template`;
  },
  getFilledUrl(id: number): string {
    return `${getApiUrl()}/admin/dossier-documents/${id}/filled`;
  },
};
