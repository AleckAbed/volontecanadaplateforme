/**
 * 1.9 — Profil et image de marque du cabinet.
 */
import { authFetch as rawAuthFetch } from '@/lib/api-client';

const authFetch = rawAuthFetch as (...args: Parameters<typeof rawAuthFetch>) => Promise<any>;

export interface CabinetBranding {
  name: string;
  logo_url: string | null;
  color: string;
  color_dark: string;
  website: string | null;
}

export interface CabinetProfile {
  name: string;
  slug: string;
  phone: string | null;
  website: string | null;
  province: string | null;
  brand_color: string | null;
  branding: CabinetBranding;
}

export const cabinetProfileService = {
  async get(): Promise<CabinetProfile> {
    return (await authFetch('/admin/cabinet/profile')).data;
  },
  async update(input: Partial<Pick<CabinetProfile, 'name' | 'phone' | 'website' | 'brand_color'>>): Promise<CabinetProfile> {
    return (await authFetch('/admin/cabinet/profile', { method: 'PUT', body: JSON.stringify(input) })).data;
  },
  async uploadLogo(file: File): Promise<CabinetProfile> {
    const fd = new FormData();
    fd.append('logo', file);
    return (await authFetch('/admin/cabinet/logo', { method: 'POST', body: fd })).data;
  },
  async deleteLogo(): Promise<CabinetProfile> {
    return (await authFetch('/admin/cabinet/logo', { method: 'DELETE' })).data;
  },
};
