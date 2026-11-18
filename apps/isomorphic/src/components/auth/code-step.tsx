'use client';

import { useState } from 'react';

/**
 * Saisie du code de double authentification (2.7) pour la console plateforme et les
 * collaborateurs : code de l'application ou du courriel, code de secours en option.
 */
export default function CodeStep({
  hint,
  allowRecovery = false,
  onSubmit,
  onResend,
  onCancel,
}: {
  hint: string;
  allowRecovery?: boolean;
  onSubmit: (value: string, isRecovery: boolean) => Promise<string | null>; // renvoie un message d'erreur ou null
  onResend?: () => void;
  onCancel: () => void;
}) {
  const [code, setCode] = useState('');
  const [recovery, setRecovery] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    setError(null);
    const err = await onSubmit(code.trim(), recovery);
    setBusy(false);
    if (err) {
      setError(err);
      setCode('');
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Vérification en deux étapes</h2>
        <p className="mt-1 text-sm text-gray-600">{recovery ? 'Entrez l’un de vos codes de secours (XXXX-XXXX).' : hint}</p>
      </div>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        inputMode={recovery ? 'text' : 'numeric'}
        autoComplete="one-time-code"
        autoFocus
        maxLength={recovery ? 9 : 6}
        aria-label={recovery ? 'Code de secours' : 'Code de vérification'}
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-center font-mono text-lg tracking-widest"
      />
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={busy || !code.trim()} className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
        {busy ? 'Vérification…' : 'Vérifier'}
      </button>
      <div className="flex flex-wrap justify-between gap-2 text-sm">
        {allowRecovery && (
          <button type="button" onClick={() => { setRecovery(!recovery); setCode(''); setError(null); }} className="font-medium text-gray-700 underline">
            {recovery ? 'Utiliser le code de l’application' : 'Utiliser un code de secours'}
          </button>
        )}
        {onResend && !recovery && <button type="button" onClick={onResend} className="font-medium text-gray-700 underline">Renvoyer le code</button>}
        <button type="button" onClick={onCancel} className="text-gray-500 hover:text-gray-800">Annuler</button>
      </div>
    </form>
  );
}
