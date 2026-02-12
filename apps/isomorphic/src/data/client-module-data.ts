/**
 * Données de repli pour la liste clients (affichage initial ou si l'API est indisponible).
 * En production la liste est chargée via apiService.getModuleClients().
 */
export interface ClientListRow {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  client_type: string;
  family_members_count?: number;
  dossiers_count?: number;
  is_active?: boolean;
}

export const clientModuleDataFallback: ClientListRow[] = [];
