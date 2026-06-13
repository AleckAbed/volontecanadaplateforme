'use client';

import { useEffect, useState, use, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Badge } from 'rizzui';
import {
  PiArrowLeftBold,
  PiPencilDuotone,
  PiTrashDuotone,
  PiFolderOpenDuotone,
  PiCalendarDuotone,
  PiBriefcaseDuotone,
  PiUserDuotone,
  PiUsersThreeDuotone,
  PiPaperPlaneTiltDuotone,
} from 'react-icons/pi';
import { apiService } from '@/services/api';
import { dossierDocumentsService } from '@/services/dossier-documents';
import { documentService, DocumentTemplate } from '@/services/documents';

interface DossierDocSummary {
  id: number;
  document_template_id?: number | null;
  name: string;
  description?: string;
  status: 'in_progress' | 'completed';
  has_filled_pdf: boolean;
  last_saved_at?: string;
  completed_at?: string;
}
interface DossierUploadSummary {
  id: number;
  label: string;
  original_filename: string;
  mime_type?: string;
  size: number;
  created_at?: string;
}
interface DossierInvitationSummary {
  id: number;
  email: string;
  status: string;
  sent_at?: string;
  expires_at?: string;
  completed_at?: string;
  unique_code?: string;
}
interface CollaboratorSummary {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface DossierDetail {
  id: number;
  name: string;
  service_name?: string;
  scope: 'client' | 'member' | 'family';
  status: string;
  opened_at?: string;
  deadline_at?: string;
  notes?: string;
  allow_collab_uploads?: boolean;
  send_base_docs_to_client?: boolean;
  client_id: number;
  family_member_id?: number;
  collaborator_id?: number | null;
  client?: { id: number; first_name: string; last_name: string; email: string; client_type: string };
  family_member?: { id: number; first_name: string; last_name: string; relationship: string };
  collaborator?: CollaboratorSummary;
  documents?: DossierDocSummary[];
  uploads?: DossierUploadSummary[];
  invitations?: DossierInvitationSummary[];
  created_at?: string;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} Ko`;
  return `${(n / (1024 * 1024)).toFixed(1)} Mo`;
}

const STATUS_COLOR: Record<string, 'warning' | 'info' | 'success' | 'danger' | 'secondary'> = {
  en_cours: 'info',
  soumis: 'warning',
  accorde: 'success',
  refuse: 'danger',
  rejete: 'danger',
  annule: 'secondary',
};

export default function DossierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useTranslation();
  const { id } = use(params);
  const router = useRouter();
  const [dossier, setDossier] = useState<DossierDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingDoc, setAddingDoc] = useState(false);

  const reload = async () => {
    try {
      const res = await apiService.getDossier(id);
      if (res?.success && res.data) setDossier(res.data as any);
      else toast.error(res?.message || t('dossiers.not_found'));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  useEffect(() => {
    (async () => {
      await reload();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleToggleSendBaseDocs = async (next: boolean) => {
    if (!dossier) return;
    // Optimistic UI : on bascule tout de suite, on revert si l'API échoue.
    const previous = dossier.send_base_docs_to_client ?? false;
    setDossier({ ...dossier, send_base_docs_to_client: next });
    try {
      await apiService.updateDossier(dossier.id, { send_base_docs_to_client: next });
      toast.success(next ? 'Envoi automatique activé' : 'Envoi automatique désactivé');
    } catch (e: any) {
      setDossier({ ...dossier, send_base_docs_to_client: previous });
      toast.error(e.message || 'Mise à jour impossible');
    }
  };

  const handleDeleteDoc = async (docId: number, name: string) => {
    if (!confirm(`Supprimer "${name}" du dossier ? Le PDF du dossier sera supprimé (les données saisies aussi).`)) return;
    try {
      await dossierDocumentsService.remove(docId);
      toast.success('Document supprimé');
      await reload();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async () => {
    if (!dossier) return;
    if (!confirm(t('dossiers.delete_confirm', { name: dossier.name }))) return;
    try {
      await apiService.deleteDossier(dossier.id);
      toast.success(t('dossiers.deleted'));
      router.push('/admin/dossiers');
    } catch (e: any) {
      toast.error(e.message || t('dossiers.delete_error'));
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-400">{t('common.loading')}</div>;
  if (!dossier) return <div className="p-6 text-center text-red-500">{t('dossiers.not_found')}</div>;

  const color = STATUS_COLOR[dossier.status] || 'info';
  const clientName = dossier.client ? `${dossier.client.first_name} ${dossier.client.last_name}` : '—';
  const memberName = dossier.family_member ? `${dossier.family_member.first_name} ${dossier.family_member.last_name}` : null;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <button onClick={() => router.push('/admin/dossiers')} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
          <PiArrowLeftBold className="h-4 w-4" /> {t('dossiers.back_to_list')}
        </button>
        <div className="flex items-center gap-2">
          <Link
            href={`/envois/nouveau?client_id=${dossier.client_id}&dossier_id=${dossier.id}`}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
          >
            <PiPaperPlaneTiltDuotone className="h-4 w-4" /> Nouvelle invitation
          </Link>
          <Link href={`/admin/dossiers/${dossier.id}/edit`} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            <PiPencilDuotone className="h-4 w-4" /> {t('common.edit')}
          </Link>
          <button onClick={handleDelete} className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
            <PiTrashDuotone className="h-4 w-4" /> {t('common.delete')}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <PiFolderOpenDuotone className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{dossier.name}</h1>
              <Badge variant="flat" color={color} rounded="lg">{t(`dossiers.status.${dossier.status}`, { defaultValue: dossier.status })}</Badge>
            </div>
            {dossier.service_name && (
              <p className="mt-1 text-sm font-medium text-blue-700">
                <PiBriefcaseDuotone className="mr-1 inline h-4 w-4" />
                {dossier.service_name}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {t(`dossiers.scope_label.${dossier.scope}`, { defaultValue: dossier.scope })}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <InfoCard
            icon={<PiUserDuotone className="h-5 w-5" />}
            label={dossier.scope === 'family' || dossier.scope === 'member' ? t('dossiers.step_client_main').replace(/^2\.\s*/, '') : t('dossiers.step_client').replace(/^2\.\s*/, '')}
            value={
              <Link href={`/admin/clients/${dossier.client_id}`} className="font-medium text-gray-900 hover:text-blue-700">
                {clientName}
              </Link>
            }
            sub={dossier.client?.email}
          />
          {memberName && (
            <InfoCard
              icon={<PiUsersThreeDuotone className="h-5 w-5" />}
              label={t('dossiers.member_concerned')}
              value={memberName}
              sub={dossier.family_member ? t(`clients.relationship.${dossier.family_member.relationship}`, { defaultValue: dossier.family_member.relationship }) : undefined}
            />
          )}
          <InfoCard
            icon={<PiCalendarDuotone className="h-5 w-5" />}
            label={t('dossiers.columns.opened_at')}
            value={dossier.opened_at ?? '—'}
            sub={dossier.deadline_at ? t('dossiers.deadline_short', { date: dossier.deadline_at }) : undefined}
          />
        </div>

        {dossier.notes && (
          <div className="mt-6 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
            <div className="text-xs font-semibold uppercase text-blue-700">{t('dossiers.notes_label')}</div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{dossier.notes}</p>
          </div>
        )}
      </div>

      {/* Collaborateur assigné */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Collaborateur assigné</h2>
        {dossier.collaborator ? (
          <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
              {dossier.collaborator.first_name?.[0]}{dossier.collaborator.last_name?.[0]}
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">
                {dossier.collaborator.first_name} {dossier.collaborator.last_name}
              </div>
              <div className="text-xs text-gray-500">{dossier.collaborator.email}</div>
            </div>
            {dossier.allow_collab_uploads && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                Uploads autorisés
              </span>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Aucun collaborateur assigné.{' '}
            <Link href={`/admin/dossiers/${dossier.id}/edit`} className="text-blue-600 hover:underline">
              Assigner depuis l&apos;édition
            </Link>
          </p>
        )}
      </div>

      {/* Documents de base */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Documents de base{' '}
            <span className="text-sm font-normal text-gray-500">({dossier.documents?.length ?? 0})</span>
          </h2>
          <button
            onClick={() => setAddingDoc(true)}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Ajouter un document
          </button>
        </div>

        <label className="mb-4 flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={!!dossier.send_base_docs_to_client}
            onChange={(e) => handleToggleSendBaseDocs(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            <span className="font-medium text-gray-900">Envoyer les documents de base au client</span>
            <span className="ml-1 text-xs text-gray-500">
              — si coché, ces documents seront pré-sélectionnés (modifiables) lors d&apos;une nouvelle invitation pour ce dossier.
            </span>
          </span>
        </label>
        {(dossier.documents?.length ?? 0) === 0 ? (
          <p className="text-sm text-gray-500">Aucun document de base pour ce dossier.</p>
        ) : (
          <ul className="space-y-2">
            {dossier.documents!.map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
              >
                <span className="text-xl">📄</span>
                <div className="flex-1 overflow-hidden">
                  <div className="truncate font-medium text-gray-900">{d.name}</div>
                  {d.description && <div className="truncate text-xs text-gray-500">{d.description}</div>}
                  {d.last_saved_at && (
                    <div className="mt-0.5 text-xs text-gray-400">Sauvegardé le {d.last_saved_at}</div>
                  )}
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  d.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-800'
                }`}>
                  {d.status === 'completed' ? '✓ Terminé' : '◐ En cours'}
                </span>
                <a
                  href={dossierDocumentsService.getTemplateUrl(d.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-blue-300 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
                >
                  Template
                </a>
                {d.has_filled_pdf && (
                  <a
                    href={dossierDocumentsService.getFilledUrl(d.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-green-300 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50"
                  >
                    Voir rempli
                  </a>
                )}
                <button
                  onClick={() => handleDeleteDoc(d.id, d.name)}
                  className="rounded-lg border border-red-300 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {addingDoc && (
        <AddBaseDocumentModal
          dossierId={dossier.id}
          attachedTemplateIds={(dossier.documents ?? [])
            .map((d) => d.document_template_id)
            .filter((x): x is number => typeof x === 'number')}
          onClose={() => setAddingDoc(false)}
          onAdded={async () => { setAddingDoc(false); await reload(); }}
        />
      )}

      {/* Fichiers complémentaires du collaborateur */}
      {(dossier.uploads?.length ?? 0) > 0 && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Fichiers complémentaires{' '}
            <span className="text-sm font-normal text-gray-500">({dossier.uploads!.length})</span>
          </h2>
          <ul className="space-y-2">
            {dossier.uploads!.map((u) => (
              <li
                key={u.id}
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
              >
                <span className="text-xl">📎</span>
                <div className="flex-1 overflow-hidden">
                  <div className="truncate font-medium text-gray-900">{u.label}</div>
                  <div className="truncate text-xs text-gray-500">
                    {u.original_filename} · {formatBytes(u.size)}
                    {u.created_at ? ` · ${u.created_at}` : ''}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Invitations liées */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Invitations envoyées au client{' '}
            <span className="text-sm font-normal text-gray-500">({dossier.invitations?.length ?? 0})</span>
          </h2>
          <Link
            href={`/envois/nouveau?client_id=${dossier.client_id}&dossier_id=${dossier.id}`}
            className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700"
          >
            + Nouvelle invitation
          </Link>
        </div>
        {(dossier.invitations?.length ?? 0) === 0 ? (
          <p className="text-sm text-gray-500">Aucune invitation envoyée pour ce dossier.</p>
        ) : (
          <ul className="space-y-2">
            {dossier.invitations!.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
              >
                <span className="text-xl">📨</span>
                <div className="flex-1 overflow-hidden">
                  <div className="truncate font-medium text-gray-900">{inv.email}</div>
                  <div className="text-xs text-gray-500">
                    Envoyée le {inv.sent_at || '—'}
                    {inv.expires_at ? ` · Expire le ${inv.expires_at}` : ''}
                  </div>
                </div>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                  {inv.status}
                </span>
                <Link
                  href={`/envois/${inv.id}`}
                  className="rounded-lg border border-blue-300 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
                >
                  Détails
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function AddBaseDocumentModal({
  dossierId, attachedTemplateIds, onClose, onAdded,
}: {
  dossierId: number;
  attachedTemplateIds: number[];
  onClose: () => void;
  onAdded: () => void;
}) {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const attachedSet = new Set(attachedTemplateIds);
  const availableTemplates = templates.filter((tp) => !attachedSet.has(tp.id));
  const [mode, setMode] = useState<'template' | 'upload'>('template');
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | ''>('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    documentService.getTemplates()
      .then(setTemplates)
      .catch(() => setTemplates([]))
      .finally(() => setLoadingTemplates(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (mode === 'template') {
        if (!selectedTemplateId) { toast.error('Choisissez un modèle'); return; }
        await dossierDocumentsService.createFromTemplate(
          dossierId,
          Number(selectedTemplateId),
          name.trim() || undefined,
          description.trim() || undefined,
        );
      } else {
        if (!name.trim()) { toast.error('Nom requis'); return; }
        if (!file) { toast.error('Choisissez un PDF'); return; }
        await dossierDocumentsService.create(dossierId, name.trim(), file, description.trim() || undefined);
      }
      toast.success('Document ajouté');
      onAdded();
    } catch (e: any) {
      toast.error(e.message || 'Échec');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Ajouter un document de base</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => setMode('template')}
              className={`flex-1 rounded-lg border px-3 py-2 font-medium ${
                mode === 'template' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'
              }`}
            >
              Depuis la bibliothèque
            </button>
            <button
              type="button"
              onClick={() => setMode('upload')}
              className={`flex-1 rounded-lg border px-3 py-2 font-medium ${
                mode === 'upload' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'
              }`}
            >
              Téléverser un PDF
            </button>
          </div>

          {mode === 'template' ? (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Modèle de document</label>
                {loadingTemplates ? (
                  <p className="text-sm text-gray-400">Chargement…</p>
                ) : templates.length === 0 ? (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    Aucun modèle disponible. Créez-en un dans Modèles documents.
                  </p>
                ) : availableTemplates.length === 0 ? (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    Tous les modèles existants sont déjà rattachés à ce dossier. Utilisez l&apos;onglet « Téléverser un PDF » pour un document spécifique.
                  </p>
                ) : (
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="">— Choisir un modèle —</option>
                    {availableTemplates.map((tp) => (
                      <option key={tp.id} value={tp.id}>
                        {tp.name}{tp.service_name ? ` — ${tp.service_name}` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Nom personnalisé (optionnel)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sinon, le nom du modèle est utilisé"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Nom du document *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Fichier PDF *</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description (optionnel)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
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
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Ajout…' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InfoCard({
  icon, label, value, sub,
}: { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-1.5 text-xs uppercase text-gray-500">
        <span className="text-gray-400">{icon}</span>
        {label}
      </div>
      <div className="mt-1 font-medium text-gray-900">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-gray-500">{sub}</div>}
    </div>
  );
}
