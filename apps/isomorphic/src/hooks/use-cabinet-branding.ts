'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api';
import { useCurrentAdmin } from '@/hooks/use-current-admin';
import type { CabinetBranding } from '@/services/cabinet-profile';

let clientPending: Promise<CabinetBranding | null> | null = null;

function loadClientBranding(): Promise<CabinetBranding | null> {
  if (!clientPending) {
    clientPending = api.getClientProfile()
      .then((res: any) => (res?.data?.cabinet?.branding as CabinetBranding) ?? null)
      .catch(() => null)
      .finally(() => { setTimeout(() => { clientPending = null; }, 60_000); });
  }
  return clientPending;
}

/** Image de marque du cabinet de la personne connectée (cabinet ou client). */
export function useCabinetBranding(): CabinetBranding | null {
  const admin = useCurrentAdmin();
  const [clientBranding, setClientBranding] = useState<CabinetBranding | null>(null);
  const [userType, setUserType] = useState<string | null>(null);

  useEffect(() => {
    let type: string | null = null;
    try { type = localStorage.getItem('user_type'); } catch {}
    setUserType(type);
    if (type !== 'client') return;
    let cancelled = false;
    loadClientBranding().then((b) => { if (!cancelled) setClientBranding(b); });
    return () => { cancelled = true; };
  }, []);

  if (userType === 'client') return clientBranding;
  return admin?.cabinet?.branding ?? null;
}
