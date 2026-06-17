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

export interface ImmigrationServiceItem {
  id: number;
  name: string;
  description?: string;
  category?: string;
  duration?: string;
  color?: string;
  status: 'active' | 'inactive' | 'pending';
  sort_order?: number;
  created_at?: string;
}

export const immigrationServicesService = {
  async list(activeOnly = false): Promise<ImmigrationServiceItem[]> {
    const res = await authFetch(`/admin/immigration-services${activeOnly ? '?active_only=1' : ''}`);
    return res.data;
  },
  async create(payload: Partial<ImmigrationServiceItem>): Promise<ImmigrationServiceItem> {
    const res = await authFetch('/admin/immigration-services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.data;
  },
  async update(id: number, payload: Partial<ImmigrationServiceItem>): Promise<ImmigrationServiceItem> {
    const res = await authFetch(`/admin/immigration-services/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.data;
  },
  async remove(id: number): Promise<void> {
    await authFetch(`/admin/immigration-services/${id}`, { method: 'DELETE' });
  },
};
