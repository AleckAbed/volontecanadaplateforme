/**
 * Middleware Next.js
 * Si le navigateur envoie le cookie auth_token, on pose auth_seen pour que le client
 * sache que l’auth a été vue côté serveur (évite redirection prématurée au refresh).
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_TOKEN_COOKIE = 'auth_token';
const AUTH_SEEN_COOKIE = 'auth_seen';

export function middleware(request: NextRequest) {
  const res = NextResponse.next();
  if (request.cookies.get(AUTH_TOKEN_COOKIE)?.value) {
    res.cookies.set(AUTH_SEEN_COOKIE, '1', { path: '/', maxAge: 60 });
  }
  return res;
}

export const config = {
  // Appliquer le middleware à toutes les routes sauf les assets statiques
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)',
  ],
};
