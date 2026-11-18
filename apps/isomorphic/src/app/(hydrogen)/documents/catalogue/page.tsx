'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { PiBooksDuotone, PiCheckCircleFill, PiArrowsClockwiseBold, PiDownloadSimpleBold } from 'react-icons/pi';
import { catalogService, CabinetCatalogItem } from '@/services/catalog';
import { useCurrentAdmin } from '@/hooks/use-current-admin';

/** Catalogue : formulaires prêts à l'emploi, préremplissage déjà relié, importés en un clic. */
export default function CatalogPage() {
  const admin = useCurrentAdmin();
  const canImport = !!admin?.permissions?.manage_settings;
  const [items, setItems] = useState<CabinetCatalogItem[] | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  const load = () => catalogService.list().then(setItems).catch((e: any) => { toast.error(e.message); setItems([]); });
  useEffect(() => { load(); }, []);

  const importItem = async (item: CabinetCatalogItem) => {
    setBusy(item.id);
    try {
      toast.success((await catalogService.import(item.id)).message);
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <PiBooksDuotone className="mt-0.5 h-8 w-8 shrink-0 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Catalogue de modèles</h1>
            <p className="text-sm text-gray-600">
              Formulaires prêts à l’emploi : leurs champs sont déjà reliés au profil du client, ils se préremplissent dès l’import.
              Relisez toujours un formulaire prérempli avant de le transmettre.
            </p>
          </div>
        </div>
        <Link href="/documents" className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">← Mes modèles</Link>
      </header>

      {items === null ? (
        <p className="py-10 text-center text-sm text-gray-500">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 bg-white py-10 text-center text-sm text-gray-500">Le catalogue est vide pour le moment.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.id} className="flex flex-col justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold text-gray-900">{item.name}</h2>
                  <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs uppercase text-gray-600">{item.doc_type}</span>
                </div>
                {item.description && <p className="mt-1 text-sm text-gray-600">{item.description}</p>}
                <p className="mt-2 text-xs text-gray-500">{item.fields} champ(s) préremplis · version {item.version}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {item.imported_template_id && !item.update_available && (
                  <span className="inline-flex items-center gap-1 text-sm text-emerald-700"><PiCheckCircleFill className="h-4 w-4" /> Dans vos modèles</span>
                )}
                {item.imported_template_id && (
                  <Link href={`/documents/correspondance/${item.imported_template_id}`} className="text-sm text-blue-700 hover:underline">Voir la correspondance</Link>
                )}
                {canImport && (!item.imported_template_id || item.update_available) && (
                  <button onClick={() => importItem(item)} disabled={busy === item.id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                    {item.update_available
                      ? <><PiArrowsClockwiseBold className="h-4 w-4" /> Mettre à jour (version {item.version})</>
                      : <><PiDownloadSimpleBold className="h-4 w-4" /> Importer</>}
                  </button>
                )}
                {!canImport && !item.imported_template_id && <span className="text-xs text-gray-500">Un propriétaire ou un administrateur peut l’importer.</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
