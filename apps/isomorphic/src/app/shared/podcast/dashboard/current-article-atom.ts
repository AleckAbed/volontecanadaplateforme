import { atom } from 'jotai';
import type { NewsArticle } from '@/services/news';

/**
 * Article currently being previewed in the right-side panel of the
 * Nouvelles dashboard. Setting this atom from anywhere (typically a
 * `RecentNewsItem` click) updates the panel.
 */
export const currentArticleAtom = atom<NewsArticle | null>(null);
