'use client';

import { useState } from 'react';
import { PiChecksBold, PiFilesBold, PiXBold } from 'react-icons/pi';
import { RgbaColorPicker } from 'react-colorful';
import { Controller, SubmitHandler } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Form } from '@core/ui/form';
import { Input, Button, Tooltip, ActionIcon, Title, Select } from 'rizzui';
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
