'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { PiCheckCircleDuotone, PiXCircleDuotone, PiEyeDuotone, PiEyeSlashDuotone } from 'react-icons/pi';
import { collabActivationService } from '@/services/collaborators';

type Check = { key: string; label: string; test: (s: string) => boolean };

const CHECKS: Check[] = [
  { key: 'len', label: 'Au moins 8 caractères', test: (s) => s.length >= 8 },
  { key: 'upper', label: 'Une lettre majuscule (A-Z)', test: (s) => /[A-Z]/.test(s) },
  { key: 'lower', label: 'Une lettre minuscule (a-z)', test: (s) => /[a-z]/.test(s) },
  { key: 'digit', label: 'Un chiffre (0-9)', test: (s) => /[0-9]/.test(s) },
  { key: 'spec', label: 'Un caractère spécial (!@#$%…)', test: (s) => /[^A-Za-z0-9]/.test(s) },
];

export default function CollabActivatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') ?? '';

  const [checking, setChecking] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [collab, setCollab] = useState<{ first_name: string; last_name: string; email: string } | null>(null);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenError('Lien d\'activation manquant.');
      setChecking(false);
      return;
    }
    (async () => {
      try {
        const data = await collabActivationService.checkToken(token);
        setCollab(data);
      } catch (e: any) {
        setTokenError(e.message || 'Lien invalide.');
      } finally {
        setChecking(false);
      }
    })();
  }, [token]);

  const passwordChecks = CHECKS.map((c) => ({ ...c, passed: c.test(password) }));
  const allPassed = passwordChecks.every((c) => c.passed);
  const passwordsMatch = password.length > 0 && password === confirm;
  const canSubmit = allPassed && passwordsMatch && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      setSubmitting(true);
      await collabActivationService.activate(token, password, confirm);
      toast.success('Compte activé. Vous pouvez maintenant vous connecter.');
      router.replace('/collab/login');
    } catch (e: any) {
      toast.error(e.message || 'Activation impossible.');
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="mb-4 text-6xl">⛔</div>
          <h1 className="text-2xl font-bold text-red-700">Lien invalide</h1>
          <p className="mt-2 text-sm text-gray-600">{tokenError}</p>
          <p className="mt-4 text-xs text-gray-500">
            Contactez votre administrateur pour qu&apos;il vous renvoie un nouveau lien d&apos;activation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-6">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* En-tête */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Volonté Canada</p>
          <h1 className="mt-1 text-2xl font-bold">Activez votre compte</h1>
          {collab && (
            <p className="mt-1 text-sm opacity-90">
              Bonjour <strong>{collab.first_name}</strong>, définissez votre mot de passe pour terminer la création de votre accès.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-7">
          {collab && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
              <span className="text-xs text-gray-500">Identifiant :</span>{' '}
              <span className="font-medium text-gray-900">{collab.email}</span>
            </div>
          )}

          {/* Mot de passe */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nouveau mot de passe</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-700"
              >
                {showPwd ? <PiEyeSlashDuotone className="h-5 w-5" /> : <PiEyeDuotone className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Confirmation */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Confirmer le mot de passe</label>
            <input
              type={showPwd ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                confirm.length === 0
                  ? 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
                  : passwordsMatch
                    ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20'
                    : 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
              }`}
            />
            {confirm.length > 0 && !passwordsMatch && (
              <p className="mt-1 text-xs text-red-600">Les mots de passe ne correspondent pas.</p>
            )}
            {confirm.length > 0 && passwordsMatch && (
              <p className="mt-1 text-xs text-emerald-700">Les mots de passe correspondent ✓</p>
            )}
          </div>

          {/* Checks live */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-600">Règles de sécurité</p>
            <ul className="space-y-1.5">
              {passwordChecks.map((c) => (
                <li key={c.key} className={`flex items-center gap-2 text-sm transition-colors ${
                  c.passed ? 'text-emerald-700' : 'text-gray-500'
                }`}>
                  {c.passed
                    ? <PiCheckCircleDuotone className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                    : <PiXCircleDuotone className="h-4 w-4 flex-shrink-0 text-gray-400" />}
                  <span>{c.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:shadow-xl hover:shadow-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Activation…' : 'Activer mon compte et continuer'}
          </button>
        </form>
      </div>
    </div>
  );
}
