'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button, Input } from 'rizzui';
import { useAuth } from '@/hooks/useAuth';
import api from '@/services/api';

export type TwoFactorChallenge = { challenge: string; method: 'totp' | 'email'; email_hint: string | null };

/** Second temps de la connexion du personnel (2.7) : code de l'application, du courriel ou de secours. */
export default function TwoFactorStep({ challenge, onCancel }: { challenge: TwoFactorChallenge; onCancel: () => void }) {
  const { verifyAdminTwoFactor, isLoading } = useAuth();
  const [code, setCode] = useState('');
  const [useRecovery, setUseRecovery] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const value = code.trim();
    if (!value) return;
    const res = await verifyAdminTwoFactor(challenge.challenge, useRecovery ? { recovery_code: value } : { code: value });
    if (!res.ok) {
      if (res.expired) {
        toast.error(res.message || 'La vérification a expiré. Reconnectez-vous.');
        onCancel();
        return;
      }
      setError(res.message || 'Code incorrect.');
      setCode('');
    }
  };

  const resend = async () => {
    try {
      const r: any = await api.adminTwoFactorResend(challenge.challenge);
      toast.success(r.message || 'Nouveau code envoyé.');
    } catch (e: any) {
      toast.error(e.message);
      onCancel();
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Vérification en deux étapes</h2>
        <p className="mt-1 text-sm text-gray-600">
          {useRecovery
            ? 'Entrez l’un de vos codes de secours (format XXXX-XXXX). Chacun ne sert qu’une fois.'
            : challenge.method === 'email'
              ? `Entrez le code à 6 chiffres envoyé à ${challenge.email_hint ?? 'votre adresse'}. Il est valable 10 minutes.`
              : 'Entrez le code à 6 chiffres affiché dans votre application d’authentification.'}
        </p>
      </div>

      <Input
        label={useRecovery ? 'Code de secours' : 'Code de vérification'}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        inputMode={useRecovery ? 'text' : 'numeric'}
        autoComplete="one-time-code"
        autoFocus
        maxLength={useRecovery ? 9 : 6}
        size="xl"
        rounded="pill"
        error={error ?? undefined}
        disabled={isLoading}
      />

      <Button type="submit" size="xl" rounded="pill" className="w-full text-base font-bold" isLoading={isLoading} disabled={isLoading || !code.trim()}>
        Vérifier
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <button type="button" onClick={() => { setUseRecovery(!useRecovery); setCode(''); setError(null); }} className="font-semibold text-gray-700 underline hover:text-gray-900">
          {useRecovery ? 'Utiliser mon code habituel' : 'Utiliser un code de secours'}
        </button>
        {challenge.method === 'email' && !useRecovery && (
          <button type="button" onClick={resend} className="font-semibold text-gray-700 underline hover:text-gray-900">Renvoyer le code</button>
        )}
        <button type="button" onClick={onCancel} className="text-gray-500 hover:text-gray-800">Annuler</button>
      </div>
    </form>
  );
}
