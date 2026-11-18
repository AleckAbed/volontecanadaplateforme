'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { PiCalendarPlusDuotone, PiGoogleLogoBold, PiCopyBold, PiArrowSquareOutBold } from 'react-icons/pi';
import { bookingAdminService, BookingOverview } from '@/services/booking';
import AppointmentsTab from './appointments-tab';
import ServicesTab from './services-tab';
import AvailabilityTab from './availability-tab';
import SettingsTab from './settings-tab';

type Tab = 'appointments' | 'services' | 'availability' | 'settings';

const TABS: { key: Tab; label: string; managersOnly?: boolean }[] = [
  { key: 'appointments', label: 'Rendez-vous' },
  { key: 'availability', label: 'Mes disponibilités' },
  { key: 'services', label: 'Prestations' },
  { key: 'settings', label: 'Page publique et mandat', managersOnly: true },
];

function BookingAdmin() {
  const params = useSearchParams() ?? new URLSearchParams();
  const router = useRouter();
  const [data, setData] = useState<BookingOverview | null>(null);
  const [tab, setTab] = useState<Tab>('appointments');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => bookingAdminService.overview().then(setData).catch((e: any) => toast.error(e.message)), []);

  useEffect(() => { load(); }, [load]);

  // Retour de Google après l'autorisation.
  useEffect(() => {
    const g = params.get('google');
    if (!g) return;
    if (g === 'ok') toast.success('Google Agenda connecté.');
    else toast.error('La connexion à Google Agenda a échoué. Réessayez.');
    router.replace('/admin/rendez-vous');
  }, [params, router]);

  const connectGoogle = async () => {
    setBusy(true);
    try {
      window.location.href = await bookingAdminService.googleConnect();
    } catch (e: any) {
      toast.error(e.message);
      setBusy(false);
    }
  };

  const disconnectGoogle = async () => {
    setBusy(true);
    try {
      toast.success(await bookingAdminService.googleDisconnect());
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const copyLink = () => {
    if (!data) return;
    navigator.clipboard?.writeText(data.settings.public_url).then(() => toast.success('Lien copié.'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-4 sm:p-6 2xl:p-10">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
            <PiCalendarPlusDuotone className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Rendez-vous</h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Vos clients réservent et paient en ligne selon vos disponibilités. Les rendez-vous arrivent dans votre Google Agenda avec un lien Meet.
            </p>
          </div>
        </div>

        {data && (
          <div className="flex flex-col gap-2 sm:items-end">
            {data.settings.booking_enabled ? (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">Réservation ouverte</span>
                <button onClick={copyLink} className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-gray-700 hover:bg-gray-50"><PiCopyBold className="h-4 w-4" /> Copier le lien</button>
                <a href={data.settings.public_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-gray-700 hover:bg-gray-50"><PiArrowSquareOutBold className="h-4 w-4" /> Voir la page</a>
              </div>
            ) : (
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">Réservation en ligne fermée{data.can_manage ? ' — ouvrez-la dans « Page publique et mandat »' : ''}</span>
            )}
            {data.google.available ? (
              data.google.connected ? (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <PiGoogleLogoBold className="h-4 w-4 text-emerald-600" /> Google Agenda : {data.google.email ?? 'connecté'}
                  <button onClick={disconnectGoogle} disabled={busy} className="text-xs text-red-700 hover:underline">Déconnecter</button>
                </div>
              ) : (
                <button onClick={connectGoogle} disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-800 shadow-sm ring-1 ring-gray-300 hover:bg-gray-50 disabled:opacity-50">
                  <PiGoogleLogoBold className="h-4 w-4" /> Connecter mon Google Agenda
                </button>
              )
            ) : (
              <span className="text-xs text-gray-500">Synchronisation Google Agenda : bientôt disponible</span>
            )}
          </div>
        )}
      </div>

      <div role="tablist" className="mb-5 flex flex-wrap gap-1 border-b border-gray-200">
        {TABS.filter((t) => !t.managersOnly || data?.can_manage).map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${tab === t.key ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {!data ? (
        <div className="flex justify-center py-16"><div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" aria-label="Chargement" /></div>
      ) : (
        <>
          {tab === 'appointments' && <AppointmentsTab />}
          {tab === 'availability' && <AvailabilityTab overview={data} />}
          {tab === 'services' && <ServicesTab overview={data} onChange={load} />}
          {tab === 'settings' && data.can_manage && <SettingsTab overview={data} onSaved={load} />}
        </>
      )}
    </div>
  );
}

export default function BookingAdminPage() {
  return <Suspense fallback={null}><BookingAdmin /></Suspense>;
}
