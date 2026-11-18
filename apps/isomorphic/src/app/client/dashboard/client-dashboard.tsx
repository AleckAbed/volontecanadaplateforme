'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PiFolderUserDuotone,
  PiClipboardTextDuotone,
  PiUserCircleDuotone,
  PiCheckCircleFill,
  PiCircleDashedBold,
  PiArrowRightBold,
  PiReceiptDuotone,
} from 'react-icons/pi';
import { clientPortalService, PortalOverview, PortalTask } from '@/services/client-profile';
import { publicInvoiceService, InvoiceSummary, INVOICE_STATUS, formatMoney } from '@/services/billing';
import MyDataCard from './my-data-card';

function formatDate(d: string | null): string {
  if (!d) return '—';
  return new Date(`${d}T12:00:00`).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Portail client : dossiers, démarches à compléter, profil d'immigration.
 */
export default function ClientDashboard() {
  const router = useRouter();
  const [data, setData] = useState<PortalOverview | null>(null);
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setError(null);
    clientPortalService.overview().then(setData).catch((e: any) => setError(e.message || 'Chargement impossible.'));
    publicInvoiceService.forClient().then(setInvoices).catch(() => setInvoices([]));
  };

  useEffect(load, []);

  const openTask = (task: PortalTask) => {
    // La page d'invitation exige une vérification préalable : le client
    // authentifié ouvre son propre lien, on la marque comme faite.
    try { sessionStorage.setItem('invitation_code', task.code); } catch {}
    router.push(`/invitation/${task.code}`);
  };

  if (error) {
    return (
      <div role="alert" className="m-4 rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 sm:m-6">
        {error} <button onClick={load} className="ml-2 font-semibold underline">Réessayer</button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4 p-4 sm:p-6">
        {[1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-100" />)}
      </div>
    );
  }

  const openTasks = data.tasks.filter((t) => t.status !== 'completed' && !t.is_expired);
  const doneTasks = data.tasks.filter((t) => t.status === 'completed');
  const profilePct = data.profile.total ? Math.round((data.profile.filled / data.profile.total) * 100) : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <header>
        <p className="text-sm text-gray-500">{data.cabinet.name}</p>
        <h1 className="text-2xl font-bold text-gray-900">Bonjour {data.client.first_name}</h1>
        <p className="mt-1 text-sm text-gray-600">
          {openTasks.length > 0
            ? `Vous avez ${openTasks.length} démarche${openTasks.length > 1 ? 's' : ''} à compléter.`
            : 'Rien à compléter pour le moment. Votre cabinet vous préviendra par courriel.'}
        </p>
      </header>

      {/* Profil */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <PiUserCircleDuotone className="h-8 w-8 shrink-0 text-blue-600" />
            <div>
              <h2 className="font-semibold text-gray-900">Votre profil</h2>
              <p className="text-sm text-gray-600">
                Vous répondez une fois : ces informations préremplissent vos formulaires.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-2 w-40 overflow-hidden rounded-full bg-gray-100" role="progressbar" aria-valuenow={profilePct} aria-valuemin={0} aria-valuemax={100} aria-label="Profil complété">
                  <div className="h-full rounded-full bg-blue-600" style={{ width: `${profilePct}%` }} />
                </div>
                <span className="text-xs text-gray-600">{data.profile.filled} / {data.profile.total} informations</span>
              </div>
            </div>
          </div>
          <Link href="/client/profil" className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            {profilePct < 100 ? 'Compléter mon profil' : 'Voir mon profil'} <PiArrowRightBold className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Démarches */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
          <PiClipboardTextDuotone className="h-5 w-5 text-blue-600" /> À compléter
        </h2>
        {openTasks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">Aucune démarche en attente.</p>
        ) : (
          <div className="space-y-3">
            {openTasks.map((t) => <TaskCard key={t.id} task={t} onOpen={() => openTask(t)} />)}
          </div>
        )}
      </section>

      {/* Dossiers */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
          <PiFolderUserDuotone className="h-5 w-5 text-blue-600" /> Vos dossiers
        </h2>
        {data.dossiers.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">Aucun dossier pour le moment.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {data.dossiers.map((d) => (
              <div key={d.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium text-gray-900">{d.name}</div>
                    {d.service_name && <div className="text-sm text-gray-600">{d.service_name}</div>}
                  </div>
                  {d.status && <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{d.status_label ?? d.status}</span>}
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div><dt className="text-gray-500">Pour</dt><dd className="text-gray-800">{d.for}</dd></div>
                  <div><dt className="text-gray-500">Ouvert le</dt><dd className="text-gray-800">{formatDate(d.opened_at)}</dd></div>
                  {d.deadline_at && <div className="col-span-2"><dt className="text-gray-500">Échéance</dt><dd className="font-medium text-gray-900">{formatDate(d.deadline_at)}</dd></div>}
                </dl>
                {d.company && (
                  <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">
                    Dossier suivi par votre employeur <strong>{d.company.name}</strong> : {d.company.visibility === 'full'
                      ? 'il voit l’avancement, les formulaires et les documents de ce dossier (sans pouvoir les ouvrir).'
                      : 'il voit seulement l’avancement (statut, étapes, échéances).'}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {invoices.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
            <PiReceiptDuotone className="h-5 w-5 text-blue-600" /> Vos factures
          </h2>
          <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {invoices.map((inv) => (
              <li key={inv.id}>
                <Link href={inv.url ?? '#'} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50">
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-gray-900">Facture {inv.number}</span>
                    <span className="block text-xs text-gray-600">
                      {inv.status === 'paid' ? `Payée le ${formatDate(inv.paid_at)}` : inv.due_date ? `À payer avant le ${formatDate(inv.due_date)}` : 'À payer'}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-semibold tabular-nums text-gray-900">{formatMoney(inv.total_cents)}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${INVOICE_STATUS[inv.status].className}`}>{INVOICE_STATUS[inv.status].label}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {doneTasks.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Démarches terminées</h2>
          <ul className="space-y-1 text-sm text-gray-600">
            {doneTasks.map((t) => (
              <li key={t.id} className="flex items-center gap-2">
                <PiCheckCircleFill className="h-4 w-4 text-emerald-600" />
                {t.items.map((i) => i.name).join(', ')} — envoyé le {formatDate(t.sent_at)}
              </li>
            ))}
          </ul>
        </section>
      )}

      <MyDataCard />
    </div>
  );
}

function TaskCard({ task, onOpen }: { task: PortalTask; onOpen: () => void }) {
  const pct = task.items_total ? Math.round((task.items_done / task.items_total) * 100) : 0;
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="text-sm text-gray-500">
            Envoyé le {formatDate(task.sent_at)}{task.expires_at && ` · à compléter avant le ${formatDate(task.expires_at)}`}
          </div>
          {task.message && <p className="mt-1 text-sm text-gray-700">{task.message}</p>}
          <ul className="mt-2 space-y-1">
            {task.items.map((i, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm">
                {i.done
                  ? <PiCheckCircleFill className="h-4 w-4 shrink-0 text-emerald-600" aria-label="Fait" />
                  : <PiCircleDashedBold className="h-4 w-4 shrink-0 text-gray-400" aria-label="À faire" />}
                <span className={i.done ? 'text-gray-500 line-through' : 'text-gray-800'}>{i.name}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
          <span className="text-xs text-gray-600">{task.items_done} / {task.items_total} ({pct} %)</span>
          <button onClick={onOpen} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            {task.items_done > 0 ? 'Continuer' : 'Commencer'} <PiArrowRightBold className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
