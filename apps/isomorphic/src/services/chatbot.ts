import { getAuthToken } from '@/lib/auth-storage';

import { getApiUrl } from '@/lib/api-client';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  disambiguation?: Disambiguation;
};

export type DisambiguationOption = {
  id: number;
  label: string;
  sendText: string;
};

export type Disambiguation = {
  type: 'client' | 'dossier';
  query: string;
  message: string;
  options: DisambiguationOption[];
};

export type AskResult =
  | { kind: 'answer'; answer: string }
  | { kind: 'disambiguation'; disambiguation: Disambiguation };

export const chatbotService = {
  async ask(audience: 'admin' | 'collab', message: string, history: ChatMessage[]): Promise<AskResult> {
    const token = getAuthToken();
    const endpoint = audience === 'collab' ? '/collaborator/chatbot/ask' : '/admin/chatbot/ask';
    // L'historique envoyé au backend ne doit pas inclure les méta de désambiguïsation
    const cleanHistory = history
      .filter((m) => !m.disambiguation)
      .map((m) => ({ role: m.role, content: m.content }));
    const res = await fetch(`${getApiUrl()}${endpoint}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message, history: cleanHistory }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erreur du chatbot');
    if (data.data?.disambiguation) {
      return { kind: 'disambiguation', disambiguation: data.data.disambiguation };
    }
    return { kind: 'answer', answer: data.data.answer as string };
  },
};
