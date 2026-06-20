'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  PiSquaresFourDuotone, PiListDuotone, PiFoldersDuotone,
  PiFolderDuotone, PiFolderOpenDuotone, PiFilePdfDuotone,
  PiCaretDownBold, PiCaretRightBold,
} from 'react-icons/pi';
import { documentService, DocumentTemplate } from '@/services/documents';
import { immigrationServicesService, ImmigrationServiceItem } from '@/services/immigration-services';
import { IMMIGRATION_SERVICES_REFRESH_EVENT } from '@/data/services-immigration';
import TourButton from '@/components/TourButton';

const DOCUMENTS_TOUR = [
  {
    element: '#tour-doc-viewmode',
    popover: {
      title: '👁 Mode d\'affichage',
      description: 'Basculez entre <strong>Grille</strong> (cartes visuelles), <strong>Liste</strong> (tableau dense) et <strong>Explorateur</strong> (dossiers par service). Votre choix est mémorisé.',
    },
  },
  {
    element: '#tour-doc-new',
    popover: {
      title: '➕ Nouveau modèle',
      description: 'Téléversez un PDF (IRCC ou Provincial FO), liez-le à un <strong>service d\'immigration</strong>, choisissez sa <strong>nature</strong> et sa <strong>localisation cible</strong>. Il sera auto-attaché aux futurs dossiers du même service.',
    },
  },
  {
    element: '#tour-doc-filters',
    popover: {
      title: '🔍 Filtres',
      description: 'Recherchez par nom/description, ou filtrez par <strong>service d\'immigration</strong> ou <strong>type général</strong> (cabinet, IRCC, etc.).',
    },
  },
];

type ViewMode = 'grid' | 'list' | 'explorer';
const VIEW_STORAGE_KEY = 'documentsView';

