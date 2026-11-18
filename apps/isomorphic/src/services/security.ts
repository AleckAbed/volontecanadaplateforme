/**
 * 2.6 journal d'activité, 2.7 double authentification du personnel.
 */
import { authFetch as rawAuthFetch } from '@/lib/api-client';

const authFetch = rawAuthFetch as (...args: Parameters<typeof rawAuthFetch>) => Promise<any>;

export interface TwoFactorStatus {
  enabled: boolean;
  method: 'totp' | 'email' | null;
  confirmed_at: string | null;
  recovery_codes_left: number;
  required_by_cabinet: boolean;
  required_for_collaborators: boolean;
  can_manage: boolean;
}

export type TwoFactorSetup =
  | { method: 'totp'; secret: string; otpauth_uri: string }
  | { method: 'email'; email_hint: string };

export const twoFactorService = {
  async status(): Promise<TwoFactorStatus> {
    return (await authFetch('/admin/two-factor')).data;
  },
  async setup(method: 'totp' | 'email', password: string): Promise<TwoFactorSetup> {
    return (await authFetch('/admin/two-factor/setup', { method: 'POST', body: JSON.stringify({ method, password }) })).data;
  },
  async confirm(code: string): Promise<string[]> {
    return (await authFetch('/admin/two-factor/confirm', { method: 'POST', body: JSON.stringify({ code }) })).data.recovery_codes;
  },
  async disable(password: string): Promise<string> {
    return (await authFetch('/admin/two-factor/disable', { method: 'POST', body: JSON.stringify({ password }) })).message;
  },
  async regenerate(password: string): Promise<string[]> {
    return (await authFetch('/admin/two-factor/recovery-codes', { method: 'POST', body: JSON.stringify({ password }) })).data.recovery_codes;
  },
  async setRequired(required: boolean): Promise<string> {
    return (await authFetch('/admin/cabinet/security', { method: 'PUT', body: JSON.stringify({ require_two_factor: required }) })).message;
  },
  async setRequiredForCollaborators(required: boolean): Promise<string> {
    return (await authFetch('/admin/cabinet/security', { method: 'PUT', body: JSON.stringify({ require_two_factor_collaborators: required }) })).message;
  },
  async resetMember(adminId: number): Promise<string> {
    return (await authFetch(`/admin/team/${adminId}/reset-two-factor`, { method: 'POST' })).message;
  },
};

export interface AuditItem {
  id: number;
  at: string;
  actor_type: 'admin' | 'collaborator' | 'client' | 'public' | 'system';
  actor_id: number | null;
  actor_name: string | null;
  action: string;
  action_label: string;
  subject_type: string | null;
  subject_label: string | null;
  dossier: { id: number; name: string; exists: boolean } | null;
  client: { id: number; name: string; exists: boolean } | null;
  fields: string[] | null;
  ip: string | null;
}

export interface AuditPage {
  items: AuditItem[];
  page: number;
  last_page: number;
  total: number;
  actions: Record<string, string>;
  subjects: Record<string, string>;
  actors: { value: string; label: string }[];
}

export type AuditFilters = Partial<Record<'action' | 'subject_type' | 'actor' | 'dossier_id' | 'client_id' | 'from' | 'to' | 'page', string>>;

export const auditService = {
  async list(filters: AuditFilters): Promise<AuditPage> {
    const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v) as [string, string][]).toString();
    return (await authFetch(`/admin/audit-logs${qs ? `?${qs}` : ''}`)).data;
  },
};
