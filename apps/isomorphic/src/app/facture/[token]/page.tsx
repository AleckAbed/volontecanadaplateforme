'use client';

import { Suspense, use, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PiCreditCardDuotone, PiPrinterDuotone, PiCheckCircleFill } from 'react-icons/pi';
import { publicInvoiceService, InvoiceDetail, formatMoney } from '@/services/billing';
import InvoiceDocument from '@/app/shared/invoice-document';

/** Facture vue par le client depuis le lien reçu par courriel. */
function PublicInvoice({ token }: { token: string }) {
  const result = useSearchParams()?.get('paiement');
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  useEffect(() => {
    const load = () => publicInvoiceService.get(token).then(setInvoice).catch((e: any) => setError(e.message || 'Facture introuvable.'));
    load();
    // Au retour de Stripe, le webhook peut arriver quelques secondes après : on relit une fois.
    if (result === 'ok') {
      const t = setTimeout(load, 4000);
      return () => clearTimeout(t);
    }
  }, [token, result]);

  const pay = async () => {
    setPayError(null);
    try {
      setPaying(true);
      window.location.href = await publicInvoiceService.checkout(token);
    } catch (e: any) {
      setPayError(e.message || 'Le paiement n’a pas pu démarrer.');
      setPaying(false);
    }
  };

  if (error) {
    return <div role="alert" className="mx-auto mt-16 max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">{error}</div>;
  }
  if (!invoice) {
    return <div className="flex min-h-screen items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" aria-label="Chargement" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-3xl space-y-4">
        {result === 'ok' && invoice.status !== 'paid' && (
          <p role="status" className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-900 print:hidden">Paiement reçu par Stripe : la confirmation arrive dans quelques instants.</p>
        )}
        {result === 'annule' && invoice.status !== 'paid' && (
          <p role="status" className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 print:hidden">Paiement annulé. Vous pouvez réessayer quand vous voulez.</p>
        )}
        {invoice.status === 'paid' && (
          <p role="status" className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-900 print:hidden">
            <PiCheckCircleFill className="h-5 w-5 text-emerald-600" /> Merci, cette facture est payée. Un reçu vous a été envoyé par courriel.
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-2 print:hidden">
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            <PiPrinterDuotone className="h-4 w-4" /> Imprimer / PDF
          </button>
          {invoice.can_pay_online && (
            <button onClick={pay} disabled={paying}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
              <PiCreditCardDuotone className="h-4 w-4" /> {paying ? 'Redirection…' : `Payer ${formatMoney(invoice.total_cents)} par carte`}
            </button>
          )}
        </div>
        {payError && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 print:hidden">{payError}</p>}
        {invoice.status === 'sent' && !invoice.can_pay_online && (
          <p className="rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-700 print:hidden">
            Pour régler cette facture, contactez {invoice.cabinet?.name ?? 'votre cabinet'} (virement, chèque…).
          </p>
        )}

        <InvoiceDocument invoice={invoice} />
        <p className="text-center text-xs text-gray-500 print:hidden">Paiement sécurisé par Stripe. Votre cabinet ne voit jamais votre numéro de carte.</p>
      </div>
    </div>
  );
}

export default function PublicInvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  return <Suspense fallback={null}><PublicInvoice token={token} /></Suspense>;
}
