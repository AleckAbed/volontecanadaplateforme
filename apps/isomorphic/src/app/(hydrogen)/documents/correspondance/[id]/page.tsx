'use client';

import { use, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import { PiArrowLeftBold, PiCheckCircleFill, PiCopyDuotone, PiInfoDuotone } from 'react-icons/pi';
import { documentService } from '@/services/documents';
import { fieldMapService, FieldMapInfo, FieldMapRule } from '@/services/client-profile';
import type { PdfFieldChange } from '@/components/XfaPdfViewer';
import RulesPanel, { PendingRule } from './rules-panel';
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
  const [rules, setRules] = useState<FieldMapRule[]>([]);
  // Règle en attente du clic dans le PDF (ref : lue depuis le visualiseur).
  const [armed, setArmedState] = useState<PendingRule | null>(null);
  const armedRef = useRef<PendingRule | null>(null);
  const setArmed = (r: PendingRule | null) => { armedRef.current = r; setArmedState(r); };
  const filePromiseRef = useRef<Promise<ArrayBuffer> | null>(null);

  useEffect(() => {
    fieldMapService.get(templateId)
      .then((data) => {
        filePromiseRef.current = documentService.fetchTemplatePdf(templateId);
        setInfo(data);
        setMappedKeys(data.mapped_keys);
        setRules(data.rules);
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
      setRules(res.data.rules);
      if (res.data.unknown_tokens.length > 0) {
        toast.error(`Jetons non reconnus : ${res.data.unknown_tokens.join(', ')}`);
      }
      toast.success(res.message);
    } catch (e: any) {
      toast.error(e.message || 'Enregistrement impossible.');
      throw e;
    }
  };

  /** Clic dans le PDF pendant qu'une règle attend : on relie ce champ. */
  const handleFieldChange = async (f: PdfFieldChange) => {
    const rule = armedRef.current;
    if (!rule) return;
    if (rule.mode === 'text') {
      // Champ texte : relié dès qu'on clique dedans.
      if (f.event !== 'focus') return;
      if (f.kind !== 'text') {
        toast.error('Ce champ n’est pas un champ texte : choisissez « Case » ou « Liste ».');
        return;
      }
    } else {
      if (f.event !== 'change' || f.kind === 'text') return;
      if ((f.kind === 'checkbox' || f.kind === 'radio') && !f.checked) return;
      if (rule.mode === 'choice' && f.kind !== 'select') {
        toast.error('Ce champ est une case : choisissez « Case ou bouton radio », ou cliquez une liste déroulante.');
        return;
      }
    }
    // Clé du stockage pdf.js seulement : en XFA, les boutons radio d'un groupe partagent leur nom.
    const isList = rule.mode === 'choice';
    if (!f.storageKey) {
      toast.error('Ce champ du PDF n’a pas d’identifiant : il ne peut pas être relié.');
      return;
    }
    setArmed(null);
    try {
      const res = await fieldMapService.addRule(templateId, {
        key: rule.field.key, mode: rule.mode, equals: isList ? undefined : rule.equals, format: rule.format || null,
        targets: { [`__as__${f.storageKey}`]: isList || rule.mode === 'text' ? null : f.storageValue },
      });
      setRules(res.data.rules);
      setMappedKeys(res.data.mapped_keys);
      toast.success(`Relié : ${rule.summary}${f.kind === 'select' && !isList && f.label ? ` (option « ${f.label} »)` : ''}`);
    } catch (e: any) {
      toast.error(e.message || 'Impossible de relier ce champ.');
    }
  };

  const removeRule = async (group: string) => {
    try {
      const res = await fieldMapService.removeRule(templateId, group);
      setRules(res.data.rules);
      setMappedKeys(res.data.mapped_keys);
      toast.success(res.message);
    } catch (e: any) {
      toast.error(e.message || 'Suppression impossible.');
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
              Les PDF de ce modèle s&apos;ouvriront préremplis.
            </p>
          </div>
          <div className="mb-4 rounded-lg bg-gray-100 p-3 text-xs text-gray-700">
            <p className="font-medium text-gray-900">Dates</p>
            <p className="mt-0.5">
              Ajoutez un format après le jeton : <code className="text-blue-700">@date_naissance:jj/mm/aaaa</code>.
              Pour les cases séparées, une seule partie : <code className="text-blue-700">:aaaa</code>, <code className="text-blue-700">:mm</code> ou <code className="text-blue-700">:jj</code>.
            </p>
          </div>
          {!canEdit && admin && (
            <p className="mb-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
              Lecture seule : seuls un propriétaire ou un administrateur peuvent enregistrer la correspondance.
            </p>
          )}
          <RulesPanel info={info} rules={rules} canEdit={canEdit} armed={armed} onArm={setArmed} onRemove={removeRule} />
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
            onFieldChange={canEdit ? handleFieldChange : undefined}
          />
        </div>
      </div>
    </div>
  );
}
