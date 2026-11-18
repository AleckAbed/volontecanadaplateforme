'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { PiVideoCameraDuotone, PiGoogleLogoBold, PiNotePencilDuotone, PiCalendarBlankDuotone, PiXBold } from 'react-icons/pi';
import {
  bookingAdminService,
  AdminAppointment,
  AppointmentOutcome,
  APPOINTMENT_STATUS,
  APPOINTMENT_OUTCOME,
} from '@/services/booking';
import SlotPicker from '@/components/booking/slot-picker';

export default function AppointmentsTab() {
  const params = useSearchParams();
  const [scope, setScope] = useState<'upcoming' | 'past'>(params?.get('onglet') === 'passes' ? 'past' : 'upcoming');
  const [mine, setMine] = useState(false);
  const [items, setItems] = useState<AdminAppointment[] | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [moving, setMoving] = useState<AdminAppointment | null>(null);
  const [following, setFollowing] = useState<AdminAppointment | null>(null);

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
            const toDocument = scope === 'past' && a.status === 'confirmed' && !a.outcome;
            return (
              <li key={a.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold capitalize text-gray-900">{a.local_label}</p>
                  <p className="text-sm text-gray-700">
                    {a.client_id ? <Link href={`/admin/clients/${a.client_id}`} className="text-blue-700 hover:underline">{a.name}</Link> : a.name}
                    {' · '}{a.service ?? 'Rendez-vous'}{a.host ? ` · avec ${a.host}` : ''}
                    {a.dossier_id && <> · <Link href={`/admin/dossiers/${a.dossier_id}`} className="text-blue-700 hover:underline">dossier</Link></>}
                  </p>
                  <p className="text-xs text-gray-500">{a.email}{a.phone ? ` · ${a.phone}` : ''}{a.reschedule_count > 0 ? ` · déplacé ${a.reschedule_count} fois` : ''}</p>
                  {a.notes && <p className="mt-1 line-clamp-2 text-xs text-gray-600">Client : « {a.notes} »</p>}
                  {a.staff_notes && <p className="mt-1 line-clamp-2 text-xs text-gray-800">Notes : {a.staff_notes}</p>}
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${st.className}`}>{st.label}</span>
                  {a.outcome && <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${APPOINTMENT_OUTCOME[a.outcome].className}`}>{APPOINTMENT_OUTCOME[a.outcome].label}</span>}
                  {toDocument && <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">À documenter</span>}
                  {a.in_google && <span title="Dans Google Agenda" className="text-emerald-600"><PiGoogleLogoBold className="h-4 w-4" /></span>}
                  {a.meeting_url && a.status === 'confirmed' && scope === 'upcoming' && (
                    <a href={a.meeting_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100">
                      <PiVideoCameraDuotone className="h-4 w-4" /> Meet
                    </a>
                  )}
                  {a.invoice_id && <Link href={`/facturation/${a.invoice_id}`} className="text-xs text-blue-700 hover:underline">Facture</Link>}
                  {a.status === 'confirmed' && (
                    <button onClick={() => setFollowing(a)} className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50">
                      <PiNotePencilDuotone className="h-4 w-4" /> Suivi
                    </button>
                  )}
                  {scope === 'upcoming' && a.status === 'confirmed' && (
                    <button onClick={() => setMoving(a)} className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50">
                      <PiCalendarBlankDuotone className="h-4 w-4" /> Déplacer
                    </button>
                  )}
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

      {moving && <MoveDialog appointment={moving} onClose={() => setMoving(null)} onDone={() => { setMoving(null); load(); }} />}
      {following && <FollowUpDialog appointment={following} past={scope === 'past'} onClose={() => setFollowing(null)} onDone={() => { setFollowing(null); load(); }} />}
    </div>
  );
}

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} aria-label="Fermer" className="text-gray-500 hover:text-gray-800"><PiXBold className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function MoveDialog({ appointment, onClose, onDone }: { appointment: AdminAppointment; onClose: () => void; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const move = async (start: string) => {
    setBusy(true);
    try {
      toast.success(await bookingAdminService.reschedule(appointment.id, start));
      onDone();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog title={`Déplacer le rendez-vous de ${appointment.name}`} onClose={onClose}>
      <p className="mb-3 text-sm text-gray-600">Actuellement : <span className="capitalize">{appointment.local_label}</span>. Le client recevra une nouvelle invitation par courriel.</p>
      <SlotPicker load={(from) => bookingAdminService.rescheduleSlots(appointment.id, from)} current={appointment.starts_at} onPick={move} busy={busy} />
    </Dialog>
  );
}

function FollowUpDialog({ appointment, past, onClose, onDone }: { appointment: AdminAppointment; past: boolean; onClose: () => void; onDone: () => void }) {
  const [outcome, setOutcome] = useState<AppointmentOutcome | ''>(appointment.outcome ?? '');
  const [notes, setNotes] = useState(appointment.staff_notes ?? '');
  const [dossierId, setDossierId] = useState<string>(appointment.dossier_id ? String(appointment.dossier_id) : '');
  const [dossiers, setDossiers] = useState<{ id: number; name: string }[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (appointment.client_id) bookingAdminService.clientDossiers(appointment.client_id).then(setDossiers).catch(() => setDossiers([]));
  }, [appointment.client_id]);

  const save = async () => {
    setBusy(true);
    try {
      toast.success(await bookingAdminService.followUp(appointment.id, {
        ...(past ? { outcome: outcome || null } : {}),
        staff_notes: notes.trim() || null,
        dossier_id: dossierId ? Number(dossierId) : null,
      }));
      onDone();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog title={`Suivi du rendez-vous de ${appointment.name}`} onClose={onClose}>
      <div className="space-y-4 text-sm">
        <p className="capitalize text-gray-600">{appointment.local_label} · {appointment.service ?? 'Rendez-vous'}</p>
        {past && (
          <fieldset>
            <legend className="font-medium text-gray-700">Le rendez-vous</legend>
            <div className="mt-1 flex flex-wrap gap-3">
              {([['', 'Pas encore noté'], ['held', 'A eu lieu'], ['no_show', 'Client absent']] as const).map(([v, l]) => (
                <label key={v} className="flex items-center gap-1.5">
                  <input type="radio" name="outcome" checked={outcome === v} onChange={() => setOutcome(v)} /> {l}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <label className="block">
          <span className="font-medium text-gray-700">Dossier lié</span>
          <select value={dossierId} onChange={(e) => setDossierId(e.target.value)} disabled={!appointment.client_id}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2">
            <option value="">Aucun</option>
            {dossiers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="font-medium text-gray-700">Notes du rendez-vous (internes)</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} maxLength={10000}
            placeholder="Ce qui a été dit, conseillé, convenu ; prochaines étapes."
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2" />
          <span className="text-xs text-gray-500">Visibles seulement par le cabinet ; elles apparaissent dans le dossier lié.</span>
        </label>
        <div className="flex gap-2">
          <button onClick={save} disabled={busy} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {busy ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700">Annuler</button>
        </div>
      </div>
    </Dialog>
  );
}
