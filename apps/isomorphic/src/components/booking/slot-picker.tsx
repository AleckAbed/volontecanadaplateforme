'use client';

import { useEffect, useState } from 'react';
import { PiCaretLeftBold, PiCaretRightBold } from 'react-icons/pi';
import type { SlotsResponse } from '@/services/booking';

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function dayLabel(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' });
}

/**
 * Choix d'un créneau semaine par semaine (déplacement d'un rendez-vous).
 * `load(from)` renvoie les créneaux libres des 7 jours à partir de `from`.
 */
export default function SlotPicker({
  load,
  current,
  onPick,
  busy,
}: {
  load: (from: string) => Promise<SlotsResponse>;
  current?: string | null;
  onPick: (start: string) => void;
  busy?: boolean;
}) {
  const [from, setFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<SlotsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    load(from)
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e: any) => { if (!cancelled) setError(e.message || 'Créneaux indisponibles.'); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from]);

  const days = data ? Array.from(new Set(data.slots.map((s) => s.date))) : [];
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => setFrom(addDays(from, -7))} disabled={from <= today}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1 text-sm disabled:opacity-40" aria-label="Semaine précédente">
          <PiCaretLeftBold className="h-4 w-4" />
        </button>
        <span className="text-sm text-gray-700">{data ? `${dayLabel(data.from)} – ${dayLabel(data.to)}` : 'Chargement…'}</span>
        <button type="button" onClick={() => setFrom(addDays(from, 7))} disabled={!!data && data.to >= data.max_date}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1 text-sm disabled:opacity-40" aria-label="Semaine suivante">
          <PiCaretRightBold className="h-4 w-4" />
        </button>
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {data && days.length === 0 && <p className="py-4 text-center text-sm text-gray-500">Aucun créneau libre cette semaine.</p>}

      <div className="space-y-3">
        {days.map((day) => (
          <div key={day}>
            <p className="mb-1.5 text-sm font-medium capitalize text-gray-800">{dayLabel(day)}</p>
            <div className="flex flex-wrap gap-2">
              {data!.slots.filter((s) => s.date === day).map((s) => {
                const isCurrent = current && new Date(current).getTime() === new Date(s.start).getTime();
                return (
                  <button key={s.start} type="button" disabled={!!isCurrent} onClick={() => setSelected(s.start)}
                    className={`rounded-lg border px-3 py-1.5 text-sm tabular-nums ${selected === s.start ? 'border-blue-600 bg-blue-600 text-white' : isCurrent ? 'border-gray-200 bg-gray-100 text-gray-400 line-through' : 'border-gray-300 hover:border-blue-500'}`}
                    title={isCurrent ? 'Créneau actuel' : undefined}>
                    {s.time}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button type="button" disabled={!selected || busy} onClick={() => selected && onPick(selected)}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
        {busy ? 'Déplacement…' : 'Confirmer le nouveau créneau'}
      </button>
    </div>
  );
}
