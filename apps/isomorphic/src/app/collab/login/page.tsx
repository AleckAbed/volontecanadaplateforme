'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { collabWorkspaceService } from '@/services/collaborators';
import { setAuthToken } from '@/lib/auth-storage';

export default function CollaboratorLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const data = await collabWorkspaceService.login(email, password);
      if (data.token) setAuthToken(data.token);
      try {
        localStorage.setItem('collab_user', JSON.stringify(data.collaborator));
      } catch {}
      toast.success('Connexion réussie');
      router.push('/collab/dossiers');
    } catch (e: any) {
      toast.error(e.message || 'Connexion impossible');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <p className="text-center text-xs font-semibold uppercase tracking-wide text-red-700">
          Volonté Canada
        </p>
        <h1 className="mt-2 text-center text-2xl font-bold text-gray-900">Espace collaborateur</h1>
        <p className="mt-2 text-center text-sm text-gray-500">
          Connectez-vous pour accéder aux dossiers sur lesquels vous êtes assigné.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Courriel</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          Pas de compte ? Contactez l'administrateur.
        </p>
      </div>
    </div>
  );
}
