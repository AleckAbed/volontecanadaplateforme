'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import toast from 'react-hot-toast';
import { PiArrowLeftBold, PiPlusBold, PiTrashDuotone } from 'react-icons/pi';
import { invoicesService, InvoiceLineInput, formatMoney } from '@/services/billing';
import { companyService } from '@/services/companies';

const EMPTY_LINE: InvoiceLineInput = { description: '', quantity: 1, unit_price: 0, taxable: true };

function NewInvoiceForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [clients, setClients] = useState<{ id: number; name: string }[]>([]);
  const [clientId, setClientId] = useState<number | ''>(params?.get('client') ? Number(params.get('client')) : '');
  const [dueDate, setDueDate] = useState('');
  const [companies, setCompanies] = useState<{ id: number; name: string; ended_at: string | null }[]>([]);
  const [companyId, setCompanyId] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<InvoiceLineInput[]>([{ ...EMPTY_LINE }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { invoicesService.clientOptions().then(setClients).catch(() => {}); }, []);
  useEffect(() => {
    setCompanyId('');
    setCompanies([]);
    if (clientId) companyService.forClient(Number(clientId)).then(setCompanies).catch(() => setCompanies([]));
  }, [clientId]);

  const subtotal = useMemo(() => lines.reduce((s, l) => s + Math.round((Number(l.quantity) || 0) * (Number(l.unit_price) || 0) * 100), 0), [lines]);

  const setLine = (i: number, patch: Partial<InvoiceLineInput>) =>
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;
    setError(null);
    try {
      setSaving(true);
      const { id, message } = await invoicesService.create({
        client_id: Number(clientId),
        company_id: companyId ? Number(companyId) : null,
        due_date: dueDate || null,
        notes: notes || null,
        lines: lines.filter((l) => l.description.trim() !== '').map((l) => ({ ...l, quantity: Number(l.quantity), unit_price: Number(l.unit_price) })),
      });
      toast.success(message);
      router.replace(`/facturation/${id}`);
    } catch (err: any) {
      setError(err.message || 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  const input = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6">
      <Link href="/facturation" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
        <PiArrowLeftBold className="h-4 w-4" /> Facturation
      </Link>
      <h1 className="text-2xl font-bold text-gray-900">Nouvelle facture</h1>
      <p className="mt-1 text-sm text-gray-600">La facture est créée en brouillon : vous la vérifiez, puis vous l’envoyez au client.</p>

      <form onSubmit={submit} className="mt-6 space-y-6">
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-white p-5 sm:grid-cols-2">
          <div>
            <label htmlFor="client" className="mb-1 block text-sm font-medium text-gray-700">Client</label>
            <select id="client" required value={clientId} onChange={(e) => setClientId(e.target.value ? Number(e.target.value) : '')} className={input}>
              <option value="">— Choisir —</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {companies.length > 0 && (
            <div className="sm:col-span-2">
              <label htmlFor="billto" className="mb-1 block text-sm font-medium text-gray-700">Facturer à</label>
              <select id="billto" value={companyId} onChange={(e) => setCompanyId(e.target.value ? Number(e.target.value) : '')} className={input}>
                <option value="">Le client</option>
                {companies.map((c) => <option key={c.id} value={c.id}>L’entreprise : {c.name}{c.ended_at ? ' (ancien employeur)' : ''}</option>)}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="due" className="mb-1 block text-sm font-medium text-gray-700">Payable au plus tard le (facultatif)</label>
            <input id="due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={input} />
          </div>
        </div>

        <fieldset className="rounded-xl border border-gray-200 bg-white p-5">
          <legend className="px-1 text-sm font-semibold text-gray-900">Lignes</legend>
          <div className="space-y-3">
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-12 items-end gap-2">
                <div className="col-span-12 sm:col-span-5">
                  <label className="mb-1 block text-xs text-gray-600" htmlFor={`d${i}`}>Description</label>
                  <input id={`d${i}`} value={l.description} onChange={(e) => setLine(i, { description: e.target.value })} required={i === 0}
                    placeholder="Ex. Honoraires — demande de permis de travail" className={input} />
                </div>
                <div className="col-span-3 sm:col-span-2">
                  <label className="mb-1 block text-xs text-gray-600" htmlFor={`q${i}`}>Qté</label>
                  <input id={`q${i}`} type="number" min={0.01} step={0.01} value={l.quantity} onChange={(e) => setLine(i, { quantity: Number(e.target.value) })} className={input} />
                </div>
                <div className="col-span-5 sm:col-span-2">
                  <label className="mb-1 block text-xs text-gray-600" htmlFor={`p${i}`}>Prix unitaire ($)</label>
                  <input id={`p${i}`} type="number" min={0} step={0.01} value={l.unit_price} onChange={(e) => setLine(i, { unit_price: Number(e.target.value) })} className={input} />
                </div>
                <label className="col-span-3 flex items-center gap-1.5 pb-2 text-xs text-gray-700 sm:col-span-2">
                  <input type="checkbox" checked={l.taxable} onChange={(e) => setLine(i, { taxable: e.target.checked })} className="h-4 w-4 rounded border-gray-300" />
                  Taxable
                </label>
                <button type="button" aria-label="Retirer la ligne" disabled={lines.length === 1}
                  onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))}
                  className="col-span-1 mb-1 rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-30">
                  <PiTrashDuotone className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setLines((ls) => [...ls, { ...EMPTY_LINE }])}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:underline">
            <PiPlusBold className="h-3.5 w-3.5" /> Ajouter une ligne
          </button>
          <p className="mt-3 text-xs text-gray-500">
            Décochez « Taxable » pour les débours (ex. frais gouvernementaux d’IRCC). Les taxes (TPS, TVQ ou TVH) sont calculées à l’enregistrement selon la province du client.
          </p>
        </fieldset>

        <div>
          <label htmlFor="notes" className="mb-1 block text-sm font-medium text-gray-700">Note sur la facture (facultatif)</label>
          <textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} className={input}
            placeholder="Ex. Modalités de paiement, référence du dossier" />
        </div>

        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-gray-700">Sous-total avant taxes : <strong>{formatMoney(subtotal)}</strong></span>
          <button type="submit" disabled={saving || !clientId}
            className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            {saving ? 'Enregistrement…' : 'Créer le brouillon'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewInvoicePage() {
  return <Suspense fallback={null}><NewInvoiceForm /></Suspense>;
}
