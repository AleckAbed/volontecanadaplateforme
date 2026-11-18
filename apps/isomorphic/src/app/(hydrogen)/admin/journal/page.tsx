'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { PiListMagnifyingGlassDuotone } from 'react-icons/pi';
import { auditService, AuditPage, AuditFilters, AuditItem } from '@/services/security';

const FILTER_KEYS = ['action', 'subject_type', 'actor', 'dossier_id', 'client_id', 'from', 'to', 'page'] as const;

const ACTOR_KIND: Record<AuditItem['actor_type'], string> = {
  admin: '',
  collaborator: 'Collaborateur',
  client: 'Client (portail)',
  public: 'Client (lien)',
  system: 'Tâche automatique',
};

function formatAt(iso: string) {
  return new Date(iso).toLocaleString('fr-CA', { dateStyle: 'medium', timeStyle: 'short' });
}

/** Journal d'activité du cabinet (2.6) : qui a vu, modifié, téléchargé ou supprimé quoi, et quand. */
function Journal() {
  const params = useSearchParams() ?? new URLSearchParams();
  const router = useRouter();
  const filters: AuditFilters = Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) ?? ''])) as AuditFilters;
  const [data, setData] = useState<AuditPage | null>(null);
  const [loading, setLoading] = useState(true);
  const key = params.toString();

  const load = useCallback(() => {
    setLoading(true);
    auditService.list(filters).then(setData).catch((e: any) => toast.error(e.message)).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => { load(); }, [load]);

  const setFilter = (k: string, v: string) => {
    const next = new URLSearchParams(params.toString());
    v ? next.set(k, v) : next.delete(k);
    if (k !== 'page') next.delete('page');
    router.replace(`/admin/journal${next.toString() ? `?${next}` : ''}`);
  };

  const scoped = filters.dossier_id || filters.client_id;
  const scopeName = data?.items.find((i) => (filters.dossier_id ? i.dossier?.id === Number(filters.dossier_id) : i.client?.id === Number(filters.client_id)));

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
      <header className="flex items-start gap-3">
        <PiListMagnifyingGlassDuotone className="mt-0.5 h-8 w-8 shrink-0 text-blue-600" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">Journal d’activité</h1>
          <p className="text-sm text-gray-600">
            Qui a consulté, modifié, téléchargé ou supprimé quoi, et quand. Le journal ne se modifie pas ; il garde les identifiants, pas les renseignements des clients.
          </p>
        </div>
      </header>

      {scoped && (
        <p className="flex flex-wrap items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-900">
          Historique {filters.dossier_id ? `du dossier ${scopeName?.dossier?.name ?? `n° ${filters.dossier_id}`}` : `de ${scopeName?.client?.name ?? `client n° ${filters.client_id}`}`}
          <button onClick={() => router.replace('/admin/journal')} className="font-semibold underline">Voir tout le journal</button>
        </p>
      )}

      <div className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
        <Select label="Personne" value={filters.actor ?? ''} onChange={(v) => setFilter('actor', v)}
          options={[['', 'Tout le monde'], ['client', 'Clients (portail)'], ['public', 'Clients (lien)'], ['system', 'Tâches automatiques'], ...(data?.actors ?? []).map((a) => [a.value, a.label] as [string, string])]} />
        <Select label="Action" value={filters.action ?? ''} onChange={(v) => setFilter('action', v)}
          options={[['', 'Toutes'], ...Object.entries(data?.actions ?? {})]} />
        <Select label="Élément" value={filters.subject_type ?? ''} onChange={(v) => setFilter('subject_type', v)}
          options={[['', 'Tous'], ...Object.entries(data?.subjects ?? {})]} />
        <label className="text-sm text-gray-700">Du
          <input type="date" value={filters.from ?? ''} onChange={(e) => setFilter('from', e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-2 py-1.5" />
        </label>
        <label className="text-sm text-gray-700">Au
          <input type="date" value={filters.to ?? ''} onChange={(e) => setFilter('to', e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-2 py-1.5" />
        </label>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Personne</th>
              <th className="px-4 py-3 font-semibold">Action</th>
              <th className="px-4 py-3 font-semibold">Élément</th>
              <th className="px-4 py-3 font-semibold">Dossier / client</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && !data ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Chargement…</td></tr>
            ) : data?.items.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Aucune activité pour ces critères.</td></tr>
            ) : data?.items.map((i) => (
              <tr key={i.id} className="align-top">
                <td className="whitespace-nowrap px-4 py-2.5 text-gray-600">{formatAt(i.at)}</td>
                <td className="px-4 py-2.5">
                  <span className="text-gray-900">{i.actor_type === 'admin' || i.actor_type === 'collaborator' ? i.actor_name : ACTOR_KIND[i.actor_type]}</span>
                  {i.actor_type === 'collaborator' && <span className="block text-xs text-gray-500">Collaborateur</span>}
                  {i.ip && <span className="block text-xs text-gray-400">{i.ip}</span>}
                </td>
                <td className={`px-4 py-2.5 ${/failed|deleted|reset/.test(i.action) ? 'text-red-700' : 'text-gray-800'}`}>
                  {i.action_label}
                  {i.fields?.length ? <span className="block text-xs text-gray-500">Champs : {i.fields.join(', ')}</span> : null}
                </td>
                <td className="px-4 py-2.5 text-gray-700">{i.subject_label ?? '—'}</td>
                <td className="px-4 py-2.5">
                  {i.dossier && (i.dossier.exists
                    ? <Link href={`/admin/dossiers/${i.dossier.id}`} className="block text-blue-700 hover:underline">{i.dossier.name}</Link>
                    : <span className="block text-gray-500">{i.dossier.name}</span>)}
                  {i.client && (i.client.exists
                    ? <Link href={`/admin/clients/${i.client.id}`} className="block text-xs text-gray-600 hover:underline">{i.client.name}</Link>
                    : <span className="block text-xs text-gray-500">{i.client.name}</span>)}
                  {!i.dossier && !i.client && <span className="text-gray-400">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.last_page > 1 && (
        <nav className="flex items-center justify-between text-sm" aria-label="Pages du journal">
          <span className="text-gray-600">{data.total} entrées — page {data.page} sur {data.last_page}</span>
          <span className="flex gap-2">
            <button disabled={data.page <= 1} onClick={() => setFilter('page', String(data.page - 1))} className="rounded-lg border border-gray-300 px-3 py-1.5 disabled:opacity-40">Précédente</button>
            <button disabled={data.page >= data.last_page} onClick={() => setFilter('page', String(data.page + 1))} className="rounded-lg border border-gray-300 px-3 py-1.5 disabled:opacity-40">Suivante</button>
          </span>
        </nav>
      )}
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <label className="text-sm text-gray-700">{label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-2 py-1.5">
        {options.map(([v, l]) => <option key={v || 'all'} value={v}>{l}</option>)}
      </select>
    </label>
  );
}

export default function Page() {
  return <Suspense fallback={null}><Journal /></Suspense>;
}
