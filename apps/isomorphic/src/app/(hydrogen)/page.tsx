'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ClientDashboard from '@/app/client/dashboard/client-dashboard';
import FileDashboard from '@/app/shared/file/dashboard';

/**
 * Page d'accueil qui s'adapte selon le type d'utilisateur
 * - Admin → File Manager Dashboard
 * - Client → Dashboard Client personnalisé
 */
export default function HomePage() {
  const { userType, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Si pas authentifié, rediriger vers la page de connexion
    if (isAuthenticated === false) {
      router.push('/auth/admin-signin');
    }
  }, [isAuthenticated, router]);

  // Afficher le dashboard selon le type d'utilisateur
  if (userType === 'client') {
    return <ClientDashboard />;
  }

  // Par défaut (admin), afficher le File Manager Dashboard
  return <FileDashboard />;
}
