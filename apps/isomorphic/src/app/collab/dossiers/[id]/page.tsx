'use client';

import { useEffect, useRef, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { collabWorkspaceService, CollabDossierDetail, CollabUpload } from '@/services/collaborators';
import CollabHeader from '../../_components/collab-header';

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

function formatBytes(n: number): string {
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} Ko`;
  return `${(n / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function CollabDossierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<CollabDossierDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      setData(await collabWorkspaceService.getDossier(Number(id)));
    } catch (e: any) {
      toast.error(e.message || 'Erreur');
      router.replace('/collab/dossiers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleMarkComplete = async (docId: number) => {
    if (!confirm('Marquer ce document comme terminé ?')) return;
    try {
      await collabWorkspaceService.markDocumentComplete(docId);
      toast.success('Document marqué terminé');
      await load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (loading) return (<><CollabHeader /><div className="p-10 text-center text-gray-400">Chargement…</div></>);
  if (!data) return null;

  return (
    <>
      <CollabHeader />
      <main className="mx-auto max-w-5xl p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{data.name}</h1>
          {data.client && (
            <p className="mt-1 text-sm text-gray-500">Client : <strong>{data.client.name}</strong> · {data.client.email}</p>
          )}
          {data.family_member && (
            <p className="mt-1 text-sm text-purple-700">Membre concerné : {data.family_member.name} ({data.family_member.relationship})</p>
          )}
          {data.service_name && <p className="mt-1 text-sm text-gray-500">Service : {data.service_name}</p>}
          {data.deadline_at && <p className="mt-1 text-xs text-gray-500">📅 Échéance : {data.deadline_at}</p>}
          {data.notes && (
            <div className="mt-3 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-3 text-sm text-gray-700">{data.notes}</div>
          )}
        </div>

        {/* Documents de base (éditables) */}
        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-2xl">📋</span>
            <h2 className="text-lg font-semibold text-gray-900">Documents de base à remplir</h2>
          </div>
          <p className="mb-4 text-sm text-gray-500">
            Documents internes au cabinet. Cliquez pour remplir et marquez comme terminé une fois complétés.
          </p>

          {data.documents.length === 0 ? (
            <div className="rounded-lg bg-gray-50 p-6 text-center text-sm text-gray-500">
              Aucun document de base pour ce dossier.
            </div>
          ) : (
            <ul className="space-y-2">
              {data.documents.map((d) => (
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
                  <button
                    onClick={() => router.push(`/collab/documents/${d.id}/fill`)}
                    className="rounded-lg border border-blue-600 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                  >
                    {d.status === 'completed' ? 'Modifier' : 'Remplir'}
                  </button>
                  {d.status === 'in_progress' && d.has_filled_pdf && (
                    <button
                      onClick={() => handleMarkComplete(d.id)}
                      className="rounded-lg bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700"
                    >
                      Marquer terminé
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Invitations envoyées au client (read-only) */}
        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-2xl">📨</span>
            <h2 className="text-lg font-semibold text-gray-900">Invitations envoyées au client</h2>
          </div>
          <p className="mb-4 text-sm text-gray-500">
            Suivi en lecture seule des formulaires et documents demandés au client.
          </p>

          {data.invitations.length === 0 ? (
            <div className="rounded-lg bg-gray-50 p-6 text-center text-sm text-gray-500">
              Aucune invitation envoyée pour ce dossier.
            </div>
          ) : (
            <div className="space-y-4">
              {data.invitations.map((inv) => (
                <div key={inv.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{inv.email}</div>
                      <div className="text-xs text-gray-500">
                        Envoyée le {inv.sent_at || '—'}
                        {inv.expires_at ? ` · Expire le ${inv.expires_at}` : ''}
                      </div>
                    </div>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                      {inv.status}
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {inv.items.map((it) => (
                      <li key={it.id} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-2 text-sm">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          it.kind === 'form' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {it.kind === 'form' ? 'Formulaire' : 'Document'}
                        </span>
                        <div className="flex-1 truncate">
                          {it.form_type?.name ?? it.document_template?.name ?? '—'}
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          it.status === 'completed' ? 'bg-green-100 text-green-700' :
                          it.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {it.status === 'completed' ? '✓ Complété' : it.status === 'in_progress' ? '◐ En cours' : '○ À faire'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Uploads libres du collaborateur */}
        {data.allow_collab_uploads && (
          <CollabUploadsSection
            dossierId={Number(id)}
            uploads={data.uploads}
            onChange={load}
          />
        )}
      </main>
    </>
  );
}

function CollabUploadsSection({
  dossierId, uploads, onChange,
}: { dossierId: number; uploads: CollabUpload[]; onChange: () => Promise<void> }) {
  const [label, setLabel] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUpload = async () => {
    if (!file) { toast.error('Sélectionnez un fichier'); return; }
    if (!label.trim()) { toast.error('Libellé requis'); return; }
    if (file.size > MAX_UPLOAD_BYTES) { toast.error('Fichier trop volumineux (max 20 Mo)'); return; }
    try {
      setUploading(true);
      await collabWorkspaceService.uploadFile(dossierId, file, label.trim());
      toast.success('Document téléversé');
      setLabel(''); setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await onChange();
    } catch (e: any) {
      toast.error(e.message || 'Échec du téléversement');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (uploadId: number) => {
    if (!confirm('Supprimer ce document ?')) return;
    try {
      await collabWorkspaceService.deleteUpload(dossierId, uploadId);
      await onChange();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-2xl">📎</span>
        <h2 className="text-lg font-semibold text-gray-900">Mes fichiers complémentaires</h2>
      </div>
      <p className="mb-4 text-sm text-gray-500">
        Téléversez vos preuves, scans ou justificatifs internes (max 20 Mo par fichier).
      </p>

      {uploads.length > 0 && (
        <ul className="mb-4 space-y-2">
          {uploads.map((u) => (
            <li key={u.id} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
              <span className="text-xl">📄</span>
              <div className="flex-1 overflow-hidden">
                <div className="truncate text-sm font-medium text-gray-900">{u.label}</div>
                <div className="truncate text-xs text-gray-500">
                  {u.original_filename} · {formatBytes(u.size)}
                  {u.created_at ? ` · ${u.created_at}` : ''}
                </div>
              </div>
              <button
                onClick={() => handleDelete(u.id)}
                className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-3 rounded-lg border border-dashed border-gray-300 p-4">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Libellé (ex. Preuve de paiement)"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          ref={fileInputRef}
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
        />
        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading || !file || !label.trim()}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {uploading ? 'Téléversement…' : 'Ajouter le document'}
        </button>
      </div>
    </section>
  );
}
