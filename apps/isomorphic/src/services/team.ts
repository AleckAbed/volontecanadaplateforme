/**
 * S3 — Cabinet, équipe, liens d'accès et console plateforme.
 */
import { authFetch as rawAuthFetch, publicFetch as rawPublicFetch } from '@/lib/api-client';

// Réponses JSON de l'API (enveloppe { success, message, data }).
const authFetch = rawAuthFetch as (...args: Parameters<typeof rawAuthFetch>) => Promise<any>;
const publicFetch = rawPublicFetch as (...args: Parameters<typeof rawPublicFetch>) => Promise<any>;

export type TeamRole = 'owner' | 'admin' | 'advisor' | 'assistant';

export const ROLE_LABELS: Record<TeamRole, string> = {
  owner: 'Propriétaire',
  admin: 'Administrateur',
  advisor: 'Conseiller',
  assistant: 'Adjoint',
};

export const ROLE_DESCRIPTIONS: Record<TeamRole, string> = {
  owner: 'Tout, y compris l’équipe et l’abonnement.',
  admin: 'Tout, sauf nommer ou retirer un propriétaire.',
  advisor: 'Clients, dossiers, envois. Pas de configuration ni d’équipe.',
  assistant: 'Comme le conseiller, sans suppression.',
};

export interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: TeamRole;
  role_label: string;
  is_active: boolean;
  status: 'active' | 'invited' | 'inactive';
  invitation_expires_at: string | null;
  last_login_at: string | null;
  /** Double authentification activée (2.7). */
  two_factor?: boolean;
  is_me: boolean;
}

export interface AdminPermissions {
  manage_team: boolean;
  manage_settings: boolean;
  delete_records: boolean;
  assign_owner: boolean;
}

