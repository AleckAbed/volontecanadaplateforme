'use client';

import { useState } from 'react';
import { useAtom } from 'jotai';
import { SubmitHandler, useForm } from 'react-hook-form';
import FormSummary from '@/app/shared/client-form/client-form-multi-step/form-summary';
import { formDataAtom, useStepper } from '@/app/shared/client-form/client-form-multi-step';
import { Input } from 'rizzui';
import DynamicTable from './dynamic-table';
import type { EducationEntry } from '@/validators/client-form.schema';

export default function StepFour() {
  const { step, gotoNextStep } = useStepper();
  const [formData, setFormData] = useAtom(formDataAtom);
  const [educationHistory, setEducationHistory] = useState<EducationEntry[]>(
    formData.educationHistory || []
  );

  const {
    register,
    handleSubmit,
  } = useForm({
    defaultValues: {
      elementaryYears: formData.elementaryYears || '',
      secondaryYears: formData.secondaryYears || '',
      universityYears: formData.universityYears || '',
      vocationalYears: formData.vocationalYears || '',
    },
  });

  const onSubmit: SubmitHandler<any> = (data) => {
    setFormData((prev) => ({
      ...prev,
      ...data,
      educationHistory,
    }));
    gotoNextStep();
  };

  const addEducationEntry = () => {
    setEducationHistory([...educationHistory, {} as EducationEntry]);
  };

  const removeEducationEntry = (index: number) => {
    setEducationHistory(educationHistory.filter((_, i) => i !== index));
  };

  const updateEducationEntry = (index: number, field: string, value: any) => {
    const updated = [...educationHistory];
    updated[index] = { ...updated[index], [field]: value };
    setEducationHistory(updated);
  };

  return (
    <>
      <div className="col-span-full flex flex-col justify-center @4xl:col-span-5">
        <FormSummary
          descriptionClassName="@7xl:me-10"
          title="Scolarité"
          description="Indiquez le nombre d'années que vous avez réussies pour chacun des niveaux d'études suivants"
        />
      </div>

      <form
        id={`rhf-${step.toString()}`}
        onSubmit={handleSubmit(onSubmit)}
        className="col-span-full rounded-lg bg-white p-5 @4xl:col-span-7 @4xl:p-7 dark:bg-gray-0"
      >
        <div className="grid gap-6">
          <div className="grid gap-4 @3xl:grid-cols-2">
            <Input
              label="Élémentaire/École primaire (années):"
              type="number"
              {...register('elementaryYears')}
            />
            <Input
              label="Secondaire (années):"
              type="number"
              {...register('secondaryYears')}
            />
            <Input
              label="Université/Collège (années):"
              type="number"
              {...register('universityYears')}
            />
            <Input
              label="École de formation professionnelle ou autre école postsecondaire (années):"
              type="number"
              {...register('vocationalYears')}
            />
          </div>

          <DynamicTable<EducationEntry>
            title="Historique des études"
            columns={[
              { key: 'fromDate', label: 'Du (AAAA-MM)', type: 'date', placeholder: 'YYYY-MM' },
              { key: 'toDate', label: 'Au (AAAA-MM)', type: 'date', placeholder: 'YYYY-MM' },
              { key: 'fieldOfStudy', label: 'Domaine d\'étude', type: 'text' },
              { key: 'certificateType', label: 'Type de certificat ou de diplôme décerné', type: 'text' },
              { key: 'city', label: 'Ville ou village', type: 'text' },
              { key: 'country', label: 'Pays ou territoire', type: 'text' },
              { key: 'institutionName', label: 'Nom de l\'établissement', type: 'text' },
            ]}
            data={educationHistory}
            onAdd={addEducationEntry}
            onRemove={removeEducationEntry}
            onUpdate={updateEducationEntry}
            maxRows={10}
          />
        </div>
      </form>
    </>
  );
}
