/**
 * S5 — Tableau « action requise », échéances, notifications.
 */
import { authFetch as rawAuthFetch } from '@/lib/api-client';

const authFetch = rawAuthFetch as (...args: Parameters<typeof rawAuthFetch>) => Promise<any>;

// ─── Action requise ──────────────────────────────────────────────────────────

export interface ActionItem {
  title: string;
  subtitle: string;
  date: string | null;
  link: string;
}

export interface ActionBucket {
  key: 'overdue' | 'this_week' | 'to_review' | 'expiring_links' | 'no_answer' | 'awaiting_decision';
  label: string;
  severity: 'danger' | 'warning' | 'info' | 'neutral';
  count: number;
  items: ActionItem[];
}

export const actionFeedService = {
  async get(): Promise<{ buckets: ActionBucket[]; needing_action: number; overdue: number }> {
    const res = await authFetch('/admin/actions');
    return res.data;
  },
  async markReviewed(invitationId: number, reviewed = true): Promise<string> {
    const res = await authFetch(`/admin/invitations/${invitationId}/reviewed`, {
      method: 'POST',
      body: JSON.stringify({ reviewed }),
    });
    return res.message;
  },
};

// ─── Échéances ───────────────────────────────────────────────────────────────

export type Urgency = 'overdue' | 'this_week' | 'soon' | 'later' | 'done';

export interface DeadlineItem {
  key: string;
  source: 'manual' | 'dossier' | 'profile';
  id: number | null;
  type: string;
  type_label: string;
  label: string;
  notes: string | null;
  due_date: string;
  days_left: number;
  remind_days: number;
  urgency: Urgency;
  dossier: { id: number; name: string } | null;
  client: { id: number; name: string } | null;
  link: string | null;
}

export interface DeadlinePayload {
  label: string;
  type: string;
  due_date: string;
  remind_days?: number;
  dossier_id?: number | null;
  notes?: string | null;
}

export const deadlinesService = {
  async list(includeDone = false): Promise<{
    items: DeadlineItem[];
    types: { value: string; label: string }[];
    counts: { overdue: number; this_week: number; soon: number };
  }> {
    const res = await authFetch(`/admin/deadlines${includeDone ? '?include_done=1' : ''}`);
    return res.data;
  },
  async create(payload: DeadlinePayload): Promise<string> {
    const res = await authFetch('/admin/deadlines', { method: 'POST', body: JSON.stringify(payload) });
    return res.message;
  },
  async complete(id: number, done = true): Promise<string> {
    const res = await authFetch(`/admin/deadlines/${id}/complete`, { method: 'POST', body: JSON.stringify({ done }) });
    return res.message;
  },
  async remove(id: number): Promise<string> {
    const res = await authFetch(`/admin/deadlines/${id}`, { method: 'DELETE' });
    return res.message;
  },
  /** Dossiers du cabinet, pour rattacher une échéance. */
  async dossierOptions(): Promise<{ id: number; name: string; client_name: string }[]> {
    const res = await authFetch('/admin/dossiers?per_page=500');
    const rows: any[] = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
    return rows.map((d) => ({
      id: d.id,
      name: d.name,
      client_name: d.client ? `${d.client.first_name ?? ''} ${d.client.last_name ?? ''}`.trim() : '',
    }));
  },
};

// ─── Notifications ───────────────────────────────────────────────────────────

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

export const notificationsService = {
  async list(): Promise<{ items: NotificationItem[]; unread: number }> {
    const res = await authFetch('/admin/notifications');
    return res.data;
  },
  async markRead(id: number): Promise<void> {
    await authFetch(`/admin/notifications/${id}/read`, { method: 'POST' });
  },
  async markAllRead(): Promise<void> {
    await authFetch('/admin/notifications/read-all', { method: 'POST' });
  },
};
