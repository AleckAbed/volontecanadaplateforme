import { Suspense } from 'react';
import ClientFormClient from './client-form-client';

export const dynamic = 'force-dynamic';

export default function ClientFormPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <ClientFormClient />
    </Suspense>
  );
}
