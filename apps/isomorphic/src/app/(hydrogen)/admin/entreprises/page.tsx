'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { PiBuildingOfficeDuotone, PiMagnifyingGlassBold, PiPlusBold } from 'react-icons/pi';
import { companyService, CompanySummary } from '@/services/companies';

/** Clients « entreprise » : employeurs qui envoient leurs employés au cabinet. */
export default function CompaniesPage() {
  const router = useRouter();
  const [items, setItems] = useState<CompanySummary[] | null>(null);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', business_number: '', email: '', phone: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => companyService.list(search).then(setItems).catch((e: any) => { toast.error(e.message); setItems([]); }), 250);
    return () => clearTimeout(t);
  }, [search]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const id = await companyService.create({ name: form.name.trim(), business_number: form.business_number || null, email: form.email || null, phone: form.phone || null });
      toast.success('Entreprise créée.');
      router.push(`/admin/entreprises/${id}`);
    } catch (err: any) {
      toast.error(err.message);
      setBusy(false);
    }
  };

  const input = 'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm';

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <PiBuildingOfficeDuotone className="mt-0.5 h-8 w-8 shrink-0 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Entreprises</h1>
            <p className="text-sm text-gray-600">Employeurs clients du cabinet : leurs employés, les dossiers qu’ils demandent et leur espace entreprise.</p>
          </div>
        </div>
        <button onClick={() => setCreating(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          <PiPlusBold className="h-4 w-4" /> Nouvelle entreprise
        </button>
      </header>

      {creating && (
        <form onSubmit={create} className="grid gap-3 rounded-xl border border-blue-200 bg-white p-4 shadow-sm sm:grid-cols-2">
          <label className="text-sm text-gray-700 sm:col-span-2">Nom de l’entreprise
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} autoFocus />
          </label>
          <label className="text-sm text-gray-700">NEQ ou numéro d’entreprise
            <input value={form.business_number} onChange={(e) => setForm({ ...form, business_number: e.target.value })} className={input} />
          </label>
          <label className="text-sm text-gray-700">Courriel de facturation
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={input} />
          </label>
          <label className="text-sm text-gray-700">Téléphone
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={input} />
          </label>
          <div className="flex items-end gap-2">
            <button disabled={busy || !form.name.trim()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{busy ? 'Création…' : 'Créer'}</button>
            <button type="button" onClick={() => setCreating(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700">Annuler</button>
          </div>
        </form>
      )}

      <label className="relative block max-w-sm">
        <PiMagnifyingGlassBold className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher (nom, NEQ)…" aria-label="Rechercher une entreprise"
          className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm" />
      </label>

      {items === null ? (
        <p className="py-10 text-center text-sm text-gray-500">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 bg-white py-10 text-center text-sm text-gray-500">Aucune entreprise pour le moment.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Entreprise</th>
                <th className="px-4 py-3 font-semibold">Employés</th>
                <th className="px-4 py-3 font-semibold">Dossiers ouverts</th>
                <th className="px-4 py-3 font-semibold">Demandes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/entreprises/${c.id}`} className="font-medium text-blue-700 hover:underline">{c.name}</Link>
                    <span className="block text-xs text-gray-500">{[c.business_number, c.sector, c.city].filter(Boolean).join(' · ')}{!c.is_active ? ' · inactive' : ''}</span>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{c.employees}</td>
                  <td className="px-4 py-3 tabular-nums">{c.open_dossiers}</td>
                  <td className="px-4 py-3">
                    {c.pending_requests > 0
                      ? <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">{c.pending_requests} à traiter</span>
                      : <span className="text-gray-400">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
