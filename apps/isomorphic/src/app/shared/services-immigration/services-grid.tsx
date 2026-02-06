import ServiceCard from '@/app/shared/services-immigration/service-card';
import { servicesList } from '@/data/services-immigration';
import cn from '@core/utils/class-names';

interface ServicesGridProps {
  className?: string;
  gridClassName?: string;
}

export default function ServicesGrid({
  className,
  gridClassName,
}: ServicesGridProps) {
  return (
    <div className={cn('@container', className)}>
      <div
        className={cn(
          'grid grid-cols-1 gap-6 @[36.65rem]:grid-cols-2 @[56rem]:grid-cols-3 @[78.5rem]:grid-cols-4 @[100rem]:grid-cols-5',
          gridClassName
        )}
      >
        {servicesList.map((service) => (
          <ServiceCard key={service.id} {...service} />
        ))}
      </div>
    </div>
  );
}




