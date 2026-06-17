'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { PiDotsThreeBold } from 'react-icons/pi';
import { Title, ActionIcon, Dropdown, Badge } from 'rizzui';
import { useTranslation } from 'react-i18next';
import cn from '@core/utils/class-names';
import { useModal } from '@/app/shared/modal-views/use-modal';
import ModalButton from '@/app/shared/modal-button';
import EditService from '@/app/shared/services-immigration/edit-service';
import type { ServiceType } from '@/data/services-immigration';
import { IMMIGRATION_SERVICES_REFRESH_EVENT } from '@/data/services-immigration';
import { immigrationServicesService } from '@/services/immigration-services';

interface ServiceCardProps extends ServiceType {
  className?: string;
}

export default function ServiceCard({
  id,
  name,
  description,
  category,
  duration,
  status,
  color,
  className,
}: ServiceCardProps) {
  const { t } = useTranslation();
  const { openModal } = useModal();
  const [deleting, setDeleting] = useState(false);

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
  };

  const handleDelete = async () => {
    if (!confirm(t('services_immigration.delete_confirm', {
      defaultValue: `Supprimer le service "${name}" ? Cette action est irréversible.`,
      name,
    }))) return;
    try {
      setDeleting(true);
      await immigrationServicesService.remove(id);
      toast.success(t('services_immigration.toasts.deleted', { defaultValue: 'Service supprimé' }));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(IMMIGRATION_SERVICES_REFRESH_EVENT));
      }
    } catch (e: any) {
      toast.error(e.message || t('services_immigration.toasts.delete_error', { defaultValue: 'Suppression impossible' }));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={cn('rounded-lg border border-muted p-6', className)}>
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span
            className="grid h-10 w-10 place-content-center rounded-lg text-white"
            style={{ backgroundColor: color || '#2465FF' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 2C7.34315 2 6 3.34315 6 5V7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7H18V5C18 3.34315 16.6569 2 15 2H9Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              <path d="M9 2V6M15 2V6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              <path d="M12 13V17M9 15H15" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </span>
          <div>
            <Title as="h4" className="font-medium">{name}</Title>
            <p className="text-xs text-gray-500 mt-0.5">{category}</p>
          </div>
        </div>

        <Dropdown placement="bottom-end">
          <Dropdown.Trigger>
            <ActionIcon as="span" variant="text" className="ml-auto h-auto w-auto p-1">
              <PiDotsThreeBold className="h-auto w-6" />
            </ActionIcon>
          </Dropdown.Trigger>
          <Dropdown.Menu className="!z-[10000]">
            <Dropdown.Item
              className="gap-2 text-xs sm:text-sm"
              onClick={() => openModal({ view: <EditService serviceId={id} />, customSize: 700 })}
            >
              {t('common.edit')}
            </Dropdown.Item>
            <Dropdown.Item
              className="gap-2 text-xs sm:text-sm text-red-600"
              onClick={handleDelete}
            >
              {deleting ? '…' : t('common.delete')}
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </header>

      <div className="mt-4 space-y-2">
        {description && <p className="text-sm text-gray-600 line-clamp-2">{description}</p>}
        {duration && (
          <div>
            <span className="text-xs text-gray-500">{t('services_immigration.duration_short')}</span>
            <p className="text-sm font-semibold">{duration}</p>
          </div>
        )}
        <div className="flex items-center justify-between pt-2">
          <Badge className={cn('text-xs', statusColors[status] || statusColors.inactive)}>
            {t(`services_immigration.status_label.${status}`, { defaultValue: status })}
          </Badge>
        </div>
      </div>
      <ModalButton
        customSize={700}
        variant="outline"
        label={t('services_immigration.edit_btn')}
        view={<EditService serviceId={id} />}
        className="items-center gap-1 text-gray-800 @lg:w-full lg:mt-6"
      />
    </div>
  );
}
