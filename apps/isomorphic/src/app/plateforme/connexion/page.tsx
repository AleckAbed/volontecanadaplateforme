'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthCard, { inputClass, primaryButtonClass } from '@/components/auth/auth-card';
import { platformService } from '@/services/team';
import CodeStep from '@/components/auth/code-step';

export default function PlatformLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setSubmitting(true);
      const res: any = await platformService.login(email.trim(), password);
      if (res?.data?.two_factor_required) {
        setChallenge(res.data.challenge);
        return;
      }
      router.replace('/plateforme');
    } catch (err: any) {
      setError(err.message || 'Connexion impossible.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard spaces={false} eyebrow="Éditeur de la plateforme" title="Console plateforme" subtitle="Accès réservé à l'équipe de l'éditeur.">
      {challenge ? (
        <CodeStep
          hint="Entrez le code à 6 chiffres de votre application d’authentification."
          allowRecovery
          onCancel={() => setChallenge(null)}
          onSubmit={async (value, isRecovery) => {
            try {
              await platformService.verifyTwoFactor(challenge, isRecovery ? { recovery_code: value } : { code: value });
              router.replace('/plateforme');
              return null;
            } catch (e: any) {
              if (/expiré|Trop d/.test(e.message ?? '')) setChallenge(null);
              return e.message || 'Code incorrect.';
            }
          }}
        />
      ) : (
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">Courriel</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus autoComplete="username" className={inputClass} />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">Mot de passe</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" className={inputClass} />
        </div>
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={submitting} className={primaryButtonClass}>
          {submitting ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
      )}
    </AuthCard>
  );
}
