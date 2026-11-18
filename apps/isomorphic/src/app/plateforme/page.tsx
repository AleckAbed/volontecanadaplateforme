'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { PiBuildingsDuotone, PiMagnifyingGlassBold, PiSignOutBold } from 'react-icons/pi';
import { platformService, PlatformCabinet } from '@/services/team';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Console de l'éditeur : cabinets inscrits, sièges, suspension. */
export default function PlatformConsolePage() {
  const router = useRouter();
  const [me, setMe] = useState<{ name: string; email: string } | null>(null);
  const [cabinets, setCabinets] = useState<PlatformCabinet[]>([]);
  const [totals, setTotals] = useState({ cabinets: 0, active: 0, seats: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    platformService.me()
      .then((res) => setMe(res.data))
      .catch(() => router.replace('/plateforme/connexion'));
  }, [router]);

  const load = async (q = search) => {
    try {
      setLoading(true);
      const data = await platformService.cabinets(q);
      setCabinets(data.cabinets);
      setTotals(data.totals);
    } catch (e: any) {
      toast.error(e.message || 'Chargement impossible.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (me) load(''); }, [me]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = async (c: PlatformCabinet) => {
    const verb = c.is_active ? 'Suspendre' : 'Réactiver';
    if (!confirm(`${verb} le cabinet « ${c.name} » ?${c.is_active ? ' Tout son personnel sera déconnecté.' : ''}`)) return;
    try {
      setBusyId(c.id);
      toast.success(await platformService.setActive(c.id, !c.is_active));
      await load();
    } catch (e: any) {
      toast.error(e.message || 'Action impossible.');
    } finally {
      setBusyId(null);
    }
  };

  const logout = async () => {
    await platformService.logout().catch(() => {});
    router.replace('/plateforme/connexion');
  };

  if (!me) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" aria-label="Chargement" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <PiBuildingsDuotone className="h-7 w-7 text-blue-600" />
            <div>
              <div className="text-sm font-bold text-gray-900">Console plateforme</div>
              <div className="text-xs text-gray-500">{me.name} · {me.email}</div>
            </div>
          </div>
          <button onClick={logout} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
            <PiSignOutBold className="h-4 w-4" /> Déconnexion
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-6 grid grid-cols-3 gap-3">
          {[
            { label: 'Cabinets', value: totals.cabinets },
            { label: 'Actifs', value: totals.active },
            { label: 'Sièges utilisés', value: totals.seats },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{s.label}</div>
              <div className="mt-1 text-2xl font-bold text-gray-900">{s.value}</div>
            </div>
          ))}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); load(search); }} className="mb-4 flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-2">
          <PiMagnifyingGlassBold className="ml-2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un cabinet…" aria-label="Rechercher un cabinet"
            className="flex-1 bg-transparent text-sm focus:outline-none" />
          <button type="submit" className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white">Rechercher</button>
        </form>

        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Cabinet</th>
                <th className="px-4 py-3 font-semibold">Propriétaire</th>
                <th className="px-4 py-3 text-right font-semibold">Sièges</th>
                <th className="px-4 py-3 text-right font-semibold">Clients</th>
                <th className="px-4 py-3 text-right font-semibold">Dossiers</th>
                <th className="px-4 py-3 font-semibold">Inscrit le</th>
                <th className="px-4 py-3 font-semibold">Dernière activité</th>
                <th className="px-4 py-3 font-semibold">Abonnement</th>
                <th className="px-4 py-3 text-right font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">Chargement…</td></tr>
              ) : cabinets.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">Aucun cabinet.</td></tr>
              ) : cabinets.map((c) => (
                <tr key={c.id} className={c.is_active ? '' : 'bg-red-50/40'}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{c.name}</div>
                    <div className="text-xs text-gray-500">{c.slug}{c.province ? ` · ${c.province}` : ''}</div>
                  </td>
                  <td className="px-4 py-3">
                    {c.owner ? <><div className="text-gray-800">{c.owner.name}</div><div className="text-xs text-gray-500">{c.owner.email}</div></> : '—'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{c.seats_used}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{c.clients_count}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{c.dossiers_count}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(c.created_at)}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(c.last_login_at)}</td>
                  <td className="px-4 py-3 text-xs">
                    <div className={c.subscription_status === 'active' ? 'font-medium text-emerald-700' : c.subscription_status === 'trialing' ? 'text-gray-700' : 'font-medium text-red-700'}>
                      {{ trialing: 'Essai', active: 'Actif', past_due: 'En retard', canceled: 'Résilié', unpaid: 'Impayé' }[c.subscription_status] ?? c.subscription_status}
                      {c.subscription_status === 'trialing' && c.trial_ends_at ? ` → ${formatDate(c.trial_ends_at)}` : ''}
                    </div>
                    <div className="text-gray-500">{c.payments_enabled ? 'Encaisse en ligne' : 'Pas d’encaissement en ligne'}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => toggle(c)} disabled={busyId === c.id}
                      className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium disabled:opacity-50 ${
                        c.is_active ? 'border-red-200 text-red-700 hover:bg-red-50' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                      }`}>
                      {c.is_active ? 'Suspendre' : 'Réactiver'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
