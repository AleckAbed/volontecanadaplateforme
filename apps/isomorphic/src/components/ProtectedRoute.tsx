'use client';

/**
 * Protège les routes côté client.
 *
 * Architecture cookie HttpOnly :
 *  - JS ne peut PAS lire le token (cookie HttpOnly).
 *  - On utilise `localStorage.user_type` (non sensible, juste 'admin'/'client')
 *    comme indication "j'étais connecté récemment".
 *  - On vérifie la session côté serveur via /api/admin/me ou /client/me
 *    (le cookie HttpOnly est envoyé automatiquement via credentials:include).
 *  - Si /me 200 → on est connecté. Si 401 → on nettoie et on redirige.
 */

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/services/api';
import { removeAuthToken } from '@/lib/auth-storage';

const publicRoutes = [
  '/signin',
  '/signin/client',
  '/signup',
  '/forgot-password',
  '/auth/admin-signin',
  '/auth/client-signin',
  '/auth/client-signup',
  '/auth/sign-in-2',
  '/auth/sign-up-2',
  '/questionnaire',
  '/client-form',
  '/sponsor-form',
  '/pstq-form',
  '/invitation',
  '/document',
  '/maintenance',
  '/not-found',
];

const authRoutes = [
  '/signin',
  '/signin/client',
  '/signup',
  '/auth/admin-signin',
  '/auth/client-signin',
  '/auth/client-signup',
];

function isPublicPath(path: string | null): boolean {
  if (!path) return false;
  return publicRoutes.some((route) => path.startsWith(route));
}

function isAuthPath(path: string | null): boolean {
  if (!path) return false;
  return authRoutes.some((route) => path.startsWith(route));
}

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirected = useRef(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (hasRedirected.current) return;

    const path = window.location.pathname || pathname || '';

    // 1. Routes publiques (formulaires client, signin, etc.) — pas de check
    if (isPublicPath(path)) {
      setIsChecking(false);
      return;
    }

    let userType: string | null = null;
    try { userType = localStorage.getItem('user_type'); } catch {}

    // 2. Pas de marqueur user_type → pas connecté → redirection signin
    if (userType !== 'admin' && userType !== 'client') {
      hasRedirected.current = true;
      const target = '/auth/admin-signin';
      router.replace(`${target}?redirect=${encodeURIComponent(path)}`);
      return;
    }

    // 3. Vérification serveur via /me — le cookie HttpOnly est envoyé auto
    const verify = async () => {
      try {
        const res = userType === 'admin'
          ? await api.getAdminProfile()
          : await api.getClientProfile();

        if (res?.success) {
          // 3a. Session valide
          if (isAuthPath(path)) {
            // déjà connecté sur une page de signin → renvoie à l'accueil
            hasRedirected.current = true;
            router.replace('/');
            return;
          }
          setIsAuthed(true);
          setIsChecking(false);
        } else {
          throw new Error('Session expirée');
        }
      } catch (err: any) {
        // 3b. 401 ou autre échec → nettoyer + rediriger
        try { localStorage.removeItem('user_type'); } catch {}
        removeAuthToken();
        if (!isAuthPath(path)) {
          hasRedirected.current = true;
          const target = userType === 'client'
            ? '/auth/client-signin'
            : '/auth/admin-signin';
          router.replace(`${target}?redirect=${encodeURIComponent(path)}`);
        } else {
          setIsChecking(false);
        }
      }
    };
    void verify();
  }, [pathname, router]);

  if (isChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent"
          aria-label="Chargement"
        />
      </div>
    );
  }

  return <>{children}</>;
}
