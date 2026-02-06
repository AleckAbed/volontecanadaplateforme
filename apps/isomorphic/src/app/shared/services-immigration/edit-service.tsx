'use client';

import { useState } from 'react';
import { PiXBold } from 'react-icons/pi';
import { Controller, SubmitHandler } from 'react-hook-form';
import { Form } from '@core/ui/form';
import { Input, Button, ActionIcon, Title, Select } from 'rizzui';
import {
  CreateServiceInput,
  createServiceSchema,
} from '@/validators/create-service.schema';
import { useModal } from '@/app/shared/modal-views/use-modal';
import { servicesList } from '@/data/services-immigration';

const categories = [
  { label: 'Visa', value: 'Visa' },
  { label: 'Travail', value: 'Travail' },
  { label: 'Immigration', value: 'Immigration' },
  { label: 'Citoyenneté', value: 'Citoyenneté' },
  { label: 'Famille', value: 'Famille' },
  { label: 'Éducation', value: 'Éducation' },
];

const statusOptions = [
  { label: 'Actif', value: 'active' },
  { label: 'Inactif', value: 'inactive' },
  { label: 'En attente', value: 'pending' },
];

interface EditServiceProps {
  serviceId: number;
}

export default function EditService({ serviceId }: EditServiceProps) {
  const { closeModal } = useModal();
  const [isLoading, setLoading] = useState(false);

  // Trouver le service à éditer
  const service = servicesList.find((s) => s.id === serviceId);

  const defaultValues: CreateServiceInput = service
    ? {
        serviceName: service.name,
        description: service.description,
        category: service.category,
        price: service.price,
        duration: service.duration,
        status: service.status,
      }
    : {
        serviceName: '',
        description: '',
        category: '',
        price: '',
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
              Modifier le Service
            </Title>
            <ActionIcon size="sm" variant="text" onClick={closeModal}>
              <PiXBold className="h-auto w-5" />
            </ActionIcon>
          </div>
          <Input
            label="Nom du Service"
            placeholder="Ex: Visa de Visiteur"
            {...register('serviceName')}
            error={errors.serviceName?.message}
          />
          <Input
            label="Description"
            placeholder="Description du service"
            {...register('description')}
            error={errors.description?.message}
          />
          <Controller
            control={control}
            name="category"
            render={({ field: { onChange, value } }) => (
              <Select
                label="Catégorie"
                placeholder="Sélectionner une catégorie"
                options={categories}
                value={value}
                onChange={onChange}
                error={errors.category?.message}
              />
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Prix"
              placeholder="Ex: 150 CAD"
              {...register('price')}
              error={errors.price?.message}
            />
            <Input
              label="Durée"
              placeholder="Ex: 2-4 semaines"
              {...register('duration')}
              error={errors.duration?.message}
            />
          </div>
          <Controller
            control={control}
            name="status"
            render={({ field: { onChange, value } }) => (
              <Select
                label="Statut"
                placeholder="Sélectionner un statut"
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
              Annuler
            </Button>
            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full @xl:w-auto"
            >
              Enregistrer
            </Button>
          </div>
        </>
      )}
    </Form>
  );
}




