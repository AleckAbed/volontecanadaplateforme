'use client';

import AuthShell from '@/components/auth/auth-shell';

/**
 * Pages de connexion (cabinet, client) : même cadre que toutes les pages d'accès.
 * (Remplace le gabarit d'origine : textes anglais, faux avatars, liens de démonstration.)
 */
export default function AuthWrapperTwo({
  children,
  title,
}: {
  children: React.ReactNode;
  title: React.ReactNode;
  isSocialLoginActive?: boolean;
  isSignIn?: boolean;
}) {
  return (
    <AuthShell>
      <h1 className="mb-8 text-3xl font-bold leading-tight text-gray-900 sm:text-[2.1rem]">{title}</h1>
      {children}
    </AuthShell>
  );
}
