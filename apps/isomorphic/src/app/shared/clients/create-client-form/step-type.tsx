'use client';

import { useAtom } from 'jotai';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ActionIcon, Title, Text, Select } from 'rizzui';
import { PiXBold } from 'react-icons/pi';
import { useModal } from '@/app/shared/modal-views/use-modal';
import {
  clientFormDataAtom,
  useStepperClient,
} from '@/app/shared/clients/create-client-form';
import CreateClientFormFooter from './footer';

const schema = z.object({
  client_type: z.enum(['single', 'family'], {
    required_error: 'Choisissez le type de client',
  }),
});
type FormType = z.infer<typeof schema>;

const clientTypeOptions = [
  { label: 'Client unique', value: 'single' },
  { label: 'Famille', value: 'family' },
];

export default function StepType() {
  const { closeModal } = useModal();
  const { gotoNextStep } = useStepperClient();
  const [formData, setFormData] = useAtom(clientFormDataAtom);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormType>({
    resolver: zodResolver(schema),
    defaultValues: { client_type: formData.client_type },
  });

  const onSubmit: SubmitHandler<FormType> = (data) => {
    setFormData((prev) => ({ ...prev, client_type: data.client_type }));
    gotoNextStep();
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
      <div className="mx-auto flex max-w-md flex-col items-center gap-2.5 px-5 pb-5 pt-12 text-center md:px-7 md:pt-14">
        <Title as="h3" className="text-lg font-semibold text-gray-900 md:text-2xl">
          Type de client
        </Title>
        <Text className="leading-relaxed text-gray-500">
          Le client est-il une personne seule ou une famille (demandeur principal + membres) ?
        </Text>
      </div>
      <div className="px-5 pb-5 md:px-7 md:pb-7">
        <Controller
          name="client_type"
          control={control}
          render={({ field: { name, onChange, value } }) => (
            <Select
              options={clientTypeOptions}
              value={value}
              onChange={onChange}
              name={name}
              label="Type"
              className="max-w-md"
              error={errors.client_type?.message}
              getOptionValue={(o) => o.value}
              displayValue={(selected: string) =>
                clientTypeOptions.find((o) => o.value === selected)?.label ?? selected
              }
              dropdownClassName="!z-[1]"
              inPortal={false}
            />
          )}
        />
      </div>
      <CreateClientFormFooter nextLabel="Suivant" />
    </form>
  );
}
