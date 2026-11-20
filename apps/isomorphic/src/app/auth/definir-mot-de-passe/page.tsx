'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { PiDeviceMobileDuotone, PiEnvelopeSimpleDuotone, PiEyeDuotone, PiEyeSlashDuotone, PiShieldCheckDuotone } from 'react-icons/pi';
import AuthCard, { AuthLink, inputClass, primaryButtonClass } from '@/components/auth/auth-card';
import PasswordChecklist, { isStrongPassword } from '@/components/auth/password-checklist';
import { accessService, AccessLinkInfo, TwoFactorActivationSetup } from '@/services/team';
import { useAuth } from '@/hooks/useAuth';

type Step = 'password' | 'two-factor' | 'recovery';

/**
 * Choix du mot de passe depuis un lien reçu par courriel :
 *  - invitation dans l'équipe d'un cabinet ;
 *  - réinitialisation après « Mot de passe oublié ».
 * Quand le cabinet exige la double authentification, elle se règle ici même,
 * puis la session s'ouvre directement (pas de détour par l'écran de connexion).
 */
function SetPasswordContent() {
  const router = useRouter();
  const token = useSearchParams()?.get('token') ?? '';
  const { finishAdminLogin } = useAuth();

  const [info, setInfo] = useState<AccessLinkInfo | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState<Step>('password');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [setup, setSetup] = useState<TwoFactorActivationSetup | null>(null);
  const [code, setCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    if (!token) {
      setLinkError('Le lien est incomplet. Ouvrez-le directement depuis le courriel reçu.');
      setChecking(false);
      return;
    }
    accessService.check(token)
      .then(setInfo)
      .catch((e: any) => setLinkError(e.message || 'Ce lien est invalide ou a expiré.'))
      .finally(() => setChecking(false));
  }, [token]);

  const passwordsMatch = password.length > 0 && password === confirm;
  const canSubmit = isStrongPassword(password) && passwordsMatch && !submitting;
  const isInvite = info?.purpose === 'invite';

  const finish = async (twoFactorCode?: string) => {
    setError(null);
    try {
      setSubmitting(true);
      const res = await accessService.complete(token, password, confirm, twoFactorCode);
      if (res.data?.recovery_codes?.length) {
        // Codes de secours à noter avant d'entrer : la session est déjà ouverte côté serveur.
        setRecoveryCodes(res.data.recovery_codes);
        setSession(res);
        setStep('recovery');
      } else if (res.data?.logged_in) {
        finishAdminLogin(res);
      } else {
        toast.success(res.message);
        router.replace('/auth/admin-signin');
      }
    } catch (err: any) {
      const msg = err.message || 'Impossible d’enregistrer le mot de passe.';
      if (/double authentification/i.test(msg) && step === 'password') {
        setStep('two-factor');
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    if (info?.two_factor_required) {
      setError(null);
      setStep('two-factor');
      return;
    }
    await finish();
  };

  const chooseMethod = async (method: 'totp' | 'email') => {
    setError(null);
    setCode('');
    try {
      setSubmitting(true);
      setSetup(await accessService.twoFactorSetup(token, method));
    } catch (err: any) {
      setError(err.message || 'Impossible de préparer la double authentification.');
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
      <AuthCard
        title="Lien invalide"
        footer={<AuthLink href="/auth/mot-de-passe-oublie">Demander un nouveau lien</AuthLink>}
      >
        <p className="text-sm text-gray-700">{linkError}</p>
        <p className="mt-3 text-sm text-gray-500">
          Pour une invitation dans une équipe, vous pouvez aussi demander au responsable de votre cabinet de vous la renvoyer.
        </p>
      </AuthCard>
    );
  }

  const progress = info.two_factor_required && (
    <ol className="mb-5 flex items-center gap-2 text-xs font-medium" aria-label="Étapes">
      {(['password', 'two-factor', 'recovery'] as Step[]).map((s, i) => {
        const labels = { password: 'Mot de passe', 'two-factor': 'Double authentification', recovery: 'Codes de secours' };
        const active = s === step;
        const done = ['password', 'two-factor', 'recovery'].indexOf(step) > i;
        return (
          <li key={s} className={`flex-1 rounded-full px-2 py-1 text-center ${active ? 'bg-blue-600 text-white' : done ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`}>
            {i + 1}. {labels[s]}
          </li>
        );
      })}
    </ol>
  );

  if (step === 'recovery') {
    return (
      <AuthCard eyebrow={info.cabinet_name ?? undefined} title="Notez vos codes de secours"
        subtitle="Chacun sert une seule fois si vous perdez votre téléphone ou n’avez plus accès à votre courriel.">
        {progress}
        <ul className="grid grid-cols-2 gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-sm" data-testid="recovery-codes">
          {recoveryCodes.map((c) => <li key={c} className="text-center">{c}</li>)}
        </ul>
        <div className="mt-4 flex gap-2">
          <button type="button" className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50"
            onClick={() => { navigator.clipboard?.writeText(recoveryCodes.join('\n')); toast.success('Codes copiés.'); }}>
            Copier
          </button>
          <button type="button" className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50"
            onClick={() => {
              const blob = new Blob([`Codes de secours — ${info.email}\n\n${recoveryCodes.join('\n')}\n`], { type: 'text/plain' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = 'codes-de-secours.txt';
              a.click();
              URL.revokeObjectURL(a.href);
            }}>
            Télécharger
          </button>
        </div>
        <button type="button" className={`${primaryButtonClass} mt-5`} onClick={() => finishAdminLogin(session)}>
          J’ai noté mes codes, entrer dans mon espace
        </button>
      </AuthCard>
    );
  }

  if (step === 'two-factor') {
    return (
      <AuthCard eyebrow={info.cabinet_name ?? undefined} title="Protégez votre compte"
        subtitle="Votre cabinet exige la double authentification : à chaque connexion, un code s’ajoute au mot de passe.">
        {progress}
        {!setup ? (
          <div className="space-y-3">
            <button type="button" disabled={submitting} onClick={() => chooseMethod('totp')}
              className="flex w-full items-start gap-3 rounded-xl border border-gray-200 p-4 text-left transition hover:border-blue-400 hover:bg-blue-50/40">
              <PiDeviceMobileDuotone className="mt-0.5 h-6 w-6 shrink-0 text-blue-600" />
              <span>
                <span className="block text-sm font-semibold text-gray-900">Application d’authentification (recommandé)</span>
                <span className="block text-xs text-gray-600">Google Authenticator, Microsoft Authenticator, 1Password… Fonctionne même sans réseau.</span>
              </span>
            </button>
            <button type="button" disabled={submitting} onClick={() => chooseMethod('email')}
              className="flex w-full items-start gap-3 rounded-xl border border-gray-200 p-4 text-left transition hover:border-blue-400 hover:bg-blue-50/40">
              <PiEnvelopeSimpleDuotone className="mt-0.5 h-6 w-6 shrink-0 text-blue-600" />
              <span>
                <span className="block text-sm font-semibold text-gray-900">Code par courriel</span>
                <span className="block text-xs text-gray-600">Un code à 6 chiffres vous est envoyé à chaque connexion.</span>
              </span>
            </button>
            {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <button type="button" onClick={() => setStep('password')} className="w-full text-center text-sm text-gray-500 hover:underline">
              Revenir au mot de passe
            </button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (code.trim()) finish(code.trim()); }}>
            {setup.method === 'totp' ? (
              <div className="space-y-3 text-sm text-gray-700">
                <p>1. Scannez ce code avec votre application d’authentification.</p>
                <div className="flex justify-center rounded-xl border border-gray-200 bg-white p-4">
                  <QRCodeSVG value={setup.otpauth_uri ?? ''} size={168} />
                </div>
                <p className="text-xs text-gray-500">
                  Impossible de scanner ? Entrez cette clé à la main :{' '}
                  <code className="select-all break-all rounded bg-gray-100 px-1.5 py-0.5 font-mono text-gray-800" data-testid="totp-secret">{setup.secret}</code>
                </p>
                <p>2. Entrez le code à 6 chiffres affiché par l’application.</p>
              </div>
            ) : (
              <p className="text-sm text-gray-700">
                Un code à 6 chiffres vient d’être envoyé à <strong>{setup.email_hint}</strong>. Il est valable quelques minutes.
              </p>
            )}
            <div>
              <label htmlFor="two_factor_code" className="mb-1 block text-sm font-medium text-gray-700">Code de vérification</label>
              <input id="two_factor_code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric" autoComplete="one-time-code" autoFocus placeholder="123456"
                className={`${inputClass} text-center font-mono text-lg tracking-[0.4em]`} />
            </div>
            {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <button type="submit" disabled={code.length < 6 || submitting} className={primaryButtonClass}>
              {submitting ? 'Vérification…' : 'Vérifier et activer mon compte'}
            </button>
            <div className="flex justify-between text-sm">
              <button type="button" onClick={() => { setSetup(null); setError(null); }} className="text-gray-500 hover:underline">Changer de méthode</button>
              {setup.method === 'email' && (
                <button type="button" disabled={submitting} onClick={() => chooseMethod('email')} className="text-blue-700 hover:underline">Renvoyer le code</button>
              )}
            </div>
          </form>
        )}
      </AuthCard>
    );
  }

  return (
    <AuthCard
      eyebrow={info.cabinet_name ?? undefined}
      title={isInvite ? 'Activez votre compte' : 'Nouveau mot de passe'}
      subtitle={isInvite
        ? <>Bonjour <strong>{info.name}</strong>, choisissez votre mot de passe pour rejoindre l&apos;équipe.</>
        : <>Bonjour <strong>{info.name}</strong>, choisissez un nouveau mot de passe.</>}
    >
      {progress}
      <form onSubmit={handlePassword} className="space-y-5">
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
          <span className="text-xs text-gray-500">Identifiant :</span>{' '}
          <span className="font-medium text-gray-900">{info.email}</span>
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">Mot de passe</label>
          <div className="relative">
            <input id="password" type={showPwd ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
              required autoFocus autoComplete="new-password" className={`${inputClass} pr-10`} />
            <button type="button" onClick={() => setShowPwd((v) => !v)} aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-700">
              {showPwd ? <PiEyeSlashDuotone className="h-5 w-5" /> : <PiEyeDuotone className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="confirm" className="mb-1 block text-sm font-medium text-gray-700">Confirmer le mot de passe</label>
          <input id="confirm" type={showPwd ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)}
            required autoComplete="new-password" className={inputClass} />
          {confirm.length > 0 && !passwordsMatch && <p className="mt-1 text-xs text-red-600">Les mots de passe ne correspondent pas.</p>}
        </div>
        <PasswordChecklist password={password} />
        {info.two_factor_required && (
          <p className="flex items-start gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-900">
            <PiShieldCheckDuotone className="mt-0.5 h-4 w-4 shrink-0" />
            Étape suivante : la double authentification, exigée par votre cabinet.
          </p>
        )}
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={!canSubmit} className={primaryButtonClass}>
          {submitting ? 'Enregistrement…' : info.two_factor_required ? 'Continuer' : isInvite ? 'Activer mon compte' : 'Enregistrer le mot de passe'}
        </button>
      </form>
    </AuthCard>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <SetPasswordContent />
    </Suspense>
  );
}
