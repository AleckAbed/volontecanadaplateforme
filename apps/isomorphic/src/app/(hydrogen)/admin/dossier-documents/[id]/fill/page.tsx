'use client';

import { useEffect, useRef, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import { PiArrowLeftBold, PiCheckCircleDuotone } from 'react-icons/pi';
import { dossierDocumentsService } from '@/services/dossier-documents';

const SmartPdfViewer = dynamic(() => import('@/components/SmartPdfViewer'), { ssr: false });

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

export default function AdminDossierDocFillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const docId = Number(id);
  const filePromiseRef = useRef<Promise<ArrayBuffer> | null>(null);
  const [docName, setDocName] = useState<string>('Document');
  const [loadedMeta, setLoadedMeta] = useState(false);

  if (!filePromiseRef.current) {
    filePromiseRef.current = dossierDocumentsService.fetchEditPdf(docId);
  }

  useEffect(() => {
    // Pas d'endpoint meta pour l'admin sur ce doc — le nom sera dans l'URL ou pas critique
    setDocName('Document du dossier');
    setLoadedMeta(true);
  }, [docId]);

  const handleSave = async (pdfBytes: Uint8Array, formData: Record<string, any>) => {
    try {
      const base64 = await uint8ToBase64(pdfBytes);
      await dossierDocumentsService.saveAsAdmin(docId, base64, formData);
      toast.success('Modifications enregistrées');
    } catch (e: any) {
      toast.error(e.message || 'Échec de la sauvegarde');
      throw e;
    }
  };

  const handleMarkComplete = async () => {
    if (!confirm('Marquer ce document comme terminé ?')) return;
    try {
      await dossierDocumentsService.markComplete(docId);
      toast.success('Document marqué terminé');
      router.back();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
            <PiArrowLeftBold className="h-4 w-4" /> Retour au dossier
          </button>
          <span className="text-gray-300">|</span>
          <div>
            <div className="text-sm font-semibold text-gray-900">{docName}</div>
            <div className="text-xs text-gray-400">Modification admin — sauvegarde via le bouton dans le viewer</div>
          </div>
        </div>
        <button
          onClick={handleMarkComplete}
          className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
        >
          <PiCheckCircleDuotone className="h-4 w-4" /> Marquer comme terminé
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        {loadedMeta && (
          <SmartPdfViewer
            filePromise={filePromiseRef.current!}
            fileName={`${docName}.pdf`}
            readOnly={false}
            onSave={handleSave}
          />
        )}
      </div>
    </div>
  );
}
