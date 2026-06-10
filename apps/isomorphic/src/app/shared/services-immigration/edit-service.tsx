'use client';

import { useState } from 'react';
import { PiXBold } from 'react-icons/pi';
import { Controller, SubmitHandler } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Form } from '@core/ui/form';
import { Input, Button, ActionIcon, Title, Select } from 'rizzui';
import {
  CreateServiceInput,
  createServiceSchema,
} from '@/validators/create-service.schema';
import { useModal } from '@/app/shared/modal-views/use-modal';
import { servicesList } from '@/data/services-immigration';

const CATEGORY_KEYS = ['Visa', 'Travail', 'Immigration', 'Citoyenneté', 'Famille', 'Éducation'];
const STATUS_KEYS = ['active', 'inactive', 'pending'] as const;

interface EditServiceProps {
  serviceId: number;
}

export default function EditService({ serviceId }: EditServiceProps) {
  const { t } = useTranslation();
  const { closeModal } = useModal();
  const [isLoading, setLoading] = useState(false);

  const service = servicesList.find((s) => s.id === serviceId);

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

  const onSubmit: SubmitHandler<CreateServiceInput> = (data) => {
    setLoading(true);
    setTimeout(() => {
      console.log('data', data);
      setLoading(false);
      closeModal();
    }, 600);
  };

  return (
    <Form<CreateServiceInput>
      defaultValues={defaultValues}
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
          <Controller
            control={control}
            name="category"
            render={({ field: { onChange, value } }) => (
              <Select
                label={t('services_immigration.category')}
                placeholder={t('services_immigration.category_placeholder')}
                options={categories}
                value={value}
                onChange={onChange}
                error={errors.category?.message}
              />
            )}
          />
          <Input
            label={t('services_immigration.duration')}
            placeholder={t('services_immigration.duration_placeholder')}
            {...register('duration')}
            error={errors.duration?.message}
          />
          <Controller
            control={control}
            name="status"
            render={({ field: { onChange, value } }) => (
              <Select
                label={t('services_immigration.status')}
                placeholder={t('services_immigration.status_placeholder')}
                options={statusOptions}
                value={value}
                onChange={onChange}
                error={errors.status?.message}
              />
            )}
          />

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
