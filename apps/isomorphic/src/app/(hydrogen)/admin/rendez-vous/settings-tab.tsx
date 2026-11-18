'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { bookingAdminService, BookingOverview } from '@/services/booking';

const TIMEZONES = [
  { value: 'America/St_Johns', label: 'Terre-Neuve' },
  { value: 'America/Halifax', label: 'Atlantique (Halifax)' },
  { value: 'America/Moncton', label: 'Atlantique (Moncton)' },
  { value: 'America/Toronto', label: 'Est (Montréal, Toronto)' },
  { value: 'America/Winnipeg', label: 'Centre (Winnipeg)' },
  { value: 'America/Regina', label: 'Saskatchewan' },
  { value: 'America/Edmonton', label: 'Rocheuses (Edmonton, Calgary)' },
  { value: 'America/Vancouver', label: 'Pacifique (Vancouver)' },
];

const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200';

/** Ouverture de la page publique, fuseau horaire, texte du mandat de représentation. */
export default function SettingsTab({ overview, onSaved }: { overview: BookingOverview; onSaved: () => void }) {
  const s = overview.settings;
  const [form, setForm] = useState({
    booking_enabled: s.booking_enabled,
    booking_intro: s.booking_intro ?? '',
    timezone: s.timezone,
    mandate_text: s.mandate_text ?? '',
  });
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await bookingAdminService.saveSettings({ ...form, booking_intro: form.booking_intro || null, mandate_text: form.mandate_text.trim() ? form.mandate_text : null });
      toast.success('Réglages enregistrés.');
      onSaved();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="max-w-3xl space-y-6">
      <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="font-semibold text-gray-900">Page publique de réservation</h2>
        <label className="flex items-center gap-2 text-sm text-gray-800">
          <input type="checkbox" checked={form.booking_enabled} onChange={(e) => setForm({ ...form, booking_enabled: e.target.checked })} />
          Ouvrir la réservation en ligne
        </label>
        <p className="break-all text-xs text-gray-500">Adresse : {s.public_url}</p>
        <label className="block text-sm"><span className="mb-1 block font-medium text-gray-700">Message d’accueil</span>
          <textarea rows={3} maxLength={2000} className={inputCls} placeholder="Réservez une consultation avec notre équipe…"
            value={form.booking_intro} onChange={(e) => setForm({ ...form, booking_intro: e.target.value })} /></label>
        <label className="block text-sm"><span className="mb-1 block font-medium text-gray-700">Fuseau horaire du cabinet</span>
          <select className={inputCls} value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })}>
            {TIMEZONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            {!TIMEZONES.some((t) => t.value === form.timezone) && <option value={form.timezone}>{form.timezone}</option>}
          </select></label>
      </section>

      <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="font-semibold text-gray-900">Mandat de représentation</h2>
        <p className="text-sm text-gray-600">
          Texte envoyé au client pour signature en ligne. Variables : <code>{'{{client_nom}}'}</code>, <code>{'{{cabinet_nom}}'}</code>, <code>{'{{dossier}}'}</code>, <code>{'{{date}}'}</code>.
          Laissez vide pour utiliser le modèle par défaut.
        </p>
        <textarea rows={14} maxLength={20000} className={`${inputCls} font-mono text-xs`} placeholder={s.default_mandate_text}
          value={form.mandate_text} onChange={(e) => setForm({ ...form, mandate_text: e.target.value })} />
        {!form.mandate_text && (
          <button type="button" onClick={() => setForm({ ...form, mandate_text: s.default_mandate_text })} className="text-sm text-blue-700 hover:underline">
            Partir du modèle par défaut
          </button>
        )}
        <p className="text-xs text-gray-500">
          Faites valider ce texte par votre conseiller juridique ou votre ordre professionnel. Il ne remplace pas les formulaires officiels de désignation d’un représentant (IMM 5476).
        </p>
      </section>

      <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
        {saving ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </form>
  );
}
