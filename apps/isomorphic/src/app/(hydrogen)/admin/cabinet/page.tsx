'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { PiBuildingsDuotone, PiUploadSimpleBold, PiTrashDuotone } from 'react-icons/pi';
import CabinetLogo from '@/components/cabinet-logo';
import { cabinetProfileService, CabinetProfile } from '@/services/cabinet-profile';
import { useCurrentAdmin } from '@/hooks/use-current-admin';

const PRESETS = ['#2563eb', '#0f766e', '#7c3aed', '#b91c1c', '#c2410c', '#0f172a'];

/** Profil et image de marque du cabinet (1.9) : visibles dans les courriels, le portail client et les pages publiques. */
export default function CabinetProfilePage() {
  const admin = useCurrentAdmin();
  const canEdit = !!admin?.permissions?.manage_settings;
  const [profile, setProfile] = useState<CabinetProfile | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', website: '', brand_color: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const apply = (p: CabinetProfile) => {
    setProfile(p);
    setForm({ name: p.name, phone: p.phone ?? '', website: p.website ?? '', brand_color: p.brand_color ?? '' });
  };

  useEffect(() => {
    cabinetProfileService.get().then(apply).catch((e: any) => toast.error(e.message));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      apply(await cabinetProfileService.update({
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        website: form.website.trim() || null,
        brand_color: form.brand_color || null,
      }));
      toast.success('Profil du cabinet enregistré. Il apparaîtra au prochain chargement des pages.');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 1024 * 1024) {
      toast.error('Le logo doit faire 1 Mo au plus.');
      return;
    }
    setUploading(true);
    try {
      apply(await cabinetProfileService.uploadLogo(file));
      toast.success('Logo enregistré.');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeLogo = async () => {
    try {
      apply(await cabinetProfileService.deleteLogo());
      toast.success('Logo retiré.');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (!profile) return <div className="p-6 text-sm text-gray-500">Chargement…</div>;

  const color = /^#[0-9a-fA-F]{6}$/.test(form.brand_color) ? form.brand_color : profile.branding.color;
  const preview = { name: form.name || profile.name, logo_url: profile.branding.logo_url, color };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <header className="flex items-start gap-3">
        <PiBuildingsDuotone className="mt-0.5 h-8 w-8 shrink-0 text-blue-600" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">Profil du cabinet</h1>
          <p className="text-sm text-gray-600">
            Nom, logo et couleur affichés dans vos courriels, le portail de vos clients, les pages de réservation,
            de mandat et de facture.
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <label className="block text-sm">
            <span className="font-medium text-gray-700">Nom du cabinet</span>
            <input value={form.name} disabled={!canEdit} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 disabled:bg-gray-50" maxLength={120} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-gray-700">Téléphone</span>
              <input value={form.phone} disabled={!canEdit} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 disabled:bg-gray-50" maxLength={40} />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-gray-700">Site web</span>
              <input value={form.website} disabled={!canEdit} placeholder="https://" onChange={(e) => setForm({ ...form, website: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 disabled:bg-gray-50" maxLength={200} />
            </label>
          </div>

          <fieldset disabled={!canEdit}>
            <legend className="text-sm font-medium text-gray-700">Couleur principale</legend>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {PRESETS.map((c) => (
                <button key={c} type="button" onClick={() => setForm({ ...form, brand_color: c })} aria-label={`Couleur ${c}`}
                  className={`h-8 w-8 rounded-full border-2 ${form.brand_color === c ? 'border-gray-900' : 'border-white shadow'}`} style={{ backgroundColor: c }} />
              ))}
              <input type="color" value={color} onChange={(e) => setForm({ ...form, brand_color: e.target.value })}
                aria-label="Couleur personnalisée" className="h-8 w-12 cursor-pointer rounded border border-gray-300" />
              <span className="text-xs tabular-nums text-gray-500">{color}</span>
            </div>
          </fieldset>

          <div>
            <p className="text-sm font-medium text-gray-700">Logo</p>
            <p className="text-xs text-gray-500">PNG, JPEG ou WebP, 1 Mo au plus. Un logo horizontal sur fond transparent rend le mieux.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
              <button type="button" disabled={!canEdit || uploading} onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50">
                <PiUploadSimpleBold className="h-4 w-4" /> {uploading ? 'Envoi…' : profile.branding.logo_url ? 'Remplacer le logo' : 'Téléverser un logo'}
              </button>
              {profile.branding.logo_url && (
                <button type="button" disabled={!canEdit} onClick={removeLogo}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50">
                  <PiTrashDuotone className="h-4 w-4" /> Retirer
                </button>
              )}
            </div>
          </div>

          {canEdit ? (
            <button onClick={save} disabled={saving || form.name.trim().length < 2}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          ) : (
            <p className="text-sm text-gray-500">Seuls les propriétaires et administrateurs peuvent modifier le profil du cabinet.</p>
          )}
        </section>

        {/* Aperçu */}
        <aside className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Aperçu d’un courriel</p>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="px-4 py-5 text-center text-white" style={{ background: `linear-gradient(135deg, ${color} 0%, ${color} 100%)` }}>
              {preview.logo_url && (
                <span className="mb-2 inline-block rounded-lg bg-white px-3 py-1.5">
                  <CabinetLogo branding={preview} />
                </span>
              )}
              <p className="text-lg font-bold">{preview.name}</p>
              <p className="text-xs opacity-90">Rendez-vous confirmé</p>
            </div>
            <div className="space-y-2 p-4 text-sm text-gray-600">
              <p>Bonjour Marie,</p>
              <span className="inline-block rounded-lg px-4 py-2 text-xs font-semibold text-white" style={{ backgroundColor: color }}>Voir le rendez-vous</span>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-700">Portail client</p>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <CabinetLogo branding={preview} />
          </div>
        </aside>
      </div>
    </div>
  );
}
