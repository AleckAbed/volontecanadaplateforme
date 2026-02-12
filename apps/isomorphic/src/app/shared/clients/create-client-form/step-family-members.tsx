'use client';

import { useState } from 'react';
import { useAtom } from 'jotai';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
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

const familyMemberSchema = z.object({
  first_name: z.string().min(1, 'Prénom requis'),
  last_name: z.string().min(1, 'Nom requis'),
  relationship: z.string().min(1, 'Relation requise'),
  date_of_birth: z.string().optional(),
  nationality: z.string().optional(),
  passport_number: z.string().optional(),
  phone: z.string().optional(),
  email: z
    .string()
    .optional()
    .refine((v) => !v || v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
      message: 'Courriel invalide',
    }),
});

const schema = z.object({
  family_members: z.array(familyMemberSchema),
});
type FormType = z.infer<typeof schema>;

const relationshipOptions = [
  { label: 'Conjoint(e)', value: 'Conjoint(e)' },
  { label: 'Enfant', value: 'Enfant' },
  { label: 'Parent', value: 'Parent' },
  { label: 'Frère / Sœur', value: 'Frère / Sœur' },
  { label: 'Autre', value: 'Autre' },
];

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
              passport_number: m.passport_number || undefined,
              phone: m.phone || undefined,
              email: m.email?.trim() ? m.email : undefined,
            }))
        : undefined,
  };
}

export default function StepFamilyMembers() {
  const { closeModal } = useModal();
  const [formData] = useAtom(clientFormDataAtom);
  const [isLoading, setLoading] = useState(false);

  const {
    control,
    register,
    handleSubmit,
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
        toast.success(res.message || 'Client créé avec succès');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent(CLIENT_LIST_REFRESH_EVENT));
        }
        closeModal();
      } else {
        toast.error(res?.message || 'Erreur lors de la création');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de la création du client');
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
          Membres de la famille
        </Title>
        <Text className="mt-1 text-gray-500">
          Ajoutez les membres de la famille du demandeur principal.
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
                passport_number: '',
                phone: '',
                email: '',
              })
            }
          >
            <PiPlusBold className="me-1 h-4 w-4" />
            Ajouter un membre
          </Button>
        </div>
        {fields.length === 0 && (
          <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-4 text-center text-sm text-gray-500">
            Aucun membre. Cliquez sur &quot;Ajouter un membre&quot; pour en
            ajouter (optionnel).
          </p>
        )}
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-gray-50/50 p-4 md:grid-cols-2"
          >
            <div className="flex items-center justify-between md:col-span-2">
              <span className="text-sm font-medium">Membre {index + 1}</span>
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
              label="Prénom"
              {...register(`family_members.${index}.first_name`)}
              error={errors.family_members?.[index]?.first_name?.message}
            />
            <Input
              label="Nom"
              {...register(`family_members.${index}.last_name`)}
              error={errors.family_members?.[index]?.last_name?.message}
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
                  label="Relation"
                  error={
                    errors.family_members?.[index]?.relationship?.message
                  }
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
              label="Date de naissance"
              type="date"
              {...register(`family_members.${index}.date_of_birth`)}
            />
            <Input
              label="Nationalité"
              {...register(`family_members.${index}.nationality`)}
            />
            <Input
              label="Passeport"
              {...register(`family_members.${index}.passport_number`)}
            />
            <Input
              label="Téléphone"
              {...register(`family_members.${index}.phone`)}
            />
            <Input
              label="Courriel"
              {...register(`family_members.${index}.email`)}
            />
          </div>
        ))}
      </div>
      <CreateClientFormFooter
        showSubmit
        submitLabel="Créer le client"
        isLoading={isLoading}
      />
    </form>
  );
}
