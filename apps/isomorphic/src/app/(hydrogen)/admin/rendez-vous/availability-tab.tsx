'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PiPlusBold, PiTrashDuotone } from 'react-icons/pi';
import { bookingAdminService, AvailabilityRuleItem, BookingOverview, WEEKDAYS, tzCity } from '@/services/booking';
import { useCurrentAdmin } from '@/hooks/use-current-admin';

/** Plages hebdomadaires où l'on peut réserver ce membre (heure du cabinet). */
export default function AvailabilityTab({ overview }: { overview: BookingOverview }) {
  const admin = useCurrentAdmin();
  const [adminId, setAdminId] = useState<number | undefined>(undefined);
  const [rules, setRules] = useState<AvailabilityRuleItem[] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRules(null);
    bookingAdminService.availability(adminId).then(setRules).catch((e: any) => { toast.error(e.message); setRules([]); });
  }, [adminId]);

  const update = (i: number, patch: Partial<AvailabilityRuleItem>) =>
    setRules((r) => (r ?? []).map((x, j) => (j === i ? { ...x, ...patch } : x)));

  const add = (weekday: number) =>
    setRules((r) => [...(r ?? []), { weekday, start_time: '09:00', end_time: '12:00' }]);

  const save = async () => {
    if (!rules) return;
    const bad = rules.find((r) => r.end_time <= r.start_time);
    if (bad) {
      toast.error('Chaque plage doit finir après son début.');
      return;
    }
    setSaving(true);
    try {
      setRules(await bookingAdminService.saveAvailability(rules, adminId));
      toast.success('Disponibilités enregistrées.');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-4">
      <p className="text-sm text-gray-600">
        Heure de {tzCity(overview.settings.timezone)}. Les créneaux proposés tiennent compte de vos rendez-vous
        {overview.google.connected ? ' et des occupations de votre Google Agenda' : ''}, avec un préavis minimal de 12 h.
      </p>

      {overview.can_manage && (
        <label className="flex items-center gap-2 text-sm text-gray-700">
          Disponibilités de
          <select value={adminId ?? ''} onChange={(e) => setAdminId(e.target.value ? Number(e.target.value) : undefined)}
            className="rounded-lg border border-gray-300 px-2 py-1 text-sm">
            <option value="">moi</option>
            {overview.staff.filter((s) => s.id !== admin?.id).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
      )}

      {rules === null ? (
        <p className="py-8 text-center text-sm text-gray-500">Chargement…</p>
      ) : (
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
          {WEEKDAYS.map((d) => {
            const dayRules = rules.map((r, i) => ({ r, i })).filter(({ r }) => r.weekday === d.value);
            return (
              <div key={d.value} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-start">
                <span className="w-28 shrink-0 pt-1.5 text-sm font-medium text-gray-800">{d.label}</span>
                <div className="flex flex-1 flex-col gap-2">
                  {dayRules.length === 0 && <span className="pt-1.5 text-sm text-gray-400">Indisponible</span>}
                  {dayRules.map(({ r, i }) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="time" step={900} value={r.start_time} onChange={(e) => update(i, { start_time: e.target.value })}
                        aria-label={`${d.label} début`} className="rounded-lg border border-gray-300 px-2 py-1 text-sm" />
                      <span className="text-gray-500">à</span>
                      <input type="time" step={900} value={r.end_time} onChange={(e) => update(i, { end_time: e.target.value })}
                        aria-label={`${d.label} fin`} className="rounded-lg border border-gray-300 px-2 py-1 text-sm" />
                      <button onClick={() => setRules(rules.filter((_, j) => j !== i))} aria-label="Retirer la plage" className="text-gray-400 hover:text-red-600">
                        <PiTrashDuotone className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={() => add(d.value)} className="inline-flex items-center gap-1 self-start rounded-lg px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50">
                  <PiPlusBold className="h-3.5 w-3.5" /> Plage
                </button>
              </div>
            );
          })}
        </div>
      )}

      <button onClick={save} disabled={saving || rules === null} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
        {saving ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </div>
  );
}
