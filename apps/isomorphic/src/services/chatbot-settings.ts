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
  if (!res.ok) throw new Error(data.message || 'Erreur');
  return data;
}

export interface ChatbotSettingsPayload {
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
