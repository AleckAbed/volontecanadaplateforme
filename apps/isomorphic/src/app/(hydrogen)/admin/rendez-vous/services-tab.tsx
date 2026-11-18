'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { PiPlusBold, PiPencilSimpleDuotone, PiTrashDuotone, PiXBold } from 'react-icons/pi';
import { bookingAdminService, BookingOverview, BookingServiceInput, BookingServiceItem, formatPrice } from '@/services/booking';

const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200';

const empty = (hostId: number): BookingServiceInput => ({
  host_admin_id: hostId,
  name: '',
  description: '',
  duration_minutes: 30,
  price: 0,
  taxable: true,
  meeting_mode: 'video',
  location: '',
  send_mandate: false,
  is_active: true,
  sort_order: 0,
});

/** Prestations réservables en ligne (gratuites ou payantes). */
export default function ServicesTab({ overview, onChange }: { overview: BookingOverview; onChange: () => void }) {
  const [editing, setEditing] = useState<{ id: number | null; form: BookingServiceInput } | null>(null);
  const [saving, setSaving] = useState(false);
  const modeLabel = (v: string) => overview.meeting_modes.find((m) => m.value === v)?.label ?? v;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      if (editing.id) await bookingAdminService.updateService(editing.id, editing.form);
      else await bookingAdminService.createService(editing.form);
      toast.success('Prestation enregistrée.');
      setEditing(null);
      onChange();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (s: BookingServiceItem) => {
    if (!window.confirm(`Supprimer « ${s.name} » ?`)) return;
    try {
      toast.success(await bookingAdminService.deleteService(s.id));
      onChange();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const set = (patch: Partial<BookingServiceInput>) => editing && setEditing({ ...editing, form: { ...editing.form, ...patch } });

  return (
    <div className="max-w-4xl space-y-4">
      {overview.can_manage && !editing && (
        <button onClick={() => setEditing({ id: null, form: empty(overview.staff[0]?.id ?? 0) })}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          <PiPlusBold className="h-4 w-4" /> Nouvelle prestation
        </button>
      )}

      {editing && (
        <form onSubmit={save} className="space-y-4 rounded-xl border border-blue-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">{editing.id ? 'Modifier la prestation' : 'Nouvelle prestation'}</h2>
            <button type="button" onClick={() => setEditing(null)} aria-label="Fermer" className="text-gray-400 hover:text-gray-700"><PiXBold className="h-5 w-5" /></button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm sm:col-span-2"><span className="mb-1 block font-medium text-gray-700">Nom *</span>
              <input required maxLength={150} className={inputCls} placeholder="Consultation initiale" value={editing.form.name} onChange={(e) => set({ name: e.target.value })} /></label>
            <label className="block text-sm sm:col-span-2"><span className="mb-1 block font-medium text-gray-700">Description</span>
              <textarea rows={2} maxLength={2000} className={inputCls} value={editing.form.description ?? ''} onChange={(e) => set({ description: e.target.value })} /></label>
            <label className="block text-sm"><span className="mb-1 block font-medium text-gray-700">Animée par *</span>
              <select className={inputCls} value={editing.form.host_admin_id} onChange={(e) => set({ host_admin_id: Number(e.target.value) })}>
                {overview.staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select></label>
            <label className="block text-sm"><span className="mb-1 block font-medium text-gray-700">Durée (minutes) *</span>
              <input required type="number" min={10} max={480} step={5} className={inputCls} value={editing.form.duration_minutes} onChange={(e) => set({ duration_minutes: Number(e.target.value) })} /></label>
            <label className="block text-sm"><span className="mb-1 block font-medium text-gray-700">Prix avant taxes ($ CA, 0 = gratuit) *</span>
              <input required type="number" min={0} step="0.01" className={inputCls} value={editing.form.price} onChange={(e) => set({ price: Number(e.target.value) })} /></label>
            <label className="block text-sm"><span className="mb-1 block font-medium text-gray-700">Format *</span>
              <select className={inputCls} value={editing.form.meeting_mode} onChange={(e) => set({ meeting_mode: e.target.value as BookingServiceInput['meeting_mode'] })}>
                {overview.meeting_modes.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select></label>
            {editing.form.meeting_mode === 'in_person' && (
              <label className="block text-sm sm:col-span-2"><span className="mb-1 block font-medium text-gray-700">Adresse</span>
                <input maxLength={255} className={inputCls} value={editing.form.location ?? ''} onChange={(e) => set({ location: e.target.value })} /></label>
            )}
          </div>
          <div className="space-y-2 text-sm text-gray-700">
            <label className="flex items-center gap-2"><input type="checkbox" checked={editing.form.taxable} onChange={(e) => set({ taxable: e.target.checked })} /> Taxable (TPS/TVQ/TVH selon la province du client)</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={editing.form.send_mandate} onChange={(e) => set({ send_mandate: e.target.checked })} /> Envoyer le mandat de représentation à signer après la réservation</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={editing.form.is_active} onChange={(e) => set({ is_active: e.target.checked })} /> Proposée sur la page publique</label>
          </div>
          {editing.form.meeting_mode === 'video' && !overview.google.connected && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">Le lien Meet est créé automatiquement si la personne qui anime a connecté son Google Agenda.</p>
          )}
          <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </form>
      )}

      {overview.services.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 bg-white py-10 text-center text-sm text-gray-500">
          Aucune prestation. {overview.can_manage ? 'Créez-en une pour ouvrir la réservation en ligne.' : 'Un administrateur peut en créer.'}
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {overview.services.map((s) => (
            <li key={s.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-gray-900">
                  {s.name} {!s.is_active && <span className="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-normal text-gray-600">masquée</span>}
                </p>
                <p className="text-sm text-gray-600">
                  {s.duration_minutes} min · {formatPrice(s.price)}{s.price > 0 && s.taxable ? ' + taxes' : ''} · {modeLabel(s.meeting_mode)}{s.host ? ` · ${s.host}` : ''}
                  {s.send_mandate ? ' · mandat envoyé' : ''}
                </p>
              </div>
              {overview.can_manage && (
                <div className="flex gap-2">
                  <button onClick={() => setEditing({ id: s.id, form: { ...s, description: s.description ?? '', location: s.location ?? '' } })} aria-label={`Modifier ${s.name}`}
                    className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-blue-700"><PiPencilSimpleDuotone className="h-5 w-5" /></button>
                  <button onClick={() => remove(s)} aria-label={`Supprimer ${s.name}`}
                    className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-700"><PiTrashDuotone className="h-5 w-5" /></button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-gray-500">Une prestation n’apparaît sur la page publique que si la personne qui l’anime a des disponibilités.</p>
    </div>
  );
}
