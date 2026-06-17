'use client';

import { useEffect, useState } from 'react';
import { PiXBold } from 'react-icons/pi';
import { Controller, SubmitHandler } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Form } from '@core/ui/form';
import { Input, Button, ActionIcon, Title } from 'rizzui';
import {
  CreateServiceInput,
  createServiceSchema,
} from '@/validators/create-service.schema';
import { useModal } from '@/app/shared/modal-views/use-modal';
import { IMMIGRATION_SERVICES_REFRESH_EVENT } from '@/data/services-immigration';
import { immigrationServicesService, ImmigrationServiceItem } from '@/services/immigration-services';
import toast from 'react-hot-toast';

const CATEGORY_KEYS = ['Visa', 'Travail', 'Immigration', 'Citoyenneté', 'Famille', 'Éducation'];
const STATUS_KEYS = ['active', 'inactive', 'pending'] as const;

interface EditServiceProps {
  serviceId: number;
}

export default function EditService({ serviceId }: EditServiceProps) {
  const { t } = useTranslation();
  const { closeModal } = useModal();
  const [isLoading, setLoading] = useState(false);
  const [service, setService] = useState<ImmigrationServiceItem | null>(null);
  const [loadingService, setLoadingService] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await immigrationServicesService.list();
        const s = list.find((x) => x.id === serviceId);
        if (s) setService(s);
        else toast.error('Service introuvable');
      } catch (e: any) {
        toast.error(e.message || 'Chargement impossible');
      } finally {
        setLoadingService(false);
      }
    })();
  }, [serviceId]);

  const categories = CATEGORY_KEYS.map((k) => ({ label: t(`services_immigration.categories_list.${k}`, { defaultValue: k }), value: k }));
  const statusOptions = STATUS_KEYS.map((k) => ({ label: t(`services_immigration.status_label.${k}`), value: k }));

  const defaultValues: CreateServiceInput = service
    ? {
        serviceName: service.name,
        description: service.description,
        category: service.category,
        duration: service.duration,
        status: service.status,
      }
    : {
        serviceName: '',
        description: '',
        category: '',
        duration: '',
        status: 'active',
      };

  const onSubmit: SubmitHandler<CreateServiceInput> = async (data) => {
    try {
      setLoading(true);
      await immigrationServicesService.update(serviceId, {
        name: (data as any).serviceName,
        description: data.description || undefined,
        category: data.category || undefined,
        duration: data.duration || undefined,
        status: (data.status as any) || 'active',
      });
      toast.success(t('services_immigration.toasts.updated', { defaultValue: 'Service mis à jour' }));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(IMMIGRATION_SERVICES_REFRESH_EVENT));
      }
      closeModal();
    } catch (e: any) {
      toast.error(e.message || t('services_immigration.toasts.update_error', { defaultValue: 'Échec' }));
    } finally {
      setLoading(false);
    }
  };

  if (loadingService) {
    return (
      <div className="flex items-center justify-center p-10 text-sm text-gray-500">
        Chargement du service…
      </div>
    );
  }

  return (
    <Form<CreateServiceInput>
      useFormProps={{ defaultValues: defaultValues as any }}
      onSubmit={onSubmit}
      validationSchema={createServiceSchema}
      className="flex flex-grow flex-col gap-6 p-6 @container [&_.rizzui-input-label]:font-medium [&_.rizzui-input-label]:text-gray-900"
    >
      {({ register, control, formState: { errors } }) => (
        <>
          <div className="flex items-center justify-between">
            <Title as="h4" className="font-semibold">
              {t('services_immigration.edit_title')}
            </Title>
            <ActionIcon size="sm" variant="text" onClick={closeModal}>
              <PiXBold className="h-auto w-5" />
            </ActionIcon>
          </div>
          <Input
            label={t('services_immigration.service_name')}
            placeholder={t('services_immigration.service_name_placeholder')}
            {...register('serviceName')}
            error={errors.serviceName?.message}
          />
          <Input
            label={t('services_immigration.description')}
            placeholder={t('services_immigration.description_placeholder')}
            {...register('description')}
            error={errors.description?.message}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-900">
              {t('services_immigration.category')}
            </label>
            <Controller
              control={control}
              name="category"
              render={({ field: { onChange, value } }) => (
                <select
                  value={value ?? ''}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-200 dark:bg-gray-50"
                >
                  <option value="">{t('services_immigration.category_placeholder')}</option>
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              )}
            />
            {errors.category?.message && (
              <p className="mt-1 text-xs text-red-600">{errors.category.message}</p>
            )}
          </div>
          <Input
            label={t('services_immigration.duration')}
            placeholder={t('services_immigration.duration_placeholder')}
            {...register('duration')}
            error={errors.duration?.message}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-900">
              {t('services_immigration.status')}
            </label>
            <Controller
              control={control}
              name="status"
              render={({ field: { onChange, value } }) => (
                <select
                  value={value ?? ''}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-200 dark:bg-gray-50"
                >
                  <option value="">{t('services_immigration.status_placeholder')}</option>
                  {statusOptions.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              )}
            />
            {errors.status?.message && (
              <p className="mt-1 text-xs text-red-600">{errors.status.message}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-4">
            <Button
              variant="outline"
              onClick={closeModal}
              className="w-full @xl:w-auto"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full @xl:w-auto"
            >
              {t('common.save')}
            </Button>
          </div>
        </>
      )}
    </Form>
  );
}
