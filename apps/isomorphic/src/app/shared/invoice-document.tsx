'use client';

import { InvoiceDetail, INVOICE_STATUS, formatMoney } from '@/services/billing';
import CabinetLogo from '@/components/cabinet-logo';

function qty(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toLocaleString('fr-CA', { maximumFractionDigits: 2 });
}

/** Facture imprimable (admin et page client). Le navigateur l'imprime ou l'enregistre en PDF. */
export default function InvoiceDocument({ invoice }: { invoice: InvoiceDetail }) {
  const status = INVOICE_STATUS[invoice.status];

  return (
    <article className="invoice-document rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-800 shadow-sm print:border-0 print:p-0 print:shadow-none sm:p-8">
      <header className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {invoice.cabinet?.branding?.logo_url && <CabinetLogo branding={invoice.cabinet.branding} className="mb-2" />}
          <div className="text-lg font-bold text-gray-900">{invoice.cabinet?.name}</div>
          {invoice.cabinet?.website && <div className="text-gray-600">{invoice.cabinet.website}</div>}
          {invoice.cabinet?.phone && <div className="text-gray-600">{invoice.cabinet.phone}</div>}
          {invoice.cabinet?.gst_number && <div className="text-xs text-gray-500">TPS/TVH : {invoice.cabinet.gst_number}</div>}
          {invoice.cabinet?.qst_number && <div className="text-xs text-gray-500">TVQ : {invoice.cabinet.qst_number}</div>}
        </div>
        <div className="sm:text-right">
          <div className="text-xl font-bold text-gray-900">{invoice.status === 'paid' ? 'Reçu' : 'Facture'} n° {invoice.number}</div>
          <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>{status.label}</span>
          <dl className="mt-2 space-y-0.5 text-xs text-gray-600">
            {invoice.issued_at && <div>Émise le {invoice.issued_at}</div>}
            {invoice.due_date && invoice.status !== 'paid' && <div>Payable au plus tard le {invoice.due_date}</div>}
            {invoice.paid_at && <div>Payée le {invoice.paid_at}{invoice.payment_method_label ? ` — ${invoice.payment_method_label}` : ''}</div>}
          </dl>
        </div>
      </header>

      <section className="py-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Facturé à</div>
        <div className="font-medium text-gray-900">{invoice.client?.name}</div>
        {invoice.client?.email && <div className="text-gray-600">{invoice.client.email}</div>}
        {invoice.client?.address && <div className="whitespace-pre-line text-gray-600">{invoice.client.address}</div>}
        {invoice.dossier && <div className="mt-1 text-xs text-gray-500">Dossier : {invoice.dossier.name}</div>}
      </section>

      <table className="w-full text-left">
        <thead className="border-y border-gray-200 text-xs uppercase tracking-wider text-gray-500">
          <tr>
            <th className="py-2 font-semibold">Description</th>
            <th className="py-2 text-right font-semibold">Qté</th>
            <th className="py-2 text-right font-semibold">Prix</th>
            <th className="py-2 text-right font-semibold">Montant</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {invoice.lines.map((l, i) => (
            <tr key={i}>
              <td className="py-2">{l.description}{!l.taxable && <span className="ml-1 text-xs text-gray-500">(non taxable)</span>}</td>
              <td className="py-2 text-right tabular-nums">{qty(l.quantity)}</td>
              <td className="py-2 text-right tabular-nums">{formatMoney(l.unit_price_cents)}</td>
              <td className="py-2 text-right tabular-nums">{formatMoney(l.amount_cents)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex justify-end">
        <dl className="w-full max-w-xs space-y-1">
          <div className="flex justify-between"><dt>Sous-total</dt><dd className="tabular-nums">{formatMoney(invoice.subtotal_cents)}</dd></div>
          {invoice.tax_lines.map((t) => (
            <div key={t.name} className="flex justify-between text-gray-700">
              <dt>{t.name} ({t.rate.toLocaleString('fr-CA')} %)</dt>
              <dd className="tabular-nums">{formatMoney(t.amount_cents)}</dd>
            </div>
          ))}
          <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900">
            <dt>Total</dt><dd className="tabular-nums">{formatMoney(invoice.total_cents)}</dd>
          </div>
        </dl>
      </div>

      {invoice.notes && <p className="mt-6 whitespace-pre-line border-t border-gray-100 pt-4 text-gray-600">{invoice.notes}</p>}
    </article>
  );
}
