'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { documentService, DocumentTemplate } from '@/services/documents';
import { servicesList } from '@/data/services-immigration';

export default function DocumentTemplatesPage() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [editing, setEditing] = useState<DocumentTemplate | null>(null);

  // Filtres
  const [serviceFilter, setServiceFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');

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

  // Filtrage client : pas besoin de re-fetch à chaque touche
  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates.filter((t) => {
      if (serviceFilter && (t.service_name || '') !== serviceFilter) return false;
      if (!q) return true;
      const hay = `${t.name} ${t.description ?? ''} ${t.service_name ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [templates, serviceFilter, search]);

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

      {/* Filtres */}
      <div className="mb-5 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 md:flex-row md:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium uppercase text-gray-500">Rechercher</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom, description, service…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="md:w-72">
          <label className="mb-1 block text-xs font-medium uppercase text-gray-500">Service d&apos;immigration</label>
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Tous les services</option>
            {servicesList.filter((s) => s.status === 'active').map((s) => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>
        {(search || serviceFilter) && (
          <button
            type="button"
            onClick={() => { setSearch(''); setServiceFilter(''); }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Réinitialiser
          </button>
        )}
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
      ) : filteredTemplates.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center text-gray-500">
          Aucun modèle ne correspond à vos filtres.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((t) => (
            <div
              key={t.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              {/* Service d'immigration + statut champs */}
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {t.service_name ? (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                    {t.service_name}
                  </span>
                ) : (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    Général
                  </span>
                )}
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
              <div className="flex flex-wrap gap-2">
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
                  onClick={() => setEditing(t)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Modifier
                </button>
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

      {editing && (
        <EditTemplateModal
          template={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => { setEditing(null); await load(); }}
        />
      )}
    </div>
  );
}

function EditTemplateModal({
  template, onClose, onSaved,
}: { template: DocumentTemplate; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description ?? '');
  const [serviceName, setServiceName] = useState(template.service_name ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Nom requis'); return; }
    try {
      setSaving(true);
      await documentService.updateTemplate(template.id, {
        name: name.trim(),
        description: description.trim() || null,
        service_name: serviceName || null,
      });
      toast.success('Modèle mis à jour');
      onSaved();
    } catch (e: any) {
      toast.error(e.message || 'Échec de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Modifier le modèle</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>
        <form onSubmit={handleSave} className="space-y-4 p-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nom *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Service d&apos;immigration</label>
            <select
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">— Aucun (modèle général) —</option>
              {servicesList.filter((s) => s.status === 'active').map((s) => (
                <option key={s.id} value={s.name}>{s.name} ({s.category})</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Les futurs dossiers pour ce service ajouteront automatiquement ce document.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
