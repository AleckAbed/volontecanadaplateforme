'use client';

import { useEffect, useState, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import { invitationsService, PublicInvitation, PublicInvitationItem } from '@/services/invitations';

const XfaPdfViewer = dynamic(() => import('@/components/XfaPdfViewer'), { ssr: false });

const STATUS_INFO: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: 'À faire', color: 'bg-gray-100 text-gray-700', icon: '○' },
  in_progress: { label: 'En cours', color: 'bg-blue-100 text-blue-800', icon: '◐' },
  completed: { label: 'Complété', color: 'bg-green-100 text-green-700', icon: '✓' },
};

type Mode = 'overview' | 'fill-document';

function formRouteFor(code?: string): string {
  if (code === 'questionnaire_repondant') return '/sponsor-form';
  if (code === 'questionnaire_pstq_pointage') return '/pstq-form';
  return '/client-form';
}

export default function PublicInvitationPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();

  const [invitation, setInvitation] = useState<PublicInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('overview');
  const [activeItem, setActiveItem] = useState<PublicInvitationItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await invitationsService.getPublicInvitation(code);
      setInvitation(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Require prior verification (email + code) before showing the invitation
    let verified = false;
    try {
      verified = sessionStorage.getItem('invitation_code') === code;
    } catch {}
    if (!verified) {
      router.replace(`/invitation/verify?code=${code}`);
      return;
    }
    load();
  }, [code, router]);

  const allCompleted = invitation?.items.every((i) => i.status === 'completed') ?? false;
  const completedCount = invitation?.items.filter((i) => i.status === 'completed').length ?? 0;
  const total = invitation?.items.length ?? 0;

  const handleOpen = (item: PublicInvitationItem) => {
    if (item.kind === 'form') {
      // Forms reuse the existing legacy form pages — prime localStorage and redirect.
      const linked = item.linked_questionnaire_code;
      if (!linked) {
        toast.error('Formulaire non disponible');
        return;
      }
      try {
        localStorage.setItem('questionnaire_code', linked);
        localStorage.setItem('questionnaire_email', invitation?.email ?? '');
        localStorage.setItem('questionnaire_form_type', item.form_type_code ?? 'questionnaire_demandeur_001');
        // So the legacy form's "completed" page can return us here:
        sessionStorage.setItem('return_to_invitation', code);
      } catch {}
      const target = formRouteFor(item.form_type_code);
      router.push(`${target}?code=${linked}&from_invitation=${code}`);
      return;
    }
    setActiveItem(item);
    setMode('fill-document');
  };

  const handleBackToOverview = async () => {
    setMode('overview');
    setActiveItem(null);
    await load();
  };

  const handleSubmitAll = async () => {
    if (!confirm('Soumettre toute l\'invitation ? Vous ne pourrez plus modifier les éléments après.')) return;
    try {
      setSubmitting(true);
      await invitationsService.submitAll(code);
      toast.success('Invitation soumise avec succès !');
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <FullPageMessage icon="⏳" title="Chargement…" message="Préparation de votre invitation." />;

  if (error) {
    return <FullPageMessage icon="❌" title="Erreur" message={error} color="text-red-600" />;
  }

  if (!invitation) return null;

  if (invitation.is_expired) {
    return <FullPageMessage icon="⏰" title="Lien expiré" message="Cette invitation a expiré. Contactez votre conseiller." color="text-orange-600" />;
  }

  if (invitation.status === 'completed') {
    return <FullPageMessage icon="✅" title="Invitation soumise" message="Merci ! Tous vos éléments ont été reçus. Votre conseiller vous contactera prochainement." color="text-green-600" />;
  }

  if (mode === 'fill-document' && activeItem) {
    return <DocumentFillView code={code} item={activeItem} onBack={handleBackToOverview} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-6 py-5 shadow-sm">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase text-blue-600">Volonté Canada</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Votre invitation</h1>
          {invitation.client_name && (
            <p className="mt-1 text-gray-600">Bonjour, <strong>{invitation.client_name}</strong></p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        {/* Message */}
        {invitation.message && (
          <div className="mb-6 rounded-xl border-l-4 border-blue-500 bg-blue-50 p-4">
            <div className="text-xs font-semibold uppercase text-blue-700">Message de votre conseiller</div>
            <p className="mt-1 text-sm text-gray-700">{invitation.message}</p>
          </div>
        )}

        {/* Progress */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Avancement</span>
            <span className="text-sm font-semibold text-gray-900">{completedCount} / {total}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-blue-600 transition-all"
              style={{ width: total > 0 ? `${(completedCount / total) * 100}%` : '0%' }}
            />
          </div>
          {invitation.expires_at && (
            <p className="mt-3 text-xs text-gray-500">⏰ Expire le {invitation.expires_at}</p>
          )}
        </div>

        {/* Items list */}
        <div className="space-y-3">
          {invitation.items.map((item) => {
            const info = STATUS_INFO[item.status];
            return (
              <button
                key={item.id}
                onClick={() => handleOpen(item)}
                className="flex w-full items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-blue-400 hover:shadow-md"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-2xl">
                  {item.kind === 'form' ? '📝' : '📄'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${
                      item.kind === 'form' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {item.kind === 'form' ? 'Formulaire' : 'Document'}
                    </span>
                    {item.category && <span className="text-xs text-gray-500">• {item.category}</span>}
                  </div>
                  <div className="mt-1 font-semibold text-gray-900">{item.name}</div>
                  {item.description && <div className="mt-0.5 text-sm text-gray-500">{item.description}</div>}
                  {item.last_saved_at && (
                    <div className="mt-1 text-xs text-gray-400">Sauvegardé le {item.last_saved_at}</div>
                  )}
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${info.color}`}>
                  {info.icon} {info.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Submit all */}
        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-5 text-center">
          <p className="mb-4 text-sm text-gray-600">
            {allCompleted
              ? 'Tous vos éléments sont prêts. Vous pouvez maintenant soumettre votre invitation.'
              : `Vos réponses sont sauvegardées automatiquement. Vous pouvez revenir plus tard.`}
          </p>
          <button
            onClick={handleSubmitAll}
            disabled={!allCompleted || submitting}
            className="rounded-lg bg-blue-600 px-8 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Soumission…' : 'Soumettre l\'invitation'}
          </button>
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white px-6 py-4 text-center text-xs text-gray-400">
        Volonté Canada — Cabinet d&apos;immigration
      </footer>
    </div>
  );
}

// ─── Sub-views ──────────────────────────────────────────────────────────────

function DocumentFillView({
  code, item, onBack,
}: { code: string; item: PublicInvitationItem; onBack: () => void }) {
  const filePromiseRef = useRef<Promise<ArrayBuffer> | null>(null);
  if (!filePromiseRef.current) {
    filePromiseRef.current = invitationsService.fetchItemPdf(code, item.id);
  }

  const handleSave = async (pdfBytes: Uint8Array, formData: Record<string, any>) => {
    try {
      const base64 = await uint8ToBase64(pdfBytes);
      await invitationsService.saveDocumentItem(code, item.id, base64, formData);
      toast.success('Document sauvegardé sur le serveur');
    } catch (e: any) {
      console.error('[invitation] save error', e);
      toast.error(e.message || 'Échec de la sauvegarde — vérifiez votre connexion');
      throw e;
    }
  };

  const handleMarkComplete = async () => {
    if (!confirm('Marquer ce document comme terminé ?')) return;
    try {
      await invitationsService.completeItem(code, item.id);
      toast.success('Document marqué comme terminé');
      onBack();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-800">← Retour</button>
          <span className="text-gray-300">|</span>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">{item.name}</h1>
            <p className="text-xs text-gray-400">
              Sauvegardez régulièrement avec le bouton ci-dessous. Marquez comme terminé quand fini.
            </p>
          </div>
        </div>
        <button
          onClick={handleMarkComplete}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
        >
          ✓ Marquer comme terminé
        </button>
      </header>
      <div className="flex-1 overflow-hidden">
        <XfaPdfViewer
          filePromise={filePromiseRef.current}
          fileName={`${item.name}.pdf`}
          readOnly={false}
          initialFormData={item.form_data || undefined}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}

function uint8ToBase64(bytes: Uint8Array): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // result is "data:application/pdf;base64,XXX"
      const idx = result.indexOf(',');
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    reader.onerror = () => reject(new Error('Conversion base64 impossible'));
    reader.readAsDataURL(new Blob([bytes]));
  });
}

function FullPageMessage({
  icon, title, message, color = 'text-gray-600',
}: { icon: string; title: string; message: string; color?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <div className="rounded-2xl bg-white p-10 shadow-sm">
        <div className="mb-4 text-6xl">{icon}</div>
        <h1 className={`mb-2 text-2xl font-bold ${color}`}>{title}</h1>
        <p className="max-w-md text-gray-500">{message}</p>
        <p className="mt-6 text-xs text-gray-400">Volonté Canada — Cabinet d&apos;immigration</p>
      </div>
    </div>
  );
}
