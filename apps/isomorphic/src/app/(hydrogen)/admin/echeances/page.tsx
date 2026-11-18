'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  PiCalendarCheckDuotone,
  PiPlusBold,
  PiXBold,
  PiCheckBold,
  PiArrowCounterClockwiseBold,
  PiTrashDuotone,
} from 'react-icons/pi';
import { deadlinesService, DeadlineItem, DeadlinePayload, Urgency } from '@/services/actions';
import { useCurrentAdmin } from '@/hooks/use-current-admin';

const GROUPS: { key: Urgency; label: string; tone: string }[] = [
  { key: 'overdue', label: 'En retard', tone: 'text-red-700' },
  { key: 'this_week', label: 'Cette semaine', tone: 'text-amber-800' },
  { key: 'soon', label: 'Bientôt (période de rappel)', tone: 'text-blue-800' },
  { key: 'later', label: 'Plus tard', tone: 'text-gray-700' },
  { key: 'done', label: 'Faites', tone: 'text-gray-500' },
];

const SOURCE_LABEL: Record<DeadlineItem['source'], string> = {
  manual: 'Saisie',
  dossier: 'Date limite du dossier',
  profile: 'Profil du client',
};

function when(days: number): string {
  if (days < 0) return `${Math.abs(days)} j de retard`;
  if (days === 0) return 'aujourd’hui';
  return `dans ${days} j`;
}

