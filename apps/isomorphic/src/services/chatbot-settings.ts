import { getAuthToken } from '@/lib/auth-storage';

import { getApiUrl } from '@/lib/api-client';

async function authFetch(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers: HeadersInit = { Accept: 'application/json', ...options.headers };
  if (token) (headers as any).Authorization = `Bearer ${token}`;
  const res = await fetch(`${getApiUrl()}${endpoint}`, { ...options, credentials: 'include', headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erreur');
  return data;
}

export interface ChatbotSettingsPayload {
  /** 2.3 : désactivé par défaut ; l'activation exige accept_foreign_processing. */
  enabled: boolean;
  enabled_at?: string | null;
  accept_foreign_processing?: boolean;
  allow_immigration_questions: boolean;
  immigration_questions_for: 'admin' | 'collab' | 'both';
  allow_dossier_lookup: boolean;
  allow_client_lookup: boolean;
  custom_instructions: string | null;
}

export const chatbotSettingsService = {
  async get(): Promise<ChatbotSettingsPayload> {
    const res = await authFetch('/admin/chatbot/settings');
    return res.data;
  },
  async update(payload: Partial<ChatbotSettingsPayload>): Promise<ChatbotSettingsPayload> {
    const res = await authFetch('/admin/chatbot/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.data;
  },
};
