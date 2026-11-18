/**
 * S8 — Conformité : conservation des dossiers (3.9), droits du client (3.10), IA (2.3).
 */
import { authFetch as rawAuthFetch, authHeaders, getApiUrl } from '@/lib/api-client';

const authFetch = rawAuthFetch as (...args: Parameters<typeof rawAuthFetch>) => Promise<any>;

export interface RetentionDossier {
  id: number;
  name: string;
  client: string | null;
  client_id: number;
  status: string;
  closed_at: string | null;
  destroy_on: string | null;
  hold: boolean;
}

export interface DataRequestItem {
  id: number;
  client_id: number | null;
  client_name: string;
  client_email: string;
  message: string | null;
  status: 'pending' | 'completed' | 'rejected';
  response: string | null;
  handled_by: string | null;
  handled_at: string | null;
  created_at: string;
}

export interface DeletionLogItem {
  id: number;
  label: string;
  subject_type: 'dossier' | 'client';
  reason: string;
  files_deleted: number;
  performed_by: string | null;
  created_at: string;
}

export interface ComplianceOverview {
  retention_years: number | null;
  notice_days: number;
  closed_dossiers: number;
  upcoming: RetentionDossier[];
  held: RetentionDossier[];
  requests: DataRequestItem[];
  log: DeletionLogItem[];
  ai: { enabled: boolean; enabled_at: string | null; enabled_by: string | null };
  storage: { documents_disk: 'local' | 'objet'; backups: boolean };
}

export const DATA_REQUEST_STATUS: Record<DataRequestItem['status'], { label: string; className: string }> = {
  pending: { label: 'À traiter', className: 'bg-amber-50 text-amber-800' },
  completed: { label: 'Données supprimées', className: 'bg-emerald-50 text-emerald-700' },
  rejected: { label: 'Refusée', className: 'bg-gray-100 text-gray-700' },
};

export const formatDay = (d: string | null) =>
  d ? new Date(d.length === 10 ? `${d}T12:00:00` : d).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

export const complianceService = {
  async overview(): Promise<ComplianceOverview> {
    return (await authFetch('/admin/compliance')).data;
  },
  async setRetention(years: number | null): Promise<string> {
    return (await authFetch('/admin/compliance/retention', { method: 'PUT', body: JSON.stringify({ retention_years: years }) })).message;
  },
  async hold(dossierId: number, hold: boolean): Promise<string> {
    return (await authFetch(`/admin/compliance/dossiers/${dossierId}/hold`, { method: 'POST', body: JSON.stringify({ hold }) })).message;
  },
  async complete(id: number, response: string): Promise<string> {
    return (await authFetch(`/admin/compliance/requests/${id}/complete`, { method: 'POST', body: JSON.stringify({ confirm: true, response: response || null }) })).message;
  },
  async reject(id: number, response: string): Promise<string> {
    return (await authFetch(`/admin/compliance/requests/${id}/reject`, { method: 'POST', body: JSON.stringify({ response }) })).message;
  },
};

export interface MyDataRequest {
  id: number;
  status: DataRequestItem['status'];
  response: string | null;
  created_at: string;
  handled_at: string | null;
}

export const clientDataService = {
  /** Télécharge l'archive ZIP de ses données (le jeton est envoyé en en-tête, pas dans l'URL). */
  async download(): Promise<void> {
    const res = await fetch(`${getApiUrl()}/client/my-data/export`, { headers: authHeaders(), credentials: 'include' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error((data as any)?.message || 'Téléchargement impossible.');
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mes-donnees-${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
  async requests(): Promise<MyDataRequest[]> {
    return (await authFetch('/client/data-requests')).data;
  },
  async requestErasure(message: string): Promise<string> {
    return (await authFetch('/client/data-requests', { method: 'POST', body: JSON.stringify({ confirm: true, message: message || null }) })).message;
  },
};