function formatDate(d: string): string {
  return new Date(`${d}T12:00:00`).toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function DeadlinesPage() {
  const admin = useCurrentAdmin();
  const canDelete = !!admin?.permissions?.delete_records;
  const [items, setItems] = useState<DeadlineItem[]>([]);
  const [types, setTypes] = useState<{ value: string; label: string }[]>([]);
  const [showDone, setShowDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await deadlinesService.list(showDone);
      setItems(data.items);
      setTypes(data.types);
    } catch (e: any) {
      setError(e.message || 'Chargement impossible.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [showDone]); // eslint-disable-line react-hooks/exhaustive-deps

  const grouped = useMemo(() => {
    const out: Record<string, DeadlineItem[]> = {};
    items.forEach((i) => { (out[i.urgency] ||= []).push(i); });
    return out;
  }, [items]);

  const act = async (item: DeadlineItem, action: () => Promise<string>) => {
    try {
      setBusy(item.key);
      toast.success(await action());
      await load();
    } catch (e: any) {
      toast.error(e.message || 'Action impossible.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-4 sm:p-6 2xl:p-10">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20">
            <PiCalendarCheckDuotone className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Échéances</h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Dates limites de dépôt, biométrie, examens médicaux, expirations de passeport et de permis.
              Le personnel est prévenu chaque matin quand une échéance approche.
            </p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20">
          <PiPlusBold className="h-4 w-4" /> Ajouter une échéance
        </button>
      </div>

      <label className="mb-4 inline-flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
        Afficher les échéances faites
      </label>

      {error ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
      ) : loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />)}</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
          Aucune échéance. Ajoutez-en une, ou renseignez la date limite d’un dossier ou l’expiration du passeport d’un client.
        </div>
      ) : (
        <div className="space-y-6">
          {GROUPS.filter((g) => grouped[g.key]?.length).map((g) => (
            <section key={g.key}>
              <h2 className={`mb-2 text-sm font-semibold uppercase tracking-wider ${g.tone}`}>
                {g.label} ({grouped[g.key].length})
              </h2>
              <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                {grouped[g.key].map((item) => (
                  <li key={item.key} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900">
                        {item.label}
                        <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-normal text-gray-600">{item.type_label}</span>
                      </div>
                      <div className="mt-0.5 text-xs text-gray-600">
                        {formatDate(item.due_date)} · <strong className={g.tone}>{item.urgency === 'done' ? 'faite' : when(item.days_left)}</strong>
                        {item.client && <> · {item.client.name}</>}
                        {item.dossier && <> · {item.dossier.name}</>}
                        <span className="text-gray-400"> · {SOURCE_LABEL[item.source]}</span>
                      </div>
                      {item.notes && <div className="mt-1 text-xs text-gray-500">{item.notes}</div>}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {item.link && (
                        <Link href={item.link} className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                          Ouvrir
                        </Link>
                      )}
                      {item.source === 'manual' && item.id && (
                        <>
                          <button disabled={busy === item.key}
                            onClick={() => act(item, () => deadlinesService.complete(item.id!, item.urgency !== 'done'))}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">
                            {item.urgency === 'done'
                              ? <><PiArrowCounterClockwiseBold className="h-3.5 w-3.5" /> Rouvrir</>
                              : <><PiCheckBold className="h-3.5 w-3.5" /> Fait</>}
                          </button>
                          {canDelete && (
                            <button disabled={busy === item.key} aria-label={`Supprimer l’échéance ${item.label}`}
                              onClick={() => { if (confirm(`Supprimer l’échéance « ${item.label} » ?`)) act(item, () => deadlinesService.remove(item.id!)); }}
                              className="rounded-lg border border-red-200 px-2 py-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50">
                              <PiTrashDuotone className="h-4 w-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <p className="text-xs text-gray-500">
            Les dates limites de dossier se modifient dans le dossier, et les expirations dans le profil du client.
          </p>
        </div>
      )}

      {showForm && (
        <DeadlineForm types={types} onClose={() => setShowForm(false)} onSaved={async () => { setShowForm(false); await load(); }} />
      )}
    </div>
  );
}

function DeadlineForm({ types, onClose, onSaved }: {
  types: { value: string; label: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [dossiers, setDossiers] = useState<{ id: number; name: string; client_name: string }[]>([]);
  const [form, setForm] = useState<DeadlinePayload>({ label: '', type: 'filing', due_date: '', remind_days: 14, dossier_id: null, notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { deadlinesService.dossierOptions().then(setDossiers).catch(() => {}); }, []);

  const set = <K extends keyof DeadlinePayload>(k: K, v: DeadlinePayload[K]) => setForm((f) => ({ ...f, [k]: v }));
  const input = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setSaving(true);
      toast.success(await deadlinesService.create({ ...form, notes: form.notes || null }));
      onSaved();
    } catch (err: any) {
      setError(err.message || 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4" role="dialog" aria-modal="true" aria-labelledby="deadline-form-title">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 id="deadline-form-title" className="text-lg font-semibold text-gray-900">Nouvelle échéance</h2>
          <button onClick={onClose} aria-label="Fermer" className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"><PiXBold className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4 px-6 py-5">
          <div>
            <label htmlFor="dl-type" className="mb-1 block text-sm font-medium text-gray-700">Type</label>
            <select id="dl-type" value={form.type} onChange={(e) => set('type', e.target.value)} className={input}>
              {types.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="dl-label" className="mb-1 block text-sm font-medium text-gray-700">Intitulé</label>
            <input id="dl-label" value={form.label} onChange={(e) => set('label', e.target.value)} required maxLength={255}
              placeholder="Ex. Rendez-vous biométrie au CRDV" className={input} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="dl-date" className="mb-1 block text-sm font-medium text-gray-700">Date</label>
              <input id="dl-date" type="date" value={form.due_date} onChange={(e) => set('due_date', e.target.value)} required className={input} />
            </div>
            <div>
              <label htmlFor="dl-remind" className="mb-1 block text-sm font-medium text-gray-700">Rappel (jours avant)</label>
              <input id="dl-remind" type="number" min={0} max={365} value={form.remind_days ?? 14}
                onChange={(e) => set('remind_days', Number(e.target.value))} className={input} />
            </div>
          </div>
          <div>
            <label htmlFor="dl-dossier" className="mb-1 block text-sm font-medium text-gray-700">Dossier (facultatif)</label>
            <select id="dl-dossier" value={form.dossier_id ?? ''} onChange={(e) => set('dossier_id', e.target.value ? Number(e.target.value) : null)} className={input}>
              <option value="">— Aucun —</option>
              {dossiers.map((d) => <option key={d.id} value={d.id}>{d.name}{d.client_name ? ` — ${d.client_name}` : ''}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="dl-notes" className="mb-1 block text-sm font-medium text-gray-700">Notes (facultatif)</label>
            <textarea id="dl-notes" value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} rows={2} maxLength={2000} className={input} />
          </div>
          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Annuler</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {saving ? 'Enregistrement…' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