export const teamService = {
  async list(): Promise<{ members: TeamMember[]; seats_used: number }> {
    const res = await authFetch('/admin/team');
    return res.data;
  },
  async invite(payload: { name: string; email: string; role: TeamRole }) {
    return authFetch('/admin/team', { method: 'POST', body: JSON.stringify(payload) });
  },
  async update(id: number, payload: Partial<Pick<TeamMember, 'role' | 'is_active' | 'name'>>) {
    return authFetch(`/admin/team/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  async resendInvitation(id: number) {
    return authFetch(`/admin/team/${id}/resend-invitation`, { method: 'POST' });
  },
};

export interface AccessLinkInfo {
  purpose: 'invite' | 'reset';
  name: string;
  email: string;
  cabinet_name: string | null;
  /** Le cabinet exige la double authentification et la personne ne l'a pas encore. */
  two_factor_required?: boolean;
  has_two_factor?: boolean;
}

export interface TwoFactorActivationSetup {
  method: 'totp' | 'email';
  secret?: string;
  otpauth_uri?: string;
  email_hint?: string;
}

export interface ModuleAccessData {
  modules: { key: string; label: string; href: string }[];
  roles: { value: TeamRole; label: string; modules: Record<string, boolean> }[];
  members: { id: number; name: string; role: TeamRole; role_label: string; overrides: Record<string, boolean>; effective: Record<string, boolean> }[];
}

/** Menus ouverts aux membres (réglés par le propriétaire, appliqués aussi par l'API). */
export const moduleAccessService = {
  async get(): Promise<ModuleAccessData> {
    const res = await authFetch('/admin/team/module-access');
    return res.data;
  },
  async saveRoles(roles: Record<string, Record<string, boolean>>): Promise<string> {
    const res = await authFetch('/admin/team/module-access', { method: 'PUT', body: JSON.stringify({ roles }) });
    return res.message;
  },
  async saveMember(id: number, overrides: Record<string, boolean>): Promise<string> {
    const res = await authFetch(`/admin/team/${id}/module-access`, { method: 'PUT', body: JSON.stringify({ overrides }) });
    return res.message;
  },
};

export const accessService = {
  async forgotPassword(email: string): Promise<string> {
    const res = await publicFetch('/admin/password/forgot', { method: 'POST', body: JSON.stringify({ email }) });
    return res.message;
  },
  async check(token: string): Promise<AccessLinkInfo> {
    const res = await publicFetch('/admin/access/check', { method: 'POST', body: JSON.stringify({ token }) });
    return res.data;
  },
  async twoFactorSetup(token: string, method: 'totp' | 'email'): Promise<TwoFactorActivationSetup> {
    const res = await publicFetch('/admin/access/two-factor/setup', { method: 'POST', body: JSON.stringify({ token, method }) });
    return res.data;
  },
  /** Renvoie la réponse complète : la session peut être ouverte directement (data.logged_in). */
  async complete(token: string, password: string, password_confirmation: string, two_factor_code?: string): Promise<any> {
    return publicFetch('/admin/access/complete', {
      method: 'POST',
      body: JSON.stringify({ token, password, password_confirmation, two_factor_code: two_factor_code || undefined }),
    });
  },
};

export const PROVINCES: { code: string; name: string }[] = [
  { code: 'QC', name: 'Québec' },
  { code: 'ON', name: 'Ontario' },
  { code: 'BC', name: 'Colombie-Britannique' },
  { code: 'AB', name: 'Alberta' },
  { code: 'MB', name: 'Manitoba' },
  { code: 'SK', name: 'Saskatchewan' },
  { code: 'NS', name: 'Nouvelle-Écosse' },
  { code: 'NB', name: 'Nouveau-Brunswick' },
  { code: 'NL', name: 'Terre-Neuve-et-Labrador' },
  { code: 'PE', name: 'Île-du-Prince-Édouard' },
  { code: 'YT', name: 'Yukon' },
  { code: 'NT', name: 'Territoires du Nord-Ouest' },
  { code: 'NU', name: 'Nunavut' },
];

export const cabinetSignupService = {
  async register(payload: {
    cabinet_name: string;
    province?: string;
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    accept_terms: boolean;
  }) {
    return publicFetch('/cabinets/register', { method: 'POST', body: JSON.stringify(payload) });
  },
};

// ─── Console plateforme (cookie distinct « platform_token ») ─────────────────

export interface PlatformCabinet {
  id: number;
  name: string;
  slug: string;
  province: string | null;
  is_active: boolean;
  created_at: string;
  owner: { name: string; email: string } | null;
  seats_used: number;
  clients_count: number;
  dossiers_count: number;
  last_login_at: string | null;
  subscription_status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
  trial_ends_at: string | null;
  subscribed_seats: number | null;
  payments_enabled: boolean;
}

export const platformService = {
  async login(email: string, password: string) {
    return publicFetch('/platform/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  },
  async verifyTwoFactor(challenge: string, input: { code?: string; recovery_code?: string }) {
    return publicFetch('/platform/login/two-factor', { method: 'POST', body: JSON.stringify({ challenge, ...input }) });
  },
  async me() {
    return publicFetch('/platform/me');
  },
  async logout() {
    return publicFetch('/platform/logout', { method: 'POST' });
  },
  async cabinets(search = ''): Promise<{
    cabinets: PlatformCabinet[];
    totals: { cabinets: number; active: number; seats: number };
  }> {
    const res = await publicFetch(`/platform/cabinets${search ? `?search=${encodeURIComponent(search)}` : ''}`);
    return res.data;
  },
  async setActive(id: number, is_active: boolean): Promise<string> {
    const res = await publicFetch(`/platform/cabinets/${id}`, { method: 'PATCH', body: JSON.stringify({ is_active }) });
    return res.message;
  },
  async cabinetRequests(status: CabinetRequestStatus | 'all' = 'pending'): Promise<{ items: CabinetRequestItem[]; pending: number }> {
    const res = await publicFetch(`/platform/cabinet-requests?status=${status}`);
    return { items: res.data, pending: res.meta?.pending ?? 0 };
  },
  async approveCabinetRequest(id: number, cabinet_name?: string): Promise<string> {
    const res = await publicFetch(`/platform/cabinet-requests/${id}/approve`, { method: 'POST', body: JSON.stringify({ cabinet_name }) });
    return res.message;
  },
  async declineCabinetRequest(id: number, reason: string, notify = true): Promise<string> {
    const res = await publicFetch(`/platform/cabinet-requests/${id}/decline`, { method: 'POST', body: JSON.stringify({ reason, notify }) });
    return res.message;
  },
};

export type CabinetRequestStatus = 'pending' | 'approved' | 'declined';

export interface CabinetRequestItem {
  id: number;
  cabinet_name: string;
  province: string | null;
  contact_name: string;
  email: string;
  phone: string | null;
  team_size: string | null;
  license_number: string | null;
  message: string | null;
  status: CabinetRequestStatus;
  cabinet_id: number | null;
  decline_reason: string | null;
  decided_at: string | null;
  created_at: string;
}

/** Demande d'ouverture de cabinet (publique). */
export const cabinetRequestService = {
  async submit(payload: {
    cabinet_name: string; province: string; name: string; email: string; phone?: string;
    team_size?: string; license_number?: string; message?: string; accept_terms: boolean; website?: string;
  }): Promise<string> {
    const res = await publicFetch('/cabinet-requests', { method: 'POST', body: JSON.stringify(payload) });
    return res.message;
  },
};
