'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthCard, { AuthLink, inputClass, primaryButtonClass } from '@/components/auth/auth-card';
import { companyPortalService } from '@/services/companies';

/** Connexion à l'espace entreprise (contacts RH invités par le cabinet). */
export default function CompanyLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setSubmitting(true);
      await companyPortalService.login(email.trim(), password);
      router.replace('/entreprise');
    } catch (err: any) {
      setError(err.message || 'Connexion impossible.');
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title={<>Bonjour !<br />Suivez vos employés.</>}
      subtitle="Connectez-vous avec le courriel invité par votre cabinet."
      footer={<AuthLink href="/entreprise/mot-de-passe-oublie">Mot de passe oublié ?</AuthLink>}
    >
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">Courriel</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            required autoFocus autoComplete="email" className={inputClass} />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">Mot de passe</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            required autoComplete="current-password" className={inputClass} />
        </div>
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={submitting || !email.trim() || !password} className={primaryButtonClass}>
          {submitting ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </AuthCard>
  );
}
