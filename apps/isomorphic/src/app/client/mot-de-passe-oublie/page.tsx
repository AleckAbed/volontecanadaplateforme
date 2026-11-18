'use client';

import { useState } from 'react';
import AuthCard, { AuthLink, inputClass, primaryButtonClass } from '@/components/auth/auth-card';
import { clientAccessService } from '@/services/client-profile';

export default function ClientForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setSubmitting(true);
      setSent(await clientAccessService.forgotPassword(email.trim()));
    } catch (err: any) {
      setError(err.message || 'La demande a échoué. Réessayez dans un instant.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      eyebrow="Portail client"
      title="Mot de passe oublié"
      subtitle="Recevez par courriel un lien pour choisir un nouveau mot de passe."
      footer={<AuthLink href="/auth/client-signin">Retour à la connexion</AuthLink>}
    >
      {sent ? (
        <div role="status" className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {sent}
          <p className="mt-2 text-emerald-700">Pensez à vérifier vos courriels indésirables.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">Votre courriel</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              required autoFocus autoComplete="email" className={inputClass} />
          </div>
          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={submitting || email.trim() === ''} className={primaryButtonClass}>
            {submitting ? 'Envoi…' : 'Envoyer le lien'}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
