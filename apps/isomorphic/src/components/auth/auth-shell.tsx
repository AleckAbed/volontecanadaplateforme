'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { PiArrowLeftBold } from 'react-icons/pi';
import { siteConfig } from '@/config/site.config';

export type AuthActor = 'firm' | 'client' | 'company' | 'collaborator' | 'platform';

/** Espace concerné par une page d'accès, d'après son adresse. */
export function actorForPath(path: string): AuthActor {
  if (path.startsWith('/auth/client-signin') || path.startsWith('/client')) return 'client';
  if (path.startsWith('/entreprise')) return 'company';
  if (path.startsWith('/collab')) return 'collaborator';
  if (path.startsWith('/plateforme')) return 'platform';
  return 'firm';
}

/**
 * Identité visuelle de chaque espace : couleur, promesse et aperçu de ce qui attend la
 * personne une fois connectée. Les classes sont écrites en entier pour Tailwind.
 */
export const ACTOR_THEMES: Record<AuthActor, {
  label: string;
  accent: string;       // couleur principale (boutons, liens), aussi exposée en --auth-accent
  accentDark: string;
  panel: string;        // fond du panneau de droite
  dot: string;
  headline: string;
  text: string;
}> = {
  firm: {
    label: 'Espace cabinet', accent: '#2563eb', accentDark: '#1d4ed8',
    panel: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-white', dot: 'bg-blue-600',
    headline: 'Vos dossiers d’immigration, enfin sous contrôle.',
    text: 'Clients, formulaires IRCC préremplis, échéances et factures : toute l’équipe travaille au même endroit.',
  },
  client: {
    label: 'Espace client', accent: '#0d9488', accentDark: '#0f766e',
    panel: 'bg-gradient-to-br from-teal-50 via-emerald-50 to-white', dot: 'bg-teal-600',
    headline: 'Votre projet d’immigration, étape par étape.',
    text: 'Voyez où en est votre dossier, envoyez vos documents en sécurité et échangez avec votre conseiller.',
  },
  company: {
    label: 'Espace entreprise', accent: '#d97706', accentDark: '#b45309',
    panel: 'bg-gradient-to-br from-amber-50 via-orange-50 to-white', dot: 'bg-amber-600',
    headline: 'L’immigration de vos employés, d’un coup d’œil.',
    text: 'Suivez les permis de vos travailleurs étrangers et leurs dates d’expiration, sans courir après l’information.',
  },
  collaborator: {
    label: 'Espace collaborateur', accent: '#7c3aed', accentDark: '#6d28d9',
    panel: 'bg-gradient-to-br from-violet-50 via-fuchsia-50 to-white', dot: 'bg-violet-600',
    headline: 'Les dossiers qui vous sont confiés.',
    text: 'Accédez seulement aux dossiers que le cabinet vous a assignés, et déposez vos pièces au bon endroit.',
  },
  platform: {
    label: 'Console plateforme', accent: '#0f172a', accentDark: '#020617',
    panel: 'bg-gradient-to-br from-slate-100 via-slate-50 to-white', dot: 'bg-slate-900',
    headline: 'Console de l’éditeur.',
    text: 'Cabinets, demandes d’ouverture et catalogue de modèles. Accès réservé à l’équipe de la plateforme.',
  },
};

/**
 * Cadre des pages d'accès : formulaire à gauche, panneau aux couleurs de l'espace à droite
 * (grand écran), avec un aperçu de ce que la personne trouvera une fois connectée.
 */
export default function AuthShell({
  children, actor, showSpaces = true, wide = false,
}: { children: React.ReactNode; actor?: AuthActor; showSpaces?: boolean; wide?: boolean }) {
  const pathname = usePathname() ?? '';
  const who = actor ?? actorForPath(pathname);
  const theme = ACTOR_THEMES[who];
  // Garde la page demandée (?redirect=) en revenant au choix de l'espace.
  const [backHref, setBackHref] = useState('/connexion');
  useEffect(() => {
    const redirect = new URLSearchParams(window.location.search).get('redirect');
    if (redirect) setBackHref(`/connexion?redirect=${encodeURIComponent(redirect)}`);
  }, []);

  return (
    <div
      className="grid min-h-screen bg-white lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]"
      style={{ ['--auth-accent' as any]: theme.accent, ['--auth-accent-dark' as any]: theme.accentDark }}
      data-actor={who}
    >
      <main className="flex min-w-0 flex-col px-5 py-6 sm:px-10 lg:px-14 xl:px-20">
        <div className="flex items-center justify-between gap-4">
          {showSpaces && who !== 'platform' ? (
            <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900">
              <PiArrowLeftBold className="h-4 w-4" /> Choisir un autre espace
            </Link>
          ) : <span />}
          <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
            <span className={`h-2 w-2 rounded-full ${theme.dot}`} /> {theme.label}
          </span>
        </div>
        <div className="mt-10 flex items-center gap-2.5 lg:mt-14">
          <span className="grid h-9 w-9 place-items-center rounded-xl text-sm font-bold text-white" style={{ background: theme.accent }}>
            {siteConfig.appName.charAt(0)}
          </span>
          <span className="text-lg font-bold tracking-tight text-gray-900">{siteConfig.appName}</span>
        </div>
        <div className="flex flex-1 items-start py-8 lg:items-center lg:py-10">
          <div className={`w-full ${wide ? 'max-w-xl' : 'max-w-md'}`}>{children}</div>
        </div>
        <p className="text-xs text-gray-400">© {new Date().getFullYear()} {siteConfig.appName} · Données hébergées au Canada</p>
      </main>

      <aside className={`relative hidden overflow-hidden lg:m-4 lg:flex lg:flex-col lg:justify-center lg:rounded-3xl ${theme.panel}`}>
        <div className="mx-auto w-full max-w-xl px-12 py-16 xl:px-16">
          <h2 className="text-3xl font-bold leading-tight text-gray-900 xl:text-4xl" style={{ textWrap: 'balance' } as any}>{theme.headline}</h2>
          <p className="mt-4 text-base leading-relaxed text-gray-600">{theme.text}</p>
          <div className="mt-10"><ActorPreview actor={who} /></div>
        </div>
      </aside>
    </div>
  );
}

