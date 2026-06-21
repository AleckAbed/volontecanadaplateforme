import { ChatMessage } from '@/services/chatbot';

export type Conversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
};

function keys(userKey: string) {
  const safe = (userKey || 'anon').replace(/[^a-zA-Z0-9_-]/g, '_');
  return {
    STORAGE_KEY: `volo_conversations_v1_${safe}`,
    ACTIVE_KEY: `volo_active_conversation_v1_${safe}`,
  };
}

export const conversationStorage = {
  list(userKey: string): Conversation[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(keys(userKey).STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Conversation[];
      return Array.isArray(parsed) ? parsed.sort((a, b) => b.updatedAt - a.updatedAt) : [];
    } catch {
      return [];
    }
  },

  save(userKey: string, convs: Conversation[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(keys(userKey).STORAGE_KEY, JSON.stringify(convs));
    } catch {
      // quota exceeded — silently drop
    }
  },

  upsert(userKey: string, conv: Conversation): void {
    const all = this.list(userKey);
    const idx = all.findIndex((c) => c.id === conv.id);
    if (idx === -1) all.unshift(conv);
    else all[idx] = conv;
    this.save(userKey, all);
  },

  remove(userKey: string, id: string): void {
    this.save(userKey, this.list(userKey).filter((c) => c.id !== id));
  },

  clear(userKey: string): void {
    if (typeof window === 'undefined') return;
    const k = keys(userKey);
    localStorage.removeItem(k.STORAGE_KEY);
    localStorage.removeItem(k.ACTIVE_KEY);
  },

  getActiveId(userKey: string): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(keys(userKey).ACTIVE_KEY);
  },

  setActiveId(userKey: string, id: string | null): void {
    if (typeof window === 'undefined') return;
    const k = keys(userKey).ACTIVE_KEY;
    if (id) localStorage.setItem(k, id);
    else localStorage.removeItem(k);
  },

  newConversation(): Conversation {
    return {
      id: `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: 'Nouvelle conversation',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  },

  titleFromMessage(msg: string): string {
    const t = msg.trim().replace(/\s+/g, ' ');
    if (t.length <= 50) return t;
    return t.slice(0, 47) + '…';
  },
};

export function groupConversationsByDate(convs: Conversation[]): { label: string; items: Conversation[] }[] {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayMs = startOfToday.getTime();

  const groups: { label: string; items: Conversation[] }[] = [
    { label: "Aujourd'hui", items: [] },
    { label: 'Hier', items: [] },
    { label: '7 derniers jours', items: [] },
    { label: '30 derniers jours', items: [] },
    { label: 'Plus ancien', items: [] },
  ];

  for (const c of convs) {
    const t = c.updatedAt;
    if (t >= todayMs) groups[0].items.push(c);
    else if (t >= todayMs - day) groups[1].items.push(c);
    else if (t >= now - 7 * day) groups[2].items.push(c);
    else if (t >= now - 30 * day) groups[3].items.push(c);
    else groups[4].items.push(c);
  }

  return groups.filter((g) => g.items.length > 0);
}
