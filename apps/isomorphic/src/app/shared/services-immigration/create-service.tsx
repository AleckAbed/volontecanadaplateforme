'use client';

import { useState } from 'react';
import { PiChecksBold, PiFilesBold, PiXBold } from 'react-icons/pi';
import { RgbaColorPicker } from 'react-colorful';
import { Controller, SubmitHandler } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Form } from '@core/ui/form';
import { Input, Button, Tooltip, ActionIcon, Title } from 'rizzui';
import { useCopyToClipboard } from '@core/hooks/use-copy-to-clipboard';
import {
  CreateServiceInput,
  createServiceSchema,
} from '@/validators/create-service.schema';
import { useModal } from '@/app/shared/modal-views/use-modal';

const CATEGORY_KEYS = ['Visa', 'Travail', 'Immigration', 'Citoyenneté', 'Famille', 'Éducation'];
const STATUS_KEYS = ['active', 'inactive', 'pending'] as const;

export default function CreateService() {
  const { t } = useTranslation();
  const { closeModal } = useModal();
  const [reset, setReset] = useState({});
  const [isLoading, setLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [state, copyToClipboard] = useCopyToClipboard();

  const categories = CATEGORY_KEYS.map((k) => ({ label: t(`services_immigration.categories_list.${k}`, { defaultValue: k }), value: k }));
  const statusOptions = STATUS_KEYS.map((k) => ({ label: t(`services_immigration.status_label.${k}`), value: k }));

  const onSubmit: SubmitHandler<CreateServiceInput> = (data) => {
    setLoading(true);
    setTimeout(() => {
      console.log('data', data);
      setLoading(false);
      setReset({
        serviceName: '',
        description: '',
        category: '',
        duration: '',
        status: 'active',
        serviceColor: '',
      });
      closeModal();
    }, 600);
  };

  const handleCopyToClipboard = (rgba: string) => {
    copyToClipboard(rgba);
    setIsCopied(() => true);
    setTimeout(() => setIsCopied(() => false), 3000);
  };

  return (
    <Form<CreateServiceInput>
      onSubmit={onSubmit}
      validationSchema={createServiceSchema}
      className="flex flex-grow flex-col gap-6 p-6 @container [&_.rizzui-input-label]:font-medium [&_.rizzui-input-label]:text-gray-900"
    >
      {({ register, control, watch, formState: { errors } }) => {
        const getColor = watch('serviceColor');
        const colorCode = `rgba(${getColor?.r ?? 0}, ${getColor?.g ?? 0}, ${
          getColor?.b ?? 0
        }, ${getColor?.a ?? 0})`;
        return (
          <>
            <div className="flex items-center justify-between">
              <Title as="h4" className="font-semibold">
                {t('services_immigration.add_new_title')}
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
            <Input
              label={t('services_immigration.color')}
              placeholder={t('services_immigration.color')}
              readOnly
              inputClassName="hover:border-muted"
              suffix={
                <Tooltip
                  size="sm"
                  content={isCopied ? t('services_immigration.copied_clipboard') : t('services_immigration.click_to_copy')}
                  placement="top"
                  className="z-[1000]"
                >
                  <ActionIcon
                    variant="text"
                    title={t('services_immigration.click_to_copy')}
                    onClick={() => handleCopyToClipboard(colorCode)}
                    className="-mr-3"
                  >
                    {isCopied ? (
                      <PiChecksBold className="h-[18px] w-[18px]" />
                    ) : (
                      <PiFilesBold className="h-4 w-4" />
                    )}
                  </ActionIcon>
                </Tooltip>
              }
              value={colorCode}
            />
            <Controller
              control={control}
              name="serviceColor"
              render={({ field: { onChange, value } }) => (
                <RgbaColorPicker color={value} onChange={onChange} />
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
                {t('services_immigration.submit_create')}
              </Button>
            </div>
          </>
        );
      }}
    </Form>
  );
}