// ─── Aperçus (exemples fictifs) ────────────────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-white/70 bg-white p-4 shadow-xl shadow-gray-900/5 ${className}`}>{children}</div>;
}

function Pill({ children, tone }: { children: React.ReactNode; tone: 'ok' | 'warn' | 'info' | 'late' }) {
  const cls = { ok: 'bg-emerald-50 text-emerald-700', warn: 'bg-amber-50 text-amber-800', info: 'bg-blue-50 text-blue-700', late: 'bg-red-50 text-red-700' }[tone];
  return <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{children}</span>;
}

function ActorPreview({ actor }: { actor: AuthActor }) {
  if (actor === 'client') {
    const steps: [string, 'done' | 'now' | 'next'][] = [
      ['Dossier ouvert', 'done'], ['Documents envoyés', 'done'], ['Formulaires IRCC remplis', 'now'], ['Dépôt de la demande', 'next'], ['Décision', 'next'],
    ];
    return (
      <div className="relative">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Permis d’études · Montréal</p>
          <ol className="mt-3 space-y-3">
            {steps.map(([s, st]) => (
              <li key={s} className="flex items-center gap-3 text-sm">
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${st === 'done' ? 'bg-teal-600 text-white' : st === 'now' ? 'border-2 border-teal-600 text-teal-700' : 'border border-gray-300 text-gray-400'}`}>
                  {st === 'done' ? '✓' : ''}
                </span>
                <span className={st === 'next' ? 'text-gray-400' : 'font-medium text-gray-800'}>{s}</span>
                {st === 'now' && <Pill tone="info">En cours</Pill>}
              </li>
            ))}
          </ol>
        </Card>
        <Card className="absolute -bottom-8 -right-4 w-56">
          <p className="text-sm font-semibold text-gray-900">2 documents à fournir</p>
          <p className="mt-1 text-xs text-gray-500">Relevé bancaire · Photo d’identité</p>
        </Card>
      </div>
    );
  }
  if (actor === 'company') {
    const rows: [string, string, string, 'ok' | 'warn' | 'late'][] = [
      ['Lucas M.', 'Soudeur', 'Permis valide · mars 2027', 'ok'],
      ['Aïcha B.', 'Infirmière', 'Expire dans 45 jours', 'warn'],
      ['Diego R.', 'Machiniste', 'Prolongation déposée', 'ok'],
      ['Mei L.', 'Analyste', 'Pièces manquantes', 'late'],
    ];
    return (
      <Card>
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-semibold text-gray-900">Vos employés étrangers</p>
          <p className="text-xs text-gray-400">4 dossiers</p>
        </div>
        <ul className="mt-3 divide-y divide-gray-100">
          {rows.map(([n, job, s, tone]) => (
            <li key={n} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <span className="min-w-0"><span className="font-medium text-gray-800">{n}</span> <span className="text-gray-400">· {job}</span></span>
              <Pill tone={tone}>{s}</Pill>
            </li>
          ))}
        </ul>
      </Card>
    );
  }
  if (actor === 'collaborator') {
    const rows: [string, string, 'info' | 'warn' | 'ok'][] = [
      ['Haddad · Résidence permanente', 'Traduction à déposer', 'warn'],
      ['Diallo · Permis d’études', 'Relecture demandée', 'info'],
      ['Nguyen · Parrainage conjoint', 'Terminé', 'ok'],
    ];
    return (
      <div className="space-y-3">
        {rows.map(([d, s, tone]) => (
          <Card key={d} className="flex items-center justify-between gap-3">
            <span className="min-w-0 text-sm font-medium text-gray-800">{d}</span>
            <Pill tone={tone}>{s}</Pill>
          </Card>
        ))}
      </div>
    );
  }
  if (actor === 'platform') {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[['Cabinets actifs', '12'], ['Demandes en attente', '3'], ['Modèles publiés', '48'], ['Membres', '57']].map(([l, v]) => (
          <Card key={l}><p className="text-xs text-gray-500">{l}</p><p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">{v}</p></Card>
        ))}
      </div>
    );
  }
  // Cabinet
  const rows: [string, string, 'late' | 'warn' | 'info'][] = [
    ['Amina D. · Permis d’études', 'Pièces reçues à valider', 'info'],
    ['Omar H. · Résidence permanente', 'Échéance 12/12', 'warn'],
    ['Famille Nguyen · Parrainage', 'Biométrie à prévoir', 'late'],
  ];
  return (
    <div className="relative mt-16">
      <Card>
        <p className="text-sm font-semibold text-gray-900">Action requise</p>
        <ul className="mt-3 space-y-2.5">
          {rows.map(([d, s, tone]) => (
            <li key={d} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-gray-700">{d}</span>
              <Pill tone={tone}>{s}</Pill>
            </li>
          ))}
        </ul>
      </Card>
      <Card className="absolute -right-6 -top-14 w-44">
        <p className="text-xs text-gray-500">Dossiers actifs</p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">42</p>
        <p className="text-xs font-medium text-emerald-600">+6 ce mois-ci</p>
      </Card>
    </div>
  );
}
