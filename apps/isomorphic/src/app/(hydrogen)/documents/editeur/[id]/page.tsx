'use client';

import { useEffect, useRef, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import { documentService, DocumentTemplateDetail } from '@/services/documents';

const XfaPdfViewer = dynamic(() => import('@/components/XfaPdfViewer'), { ssr: false });

export default function PreviewTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [template, setTemplate] = useState<DocumentTemplateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const filePromiseRef = useRef<Promise<ArrayBuffer> | null>(null);

  useEffect(() => {
    documentService.getTemplate(Number(id))
      .then((t) => {
        setTemplate(t);
        filePromiseRef.current = documentService.fetchTemplatePdf(Number(id));
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-400">
        Chargement…
      </div>
    );
  }

  if (!template) {
    return <div className="p-6 text-center text-red-500">Modèle introuvable.</div>;
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Barre du haut */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/documents')}
            className="text-sm text-gray-500 hover:text-gray-800"
          >
            ← Retour
          </button>
          <span className="text-gray-300">|</span>
          <div>
            <h1 className="text-base font-semibold text-gray-900">{template.name}</h1>
            <p className="text-xs text-gray-400">{template.category_label}</p>
          </div>
        </div>
        <div className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs text-blue-700">
          Prévisualisation du modèle
        </div>
      </div>

      {/* Visionneuse Adobe PDF — lecture seule */}
      <div className="flex-1 overflow-hidden">
        {filePromiseRef.current && (
          <XfaPdfViewer
            filePromise={filePromiseRef.current}
            fileName={`${template.name}.pdf`}
            readOnly
          />
        )}
      </div>
    </div>
  );
}
