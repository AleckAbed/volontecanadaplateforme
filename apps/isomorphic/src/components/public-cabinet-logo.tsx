'use client';

import { useEffect, useState } from 'react';
import { publicFetch } from '@/lib/api-client';
import CabinetLogo from '@/components/cabinet-logo';
import type { CabinetBranding } from '@/services/cabinet-profile';

type LinkType = 'invitation' | 'questionnaire' | 'document' | 'activation';

/**
 * Logo du cabinet sur une page publique ouverte depuis un lien (1.9) : le cabinet est
 * retrouvé à partir du code du lien. Rien n'est affiché si le code est inconnu.
 */
export default function PublicCabinetLogo({ type, code, className }: { type: LinkType; code: string | null | undefined; className?: string }) {
  const [branding, setBranding] = useState<CabinetBranding | null | undefined>(undefined);

  useEffect(() => {
    if (!code) {
      setBranding(null);
      return;
    }
    let cancelled = false;
    (publicFetch(`/branding/${type}/${encodeURIComponent(code)}`) as Promise<any>)
      .then((res) => { if (!cancelled) setBranding(res?.data ?? null); })
      .catch(() => { if (!cancelled) setBranding(null); });
    return () => { cancelled = true; };
  }, [type, code]);

  if (branding === null) return null;

  return <CabinetLogo branding={branding ?? null} className={className} />;
}
