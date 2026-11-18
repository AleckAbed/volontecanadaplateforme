/**
 * Clients « entreprise » : côté cabinet (fiche, contacts, employés, demandes) et espace entreprise.
 */
import { authFetch as rawAuthFetch, getApiUrl } from '@/lib/api-client';

const authFetch = rawAuthFetch as (...args: Parameters<typeof rawAuthFetch>) => Promise<any>;

export interface CompanySummary {
  id: number;
  name: string;
  business_number: string | null;
  sector: string | null;
  city: string | null;
  is_active: boolean;
  employees: number;
  open_dossiers: number;
  pending_requests: number;
}

export interface CompanyInput {
  name: string;
  business_number?: string | null;
  sector?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  notes?: string | null;
  is_active?: boolean;
}

export interface CompanyContactItem {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  job_title: string | null;
  is_active: boolean;
  portal: 'active' | 'invited' | 'none';
  last_login_at: string | null;
}

export interface CompanyEmployee {
  link_id: number;
  client_id: number;
  name: string;
  client_type: string | null;
  family_members: number;
  job_title: string | null;
  started_at: string | null;
  ended_at: string | null;
}

export type CompanyVisibility = 'progress' | 'full';

export interface CompanyRequestItem {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  job_title: string | null;
  request_type: string | null;
  with_family: boolean;
  message: string | null;
  status: 'pending' | 'accepted' | 'declined';
  response: string | null;
  client_id: number | null;
  dossier_id: number | null;
  contact: string | null;
  created_at: string | null;
  company?: { id: number; name: string };
}

export interface CompanyDetail {
  company: CompanyInput & { id: number };
  contacts: CompanyContactItem[];
  employees: CompanyEmployee[];
  dossiers: { id: number; name: string; service_name: string | null; client: { id: number; name: string } | null; status: string; status_label: string; visibility: CompanyVisibility; deadline_at: string | null }[];
  requests: CompanyRequestItem[];
  invoices: { id: number; number: string; status: string; total_cents: number; issued_at: string | null }[];
}

export const REQUEST_STATUS: Record<CompanyRequestItem['status'], { label: string; className: string }> = {
  pending: { label: 'À traiter', className: 'bg-amber-50 text-amber-800' },
  accepted: { label: 'Acceptée', className: 'bg-emerald-50 text-emerald-700' },
  declined: { label: 'Refusée', className: 'bg-gray-100 text-gray-700' },
};

export const companyService = {
  async list(search = ''): Promise<CompanySummary[]> {
    return (await authFetch(`/admin/companies${search ? `?search=${encodeURIComponent(search)}` : ''}`)).data;
  },
  async create(input: CompanyInput): Promise<number> {
    return (await authFetch('/admin/companies', { method: 'POST', body: JSON.stringify(input) })).data.id;
  },
  async get(id: number): Promise<CompanyDetail> {
    return (await authFetch(`/admin/companies/${id}`)).data;
  },
  async update(id: number, input: Partial<CompanyInput>): Promise<string> {
    return (await authFetch(`/admin/companies/${id}`, { method: 'PUT', body: JSON.stringify(input) })).message;
  },
  async remove(id: number): Promise<string> {
    return (await authFetch(`/admin/companies/${id}`, { method: 'DELETE' })).message;
  },
  async addContact(id: number, input: { first_name: string; last_name: string; email: string; phone?: string; job_title?: string }): Promise<number> {
    return (await authFetch(`/admin/companies/${id}/contacts`, { method: 'POST', body: JSON.stringify(input) })).data.id;
  },
  async updateContact(id: number, contactId: number, input: Partial<CompanyContactItem>): Promise<string> {
    return (await authFetch(`/admin/companies/${id}/contacts/${contactId}`, { method: 'PUT', body: JSON.stringify(input) })).message;
  },
  async removeContact(id: number, contactId: number): Promise<string> {
    return (await authFetch(`/admin/companies/${id}/contacts/${contactId}`, { method: 'DELETE' })).message;
  },
  async inviteContact(id: number, contactId: number): Promise<string> {
    return (await authFetch(`/admin/companies/${id}/contacts/${contactId}/invite`, { method: 'POST' })).message;
  },
  async linkEmployee(id: number, input: { client_id: number; job_title?: string; started_at?: string }): Promise<string> {
    return (await authFetch(`/admin/companies/${id}/employees`, { method: 'POST', body: JSON.stringify(input) })).message;
  },
  async endEmployee(id: number, linkId: number): Promise<string> {
    return (await authFetch(`/admin/companies/${id}/employees/${linkId}/end`, { method: 'POST' })).message;
  },
  async forClient(clientId: number): Promise<{ id: number; name: string; job_title: string | null; started_at: string | null; ended_at: string | null }[]> {
    return (await authFetch(`/admin/module-clients/${clientId}/companies`)).data;
  },
  async setDossierCompany(dossierId: number, input: { company_id: number | null; company_visibility?: CompanyVisibility }): Promise<string> {
    return (await authFetch(`/admin/dossiers/${dossierId}/company`, { method: 'PUT', body: JSON.stringify(input) })).message;
  },
  async requests(status?: string): Promise<CompanyRequestItem[]> {
    return (await authFetch(`/admin/company-requests${status ? `?status=${status}` : ''}`)).data;
  },
  async acceptRequest(id: number, input: { client_id?: number | null; dossier_name?: string; service_name?: string; visibility?: CompanyVisibility; invite?: boolean }): Promise<string> {
    return (await authFetch(`/admin/company-requests/${id}/accept`, { method: 'POST', body: JSON.stringify(input) })).message;
  },
  async declineRequest(id: number, response: string): Promise<string> {
    return (await authFetch(`/admin/company-requests/${id}/decline`, { method: 'POST', body: JSON.stringify({ response }) })).message;
  },
};

