'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { PiArrowLeftBold, PiPaperPlaneTiltDuotone, PiPrinterDuotone, PiCopyDuotone, PiProhibitDuotone, PiCheckCircleDuotone } from 'react-icons/pi';
import { invoicesService, InvoiceDetail, PAYMENT_METHODS } from '@/services/billing';
import InvoiceDocument from '@/app/shared/invoice-document';
import { useCurrentAdmin } from '@/hooks/use-current-admin';

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const invoiceId = Number(id);
  const admin = useCurrentAdmin();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [paying, setPaying] = useState(false);
  const [method, setMethod] = useState('transfer');
  const [reference, setReference] = useState('');

  const load = () => invoicesService.get(invoiceId).then(setInvoice).catch((e: any) => setError(e.message || 'Facture introuvable.'));
  useEffect(() => { load(); }, [invoiceId]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = async (action: () => Promise<string>) => {
    try {
      setBusy(true);
      toast.success(await action());
      await load();
    } catch (e: any) {
      toast.error(e.message || 'Action impossible.');
    } finally {
      setBusy(false);
    }
  };

  if (error) return <div role="alert" className="m-6 rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>;
  if (!invoice) return <div className="p-10 text-center text-gray-400">Chargement…</div>;

  const canVoid = !!admin?.permissions?.delete_records && invoice.status !== 'paid' && invoice.status !== 'void';

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/facturation" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
          <PiArrowLeftBold className="h-4 w-4" /> Facturation
        </Link>
        <div className="flex flex-wrap gap-2">
          {(invoice.status === 'draft' || invoice.status === 'sent') && (
            <button disabled={busy} onClick={() => run(() => invoicesService.send(invoice.id))}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
              <PiPaperPlaneTiltDuotone className="h-4 w-4" /> {invoice.status === 'draft' ? 'Envoyer au client' : 'Renvoyer'}
            </button>
          )}
          {(invoice.status === 'draft' || invoice.status === 'sent') && (
            <button onClick={() => setPaying((p) => !p)} aria-expanded={paying}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50">
              <PiCheckCircleDuotone className="h-4 w-4" /> Noter un paiement
            </button>
          )}
          {invoice.status !== 'draft' && (
            <button onClick={() => navigator.clipboard.writeText(invoice.public_url).then(() => toast.success('Lien copié')).catch(() => toast.error('Copie impossible'))}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              <PiCopyDuotone className="h-4 w-4" /> Lien client
            </button>
          )}
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            <PiPrinterDuotone className="h-4 w-4" /> Imprimer / PDF
          </button>
          {canVoid && (
            <button disabled={busy} onClick={() => { if (confirm(`Annuler la facture ${invoice.number} ?`)) run(() => invoicesService.void(invoice.id)); }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50">
              <PiProhibitDuotone className="h-4 w-4" /> Annuler
            </button>
          )}
        </div>
      </div>

      {paying && (
        <form onSubmit={(e) => { e.preventDefault(); run(() => invoicesService.markPaid(invoice.id, method, reference || undefined)).then(() => setPaying(false)); }}
          className="mb-4 flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 sm:flex-row sm:items-end print:hidden">
          <div>
            <label htmlFor="pm" className="mb-1 block text-xs font-medium text-gray-700">Mode de paiement</label>
            <select id="pm" value={method} onChange={(e) => setMethod(e.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
              {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label htmlFor="ref" className="mb-1 block text-xs font-medium text-gray-700">Référence (facultatif)</label>
            <input id="ref" value={reference} onChange={(e) => setReference(e.target.value)} maxLength={191} placeholder="Ex. n° de virement"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <button type="submit" disabled={busy} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            Enregistrer le paiement
          </button>
        </form>
      )}

      {invoice.status === 'sent' && !invoice.online_payment_available && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 print:hidden">
          Le paiement en ligne n’est pas encore activé pour votre cabinet : le client verra la facture sans bouton « Payer ».
          {' '}<Link href="/admin/abonnement" className="font-semibold underline">Activer les paiements</Link>
        </p>
      )}

      <InvoiceDocument invoice={invoice} />
    </div>
  );
}
