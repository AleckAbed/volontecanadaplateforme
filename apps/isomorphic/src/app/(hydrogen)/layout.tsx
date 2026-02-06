'use client';

import { useIsMounted } from '@core/hooks/use-is-mounted';
import HydrogenLayout from '@/layouts/hydrogen/layout';
import HeliumLayout from '@/layouts/helium/helium-layout';
import LithiumLayout from '@/layouts/lithium/lithium-layout';
import BerylLiumLayout from '@/layouts/beryllium/beryllium-layout';
import BoronLayout from '@/layouts/boron/boron-layout';
import CarbonLayout from '@/layouts/carbon/carbon-layout';
import { useLayout } from '@/layouts/use-layout';
import { useAuth } from '@/hooks/useAuth';
import { LAYOUT_OPTIONS } from '@/config/enums';
import { useEffect } from 'react';

type LayoutProps = {
  children: React.ReactNode;
};

/**
 * Layout configuré pour le Cabinet d'Immigration
 * 
 * Configuration automatique selon le type d'utilisateur :
 * - Admin → Helium Layout
 * - Client → Lithium Layout
 */
export default function DefaultLayout({ children }: LayoutProps) {
  return <LayoutProvider>{children}</LayoutProvider>;
}

function LayoutProvider({ children }: LayoutProps) {
  const { layout, setLayout } = useLayout();
  const { userType } = useAuth();
  const isMounted = useIsMounted();

  // Configurer automatiquement le layout selon le type d'utilisateur
  useEffect(() => {
    // Les admins peuvent choisir leur layout (par défaut Helium)
    if (userType === 'admin') {
      // Si pas de layout défini, mettre Helium par défaut
      if (!layout || layout === LAYOUT_OPTIONS.LITHIUM) {
        setLayout(LAYOUT_OPTIONS.HELIUM);
      }
    }
    // Les clients sont TOUJOURS fixés sur Lithium (non modifiable)
    else if (userType === 'client') {
      // Forcer Lithium pour les clients, peu importe ce qui est dans localStorage
      if (layout !== LAYOUT_OPTIONS.LITHIUM) {
        setLayout(LAYOUT_OPTIONS.LITHIUM);
      }
    }
  }, [userType, layout, setLayout]);

  if (!isMounted) {
    return null;
  }

  // FORCER le layout selon le type d'utilisateur
  const currentLayout = userType === 'client' 
    ? LAYOUT_OPTIONS.LITHIUM  // Clients TOUJOURS sur Lithium
    : (userType === 'admin' && layout) 
      ? layout  // Admins utilisent leur choix
      : LAYOUT_OPTIONS.HELIUM;  // Admin par défaut

  if (currentLayout === LAYOUT_OPTIONS.HELIUM) {
    return <HeliumLayout>{children}</HeliumLayout>;
  }
  if (currentLayout === LAYOUT_OPTIONS.LITHIUM) {
    return <LithiumLayout>{children}</LithiumLayout>;
  }
  if (currentLayout === LAYOUT_OPTIONS.BERYLLIUM) {
    return <BerylLiumLayout>{children}</BerylLiumLayout>;
  }
  if (currentLayout === LAYOUT_OPTIONS.BORON) {
    return <BoronLayout>{children}</BoronLayout>;
  }
  if (currentLayout === LAYOUT_OPTIONS.CARBON) {
    return <CarbonLayout>{children}</CarbonLayout>;
  }

  return <HydrogenLayout>{children}</HydrogenLayout>;
}
