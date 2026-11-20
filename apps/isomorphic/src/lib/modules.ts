/**
 * Menus que le propriétaire peut ouvrir ou masquer à ses membres (S21).
 * Même liste que l'API (App\Support\Modules) : l'API refuse aussi l'accès,
 * le masquage ici n'est qu'un confort.
 */
export type ModuleKey =
  | 'statistics' | 'file_manager' | 'companies' | 'deadlines' | 'appointments' | 'invoices'
  | 'collaborators' | 'envois' | 'document_templates' | 'news' | 'assistant';

/** Début d'adresse des pages de chaque menu. */
export const MODULE_PATHS: Record<ModuleKey, string[]> = {
  statistics: ['/analytics'],
  file_manager: ['/file-manager'],
  companies: ['/admin/entreprises'],
  deadlines: ['/admin/echeances'],
  appointments: ['/admin/rendez-vous'],
  invoices: ['/facturation'],
  collaborators: ['/admin/collaborators'],
  envois: ['/envois', '/invitations'],
  document_templates: ['/documents'],
  news: ['/podcast', '/admin/news'],
  assistant: ['/assistant'],
};

export function moduleForPath(path: string | null | undefined): ModuleKey | null {
  if (!path) return null;
  for (const [key, prefixes] of Object.entries(MODULE_PATHS) as [ModuleKey, string[]][]) {
    if (prefixes.some((p) => path === p || path.startsWith(`${p}/`))) return key;
  }
  return null;
}

/** Vrai si le menu est ouvert (absent = ouvert, comme avant le réglage). */
export function isModuleOpen(modules: Partial<Record<ModuleKey, boolean>> | null | undefined, path: string | null | undefined): boolean {
  const key = moduleForPath(path);
  if (!key || !modules) return true;
  return modules[key] !== false;
}
