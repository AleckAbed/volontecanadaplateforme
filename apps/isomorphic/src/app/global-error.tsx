'use client';

import { useEffect } from 'react';

/**
 * Catches errors thrown at the root layout level (when the regular error.tsx
 * cannot render). Hard-navigates to /maintenance so the user always lands on
 * a themed page instead of a blank screen.
 */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error('[Global error]', error);
    if (typeof window !== 'undefined') {
      window.location.replace('/maintenance?reason=error');
    }
  }, [error]);

  return (
    <html lang="fr">
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          color: '#6b7280',
        }}>
          Redirection vers la page d&apos;erreur…
        </div>
      </body>
    </html>
  );
}
