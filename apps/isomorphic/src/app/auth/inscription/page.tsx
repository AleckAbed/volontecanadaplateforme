'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { PiEyeDuotone, PiEyeSlashDuotone } from 'react-icons/pi';
import AuthCard, { AuthLink, inputClass, primaryButtonClass } from '@/components/auth/auth-card';
import PasswordChecklist, { isStrongPassword } from '@/components/auth/password-checklist';
import { cabinetSignupService, PROVINCES } from '@/services/team';

export default function CabinetSignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    cabinet_name: '',
    province: 'QC',
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    accept_terms: false,
  });
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));

  const passwordsMatch = form.password.length > 0 && form.password === form.password_confirmation;
  const canSubmit =
    form.cabinet_name.trim() !== '' &&
    form.name.trim() !== '' &&
    form.email.trim() !== '' &&
    isStrongPassword(form.password) &&
    passwordsMatch &&
    form.accept_terms &&
    !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    try {
      setSubmitting(true);
      const res = await cabinetSignupService.register(form);
      // Le cookie de session est posé par l'API : on marque la session comme admin (cf. ProtectedRoute).
      try {
        localStorage.setItem('user_type', 'admin');
        localStorage.setItem('isomorphic-layout', 'helium');
      } catch {}
      toast.success(res.message || 'Cabinet créé.');
      router.replace('/');
    } catch (err: any) {
      setError(err.message || 'La création du cabinet a échoué.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      wide
      title="Créer votre cabinet"
      subtitle="Un espace de travail pour votre cabinet d'immigration, prêt en une minute."
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
          <div>
            <label htmlFor="province" className="mb-1 block text-sm font-medium text-gray-700">Province</label>
            <select id="province" value={form.province} onChange={(e) => set('province', e.target.value)} className={inputClass}>
              {PROVINCES.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
            </select>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">Votre compte (propriétaire)</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">Nom complet</label>
              <input id="name" value={form.name} onChange={(e) => set('name', e.target.value)} required className={inputClass} autoComplete="name" />
            </div>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">Courriel</label>
              <input id="email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required className={inputClass} autoComplete="email" />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">Mot de passe</label>
            <div className="relative">
              <input id="password" type={showPwd ? 'text' : 'password'} value={form.password}
                onChange={(e) => set('password', e.target.value)} required autoComplete="new-password" className={`${inputClass} pr-10`} />
              <button type="button" onClick={() => setShowPwd((v) => !v)} aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-700">
                {showPwd ? <PiEyeSlashDuotone className="h-5 w-5" /> : <PiEyeDuotone className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="password_confirmation" className="mb-1 block text-sm font-medium text-gray-700">Confirmer le mot de passe</label>
            <input id="password_confirmation" type={showPwd ? 'text' : 'password'} value={form.password_confirmation}
              onChange={(e) => set('password_confirmation', e.target.value)} required autoComplete="new-password" className={inputClass} />
            {form.password_confirmation.length > 0 && !passwordsMatch && (
              <p className="mt-1 text-xs text-red-600">Les mots de passe ne correspondent pas.</p>
            )}
          </div>
          <PasswordChecklist password={form.password} />
        </fieldset>

        <label className="flex items-start gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={form.accept_terms} onChange={(e) => set('accept_terms', e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300" />
          <span>J&apos;accepte les conditions d&apos;utilisation et la politique de confidentialité de la plateforme.</span>
        </label>

        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button type="submit" disabled={!canSubmit} className={primaryButtonClass}>
          {submitting ? 'Création du cabinet…' : 'Créer mon cabinet'}
        </button>
      </form>
    </AuthCard>
  );
}
