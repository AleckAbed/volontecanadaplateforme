/**
 * Catalogue de modèles prêts à l'emploi (préremplissage déjà relié), publié par la plateforme.
 */
import { authFetch as rawAuthFetch, publicFetch as rawPublicFetch } from '@/lib/api-client';

const authFetch = rawAuthFetch as (...args: Parameters<typeof rawAuthFetch>) => Promise<any>;
const publicFetch = rawPublicFetch as (...args: Parameters<typeof rawPublicFetch>) => Promise<any>;

export interface CabinetCatalogItem {
  id: number;
  name: string;
  description: string | null;
  doc_type: string;
  fields: number;
  version: number;
  imported_template_id: number | null;
  update_available: boolean;
}

export interface PlatformCatalogItem {
  id: number;
  name: string;
  description: string | null;
  doc_type: string;
  category: string;
  fields: number;
  version: number;
  is_published: boolean;
  imports_count: number;
  updated_at: string | null;
}

export const catalogService = {
  async list(): Promise<CabinetCatalogItem[]> {
    return (await authFetch('/admin/catalog')).data;
  },
  async import(id: number): Promise<{ message: string; id: number }> {
    const res = await authFetch(`/admin/catalog/${id}/import`, { method: 'POST' });
    return { message: res.message, id: res.data.id };
  },
};

/** Console plateforme (session propre, cookie platform_token). */
export const platformCatalogService = {
  async list(): Promise<PlatformCatalogItem[]> {
    return (await publicFetch('/platform/catalog')).data;
  },
  async cabinetTemplates(cabinetId: number): Promise<{ id: number; name: string; doc_type: string; fields: number; from_catalog: boolean }[]> {
    return (await publicFetch(`/platform/cabinets/${cabinetId}/templates`)).data;
  },
  async publish(input: { cabinet_id: number; template_id: number; catalog_template_id?: number | null; name?: string; description?: string }): Promise<string> {
    return (await publicFetch('/platform/catalog', { method: 'POST', body: JSON.stringify(input) })).message;
  },
  async update(id: number, input: Partial<Pick<PlatformCatalogItem, 'name' | 'description' | 'is_published'>>): Promise<PlatformCatalogItem> {
    return (await publicFetch(`/platform/catalog/${id}`, { method: 'PATCH', body: JSON.stringify(input) })).data;
  },
  async remove(id: number): Promise<string> {
    return (await publicFetch(`/platform/catalog/${id}`, { method: 'DELETE' })).message;
  },
};
