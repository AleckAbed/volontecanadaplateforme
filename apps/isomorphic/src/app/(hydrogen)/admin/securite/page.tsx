'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { PiShieldCheckDuotone, PiDeviceMobileDuotone, PiEnvelopeSimpleDuotone, PiCopyBold, PiDownloadSimpleBold } from 'react-icons/pi';
import { twoFactorService, TwoFactorStatus, TwoFactorSetup } from '@/services/security';

/** Sécurité du compte (2.7) : double authentification, codes de secours ; pour les gestionnaires, l'obligation pour l'équipe. */
function SecurityPage() {
  const params = useSearchParams();
  const mandatory = params?.get('obligatoire') === '1';
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);

  const load = useCallback(() => twoFactorService.status().then(setStatus).catch((e: any) => toast.error(e.message)), []);
  useEffect(() => { load(); }, [load]);

  if (!status) return <div className="p-6 text-sm text-gray-500">Chargement…</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <header className="flex items-start gap-3">
        <PiShieldCheckDuotone className="mt-0.5 h-8 w-8 shrink-0 text-blue-600" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">Sécurité du compte</h1>
          <p className="text-sm text-gray-600">
            La double authentification demande, en plus du mot de passe, un code à usage unique. Un mot de passe volé ne suffit plus pour ouvrir les dossiers de vos clients.
          </p>
        </div>
      </header>

      {mandatory && !status.enabled && (
        <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Votre cabinet exige la double authentification. Activez-la pour continuer à utiliser la plateforme.
        </p>
      )}

      {codes ? (
        <RecoveryCodes codes={codes} onDone={() => { setCodes(null); load(); }} />
      ) : setup ? (
        <ConfirmSetup setup={setup} onCancel={() => setSetup(null)} onDone={(c) => { setSetup(null); setCodes(c); }} />
      ) : (
        <StatusCard status={status} onSetup={setSetup} onCodes={setCodes} onChanged={load} />
      )}

      {status.can_manage && <TeamRequirement status={status} onChanged={load} />}
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={null}><SecurityPage /></Suspense>;
}

function PasswordPrompt({ label, busy, onSubmit, danger }: { label: string; busy: boolean; onSubmit: (pw: string) => void; danger?: boolean }) {
  const [pw, setPw] = useState('');
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (pw) onSubmit(pw); }} className="mt-3 flex flex-wrap items-end gap-2">
      <label className="text-sm">
        <span className="text-gray-700">Mot de passe</span>
        <input type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)}
          className="mt-1 block rounded-lg border border-gray-300 px-3 py-2" />
      </label>
      <button disabled={busy || !pw} className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
        {busy ? 'Un instant…' : label}
      </button>
    </form>
  );
}

function StatusCard({ status, onSetup, onCodes, onChanged }: {
  status: TwoFactorStatus; onSetup: (s: TwoFactorSetup) => void; onCodes: (c: string[]) => void; onChanged: () => void;
}) {
  const [method, setMethod] = useState<'totp' | 'email'>('totp');
  const [mode, setMode] = useState<'idle' | 'setup' | 'disable' | 'codes'>('idle');
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try { await fn(); } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-base font-semibold text-gray-900">Double authentification</h2>
      {status.enabled ? (
        <p className="mt-1 text-sm text-gray-700">
          <span className="font-semibold text-emerald-700">Activée</span> — {status.method === 'totp' ? 'application d’authentification' : 'code par courriel'}.
          Codes de secours restants : <strong>{status.recovery_codes_left}</strong> / 8.
        </p>
      ) : (
        <p className="mt-1 text-sm text-gray-700"><span className="font-semibold text-red-700">Désactivée.</span> Choisissez une méthode :</p>
      )}

      {(!status.enabled || mode === 'setup') && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {([
            ['totp', PiDeviceMobileDuotone, 'Application (recommandé)', 'Google Authenticator, Microsoft Authenticator, 1Password… Fonctionne sans réseau.'],
            ['email', PiEnvelopeSimpleDuotone, 'Code par courriel', 'Un code vous est envoyé à chaque connexion. Moins sûr si votre messagerie est compromise.'],
          ] as const).map(([value, Icon, title, text]) => (
            <label key={value} className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${method === value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
              <input type="radio" name="method" className="mt-1" checked={method === value} onChange={() => setMethod(value)} />
              <span>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-900"><Icon className="h-5 w-5" /> {title}</span>
                <span className="text-xs text-gray-600">{text}</span>
              </span>
            </label>
          ))}
        </div>
      )}

      {!status.enabled || mode === 'setup' ? (
        <PasswordPrompt label={status.enabled ? 'Changer de méthode' : 'Activer'} busy={busy}
          onSubmit={(pw) => run(async () => onSetup(await twoFactorService.setup(method, pw)))} />
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => setMode('setup')} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50">Changer de méthode</button>
          <button onClick={() => setMode('codes')} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50">Nouveaux codes de secours</button>
          {!status.required_by_cabinet && (
            <button onClick={() => setMode('disable')} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50">Désactiver</button>
          )}
        </div>
      )}

      {mode === 'codes' && (
        <PasswordPrompt label="Créer de nouveaux codes" busy={busy}
          onSubmit={(pw) => run(async () => { onCodes(await twoFactorService.regenerate(pw)); setMode('idle'); })} />
      )}
      {mode === 'disable' && (
        <PasswordPrompt label="Désactiver" danger busy={busy}
          onSubmit={(pw) => run(async () => { toast.success(await twoFactorService.disable(pw)); setMode('idle'); onChanged(); })} />
      )}
    </section>
  );
}

