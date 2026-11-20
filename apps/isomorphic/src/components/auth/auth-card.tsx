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
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
  /** Sélecteur des espaces (cabinet, client…) en haut ; masqué pour la console plateforme. */
  spaces?: boolean;
}) {
  return (
    <AuthShell showSpaces={spaces} wide={wide}>
      <div>
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-wider text-[var(--auth-accent)]">{eyebrow}</p>}
        <h1 className="mt-1 text-3xl font-bold leading-tight text-gray-900 sm:text-[2.1rem]">{title}</h1>
        {subtitle && <p className="mt-2 text-[15px] leading-relaxed text-gray-600">{subtitle}</p>}
        <div className="mt-8">{children}</div>
        {footer && <div className="mt-8 border-t border-gray-100 pt-5 text-sm text-gray-600">{footer}</div>}
      </div>
    </AuthShell>
  );
}

export function AuthLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-semibold text-[var(--auth-accent)] hover:underline">
      {children}
    </Link>
  );
}

export const inputClass =
  'w-full rounded-xl border border-gray-300 px-3.5 py-3 text-sm focus:border-[var(--auth-accent)] focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:bg-gray-50';

export const primaryButtonClass =
  'w-full rounded-xl bg-[var(--auth-accent)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-gray-900/10 transition hover:bg-[var(--auth-accent-dark)] disabled:cursor-not-allowed disabled:opacity-50';
