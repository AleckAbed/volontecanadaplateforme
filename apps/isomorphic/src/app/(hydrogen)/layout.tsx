'use client';

import { useIsMounted } from '@core/hooks/use-is-mounted';
import HeliumLayout from '@/layouts/helium/helium-layout';
import LithiumLayout from '@/layouts/lithium/lithium-layout';
import LockScreen from '@/layouts/lock-screen';
import { useAuth } from '@/hooks/useAuth';
import ChatbotWidget from '@/components/ChatbotWidget';

type LayoutProps = {
  children: React.ReactNode;
};

/**
 * Layout configuré pour le Cabinet d'Immigration
 * 
 * Mise en page selon le type d'utilisateur :
 * - cabinet (admin) → Helium ;
 * - client → Lithium.
 */
export default function DefaultLayout({ children }: LayoutProps) {
  return (
    <>
      <LayoutProvider>{children}</LayoutProvider>
      <LockScreen />
      <AdminChatbot />
    </>
  );
}

function AdminChatbot() {
  // Note : on retire la condition userType car useAuth() peut renvoyer null
  // pendant l'hydratation initiale. Le widget gère lui-même le check du token.
  return <ChatbotWidget audience="admin" />;
}

function LayoutProvider({ children }: LayoutProps) {
  const { userType } = useAuth();
  const isMounted = useIsMounted();

  if (!isMounted) {
    return null;
  }

  // Une seule mise en page par profil : Lithium pour les clients, Helium pour le cabinet.
  if (userType === 'client') {
    return <LithiumLayout>{children}</LithiumLayout>;
  }
  return <HeliumLayout>{children}</HeliumLayout>;
}
