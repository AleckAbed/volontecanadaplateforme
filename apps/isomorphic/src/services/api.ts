/**
 * Service API pour communiquer avec le backend Laravel
 * URL configurée via NEXT_PUBLIC_API_URL (Vercel ou .env.local)
 */

import { getAuthToken, setAuthToken as setAuthTokenStorage, removeAuthToken } from '@/lib/auth-storage';

const API_BASE_URL_DEFAULT = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

/** URL de l'API : NEXT_PUBLIC_API_URL si défini, sinon même host que la page sur le port 8000. */
function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const fromEnv = process.env.NEXT_PUBLIC_API_URL;
    if (fromEnv && fromEnv.trim()) return fromEnv.trim().replace(/\/+$/, '');
    return `${window.location.protocol}//${window.location.hostname}:8000/api`;
  }
  return API_BASE_URL_DEFAULT;
}

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL_DEFAULT) {
    this.baseUrl = baseUrl;
  }

  /**
   * Le token n'est plus stocké côté JS — le cookie HttpOnly posé par Laravel
   * est envoyé automatiquement par le navigateur (via credentials: 'include').
   * Cette méthode retourne null par défaut. Conservée pour rétro-compat avec
   * le code qui pourrait encore l'appeler.
   */
  private getToken(): string | null {
    return getAuthToken(); // legacy fallback — retourne null en flux 100% cookie
  }

  private setToken(token: string): void {
    // No-op : on ne stocke plus le token côté JS — le cookie HttpOnly suffit.
    // Conservé pour rétro-compat avec d'éventuels appels existants.
    void token;
  }

  /**
   * Efface les marqueurs d'auth côté client (user_type). Le cookie HttpOnly
   * est effacé par Laravel à la déconnexion.
   */
  private removeToken(): void {
    removeAuthToken();
    if (typeof window !== 'undefined') {
      try { localStorage.removeItem('user_type'); } catch {}
    }
  }

  /**
   * Effectuer une requête HTTP
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getToken();
    const lang = typeof window !== 'undefined'
      ? (() => { try { return localStorage.getItem('app_language') || 'fr'; } catch { return 'fr'; } })()
      : 'fr';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Accept-Language': lang,
      ...(options.headers as Record<string, string>),
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const baseUrl = getApiBaseUrl();
      // `credentials: 'include'` est requis pour que le navigateur envoie le
      // cookie HttpOnly `auth_token` posé par Laravel à la connexion.
      // Combiné avec CORS `supports_credentials=true` côté backend.
      const response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        credentials: 'include',
        headers,
      });

      const contentType = response.headers.get('content-type');
      let data: ApiResponse<T>;

      if (contentType && contentType.includes('application/json')) {
        data = (await response.json()) as ApiResponse<T>;
      } else {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Réponse invalide du serveur');
      }

      if (!response.ok) {
        const message = data.message || `Erreur ${response.status}: ${response.statusText}`;
        if (response.status === 401) {
          throw new Error(`Unauthorized (401): ${message}`);
        }
        throw new Error(message);
      }

      return data;
    } catch (error: any) {
      console.error('API Error:', error);
      const isNetworkError =
        error?.name === 'TypeError' &&
        (error?.message?.includes('fetch') || error?.message?.includes('NetworkError'));
      if (isNetworkError) {
        const base = getApiBaseUrl();
        throw new Error(
          `Impossible de joindre l'API (${base}). Vérifiez que Laravel est démarré et que NEXT_PUBLIC_API_URL pointe vers l'API si besoin.`
        );
      }
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // ============ AUTHENTIFICATION ADMIN ============

  /**
   * Connexion administrateur
   */
  async adminLogin(email: string, password: string) {
    const response = await this.post<{
      admin: any;
      token: string;
    }>('/admin/login', { email, password });

    // Le cookie HttpOnly est posé par Laravel. Le token JSON renvoyé est
    // legacy — on ne le stocke plus. On garde juste un marqueur user_type
    // pour savoir quel /me appeler au mount.
    if (response.success && typeof window !== 'undefined') {
      try { localStorage.setItem('user_type', 'admin'); } catch {}
    }
    return response;
  }

  /**
   * Déconnexion administrateur
   */
  async adminLogout() {
    const response = await this.post('/admin/logout', {});
    this.removeToken();
    return response;
  }

  /**
   * Obtenir les informations de l'admin connecté
   */
  async getAdminProfile() {
    return this.get<any>('/admin/me');
  }

  /**
   * Vérifie le mot de passe de l'admin connecté SANS rotation de token.
   * Utilisé par le lock screen — préserve la session existante.
   */
  async verifyAdminPassword(password: string) {
    return this.post<{ message: string }>('/admin/verify-password', { password });
  }

  // ============ AUTHENTIFICATION CLIENT ============

  /**
   * Inscription client
   */
  async clientRegister(data: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone?: string;
  }) {
    const response = await this.post<{
      client: any;
      token: string;
    }>('/client/register', data);

    if (response.success && typeof window !== 'undefined') {
      try { localStorage.setItem('user_type', 'client'); } catch {}
    }
    return response;
  }

  /**
   * Connexion client
   */
  async clientLogin(email: string, password: string) {
    const response = await this.post<{
      client: any;
      token: string;
    }>('/client/login', { email, password });

    if (response.success && typeof window !== 'undefined') {
      try { localStorage.setItem('user_type', 'client'); } catch {}
    }
    return response;
  }

  /**
   * Déconnexion client
   */
  async clientLogout() {
    const response = await this.post('/client/logout', {});
    this.removeToken();
    return response;
  }

  /**
   * Obtenir les informations du client connecté
   */
  async getClientProfile() {
    return this.get<any>('/client/me');
  }

  // ============ UTILITAIRES ============

  /**
   * Vérifier si l'utilisateur est probablement authentifié (heuristique).
   *
   * Avec le cookie HttpOnly, JS ne peut pas vérifier directement le token —
   * il faut appeler /admin/me ou /client/me pour avoir la vérité du serveur.
   * On utilise ici un marqueur user_type (non sensible) comme indication
   * "il y avait une session récemment", pour éviter un round-trip réseau
   * inutile. useAuth fait l'appel /me au mount pour confirmer.
   */
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('user_type') === 'admin'
          || localStorage.getItem('user_type') === 'client'
          || !!this.getToken(); // fallback legacy
    } catch { return false; }
  }

  /**
   * Nettoyer l'authentification (pour déconnexion forcée)
   */
  clearAuth(): void {
    this.removeToken();
  }

  // ==================== QUESTIONNAIRES ====================

  /**
   * Envoyer un formulaire à un client (Admin)
   */
  async sendQuestionnaire(data: {
    client_type: 'existing' | 'custom';
    client_id?: number;
    custom_name?: string;
    email: string;
    phone?: string;
    form_type: string;
  }): Promise<ApiResponse> {
    return this.request<ApiResponse>('/admin/questionnaires/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Lister les questionnaires envoyés (Admin)
   */
  async listQuestionnaires(page: number = 1): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/admin/questionnaires?page=${page}`, {
      method: 'GET',
    });
  }

  /**
   * Obtenir les détails d'un questionnaire (Admin)
   */
  async getQuestionnaire(id: number): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/admin/questionnaires/${id}`, {
      method: 'GET',
    });
  }

  /**
   * Obtenir la liste des clients (Admin) — pour questionnaires
   */
  async getClients(): Promise<ApiResponse> {
    return this.request<ApiResponse>('/admin/clients', {
      method: 'GET',
    });
  }

  /**
   * Module clients : liste paginée (Admin)
   */
  async getModuleClients(params?: { page?: number; per_page?: number; search?: string; client_type?: string }): Promise<ApiResponse> {
    const sp = new URLSearchParams();
    if (params?.page != null) sp.set('page', String(params.page));
    if (params?.per_page != null) sp.set('per_page', String(params.per_page));
    if (params?.search) sp.set('search', params.search);
    if (params?.client_type) sp.set('client_type', params.client_type);
    const qs = sp.toString();
    return this.request<ApiResponse>(`/admin/module-clients${qs ? `?${qs}` : ''}`, { method: 'GET' });
  }

  /** Récupérer un client par ID (avec familyMembers + dossiers) */
  async getModuleClient(id: number | string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/admin/module-clients/${id}`, { method: 'GET' });
  }

  /** Mettre à jour un client */
  async updateModuleClient(id: number | string, payload: any): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/admin/module-clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  /** Supprimer un client */
  async deleteModuleClient(id: number | string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/admin/module-clients/${id}`, { method: 'DELETE' });
  }

  /** Ajouter un membre de famille */
  async addFamilyMember(clientId: number | string, payload: any): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/admin/module-clients/${clientId}/family-members`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /** Modifier un membre de famille */
  async updateFamilyMember(clientId: number | string, memberId: number | string, payload: any): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/admin/module-clients/${clientId}/family-members/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  /** Supprimer un membre de famille */
  async deleteFamilyMember(clientId: number | string, memberId: number | string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/admin/module-clients/${clientId}/family-members/${memberId}`, {
      method: 'DELETE',
    });
  }

  // ─── Dossiers ─────────────────────────────────────────────────────────────

  async getDossiers(params?: { page?: number; per_page?: number; status?: string; client_id?: number }): Promise<ApiResponse> {
    const sp = new URLSearchParams();
    if (params?.page != null) sp.set('page', String(params.page));
    if (params?.per_page != null) sp.set('per_page', String(params.per_page));
    if (params?.status) sp.set('status', params.status);
    if (params?.client_id) sp.set('client_id', String(params.client_id));
    const qs = sp.toString();
    return this.request<ApiResponse>(`/admin/dossiers${qs ? `?${qs}` : ''}`, { method: 'GET' });
  }

  async getDossier(id: number | string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/admin/dossiers/${id}`, { method: 'GET' });
  }

  async createDossier(payload: {
    client_id: number;
    scope: 'client' | 'member' | 'family';
    family_member_id?: number;
    name: string;
    service_name?: string;
    status?: string;
    opened_at?: string;
    deadline_at?: string;
    notes?: string;
  }): Promise<ApiResponse> {
    return this.request<ApiResponse>('/admin/dossiers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateDossier(id: number | string, payload: any): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/admin/dossiers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteDossier(id: number | string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/admin/dossiers/${id}`, { method: 'DELETE' });
  }

  async getDossierOptions(): Promise<ApiResponse> {
    return this.request<ApiResponse>('/admin/dossiers/options', { method: 'GET' });
  }

  /**
   * Créer un client (Admin) — seul ou avec membres de famille
   */
  async createModuleClient(payload: {
    client_type: 'single' | 'family';
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    phone?: string;
    date_of_birth?: string;
    nationality?: string;
    passport_number?: string;
    address?: string;
    family_members?: Array<{
      first_name: string;
      last_name: string;
      relationship: string;
      date_of_birth?: string;
      nationality?: string;
      passport_number?: string;
      phone?: string;
      email?: string;
    }>;
  }): Promise<ApiResponse> {
    return this.request<ApiResponse>('/admin/module-clients', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Vérifier l'accès au formulaire (Email + Code)
   */
  async verifyQuestionnaireAccess(email: string, code: string): Promise<ApiResponse> {
    return this.request<ApiResponse>('/questionnaires/verify', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  }

  /**
   * Sauvegarder les données du formulaire
   */
  async saveQuestionnaireData(code: string, formData: any): Promise<ApiResponse> {
    // Ne jamais utiliser null/undefined (évite "can't convert null to object")
    const input = formData != null && typeof formData === 'object' && !Array.isArray(formData) ? formData : {};
    let payload: Record<string, unknown> = {};
    try {
      const str = JSON.stringify(input);
      if (str != null) payload = JSON.parse(str) as Record<string, unknown>;
    } catch {
      payload = {};
    }
    if (payload == null || typeof payload !== 'object' || Array.isArray(payload)) {
      payload = {};
    }

    const body = JSON.stringify({ form_data: payload });
    return this.request<ApiResponse>(`/questionnaires/${code}/save`, {
      method: 'POST',
      body,
    });
  }

  /**
   * Soumettre le formulaire (marquer comme complété)
   */
  async submitQuestionnaire(code: string, formData: any): Promise<ApiResponse> {
    const payload = formData != null && typeof formData === 'object' && !Array.isArray(formData) ? formData : {};
    return this.request<ApiResponse>(`/questionnaires/${code}/submit`, {
      method: 'POST',
      body: JSON.stringify({ form_data: payload }),
    });
  }
}

// Export d'une instance unique
export const apiService = new ApiService();
export const api = apiService;
export default apiService;


