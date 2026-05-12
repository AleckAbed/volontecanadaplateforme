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
  const res = await fetch(`${getApiUrl()}${endpoint}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Une erreur est survenue');
  return data;
}

async function publicFetch(endpoint: string, options: RequestInit = {}) {
  // Public endpoints — still send auth token if available so the API can know
  // which sources the current admin follows
  const token = getAuthToken();
  const headers: HeadersInit = { Accept: 'application/json', ...options.headers };
  if (token) (headers as any).Authorization = `Bearer ${token}`;
  const res = await fetch(`${getApiUrl()}${endpoint}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Une erreur est survenue');
  return data;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NewsCategoryRef {
  id: number;
  name: string;
  color?: string | null;
  icon?: string | null;
}

export interface NewsSourceRef {
  id: number;
  name: string;
  avatar?: string | null;
}

export interface NewsSource {
  id: number;
  name: string;
  avatar?: string | null;
  description?: string | null;
  website?: string | null;
  followers_count: number;
  is_following?: boolean;
}

export interface NewsArticle {
  id: number;
  title: string;
  slug: string;
  summary?: string | null;
  content?: string | null;
  thumbnail?: string | null;
  read_time?: string | null;
  is_featured: boolean;
  is_published: boolean;
  published_at?: string | null;
  views_count: number;
  category?: NewsCategoryRef | null;
  source?: NewsSourceRef | null;
  audio_url?: string | null;
  created_by?: string | null;
  created_at?: string | null;
}

export interface ArticleListResponse {
  data: NewsArticle[];
  total: number;
  last_page: number;
  current_page: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const newsService = {
  // ─── Public (read) ────────────────────────────────────────────────────────

  async listPublicArticles(params: {
    featuredOnly?: boolean;
    categoryId?: number;
    sourceId?: number;
    limit?: number;
  } = {}): Promise<NewsArticle[]> {
    const qs = new URLSearchParams();
    if (params.featuredOnly) qs.set('featured_only', '1');
    if (params.categoryId) qs.set('category_id', String(params.categoryId));
    if (params.sourceId) qs.set('source_id', String(params.sourceId));
    if (params.limit) qs.set('limit', String(params.limit));
    const res = await publicFetch(`/news/articles?${qs}`);
    return res.data;
  },

  async getPublicArticle(slug: string): Promise<NewsArticle> {
    const res = await publicFetch(`/news/articles/${encodeURIComponent(slug)}`);
    return res.data;
  },

  async listSources(): Promise<NewsSource[]> {
    const res = await publicFetch('/news/sources');
    return res.data;
  },

  // ─── Admin ────────────────────────────────────────────────────────────────

  async listArticles(page = 1, q?: string): Promise<ArticleListResponse> {
    const qs = new URLSearchParams({ page: String(page) });
    if (q) qs.set('q', q);
    const res = await authFetch(`/admin/news/articles?${qs}`);
    return res.data;
  },

  async getArticle(id: number): Promise<NewsArticle> {
    const res = await authFetch(`/admin/news/articles/${id}`);
    return res.data;
  },

  async createArticle(payload: Partial<NewsArticle> & { category_id?: number | null; source_id?: number | null }): Promise<NewsArticle> {
    const res = await authFetch('/admin/news/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async updateArticle(id: number, payload: Partial<NewsArticle> & { category_id?: number | null; source_id?: number | null }): Promise<NewsArticle> {
    const res = await authFetch(`/admin/news/articles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async deleteArticle(id: number): Promise<void> {
    await authFetch(`/admin/news/articles/${id}`, { method: 'DELETE' });
  },

  async createSource(payload: Partial<NewsSource>): Promise<NewsSource> {
    const res = await authFetch('/admin/news/sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async updateSource(id: number, payload: Partial<NewsSource>): Promise<NewsSource> {
    const res = await authFetch(`/admin/news/sources/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async deleteSource(id: number): Promise<void> {
    await authFetch(`/admin/news/sources/${id}`, { method: 'DELETE' });
  },

  async followSource(id: number): Promise<void> {
    await authFetch(`/admin/news/sources/${id}/follow`, { method: 'POST' });
  },

  async unfollowSource(id: number): Promise<void> {
    await authFetch(`/admin/news/sources/${id}/unfollow`, { method: 'POST' });
  },
};
