'use client';

import Link from 'next/link';
import { siteConfig } from '@/config/site.config';
import AuthShell from './auth-shell';

/** Carte commune aux pages d'accès, dans le cadre AuthShell (même style pour tous les espaces). */
export default function AuthCard({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  wide = false,
  spaces = true,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
  /** Sélecteur des espaces (cabinet, client…) en haut ; masqué pour la console plateforme. */
  spaces?: boolean;
}) {
  return (
    <AuthShell showSpaces={spaces}>
      <div className={`w-full ${wide ? 'max-w-xl' : 'max-w-md'} rounded-2xl border border-gray-100 bg-white shadow-xl shadow-blue-900/5`}>
        <div className="px-6 pt-7 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">{eyebrow ?? siteConfig.appName}</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-gray-600">{subtitle}</p>}
        </div>
        <div className="p-6 sm:p-8">{children}</div>
        {footer && <div className="rounded-b-2xl border-t border-gray-100 bg-gray-50 px-6 py-4 text-center text-sm text-gray-600 sm:px-8">{footer}</div>}
      </div>
    </AuthShell>
  );
}

export function AuthLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-semibold text-blue-700 hover:underline">
      {children}
    </Link>
  );
}

export const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50';

export const primaryButtonClass =
  'w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:shadow-xl hover:shadow-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50';
