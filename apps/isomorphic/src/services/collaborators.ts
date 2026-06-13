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

async function publicFetch(endpoint: string, options: RequestInit = {}) {
  const headers: HeadersInit = { Accept: 'application/json', ...options.headers };
  const res = await fetch(`${getApiUrl()}${endpoint}`, { ...options, credentials: 'include', headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Une erreur est survenue');
  return data;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Collaborator {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  is_active: boolean;
  dossiers_count?: number;
  created_at?: string;
}

export interface CollabDossierSummary {
  id: number;
  name: string;
  service_name?: string;
  status: string;
  opened_at?: string;
  deadline_at?: string;
  client?: { id: number; name: string; email: string };
  family_member?: { id: number; name: string; relationship?: string };
  docs_progress: string; // "1/3"
  invitation_progress: string; // "0/2"
}

export interface CollabDocument {
  id: number;
  name: string;
  description?: string;
  status: 'in_progress' | 'completed';
  has_filled_pdf: boolean;
  form_data?: any;
  last_saved_at?: string;
  completed_at?: string;
}

export interface CollabUpload {
  id: number;
  label: string;
  original_filename: string;
  mime_type?: string;
  size: number;
  created_at?: string;
}

export interface CollabInvitationItem {
  id: number;
  kind: 'form' | 'document';
  status: 'pending' | 'in_progress' | 'completed';
  form_type?: { id: number; code: string; name: string };
  document_template?: { id: number; name: string };
  has_filled_pdf: boolean;
  last_saved_at?: string;
  completed_at?: string;
}

export interface CollabInvitation {
  id: number;
  unique_code: string;
  email: string;
  status: string;
  sent_at?: string;
  expires_at?: string;
  items: CollabInvitationItem[];
}

export interface CollabDossierDetail {
  id: number;
  name: string;
  service_name?: string;
  status: string;
  opened_at?: string;
  deadline_at?: string;
  notes?: string;
  allow_collab_uploads: boolean;
  client?: { id: number; name: string; email: string };
  family_member?: { id: number; name: string; relationship?: string };
  documents: CollabDocument[];
  uploads: CollabUpload[];
  invitations: CollabInvitation[];
}

// ─── Admin service (CRUD) ─────────────────────────────────────────────────────

export const collaboratorsService = {
  async list(): Promise<Collaborator[]> {
    const res = await authFetch('/admin/collaborators');
    return res.data;
  },
  async create(payload: Partial<Collaborator> & { password: string }): Promise<Collaborator> {
    const res = await authFetch('/admin/collaborators', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.data;
  },
  async update(id: number, payload: Partial<Collaborator> & { password?: string }): Promise<Collaborator> {
    const res = await authFetch(`/admin/collaborators/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.data;
  },
  async remove(id: number): Promise<void> {
    await authFetch(`/admin/collaborators/${id}`, { method: 'DELETE' });
  },
};

// ─── Collaborator workspace (own login + their dossiers) ──────────────────────

export const collabWorkspaceService = {
  async login(email: string, password: string): Promise<{ collaborator: Collaborator; token: string }> {
    const res = await publicFetch('/collaborator/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return res.data;
  },
  async me(): Promise<Collaborator> {
    const res = await authFetch('/collaborator/me');
    return res.data;
  },
  async logout(): Promise<void> {
    await authFetch('/collaborator/logout', { method: 'POST' });
  },
  async listMyDossiers(): Promise<CollabDossierSummary[]> {
    const res = await authFetch('/collaborator/dossiers');
    return res.data;
  },
  async getDossier(id: number): Promise<CollabDossierDetail> {
    const res = await authFetch(`/collaborator/dossiers/${id}`);
    return res.data;
  },
  async getDocumentMeta(docId: number): Promise<CollabDocument & { dossier_id: number }> {
    const res = await authFetch(`/collaborator/documents/${docId}`);
    return res.data;
  },
  async fetchDocumentPdf(docId: number): Promise<ArrayBuffer> {
    const token = getAuthToken();
    const headers: HeadersInit = { Accept: 'application/pdf' };
    if (token) (headers as any).Authorization = `Bearer ${token}`;
    const res = await fetch(`${getApiUrl()}/collaborator/documents/${docId}/pdf`, {
      credentials: 'include',
      headers,
    });
    if (!res.ok) throw new Error('Impossible de charger le PDF');
    return res.arrayBuffer();
  },
  async saveDocument(docId: number, pdfBase64: string, formData?: Record<string, any>): Promise<void> {
    await authFetch(`/collaborator/documents/${docId}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pdf_base64: pdfBase64, form_data: formData ?? null }),
    });
  },
  async markDocumentComplete(docId: number): Promise<void> {
    await authFetch(`/collaborator/documents/${docId}/complete`, { method: 'POST' });
  },
  async uploadFile(dossierId: number, file: File, label: string): Promise<CollabUpload> {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('label', label);
    const res = await authFetch(`/collaborator/dossiers/${dossierId}/uploads`, {
      method: 'POST',
      body: fd,
    });
    return res.data;
  },
  async deleteUpload(dossierId: number, uploadId: number): Promise<void> {
    await authFetch(`/collaborator/dossiers/${dossierId}/uploads/${uploadId}`, { method: 'DELETE' });
  },
  getInvitationItemPdfUrl(dossierId: number, invitationId: number, itemId: number): string {
    return `${getApiUrl()}/collaborator/dossiers/${dossierId}/invitations/${invitationId}/items/${itemId}/pdf`;
  },
};
