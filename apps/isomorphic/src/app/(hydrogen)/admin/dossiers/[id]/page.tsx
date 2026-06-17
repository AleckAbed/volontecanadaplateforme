'use client';

import { useEffect, useState, use, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
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
  PiNotePencilDuotone,
  PiArchiveDuotone,
  PiUploadDuotone,
  PiFloppyDiskDuotone,
  PiEyeDuotone,
  PiDownloadDuotone,
  PiXBold,
} from 'react-icons/pi';
import { apiService } from '@/services/api';
import { dossierDocumentsService } from '@/services/dossier-documents';
import { documentService, DocumentTemplate } from '@/services/documents';
import { dossierSupplementaryService, SupplementaryFile, ExportCatalog } from '@/services/dossier-supplementary';
import TourButton from '@/components/TourButton';

const XfaPdfViewer = dynamic(() => import('@/components/XfaPdfViewer'), { ssr: false });

const DOSSIER_DETAIL_TOUR_STEPS = [
  {
    element: '#tour-actions',
    popover: {
      title: '🎯 Actions principales',
      description: 'Depuis ici vous pouvez <strong>exporter les fichiers en ZIP</strong>, <strong>envoyer une invitation</strong> au client, ou <strong>modifier</strong> le dossier.',
    },
  },
  {
    element: '#tour-collab',
    popover: {
      title: '👤 Collaborateur assigné',
      description: 'Le collaborateur affecté à ce dossier. Vous pouvez <strong>suspendre temporairement son accès</strong> sans le retirer définitivement.',
    },
  },
  {
    element: '#tour-docs-ircc',
    popover: {
      title: '🇨🇦 Documents Fédéraux (IRCC)',
      description: 'Formulaires <strong>fédéraux</strong> d\'Immigration, Réfugiés et Citoyenneté Canada. Cliquez sur <strong>Aperçu</strong> pour les visualiser sans quitter la page.',
    },
  },
  {
    element: '#tour-docs-fo',
    popover: {
      title: '🏛 Documents Provinciaux (MIFI)',
      description: 'Formulaires <strong>provinciaux</strong> du Ministère de l\'Immigration, de la Francisation et de l\'Intégration (CSQ, etc.). Même fonctionnement que la section IRCC.',
    },
  },
  {
    element: '#tour-supp',
    popover: {
      title: '📎 Documents supplémentaires',
      description: 'Téléversez <strong>tout type de fichier</strong> (PDF, image, Word, Excel…). Le collaborateur pourra les consulter en lecture seule.',
    },
  },
  {
    element: '#tour-notes',
    popover: {
      title: '📝 Note du dossier',
      description: 'Modifiez la note <strong>directement ici</strong>, sans aller dans le menu Modifier. Pratique pour des annotations rapides.',
    },
  },
];

