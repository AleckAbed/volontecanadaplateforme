'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { documentService, DocumentTemplate } from '@/services/documents';

const categoryColors: Record<string, string> = {
  ircc: 'bg-blue-100 text-blue-800',
  cabinet: 'bg-purple-100 text-purple-800',
  contrat: 'bg-green-100 text-green-800',
  autre: 'bg-gray-100 text-gray-800',
};

export default function DocumentTemplatesPage() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await documentService.getTemplates();
      setTemplates(data);
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Supprimer le modèle "${name}" ? Cette action est irréversible.`)) return;
    try {
      setDeleting(id);
      await documentService.deleteTemplate(id);
      toast.success('Modèle supprimé');
      load();
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de la suppression');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="p-6">
      {/* En-tête */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Modèles de documents</h1>
          <p className="mt-1 text-sm text-gray-500">
            Uploadez vos formulaires PDF (IRCC, contrats…) et définissez les champs à remplir.
          </p>
        </div>
        <Link
          href="/documents/nouveau"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + Nouveau modèle
        </Link>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-20 text-gray-400">Chargement…</div>
      ) : templates.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <p className="text-lg font-medium text-gray-500">Aucun modèle</p>
          <p className="mt-1 text-sm text-gray-400">Commencez par uploader un formulaire PDF.</p>
          <Link
            href="/documents/nouveau"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Créer le premier modèle
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <div
              key={t.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              {/* Catégorie + statut champs */}
              <div className="mb-3 flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryColors[t.category] ?? categoryColors.autre}`}>
                  {t.category_label}
                </span>
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  ✓ Prêt
                </span>
              </div>

              {/* Nom */}
              <h3 className="mb-1 text-base font-semibold text-gray-900">{t.name}</h3>
              {t.description && (
                <p className="mb-3 text-sm text-gray-500 line-clamp-2">{t.description}</p>
              )}
              <p className="mb-4 text-xs text-gray-400">Créé le {t.created_at} par {t.created_by}</p>

              {/* Actions */}
              <div className="flex gap-2">
                <Link
                  href={`/documents/editeur/${t.id}`}
                  className="flex-1 rounded-lg border border-blue-600 px-3 py-1.5 text-center text-sm font-medium text-blue-600 hover:bg-blue-50"
                >
                  Prévisualiser
                </Link>
                <Link
                  href={`/documents/test/${t.id}`}
                  className="flex-1 rounded-lg border border-green-600 px-3 py-1.5 text-center text-sm font-medium text-green-600 hover:bg-green-50"
                >
                  Tester
                </Link>
                <button
                  onClick={() => handleDelete(t.id, t.name)}
                  disabled={deleting === t.id}
                  className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {deleting === t.id ? '…' : 'Supprimer'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
