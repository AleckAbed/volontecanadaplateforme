'use client';

import { useRef, use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import { collabWorkspaceService } from '@/services/collaborators';
import CollabHeader from '../../../_components/collab-header';

const XfaPdfViewer = dynamic(() => import('@/components/XfaPdfViewer'), { ssr: false });

function uint8ToBase64(bytes: Uint8Array): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const idx = result.indexOf(',');
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    reader.onerror = () => reject(new Error('Conversion base64 impossible'));
    reader.readAsDataURL(new Blob([bytes]));
  });
}

export default function CollabFillDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const docId = Number(id);
  const filePromiseRef = useRef<Promise<ArrayBuffer> | null>(null);
  const [initialFormData, setInitialFormData] = useState<any>(undefined);
  const [docName, setDocName] = useState<string>('Document');
  const [loadedMeta, setLoadedMeta] = useState(false);

  if (!filePromiseRef.current) {
    filePromiseRef.current = collabWorkspaceService.fetchDocumentPdf(docId);
  }

  useEffect(() => {
    (async () => {
      try {
        const meta = await collabWorkspaceService.getDocumentMeta(docId);
        setDocName(meta.name || 'Document');
        if (meta.form_data) setInitialFormData(meta.form_data);
      } catch (e: any) {
        toast.error(e.message || 'Erreur de chargement');
        router.replace('/collab/dossiers');
      } finally {
        setLoadedMeta(true);
      }
    })();
  }, [docId, router]);

  const handleSave = async (pdfBytes: Uint8Array, formData: Record<string, any>) => {
    try {
      const base64 = await uint8ToBase64(pdfBytes);
      await collabWorkspaceService.saveDocument(docId, base64, formData);
      toast.success('Document sauvegardé');
    } catch (e: any) {
      toast.error(e.message || 'Échec de la sauvegarde');
      throw e;
    }
  };

  const handleMarkComplete = async () => {
    if (!confirm('Marquer ce document comme terminé ?')) return;
    try {
      await collabWorkspaceService.markDocumentComplete(docId);
      toast.success('Document marqué terminé');
      router.back();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <CollabHeader />
      <div className="flex h-[calc(100vh-60px)] flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-800">← Retour</button>
            <span className="text-gray-300">|</span>
            <div className="text-sm font-semibold text-gray-900">{docName}</div>
          </div>
          <button
            onClick={handleMarkComplete}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
          >
            ✓ Marquer comme terminé
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          {loadedMeta && (
            <XfaPdfViewer
              filePromise={filePromiseRef.current!}
              fileName={`${docName}.pdf`}
              readOnly={false}
              initialFormData={initialFormData}
              onSave={handleSave}
            />
          )}
        </div>
      </div>
    </>
  );
}
