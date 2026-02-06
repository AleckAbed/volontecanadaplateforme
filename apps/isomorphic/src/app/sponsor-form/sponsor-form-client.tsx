'use client';

import { useEffect } from 'react';
import SponsorFormMultiStep from '@/app/shared/sponsor-form/sponsor-form-multi-step';
import { useSearchParams } from 'next/navigation';

export default function SponsorFormClient() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  useEffect(() => {
    if (code) {
      const currentCode = localStorage.getItem('questionnaire_code');
      if (currentCode !== code) {
        localStorage.setItem('questionnaire_code', code);
      }
    }
  }, [code]);

  return <SponsorFormMultiStep />;
}
