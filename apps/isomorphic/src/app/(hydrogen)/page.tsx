'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ClientDashboard from '@/app/client/dashboard/client-dashboard';
import CabinetDashboard from '@/app/shared/cabinet-dashboard';
import { PiHouseDuotone } from 'react-icons/pi';

/**
 * Page d'accueil qui s'adapte selon le type d'utilisateur
 * - Admin → Dashboard cabinet (statistiques métier en temps réel)
 * - Client → Dashboard Client personnalisé
 */
export default function HomePage() {
  const { userType, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated === false) {
      router.push('/auth/admin-signin');
    }
  }, [isAuthenticated, router]);

  if (userType === 'client') {
    return <ClientDashboard />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-6 2xl:p-10">
      <div className="mb-8 flex items-start gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
          <PiHouseDuotone className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Tableau de bord</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Vue d&apos;ensemble en temps réel de l&apos;activité de votre cabinet d&apos;immigration.
          </p>
        </div>
      </div>
      <CabinetDashboard />
    </div>
  );
}
