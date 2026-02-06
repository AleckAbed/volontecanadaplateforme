'use client';

/**
 * Composant pour protéger les routes côté client
 * Vérifie si l'utilisateur est authentifié (cookie prioritaire, puis localStorage, sessionStorage).
 */

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getAuthToken, getCookieValue, AUTH_SEEN_COOKIE, AUTH_TOKEN_SET_EVENT } from '@/lib/auth-storage';

const MIN_DELAY_BEFORE_REDIRECT_MS = 3000;
const POLL_INTERVAL_MS = 100;

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
  const [token, setToken] = useState<string | null>(null);
  const [canRedirect, setCanRedirect] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // 1. Poll + écoute de l’événement "token enregistré" (après login)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const read = () => setToken(getAuthToken()?.trim() || null);
    read();
    const onTokenSet = () => {
      const t = getAuthToken()?.trim() || null;
      if (t) {
        setToken(t);
        const p = window.location.pathname || '';
        if (!publicRoutes.some((r) => p.startsWith(r)) && !authRoutes.some((r) => p.startsWith(r))) {
          setIsChecking(false);
        }
      }
    };
    window.addEventListener(AUTH_TOKEN_SET_EVENT, onTokenSet);
    const interval = window.setInterval(read, POLL_INTERVAL_MS);
    const timeout = window.setTimeout(() => setCanRedirect(true), MIN_DELAY_BEFORE_REDIRECT_MS);
    return () => {
      window.removeEventListener(AUTH_TOKEN_SET_EVENT, onTokenSet);
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  // 2. Décider : afficher le contenu ou rediriger (seulement après le délai minimum)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (hasRedirected.current) return;

    const path = window.location.pathname || pathname || '';
    const isPublicRoute = isPublicPath(path);
    const isAuthRoute = isAuthPath(path);
    const userType = localStorage.getItem('user_type');
    // Toujours relire le token (important après login avec router.push : le state peut être en retard)
    const freshToken = getAuthToken()?.trim() || null;
    const currentToken = (token ?? freshToken)?.trim() || null;
    const hasToken = Boolean(currentToken && currentToken.length > 0);

    if (freshToken && !token) setToken(freshToken);

    if (isPublicRoute) {
      setIsChecking(false);
      return;
    }

    if (isAuthRoute && hasToken) {
      hasRedirected.current = true;
      router.replace('/');
      return;
    }

    if (hasToken) {
      setIsChecking(false);
      return;
    }

    if (!hasToken && canRedirect) {
      if (getCookieValue(AUTH_SEEN_COOKIE)) {
        const again = getAuthToken()?.trim();
        if (again) {
          setToken(again);
          setIsChecking(false);
          return;
        }
      }
      const lastTry = getAuthToken()?.trim();
      if (!lastTry) {
        hasRedirected.current = true;
        const redirectUrl =
          userType === 'client' ? '/auth/client-signin' : '/auth/admin-signin';
        router.replace(`${redirectUrl}?redirect=${encodeURIComponent(path)}`);
      }
    }
  }, [pathname, router, token, canRedirect]);

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

