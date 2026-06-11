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
  matcher: [
    /*
     * Applique le middleware à toutes les routes SAUF :
     *  - _next/static, _next/image, favicon.ico  (Next.js internals)
     *  - api/*                                    (gérées séparément)
     *  - pdfjs/* et tout dossier static custom    (assets PDF viewer)
     *  - tout fichier avec une extension statique : js, mjs, css, json, map,
     *    woff/woff2/ttf/eot, ico, txt, xml, pdf, mp3/mp4, png/jpg/svg/etc.
     *
     * Sans ça, Next.js renvoie une page HTML pour les .mjs (au lieu du module
     * JS), ce qui casse le viewer PDF.js avec : "blocked because of a
     * disallowed MIME type (text/html)".
     */
    '/((?!_next/static|_next/image|favicon.ico|api|pdfjs|.*\\.(?:js|mjs|css|json|map|woff2?|ttf|eot|ico|txt|xml|pdf|mp3|mp4|svg|png|jpg|jpeg|gif|webp|avif)$).*)',
  ],
};
