'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { PiBooksDuotone } from 'react-icons/pi';
import { platformService } from '@/services/team';
import { platformCatalogService, PlatformCatalogItem } from '@/services/catalog';

type CabinetOption = { id: number; name: string };
type SourceTemplate = { id: number; name: string; doc_type: string; fields: number; from_catalog: boolean };

/**
 * Console plateforme : catalogue partagé. On prépare un modèle dans un cabinet (PDF + correspondance),
 * on l'ajoute ici, puis on le publie pour tous les cabinets.
 */
export default function PlatformCatalogPage() {
  const router = useRouter();
  const [items, setItems] = useState<PlatformCatalogItem[] | null>(null);
  const [cabinets, setCabinets] = useState<CabinetOption[]>([]);
  const [cabinetId, setCabinetId] = useState('');
  const [templates, setTemplates] = useState<SourceTemplate[]>([]);
  const [templateId, setTemplateId] = useState('');
  const [target, setTarget] = useState(''); // '' = nouveau modèle, sinon nouvelle version de ce modèle
  const [busy, setBusy] = useState(false);

  const load = () => platformCatalogService.list().then(setItems).catch((e: any) => {
    if (/401|Unauthenticated|session|reconnect/i.test(e.message)) router.replace('/plateforme/connexion');
    else toast.error(e.message);
  });

  useEffect(() => {
    load();
    platformService.cabinets().then((d: any) => setCabinets(d.cabinets.map((c: any) => ({ id: c.id, name: c.name })))).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setTemplateId('');
    setTemplates([]);
    if (cabinetId) platformCatalogService.cabinetTemplates(Number(cabinetId)).then(setTemplates).catch((e: any) => toast.error(e.message));
  }, [cabinetId]);

  const publish = async () => {
    setBusy(true);
    try {
      toast.success(await platformCatalogService.publish({ cabinet_id: Number(cabinetId), template_id: Number(templateId), catalog_template_id: target ? Number(target) : null }));
      setTemplateId('');
      setTarget('');
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const togglePublished = async (item: PlatformCatalogItem) => {
    try {
      await platformCatalogService.update(item.id, { is_published: !item.is_published });
      await load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const remove = async (item: PlatformCatalogItem) => {
    if (!window.confirm(`Retirer « ${item.name} » du catalogue ? Les cabinets qui l’ont importé le gardent.`)) return;
    try {
      toast.success(await platformCatalogService.remove(item.id));
      await load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <PiBooksDuotone className="mt-0.5 h-8 w-8 shrink-0 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Catalogue de modèles</h1>
              <p className="text-sm text-gray-600">Formulaires prêts à l’emploi proposés à tous les cabinets.</p>
            </div>
          </div>
          <Link href="/plateforme" className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">← Console</Link>
        </header>

        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-base font-semibold text-gray-900">Ajouter depuis un cabinet</h2>
          <p className="mt-1 text-sm text-gray-600">
            Préparez le modèle dans un cabinet (le vôtre, par exemple) : téléversez le PDF, puis reliez ses champs dans « Préremplissage ». Choisissez-le ici.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="text-sm text-gray-700">Cabinet
              <select value={cabinetId} onChange={(e) => setCabinetId(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-2 py-2">
                <option value="">Choisir…</option>
                {cabinets.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="text-sm text-gray-700">Modèle
              <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} disabled={!cabinetId} className="mt-1 block w-full rounded-lg border border-gray-300 px-2 py-2">
                <option value="">Choisir…</option>
                {templates.map((t) => <option key={t.id} value={t.id} disabled={t.fields === 0}>{t.name} ({t.fields} champ{t.fields > 1 ? 's' : ''} reliés)</option>)}
              </select>
            </label>
            <label className="text-sm text-gray-700">Dans le catalogue
              <select value={target} onChange={(e) => setTarget(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-2 py-2">
                <option value="">Nouveau modèle</option>
                {(items ?? []).map((i) => <option key={i.id} value={i.id}>Nouvelle version de « {i.name} »</option>)}
              </select>
            </label>
          </div>
          <button onClick={publish} disabled={busy || !templateId}
            className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {busy ? 'Copie…' : 'Ajouter au catalogue'}
          </button>
        </section>

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {items === null ? (
            <p className="p-6 text-center text-sm text-gray-500">Chargement…</p>
          ) : items.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-500">Aucun modèle dans le catalogue.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {items.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{i.name} <span className="text-xs text-gray-500">· v{i.version} · {i.fields} champs · {i.imports_count} import(s)</span></p>
                    {i.description && <p className="text-sm text-gray-600">{i.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => togglePublished(i)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${i.is_published ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                      {i.is_published ? 'Publié — retirer' : 'Non publié — publier'}
                    </button>
                    <button onClick={() => remove(i)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50">Supprimer</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
