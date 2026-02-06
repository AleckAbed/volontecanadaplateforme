'use client';

import { useState } from 'react';
import { useAtom } from 'jotai';
import { SubmitHandler, useForm } from 'react-hook-form';
import FormSummary from '@/app/shared/client-form/client-form-multi-step/form-summary';
import { formDataAtom, useStepper } from '@/app/shared/client-form/client-form-multi-step';
import DynamicTable from './dynamic-table';
import type { PersonalBackgroundEntry } from '@/validators/client-form.schema';

export default function StepSix() {
  const { step, gotoNextStep } = useStepper();
  const [formData, setFormData] = useAtom(formDataAtom);
  const [personalBackground, setPersonalBackground] = useState<PersonalBackgroundEntry[]>(
    formData?.personalBackground || []
  );

  const { handleSubmit } = useForm();

  const onSubmit: SubmitHandler<any> = () => {
    setFormData((prev) => ({
      ...prev,
      personalBackground,
    }));
    gotoNextStep();
  };

  const addEntry = () => {
    setPersonalBackground([...personalBackground, {} as PersonalBackgroundEntry]);
  };

  const removeEntry = (index: number) => {
    setPersonalBackground(personalBackground.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, field: string, value: any) => {
    const updated = [...personalBackground];
    updated[index] = { ...updated[index], [field]: value };
    setPersonalBackground(updated);
  };

  return (
    <>
      <div className="col-span-full flex flex-col justify-center @4xl:col-span-5">
        <FormSummary
          descriptionClassName="@7xl:me-10"
          title="Antécédents personnels"
          description="Veuillez préciser vos antécédents personnels au cours des 10 dernières années ou depuis votre 18e anniversaire de naissance si cela remonte à moins de 10 ans. Commencez par l'information la plus récente."
        />
      </div>

      <form
        id={`rhf-${step.toString()}`}
        onSubmit={handleSubmit(onSubmit)}
        className="col-span-full rounded-lg bg-white p-5 @4xl:col-span-7 @4xl:p-7 dark:bg-gray-0"
      >
        <p className="mb-4 text-sm text-gray-600">
          À la rubrique « Activité, » inscrivez votre profession ou votre emploi, si vous travaillez. Si vous ne travaillez pas, donnez des renseignements sur ce que vous faisiez (p.ex., sans emploi, études, voyage, retraite, en détention, etc.). Si vous étiez à l'extérieur de votre pays ou territoire de nationalité, indiquez votre statut dans le pays ou le territoire où vous étiez. Remarque: Veuillez ne laisser aucune période inexpliquée.
        </p>
        <DynamicTable<PersonalBackgroundEntry>
          title="Antécédents personnels"
          columns={[
            { key: 'fromDate', label: 'Du (AAAA-MM)', type: 'date', placeholder: 'YYYY-MM' },
            { key: 'toDate', label: 'Au (AAAA-MM)', type: 'date', placeholder: 'YYYY-MM' },
            { key: 'activity', label: 'Activité/Profession', type: 'text' },
            { key: 'city', label: 'Ville ou village', type: 'text' },
            { key: 'statusInCountry', label: 'Statut dans le pays ou territoire', type: 'text' },
            { key: 'country', label: 'Pays ou territoire', type: 'text' },
            { key: 'employerName', label: 'Nom de l\'entreprise, de l\'employeur, de l\'école', type: 'text' },
          ]}
          data={personalBackground}
          onAdd={addEntry}
          onRemove={removeEntry}
          onUpdate={updateEntry}
          maxRows={10}
        />
      </form>
    </>
  );
}
