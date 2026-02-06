import ClientDashboard from '@/app/client/dashboard/client-dashboard';
import { metaObject } from '@/config/site.config';

export const metadata = {
  ...metaObject('Dashboard Client'),
};

/**
 * Page /client/dashboard
 * Utilise le composant ClientDashboard réutilisable
 */
export default function ClientDashboardPage() {
  return <ClientDashboard />;
}


