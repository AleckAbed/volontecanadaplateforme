'use client';

import { useState } from 'react';
import { PiCheckCircleDuotone } from 'react-icons/pi';
import AuthCard, { AuthLink, inputClass, primaryButtonClass } from '@/components/auth/auth-card';
import PhoneField from '@/components/ui/phone-field';
import { cabinetRequestService, PROVINCES } from '@/services/team';

const TEAM_SIZES = [
  { value: '1', label: 'Je travaille seul(e)' },
  { value: '2-5', label: '2 à 5 personnes' },
  { value: '6-15', label: '6 à 15 personnes' },
  { value: '16+', label: 'Plus de 15 personnes' },
];

/**
 * Demande d'ouverture d'un cabinet. L'équipe de la plateforme l'étudie ; si elle est
 * acceptée, le propriétaire reçoit un lien pour activer son compte.
 * (L'inscription libre et immédiate n'est plus proposée.)
 */
export default function CabinetRequestPage() {
  const [form, setForm] = useState({
    cabinet_name: '',
    province: 'QC',
    name: '',
    email: '',
    phone: '',
    team_size: '',
    license_number: '',
    message: '',
    accept_terms: false,
    website: '', // piège à robots, invisible
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));

  const canSubmit = form.cabinet_name.trim() !== '' && form.name.trim() !== '' && /\S+@\S+\.\S+/.test(form.email) && form.accept_terms && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    try {
      setSubmitting(true);
      setDone(await cabinetRequestService.submit({
        ...form,
        phone: form.phone || undefined,
        team_size: form.team_size || undefined,
        license_number: form.license_number || undefined,
        message: form.message || undefined,
      }));
    } catch (err: any) {
      setError(err.message || 'L’envoi de la demande a échoué.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <AuthCard title="Demande envoyée" footer={<AuthLink href="/auth/admin-signin">Retour à la connexion</AuthLink>}>
        <div className="flex items-start gap-3">
          <PiCheckCircleDuotone className="h-8 w-8 shrink-0 text-green-600" />
          <div className="space-y-2 text-sm text-gray-700">
            <p>{done}</p>
            <p>Un accusé de réception vient de partir à <strong>{form.email}</strong>. Dès que votre cabinet est ouvert, vous recevrez un lien pour activer votre compte.</p>
          </div>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      wide
      title="Demander l’ouverture de votre cabinet"
      subtitle="Dites-nous qui vous êtes : nous étudions chaque demande et vous répondons par courriel, généralement sous 2 jours ouvrables."
      footer={<>Vous avez déjà un compte ? <AuthLink href="/auth/admin-signin">Se connecter</AuthLink></>}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <fieldset className="space-y-4">
          <legend className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">Votre cabinet</legend>
          <div>
            <label htmlFor="cabinet_name" className="mb-1 block text-sm font-medium text-gray-700">Nom du cabinet</label>
            <input id="cabinet_name" value={form.cabinet_name} onChange={(e) => set('cabinet_name', e.target.value)}
              required autoFocus maxLength={150} className={inputClass} placeholder="Ex. Immigration Laval inc." />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="province" className="mb-1 block text-sm font-medium text-gray-700">Province</label>
              <select id="province" value={form.province} onChange={(e) => set('province', e.target.value)} className={inputClass}>
                {PROVINCES.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="team_size" className="mb-1 block text-sm font-medium text-gray-700">Taille de l’équipe</label>
              <select id="team_size" value={form.team_size} onChange={(e) => set('team_size', e.target.value)} className={inputClass}>
                <option value="">—</option>
                {TEAM_SIZES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="license_number" className="mb-1 block text-sm font-medium text-gray-700">
              Numéro de membre du CICC <span className="font-normal text-gray-400">(facultatif)</span>
            </label>
            <input id="license_number" value={form.license_number} onChange={(e) => set('license_number', e.target.value)}
              maxLength={40} className={inputClass} placeholder="Ex. R123456" />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">Vous (futur propriétaire du compte)</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">Nom complet</label>
              <input id="name" value={form.name} onChange={(e) => set('name', e.target.value)} required className={inputClass} autoComplete="name" />
            </div>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">Courriel professionnel</label>
              <input id="email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required className={inputClass} autoComplete="email" />
            </div>
          </div>
          <PhoneField id="phone" label="Téléphone (facultatif)" value={form.phone} onChange={(v) => set('phone', v)} />
          <div>
            <label htmlFor="message" className="mb-1 block text-sm font-medium text-gray-700">Message <span className="font-normal text-gray-400">(facultatif)</span></label>
            <textarea id="message" value={form.message} onChange={(e) => set('message', e.target.value)} rows={3} maxLength={2000}
              className={inputClass} placeholder="Votre volume de dossiers, vos besoins, comment vous nous avez connus…" />
          </div>
        </fieldset>

        {/* Piège à robots : invisible pour une personne, rempli par les robots. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="website">Site web</label>
          <input id="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set('website', e.target.value)} />
        </div>

        <label className="flex items-start gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={form.accept_terms} onChange={(e) => set('accept_terms', e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300" />
          <span>J&apos;accepte les conditions d&apos;utilisation et la politique de confidentialité, et que mes coordonnées servent à étudier ma demande.</span>
        </label>

        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button type="submit" disabled={!canSubmit} className={primaryButtonClass}>
          {submitting ? 'Envoi…' : 'Envoyer ma demande'}
        </button>
      </form>
    </AuthCard>
  );
}
