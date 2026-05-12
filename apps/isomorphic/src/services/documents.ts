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
  const headers: HeadersInit = {
    Accept: 'application/json',
    ...options.headers,
  };
  if (token) (headers as any).Authorization = `Bearer ${token}`;

  const res = await fetch(`${getApiUrl()}${endpoint}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Une erreur est survenue');
  return data;
}

async function publicFetch(endpoint: string, options: RequestInit = {}) {
  const headers: HeadersInit = { Accept: 'application/json', ...options.headers };
  const res = await fetch(`${getApiUrl()}${endpoint}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Une erreur est survenue');
  return data;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DocumentTemplate {
  id: number;
  name: string;
  description?: string;
  category: string;
  category_id?: number | null;
  category_label: string;
  has_schema: boolean;
  created_by?: string;
  created_at: string;
}

export interface DocumentTemplateDetail extends DocumentTemplate {
  template_json: any[] | null;
}

export interface DocumentRequest {
  id: number;
  token: string;
  template_name: string;
  client_name: string;
  client_email: string;
  dossier_name?: string;
  status: 'pending' | 'in_progress' | 'submitted' | 'validated' | 'rejected';
  status_label: string;
  is_expired: boolean;
  sent_at?: string;
  submitted_at?: string;
  expires_at?: string;
  email_sent: boolean;
}

export interface DocumentRequestDetail {
  id: number;
  token: string;
  template: { id: number; name: string; category: string } | null;
  client: { id: number; full_name: string; email: string } | null;
  dossier: { id: number; name: string } | null;
  status: string;
  status_label: string;
  message?: string;
  form_data: any | null;
  has_filled_pdf: boolean;
  is_expired: boolean;
  expires_at?: string;
  sent_at?: string;
  submitted_at?: string;
  validated_at?: string;
  validated_by?: string;
  rejection_reason?: string;
  email_sent: boolean;
  sent_by?: string;
}

export interface PublicDocumentData {
  id: number;
  status: string;
  message?: string;
  client_name?: string;
  template_name: string;
  template_json: any[];
  form_data: any[] | null;
  expires_at?: string;
}

// ─── Admin — Templates ────────────────────────────────────────────────────────

export const documentService = {
  // Templates
  async getTemplates(): Promise<DocumentTemplate[]> {
    const res = await authFetch('/admin/document-templates');
    return res.data;
  },

  async getTemplate(id: number): Promise<DocumentTemplateDetail> {
    const res = await authFetch(`/admin/document-templates/${id}`);
    return res.data;
  },

  async createTemplate(formData: FormData): Promise<{ id: number }> {
    const token = getAuthToken();
    const headers: HeadersInit = { Accept: 'application/json' };
    if (token) (headers as any).Authorization = `Bearer ${token}`;

    const res = await fetch(`${getApiUrl()}/admin/document-templates`, {
      method: 'POST',
      headers,
      body: formData, // multipart pour le fichier PDF
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erreur lors de la création');
    return data.data;
  },

  async saveSchema(id: number, templateJson: any[]): Promise<void> {
    await authFetch(`/admin/document-templates/${id}/schema`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template_json: templateJson }),
    });
  },

  async deleteTemplate(id: number): Promise<void> {
    await authFetch(`/admin/document-templates/${id}`, { method: 'DELETE' });
  },

  /** Fetch le PDF original — XFA conservé, PDF.js le rend nativement */
  async fetchTemplatePdf(id: number): Promise<ArrayBuffer> {
    const token = getAuthToken();
    const headers: HeadersInit = { Accept: 'application/pdf' };
    if (token) (headers as any).Authorization = `Bearer ${token}`;
    const res = await fetch(`${getApiUrl()}/admin/document-templates/${id}/pdf`, { headers });
    if (!res.ok) throw new Error('Impossible de charger le PDF');
    return res.arrayBuffer();
  },

  // Requests
  async getRequests(): Promise<DocumentRequest[]> {
    const res = await authFetch('/admin/document-requests');
    return res.data;
  },

  async getRequest(id: number): Promise<DocumentRequestDetail> {
    const res = await authFetch(`/admin/document-requests/${id}`);
    return res.data;
  },

  async sendRequest(payload: {
    template_id: number;
    client_id: number;
    dossier_id?: number;
    message?: string;
    expires_days?: number;
  }): Promise<{ id: number; token: string; email_sent: boolean }> {
    const res = await authFetch('/admin/document-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async validateRequest(id: number): Promise<void> {
    await authFetch(`/admin/document-requests/${id}/validate`, { method: 'PUT' });
  },

  async rejectRequest(id: number, reason: string): Promise<void> {
    await authFetch(`/admin/document-requests/${id}/reject`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
  },

  getFilledPdfUrl(id: number): string {
    const token = getAuthToken();
    return `${getApiUrl()}/admin/document-requests/${id}/pdf?token=${token}`;
  },

  // ─── Public — client via token ──────────────────────────────────────────────

  async getDocumentByToken(token: string): Promise<PublicDocumentData> {
    const res = await publicFetch(`/documents/${token}`);
    return res.data;
  },

  async fetchBasePdf(token: string): Promise<ArrayBuffer> {
    const res = await fetch(`${getApiUrl()}/documents/${token}/pdf`);
    if (!res.ok) throw new Error('Impossible de charger le PDF');
    return res.arrayBuffer();
  },

  async saveProgress(token: string, formData: any[]): Promise<void> {
    await publicFetch(`/documents/${token}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ form_data: formData }),
    });
  },

  async submitDocument(token: string, formData: any[], pdfBase64: string): Promise<void> {
    await publicFetch(`/documents/${token}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ form_data: formData, pdf_base64: pdfBase64 }),
    });
  },
};
