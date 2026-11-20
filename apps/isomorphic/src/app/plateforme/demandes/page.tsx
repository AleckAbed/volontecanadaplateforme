'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { PiBuildingsDuotone, PiCheckBold, PiXBold } from 'react-icons/pi';
import { platformService, CabinetRequestItem, CabinetRequestStatus } from '@/services/team';

const TABS: { key: CabinetRequestStatus | 'all'; label: string }[] = [
  { key: 'pending', label: 'En attente' },
  { key: 'approved', label: 'Acceptées' },
  { key: 'declined', label: 'Refusées' },
  { key: 'all', label: 'Toutes' },
];

const STATUS_BADGE: Record<CabinetRequestStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  declined: 'bg-gray-200 text-gray-700',
};

const STATUS_LABEL: Record<CabinetRequestStatus, string> = { pending: 'En attente', approved: 'Acceptée', declined: 'Refusée' };

/**
 * Console plateforme : demandes d'ouverture de cabinet. Accepter crée le cabinet et
 * envoie au propriétaire son lien d'activation ; refuser répond (ou non) au demandeur.
 */
export default function PlatformRequestsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<CabinetRequestStatus | 'all'>('pending');
  const [items, setItems] = useState<CabinetRequestItem[] | null>(null);
  const [pending, setPending] = useState(0);
  const [busy, setBusy] = useState<number | null>(null);
  const [declining, setDeclining] = useState<CabinetRequestItem | null>(null);
  const [reason, setReason] = useState('');
  const [notify, setNotify] = useState(true);

  const load = () => platformService.cabinetRequests(tab)
    .then((r) => { setItems(r.items); setPending(r.pending); })
    .catch((e: any) => {
      if (/401|Unauthenticated|session|reconnect/i.test(e.message)) router.replace('/plateforme/connexion');
      else toast.error(e.message);
    });

  useEffect(() => {
    setItems(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const approve = async (r: CabinetRequestItem) => {
    if (!window.confirm(`Créer le cabinet « ${r.cabinet_name} » et envoyer le lien d’activation à ${r.email} ?`)) return;
    setBusy(r.id);
    try {
      toast.success(await platformService.approveCabinetRequest(r.id));
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  const decline = async () => {
    if (!declining) return;
    setBusy(declining.id);
    try {
      toast.success(await platformService.declineCabinetRequest(declining.id, reason, notify));
      setDeclining(null);
      setReason('');
      setNotify(true);
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <PiBuildingsDuotone className="mt-0.5 h-8 w-8 shrink-0 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Demandes d’ouverture</h1>
              <p className="text-sm text-gray-600">Les cabinets qui souhaitent rejoindre la plateforme. {pending > 0 && <strong>{pending} en attente.</strong>}</p>
            </div>
          </div>
          <Link href="/plateforme" className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">← Console</Link>
        </header>

        <nav className="flex flex-wrap gap-2" aria-label="Filtrer les demandes">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} aria-pressed={tab === t.key}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${tab === t.key ? 'bg-blue-600 text-white' : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}>
              {t.label}
            </button>
          ))}
        </nav>

        {items === null ? (
          <p className="text-sm text-gray-500">Chargement…</p>
        ) : items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">Aucune demande dans cette liste.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((r) => (
              <li key={r.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5" data-testid="cabinet-request">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-gray-900">{r.cabinet_name}</h2>
                      {r.province && <span className="text-xs text-gray-500">{r.province}</span>}
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[r.status]}`}>{STATUS_LABEL[r.status]}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-700">{r.contact_name} · <a href={`mailto:${r.email}`} className="text-blue-700 hover:underline">{r.email}</a>{r.phone ? ` · ${r.phone}` : ''}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Reçue le {new Date(r.created_at).toLocaleString('fr-CA')}
                      {r.team_size ? ` · Équipe : ${r.team_size}` : ''}
                      {r.license_number ? ` · N° CICC : ${r.license_number}` : ''}
                    </p>
                    {r.message && <p className="mt-2 whitespace-pre-line rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">{r.message}</p>}
                    {r.status === 'declined' && r.decline_reason && <p className="mt-2 text-xs text-gray-500">Motif du refus : {r.decline_reason}</p>}
                  </div>
                  {r.status === 'pending' && (
                    <div className="flex shrink-0 gap-2">
                      <button onClick={() => approve(r)} disabled={busy === r.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60">
                        <PiCheckBold className="h-4 w-4" /> Accepter
                      </button>
                      <button onClick={() => setDeclining(r)} disabled={busy === r.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">
                        <PiXBold className="h-4 w-4" /> Refuser
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      {declining && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-[6px]" role="dialog" aria-modal="true" aria-labelledby="decline-title">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h2 id="decline-title" className="text-lg font-semibold text-gray-900">Refuser « {declining.cabinet_name} »</h2>
            <label htmlFor="decline-reason" className="mt-4 block text-sm font-medium text-gray-700">Motif (envoyé au demandeur)</label>
            <textarea id="decline-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={4}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Ex. nous n’avons pas pu vérifier votre numéro de membre du CICC." />
            <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
              Prévenir le demandeur par courriel
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setDeclining(null)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">Annuler</button>
              <button onClick={decline} disabled={busy === declining.id} className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                Refuser la demande
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
