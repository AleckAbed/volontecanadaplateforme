'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { PiArrowLeftBold } from 'react-icons/pi';
import { clientPortalService, PortalProfile } from '@/services/client-profile';

/**
 * Profil d'immigration du client (ou d'un membre de sa famille).
 * Ces informations préremplissent les formulaires que le cabinet lui envoie.
 */
export default function ClientProfilePage() {
  const [members, setMembers] = useState<{ id: number; name: string }[]>([]);
  const [memberId, setMemberId] = useState<number | null>(null);
  const [profile, setProfile] = useState<PortalProfile | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    clientPortalService.overview().then((o) => setMembers(o.members)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    clientPortalService.profile(memberId)
      .then((p) => { setProfile(p); setValues(p.values || {}); })
      .catch((e: any) => setError(e.message || 'Chargement impossible.'))
      .finally(() => setLoading(false));
  }, [memberId]);

  const sections = useMemo(() => {
    const out: Record<string, PortalProfile['fields']> = {};
    profile?.fields.forEach((f) => { (out[f.section] ||= []).push(f); });
    return out;
  }, [profile]);

  const filled = Object.values(values).filter((v) => (v ?? '').trim() !== '').length;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await clientPortalService.saveProfile(values, memberId);
      toast.success(res.message);
    } catch (err: any) {
      toast.error(err.message || 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6">
      <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
        <PiArrowLeftBold className="h-4 w-4" /> Tableau de bord
      </Link>
      <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
      <p className="mt-1 text-sm text-gray-600">
        Vous répondez une fois : ces informations servent à préremplir les formulaires que votre cabinet vous envoie.
        Vérifiez-les avec soin, elles doivent correspondre à vos pièces d&apos;identité.
      </p>

      {members.length > 0 && (
        <div className="mt-4">
          <label htmlFor="member" className="mb-1 block text-sm font-medium text-gray-700">Profil de</label>
          <select id="member" value={memberId ?? ''} onChange={(e) => setMemberId(e.target.value ? Number(e.target.value) : null)}
            className="w-full max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
            <option value="">Moi-même</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      )}

      {error ? (
        <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
      ) : loading || !profile ? (
        <div className="mt-6 space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-100" />)}</div>
      ) : (
        <form onSubmit={save} className="mt-6 space-y-6">
          {Object.entries(sections).map(([section, fields]) => (
            <fieldset key={section} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <legend className="px-1 text-sm font-semibold text-gray-900">{section}</legend>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {fields.map((f) => (
                  <div key={f.key}>
                    <label htmlFor={f.key} className="mb-1 block text-sm font-medium text-gray-700">{f.label}</label>
                    <input
                      id={f.key}
                      type={f.type === 'date' ? 'date' : f.type === 'email' ? 'email' : 'text'}
                      value={values[f.key] ?? ''}
                      onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                      maxLength={255}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                ))}
              </div>
            </fieldset>
          ))}

          <div className="sticky bottom-0 flex flex-col gap-3 border-t border-gray-200 bg-white/95 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-gray-600">{filled} / {profile.total} informations renseignées</span>
            <button type="submit" disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Enregistrement…' : 'Enregistrer mon profil'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
