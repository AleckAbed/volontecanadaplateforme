'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthCard, { inputClass, primaryButtonClass } from '@/components/auth/auth-card';
import { platformService } from '@/services/team';

export default function PlatformLoginPage() {
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
      await platformService.login(email.trim(), password);
      router.replace('/plateforme');
    } catch (err: any) {
      setError(err.message || 'Connexion impossible.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard eyebrow="Éditeur de la plateforme" title="Console plateforme" subtitle="Accès réservé à l'équipe de l'éditeur.">
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
    </AuthCard>
  );
}
