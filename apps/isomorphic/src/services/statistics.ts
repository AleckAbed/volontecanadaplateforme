import { getAuthToken } from '@/lib/auth-storage';

import { getApiUrl } from '@/lib/api-client';

async function authFetch(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers: HeadersInit = { Accept: 'application/json', ...options.headers };
  if (token) (headers as any).Authorization = `Bearer ${token}`;
  const res = await fetch(`${getApiUrl()}${endpoint}`, { ...options, credentials: 'include', headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Une erreur est survenue');
  return data;
}

export interface SparkPoint { day: string; count: number }
export interface MonthlyPoint {
  month: string;
  clients: number;
  dossiers: number;
  invitations: number;
}
export interface StatusBucket { key: string; label: string; count: number }
export interface ServiceBucket { service: string; count: number }
export interface LocationBucket { key: string; label: string; count: number }
export interface CollabLoad { name: string; count: number }
export interface RecentDossier {
  id: number; name: string; service_name?: string; status: string;
  client_name: string; created_at?: string;
}
export interface RecentInvitation {
  id: number; email: string; status: string;
  sent_at?: string; email_sent: boolean; client_name: string;
}

export interface StatisticsOverview {
  kpis: {
    clients: { total: number; active: number; spark: SparkPoint[] };
    dossiers: { total: number; active: number; spark: SparkPoint[] };
    invitations: {
      total: number; last_30_days: number; completion_rate: number; spark: SparkPoint[];
    };
    collaborators: { total: number; active: number; spark: SparkPoint[] };
    templates: { total: number };
    documents: { completed: number; in_progress: number };
    items: { forms: number; documents: number };
  };
  monthly: MonthlyPoint[];
  dossiers_by_status: StatusBucket[];
  dossiers_by_service: ServiceBucket[];
  clients_by_location: LocationBucket[];
  collaborator_load: CollabLoad[];
  recent_dossiers: RecentDossier[];
  recent_invitations: RecentInvitation[];
}

export const statisticsService = {
  async overview(): Promise<StatisticsOverview> {
    const res = await authFetch('/admin/statistics/overview');
    return res.data;
  },
};
