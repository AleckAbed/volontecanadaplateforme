'use client';

import { use, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import { PiArrowLeftBold, PiCheckCircleFill, PiCopyDuotone, PiInfoDuotone } from 'react-icons/pi';
import { documentService } from '@/services/documents';
import { fieldMapService, FieldMapInfo } from '@/services/client-profile';
import { useCurrentAdmin } from '@/hooks/use-current-admin';

const SmartPdfViewer = dynamic(() => import('@/components/SmartPdfViewer'), { ssr: false });

/**
 * Correspondance des champs d'un modèle PDF avec le profil client.
 *
 * L'admin tape un jeton (@nom, @passeport…) dans chaque champ du PDF qui
 * correspond à une information du profil, puis enregistre avec le bouton du
 * visualiseur. Les PDF de ce modèle s'ouvriront ensuite préremplis.
 */
export default function FieldMapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const templateId = Number(id);
  const router = useRouter();
  const admin = useCurrentAdmin();
  const canEdit = !!admin?.permissions?.manage_settings;

  const [info, setInfo] = useState<FieldMapInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mappedKeys, setMappedKeys] = useState<string[]>([]);
  const filePromiseRef = useRef<Promise<ArrayBuffer> | null>(null);

  useEffect(() => {
    fieldMapService.get(templateId)
      .then((data) => {
        filePromiseRef.current = documentService.fetchTemplatePdf(templateId);
        setInfo(data);
        setMappedKeys(data.mapped_keys);
      })
      .catch((e: any) => setLoadError(e.message || 'Chargement impossible.'));
  }, [templateId]);

  const sections = useMemo(() => {
    const out: Record<string, FieldMapInfo['fields']> = {};
    info?.fields.forEach((f) => { (out[f.section] ||= []).push(f); });
    return out;
  }, [info]);

  const handleSave = async (_pdf: Uint8Array, formData: Record<string, any>) => {
    try {
      const res = await fieldMapService.save(templateId, formData);
      setMappedKeys(res.data.mapped_keys);
      if (res.data.unknown_tokens.length > 0) {
        toast.error(`Jetons non reconnus : ${res.data.unknown_tokens.join(', ')}`);
      }
      toast.success(res.message);
    } catch (e: any) {
      toast.error(e.message || 'Enregistrement impossible.');
      throw e;
    }
  };

  const copy = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      toast.success(`${token} copié`);
    } catch {
      toast.error('Copie impossible : sélectionnez le jeton à la main.');
    }
  };

  if (loadError) {
    return <div role="alert" className="m-6 rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{loadError}</div>;
  }
  if (!info || !filePromiseRef.current) {
    return <div className="flex h-[60vh] items-center justify-center text-gray-400">Chargement…</div>;
  }

  return (
    <div className="flex h-[calc(100vh-80px)] flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
            <PiArrowLeftBold className="h-4 w-4" /> Retour
          </button>
          <span className="text-gray-300">|</span>
          <div>
            <div className="text-sm font-semibold text-gray-900">Correspondance des champs — {info.template.name}</div>
            <div className="text-xs text-gray-500">
              {mappedKeys.length} information{mappedKeys.length > 1 ? 's' : ''} du profil reliée{mappedKeys.length > 1 ? 's' : ''} à ce modèle
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="max-h-72 shrink-0 overflow-y-auto border-b border-gray-200 bg-gray-50 p-4 lg:max-h-none lg:w-80 lg:border-b-0 lg:border-r">
          <div className="mb-4 flex gap-2 rounded-lg bg-blue-50 p-3 text-xs text-blue-900">
            <PiInfoDuotone className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Tapez un jeton dans chaque champ du PDF qui correspond à une information du profil
              (ex. <strong>@nom</strong> dans « Nom de famille »), puis enregistrez avec le bouton du visualiseur.
              Les PDF de ce modèle s&apos;ouvriront préremplis. Seuls les champs texte peuvent être reliés.
            </p>
          </div>
          {!canEdit && admin && (
            <p className="mb-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
              Lecture seule : seuls un propriétaire ou un administrateur peuvent enregistrer la correspondance.
            </p>
          )}
          {Object.entries(sections).map(([section, fields]) => (
            <div key={section} className="mb-4">
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">{section}</div>
              <ul className="space-y-1">
                {fields.map((f) => {
                  const mapped = mappedKeys.includes(f.key);
                  return (
                    <li key={f.key}>
                      <button
                        type="button"
                        onClick={() => copy(f.token)}
                        title="Copier le jeton"
                        className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-white"
                      >
                        <span className="min-w-0">
                          <code className="font-semibold text-blue-700">{f.token}</code>
                          <span className="block truncate text-gray-600">{f.label}</span>
                        </span>
                        {mapped
                          ? <PiCheckCircleFill className="h-4 w-4 shrink-0 text-emerald-600" aria-label="Relié" />
                          : <PiCopyDuotone className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </aside>

        <div className="min-h-0 flex-1 overflow-hidden">
          <SmartPdfViewer
            filePromise={filePromiseRef.current}
            fileName={`${info.template.name}.pdf`}
            readOnly={!canEdit}
            // pdf.js obligatoire : ce sont ses clés de champs qui servent au préremplissage.
            forceViewer="xfa"
            initialFormData={Object.keys(info.token_values).length ? info.token_values : undefined}
            onSave={canEdit ? handleSave : undefined}
          />
        </div>
      </div>
    </div>
  );
}