interface DossierDocSummary {
  id: number;
  document_template_id?: number | null;
  doc_type?: 'ircc' | 'fo';
  name: string;
  description?: string;
  status: 'in_progress' | 'completed';
  has_filled_pdf: boolean;
  last_saved_at?: string;
  completed_at?: string;
}
interface SupplementaryFileSummary {
  id: number;
  label: string;
  original_filename: string;
  mime_type?: string;
  size: number;
  created_at?: string;
}
interface ClientUploadSummary {
  id: number;
  label: string;
  original_filename: string;
  mime_type?: string;
  size: number;
  created_at?: string;
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
  uploads?: ClientUploadSummary[];
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
  collab_access_revoked?: boolean;
  client_id: number;
  family_member_id?: number;
  collaborator_id?: number | null;
  client?: { id: number; first_name: string; last_name: string; email: string; client_type: string };
  family_member?: { id: number; first_name: string; last_name: string; relationship: string };
  collaborator?: CollaboratorSummary;
  documents?: DossierDocSummary[];
  uploads?: DossierUploadSummary[];
  supplementary_files?: SupplementaryFileSummary[];
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
  const [addingDocType, setAddingDocType] = useState<'ircc' | 'fo'>('ircc');
  const [notesValue, setNotesValue] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [uploadingSupp, setUploadingSupp] = useState(false);
  const [suppLabel, setSuppLabel] = useState('');
  const suppFileRef = useRef<HTMLInputElement | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ id: number; name: string; filled: boolean } | null>(null);
  const [previewFullscreen, setPreviewFullscreen] = useState(false);

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

  // Initialise/sync l'input de notes avec la donnée actuelle
  useEffect(() => {
    if (dossier) setNotesValue(dossier.notes ?? '');
  }, [dossier?.id, dossier?.notes]);

  // #6 — Enregistrer notes inline
  const handleSaveNotes = async () => {
    if (!dossier) return;
    try {
      setSavingNotes(true);
      await dossierSupplementaryService.updateNotes(dossier.id, notesValue);
      setDossier({ ...dossier, notes: notesValue });
      toast.success('Note enregistrée');
    } catch (e: any) {
      toast.error(e.message || 'Échec de la sauvegarde');
    } finally {
      setSavingNotes(false);
    }
  };

  // #7 — Toggle révoquer l'accès du collaborateur
  const handleToggleCollabAccess = async (revoked: boolean) => {
    if (!dossier) return;
    const previous = dossier.collab_access_revoked ?? false;
    setDossier({ ...dossier, collab_access_revoked: revoked });
    try {
      await dossierSupplementaryService.toggleCollabAccess(dossier.id, revoked);
      toast.success(revoked ? 'Accès collaborateur suspendu' : 'Accès collaborateur restauré');
    } catch (e: any) {
      setDossier({ ...dossier, collab_access_revoked: previous });
      toast.error(e.message || 'Mise à jour impossible');
    }
  };

  // #4 — Upload fichier supplémentaire
  const handleSuppUpload = async (file: File) => {
    if (!dossier) return;
    if (!suppLabel.trim()) { toast.error('Donnez un libellé au fichier'); return; }
    try {
      setUploadingSupp(true);
      await dossierSupplementaryService.upload(dossier.id, file, suppLabel.trim());
      setSuppLabel('');
      if (suppFileRef.current) suppFileRef.current.value = '';
      toast.success('Fichier ajouté');
      await reload();
    } catch (e: any) {
      toast.error(e.message || 'Échec du téléversement');
    } finally {
      setUploadingSupp(false);
    }
  };

  const handleDeleteSupp = async (fileId: number, label: string) => {
    if (!confirm(`Supprimer le fichier "${label}" ?`)) return;
    try {
      await dossierSupplementaryService.remove(fileId);
      toast.success('Fichier supprimé');
      await reload();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

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
        <div id="tour-actions" className="flex flex-wrap items-center gap-2">
          <TourButton steps={DOSSIER_DETAIL_TOUR_STEPS} storageKey="tour-dossier-detail-seen" />
          <button
            onClick={() => setExportOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-purple-300 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-100"
          >
            <PiArchiveDuotone className="h-4 w-4" /> Exporter en ZIP
          </button>
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

      </div>

      {/* Collaborateur assigné — avec toggle révoquer */}
      <div id="tour-collab" className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Collaborateur assigné</h2>
        {dossier.collaborator ? (
          <>
            <div className={`flex items-center gap-3 rounded-lg border p-3 ${
              dossier.collab_access_revoked ? 'border-red-200 bg-red-50/40' : 'border-gray-100 bg-gray-50'
            }`}>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                {dossier.collaborator.first_name?.[0]}{dossier.collaborator.last_name?.[0]}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  {dossier.collaborator.first_name} {dossier.collaborator.last_name}
                </div>
                <div className="text-xs text-gray-500">{dossier.collaborator.email}</div>
              </div>
              {dossier.collab_access_revoked ? (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                  ⛔ Accès suspendu
                </span>
              ) : dossier.allow_collab_uploads ? (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  Uploads autorisés
                </span>
              ) : null}
            </div>
            <label className="mt-4 flex cursor-pointer items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/40 p-3 text-sm">
              <input
                type="checkbox"
                checked={!!dossier.collab_access_revoked}
                onChange={(e) => handleToggleCollabAccess(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                <span className="font-medium text-gray-900">Désactiver l&apos;accès du collaborateur</span>
                <span className="ml-1 text-xs text-gray-600">
                  — il ne pourra plus voir ce dossier ni le modifier, mais reste assigné. Pour le retirer complètement, passez par « Modifier ».
                </span>
              </span>
            </label>
          </>
        ) : (
          <p className="text-sm text-gray-500">
            Aucun collaborateur assigné.{' '}
            <Link href={`/admin/dossiers/${dossier.id}/edit`} className="text-blue-600 hover:underline">
              Assigner depuis l&apos;édition
            </Link>
          </p>
        )}
      </div>

      {/* Toggle d'envoi des documents IRCC/FO au client */}
      <label className="mt-6 flex items-start gap-2 rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700 shadow-sm">
        <input
          type="checkbox"
          checked={!!dossier.send_base_docs_to_client}
          onChange={(e) => handleToggleSendBaseDocs(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          <span className="font-medium text-gray-900">Envoyer les documents Fédéraux (IRCC) / Provinciaux (MIFI) au client</span>
          <span className="ml-1 text-xs text-gray-500">
            — si coché, ces documents seront pré-sélectionnés (modifiables) lors d&apos;une nouvelle invitation pour ce dossier.
          </span>
        </span>
      </label>

      {/* Sections documents — split FO + IRCC */}
      <DocSection
        sectionId="tour-docs-ircc"
        title="Documents Fédéraux (IRCC)"
        accent="indigo"
        icon="🇨🇦"
        docs={(dossier.documents ?? []).filter((d) => (d.doc_type ?? 'ircc') === 'ircc')}
        onAdd={() => { setAddingDocType('ircc'); setAddingDoc(true); }}
        onDelete={handleDeleteDoc}
        onPreview={(d) => setPreviewDoc({ id: d.id, name: d.name, filled: d.has_filled_pdf })}
      />
      <DocSection
        sectionId="tour-docs-fo"
        title="Documents provinciaux (MIFI)"
        accent="violet"
        icon="🏛"
        docs={(dossier.documents ?? []).filter((d) => d.doc_type === 'fo')}
        onAdd={() => { setAddingDocType('fo'); setAddingDoc(true); }}
        onDelete={handleDeleteDoc}
        onPreview={(d) => setPreviewDoc({ id: d.id, name: d.name, filled: d.has_filled_pdf })}
      />

      {/* Documents supplémentaires (admin upload tout type, preview/téléchargement) */}
      <SupplementarySection
        sectionId="tour-supp"
        files={dossier.supplementary_files ?? []}
        suppLabel={suppLabel}
        setSuppLabel={setSuppLabel}
        uploading={uploadingSupp}
        onUpload={handleSuppUpload}
        onDelete={handleDeleteSupp}
        fileInputRef={suppFileRef}
      />

      {/* Notes inline éditable */}
      <NotesEditor
        sectionId="tour-notes"
        value={notesValue}
        onChange={setNotesValue}
        onSave={handleSaveNotes}
        saving={savingNotes}
        currentValue={dossier.notes ?? ''}
      />

      {addingDoc && (
        <AddBaseDocumentModal
          dossierId={dossier.id}
          docType={addingDocType}
          attachedTemplateIds={(dossier.documents ?? [])
            .map((d) => d.document_template_id)
            .filter((x): x is number => typeof x === 'number')}
          onClose={() => setAddingDoc(false)}
          onAdded={async () => { setAddingDoc(false); await reload(); }}
        />
      )}

      {exportOpen && (
        <ExportZipModal
          dossierId={dossier.id}
          dossierName={dossier.name}
          onClose={() => setExportOpen(false)}
        />
      )}

      {previewDoc && (
        <PdfPreviewModal
          docId={previewDoc.id}
          docName={previewDoc.name}
          showFilled={previewDoc.filled}
          fullscreen={previewFullscreen}
          onToggleFullscreen={() => setPreviewFullscreen((v) => !v)}
          onClose={() => { setPreviewDoc(null); setPreviewFullscreen(false); }}
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
  dossierId, docType, attachedTemplateIds, onClose, onAdded,
}: {
  dossierId: number;
  docType: 'ircc' | 'fo';
  attachedTemplateIds: number[];
  onClose: () => void;
  onAdded: () => void;
}) {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const attachedSet = new Set(attachedTemplateIds);
  // Filtre par doc_type + exclusion des déjà rattachés
  const availableTemplates = templates.filter((tp) =>
    !attachedSet.has(tp.id) && ((tp as any).doc_type ?? 'ircc') === docType
  );
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
          docType,
        );
      } else {
        if (!name.trim()) { toast.error('Nom requis'); return; }
        if (!file) { toast.error('Choisissez un PDF'); return; }
        await dossierDocumentsService.create(dossierId, name.trim(), file, description.trim() || undefined, docType);
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
          <h3 className="text-lg font-semibold text-gray-900">Ajouter un document d&apos;immigration IRCC</h3>
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

// ─── Modal de preview PDF ────────────────────────────────────────────────────

function PdfPreviewModal({
  docId, docName, showFilled, fullscreen, onToggleFullscreen, onClose,
}: {
  docId: number;
  docName: string;
  showFilled: boolean;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  onClose: () => void;
}) {
  const [pdfPromise] = useState<Promise<ArrayBuffer>>(() => {
    const url = showFilled
      ? dossierDocumentsService.getFilledUrl(docId)
      : dossierDocumentsService.getTemplateUrl(docId);
    return fetch(url, { credentials: 'include' }).then((r) => {
      if (!r.ok) throw new Error('PDF indisponible');
      return r.arrayBuffer();
    });
  });

  return (
    <div
      className={`fixed inset-0 z-[9999] flex bg-black/50 ${
        fullscreen ? 'p-0 items-stretch justify-stretch' : 'items-center justify-center p-4'
      }`}
    >
      <div
        className={`flex flex-col overflow-hidden bg-white ${
          fullscreen ? 'h-screen w-screen rounded-none' : 'h-[90vh] w-full max-w-5xl rounded-xl'
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <PiEyeDuotone className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">{docName}</h3>
            {showFilled && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                Version remplie
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleFullscreen}
              className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              {fullscreen ? 'Réduire' : 'Plein écran'}
            </button>
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Fermer ✕
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <XfaPdfViewer
            filePromise={pdfPromise}
            fileName={`${docName}.pdf`}
            readOnly={true}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Section documents (réutilisable pour IRCC et FO) ───────────────────────

const ACCENT_STYLES = {
  indigo: { bg: 'bg-indigo-50/40', border: 'border-indigo-200', title: 'text-indigo-800', pill: 'bg-indigo-100 text-indigo-700' },
  violet: { bg: 'bg-violet-50/40', border: 'border-violet-200', title: 'text-violet-800', pill: 'bg-violet-100 text-violet-700' },
} as const;

function DocSection({
  sectionId, title, accent, icon, docs, onAdd, onDelete, onPreview,
}: {
  sectionId?: string;
  title: string;
  accent: keyof typeof ACCENT_STYLES;
  icon: string;
  docs: DossierDocSummary[];
  onAdd: () => void;
  onDelete: (id: number, name: string) => void;
  onPreview: (d: DossierDocSummary) => void;
}) {
  const s = ACCENT_STYLES[accent];
  return (
    <div id={sectionId} className={`mt-6 rounded-xl border-2 ${s.border} ${s.bg} p-6 shadow-sm`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className={`text-lg font-semibold ${s.title}`}>
          <span className="mr-2">{icon}</span>
          {title}{' '}
          <span className="text-sm font-normal text-gray-500">({docs.length})</span>
        </h2>
        <button
          onClick={onAdd}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + Ajouter
        </button>
      </div>

      {docs.length === 0 ? (
        <p className="text-sm text-gray-500">Aucun document dans cette catégorie.</p>
      ) : (
        <ul className="space-y-2">
          {docs.map((d) => (
            <li
              key={d.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 hover:bg-gray-50"
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
              <button
                onClick={() => onPreview(d)}
                className="inline-flex items-center gap-1 rounded-lg border border-blue-300 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
                title={d.has_filled_pdf ? 'Voir la version remplie par le collaborateur' : 'Voir le PDF template'}
              >
                <PiEyeDuotone className="h-3.5 w-3.5" />
                {d.has_filled_pdf ? 'Aperçu rempli' : 'Aperçu'}
              </button>
              {d.has_filled_pdf && (
                <a
                  href={dossierDocumentsService.getTemplateUrl(d.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-gray-300 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                  title="Voir le PDF template vide"
                >
                  Template
                </a>
              )}
              <button
                onClick={() => onDelete(d.id, d.name)}
                className="rounded-lg border border-red-300 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Section fichiers supplémentaires (tout type) ───────────────────────────

function SupplementarySection({
  sectionId, files, suppLabel, setSuppLabel, uploading, onUpload, onDelete, fileInputRef,
}: {
  sectionId?: string;
  files: SupplementaryFileSummary[];
  suppLabel: string;
  setSuppLabel: (s: string) => void;
  uploading: boolean;
  onUpload: (file: File) => void;
  onDelete: (id: number, label: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const isPreviewable = (mime?: string) => {
    if (!mime) return false;
    return mime === 'application/pdf' || mime.startsWith('image/');
  };

  return (
    <div id={sectionId} className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-1 text-lg font-semibold text-gray-900">
        <span className="mr-2">📎</span>
        Documents supplémentaires{' '}
        <span className="text-sm font-normal text-gray-500">({files.length})</span>
      </h2>
      <p className="mb-4 text-xs text-gray-500">
        Tout type de fichier accepté (PDF, image, Word, Excel…). Le collaborateur peut prévisualiser ou télécharger en lecture seule.
      </p>

      {files.length > 0 && (
        <ul className="mb-4 space-y-2">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3"
            >
              <span className="text-xl">📄</span>
              <div className="flex-1 overflow-hidden">
                <div className="truncate font-medium text-gray-900">{f.label}</div>
                <div className="truncate text-xs text-gray-500">
                  {f.original_filename} · {formatBytes(f.size)}
                  {f.created_at ? ` · ${f.created_at}` : ''}
                </div>
              </div>
              {isPreviewable(f.mime_type) && (
                <a
                  href={dossierSupplementaryService.getFileUrl(f.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-blue-300 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
                >
                  <PiEyeDuotone className="h-3.5 w-3.5" /> Prévisualiser
                </a>
              )}
              <a
                href={dossierSupplementaryService.getFileUrl(f.id, true)}
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
              >
                <PiDownloadDuotone className="h-3.5 w-3.5" /> Télécharger
              </a>
              <button
                onClick={() => onDelete(f.id, f.label)}
                className="rounded-lg border border-red-300 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-3 rounded-lg border border-dashed border-gray-300 p-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Libellé du fichier</label>
          <input
            type="text"
            value={suppLabel}
            onChange={(e) => setSuppLabel(e.target.value)}
            placeholder="Ex. Preuve de paiement, contrat signé…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Fichier (tout type, max 50 Mo)</label>
          <input
            ref={fileInputRef}
            type="file"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }}
            disabled={uploading || !suppLabel.trim()}
            className="w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
          />
          {!suppLabel.trim() && (
            <p className="mt-1 text-xs text-amber-600">Saisissez d&apos;abord un libellé.</p>
          )}
          {uploading && <p className="mt-1 text-xs text-gray-500">Téléversement en cours…</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Éditeur de notes inline ────────────────────────────────────────────────

function NotesEditor({
  sectionId, value, onChange, onSave, saving, currentValue,
}: {
  sectionId?: string;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  saving: boolean;
  currentValue: string;
}) {
  const dirty = value !== currentValue;
  return (
    <div id={sectionId} className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <PiNotePencilDuotone className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Note du dossier</h2>
        {dirty && <span className="ml-auto text-xs text-amber-600">● Modifications non sauvegardées</span>}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder="Ajoutez ici une note interne sur l'état du dossier, les particularités, etc."
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      />
      <div className="mt-3 flex justify-end gap-2">
        {dirty && (
          <button
            type="button"
            onClick={() => onChange(currentValue)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Annuler
          </button>
        )}
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !dirty}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <PiFloppyDiskDuotone className="h-4 w-4" />
          {saving ? 'Enregistrement…' : 'Enregistrer la note'}
        </button>
      </div>
    </div>
  );
}

// ─── Modal d'export ZIP ─────────────────────────────────────────────────────

function ExportZipModal({
  dossierId, dossierName, onClose,
}: { dossierId: number; dossierName: string; onClose: () => void }) {
  const [catalog, setCatalog] = useState<ExportCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set()); // keys "kind:id" + ":filled"
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    dossierSupplementaryService.exportCatalog(dossierId)
      .then(setCatalog)
      .catch((e: any) => toast.error(e.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  }, [dossierId]);

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleExport = async () => {
    if (selected.size === 0) { toast.error('Sélectionnez au moins un fichier'); return; }
    try {
      setExporting(true);
      const items = Array.from(selected).map((k) => {
        const [kind, id, filled] = k.split(':');
        return { kind, id: Number(id), filled: filled === 'filled' };
      });
      const blob = await dossierSupplementaryService.exportZip(dossierId, items);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dossier-${dossierName.replace(/[^a-z0-9-]+/gi, '_')}-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Export téléchargé');
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Export impossible');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-4 text-white">
          <div className="flex items-center gap-2">
            <PiArchiveDuotone className="h-5 w-5" />
            <h3 className="text-lg font-bold">Exporter en ZIP</h3>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-white/80 hover:bg-white/20">
            <PiXBold className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <p className="text-center text-sm text-gray-500">Chargement du catalogue…</p>
          ) : !catalog ? (
            <p className="text-center text-sm text-red-500">Catalogue indisponible</p>
          ) : (
            <div className="space-y-5">
              {/* IRCC */}
              <CatalogGroup
                title="🇨🇦 Documents Fédéraux (IRCC)"
                items={catalog.ircc}
                kind="ircc"
                selected={selected}
                onToggle={toggle}
              />
              {/* FO/MIFI */}
              <CatalogGroup
                title="🏛 Documents Provinciaux (MIFI)"
                items={catalog.fo}
                kind="fo"
                selected={selected}
                onToggle={toggle}
              />
              {/* Supplémentaires */}
              <CatalogGroup
                title="📎 Documents supplémentaires"
                items={catalog.supplementary}
                kind="supplementary"
                selected={selected}
                onToggle={toggle}
              />
              {/* Uploads client */}
              <CatalogGroup
                title="📤 Fichiers téléversés par le client"
                items={catalog.client_uploads}
                kind="client_upload"
                selected={selected}
                onToggle={toggle}
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-5 py-4">
          <span className="text-sm text-gray-600">
            {selected.size} fichier{selected.size > 1 ? 's' : ''} sélectionné{selected.size > 1 ? 's' : ''}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting || selected.size === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg disabled:opacity-50"
            >
              <PiArchiveDuotone className="h-4 w-4" />
              {exporting ? 'Création du ZIP…' : 'Télécharger le ZIP'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CatalogGroup({
  title, items, kind, selected, onToggle,
}: {
  title: string;
  items: Array<{ id: number; name: string; filename?: string; size?: number; has_filled?: boolean; status?: string }>;
  kind: 'ircc' | 'fo' | 'supplementary' | 'client_upload';
  selected: Set<string>;
  onToggle: (key: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <h4 className="mb-1 text-sm font-semibold text-gray-700">{title}</h4>
        <p className="text-xs text-gray-400">Aucun fichier dans cette catégorie.</p>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <h4 className="mb-2 text-sm font-semibold text-gray-700">{title}</h4>
      <ul className="space-y-1.5">
        {items.map((it) => {
          const baseKey = `${kind}:${it.id}`;
          const isDoc = kind === 'ircc' || kind === 'fo';
          const templateKey = isDoc ? `${baseKey}:template` : baseKey;
          const filledKey = isDoc ? `${baseKey}:filled` : '';
          return (
            <li key={baseKey} className="space-y-1 rounded-md border border-gray-100 bg-white p-2.5">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.has(templateKey)}
                  onChange={() => onToggle(templateKey)}
                  className="h-4 w-4"
                />
                <span className="flex-1">
                  {it.name}
                  {it.filename && <span className="ml-1 text-xs text-gray-500">({it.filename})</span>}
                </span>
              </label>
              {isDoc && it.has_filled && (
                <label className="ml-6 flex cursor-pointer items-center gap-2 text-xs text-emerald-700">
                  <input
                    type="checkbox"
                    checked={selected.has(filledKey)}
                    onChange={() => onToggle(filledKey)}
                    className="h-3.5 w-3.5"
                  />
                  <span>📝 Version remplie</span>
                </label>
              )}
            </li>
          );
        })}
      </ul>
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
