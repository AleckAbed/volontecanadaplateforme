'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { newsService, NewsArticle, NewsSource } from '@/services/news';
import { invitationsService, Category } from '@/services/invitations';

interface ArticleFormProps {
  article?: NewsArticle | null;
  mode: 'create' | 'edit';
}

export default function ArticleForm({ article, mode }: ArticleFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: article?.title || '',
    summary: article?.summary || '',
    content: article?.content || '',
    thumbnail: article?.thumbnail || '',
    category_id: article?.category?.id ?? null,
    source_id: article?.source?.id ?? null,
    read_time: article?.read_time || '',
    is_featured: article?.is_featured ?? false,
    is_published: article?.is_published ?? true,
  });

  useEffect(() => {
    Promise.all([
      invitationsService.listCategories({ type: 'news', activeOnly: true }),
      newsService.listSources(),
    ]).then(([cats, srcs]) => {
      setCategories(cats);
      setSources(srcs);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Titre requis');
      return;
    }
    try {
      setSubmitting(true);
      const payload: any = { ...form };
      if (mode === 'create') {
        await newsService.createArticle(payload);
        toast.success('Article créé');
      } else if (article) {
        await newsService.updateArticle(article.id, payload);
        toast.success('Article mis à jour');
      }
      router.push('/admin/news/articles');
    } catch (e: any) {
      toast.error(e.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <button onClick={() => router.back()} className="mb-2 text-sm text-gray-500 hover:text-gray-800">
          ← Retour
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {mode === 'create' ? 'Nouvel article' : 'Modifier l\'article'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold">Contenu</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Titre *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Résumé</label>
              <textarea
                value={form.summary || ''}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                rows={2}
                placeholder="Court résumé affiché sous le titre…"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Contenu (HTML supporté)</label>
              <textarea
                value={form.content || ''}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={10}
                placeholder="<p>Corps de l'article…</p>"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold">Classification</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Catégorie</label>
              <select
                value={form.category_id ?? ''}
                onChange={(e) => setForm({ ...form, category_id: e.target.value ? Number(e.target.value) : null })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">— Aucune —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Source</label>
              <select
                value={form.source_id ?? ''}
                onChange={(e) => setForm({ ...form, source_id: e.target.value ? Number(e.target.value) : null })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">— Aucune —</option>
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">URL de l&apos;image (thumbnail)</label>
              <input
                type="url"
                value={form.thumbnail || ''}
                onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                placeholder="https://…"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Temps de lecture</label>
              <input
                type="text"
                value={form.read_time || ''}
                onChange={(e) => setForm({ ...form, read_time: e.target.value })}
                placeholder="ex: 5 min de lecture"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold">Publication</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
              />
              <span className="text-sm text-gray-700">Publier (visible sur la page Nouvelles)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
              />
              <span className="text-sm text-gray-700">Mettre à la une (section « Articles à la une »)</span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Enregistrement…' : mode === 'create' ? 'Créer l\'article' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}
