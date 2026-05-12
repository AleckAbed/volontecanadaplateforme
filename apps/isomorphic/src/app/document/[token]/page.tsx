'use client';

import { useEffect, useState, use, useRef } from 'react';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import { documentService, PublicDocumentData } from '@/services/documents';

const XfaPdfViewer = dynamic(() => import('@/components/XfaPdfViewer'), { ssr: false });

type PageState = 'loading' | 'ready' | 'submitted' | 'expired' | 'error';

export default function ClientFillDocumentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);

  const [pageState, setPageState] = useState<PageState>('loading');
  const [docData, setDocData] = useState<PublicDocumentData | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const filePromiseRef = useRef<Promise<ArrayBuffer> | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await documentService.getDocumentByToken(token);
        setDocData(data);
        if (data.status === 'submitted') {
          setPageState('submitted');
        } else {
          // Pre-fetch PDF so Adobe viewer can start immediately
          filePromiseRef.current = documentService.fetchBasePdf(token);
          setPageState('ready');
        }
      } catch (e: any) {
        if (e.message?.includes('expiré') || e.message?.includes('expired')) {
          setPageState('expired');
        } else if (e.message?.includes('traité') || e.message?.includes('closed')) {
          setPageState('submitted');
        } else {
          setPageState('error');
          setErrorMsg(e.message || 'Une erreur est survenue');
        }
      }
    };
    load();
  }, [token]);

  const handleSave = async (pdfBytes: Uint8Array) => {
    try {
      setSubmitting(true);
      const base64 = btoa(
        pdfBytes.reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      await documentService.submitDocument(token, [], base64);
      toast.success('Document soumis avec succès !');
      setPageState('submitted');
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de la soumission');
      throw e;
    } finally {
      setSubmitting(false);
    }
  };

  if (pageState === 'loading') {
    return <FullPageMessage icon="⏳" title="Chargement…" message="Préparation de votre document." />;
  }

  if (pageState === 'expired') {
    return (
      <FullPageMessage
        icon="⏰"
        title="Lien expiré"
        message="Ce lien a expiré. Contactez votre conseiller en immigration pour en obtenir un nouveau."
        color="text-orange-600"
      />
    );
  }

  if (pageState === 'submitted') {
    return (
      <FullPageMessage
        icon="✅"
        title="Document soumis"
        message="Votre document a bien été reçu. Votre conseiller en immigration vous contactera prochainement."
        color="text-green-600"
      />
    );
  }

  if (pageState === 'error') {
    return (
      <FullPageMessage
        icon="❌"
        title="Erreur"
        message={errorMsg || 'Impossible de charger ce document. Vérifiez votre lien.'}
        color="text-red-600"
      />
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* En-tête */}
      <header className="border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-blue-600">Volonte Canada</p>
            <h1 className="text-lg font-bold text-gray-900">{docData?.template_name}</h1>
            {docData?.client_name && (
              <p className="text-sm text-gray-500">Bonjour, {docData.client_name}</p>
            )}
          </div>
          {submitting && (
            <span className="text-sm text-blue-600 animate-pulse">Envoi en cours…</span>
          )}
        </div>
      </header>

      {/* Message du conseiller */}
      {docData?.message && (
        <div className="bg-blue-50 px-6 py-3 text-center text-sm text-blue-800">
          💬 <strong>Message de votre conseiller :</strong> {docData.message}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-amber-50 px-6 py-2 text-center text-xs text-amber-800">
        Remplissez le formulaire ci-dessous, signez si requis, puis cliquez sur <strong>Enregistrer</strong> pour soumettre.
      </div>

      {/* Visionneuse Adobe PDF */}
      <div className="flex-1 overflow-hidden">
        {filePromiseRef.current && (
          <XfaPdfViewer
            filePromise={filePromiseRef.current}
            fileName={`${docData?.template_name ?? 'document'}.pdf`}
            readOnly={false}
            onSave={handleSave}
          />
        )}
      </div>

      {/* Pied de page */}
      <footer className="border-t border-gray-200 bg-white px-6 py-2 text-center text-xs text-gray-400">
        {docData?.expires_at && `Ce document expire le ${docData.expires_at}. `}
        Ce lien est personnel et confidentiel — Volonte Canada
      </footer>
    </div>
  );
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
        <p className="mt-6 text-xs text-gray-400">Volonte Canada — Cabinet d&apos;immigration</p>
      </div>
    </div>
  );
}
