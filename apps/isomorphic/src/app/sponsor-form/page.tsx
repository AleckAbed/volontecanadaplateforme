import { Suspense } from 'react';
import SponsorFormClient from './sponsor-form-client';

export const dynamic = 'force-dynamic';

export default function SponsorFormPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <SponsorFormClient />
    </Suspense>
  );
}



