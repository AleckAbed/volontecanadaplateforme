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

export interface Category {
  id: number;
  name: string;
  type: string; // 'form' | 'document' | custom
  color?: string;
  icon?: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
}

export interface FormType {
  id: number;
  code: string;
  name: string;
  description?: string;
  category_id?: number;
  category?: Category;
  sort_order: number;
  is_active: boolean;
}

export interface InvitationItemSummary {
  id: number;
  kind: 'form' | 'document';
  status: 'pending' | 'in_progress' | 'completed';
  form_type?: { id: number; code: string; name: string; category?: string };
  document_template?: { id: number; name: string; category?: string };
  has_filled_pdf: boolean;
  form_data?: any;
  last_saved_at?: string;
  completed_at?: string;
}

export interface FamilyMember {
  id: number;
  first_name: string;
  last_name: string;
  relationship: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
}

export interface Dossier {
  id: number;
  client_id: number;
  scope: 'client' | 'member' | 'family';
  family_member_id?: number;
  name: string;
  status: string;
  opened_at?: string;
  deadline_at?: string;
}

export interface Invitation {
  id: number;
  unique_code: string;
  client_type: 'existing' | 'custom';
  client?: { id: number; name: string; email: string };
  family_member?: { id: number; name: string; relationship?: string; email?: string };
  dossier?: { id: number; name: string; status?: string };
  custom_name?: string;
  email: string;
  phone?: string;
  message?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'expired';
  sent_at?: string;
  expires_at?: string;
  completed_at?: string;
  sent_by?: string;
  email_sent: boolean;
  items: InvitationItemSummary[];
}

export interface PublicInvitationItem {
  id: number;
  kind: 'form' | 'document';
  status: 'pending' | 'in_progress' | 'completed';
  name: string;
  description?: string;
  category?: string;
  form_type_code?: string;
  document_template_id?: number;
  linked_questionnaire_code?: string;
  form_data?: any;
  has_filled_pdf: boolean;
  last_saved_at?: string;
}

export interface PublicInvitation {
  unique_code: string;
  client_name?: string;
  email: string;
  message?: string;
  status: string;
  expires_at?: string;
  is_expired: boolean;
  items: PublicInvitationItem[];
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const invitationsService = {
  // Categories
  async listCategories(params: { type?: string; activeOnly?: boolean } = {}): Promise<Category[]> {
    const qs = new URLSearchParams();
    if (params.type) qs.set('type', params.type);
    if (params.activeOnly) qs.set('active_only', '1');
    const res = await authFetch(`/admin/categories?${qs}`);
    return res.data;
  },
  async createCategory(payload: Partial<Category>): Promise<Category> {
    const res = await authFetch('/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.data;
  },
  async updateCategory(id: number, payload: Partial<Category>): Promise<Category> {
    const res = await authFetch(`/admin/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.data;
  },
  async deleteCategory(id: number): Promise<void> {
    await authFetch(`/admin/categories/${id}`, { method: 'DELETE' });
  },

  // Form types
  async listFormTypes(params: { activeOnly?: boolean; categoryId?: number } = {}): Promise<FormType[]> {
    const qs = new URLSearchParams();
    if (params.activeOnly) qs.set('active_only', '1');
    if (params.categoryId) qs.set('category_id', String(params.categoryId));
    const res = await authFetch(`/admin/form-types?${qs}`);
    return res.data;
  },
  async createFormType(payload: Partial<FormType>): Promise<FormType> {
    const res = await authFetch('/admin/form-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.data;
  },
  async updateFormType(id: number, payload: Partial<FormType>): Promise<FormType> {
    const res = await authFetch(`/admin/form-types/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.data;
  },
  async deleteFormType(id: number): Promise<void> {
    await authFetch(`/admin/form-types/${id}`, { method: 'DELETE' });
  },

  // Invitations
  async listInvitations(page = 1): Promise<{ data: Invitation[]; total: number; last_page: number; current_page: number }> {
    const res = await authFetch(`/admin/invitations?page=${page}`);
    return res.data;
  },
  async getInvitation(id: number): Promise<Invitation> {
    const res = await authFetch(`/admin/invitations/${id}`);
    return res.data;
  },
  /** Fetch a client with their family_members and dossiers (for the send page) */
  async getClientDetails(id: number): Promise<{
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    family_members: FamilyMember[];
    dossiers: Dossier[];
  }> {
    const res = await authFetch(`/admin/module-clients/${id}`);
    return res.data;
  },

  async createInvitation(payload: {
    client_type: 'existing' | 'custom';
    client_id?: number;
    family_member_id?: number;
    dossier_id?: number;
    custom_name?: string;
    email: string;
    phone?: string;
    message?: string;
    expires_days?: number;
    items: { kind: 'form' | 'document'; form_type_id?: number; document_template_id?: number }[];
  }): Promise<{ data: Invitation; email_sent: boolean }> {
    const res = await authFetch('/admin/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return { data: res.data, email_sent: res.email_sent };
  },
  async deleteInvitation(id: number): Promise<void> {
    await authFetch(`/admin/invitations/${id}`, { method: 'DELETE' });
  },
  async resendInvitationEmail(id: number): Promise<{ success: boolean; email_sent: boolean; message?: string }> {
    return await authFetch(`/admin/invitations/${id}/resend`, { method: 'POST' });
  },
  getAdminItemPdfUrl(invitationId: number, itemId: number): string {
    const token = getAuthToken();
    return `${getApiUrl()}/admin/invitations/${invitationId}/items/${itemId}/pdf?token=${token}`;
  },

  // ─── Public (client) ────────────────────────────────────────────────────────

  async verifyAccess(email: string, code: string): Promise<{ unique_code: string; status: string; expires_at?: string }> {
    const res = await publicFetch('/invitations/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    return res.data;
  },

  async getPublicInvitation(code: string): Promise<PublicInvitation> {
    const res = await publicFetch(`/invitations/${code}`);
    return res.data;
  },

  async fetchItemPdf(code: string, itemId: number): Promise<ArrayBuffer> {
    const res = await fetch(`${getApiUrl()}/invitations/${code}/items/${itemId}/pdf`);
    if (!res.ok) throw new Error('Impossible de charger le PDF');
    return res.arrayBuffer();
  },

  async saveFormItem(code: string, itemId: number, formData: any): Promise<void> {
    await publicFetch(`/invitations/${code}/items/${itemId}/save-form`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ form_data: formData }),
    });
  },

  async saveDocumentItem(code: string, itemId: number, pdfBase64: string, formData?: Record<string, any>): Promise<void> {
    await publicFetch(`/invitations/${code}/items/${itemId}/save-document`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pdf_base64: pdfBase64, form_data: formData ?? null }),
    });
  },

  async completeItem(code: string, itemId: number): Promise<void> {
    await publicFetch(`/invitations/${code}/items/${itemId}/complete`, {
      method: 'POST',
    });
  },

  async submitAll(code: string): Promise<void> {
    await publicFetch(`/invitations/${code}/submit`, { method: 'POST' });
  },
};