// ─── Espace entreprise (cookie de session seulement, aucun jeton d'une autre session) ───

async function companyFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const headers: Record<string, string> = { Accept: 'application/json', ...((options.headers as Record<string, string>) || {}) };
  if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${getApiUrl()}${endpoint}`, { ...options, credentials: 'include', headers });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: any = new Error(data?.message || (res.status === 401 ? 'Session expirée.' : 'Une erreur est survenue'));
    err.status = res.status;
    throw err;
  }
  return data;
}

export interface CompanyPortal {
  company: { name: string };
  cabinet: { name: string; branding: any } | null;
  employees: {
    name: string;
    job_title: string | null;
    is_family: boolean;
    dossiers: {
      name: string;
      service_name: string | null;
      status_label: string;
      opened_at: string | null;
      closed: boolean;
      progress: { done: number; total: number };
      deadlines: { label: string; due_date: string }[];
      visibility: CompanyVisibility;
      items?: { name: string; status: string }[];
      documents?: { name: string; status: string }[];
    }[];
  }[];
  requests: { id: number; name: string; request_type: string | null; status: CompanyRequestItem['status']; response: string | null; created_at: string | null }[];
  invoices: { number: string; status: string; total_cents: number; issued_at: string | null; due_date: string | null; url: string }[];
}

export const companyPortalService = {
  async login(email: string, password: string) {
    return (await companyFetch('/company/login', { method: 'POST', body: JSON.stringify({ email, password }) })).data;
  },
  async logout() {
    await companyFetch('/company/logout', { method: 'POST' }).catch(() => {});
  },
  async portal(): Promise<CompanyPortal> {
    return (await companyFetch('/company/portal')).data;
  },
  async request(input: { first_name: string; last_name: string; email: string; phone?: string; job_title?: string; request_type?: string; with_family?: boolean; message?: string; consent: boolean }): Promise<string> {
    return (await companyFetch('/company/requests', { method: 'POST', body: JSON.stringify(input) })).message;
  },
  async forgot(email: string): Promise<string> {
    return (await companyFetch('/company/password/forgot', { method: 'POST', body: JSON.stringify({ email }) })).message;
  },
  async checkAccess(token: string) {
    return (await companyFetch('/company/access/check', { method: 'POST', body: JSON.stringify({ token }) })).data;
  },
  async completeAccess(token: string, password: string, password_confirmation: string): Promise<string> {
    return (await companyFetch('/company/access/complete', { method: 'POST', body: JSON.stringify({ token, password, password_confirmation }) })).message;
  },
};