function ConfirmSetup({ setup, onCancel, onDone }: { setup: TwoFactorSetup; onCancel: () => void; onDone: (codes: string[]) => void }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const confirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      onDone(await twoFactorService.confirm(code.trim()));
      toast.success('Double authentification activée.');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-xl border border-blue-200 bg-white p-4 shadow-sm sm:p-5">
      {setup.method === 'totp' ? (
        <>
          <h2 className="text-base font-semibold text-gray-900">1. Scannez ce code avec votre application</h2>
          <div className="mt-3 flex flex-col items-start gap-4 sm:flex-row">
            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <QRCodeSVG value={setup.otpauth_uri} size={176} aria-label="Code QR à scanner" />
            </div>
            <div className="text-sm text-gray-700">
              <p>Impossible de scanner ? Saisissez cette clé dans l’application :</p>
              <p className="mt-2 flex items-center gap-2">
                <code className="break-all rounded bg-gray-100 px-2 py-1 font-mono text-xs">{setup.secret.replace(/(.{4})/g, '$1 ').trim()}</code>
                <button type="button" onClick={() => { navigator.clipboard?.writeText(setup.secret); toast.success('Clé copiée.'); }} aria-label="Copier la clé" className="text-gray-500 hover:text-gray-900">
                  <PiCopyBold className="h-4 w-4" />
                </button>
              </p>
            </div>
          </div>
          <h2 className="mt-5 text-base font-semibold text-gray-900">2. Entrez le code à 6 chiffres affiché</h2>
        </>
      ) : (
        <h2 className="text-base font-semibold text-gray-900">Entrez le code envoyé à {setup.email_hint}</h2>
      )}
      <form onSubmit={confirm} className="mt-3 flex flex-wrap items-end gap-2">
        <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus
          aria-label="Code de vérification" className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-center font-mono text-lg tracking-widest" />
        <button disabled={busy || code.trim().length !== 6} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {busy ? 'Vérification…' : 'Confirmer'}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700">Annuler</button>
      </form>
    </section>
  );
}

function RecoveryCodes({ codes, onDone }: { codes: string[]; onDone: () => void }) {
  const [saved, setSaved] = useState(false);
  const download = () => {
    const blob = new Blob([`Codes de secours (un seul usage chacun)\n\n${codes.join('\n')}\n`], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'codes-de-secours.txt';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <section className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-base font-semibold text-gray-900">Vos codes de secours</h2>
      <p className="mt-1 text-sm text-gray-700">
        Si vous perdez votre téléphone, chacun de ces codes permet une connexion. <strong>Ils ne seront plus jamais affichés</strong> : gardez-les dans votre gestionnaire de mots de passe.
      </p>
      <ul className="mt-3 grid grid-cols-2 gap-2 font-mono text-sm sm:grid-cols-4">
        {codes.map((c) => <li key={c} className="rounded bg-gray-100 px-2 py-1 text-center">{c}</li>)}
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button onClick={download} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50">
          <PiDownloadSimpleBold className="h-4 w-4" /> Télécharger
        </button>
        <button onClick={() => { navigator.clipboard?.writeText(codes.join('\n')); toast.success('Codes copiés.'); }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50">
          <PiCopyBold className="h-4 w-4" /> Copier
        </button>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} /> Je les ai mis en lieu sûr
        </label>
        <button disabled={!saved} onClick={onDone} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">Terminer</button>
      </div>
    </section>
  );
}

function TeamRequirement({ status, onChanged }: { status: TwoFactorStatus; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const toggle = async () => {
    setBusy(true);
    try {
      toast.success(await twoFactorService.setRequired(!status.required_by_cabinet));
      onChanged();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-base font-semibold text-gray-900">Pour toute l’équipe</h2>
      <p className="mt-1 text-sm text-gray-700">
        {status.required_by_cabinet
          ? 'La double authentification est obligatoire : un membre qui ne l’a pas activée ne peut rien faire d’autre que l’activer.'
          : 'Rendez la double authentification obligatoire pour tous les membres du cabinet. Recommandé avant d’accueillir vos clients sur la plateforme.'}
      </p>
      <p className="mt-1 text-xs text-gray-500">Un membre a perdu son téléphone ? Réinitialisez sa double authentification depuis la page Équipe.</p>
      <button onClick={toggle} disabled={busy || (!status.enabled && !status.required_by_cabinet)}
        className="mt-3 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50">
        {status.required_by_cabinet ? 'Ne plus l’exiger' : 'L’exiger pour toute l’équipe'}
      </button>
      {!status.enabled && !status.required_by_cabinet && <p className="mt-1 text-xs text-gray-500">Activez-la d’abord pour vous-même.</p>}
    </section>
  );
}
