'use client';

import { useEffect, useState, use } from 'react';
import toast from 'react-hot-toast';
import ArticleForm from '../../article-form';
import { newsService, NewsArticle } from '@/services/news';

export default function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    newsService.getArticle(Number(id))
      .then(setArticle)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-10 text-center text-gray-400">Chargement…</div>;
  if (!article) return <div className="p-6 text-center text-red-500">Article introuvable.</div>;

  return <ArticleForm mode="edit" article={article} />;
}
