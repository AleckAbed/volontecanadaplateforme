/**
 * S4 — « Le client répond une fois » : profil client, correspondance des champs
 * PDF, portail client et accès au portail.
 */
import { authFetch as rawAuthFetch, publicFetch as rawPublicFetch } from '@/lib/api-client';

const authFetch = rawAuthFetch as (...args: Parameters<typeof rawAuthFetch>) => Promise<any>;
const publicFetch = rawPublicFetch as (...args: Parameters<typeof rawPublicFetch>) => Promise<any>;

export interface ProfileField {
  key: string;
  token: string;
  label: string;
  section: string;
  type: 'text' | 'date' | 'email';
}

// ─── Correspondance des champs d'un modèle PDF (admin) ───────────────────────

export interface FieldMapInfo {
  template: { id: number; name: string };
  fields: ProfileField[];
  mapped_count: number;
  mapped_keys: string[];
  token_values: Record<string, any>;
}

export const fieldMapService = {
  async get(templateId: number): Promise<FieldMapInfo> {
    const res = await authFetch(`/admin/document-templates/${templateId}/field-map`);
    return res.data;
  },
  async save(templateId: number, formData: Record<string, any>): Promise<{
    message: string;
    data: { mapped_count: number; mapped_keys: string[]; unknown_tokens: string[] };
  }> {
    return authFetch(`/admin/document-templates/${templateId}/field-map`, {
      method: 'PUT',
      body: JSON.stringify({ form_data: formData }),
    });
  },
};

/** Admin : envoie au client un lien pour activer son portail. */
export async function inviteClientToPortal(clientId: number): Promise<string> {
  const res = await authFetch(`/admin/module-clients/${clientId}/portal-invite`, { method: 'POST' });
  return res.message;
}

// ─── Portail client ──────────────────────────────────────────────────────────

export interface PortalTask {
  id: number;
  code: string;
  status: 'pending' | 'in_progress' | 'completed' | string;
  message: string | null;
  sent_at: string | null;
  expires_at: string | null;
  is_expired: boolean;
  items_total: number;
  items_done: number;
  items: { name: string; kind: 'form' | 'document'; done: boolean }[];
}

export interface PortalOverview {
  client: { first_name: string; last_name: string; email: string };
  cabinet: { name: string | null };
  dossiers: {
    id: number;
    name: string;
    service_name: string | null;
    status: string | null;
    status_label?: string | null;
    company?: { name: string; visibility: 'progress' | 'full' } | null;
    opened_at: string | null;
    deadline_at: string | null;
    for: string;
  }[];
  tasks: PortalTask[];
  members: { id: number; name: string }[];
  profile: { filled: number; total: number };
}

export interface PortalProfile {
  fields: ProfileField[];
  values: Record<string, string>;
  filled: number;
  total: number;
  for: string;
}

export const clientPortalService = {
  async overview(): Promise<PortalOverview> {
    const res = await authFetch('/client/portal');
    return res.data;
  },
  async profile(memberId?: number | null): Promise<PortalProfile> {
    const res = await authFetch(`/client/profile${memberId ? `?member_id=${memberId}` : ''}`);
    return res.data;
  },
  async saveProfile(values: Record<string, string>, memberId?: number | null): Promise<{ message: string; filled: number }> {
    const res = await authFetch(`/client/profile${memberId ? `?member_id=${memberId}` : ''}`, {
      method: 'PUT',
      body: JSON.stringify({ values }),
    });
    return { message: res.message, filled: res.data?.filled ?? 0 };
  },
};

// ─── Accès au portail (public) ───────────────────────────────────────────────

export interface ClientAccessInfo {
  purpose: 'invite' | 'reset';
  name: string;
  email: string;
  cabinet_name: string | null;
}

export const clientAccessService = {
  async forgotPassword(email: string): Promise<string> {
    const res = await publicFetch('/client/password/forgot', { method: 'POST', body: JSON.stringify({ email }) });
    return res.message;
  },
  async check(token: string): Promise<ClientAccessInfo> {
    const res = await publicFetch('/client/access/check', { method: 'POST', body: JSON.stringify({ token }) });
    return res.data;
  },
  async complete(token: string, password: string, password_confirmation: string): Promise<string> {
    const res = await publicFetch('/client/access/complete', {
      method: 'POST',
      body: JSON.stringify({ token, password, password_confirmation }),
    });
    return res.message;
  },
};