export default function DocumentTemplatesPage() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [editing, setEditing] = useState<DocumentTemplate | null>(null);

  // Mode de vue (préférence persistée en localStorage)
  const [view, setView] = useState<ViewMode>('grid');

  // Filtres
  const [serviceFilter, setServiceFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [services, setServices] = useState<ImmigrationServiceItem[]>([]);

  useEffect(() => {
    const loadServices = () => {
      immigrationServicesService.list(true)
        .then(setServices)
        .catch(() => setServices([]));
    };
    loadServices();
    const handler = () => loadServices();
    if (typeof window !== 'undefined') {
      window.addEventListener(IMMIGRATION_SERVICES_REFRESH_EVENT, handler);
      return () => window.removeEventListener(IMMIGRATION_SERVICES_REFRESH_EVENT, handler);
    }
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_STORAGE_KEY);
      if (saved === 'grid' || saved === 'list' || saved === 'explorer') setView(saved);
    } catch {}
  }, []);

  const changeView = (mode: ViewMode) => {
    setView(mode);
    try { localStorage.setItem(VIEW_STORAGE_KEY, mode); } catch {}
  };

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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Modèles de documents</h1>
          <p className="mt-1 text-sm text-gray-500">
            Uploadez vos formulaires PDF (IRCC, contrats…) et définissez les champs à remplir.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <TourButton steps={DOCUMENTS_TOUR} storageKey="tour-documents-seen" />
          {/* Switcher de vue */}
          <div id="tour-doc-viewmode" className="inline-flex items-center rounded-lg border border-gray-200 bg-white p-0.5 shadow-sm">
            <ViewBtn icon={<PiSquaresFourDuotone className="h-5 w-5" />} label="Grille" active={view === 'grid'} onClick={() => changeView('grid')} />
            <ViewBtn icon={<PiListDuotone className="h-5 w-5" />} label="Liste" active={view === 'list'} onClick={() => changeView('list')} />
            <ViewBtn icon={<PiFoldersDuotone className="h-5 w-5" />} label="Explorateur" active={view === 'explorer'} onClick={() => changeView('explorer')} />
          </div>
          <Link
            id="tour-doc-new"
            href="/documents/nouveau"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Nouveau modèle
          </Link>
        </div>
      </div>

      {/* Filtres */}
      <div id="tour-doc-filters" className="mb-5 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 md:flex-row md:items-end">
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
          <label className="mb-1 block text-xs font-medium uppercase text-gray-500">Service d&apos;immigration / Type</label>
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Tout afficher</option>
            <optgroup label="Services d'immigration">
              {services.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </optgroup>
            <optgroup label="Types généraux">
              <option value="Documents du cabinet">Documents du cabinet</option>
              <option value="Autre">Autre</option>
            </optgroup>
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
      ) : view === 'grid' ? (
        <GridView templates={filteredTemplates} onEdit={setEditing} onDelete={handleDelete} deleting={deleting} />
      ) : view === 'list' ? (
        <ListView templates={filteredTemplates} onEdit={setEditing} onDelete={handleDelete} deleting={deleting} />
      ) : (
        <ExplorerView templates={filteredTemplates} onEdit={setEditing} onDelete={handleDelete} deleting={deleting} />
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

// ─── Switcher de vue ─────────────────────────────────────────────────────────

function ViewBtn({
  icon, label, active, onClick,
}: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
        active ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

// ─── Vue GRILLE (existante) ──────────────────────────────────────────────────

interface ViewProps {
  templates: DocumentTemplate[];
  onEdit: (t: DocumentTemplate) => void;
  onDelete: (id: number, name: string) => void;
  deleting: number | null;
}

function GridView({ templates, onEdit, onDelete, deleting }: ViewProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {templates.map((t) => (
        <div
          key={t.id}
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
        >
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
            <DocTypeBadge docType={(t as any).doc_type} />
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              ✓ Prêt
            </span>
          </div>

          <h3 className="mb-1 text-base font-semibold text-gray-900">{t.name}</h3>
          {t.description && (
            <p className="mb-3 text-sm text-gray-500 line-clamp-2">{t.description}</p>
          )}
          <p className="mb-4 text-xs text-gray-400">Créé le {t.created_at} par {t.created_by}</p>

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
              onClick={() => onEdit(t)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Modifier
            </button>
            <button
              onClick={() => onDelete(t.id, t.name)}
              disabled={deleting === t.id}
              className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {deleting === t.id ? '…' : 'Supprimer'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Vue LISTE (table dense) ─────────────────────────────────────────────────

function ListView({ templates, onEdit, onDelete, deleting }: ViewProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3">Nom</th>
            <th className="px-4 py-3">Service</th>
            <th className="px-4 py-3">Nature</th>
            <th className="px-4 py-3">Créé par</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {templates.map((t) => (
            <tr key={t.id} className="border-t border-gray-100 hover:bg-gray-50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <PiFilePdfDuotone className="h-6 w-6 flex-shrink-0 text-red-600" />
                  <div className="overflow-hidden">
                    <div className="truncate font-medium text-gray-900">{t.name}</div>
                    {t.description && (
                      <div className="truncate text-xs text-gray-500">{t.description}</div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                {t.service_name ? (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                    {t.service_name}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">Général</span>
                )}
              </td>
              <td className="px-4 py-3">
                <DocTypeBadge docType={(t as any).doc_type} />
              </td>
              <td className="px-4 py-3 text-gray-600">{t.created_by || '—'}</td>
              <td className="px-4 py-3 text-gray-500">{t.created_at}</td>
              <td className="px-4 py-3 text-right">
                <div className="inline-flex gap-1">
                  <Link
                    href={`/documents/editeur/${t.id}`}
                    className="rounded-lg border border-blue-300 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
                  >
                    Voir
                  </Link>
                  <Link
                    href={`/documents/test/${t.id}`}
                    className="rounded-lg border border-green-300 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-50"
                  >
                    Tester
                  </Link>
                  <button
                    onClick={() => onEdit(t)}
                    className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => onDelete(t.id, t.name)}
                    disabled={deleting === t.id}
                    className="rounded-lg border border-red-300 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {deleting === t.id ? '…' : 'Supprimer'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Vue EXPLORATEUR (dossiers par service repliables) ──────────────────────

function ExplorerView({ templates, onEdit, onDelete, deleting }: ViewProps) {
  // Regroupement par service_name (clé '__none__' pour les sans-service)
  const groups = useMemo(() => {
    const map = new Map<string, DocumentTemplate[]>();
    for (const t of templates) {
      const key = t.service_name || '__none__';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    // Tri : services nommés en premier (alphabétique), général à la fin
    const entries = Array.from(map.entries()).sort(([a], [b]) => {
      if (a === '__none__') return 1;
      if (b === '__none__') return -1;
      return a.localeCompare(b);
    });
    return entries;
  }, [templates]);

  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    groups.forEach(([k]) => { init[k] = true; });
    return init;
  });

  const toggleFolder = (key: string) => {
    setOpenFolders((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-3">
      {groups.map(([service, docs]) => {
        const isOpen = openFolders[service] ?? true;
        const label = service === '__none__' ? 'Modèles généraux' : service;
        return (
          <div key={service} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {/* En-tête du dossier */}
            <button
              type="button"
              onClick={() => toggleFolder(service)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-blue-50"
            >
              {isOpen ? (
                <PiCaretDownBold className="h-3.5 w-3.5 flex-shrink-0 text-gray-500" />
              ) : (
                <PiCaretRightBold className="h-3.5 w-3.5 flex-shrink-0 text-gray-500" />
              )}
              <span className="text-2xl">
                {isOpen ? <PiFolderOpenDuotone className="text-amber-500" /> : <PiFolderDuotone className="text-amber-500" />}
              </span>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-900">{label}</div>
                <div className="text-xs text-gray-500">{docs.length} document{docs.length > 1 ? 's' : ''}</div>
              </div>
            </button>

            {/* Contenu du dossier */}
            {isOpen && (
              <ul className="divide-y divide-gray-100 border-t border-gray-100 bg-gray-50/40">
                {docs.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center gap-3 px-5 py-2.5 transition hover:bg-blue-50/30"
                  >
                    <PiFilePdfDuotone className="h-7 w-7 flex-shrink-0 text-red-600" />
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-gray-900">{t.name}</span>
                        <DocTypeBadge docType={(t as any).doc_type} />
                      </div>
                      {t.description && (
                        <div className="truncate text-xs text-gray-500">{t.description}</div>
                      )}
                      <div className="text-[10px] text-gray-400">{t.created_at} · {t.created_by}</div>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-1">
                      <Link
                        href={`/documents/editeur/${t.id}`}
                        className="rounded-lg border border-blue-300 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
                      >
                        Voir
                      </Link>
                      <Link
                        href={`/documents/test/${t.id}`}
                        className="rounded-lg border border-green-300 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-50"
                      >
                        Tester
                      </Link>
                      <button
                        onClick={() => onEdit(t)}
                        className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => onDelete(t.id, t.name)}
                        disabled={deleting === t.id}
                        className="rounded-lg border border-red-300 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {deleting === t.id ? '…' : 'Suppr.'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Badge nature (IRCC / FO) ────────────────────────────────────────────────

function DocTypeBadge({ docType }: { docType?: string }) {
  if (docType === 'fo') {
    return <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700" title="Provincial — MIFI">Provincial (MIFI)</span>;
  }
  return <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700" title="Fédéral — IRCC">Fédéral (IRCC)</span>;
}

function EditTemplateModal({
  template, onClose, onSaved,
}: { template: DocumentTemplate; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description ?? '');
  const [serviceName, setServiceName] = useState(template.service_name ?? '');
  const [targetLocation, setTargetLocation] = useState<'any' | 'in_canada' | 'outside_canada'>(
    (template.target_location as any) ?? 'any'
  );
  const [docType, setDocType] = useState<'ircc' | 'fo'>((template as any).doc_type ?? 'ircc');
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<ImmigrationServiceItem[]>([]);

  useEffect(() => {
    immigrationServicesService.list(true)
      .then(setServices)
      .catch(() => setServices([]));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Nom requis'); return; }
    try {
      setSaving(true);
      await documentService.updateTemplate(template.id, {
        name: name.trim(),
        description: description.trim() || null,
        service_name: serviceName || null,
        target_location: targetLocation,
        doc_type: docType,
      } as any);
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
            <label className="mb-1 block text-sm font-medium text-gray-700">Service d&apos;immigration / Type</label>
            <select
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">— Aucun (modèle général) —</option>
              <optgroup label="Services d'immigration">
                {services.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}{s.category ? ` (${s.category})` : ''}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Types généraux">
                <option value="Documents du cabinet">Documents du cabinet</option>
                <option value="Autre">Autre</option>
              </optgroup>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Les futurs dossiers pour le service correspondant ajouteront automatiquement ce document.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nature du document</label>
            <div className="grid gap-2 md:grid-cols-2">
              {([
                { value: 'ircc', label: 'Fédéral (IRCC)' },
                { value: 'fo', label: 'Provincial (MIFI)' },
              ] as const).map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm transition ${
                    docType === opt.value ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="edit_doc_type"
                    checked={docType === opt.value}
                    onChange={() => setDocType(opt.value)}
                    className="h-4 w-4"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Destinataire selon la localisation du client</label>
            <div className="grid gap-2">
              {([
                { value: 'any', label: 'Tous (Canada + hors Canada)' },
                { value: 'in_canada', label: 'Au Canada uniquement' },
                { value: 'outside_canada', label: 'Hors Canada uniquement' },
              ] as const).map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm transition ${
                    targetLocation === opt.value ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="edit_target_location"
                    checked={targetLocation === opt.value}
                    onChange={() => setTargetLocation(opt.value)}
                    className="h-4 w-4"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
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
