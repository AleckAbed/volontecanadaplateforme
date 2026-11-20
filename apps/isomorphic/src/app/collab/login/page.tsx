'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { collabWorkspaceService } from '@/services/collaborators';
import { setAuthToken } from '@/lib/auth-storage';
import CodeStep from '@/components/auth/code-step';
import AuthShell from '@/components/auth/auth-shell';
import { inputClass, primaryButtonClass } from '@/components/auth/auth-card';

export default function CollaboratorLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [challenge, setChallenge] = useState<{ id: string; hint: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const data = await collabWorkspaceService.login(email, password);
      if (data.two_factor_required && data.challenge) {
        setChallenge({ id: data.challenge, hint: data.email_hint ?? 'votre adresse' });
        return;
      }
      openSession(data);
    } catch (e: any) {
      toast.error(e.message || 'Connexion impossible');
    } finally {
      setSubmitting(false);
    }
  };

  const openSession = (data: { collaborator: any; token: string }) => {
    if (data.token) setAuthToken(data.token);
    try {
      // On marque la session comme « collaborator » pour que ProtectedRoute n'aille
      // pas vérifier la session admin/client précédente avec le token collab.
      localStorage.setItem('user_type', 'collaborator');
      localStorage.setItem('collab_user', JSON.stringify(data.collaborator));
    } catch {}
    toast.success('Connexion réussie');
    router.push('/collab/dossiers');
  };

  return (
    <AuthShell>
      <div>
        <h1 className="text-3xl font-bold leading-tight text-gray-900 sm:text-[2.1rem]">Bonjour !<br />Vos dossiers assignés vous attendent.</h1>
        <p className="mt-2 text-sm text-gray-500">
          Connectez-vous pour accéder aux dossiers sur lesquels vous êtes assigné.
        </p>

        {challenge ? (
          <div className="mt-6">
            <CodeStep
              hint={`Entrez le code à 6 chiffres envoyé à ${challenge.hint}. Il est valable 10 minutes.`}
              onCancel={() => setChallenge(null)}
              onResend={async () => {
                try { toast.success(await collabWorkspaceService.resendTwoFactor(challenge.id)); } catch (e: any) { toast.error(e.message); setChallenge(null); }
              }}
              onSubmit={async (value) => {
                try {
                  openSession(await collabWorkspaceService.verifyTwoFactor(challenge.id, value));
                  return null;
                } catch (e: any) {
                  if (/expiré|Trop d/.test(e.message ?? '')) setChallenge(null);
                  return e.message || 'Code incorrect.';
                }
              }}
            />
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="collab-email" className="mb-1 block text-sm font-medium text-gray-700">Courriel</label>
            <input
              id="collab-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="collab-password" className="mb-1 block text-sm font-medium text-gray-700">Mot de passe</label>
            <input
              id="collab-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className={primaryButtonClass}
          >
            {submitting ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
        )}

        <p className="mt-6 text-center text-xs text-gray-400">
          Pas de compte ? Contactez l&apos;administrateur.
        </p>
      </div>
    </AuthShell>
  );
}
