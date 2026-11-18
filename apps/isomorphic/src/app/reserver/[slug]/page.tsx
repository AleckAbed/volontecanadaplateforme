'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PiArrowLeftBold, PiCaretLeftBold, PiCaretRightBold, PiClockDuotone, PiVideoCameraDuotone,
  PiPhoneDuotone, PiMapPinDuotone, PiCalendarCheckDuotone,
} from 'react-icons/pi';
import { publicBookingService, PublicBookingPage, SlotsResponse, formatPrice, MeetingMode, tzCity } from '@/services/booking';
import CabinetLogo from '@/components/cabinet-logo';

const MODE_ICON: Record<MeetingMode, typeof PiVideoCameraDuotone> = {
  video: PiVideoCameraDuotone,
  phone: PiPhoneDuotone,
  in_person: PiMapPinDuotone,
};

const DAYS_PER_PAGE = 7;

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function dayLabel(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
}

const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200';

/** Page publique de réservation d'un cabinet. */
export default function BookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [page, setPage] = useState<PublicBookingPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [from, setFrom] = useState<string | null>(null);
  const [slots, setSlots] = useState<SlotsResponse | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [start, setStart] = useState<{ start: string; date: string; time: string } | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '', consent: false });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    publicBookingService.page(slug).then(setPage).catch((e: any) => setError(e.message || 'Page introuvable.'));
  }, [slug]);

  const service = page?.services.find((s) => s.id === serviceId) ?? null;

  useEffect(() => {
    if (!serviceId) return;
    setLoadingSlots(true);
    publicBookingService.slots(slug, serviceId, from ?? new Date().toISOString().slice(0, 10), DAYS_PER_PAGE)
      .then((r) => { setSlots(r); if (!from) setFrom(r.from); })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoadingSlots(false));
  }, [slug, serviceId, from]);

  const byDay = useMemo(() => {
    const map = new Map<string, SlotsResponse['slots']>();
    slots?.slots.forEach((s) => map.set(s.date, [...(map.get(s.date) ?? []), s]));
    return map;
  }, [slots]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service || !start) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await publicBookingService.book(slug, {
        service_id: service.id, start: start.start, name: form.name, email: form.email,
        phone: form.phone || undefined, notes: form.notes || undefined, consent: form.consent,
      });
      if (res.checkout_url) {
        window.location.href = res.checkout_url;
        return;
      }
      router.push(`/rendez-vous/${res.token}?nouveau=1`);
    } catch (err: any) {
      setSubmitError(err.message || 'La réservation a échoué.');
      setSubmitting(false);
      // Créneau pris entre-temps : on rafraîchit la liste.
      if (serviceId) publicBookingService.slots(slug, serviceId, from ?? '', DAYS_PER_PAGE).then(setSlots).catch(() => {});
    }
  };

  if (error && !page) {
    return <div role="alert" className="mx-auto mt-16 max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">{error}</div>;
  }
  if (!page) {
    return <div className="flex min-h-screen items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" aria-label="Chargement" /></div>;
  }

  const today = new Date().toISOString().slice(0, 10);
  const canGoBack = !!from && from > today;
  const canGoForward = !!slots && addDays(slots.to, 1) <= slots.max_date;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 text-center">
          {page.cabinet.branding?.logo_url && <CabinetLogo branding={page.cabinet.branding} className="mx-auto mb-3" />}
          <h1 className="text-2xl font-bold text-gray-900">{page.cabinet.name}</h1>
          <p className="mt-1 text-sm text-gray-600">Prendre rendez-vous en ligne</p>
          {page.cabinet.intro && <p className="mx-auto mt-3 max-w-xl whitespace-pre-line text-sm text-gray-700">{page.cabinet.intro}</p>}
        </header>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          {!service && (
            <>
              <h2 className="mb-4 text-lg font-semibold text-gray-900">1. Choisissez une prestation</h2>
              {page.services.length === 0 && <p className="text-sm text-gray-600">Aucune prestation n’est ouverte à la réservation pour le moment.</p>}
              <ul className="space-y-3">
                {page.services.map((s) => {
                  const Icon = MODE_ICON[s.meeting_mode];
                  return (
                    <li key={s.id}>
                      <button onClick={() => { setServiceId(s.id); setFrom(null); setStart(null); }}
                        className="w-full rounded-xl border border-gray-200 p-4 text-left transition hover:border-blue-400 hover:bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-blue-300">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <span className="font-semibold text-gray-900">{s.name}</span>
                          <span className="text-sm font-semibold text-blue-700">{formatPrice(s.price)}{s.price > 0 && s.taxable ? ' + taxes' : ''}</span>
                        </div>
                        {s.description && <p className="mt-1 whitespace-pre-line text-sm text-gray-600">{s.description}</p>}
                        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                          <span className="inline-flex items-center gap-1"><PiClockDuotone className="h-4 w-4" /> {s.duration_minutes} min</span>
                          <span className="inline-flex items-center gap-1"><Icon className="h-4 w-4" /> {s.meeting_mode_label}{s.location ? ` — ${s.location}` : ''}</span>
                          {s.host && <span>avec {s.host}</span>}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {service && !start && (
            <>
              <button onClick={() => setServiceId(null)} className="mb-3 inline-flex items-center gap-1 text-sm text-blue-700 hover:underline">
                <PiArrowLeftBold className="h-4 w-4" /> Changer de prestation
              </button>
              <h2 className="text-lg font-semibold text-gray-900">2. Choisissez un horaire</h2>
              <p className="mb-4 text-sm text-gray-600">{service.name} · {service.duration_minutes} min · heure de {tzCity(page.cabinet.timezone)}</p>

              <div className="mb-4 flex items-center justify-between">
                <button disabled={!canGoBack || loadingSlots} onClick={() => from && setFrom(addDays(from, -DAYS_PER_PAGE) < today ? today : addDays(from, -DAYS_PER_PAGE))}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40" aria-label="Semaine précédente">
                  <PiCaretLeftBold className="h-4 w-4" /> Précédent
                </button>
                <span className="text-sm text-gray-700">{slots ? `${dayLabel(slots.from)} – ${dayLabel(slots.to)}` : ''}</span>
                <button disabled={!canGoForward || loadingSlots} onClick={() => slots && setFrom(addDays(slots.to, 1))}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40" aria-label="Semaine suivante">
                  Suivant <PiCaretRightBold className="h-4 w-4" />
                </button>
              </div>

              {loadingSlots && <p className="py-6 text-center text-sm text-gray-500">Recherche des disponibilités…</p>}
              {!loadingSlots && slots && byDay.size === 0 && (
                <p className="rounded-lg bg-gray-50 py-6 text-center text-sm text-gray-600">Aucun créneau libre cette semaine. Essayez la suivante.</p>
              )}
              {!loadingSlots && (
                <div className="space-y-4">
                  {Array.from(byDay.entries()).map(([date, list]) => (
                    <div key={date}>
                      <h3 className="mb-2 text-sm font-semibold capitalize text-gray-800">{dayLabel(date)}</h3>
                      <div className="flex flex-wrap gap-2">
                        {list.map((s) => (
                          <button key={s.start} onClick={() => setStart(s)}
                            className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-800 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300">
                            {s.time}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {service && start && (
            <form onSubmit={submit} className="space-y-4">
              <button type="button" onClick={() => setStart(null)} className="inline-flex items-center gap-1 text-sm text-blue-700 hover:underline">
                <PiArrowLeftBold className="h-4 w-4" /> Changer d’horaire
              </button>
              <div className="flex items-start gap-3 rounded-xl bg-blue-50 p-4 text-sm text-blue-900">
                <PiCalendarCheckDuotone className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">{service.name}</p>
                  <p className="capitalize">{dayLabel(start.date)} à {start.time}</p>
                  <p>{formatPrice(service.price)}{service.price > 0 && service.taxable ? ' + taxes' : ''}</p>
                </div>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">3. Vos coordonnées</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm"><span className="mb-1 block font-medium text-gray-700">Nom complet *</span>
                  <input required minLength={2} autoComplete="name" className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
                <label className="block text-sm"><span className="mb-1 block font-medium text-gray-700">Courriel *</span>
                  <input required type="email" autoComplete="email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
                <label className="block text-sm"><span className="mb-1 block font-medium text-gray-700">Téléphone</span>
                  <input type="tel" autoComplete="tel" className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
              </div>
              <label className="block text-sm"><span className="mb-1 block font-medium text-gray-700">Votre situation en quelques mots</span>
                <textarea rows={3} maxLength={2000} className={inputCls} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
              <label className="flex items-start gap-2 text-sm text-gray-700">
                <input type="checkbox" required className="mt-1" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} />
                <span>J’accepte que {page.cabinet.name} utilise ces renseignements pour organiser ce rendez-vous et me contacter.</span>
              </label>
              {submitError && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</p>}
              <button type="submit" disabled={submitting}
                className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                {submitting ? 'Réservation…' : service.price > 0 ? 'Réserver et payer' : 'Confirmer le rendez-vous'}
              </button>
              {service.price > 0 && <p className="text-center text-xs text-gray-500">Le créneau est retenu 30 minutes le temps du paiement sécurisé.</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
