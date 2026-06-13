'use client';

import { useEffect, useState, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import { documentService, DocumentRequestDetail } from '@/services/documents';

const XfaPdfViewer = dynamic(() => import('@/components/XfaPdfViewer'), { ssr: false });

const statusConfig: Record<string, { label: string; classes: string }> = {
  pending:     { label: 'En attente',  classes: 'bg-gray-100 text-gray-700' },
  in_progress: { label: 'En cours',   classes: 'bg-blue-100 text-blue-700' },
  submitted:   { label: 'Soumis',     classes: 'bg-orange-100 text-orange-700' },
  validated:   { label: 'Validé ✓',   classes: 'bg-green-100 text-green-700' },
  rejected:    { label: 'Rejeté',     classes: 'bg-red-100 text-red-700' },
};

export default function DemandeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [req, setReq] = useState<DocumentRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const filledPdfPromiseRef = useRef<Promise<ArrayBuffer> | null>(null);

  const load = async () => {
    try {
      const data = await documentService.getRequest(Number(id));
      setReq(data);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleValidate = async () => {
    if (!confirm('Valider ce document ?')) return;
    try {
      setActionLoading(true);
      await documentService.validateRequest(Number(id));
      toast.success('Document validé');
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.error('Veuillez saisir une raison'); return; }
    try {
      setActionLoading(true);
      await documentService.rejectRequest(Number(id), rejectReason);
      toast.success('Document rejeté');
      setShowRejectForm(false);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center text-gray-400">Chargement…</div>;
  if (!req) return <div className="p-6 text-red-500">Demande introuvable.</div>;

  const sc = statusConfig[req.status] ?? statusConfig.pending;
  const canAct = req.status === 'submitted';

  return (
    <div className="mx-auto max-w-3xl p-6">
      {/* En-tête */}
      <div className="mb-6 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-800">
          ← Retour
        </button>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${sc.classes}`}>{sc.label}</span>
      </div>

      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        {req.template?.name ?? 'Document'}
      </h1>

      {/* Infos */}
      <div className="mb-6 grid gap-4 rounded-xl border border-gray-200 bg-white p-5 sm:grid-cols-2">
        <Info label="Client" value={req.client?.full_name ?? '—'} />
        <Info label="Email" value={req.client?.email ?? '—'} />
        <Info label="Dossier" value={req.dossier?.name ?? '—'} />
        <Info label="Catégorie" value={req.template?.category ?? '—'} />
        <Info label="Envoyé le" value={req.sent_at ?? '—'} />
        <Info label="Expire le" value={req.expires_at ?? '—'} />
        <Info label="Soumis le" value={req.submitted_at ?? '—'} />
        <Info label="Envoyé par" value={req.sent_by ?? '—'} />
        {req.validated_at && <Info label="Traité le" value={req.validated_at} />}
        {req.validated_by && <Info label="Traité par" value={req.validated_by} />}
      </div>

      {/* Message personnalisé */}
      {req.message && (
        <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="mb-1 text-xs font-semibold uppercase text-blue-600">Message envoyé au client</p>
          <p className="text-sm text-gray-700">{req.message}</p>
        </div>
      )}

      {/* Raison de rejet */}
      {req.rejection_reason && (
        <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4">
          <p className="mb-1 text-xs font-semibold uppercase text-red-600">Raison du rejet</p>
          <p className="text-sm text-gray-700">{req.rejection_reason}</p>
        </div>
      )}

      {/* PDF rempli */}
      {req.has_filled_pdf && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="mb-3 text-sm font-semibold text-green-800">📄 Document rempli disponible</p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                if (!filledPdfPromiseRef.current) {
                  // credentials: 'include' indispensable — la route /admin/.../pdf
                  // est protégée par auth:admin (cookie HttpOnly). Sans ça → 401.
                  filledPdfPromiseRef.current = fetch(documentService.getFilledPdfUrl(Number(id)), {
                    credentials: 'include',
                  }).then((r) => {
                    if (!r.ok) throw new Error('PDF rempli indisponible (' + r.status + ')');
                    return r.arrayBuffer();
                  });
                }
                setShowPdfViewer(true);
              }}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              Ouvrir dans la plateforme
            </button>
            <a
              href={documentService.getFilledPdfUrl(Number(id))}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-green-600 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-50"
            >
              Télécharger
            </a>
          </div>
        </div>
      )}

      {/* Visionneuse PDF intégrée (admin) */}
      {showPdfViewer && filledPdfPromiseRef.current && (
        <div className="mb-6 rounded-xl border border-gray-200 overflow-hidden" style={{ height: 700 }}>
          <div className="flex items-center justify-between bg-gray-100 px-4 py-2">
            <span className="text-sm font-medium text-gray-700">Document rempli par le client</span>
            <button onClick={() => setShowPdfViewer(false)} className="text-xs text-gray-500 hover:text-gray-800">
              Fermer ✕
            </button>
          </div>
          <div style={{ height: 650 }}>
            <XfaPdfViewer
              filePromise={filledPdfPromiseRef.current}
              fileName={`${req.template?.name ?? 'document'}-rempli.pdf`}
              readOnly={false}
            />
          </div>
        </div>
      )}

      {/* Données remplies */}
      {req.form_data && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Données saisies par le client</h2>
          <pre className="overflow-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
            {JSON.stringify(req.form_data, null, 2)}
          </pre>
        </div>
      )}

      {/* Actions */}
      {canAct && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Actions</h2>

          {!showRejectForm ? (
            <div className="flex gap-3">
              <button
                onClick={handleValidate}
                disabled={actionLoading}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading ? '…' : '✓ Valider le document'}
              </button>
              <button
                onClick={() => setShowRejectForm(true)}
                className="flex-1 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                ✗ Rejeter
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Raison du rejet *
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Expliquez pourquoi le document est rejeté…"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-400 focus:outline-none"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectForm(false)}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading ? '…' : 'Confirmer le rejet'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-gray-400">{label}</p>
      <p className="text-sm text-gray-800">{value}</p>
    </div>
  );
}
