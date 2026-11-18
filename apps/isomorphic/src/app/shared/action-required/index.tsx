'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PiArrowRightBold, PiCheckCircleDuotone, PiWarningCircleDuotone } from 'react-icons/pi';
import { actionFeedService, ActionBucket } from '@/services/actions';

const SEVERITY: Record<ActionBucket['severity'], { ring: string; count: string; dot: string }> = {
  danger: { ring: 'border-red-200 bg-red-50/60', count: 'text-red-700', dot: 'bg-red-500' },
  warning: { ring: 'border-amber-200 bg-amber-50/60', count: 'text-amber-800', dot: 'bg-amber-500' },
  info: { ring: 'border-blue-200 bg-blue-50/60', count: 'text-blue-700', dot: 'bg-blue-500' },
  neutral: { ring: 'border-gray-200 bg-white', count: 'text-gray-800', dot: 'bg-gray-400' },
};

/**
 * « Action requise » : ce qui attend le cabinet aujourd'hui.
 * Les catégories vides sont repliées pour que l'essentiel reste visible.
 */
export default function ActionRequired() {
  const [buckets, setBuckets] = useState<ActionBucket[] | null>(null);
  const [needing, setNeeding] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    actionFeedService.get()
      .then((d) => {
        setBuckets(d.buckets);
        setNeeding(d.needing_action);
        // Ouvre d'office la première catégorie non vide.
        setOpen(d.buckets.find((b) => b.count > 0)?.key ?? null);
      })
      .catch((e: any) => setError(e.message || 'Chargement impossible.'));
  }, []);

  if (error) {
    return <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  }
  if (!buckets) {
    return <div className="mb-6 h-32 animate-pulse rounded-xl bg-gray-100" />;
  }

  const active = buckets.find((b) => b.key === open) ?? null;

  return (
    <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="action-required-title">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 id="action-required-title" className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          {needing > 0
            ? <PiWarningCircleDuotone className="h-6 w-6 text-amber-500" />
            : <PiCheckCircleDuotone className="h-6 w-6 text-emerald-600" />}
          Action requise
        </h2>
        <span className="text-sm text-gray-600">
          {needing > 0 ? `${needing} élément${needing > 1 ? 's' : ''} demande${needing > 1 ? 'nt' : ''} votre attention` : 'Rien d’urgent aujourd’hui'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {buckets.map((b) => {
          const s = SEVERITY[b.count > 0 ? b.severity : 'neutral'];
          const selected = open === b.key;
          return (
            <button
              key={b.key}
              type="button"
              onClick={() => setOpen(selected ? null : b.key)}
              aria-pressed={selected}
              disabled={b.count === 0}
              className={`rounded-xl border p-3 text-left transition disabled:cursor-default disabled:opacity-60 ${s.ring} ${selected ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className={`text-2xl font-bold tabular-nums ${b.count > 0 ? s.count : 'text-gray-400'}`}>{b.count}</div>
              <div className="mt-0.5 text-xs font-medium text-gray-700">{b.label}</div>
            </button>
          );
        })}
      </div>

      {active && active.count > 0 && (
        <ul className="mt-4 divide-y divide-gray-100 rounded-xl border border-gray-100">
          {active.items.map((item, idx) => (
            <li key={idx}>
              <Link href={item.link} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50">
                <span className="flex min-w-0 items-start gap-2">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${SEVERITY[active.severity].dot}`} aria-hidden />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-gray-900">{item.title}</span>
                    <span className="block truncate text-xs text-gray-600">{item.subtitle}</span>
                  </span>
                </span>
                <PiArrowRightBold className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
              </Link>
            </li>
          ))}
          {active.count > active.items.length && (
            <li className="px-4 py-2 text-xs text-gray-500">
              … et {active.count - active.items.length} autre{active.count - active.items.length > 1 ? 's' : ''}.
              {(active.key === 'overdue' || active.key === 'this_week') && (
                <> <Link href="/admin/echeances" className="font-semibold text-blue-700 hover:underline">Voir toutes les échéances</Link></>
              )}
            </li>
          )}
        </ul>
      )}
    </section>
  );
}
