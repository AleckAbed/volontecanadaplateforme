'use client';

import { useState } from 'react';
import { useAtom } from 'jotai';
import { SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ActionIcon, Input, Title, Text } from 'rizzui';
import { PiXBold } from 'react-icons/pi';
import { Controller } from 'react-hook-form';
import { useModal } from '@/app/shared/modal-views/use-modal';
import { apiService } from '@/services/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { validateEmail, validatePassword } from '@/validators/common-rules';
import { messages } from '@/config/messages';
import {
  clientFormDataAtom,
  useStepperClient,
  type ClientFormDataType,
} from '@/app/shared/clients/create-client-form';
import { CLIENT_LIST_REFRESH_EVENT } from '@/app/shared/clients/create-client';
import CreateClientFormFooter from './footer';
import CountrySelect from '@/app/shared/client-form/country-select';
import CanadaAddressInput from '@/components/CanadaAddressInput';

const demandeurSchema = z.object({
  first_name: z.string().min(1, { message: messages.firstNameRequired }),
  last_name: z.string().min(1, { message: messages.lastNameRequired }),
  email: validateEmail,
  password: validatePassword,
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  nationality: z.string().optional(),
  country_of_residence: z.string().optional(),
  passport_number: z.string().optional(),
  address: z.string().optional(),
});
type DemandeurFormType = z.infer<typeof demandeurSchema>;

function buildPayload(data: ClientFormDataType) {
  return {
    client_type: data.client_type,
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email,
    password: data.password,
    phone: data.phone || undefined,
    date_of_birth: data.date_of_birth || undefined,
    nationality: data.nationality || undefined,
    country_of_residence: (data as any).country_of_residence || undefined,
    passport_number: data.passport_number || undefined,
    address: data.address || undefined,
    family_members:
      data.client_type === 'family' && data.family_members?.length
        ? data.family_members
            .filter(
              (m) =>
                (m.first_name?.trim() || m.last_name?.trim()) &&
                m.relationship
            )
            .map((m) => ({
              first_name: m.first_name,
              last_name: m.last_name,
              relationship: m.relationship,
              date_of_birth: m.date_of_birth || undefined,
              nationality: m.nationality || undefined,
              passport_number: m.passport_number || undefined,
              phone: m.phone || undefined,
              email: m.email?.trim() ? m.email : undefined,
            }))
        : undefined,
  };
}

export default function StepDemandeur() {
  const { t } = useTranslation();
  const { closeModal } = useModal();
  const [formData, setFormData] = useAtom(clientFormDataAtom);
  const { gotoNextStep } = useStepperClient();
  const [isLoading, setLoading] = useState(false);

  const isFamily = formData.client_type === 'family';

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DemandeurFormType>({
    resolver: zodResolver(demandeurSchema),
    defaultValues: {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      password: formData.password || '',
      phone: formData.phone,
      date_of_birth: formData.date_of_birth,
      nationality: formData.nationality,
      country_of_residence: formData.country_of_residence,
      passport_number: formData.passport_number,
      address: formData.address,
    },
  });

  const onSubmit: SubmitHandler<DemandeurFormType> = async (data) => {
    const nextData: ClientFormDataType = {
      ...formData,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      password: data.password,
      phone: data.phone ?? '',
      date_of_birth: data.date_of_birth ?? '',
      nationality: data.nationality ?? '',
      country_of_residence: data.country_of_residence ?? '',
      passport_number: data.passport_number ?? '',
      address: data.address ?? '',
    };
    setFormData(nextData);

    if (!isFamily) {
      setLoading(true);
      try {
        const res = await apiService.createModuleClient(buildPayload(nextData));
        if (res?.success) {
          toast.success(res.message || t('clients.create_modal.created_success'));
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent(CLIENT_LIST_REFRESH_EVENT));
          }
          closeModal();
        } else {
          toast.error(res?.message || t('clients.create_modal.create_error'));
        }
      } catch (err: any) {
        toast.error(err?.message || t('clients.create_modal.create_client_error'));
      } finally {
        setLoading(false);
      }
    } else {
      gotoNextStep();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="relative">
      <ActionIcon
        size="sm"
        variant="text"
        onClick={() => closeModal()}
        className="absolute end-3.5 top-3.5 p-0 text-gray-500 hover:!text-gray-900 md:end-7 md:top-7"
      >
        <PiXBold className="h-5 w-5" />
      </ActionIcon>
      <div className="border-b border-gray-200 px-5 py-5 md:px-7 md:py-6">
        <Title as="h2" className="font-lexend text-lg font-semibold">
          {t('clients.create_modal.demandeur_title')}
        </Title>
        <Text className="mt-1 text-gray-500">
          {t('clients.create_modal.demandeur_subtitle')}
        </Text>
      </div>
      <div className="grid grid-cols-1 gap-4 px-5 py-5 md:grid-cols-2 md:px-7 md:py-6">
        <Input
          label={t('clients.fields.first_name')}
          placeholder={t('clients.fields.first_name')}
          {...register('first_name')}
          error={errors.first_name?.message}
        />
        <Input
          label={t('clients.fields.last_name')}
          placeholder={t('clients.fields.last_name')}
          {...register('last_name')}
          error={errors.last_name?.message}
        />
        <Input
          label={t('clients.fields.email')}
          placeholder={t('clients.create_modal.email_placeholder')}
          {...register('email')}
          className="md:col-span-2"
          error={errors.email?.message}
        />
        <Input
          label={t('clients.create_modal.password')}
          type="password"
          placeholder={t('clients.create_modal.password_hint')}
          {...register('password')}
          error={errors.password?.message}
        />
        <Input
          label={t('clients.fields.phone')}
          placeholder={t('clients.create_modal.phone_placeholder')}
          {...register('phone')}
          error={errors.phone?.message}
        />
        <Input
          label={t('clients.fields.birth_date')}
          type="date"
          {...register('date_of_birth')}
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('clients.fields.nationality')}</label>
          <Controller
            name="nationality"
            control={control}
            render={({ field: { value, onChange } }) => (
              <CountrySelect
                value={value ?? ''}
                onChange={onChange}
                placeholder={t('clients.select_country')}
              />
            )}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('clients.country_residence')}</label>
          <Controller
            name="country_of_residence"
            control={control}
            render={({ field: { value, onChange } }) => (
              <CountrySelect
                value={value ?? ''}
                onChange={onChange}
                placeholder={t('clients.select_country')}
              />
            )}
          />
        </div>
        <Input
          label={t('clients.passport_number')}
          placeholder={t('clients.create_modal.passport_optional')}
          {...register('passport_number')}
        />
        <div className="md:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('clients.fields.address')}</label>
          <Controller
            name="address"
            control={control}
            render={({ field: { value, onChange } }) => {
              const country = (watch('country_of_residence') ?? '').toLowerCase();
              const isCanada = country === 'canada';
              return (
                <>
                  <CanadaAddressInput
                    value={value ?? ''}
                    onChange={onChange}
                    enabled={isCanada}
                    placeholder={isCanada
                      ? t('clients.address_ca_placeholder')
                      : t('clients.address_full')}
                    rows={2}
                  />
                  {!isCanada && (watch('country_of_residence') ?? '') !== '' && (
                    <p className="mt-1 text-xs text-gray-500">
                      {t('clients.create_modal.address_canada_hint')}
                    </p>
                  )}
                </>
              );
            }}
          />
        </div>
      </div>
      <CreateClientFormFooter
        showSubmit={!isFamily}
        isLoading={isLoading}
      />
    </form>
  );
}
