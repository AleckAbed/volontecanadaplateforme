'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import AuthCard, { AuthLink, inputClass, primaryButtonClass } from '@/components/auth/auth-card';
import PasswordChecklist, { isStrongPassword } from '@/components/auth/password-checklist';
import { companyPortalService } from '@/services/companies';

type AccessInfo = { purpose: string | null; name: string; email: string; cabinet_name: string | null };

/** Activation de l'espace entreprise, ou nouveau mot de passe, depuis le lien reçu par courriel. */
function CompanyAccessContent() {
  const router = useRouter();
  const token = useSearchParams()?.get('token') ?? '';
  const [info, setInfo] = useState<AccessInfo | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLinkError('Le lien est incomplet. Ouvrez-le directement depuis le courriel reçu.');
      setChecking(false);
      return;
    }
    companyPortalService.checkAccess(token)
      .then(setInfo)
      .catch((e: any) => setLinkError(e.message || 'Ce lien est invalide ou a expiré.'))
      .finally(() => setChecking(false));
  }, [token]);

  const passwordsMatch = password.length > 0 && password === confirm;
  const canSubmit = isStrongPassword(password) && passwordsMatch && !submitting;
  const isInvite = info?.purpose === 'invite';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    try {
      setSubmitting(true);
      toast.success(await companyPortalService.completeAccess(token, password, confirm));
      router.replace('/entreprise/connexion');
    } catch (err: any) {
      setError(err.message || 'Impossible d’enregistrer le mot de passe.');
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" aria-label="Chargement" />
      </div>
    );
  }

  if (linkError || !info) {
    return (
      <AuthCard title="Lien invalide" eyebrow="Espace entreprise" footer={<AuthLink href="/entreprise/mot-de-passe-oublie">Demander un nouveau lien</AuthLink>}>
        <p className="text-sm text-gray-700">{linkError}</p>
        <p className="mt-3 text-sm text-gray-500">Vous pouvez aussi demander au cabinet de vous renvoyer l’invitation.</p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      eyebrow={info.cabinet_name ?? 'Espace entreprise'}
      title={isInvite ? 'Activez votre espace entreprise' : 'Nouveau mot de passe'}
      subtitle={<>Bonjour <strong>{info.name}</strong>, choisissez votre mot de passe.</>}
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
          <span className="text-xs text-gray-500">Identifiant :</span>{' '}
          <span className="font-medium text-gray-900">{info.email}</span>
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">Mot de passe</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            required autoFocus autoComplete="new-password" className={inputClass} />
        </div>
        <div>
          <label htmlFor="confirm" className="mb-1 block text-sm font-medium text-gray-700">Confirmer le mot de passe</label>
          <input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
            required autoComplete="new-password" className={inputClass} />
          {confirm.length > 0 && !passwordsMatch && <p className="mt-1 text-xs text-red-600">Les mots de passe ne correspondent pas.</p>}
        </div>
        <PasswordChecklist password={password} />
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={!canSubmit} className={primaryButtonClass}>
          {submitting ? 'Enregistrement…' : isInvite ? 'Activer mon espace' : 'Enregistrer le mot de passe'}
        </button>
      </form>
    </AuthCard>
  );
}

export default function CompanyAccessPage() {
  return (
    <Suspense fallback={null}>
      <CompanyAccessContent />
    </Suspense>
  );
}
