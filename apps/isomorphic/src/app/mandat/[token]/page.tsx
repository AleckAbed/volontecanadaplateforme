'use client';

import { use, useEffect, useState } from 'react';
import { PiCheckCircleFill, PiSealCheckDuotone } from 'react-icons/pi';
import { mandateService, PublicMandate } from '@/services/booking';

/** Mandat de représentation lu et signé par le client depuis son lien. */
export default function MandatePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [m, setM] = useState<PublicMandate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);

  useEffect(() => {
    mandateService.publicGet(token).then((d) => { setM(d); setName(d.client_name); }).catch((e: any) => setError(e.message || 'Mandat introuvable.'));
  }, [token]);

  const sign = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignError(null);
    setBusy(true);
    try {
      setM(await mandateService.sign(token, name, consent));
    } catch (err: any) {
      setSignError(err.message || 'La signature a échoué.');
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return <div role="alert" className="mx-auto mt-16 max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">{error}</div>;
  }
  if (!m) {
    return <div className="flex min-h-screen items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" aria-label="Chargement" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 print:bg-white print:p-0">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm text-gray-500">{m.cabinet}</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{m.title}</h1>
          <div className="mt-5 whitespace-pre-line text-[15px] leading-relaxed text-gray-800">{m.body}</div>

          {m.status === 'signed' && (
            <div className="mt-6 flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
              <PiCheckCircleFill className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div>
                <p className="font-semibold">Signé électroniquement par {m.signed_name}</p>
                <p>le {m.signed_at ? new Date(m.signed_at).toLocaleString('fr-CA', { dateStyle: 'long', timeStyle: 'short' }) : ''}. Une copie vous a été envoyée par courriel.</p>
                <p className="mt-1 break-all text-xs text-emerald-800/80">Empreinte du texte (SHA-256) : {m.body_hash}</p>
              </div>
            </div>
          )}
          {m.status === 'void' && (
            <p className="mt-6 rounded-xl bg-gray-100 p-4 text-sm text-gray-700">Ce mandat a été annulé par le cabinet. Il n’est plus à signer.</p>
          )}
        </div>

        {m.status === 'sent' && (
          <form onSubmit={sign} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm print:hidden">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900"><PiSealCheckDuotone className="h-6 w-6 text-blue-600" /> Signer le mandat</h2>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-gray-700">Votre nom complet (signature) *</span>
              <input required minLength={3} maxLength={150} value={name} onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 font-serif text-lg italic focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </label>
            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input type="checkbox" required className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>J’ai lu ce mandat et je le signe électroniquement. Je comprends que ma signature, la date, mon adresse IP et l’empreinte du texte sont conservées comme preuve.</span>
            </label>
            {signError && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{signError}</p>}
            <button type="submit" disabled={busy} className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
              {busy ? 'Signature…' : 'Je signe le mandat'}
            </button>
          </form>
        )}
        {m.status === 'signed' && (
          <button onClick={() => window.print()} className="mx-auto block rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 print:hidden">Imprimer / PDF</button>
        )}
      </div>
    </div>
  );
}
