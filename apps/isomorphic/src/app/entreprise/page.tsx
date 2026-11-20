'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { PiBuildingOfficeDuotone, PiSignOutBold, PiUserPlusBold } from 'react-icons/pi';
import { companyPortalService, CompanyPortal, REQUEST_STATUS } from '@/services/companies';
import { formatMoney, INVOICE_STATUS, InvoiceStatus } from '@/services/billing';
import PhoneField from '@/components/ui/phone-field';

const ITEM_STATUS: Record<string, string> = {
  pending: 'À faire',
  in_progress: 'En cours',
  submitted: 'Transmis',
  completed: 'Terminé',
  validated: 'Validé',
  rejected: 'À reprendre',
  expired: 'Expiré',
};

const fmtDate = (d: string | null) => (d ? new Date(d.length === 10 ? `${d}T12:00:00` : d).toLocaleDateString('fr-CA', { dateStyle: 'medium' }) : '');

/** Espace entreprise : avancement des dossiers des employés, demandes au cabinet, factures. */
export default function CompanyDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<CompanyPortal | null>(null);

  const load = useCallback(() => {
    companyPortalService.portal().then(setData).catch((e: any) => {
      if (e.status === 401 || e.status === 403) router.replace('/entreprise/connexion');
      else toast.error(e.message);
    });
  }, [router]);
  useEffect(load, [load]);

  const logout = async () => {
    await companyPortalService.logout();
    router.replace('/entreprise/connexion');
  };

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" aria-label="Chargement" />
      </div>
    );
  }

  const color = data.cabinet?.branding?.color || '#2563eb';
  const logo = data.cabinet?.branding?.logo_url as string | undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            {logo ? <img src={logo} alt="" className="h-9 w-auto" /> : <PiBuildingOfficeDuotone className="h-9 w-9" style={{ color }} />}
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500">Espace entreprise{data.cabinet ? ` · ${data.cabinet.name}` : ''}</p>
              <h1 className="text-lg font-bold text-gray-900">{data.company.name}</h1>
            </div>
          </div>
          <button onClick={logout} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
            <PiSignOutBold className="h-4 w-4" /> Déconnexion
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <section>
          <h2 className="mb-3 text-base font-semibold text-gray-900">Vos employés</h2>
          {data.employees.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-300 bg-white py-8 text-center text-sm text-gray-500">Aucun employé suivi pour le moment. Envoyez une demande au cabinet ci-dessous.</p>
          ) : (
            <div className="space-y-4">
              {data.employees.map((emp, i) => (
                <article key={i} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h3 className="font-semibold text-gray-900">{emp.name}
                    <span className="ml-2 text-sm font-normal text-gray-500">{[emp.job_title, emp.is_family ? 'avec sa famille' : null].filter(Boolean).join(' · ')}</span>
                  </h3>
                  {emp.dossiers.length === 0 ? (
                    <p className="mt-2 text-sm text-gray-500">Aucun dossier ouvert à la demande de l’entreprise.</p>
                  ) : emp.dossiers.map((d, j) => {
                    const pct = d.progress.total ? Math.round((d.progress.done / d.progress.total) * 100) : 0;
                    return (
                      <div key={j} className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="font-medium text-gray-900">{d.name}{d.service_name ? <span className="font-normal text-gray-500"> · {d.service_name}</span> : null}</p>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${d.closed ? 'bg-gray-200 text-gray-700' : 'bg-blue-50 text-blue-700'}`}>{d.status_label}</span>
                        </div>
                        {d.opened_at && <p className="text-xs text-gray-500">Ouvert le {fmtDate(d.opened_at)}</p>}
                        {d.progress.total > 0 && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-gray-600"><span>Étapes terminées</span><span>{d.progress.done} / {d.progress.total}</span></div>
                            <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-200" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                            </div>
                          </div>
                        )}
                        {d.deadlines.length > 0 && (
                          <ul className="mt-3 space-y-0.5 text-sm text-gray-700">
                            {d.deadlines.map((x, k) => <li key={k}>Échéance : <strong>{fmtDate(x.due_date)}</strong> — {x.label}</li>)}
                          </ul>
                        )}
                        {d.visibility === 'full' && (
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            {!!d.items?.length && (
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Formulaires</p>
                                <ul className="mt-1 space-y-0.5 text-sm">{d.items.map((it, k) => <li key={k} className="flex justify-between gap-2"><span>{it.name}</span><span className="text-gray-500">{ITEM_STATUS[it.status] ?? it.status}</span></li>)}</ul>
                              </div>
                            )}
                            {!!d.documents?.length && (
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Documents</p>
                                <ul className="mt-1 space-y-0.5 text-sm">{d.documents.map((doc, k) => <li key={k} className="flex justify-between gap-2"><span>{doc.name}</span><span className="text-gray-500">{ITEM_STATUS[doc.status] ?? doc.status}</span></li>)}</ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </article>
              ))}
            </div>
          )}
          <p className="mt-2 text-xs text-gray-500">Par confidentialité, vous voyez l’avancement des dossiers ; le détail n’apparaît que si le cabinet le partage, avec l’accord de l’employé.</p>
        </section>

        <RequestForm onSent={load} />

        {data.requests.length > 0 && (
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">Vos demandes</h2>
            <ul className="mt-3 divide-y divide-gray-100 text-sm">
              {data.requests.map((r) => (
                <li key={r.id} className="py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span><strong>{r.name}</strong>{r.request_type ? ` · ${r.request_type}` : ''} <span className="text-gray-500">· {fmtDate(r.created_at)}</span></span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${REQUEST_STATUS[r.status].className}`}>{REQUEST_STATUS[r.status].label}</span>
                  </div>
                  {r.response && <p className="mt-1 text-gray-600">Réponse du cabinet : {r.response}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {data.invoices.length > 0 && (
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">Factures</h2>
            <ul className="mt-3 divide-y divide-gray-100 text-sm">
              {data.invoices.map((inv) => {
                const st = INVOICE_STATUS[inv.status as InvoiceStatus];
                return (
                  <li key={inv.number} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <a href={inv.url} className="font-medium text-blue-700 hover:underline">{inv.number}</a>
                    <span className="text-gray-600">{fmtDate(inv.issued_at)}{inv.due_date ? ` · payable le ${fmtDate(inv.due_date)}` : ''}</span>
                    <span className="tabular-nums">{formatMoney(inv.total_cents)}</span>
                    {st && <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.className}`}>{st.label}</span>}
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}

/** « Inviter un employé » : la demande part au cabinet, qui la valide avant toute ouverture de dossier. */
function RequestForm({ onSent }: { onSent: () => void }) {
  const empty = { first_name: '', last_name: '', email: '', phone: '', job_title: '', request_type: '', with_family: false, message: '', consent: false };
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const input = 'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      toast.success(await companyPortalService.request({
        ...form,
        phone: form.phone || undefined, job_title: form.job_title || undefined,
        request_type: form.request_type || undefined, message: form.message || undefined,
      }));
      setForm(empty);
      setOpen(false);
      onSent();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
        <PiUserPlusBold className="h-4 w-4" /> Inviter un employé
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-xl border border-blue-200 bg-white p-5 shadow-sm sm:grid-cols-2">
      <h2 className="text-base font-semibold text-gray-900 sm:col-span-2">Inviter un employé</h2>
      <p className="-mt-2 text-sm text-gray-600 sm:col-span-2">Le cabinet étudie la demande, puis invite l’employé à son portail personnel s’il l’accepte.</p>
      <label className="text-sm text-gray-700">Prénom<input required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className={input} /></label>
      <label className="text-sm text-gray-700">Nom<input required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className={input} /></label>
      <label className="text-sm text-gray-700">Courriel de l’employé<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={input} /></label>
      <PhoneField id="employee-phone" label="Téléphone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
      <label className="text-sm text-gray-700">Poste<input value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} className={input} /></label>
      <label className="text-sm text-gray-700">Démarche souhaitée<input value={form.request_type} onChange={(e) => setForm({ ...form, request_type: e.target.value })} placeholder="Ex. permis de travail, résidence permanente" className={input} /></label>
      <label className="inline-flex items-center gap-2 text-sm text-gray-700 sm:col-span-2"><input type="checkbox" checked={form.with_family} onChange={(e) => setForm({ ...form, with_family: e.target.checked })} /> La famille de l’employé est aussi concernée</label>
      <label className="text-sm text-gray-700 sm:col-span-2">Message au cabinet<textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={input} /></label>
      <label className="inline-flex items-start gap-2 text-sm text-gray-700 sm:col-span-2">
        <input type="checkbox" required checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} className="mt-0.5" />
        J’ai informé l’employé de cette démarche et il accepte que ses coordonnées soient transmises au cabinet.
      </label>
      <div className="flex gap-2 sm:col-span-2">
        <button disabled={busy || !form.consent} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{busy ? 'Envoi…' : 'Envoyer au cabinet'}</button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700">Annuler</button>
      </div>
    </form>
  );
}
