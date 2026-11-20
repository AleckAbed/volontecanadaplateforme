'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PiSlidersHorizontalDuotone } from 'react-icons/pi';
import { moduleAccessService, ModuleAccessData } from '@/services/team';

type Override = 'inherit' | 'on' | 'off';

/**
 * Menus ouverts aux membres : le propriétaire règle ce que voient les conseillers et
 * les adjoints (tout est ouvert par défaut), puis peut préciser membre par membre.
 * L'API applique le même droit : un menu masqué est aussi fermé côté serveur.
 */
export default function ModuleAccessPanel() {
  const [data, setData] = useState<ModuleAccessData | null>(null);
  const [roles, setRoles] = useState<Record<string, Record<string, boolean>>>({});
  const [saving, setSaving] = useState(false);
  const [memberId, setMemberId] = useState<number | null>(null);
  const [overrides, setOverrides] = useState<Record<string, Override>>({});

  const load = () => moduleAccessService.get().then((d) => {
    setData(d);
    setRoles(Object.fromEntries(d.roles.map((r) => [r.value, { ...r.modules }])));
  }).catch((e: any) => toast.error(e.message));

  useEffect(() => { load(); }, []);

  const member = data?.members.find((m) => m.id === memberId) ?? null;
  useEffect(() => {
    if (!member || !data) return;
    setOverrides(Object.fromEntries(data.modules.map((m) => {
      const v = member.overrides[m.key];
      return [m.key, v === undefined ? 'inherit' : v ? 'on' : 'off'];
    })));
  }, [memberId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!data) return null;

  const saveRoles = async () => {
    setSaving(true);
    try {
      toast.success(await moduleAccessService.saveRoles(roles));
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const saveMember = async () => {
    if (!member) return;
    setSaving(true);
    try {
      const payload = Object.fromEntries(Object.entries(overrides).filter(([, v]) => v !== 'inherit').map(([k, v]) => [k, v === 'on']));
      toast.success(await moduleAccessService.saveMember(member.id, payload));
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-8 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="modules-title">
      <div className="flex items-start gap-3">
        <PiSlidersHorizontalDuotone className="mt-0.5 h-6 w-6 shrink-0 text-blue-600" />
        <div>
          <h2 id="modules-title" className="text-base font-semibold text-gray-900">Menus ouverts aux membres</h2>
          <p className="text-sm text-gray-600">
            Choisissez ce que voient les conseillers et les adjoints. Un menu masqué est aussi fermé côté serveur.
            Les propriétaires et administrateurs voient toujours tout.
          </p>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="py-2 pr-4 font-medium">Menu</th>
              {data.roles.map((r) => <th key={r.value} className="px-3 py-2 text-center font-medium">{r.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.modules.map((m) => (
              <tr key={m.key} className="border-b border-gray-100 last:border-0">
                <td className="py-2 pr-4 text-gray-800">{m.label}</td>
                {data.roles.map((r) => (
                  <td key={r.value} className="px-3 py-2 text-center">
                    <input type="checkbox" aria-label={`${m.label} — ${r.label}`}
                      checked={roles[r.value]?.[m.key] !== false}
                      onChange={(e) => setRoles((prev) => ({ ...prev, [r.value]: { ...prev[r.value], [m.key]: e.target.checked } }))}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex justify-end">
        <button onClick={saveRoles} disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
          Enregistrer les menus des rôles
        </button>
      </div>

      {data.members.length > 0 && (
        <div className="mt-6 border-t border-gray-100 pt-5">
          <h3 className="text-sm font-semibold text-gray-900">Exception pour un membre</h3>
          <p className="text-xs text-gray-600">Ce réglage l’emporte sur celui de son rôle.</p>
          <select value={memberId ?? ''} onChange={(e) => setMemberId(e.target.value ? Number(e.target.value) : null)}
            aria-label="Membre" className="mt-2 w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="">Choisir un membre…</option>
            {data.members.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.role_label})</option>)}
          </select>

          {member && (
            <>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {data.modules.map((m) => (
                  <li key={m.key} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2 text-sm">
                    <span className="text-gray-800">{m.label}</span>
                    <select value={overrides[m.key] ?? 'inherit'} aria-label={`${m.label} pour ${member.name}`}
                      onChange={(e) => setOverrides((o) => ({ ...o, [m.key]: e.target.value as Override }))}
                      className="rounded-md border border-gray-300 py-1 pl-2 pr-7 text-xs">
                      <option value="inherit">Comme son rôle ({roles[member.role]?.[m.key] !== false ? 'ouvert' : 'masqué'})</option>
                      <option value="on">Ouvert</option>
                      <option value="off">Masqué</option>
                    </select>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-end">
                <button onClick={saveMember} disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                  Enregistrer pour {member.name}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
