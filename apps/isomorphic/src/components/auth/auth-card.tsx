'use client';

import Link from 'next/link';
import { siteConfig } from '@/config/site.config';

/** Carte centrée commune aux pages d'accès (inscription, mot de passe, plateforme). */
export default function AuthCard({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  wide = false,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-4 sm:p-6">
      <div className={`w-full ${wide ? 'max-w-xl' : 'max-w-lg'} overflow-hidden rounded-2xl bg-white shadow-xl`}>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-6 text-white sm:px-7">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{eyebrow ?? siteConfig.appName}</p>
          <h1 className="mt-1 text-2xl font-bold">{title}</h1>
          {subtitle && <p className="mt-1 text-sm opacity-90">{subtitle}</p>}
        </div>
        <div className="p-6 sm:p-7">{children}</div>
        {footer && <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 text-center text-sm text-gray-600 sm:px-7">{footer}</div>}
      </div>
    </div>
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
