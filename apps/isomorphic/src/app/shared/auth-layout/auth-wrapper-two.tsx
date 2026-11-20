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
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-xl shadow-blue-900/5 sm:p-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">{title}</h1>
        {children}
      </div>
    </AuthShell>
  );
}
