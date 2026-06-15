'use client';

import { PiChartBarDuotone } from 'react-icons/pi';
import CabinetDashboard from '@/app/shared/cabinet-dashboard';

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-6 2xl:p-10">
      <div className="mb-8 flex items-start gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
          <PiChartBarDuotone className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Statistiques du cabinet</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Vue d&apos;ensemble de l&apos;activité — clients, dossiers, invitations et charge des collaborateurs.
          </p>
        </div>
      </div>
      <CabinetDashboard />
    </div>
  );
}
