'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Badge, ActionIcon, Tooltip } from 'rizzui';
import { PiPencilDuotone, PiTrashDuotone, PiPlusBold, PiStarFill } from 'react-icons/pi';
import { newsService, NewsArticle } from '@/services/news';

export default function ArticlesListPage() {
  const [items, setItems] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const res = await newsService.listArticles(page, q || undefined);
      setItems(res.data);
      setTotalPages(res.last_page);
      setTotal(res.total);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const handleDelete = async (a: NewsArticle) => {
    if (!confirm(`Supprimer l'article "${a.title}" ?`)) return;
    try {
      await newsService.deleteArticle(a.id);
      toast.success('Article supprimé');
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Articles</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gérer les articles et annonces publiés sur la page Nouvelles.
          </p>
        </div>
        <Link
          href="/admin/news/articles/nouveau"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <PiPlusBold className="h-4 w-4" /> Nouvel article
        </Link>
      </div>

      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un article par titre…"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">
          Rechercher
        </button>
      </form>

      {loading ? (
        <div className="py-10 text-center text-gray-400">Chargement…</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <p className="text-lg font-medium text-gray-500">Aucun article</p>
          <Link
            href="/admin/news/articles/nouveau"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Créer un article
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Article</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Catégorie</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Source</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Vues</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        {a.thumbnail && (
                          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg">
                            <Image src={a.thumbnail} alt={a.title} fill className="object-cover" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            {a.is_featured && <PiStarFill className="h-3 w-3 text-amber-500" />}
                            <div className="truncate text-sm font-medium text-gray-900">{a.title}</div>
                          </div>
                          {a.summary && (
                            <div className="truncate text-xs text-gray-500">{a.summary}</div>
                          )}
                          <div className="text-[11px] text-gray-400">{a.published_at}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{a.category?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{a.source?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant="flat" color={a.is_published ? 'success' : 'secondary'} rounded="lg">
                        {a.is_published ? 'Publié' : 'Brouillon'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{a.views_count}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Tooltip size="sm" content="Modifier" placement="top" color="invert">
                          <Link href={`/admin/news/articles/${a.id}/edit`}>
                            <ActionIcon as="span" size="sm" variant="outline">
                              <PiPencilDuotone className="h-4 w-4" />
                            </ActionIcon>
                          </Link>
                        </Tooltip>
                        <Tooltip size="sm" content="Supprimer" placement="top" color="invert">
                          <ActionIcon size="sm" variant="outline" onClick={() => handleDelete(a)}>
                            <PiTrashDuotone className="h-4 w-4" />
                          </ActionIcon>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">{total} article{total > 1 ? 's' : ''}</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
                >
                  Précédent
                </button>
                <span className="text-sm">Page {page} / {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
