'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import ServiceCard from '@/app/shared/services-immigration/service-card';
import { IMMIGRATION_SERVICES_REFRESH_EVENT } from '@/data/services-immigration';
import { immigrationServicesService, ImmigrationServiceItem } from '@/services/immigration-services';
import cn from '@core/utils/class-names';

interface ServicesGridProps {
  className?: string;
  gridClassName?: string;
}

export default function ServicesGrid({ className, gridClassName }: ServicesGridProps) {
  const [services, setServices] = useState<ImmigrationServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setServices(await immigrationServicesService.list());
    } catch (e: any) {
      toast.error(e.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const onRefresh = () => load();
    window.addEventListener(IMMIGRATION_SERVICES_REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(IMMIGRATION_SERVICES_REFRESH_EVENT, onRefresh);
  }, []);

  return (
    <div className={cn('@container', className)}>
      {loading ? (
        <div className="grid grid-cols-1 gap-6 @[36.65rem]:grid-cols-2 @[56rem]:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-xl bg-gradient-to-br from-gray-100 to-gray-50" />
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
          Aucun service d&apos;immigration. Cliquez sur « Ajouter » pour en créer un.
        </div>
      ) : (
        <div className={cn(
          'grid grid-cols-1 gap-6 @[36.65rem]:grid-cols-2 @[56rem]:grid-cols-3 @[78.5rem]:grid-cols-4 @[100rem]:grid-cols-5',
          gridClassName
        )}>
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              id={service.id}
              name={service.name}
              description={service.description ?? ''}
              category={service.category ?? ''}
              duration={service.duration ?? ''}
              status={(service.status as any) ?? 'active'}
              color={service.color}
            />
          ))}
        </div>
      )}
    </div>
  );
}
