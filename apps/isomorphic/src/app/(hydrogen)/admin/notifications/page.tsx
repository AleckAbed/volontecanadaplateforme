'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PiBellRingingDuotone } from 'react-icons/pi';
import { authFetch } from '@/lib/api-client';

type Pref = { type: string; label: string; group: string; app: boolean | null; email: boolean };

/** Préférences de notification de la personne connectée : cloche de l'en-tête et courriel. */
export default function NotificationPreferencesPage() {
  const [prefs, setPrefs] = useState<Pref[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    authFetch('/admin/notification-preferences').then((r: any) => setPrefs(r.data)).catch((e: any) => toast.error(e.message));
  }, []);

  const toggle = (type: string, channel: 'app' | 'email') => {
    setPrefs((p) => (p ?? []).map((x) => (x.type === type ? { ...x, [channel]: !x[channel] } : x)));
    setDirty(true);
  };

  const save = async () => {
    if (!prefs) return;
    setSaving(true);
    try {
      const preferences = Object.fromEntries(prefs.map((p) => [p.type, { ...(p.app === null ? {} : { app: p.app }), email: p.email }]));
      const r: any = await authFetch('/admin/notification-preferences', { method: 'PUT', body: JSON.stringify({ preferences }) });
      setPrefs(r.data);
      setDirty(false);
      toast.success(r.message);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!prefs) return <div className="p-6 text-sm text-gray-500">Chargement…</div>;

  const groups = Array.from(new Set(prefs.map((p) => p.group)));

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <header className="flex items-start gap-3">
        <PiBellRingingDuotone className="mt-0.5 h-8 w-8 shrink-0 text-blue-600" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mes notifications</h1>
          <p className="text-sm text-gray-600">Choisissez ce qui apparaît dans la cloche de l’en-tête et ce que vous recevez aussi par courriel.</p>
        </div>
      </header>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Événement</th>
              <th className="w-24 px-4 py-3 text-center font-semibold">Cloche</th>
              <th className="w-24 px-4 py-3 text-center font-semibold">Courriel</th>
            </tr>
          </thead>
          {groups.map((g) => (
            <tbody key={g} className="divide-y divide-gray-100">
              <tr><td colSpan={3} className="bg-gray-50/60 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500">{g}</td></tr>
              {prefs.filter((p) => p.group === g).map((p) => (
                <tr key={p.type}>
                  <td className="px-4 py-2.5 text-gray-800">{p.label}</td>
                  <td className="px-4 py-2.5 text-center">
                    {p.app === null ? <span className="text-xs text-gray-400">—</span> : (
                      <input type="checkbox" checked={p.app} onChange={() => toggle(p.type, 'app')} aria-label={`${p.label} : dans la cloche`} className="h-4 w-4" />
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <input type="checkbox" checked={p.email} onChange={() => toggle(p.type, 'email')} aria-label={`${p.label} : par courriel`} className="h-4 w-4" />
                  </td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>

      <button onClick={save} disabled={saving || !dirty}
        className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
        {saving ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </div>
  );
}
