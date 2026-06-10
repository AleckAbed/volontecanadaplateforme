'use client';

import { useState } from 'react';
import { useAtom } from 'jotai';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { ActionIcon, Input, Title, Text, Button, Select } from 'rizzui';
import { PiXBold, PiPlusBold, PiTrashBold } from 'react-icons/pi';
import { useModal } from '@/app/shared/modal-views/use-modal';
import { apiService } from '@/services/api';
import toast from 'react-hot-toast';
import {
  clientFormDataAtom,
  type ClientFormDataType,
} from '@/app/shared/clients/create-client-form';
import { CLIENT_LIST_REFRESH_EVENT } from '@/app/shared/clients/create-client';
import CreateClientFormFooter from './footer';
import CountrySelect from '@/app/shared/client-form/country-select';
import CanadaAddressInput from '@/components/CanadaAddressInput';

const familyMemberSchema = z.object({
  first_name: z.string().min(1, 'FIRST_NAME_REQUIRED'),
  last_name: z.string().min(1, 'LAST_NAME_REQUIRED'),
  relationship: z.string().min(1, 'RELATIONSHIP_REQUIRED'),
  date_of_birth: z.string().optional(),
  nationality: z.string().optional(),
  country_of_residence: z.string().optional(),
  address: z.string().optional(),
  passport_number: z.string().optional(),
  phone: z.string().optional(),
  email: z
    .string()
    .optional()
    .refine((v) => !v || v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
      message: 'INVALID_EMAIL',
    }),
});

const schema = z.object({
  family_members: z.array(familyMemberSchema),
});
type FormType = z.infer<typeof schema>;

const RELATIONSHIP_VALUES = ['Conjoint(e)', 'Enfant', 'Parent', 'Frère / Sœur', 'Autre'];
const RELATIONSHIP_TKEY: Record<string, string> = {
  'Conjoint(e)': 'conjoint',
  'Enfant': 'enfant',
  'Parent': 'parent',
  'Frère / Sœur': 'frere_soeur',
  'Autre': 'autre',
};

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
    passport_number: data.passport_number || undefined,
    address: data.address || undefined,
    family_members:
      data.family_members?.length
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
              country_of_residence: m.country_of_residence || undefined,
              address: m.address || undefined,
              passport_number: m.passport_number || undefined,
              phone: m.phone || undefined,
              email: m.email?.trim() ? m.email : undefined,
            }))
        : undefined,
  };
}

export default function StepFamilyMembers() {
  const { t } = useTranslation();
  const { closeModal } = useModal();
  const [formData] = useAtom(clientFormDataAtom);
  const [isLoading, setLoading] = useState(false);

  const relationshipOptions = RELATIONSHIP_VALUES.map((v) => ({
    label: t(`clients.relationship.${RELATIONSHIP_TKEY[v]}`, { defaultValue: v }),
    value: v,
  }));

  const translateError = (code?: string) => {
    if (!code) return undefined;
    switch (code) {
      case 'FIRST_NAME_REQUIRED': return t('clients.create_modal.first_name_required');
      case 'LAST_NAME_REQUIRED': return t('clients.create_modal.last_name_required');
      case 'RELATIONSHIP_REQUIRED': return t('clients.create_modal.relationship_required');
      case 'INVALID_EMAIL': return t('clients.create_modal.invalid_email');
      default: return code;
    }
  };

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormType>({
    resolver: zodResolver(schema),
    defaultValues: {
      family_members: formData.family_members?.length
        ? formData.family_members
        : [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'family_members',
  });

  const onSubmit = async (data: FormType) => {
    const nextData: ClientFormDataType = {
      ...formData,
      family_members: data.family_members,
    };
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
          {t('clients.create_modal.members_title')}
        </Title>
        <Text className="mt-1 text-gray-500">
          {t('clients.create_modal.members_subtitle')}
        </Text>
      </div>
      <div className="space-y-4 px-5 py-5 md:px-7 md:py-6">
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              append({
                first_name: '',
                last_name: '',
                relationship: '',
                date_of_birth: '',
                nationality: '',
                country_of_residence: '',
                address: '',
                passport_number: '',
                phone: '',
                email: '',
              })
            }
          >
            <PiPlusBold className="me-1 h-4 w-4" />
            {t('clients.create_modal.add_member')}
          </Button>
        </div>
        {fields.length === 0 && (
          <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-4 text-center text-sm text-gray-500">
            {t('clients.create_modal.no_members_hint')}
          </p>
        )}
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-gray-50/50 p-4 md:grid-cols-2"
          >
            <div className="flex items-center justify-between md:col-span-2">
              <span className="text-sm font-medium">{t('clients.create_modal.member_n', { n: index + 1 })}</span>
              <ActionIcon
                type="button"
                size="sm"
                variant="text"
                onClick={() => remove(index)}
                className="text-red-600"
              >
                <PiTrashBold className="h-4 w-4" />
              </ActionIcon>
            </div>
            <Input
              label={t('clients.fields.first_name')}
              {...register(`family_members.${index}.first_name`)}
              error={translateError(errors.family_members?.[index]?.first_name?.message)}
            />
            <Input
              label={t('clients.fields.last_name')}
              {...register(`family_members.${index}.last_name`)}
              error={translateError(errors.family_members?.[index]?.last_name?.message)}
            />
            <Controller
              name={`family_members.${index}.relationship`}
              control={control}
              render={({ field: { name, onChange, value } }) => (
                <Select
                  options={relationshipOptions}
                  value={value}
                  onChange={onChange}
                  name={name}
                  label={t('clients.create_modal.relationship_label')}
                  error={translateError(errors.family_members?.[index]?.relationship?.message)}
                  getOptionValue={(o) => o.value}
                  displayValue={(selected: string) =>
                    relationshipOptions.find((o) => o.value === selected)
                      ?.label ?? selected
                  }
                  dropdownClassName="!z-[1]"
                  inPortal={false}
                />
              )}
            />
            <Input
              label={t('clients.fields.birth_date')}
              type="date"
              {...register(`family_members.${index}.date_of_birth`)}
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('clients.fields.nationality')}</label>
              <Controller
                name={`family_members.${index}.nationality`}
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
                name={`family_members.${index}.country_of_residence`}
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
              label={t('clients.create_modal.passport')}
              {...register(`family_members.${index}.passport_number`)}
            />
            <Input
              label={t('clients.fields.phone')}
              {...register(`family_members.${index}.phone`)}
            />
            <Input
              label={t('clients.fields.email')}
              {...register(`family_members.${index}.email`)}
              error={translateError(errors.family_members?.[index]?.email?.message)}
            />
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('clients.address_full')}</label>
              <Controller
                name={`family_members.${index}.address`}
                control={control}
                render={({ field: { value, onChange } }) => {
                  const country = (watch(`family_members.${index}.country_of_residence`) ?? '').toLowerCase();
                  const isCanada = country === 'canada';
                  return (
                    <>
                      <CanadaAddressInput
                        value={value ?? ''}
                        onChange={onChange}
                        enabled={isCanada}
                        placeholder={isCanada
                          ? t('clients.create_modal.address_ca_placeholder')
                          : t('clients.create_modal.address_full')}
                        rows={2}
                      />
                      {!isCanada && country !== '' && (
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
        ))}
      </div>
      <CreateClientFormFooter showSubmit isLoading={isLoading} />
    </form>
  );
}
