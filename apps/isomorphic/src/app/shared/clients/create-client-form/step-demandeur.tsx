'use client';

import { useState } from 'react';
import { useAtom } from 'jotai';
import { SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ActionIcon, Input, Title, Text } from 'rizzui';
import { PiXBold } from 'react-icons/pi';
import { useModal } from '@/app/shared/modal-views/use-modal';
import { apiService } from '@/services/api';
import toast from 'react-hot-toast';
import { validateEmail, validatePassword } from '@/validators/common-rules';
import { messages } from '@/config/messages';
import {
  clientFormDataAtom,
  useStepperClient,
  type ClientFormDataType,
} from '@/app/shared/clients/create-client-form';
import { CLIENT_LIST_REFRESH_EVENT } from '@/app/shared/clients/create-client';
import CreateClientFormFooter from './footer';

const demandeurSchema = z.object({
  first_name: z.string().min(1, { message: messages.firstNameRequired }),
  last_name: z.string().min(1, { message: messages.lastNameRequired }),
  email: validateEmail,
  password: validatePassword,
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  nationality: z.string().optional(),
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
  const { closeModal } = useModal();
  const [formData, setFormData] = useAtom(clientFormDataAtom);
  const { gotoNextStep } = useStepperClient();
  const [isLoading, setLoading] = useState(false);

  const isFamily = formData.client_type === 'family';

  const {
    register,
    handleSubmit,
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
      passport_number: data.passport_number ?? '',
      address: data.address ?? '',
    };
    setFormData(nextData);

    if (!isFamily) {
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
          Informations du demandeur principal
        </Title>
        <Text className="mt-1 text-gray-500">
          Saisissez les informations du client (demandeur principal).
        </Text>
      </div>
      <div className="grid grid-cols-1 gap-4 px-5 py-5 md:grid-cols-2 md:px-7 md:py-6">
        <Input
          label="Prénom"
          placeholder="Prénom"
          {...register('first_name')}
          error={errors.first_name?.message}
        />
        <Input
          label="Nom"
          placeholder="Nom"
          {...register('last_name')}
          error={errors.last_name?.message}
        />
        <Input
          label="Courriel"
          placeholder="courriel@exemple.com"
          {...register('email')}
          className="md:col-span-2"
          error={errors.email?.message}
        />
        <Input
          label="Mot de passe"
          type="password"
          placeholder="Min. 8 car., 1 maj., 1 min., 1 chiffre"
          {...register('password')}
          error={errors.password?.message}
        />
        <Input
          label="Téléphone"
          placeholder="+1 514 000 0000"
          {...register('phone')}
          error={errors.phone?.message}
        />
        <Input
          label="Date de naissance"
          type="date"
          {...register('date_of_birth')}
        />
        <Input
          label="Nationalité"
          placeholder="Ex. Canada"
          {...register('nationality')}
        />
        <Input
          label="Numéro de passeport"
          placeholder="Optionnel"
          {...register('passport_number')}
        />
        <Input
          label="Adresse"
          placeholder="Adresse complète"
          {...register('address')}
          className="md:col-span-2"
          error={errors.address?.message}
        />
      </div>
      <CreateClientFormFooter
        showSubmit={!isFamily}
        submitLabel="Créer le client"
        nextLabel="Suivant"
        isLoading={isLoading}
      />
    </form>
  );
}
