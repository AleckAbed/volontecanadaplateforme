'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import MaintenanceScreen, { MaintenanceReason } from '@/app/shared/maintenance-screen';

function MaintenanceContent() {
  const params = useSearchParams();
  const reason = (params.get('reason') as MaintenanceReason) ?? 'unavailable';
  return <MaintenanceScreen reason={reason} />;
}

export default function MaintenancePage() {
  return (
    <Suspense fallback={<MaintenanceScreen reason="unavailable" />}>
      <MaintenanceContent />
    </Suspense>
  );
}
