'use client';

import { useEffect } from 'react';
import MaintenanceScreen from '@/app/shared/maintenance-screen';

/**
 * Catches runtime errors inside the (hydrogen) layout and below.
 * Renders the themed maintenance UI with the "error" message.
 */
export default function ErrorBoundary({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    console.error('[App error]', error);
  }, [error]);

  return <MaintenanceScreen reason="error" />;
}
