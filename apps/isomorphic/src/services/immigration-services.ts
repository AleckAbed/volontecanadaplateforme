import { getAuthToken } from '@/lib/auth-storage';

import { getApiUrl } from '@/lib/api-client';

async function authFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = getAuthToken();
  const headers: HeadersInit = { Accept: 'application/json', ...options.headers };
  if (token) (headers as any).Authorization = `Bearer ${token}`;
  const res = await fetch(`${getApiUrl()}${endpoint}`, { ...options, credentials: 'include', headers });
  const data: any = await res.json();
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
