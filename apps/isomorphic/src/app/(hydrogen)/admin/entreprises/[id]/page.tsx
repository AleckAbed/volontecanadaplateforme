'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { PiBuildingOfficeDuotone, PiUsersThreeDuotone, PiUserPlusDuotone, PiEnvelopeSimpleDuotone, PiTrashDuotone } from 'react-icons/pi';
import { authFetch } from '@/lib/api-client';
import { companyService, CompanyDetail, CompanyRequestItem, REQUEST_STATUS } from '@/services/companies';
import { formatMoney, INVOICE_STATUS } from '@/services/billing';
import { useCurrentAdmin } from '@/hooks/use-current-admin';

const input = 'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm';
const card = 'rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5';
const fmt = (d: string | null) => (d ? new Date(d.length === 10 ? `${d}T12:00:00` : d).toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');

/** Fiche d'une entreprise cliente : demandes, employés (avec historique), contacts, dossiers, factures. */
export default function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = use(params);
  const id = Number(idParam);
  const router = useRouter();
  const admin = useCurrentAdmin();
  const [data, setData] = useState<CompanyDetail | null>(null);

  const load = useCallback(() => companyService.get(id).then(setData).catch((e: any) => toast.error(e.message)), [id]);
  useEffect(() => { load(); }, [load]);

  const run = async (fn: () => Promise<string>) => {
    try {
      toast.success(await fn());
      await load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (!data) return <div className="p-6 text-sm text-gray-500">Chargement…</div>;

  const pending = data.requests.filter((r) => r.status === 'pending');
  const current = data.employees.filter((e) => !e.ended_at);
  const past = data.employees.filter((e) => e.ended_at);

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <PiBuildingOfficeDuotone className="mt-0.5 h-8 w-8 shrink-0 text-blue-600" />
          <div>
            <Link href="/admin/entreprises" className="text-sm text-gray-500 hover:underline">← Entreprises</Link>
            <h1 className="text-xl font-bold text-gray-900">{data.company.name}</h1>
            <p className="text-sm text-gray-600">{[data.company.business_number && `NEQ/NE ${data.company.business_number}`, data.company.sector, data.company.city].filter(Boolean).join(' · ')}</p>
          </div>
        </div>
        {admin?.permissions?.manage_team && (
          <button onClick={() => { if (window.confirm(`Supprimer « ${data.company.name} » ? Les dossiers et les factures de ses employés sont conservés.`)) run(async () => { const m = await companyService.remove(id); router.push('/admin/entreprises'); return m; }); }}
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50">
            <PiTrashDuotone className="h-4 w-4" /> Supprimer
          </button>
        )}
      </header>

      {pending.length > 0 && (
        <section className={`${card} border-amber-200`}>
          <h2 className="text-base font-semibold text-gray-900">Demandes à traiter ({pending.length})</h2>
          <ul className="mt-3 space-y-3">{pending.map((r) => <PendingRequest key={r.id} r={r} onDone={load} />)}</ul>
        </section>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <section className={card}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900"><PiUsersThreeDuotone className="h-5 w-5 text-blue-600" /> Employés ({current.length})</h2>
            </div>
            <LinkEmployee companyId={id} onDone={load} />
            {current.length === 0 ? <p className="mt-3 text-sm text-gray-500">Aucun employé lié.</p> : (
              <ul className="mt-3 divide-y divide-gray-100">
                {current.map((e) => (
                  <li key={e.link_id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                    <span>
                      <Link href={`/admin/clients/${e.client_id}`} className="font-medium text-blue-700 hover:underline">{e.name}</Link>
                      <span className="text-gray-600">{e.job_title ? ` · ${e.job_title}` : ''}{e.client_type === 'family' ? ` · famille (${e.family_members} membre${e.family_members > 1 ? 's' : ''})` : ''} · depuis le {fmt(e.started_at)}</span>
                    </span>
                    <button onClick={() => { if (window.confirm(`Terminer le lien avec ${e.name} ? L’entreprise ne verra plus ses dossiers.`)) run(() => companyService.endEmployee(id, e.link_id)); }}
                      className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50">N’est plus employé</button>
                  </li>
                ))}
              </ul>
            )}
            {past.length > 0 && (
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer text-gray-600">Anciens employés ({past.length})</summary>
                <ul className="mt-2 space-y-1 text-gray-600">
                  {past.map((e) => <li key={e.link_id}><Link href={`/admin/clients/${e.client_id}`} className="hover:underline">{e.name}</Link> · {fmt(e.started_at)} → {fmt(e.ended_at)}</li>)}
                </ul>
              </details>
            )}
          </section>

          <section className={card}>
            <h2 className="text-base font-semibold text-gray-900">Dossiers demandés par l’entreprise ({data.dossiers.length})</h2>
            <p className="mt-1 text-xs text-gray-500">Pour rattacher un dossier ou changer ce que l’entreprise voit, ouvrez le dossier (encadré « Entreprise »).</p>
            {data.dossiers.length === 0 ? <p className="mt-3 text-sm text-gray-500">Aucun dossier rattaché.</p> : (
              <ul className="mt-3 divide-y divide-gray-100">
                {data.dossiers.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                    <span>
                      <Link href={`/admin/dossiers/${d.id}`} className="font-medium text-blue-700 hover:underline">{d.name}</Link>
                      <span className="text-gray-600"> · {d.client?.name ?? '—'} · {d.status_label}</span>
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${d.visibility === 'full' ? 'bg-blue-50 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>
                      {d.visibility === 'full' ? 'Voit formulaires et documents' : 'Voit l’avancement'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {data.requests.some((r) => r.status !== 'pending') && (
            <section className={card}>
              <h2 className="text-base font-semibold text-gray-900">Demandes traitées</h2>
              <ul className="mt-3 space-y-1 text-sm">
                {data.requests.filter((r) => r.status !== 'pending').map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center gap-2">
                    {r.first_name} {r.last_name}{r.request_type ? ` · ${r.request_type}` : ''}
                    <span className={`rounded-full px-2 py-0.5 text-xs ${REQUEST_STATUS[r.status].className}`}>{REQUEST_STATUS[r.status].label}</span>
                    {r.dossier_id && <Link href={`/admin/dossiers/${r.dossier_id}`} className="text-xs text-blue-700 hover:underline">dossier</Link>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-5">
          <CompanyInfo data={data} onSaved={load} />
          <Contacts data={data} companyId={id} run={run} onDone={load} />
          <section className={card}>
            <h2 className="text-base font-semibold text-gray-900">Factures adressées à l’entreprise</h2>
            {data.invoices.length === 0 ? <p className="mt-2 text-sm text-gray-500">Aucune.</p> : (
              <ul className="mt-2 space-y-1 text-sm">
                {data.invoices.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-2">
                    <Link href={`/facturation/${i.id}`} className="text-blue-700 hover:underline">{i.number}</Link>
                    <span className="tabular-nums">{formatMoney(i.total_cents)}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${INVOICE_STATUS[i.status as keyof typeof INVOICE_STATUS]?.className ?? ''}`}>{INVOICE_STATUS[i.status as keyof typeof INVOICE_STATUS]?.label ?? i.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function LinkEmployee({ companyId, onDone }: { companyId: number; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<{ id: number; name: string; email: string | null }[]>([]);
  const [jobTitle, setJobTitle] = useState('');

  useEffect(() => {
    if (!open || q.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(() => {
      (authFetch(`/admin/module-clients?search=${encodeURIComponent(q.trim())}&per_page=10`) as Promise<any>)
        .then((r) => setResults((r.data?.data ?? []).map((c: any) => ({ id: c.id, name: `${c.first_name} ${c.last_name}`, email: c.email }))))
        .catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [q, open]);

  const link = async (clientId: number) => {
    try {
      toast.success(await companyService.linkEmployee(companyId, { client_id: clientId, job_title: jobTitle || undefined }));
      setOpen(false); setQ(''); setJobTitle('');
      onDone();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
        <PiUserPlusDuotone className="h-4 w-4" /> Lier un client existant
      </button>
    );
  }
  return (
    <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50/40 p-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-sm text-gray-700">Client (personne ou famille)
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom ou courriel…" className={input} autoFocus />
        </label>
        <label className="text-sm text-gray-700">Poste
          <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className={input} />
        </label>
      </div>
      <ul className="mt-2 divide-y divide-gray-100 rounded-lg bg-white">
        {results.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
            <span>{c.name} <span className="text-gray-500">{c.email}</span></span>
            <button onClick={() => link(c.id)} className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white">Lier</button>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-gray-500">Le client n’existe pas encore ? Créez-le dans « Clients », puis liez-le ici. Une demande de l’entreprise crée aussi le client.</p>
      <button onClick={() => setOpen(false)} className="mt-2 text-sm text-gray-600 underline">Fermer</button>
    </div>
  );
}

function PendingRequest({ r, onDone }: { r: CompanyRequestItem; onDone: () => void }) {
  const [mode, setMode] = useState<'idle' | 'accept' | 'decline'>('idle');
  const [dossierName, setDossierName] = useState(r.request_type ? `${r.request_type} — ${r.first_name} ${r.last_name}` : `Dossier — ${r.first_name} ${r.last_name}`);
  const [visibility, setVisibility] = useState<'progress' | 'full'>('progress');
  const [invite, setInvite] = useState(true);
  const [response, setResponse] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      toast.success(mode === 'accept'
        ? await companyService.acceptRequest(r.id, { dossier_name: dossierName.trim() || undefined, visibility, invite })
        : await companyService.declineRequest(r.id, response));
      onDone();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-sm">
      <p className="font-medium text-gray-900">{r.first_name} {r.last_name} <span className="font-normal text-gray-600">· {r.email}{r.job_title ? ` · ${r.job_title}` : ''}{r.with_family ? ' · avec sa famille' : ''}</span></p>
      <p className="text-gray-600">{r.request_type ?? 'Type de demande non précisé'}{r.contact ? ` · demandé par ${r.contact}` : ''} · {fmt(r.created_at)}</p>
      {r.message && <p className="mt-1 text-gray-800">« {r.message} »</p>}
      {mode === 'idle' ? (
        <div className="mt-2 flex gap-2">
          <button onClick={() => setMode('accept')} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">Accepter</button>
          <button onClick={() => setMode('decline')} className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700">Refuser</button>
        </div>
      ) : mode === 'accept' ? (
        <div className="mt-3 space-y-2">
          <p className="text-gray-700">Le client sera créé (ou repris s’il existe déjà avec ce courriel) et lié à l’entreprise.</p>
          <label className="block text-gray-700">Dossier à ouvrir (laisser vide pour ne pas en ouvrir)
            <input value={dossierName} onChange={(e) => setDossierName(e.target.value)} className={input} />
          </label>
          <fieldset className="text-gray-700">
            <legend>Ce que l’entreprise voit de ce dossier</legend>
            <label className="mr-4 inline-flex items-center gap-1.5"><input type="radio" checked={visibility === 'progress'} onChange={() => setVisibility('progress')} /> L’avancement</label>
            <label className="inline-flex items-center gap-1.5"><input type="radio" checked={visibility === 'full'} onChange={() => setVisibility('full')} /> Aussi formulaires et documents</label>
          </fieldset>
          <label className="flex items-center gap-2 text-gray-700"><input type="checkbox" checked={invite} onChange={(e) => setInvite(e.target.checked)} /> Inviter l’employé à son portail</label>
          <div className="flex gap-2">
            <button onClick={submit} disabled={busy} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{busy ? 'Traitement…' : 'Confirmer'}</button>
            <button onClick={() => setMode('idle')} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs">Annuler</button>
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <textarea value={response} onChange={(e) => setResponse(e.target.value)} rows={2} placeholder="Réponse à l’entreprise (obligatoire)" className={input} />
          <div className="flex gap-2">
            <button onClick={submit} disabled={busy || response.trim().length < 5} className="rounded-lg bg-gray-800 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">Envoyer le refus</button>
            <button onClick={() => setMode('idle')} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs">Annuler</button>
          </div>
        </div>
      )}
    </li>
  );
}

function CompanyInfo({ data, onSaved }: { data: CompanyDetail; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(data.company);
  useEffect(() => setForm(data.company), [data.company]);
  const save = async () => {
    try {
      toast.success(await companyService.update(data.company.id, form));
      setEditing(false);
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    }
  };
  const fields: [keyof typeof form, string][] = [['name', 'Nom'], ['business_number', 'NEQ ou NE'], ['sector', 'Secteur'], ['email', 'Courriel de facturation'], ['phone', 'Téléphone'], ['website', 'Site web'], ['address', 'Adresse'], ['city', 'Ville'], ['province', 'Province (QC, ON…)'], ['postal_code', 'Code postal']];

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Informations</h2>
        {!editing && <button onClick={() => setEditing(true)} className="text-sm text-blue-700 hover:underline">Modifier</button>}
      </div>
      {editing ? (
        <div className="mt-2 space-y-2">
          {fields.map(([k, label]) => (
            <label key={k} className="block text-sm text-gray-700">{label}
              <input value={(form[k] as string) ?? ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className={input} />
            </label>
          ))}
          <label className="block text-sm text-gray-700">Notes internes
            <textarea value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className={input} />
          </label>
          <div className="flex gap-2">
            <button onClick={save} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Enregistrer</button>
            <button onClick={() => { setForm(data.company); setEditing(false); }} className="rounded-lg border border-gray-300 px-4 py-2 text-sm">Annuler</button>
          </div>
        </div>
      ) : (
        <dl className="mt-2 space-y-1 text-sm">
          {fields.slice(1).map(([k, label]) => data.company[k] ? <div key={k}><dt className="inline text-gray-500">{label} : </dt><dd className="inline text-gray-900">{String(data.company[k])}</dd></div> : null)}
          {data.company.notes && <p className="mt-2 whitespace-pre-line text-gray-700">{data.company.notes}</p>}
        </dl>
      )}
    </section>
  );
}

function Contacts({ data, companyId, run, onDone }: { data: CompanyDetail; companyId: number; run: (fn: () => Promise<string>) => Promise<void>; onDone: () => void }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', job_title: '' });
  const add = async () => {
    try {
      await companyService.addContact(companyId, form);
      toast.success('Contact ajouté. Envoyez-lui son accès à l’espace entreprise.');
      setAdding(false);
      setForm({ first_name: '', last_name: '', email: '', job_title: '' });
      onDone();
    } catch (e: any) {
      toast.error(e.message);
    }
  };
  const portalLabel = { active: 'Accès actif', invited: 'Invité', none: 'Sans accès' } as const;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-base font-semibold text-gray-900">Contacts et espace entreprise</h2>
      <ul className="mt-2 space-y-3 text-sm">
        {data.contacts.map((c) => (
          <li key={c.id}>
            <p className="font-medium text-gray-900">{c.first_name} {c.last_name}{c.job_title ? <span className="font-normal text-gray-600"> · {c.job_title}</span> : null}</p>
            <p className="text-gray-600">{c.email} · <span className={c.portal === 'active' ? 'text-emerald-700' : 'text-gray-500'}>{portalLabel[c.portal]}</span>{!c.is_active ? ' · désactivé' : ''}</p>
            <div className="mt-1 flex flex-wrap gap-2">
              <button onClick={() => run(() => companyService.inviteContact(companyId, c.id))} className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50">
                <PiEnvelopeSimpleDuotone className="h-3.5 w-3.5" /> {c.portal === 'none' ? 'Envoyer l’accès' : 'Renvoyer un lien'}
              </button>
              <button onClick={() => run(() => companyService.updateContact(companyId, c.id, { is_active: !c.is_active }))} className="rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50">
                {c.is_active ? 'Désactiver' : 'Réactiver'}
              </button>
              <button onClick={() => { if (window.confirm(`Retirer ${c.first_name} ${c.last_name} ?`)) run(() => companyService.removeContact(companyId, c.id)); }} className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50">Retirer</button>
            </div>
          </li>
        ))}
      </ul>
      {adding ? (
        <div className="mt-3 space-y-2">
          {(['first_name', 'last_name', 'email', 'job_title'] as const).map((k) => (
            <label key={k} className="block text-sm text-gray-700">{{ first_name: 'Prénom', last_name: 'Nom', email: 'Courriel', job_title: 'Fonction (RH…)' }[k]}
              <input type={k === 'email' ? 'email' : 'text'} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className={input} />
            </label>
          ))}
          <div className="flex gap-2">
            <button onClick={add} disabled={!form.first_name || !form.last_name || !form.email} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Ajouter</button>
            <button onClick={() => setAdding(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm">Annuler</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="mt-3 text-sm text-blue-700 hover:underline">+ Ajouter un contact</button>
      )}
    </section>
  );
}
