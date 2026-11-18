'use client';

import { useEffect } from 'react';
import { atom, useAtom } from 'jotai';
import api from '@/services/api';
import type { AdminPermissions, TeamRole } from '@/services/team';

export interface CurrentAdmin {
  id: number;
  name: string;
  email: string;
  role: TeamRole;
  role_label: string;
  permissions: AdminPermissions;
  cabinet: { id: number; name: string; slug?: string; branding?: import('@/services/cabinet-profile').CabinetBranding } | null;
}

const currentAdminAtom = atom<CurrentAdmin | null>(null);

// Un seul appel /admin/me partagé entre tous les composants de la page.
let pending: Promise<CurrentAdmin | null> | null = null;

function loadCurrentAdmin(): Promise<CurrentAdmin | null> {
  if (!pending) {
    pending = api.getAdminProfile()
      .then((res: any) => (res?.success ? (res.data as CurrentAdmin) : null))
      .catch(() => null)
      .finally(() => {
        // Permet un nouveau chargement plus tard (changement de compte, rôle modifié).
        setTimeout(() => { pending = null; }, 30_000);
      });
  }
  return pending;
}

/**
 * Admin connecté, avec son rôle et ses droits (pour adapter l'interface).
 * Le contrôle réel reste côté API : masquer un bouton n'est qu'un confort.
 */
export function useCurrentAdmin() {
  const [admin, setAdmin] = useAtom(currentAdminAtom);

  useEffect(() => {
    let userType: string | null = null;
    try { userType = localStorage.getItem('user_type'); } catch {}
    if (admin || userType !== 'admin') return;
    let cancelled = false;
    loadCurrentAdmin().then((a) => { if (!cancelled && a) setAdmin(a); });
    return () => { cancelled = true; };
  }, [admin, setAdmin]);

  return admin;
}
