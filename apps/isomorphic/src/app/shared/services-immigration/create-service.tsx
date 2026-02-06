'use client';

import { useState } from 'react';
import { PiChecksBold, PiFilesBold, PiXBold } from 'react-icons/pi';
import { RgbaColorPicker } from 'react-colorful';
import { Controller, SubmitHandler } from 'react-hook-form';
import { Form } from '@core/ui/form';
import { Input, Button, Tooltip, ActionIcon, Title, Select } from 'rizzui';
import { useCopyToClipboard } from '@core/hooks/use-copy-to-clipboard';
import {
  CreateServiceInput,
  createServiceSchema,
} from '@/validators/create-service.schema';
import { useModal } from '@/app/shared/modal-views/use-modal';

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

// main service form component for create and update service
export default function CreateService() {
  const { closeModal } = useModal();
  const [reset, setReset] = useState({});
  const [isLoading, setLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [state, copyToClipboard] = useCopyToClipboard();

  const onSubmit: SubmitHandler<CreateServiceInput> = (data) => {
    // set timeout ony required to display loading state of the create service button
    setLoading(true);
    setTimeout(() => {
      console.log('data', data);
      setLoading(false);
      setReset({
        serviceName: '',
        description: '',
        category: '',
        price: '',
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
    setTimeout(() => {
      setIsCopied(() => false);
    }, 3000); // 3 seconds
  };

  return (
    <Form<CreateServiceInput>
      // resetValues={reset}
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
                Ajouter un nouveau Service
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
            <Input
              label="Couleur du Service"
              placeholder="Couleur du Service"
              readOnly
              inputClassName="hover:border-muted"
              suffix={
                <Tooltip
                  size="sm"
                  content={isCopied ? 'Copié dans le presse-papiers' : 'Cliquer pour copier'}
                  placement="top"
                  className="z-[1000]"
                >
                  <ActionIcon
                    variant="text"
                    title="Cliquer pour copier"
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
                Annuler
              </Button>
              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full @xl:w-auto"
              >
                Créer le Service
              </Button>
            </div>
          </>
        );
      }}
    </Form>
  );
}




