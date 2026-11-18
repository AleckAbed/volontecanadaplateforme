'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { PiCreditCardDuotone, PiStorefrontDuotone, PiReceiptDuotone, PiCheckCircleFill, PiWarningCircleDuotone } from 'react-icons/pi';
import { billingService, BillingInfo } from '@/services/billing';
import { useCurrentAdmin } from '@/hooks/use-current-admin';
import { PROVINCES } from '@/services/team';

const STATUS_LABEL: Record<BillingInfo['subscription']['status'], string> = {
  trialing: 'Période d’essai',
  active: 'Actif',
  past_due: 'Paiement en retard',
  canceled: 'Résilié',
  unpaid: 'Impayé',
};

function BillingContent() {
  const params = useSearchParams();
  const admin = useCurrentAdmin();
  const isOwner = admin?.role === 'owner';
  const [info, setInfo] = useState<BillingInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [taxes, setTaxes] = useState({ province: '', gst_number: '', qst_number: '' });

  const load = async () => {
    try {
      const data = await billingService.get();
      setInfo(data);
      setTaxes({ province: data.taxes.province ?? '', gst_number: data.taxes.gst_number ?? '', qst_number: data.taxes.qst_number ?? '' });
    } catch (e: any) {
      setError(e.message || 'Chargement impossible.');
    }
  };

  useEffect(() => {
    // Au retour de l'inscription Stripe Connect, on relit l'état du compte.
    const back = params?.get('connect');
    (back ? billingService.refreshConnect().catch(() => null) : Promise.resolve(null)).finally(load);
    if (params?.get('abonnement') === 'ok') toast.success('Merci ! Votre abonnement sera actif dès la confirmation de Stripe.');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const redirect = async (key: string, action: () => Promise<string>) => {
    try {
      setBusy(key);
      window.location.href = await action();
    } catch (e: any) {
      toast.error(e.message || 'Action impossible.');
      setBusy(null);
    }
  };

  const saveTaxes = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setBusy('taxes');
      toast.success(await billingService.saveTaxes({ province: taxes.province || null, gst_number: taxes.gst_number || null, qst_number: taxes.qst_number || null }));
    } catch (err: any) {
      toast.error(err.message || 'Enregistrement impossible.');
    } finally {
      setBusy(null);
    }
  };

  if (error) return <div role="alert" className="m-6 rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>;
  if (!info) return <div className="p-10 text-center text-gray-400">Chargement…</div>;

  const sub = info.subscription;
  const card = 'rounded-xl border border-gray-200 bg-white p-5 shadow-sm';
  const input = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none';

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Abonnement et paiements</h1>
        <p className="mt-1 text-sm text-gray-600">Votre abonnement à la plateforme, l’encaissement de vos clients et les numéros de taxes de vos factures.</p>
      </div>

      {!info.stripe_configured && (
        <p className="flex gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <PiWarningCircleDuotone className="mt-0.5 h-5 w-5 shrink-0" />
          Les paiements en ligne ne sont pas encore activés sur la plateforme. Vous pouvez déjà facturer et noter les paiements reçus à la main.
        </p>
      )}

      {/* Abonnement */}
      <section className={card} aria-labelledby="sub-title">
        <h2 id="sub-title" className="mb-3 flex items-center gap-2 font-semibold text-gray-900"><PiCreditCardDuotone className="h-5 w-5 text-blue-600" /> Abonnement</h2>
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div><dt className="text-xs text-gray-500">Statut</dt><dd className={`font-medium ${sub.is_active ? 'text-gray-900' : 'text-red-700'}`}>{STATUS_LABEL[sub.status]}</dd></div>
          <div><dt className="text-xs text-gray-500">Sièges utilisés</dt><dd className="font-medium text-gray-900">{sub.seats_used}</dd></div>
          {sub.status === 'trialing' && <div><dt className="text-xs text-gray-500">Fin de l’essai</dt><dd className="font-medium text-gray-900">{sub.trial_ends_at ?? '—'} ({sub.trial_days_left ?? 0} j)</dd></div>}
          {sub.current_period_end && <div><dt className="text-xs text-gray-500">Prochaine facturation</dt><dd className="font-medium text-gray-900">{sub.current_period_end}</dd></div>}
        </dl>
        <p className="mt-3 text-xs text-gray-500">Un siège = un compte actif du personnel. Les clients et les collaborateurs externes ne comptent pas.</p>
        {isOwner ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {sub.status !== 'active' && (
              <button disabled={!!busy || !info.stripe_configured} onClick={() => redirect('subscribe', billingService.subscribe)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                {busy === 'subscribe' ? 'Redirection…' : 'S’abonner'}
              </button>
            )}
            {sub.has_customer && (
              <button disabled={!!busy} onClick={() => redirect('portal', billingService.portal)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                {busy === 'portal' ? 'Redirection…' : 'Gérer l’abonnement et les factures'}
              </button>
            )}
          </div>
        ) : <p className="mt-3 text-xs text-gray-500">Seul un propriétaire du cabinet peut gérer l’abonnement.</p>}
      </section>

      {/* Encaissement des clients */}
      <section className={card} aria-labelledby="pay-title">
        <h2 id="pay-title" className="mb-3 flex items-center gap-2 font-semibold text-gray-900"><PiStorefrontDuotone className="h-5 w-5 text-blue-600" /> Paiement en ligne de vos clients</h2>
        {info.payments.charges_enabled ? (
          <p className="flex items-center gap-2 text-sm text-emerald-800"><PiCheckCircleFill className="h-5 w-5 text-emerald-600" /> Activé : vos clients peuvent payer leurs factures par carte. L’argent est versé sur votre compte Stripe.</p>
        ) : (
          <>
            <p className="text-sm text-gray-700">
              Reliez le compte Stripe de votre cabinet pour que vos clients paient leurs factures par carte. Les fonds vont directement à votre cabinet ; la plateforme ne les touche pas.
              {info.payments.connected && ' Votre inscription Stripe est commencée mais pas terminée.'}
            </p>
            {isOwner ? (
              <button disabled={!!busy || !info.stripe_configured} onClick={() => redirect('connect', billingService.connect)}
                className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                {busy === 'connect' ? 'Redirection…' : info.payments.connected ? 'Terminer l’inscription Stripe' : 'Activer les paiements en ligne'}
              </button>
            ) : <p className="mt-3 text-xs text-gray-500">Seul un propriétaire du cabinet peut relier le compte Stripe.</p>}
          </>
        )}
      </section>

      {/* Taxes */}
      <section className={card} aria-labelledby="tax-title">
        <h2 id="tax-title" className="mb-3 flex items-center gap-2 font-semibold text-gray-900"><PiReceiptDuotone className="h-5 w-5 text-blue-600" /> Taxes sur vos factures</h2>
        <form onSubmit={saveTaxes} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="tx-prov" className="mb-1 block text-sm font-medium text-gray-700">Province du cabinet</label>
            <select id="tx-prov" value={taxes.province} onChange={(e) => setTaxes((t) => ({ ...t, province: e.target.value }))} className={input}>
              <option value="">—</option>
              {PROVINCES.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="tx-gst" className="mb-1 block text-sm font-medium text-gray-700">N° TPS/TVH</label>
            <input id="tx-gst" value={taxes.gst_number} onChange={(e) => setTaxes((t) => ({ ...t, gst_number: e.target.value }))} maxLength={30} className={input} placeholder="123456789 RT0001" />
          </div>
          <div>
            <label htmlFor="tx-qst" className="mb-1 block text-sm font-medium text-gray-700">N° TVQ (Québec)</label>
            <input id="tx-qst" value={taxes.qst_number} onChange={(e) => setTaxes((t) => ({ ...t, qst_number: e.target.value }))} maxLength={30} className={input} placeholder="1234567890 TQ0001" />
          </div>
          <div className="sm:col-span-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500">
              Taxes appliquées selon la province du client (sinon celle du cabinet) : TPS 5 %, TVQ 9,975 % au Québec, TVH selon la province.
              Faites valider ces règles par votre comptable.
            </p>
            <button type="submit" disabled={busy === 'taxes'} className="shrink-0 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              Enregistrer
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function BillingPage() {
  return <Suspense fallback={null}><BillingContent /></Suspense>;
}
