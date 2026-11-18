'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { PiBuildingOfficeDuotone } from 'react-icons/pi';
import { companyService, CompanyVisibility } from '@/services/companies';

/**
 * Dossier demandé par une entreprise : laquelle, et ce qu'elle en voit (avancement seulement,
 * ou aussi formulaires et documents). Affiché seulement si le client a un employeur.
 */
export default function CompanyCard({ dossierId, clientId, companyId, visibility }: {
  dossierId: number; clientId: number; companyId: number | null; visibility: CompanyVisibility | null;
}) {
  const [companies, setCompanies] = useState<{ id: number; name: string; ended_at: string | null }[] | null>(null);
  const [selected, setSelected] = useState<string>(companyId ? String(companyId) : '');
  const [vis, setVis] = useState<CompanyVisibility>(visibility ?? 'progress');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    companyService.forClient(clientId).then(setCompanies).catch(() => setCompanies([]));
  }, [clientId]);

  if (!companies || (companies.length === 0 && !companyId)) return null;

  const changed = selected !== (companyId ? String(companyId) : '') || vis !== (visibility ?? 'progress');
  const save = async () => {
    if (vis === 'full' && !window.confirm('L’entreprise verra aussi les formulaires et les documents de ce dossier. L’employé en sera informé dans son portail. Continuer ?')) return;
    setBusy(true);
    try {
      toast.success(await companyService.setDossierCompany(dossierId, { company_id: selected ? Number(selected) : null, company_visibility: vis }));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
        <PiBuildingOfficeDuotone className="h-5 w-5 text-blue-600" /> Entreprise
      </h2>
      <div className="mt-3 flex flex-wrap items-end gap-4 text-sm">
        <label className="text-gray-700">Dossier demandé par
          <select value={selected} onChange={(e) => setSelected(e.target.value)} className="mt-1 block rounded-lg border border-gray-300 px-3 py-2">
            <option value="">Aucune entreprise</option>
            {companies.filter((c) => !c.ended_at || String(c.id) === selected).map((c) => <option key={c.id} value={c.id}>{c.name}{c.ended_at ? ' (ancien employeur)' : ''}</option>)}
          </select>
        </label>
        {selected && (
          <fieldset className="text-gray-700">
            <legend>L’entreprise voit</legend>
            <label className="mr-4 inline-flex items-center gap-1.5"><input type="radio" checked={vis === 'progress'} onChange={() => setVis('progress')} /> L’avancement</label>
            <label className="inline-flex items-center gap-1.5"><input type="radio" checked={vis === 'full'} onChange={() => setVis('full')} /> Aussi formulaires et documents</label>
          </fieldset>
        )}
        <button onClick={save} disabled={busy || !changed} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {busy ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        {selected && <Link href={`/admin/entreprises/${selected}`} className="text-blue-700 hover:underline">Voir l’entreprise</Link>}
      </div>
      <p className="mt-2 text-xs text-gray-500">Avancement : statut, étapes faites, échéances. Les renseignements personnels de l’employé restent confidentiels tant que vous ne partagez pas davantage.</p>
    </section>
  );
}
