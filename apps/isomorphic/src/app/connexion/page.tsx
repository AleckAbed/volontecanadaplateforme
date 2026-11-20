'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PiArrowRightBold, PiBriefcaseDuotone, PiBuildingsDuotone, PiHandshakeDuotone, PiUserCircleDuotone } from 'react-icons/pi';
import { siteConfig } from '@/config/site.config';

type Space = {
  key: string;
  href: string;
  title: string;
  who: string;
  icon: React.ComponentType<{ className?: string }>;
  ring: string;
  iconBox: string;
};

const SPACES: Space[] = [
  {
    key: 'client', href: '/auth/client-signin', title: 'Je suis client', who: 'Je suis accompagné par un cabinet pour mon projet d’immigration.',
    icon: PiUserCircleDuotone, ring: 'hover:border-teal-500 focus-visible:border-teal-500', iconBox: 'bg-teal-50 text-teal-700',
  },
  {
    key: 'firm', href: '/auth/admin-signin', title: 'Je travaille dans un cabinet', who: 'Consultant, avocat, conseiller ou adjoint d’un cabinet d’immigration.',
    icon: PiBriefcaseDuotone, ring: 'hover:border-blue-500 focus-visible:border-blue-500', iconBox: 'bg-blue-50 text-blue-700',
  },
  {
    key: 'company', href: '/entreprise/connexion', title: 'Je représente une entreprise', who: 'Ressources humaines d’un employeur qui suit ses travailleurs étrangers.',
    icon: PiBuildingsDuotone, ring: 'hover:border-amber-500 focus-visible:border-amber-500', iconBox: 'bg-amber-50 text-amber-700',
  },
  {
    key: 'collaborator', href: '/collab/login', title: 'Je suis collaborateur externe', who: 'Traducteur, partenaire ou sous-traitant à qui le cabinet confie des dossiers.',
    icon: PiHandshakeDuotone, ring: 'hover:border-violet-500 focus-visible:border-violet-500', iconBox: 'bg-violet-50 text-violet-700',
  },
];

const LAST_SPACE_KEY = 'last_space';

/**
 * Point d'entrée unique : la personne choisit son type de compte et arrive sur la page de
 * connexion de son espace (chacune a son style). Le dernier choix est rappelé.
 */
export default function ChooseSpacePage() {
  const [last, setLast] = useState<string | null>(null);
  const [redirect, setRedirect] = useState<string | null>(null);

  useEffect(() => {
    try { setLast(localStorage.getItem(LAST_SPACE_KEY)); } catch {}
    setRedirect(new URLSearchParams(window.location.search).get('redirect'));
  }, []);

  const hrefFor = (s: Space) => (redirect ? `${s.href}?redirect=${encodeURIComponent(redirect)}` : s.href);
  const remember = (s: Space) => { try { localStorage.setItem(LAST_SPACE_KEY, s.key); } catch {} };
  const lastSpace = SPACES.find((s) => s.key === last);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-5 py-8 sm:px-8">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gray-900 text-sm font-bold text-white">{siteConfig.appName.charAt(0)}</span>
          <span className="text-lg font-bold tracking-tight text-gray-900">{siteConfig.appName}</span>
        </div>

        <main className="flex flex-1 flex-col justify-center py-10">
          <h1 className="text-3xl font-bold leading-tight text-gray-900 sm:text-4xl">Bienvenue. Qui êtes-vous ?</h1>
          <p className="mt-2 max-w-xl text-[15px] text-gray-600">Choisissez votre espace : chacun a sa propre connexion.</p>

          {lastSpace && (
            <Link href={hrefFor(lastSpace)} onClick={() => remember(lastSpace)}
              className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800">
              Continuer : {lastSpace.title.replace(/^Je (suis|travaille dans|représente) /, '').replace(/^un(e)? /, '')} <PiArrowRightBold className="h-4 w-4" />
            </Link>
          )}

          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {SPACES.map((s) => {
              const Icon = s.icon;
              return (
                <li key={s.key}>
                  <Link href={hrefFor(s)} onClick={() => remember(s)} data-space={s.key}
                    className={`group flex h-full items-start gap-4 rounded-2xl border-2 border-gray-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none ${s.ring}`}>
                    <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${s.iconBox}`}><Icon className="h-7 w-7" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2 text-base font-semibold text-gray-900">
                        {s.title}
                        <PiArrowRightBold className="h-4 w-4 shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-gray-700" />
                      </span>
                      <span className="mt-1 block text-sm text-gray-600">{s.who}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <p className="mt-8 text-sm text-gray-600">
            Vous dirigez un cabinet et n’avez pas encore de compte ?{' '}
            <Link href="/auth/inscription" className="font-semibold text-blue-700 hover:underline">Demander l’ouverture</Link>
          </p>
        </main>

        <p className="text-xs text-gray-400">© {new Date().getFullYear()} {siteConfig.appName} · Données hébergées au Canada</p>
      </div>
    </div>
  );
}
