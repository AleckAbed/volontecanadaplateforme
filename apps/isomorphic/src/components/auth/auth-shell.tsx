'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { PiBriefcaseDuotone, PiCheckCircleFill, PiHandshakeDuotone, PiShieldCheckDuotone, PiUserCircleDuotone } from 'react-icons/pi';
import { siteConfig } from '@/config/site.config';

const SPACES = [
  { href: '/auth/admin-signin', key: 'firm', fallback: 'Cabinet', icon: PiBriefcaseDuotone },
  { href: '/auth/client-signin', key: 'client', fallback: 'Client', icon: PiUserCircleDuotone },
  { href: '/entreprise/connexion', key: 'company', fallback: 'Entreprise', icon: PiShieldCheckDuotone },
  { href: '/collab/login', key: 'collaborator', fallback: 'Collaborateur', icon: PiHandshakeDuotone },
];

/**
 * Cadre unique de toutes les pages d'accès (connexion des 4 espaces, mot de passe,
 * activation, demande d'ouverture) : panneau de marque à gauche (grand écran),
 * contenu à droite, sélecteur d'espace en haut.
 */
export default function AuthShell({ children, showSpaces = true }: { children: React.ReactNode; showSpaces?: boolean }) {
  const { t } = useTranslation();
  const pathname = usePathname() ?? '';
  const points = [
    t('auth_shell.point_files', 'Dossiers, formulaires IRCC et échéances au même endroit'),
    t('auth_shell.point_portal', 'Un portail sécurisé pour vos clients et leurs documents'),
    t('auth_shell.point_canada', 'Données hébergées au Canada, double authentification'),
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40">
      <aside className="relative hidden w-[42%] max-w-xl shrink-0 overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div aria-hidden className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="relative px-10 pt-12 xl:px-14">
          <Link href="/" className="text-lg font-bold tracking-tight">{siteConfig.appName}</Link>
        </div>
        <div className="relative px-10 xl:px-14">
          <h2 className="text-3xl font-semibold leading-tight xl:text-4xl">
            {t('auth_shell.headline', 'La plateforme des cabinets d’immigration')}
          </h2>
          <ul className="mt-8 space-y-4">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3 text-base text-blue-50">
                <PiCheckCircleFill className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative px-10 pb-10 text-xs text-blue-100/80 xl:px-14">© {new Date().getFullYear()} {siteConfig.appName}</p>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        {showSpaces && (
          <nav aria-label={t('auth_shell.spaces', 'Espaces')} className="flex flex-wrap items-center justify-center gap-1 px-4 pt-6 sm:justify-end sm:px-8">
            {SPACES.map(({ href, key, fallback, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link key={href} href={href} aria-current={active ? 'page' : undefined}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${active ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-white hover:text-gray-900'}`}>
                  <Icon className="h-4 w-4" />
                  {t(`auth_shell.space_${key}`, fallback)}
                </Link>
              );
            })}
          </nav>
        )}
        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8">{children}</div>
      </main>
    </div>
  );
}
