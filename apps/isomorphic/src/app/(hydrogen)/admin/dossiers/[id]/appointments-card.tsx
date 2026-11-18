'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PiCalendarCheckDuotone } from 'react-icons/pi';
import { bookingAdminService, DossierAppointment, APPOINTMENT_OUTCOME, APPOINTMENT_STATUS } from '@/services/booking';

/** Rendez-vous du client dans la fiche du dossier (3.11) : issue et notes du personnel. */
export default function AppointmentsCard({ dossierId }: { dossierId: number }) {
  const [items, setItems] = useState<DossierAppointment[] | null>(null);

  useEffect(() => {
    bookingAdminService.forDossier(dossierId).then(setItems).catch(() => setItems([]));
  }, [dossierId]);

  if (!items || items.length === 0) return null;

  return (
    <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
          <PiCalendarCheckDuotone className="h-5 w-5 text-blue-600" /> Rendez-vous
        </h2>
        <Link href="/admin/rendez-vous" className="text-sm text-blue-700 hover:underline">Gérer les rendez-vous</Link>
      </div>
      <ul className="divide-y divide-gray-100">
        {items.map((a) => {
          const st = APPOINTMENT_STATUS[a.status] ?? { label: a.status, className: 'bg-gray-100 text-gray-700' };
          return (
            <li key={a.id} className="py-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium capitalize text-gray-900">{a.local_label}</span>
                <span className="text-gray-600">· {a.service ?? 'Rendez-vous'}{a.host ? ` avec ${a.host}` : ''}</span>
                {a.status === 'cancelled' && <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.className}`}>{st.label}</span>}
                {a.outcome && <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${APPOINTMENT_OUTCOME[a.outcome].className}`}>{APPOINTMENT_OUTCOME[a.outcome].label}</span>}
                {a.is_past && a.status === 'confirmed' && !a.outcome && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">À documenter</span>}
                {!a.linked && <span className="text-xs text-gray-400">(non lié à ce dossier)</span>}
              </div>
              {a.client_notes && <p className="mt-1 text-xs text-gray-600">Client : « {a.client_notes} »</p>}
              {a.staff_notes && <p className="mt-1 whitespace-pre-line text-gray-800">{a.staff_notes}</p>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
