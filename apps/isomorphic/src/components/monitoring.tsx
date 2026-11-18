'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Outils de suivi en production, tous inactifs sans leur configuration et hébergés au Canada :
 *
 * - Erreurs du navigateur : Sentry ou GlitchTip (NEXT_PUBLIC_SENTRY_DSN). Aucune donnée
 *   personnelle : pas d'utilisateur, pas d'IP, adresse de page sans paramètres, courriels
 *   et numéros masqués dans les messages.
 * - Rejeu des sessions : OpenReplay hébergé (NEXT_PUBLIC_OPENREPLAY_PROJECT_KEY et
 *   NEXT_PUBLIC_OPENREPLAY_INGEST). Seulement pour le personnel du cabinet, jamais sur les
 *   pages des clients ; mode privé : tout le texte et tous les champs sont masqués, aucune
 *   requête réseau enregistrée.
 */

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const OR_KEY = process.env.NEXT_PUBLIC_OPENREPLAY_PROJECT_KEY;
const OR_INGEST = process.env.NEXT_PUBLIC_OPENREPLAY_INGEST;

/** Pages ouvertes par les clients (liens, portail) : jamais de rejeu. */
const CLIENT_PATHS = ['/client', '/invitation', '/questionnaire', '/document', '/reserver', '/rendez-vous', '/mandat', '/facture', '/client-form', '/pstq-form', '/sponsor-form', '/collab', '/auth'];

const scrub = (text: string) =>
  text.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[courriel]').replace(/\b[A-Z]{0,2}\d{6,}\b/gi, '[numéro]');

let sentryStarted = false;
let replayStarted = false;

async function startSentry() {
  if (sentryStarted || !SENTRY_DSN) return;
  sentryStarted = true;
  const Sentry = await import('@sentry/browser');
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    beforeBreadcrumb: (crumb) => (crumb.category === 'ui.input' || crumb.category === 'console' ? null : crumb),
    beforeSend(event) {
      delete event.user;
      if (event.request) {
        event.request = { url: event.request.url?.split('?')[0] };
      }
      event.exception?.values?.forEach((v) => { if (v.value) v.value = scrub(v.value); });
      if (event.message) event.message = scrub(event.message);
      return event;
    },
  });
}

async function startReplay() {
  if (replayStarted || !OR_KEY || !OR_INGEST) return;
  replayStarted = true;
  const { default: Tracker } = await import('@openreplay/tracker');
  const tracker = new Tracker({
    projectKey: OR_KEY,
    ingestPoint: OR_INGEST,
    privateMode: true, // tout est masqué, sauf ce qui porte data-openreplay-unmask
    obscureTextEmails: true,
    obscureTextNumbers: true,
    obscureInputEmails: true,
    obscureInputNumbers: true,
    obscureInputDates: true,
    defaultInputMode: 2, // champs cachés
    respectDoNotTrack: true,
    network: { disabled: true, capturePayload: false, failuresOnly: true, ignoreHeaders: true, captureInIframes: false },
  } as any);
  await tracker.start();
}

export default function Monitoring() {
  const pathname = usePathname() ?? '';

  useEffect(() => {
    startSentry();
  }, []);

  useEffect(() => {
    let userType: string | null = null;
    try { userType = localStorage.getItem('user_type'); } catch {}
    const isClientPage = CLIENT_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    if (userType === 'admin' && !isClientPage) startReplay();
  }, [pathname]);

  return null;
}
