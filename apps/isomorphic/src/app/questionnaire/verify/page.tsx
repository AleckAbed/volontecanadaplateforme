import { Suspense } from 'react';
import VerifyQuestionnaireClient from './verify-client';

export const dynamic = 'force-dynamic';

export default function VerifyQuestionnairePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-red-600/70 to-red-800/70">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
        </div>
      }
    >
      <VerifyQuestionnaireClient />
    </Suspense>
  );
}
