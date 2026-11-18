'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { PiVideoCameraDuotone, PiGoogleLogoBold } from 'react-icons/pi';
import { bookingAdminService, AdminAppointment, APPOINTMENT_STATUS } from '@/services/booking';

export default function AppointmentsTab() {
  const [scope, setScope] = useState<'upcoming' | 'past'>('upcoming');
  const [mine, setMine] = useState(false);
  const [items, setItems] = useState<AdminAppointment[] | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);

  const load = () => {
    setItems(null);
    bookingAdminService.appointments(scope, mine).then(setItems).catch((e: any) => { toast.error(e.message); setItems([]); });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [scope, mine]);

  const cancel = async (a: AdminAppointment) => {
    if (!window.confirm(`Annuler le rendez-vous de ${a.name} (${a.local_label}) ? Le client sera prévenu par courriel.`)) return;
    setCancelling(a.id);
    try {
      toast.success(await bookingAdminService.cancel(a.id));
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-gray-300 bg-white p-0.5 text-sm">
          {(['upcoming', 'past'] as const).map((s) => (
            <button key={s} onClick={() => setScope(s)} aria-pressed={scope === s}
              className={`rounded-md px-3 py-1.5 ${scope === s ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>
              {s === 'upcoming' ? 'À venir' : 'Passés'}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} /> Seulement les miens
        </label>
      </div>

      {items === null ? (
        <p className="py-10 text-center text-sm text-gray-500">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 bg-white py-10 text-center text-sm text-gray-500">
          {scope === 'upcoming' ? 'Aucun rendez-vous à venir.' : 'Aucun rendez-vous passé.'}
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {items.map((a) => {
            const st = APPOINTMENT_STATUS[a.status] ?? { label: a.status, className: 'bg-gray-100 text-gray-700' };
            return (
              <li key={a.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold capitalize text-gray-900">{a.local_label}</p>
                  <p className="text-sm text-gray-700">
                    {a.client_id ? <Link href={`/admin/clients/${a.client_id}`} className="text-blue-700 hover:underline">{a.name}</Link> : a.name}
                    {' · '}{a.service ?? 'Rendez-vous'}{a.host ? ` · avec ${a.host}` : ''}
                  </p>
                  <p className="text-xs text-gray-500">{a.email}{a.phone ? ` · ${a.phone}` : ''}</p>
                  {a.notes && <p className="mt-1 line-clamp-2 text-xs text-gray-600">« {a.notes} »</p>}
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${st.className}`}>{st.label}</span>
                  {a.in_google && <span title="Dans Google Agenda" className="text-emerald-600"><PiGoogleLogoBold className="h-4 w-4" /></span>}
                  {a.meeting_url && a.status === 'confirmed' && (
                    <a href={a.meeting_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100">
                      <PiVideoCameraDuotone className="h-4 w-4" /> Meet
                    </a>
                  )}
                  {a.invoice_id && <Link href={`/facturation/${a.invoice_id}`} className="text-xs text-blue-700 hover:underline">Facture</Link>}
                  {scope === 'upcoming' && a.status !== 'cancelled' && (
                    <button onClick={() => cancel(a)} disabled={cancelling === a.id} className="rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50">
                      Annuler
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
