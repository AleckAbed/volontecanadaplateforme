'use client';

import { Suspense, use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PiCheckCircleFill, PiVideoCameraDuotone, PiReceiptDuotone } from 'react-icons/pi';
import { publicBookingService, PublicAppointment, APPOINTMENT_STATUS, formatPrice, tzCity } from '@/services/booking';
import CabinetLogo from '@/components/cabinet-logo';
import SlotPicker from '@/components/booking/slot-picker';

/** Rendez-vous consulté (et annulable) depuis le lien reçu par courriel. */
function ManageAppointment({ token }: { token: string }) {
  const params = useSearchParams() ?? new URLSearchParams();
  const payment = params.get('paiement');
  const isNew = params.get('nouveau') === '1';
  const [a, setA] = useState<PublicAppointment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
  const [movingBusy, setMovingBusy] = useState(false);

  const load = () => publicBookingService.appointment(token).then(setA).catch((e: any) => setError(e.message || 'Rendez-vous introuvable.'));

  useEffect(() => {
    load();
    // Au retour de Stripe, la confirmation (webhook) peut arriver quelques secondes après.
    if (payment === 'ok') {
      const t1 = setTimeout(load, 3000);
      const t2 = setTimeout(load, 8000);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, payment]);

  const cancel = async () => {
    setBusy(true);
    try {
      setMessage(await publicBookingService.cancel(token));
      setConfirming(false);
      await load();
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  };

  const move = async (start: string) => {
    setMovingBusy(true);
    try {
      setMessage(await publicBookingService.reschedule(token, start));
      setMoving(false);
      await load();
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setMovingBusy(false);
    }
  };

  if (error) {
    return <div role="alert" className="mx-auto mt-16 max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">{error}</div>;
  }
  if (!a) {
    return <div className="flex min-h-screen items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" aria-label="Chargement" /></div>;
  }

  const status = APPOINTMENT_STATUS[a.status] ?? { label: a.status, className: 'bg-gray-100 text-gray-700' };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-lg space-y-4">
        {a.status === 'confirmed' && (isNew || payment === 'ok') && (
          <p role="status" className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <PiCheckCircleFill className="h-5 w-5 text-emerald-600" /> Rendez-vous confirmé ! Un courriel avec l’invitation d’agenda vous a été envoyé.
          </p>
        )}
        {a.status === 'pending_payment' && payment === 'ok' && (
          <p role="status" className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-900">Paiement reçu : la confirmation arrive dans quelques instants.</p>
        )}
        {a.status === 'pending_payment' && payment !== 'ok' && (
          <p role="status" className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Ce rendez-vous sera confirmé après le paiement. Le créneau est retenu 30 minutes.
          </p>
        )}
        {a.status === 'expired' && (
          <p role="status" className="rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-700">Le paiement n’a pas été effectué à temps : ce créneau a été libéré.</p>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          {a.branding?.logo_url ? <CabinetLogo branding={a.branding} className="mb-2" /> : <p className="text-sm text-gray-500">{a.cabinet}</p>}
          <h1 className="mt-1 text-xl font-bold text-gray-900">{a.service ?? 'Rendez-vous'}</h1>
          <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}>{status.label}</span>

          <dl className="mt-4 space-y-2 text-sm">
            <div><dt className="inline font-medium text-gray-700">Quand : </dt><dd className="inline capitalize">{a.local_label}</dd> <span className="text-xs text-gray-500">(heure de {tzCity(a.timezone)}, {a.duration_minutes} min)</span></div>
            <div><dt className="inline font-medium text-gray-700">Format : </dt><dd className="inline">{a.meeting_mode_label}{a.location ? ` — ${a.location}` : ''}</dd></div>
            <div><dt className="inline font-medium text-gray-700">Au nom de : </dt><dd className="inline">{a.name}</dd></div>
          </dl>

          {a.meeting_url && (
            <a href={a.meeting_url} target="_blank" rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              <PiVideoCameraDuotone className="h-5 w-5" /> Rejoindre la visioconférence
            </a>
          )}
          {a.meeting_mode === 'video' && !a.meeting_url && a.status === 'confirmed' && (
            <p className="mt-4 text-sm text-gray-600">Le lien de la visioconférence vous sera transmis par votre conseiller.</p>
          )}

          {a.invoice && (
            <Link href={a.invoice.url} className="mt-4 flex items-center gap-2 text-sm text-blue-700 hover:underline">
              <PiReceiptDuotone className="h-5 w-5" /> Facture : {formatPrice(a.invoice.total)} {a.invoice.status === 'paid' ? '(payée)' : a.invoice.status === 'void' ? '(annulée)' : '(à régler)'}
            </Link>
          )}
        </div>

        {message && <p role="status" className="rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-800">{message}</p>}

        {a.can_reschedule && !confirming && !moving && (
          <button onClick={() => { setMoving(true); setMessage(null); }} className="w-full rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-50">
            Déplacer ce rendez-vous
          </button>
        )}
        {moving && (
          <div className="rounded-xl border border-blue-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Choisissez un nouveau créneau</h2>
              <button onClick={() => setMoving(false)} className="text-sm text-gray-500 hover:text-gray-800">Fermer</button>
            </div>
            <p className="mb-3 text-xs text-gray-600">
              Heure de {tzCity(a.timezone)}. {a.reschedules_left === 1 ? 'C’est votre dernier déplacement en ligne possible.' : `Vous pouvez encore déplacer ce rendez-vous ${a.reschedules_left} fois en ligne.`}
            </p>
            <SlotPicker load={(from) => publicBookingService.rescheduleSlots(token, from)} current={a.starts_at} onPick={move} busy={movingBusy} />
          </div>
        )}
        {a.can_cancel && !confirming && !moving && (
          <button onClick={() => setConfirming(true)} className="w-full rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50">
            Annuler ce rendez-vous
          </button>
        )}
        {confirming && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            <p>Confirmez-vous l’annulation ?{a.invoice?.status === 'paid' ? ' Pour un remboursement, contactez le cabinet.' : ''}</p>
            <div className="mt-3 flex gap-2">
              <button onClick={cancel} disabled={busy} className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50">{busy ? 'Annulation…' : 'Oui, annuler'}</button>
              <button onClick={() => setConfirming(false)} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700">Non</button>
            </div>
          </div>
        )}
        {!a.can_cancel && ['confirmed', 'pending_payment'].includes(a.status) && (
          <p className="text-center text-xs text-gray-500">L’annulation et le déplacement en ligne sont possibles jusqu’à {a.cancel_notice_hours} h avant le rendez-vous. Ensuite, contactez le cabinet.</p>
        )}
        {a.booking_url && ['cancelled', 'expired'].includes(a.status) && (
          <Link href={a.booking_url} className="block text-center text-sm font-medium text-blue-700 hover:underline">Réserver un autre rendez-vous</Link>
        )}
      </div>
    </div>
  );
}

export default function ManageAppointmentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  return <Suspense fallback={null}><ManageAppointment token={token} /></Suspense>;
}
