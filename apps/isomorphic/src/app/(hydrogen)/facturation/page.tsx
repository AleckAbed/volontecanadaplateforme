'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PiReceiptDuotone, PiPlusBold } from 'react-icons/pi';
import { invoicesService, InvoiceSummary, INVOICE_STATUS, formatMoney } from '@/services/billing';

const FILTERS = [
  { value: '', label: 'Toutes' },
  { value: 'draft', label: 'Brouillons' },
  { value: 'sent', label: 'À encaisser' },
  { value: 'paid', label: 'Payées' },
  { value: 'void', label: 'Annulées' },
];

export default function InvoicesPage() {
  const [status, setStatus] = useState('');
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [totals, setTotals] = useState({ outstanding_cents: 0, paid_this_month_cents: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    invoicesService.list(status)
      .then((d) => { setInvoices(d.invoices); setTotals(d.totals); })
      .catch((e: any) => setError(e.message || 'Chargement impossible.'))
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-4 sm:p-6 2xl:p-10">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
            <PiReceiptDuotone className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Facturation</h1>
            <p className="mt-1 text-sm text-gray-500">Factures de vos clients, taxes calculées, paiement en ligne ou noté à la main.</p>
          </div>
        </div>
        <Link href="/facturation/nouvelle"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20">
          <PiPlusBold className="h-4 w-4" /> Nouvelle facture
        </Link>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">À encaisser</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{formatMoney(totals.outstanding_cents)}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Encaissé ce mois-ci</div>
          <div className="mt-1 text-2xl font-bold text-emerald-700">{formatMoney(totals.paid_this_month_cents)}</div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Filtrer les factures">
        {FILTERS.map((f) => (
          <button key={f.value} role="tab" aria-selected={status === f.value} onClick={() => setStatus(f.value)}
            className={`rounded-full px-3 py-1.5 text-sm ${status === f.value ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {error ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
      ) : loading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100" />)}</div>
      ) : invoices.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">Aucune facture.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Numéro</th>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">Émise</th>
                <th className="px-4 py-3 font-semibold">Échéance</th>
                <th className="px-4 py-3 text-right font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3"><Link href={`/facturation/${inv.id}`} className="font-medium text-blue-700 hover:underline">{inv.number}</Link></td>
                  <td className="px-4 py-3 text-gray-800">{inv.client?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{inv.issued_at ?? '—'}</td>
                  <td className={`px-4 py-3 ${inv.is_overdue ? 'font-semibold text-red-700' : 'text-gray-600'}`}>{inv.due_date ?? '—'}{inv.is_overdue && ' (en retard)'}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-900">{formatMoney(inv.total_cents)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${INVOICE_STATUS[inv.status].className}`}>{INVOICE_STATUS[inv.status].label}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
