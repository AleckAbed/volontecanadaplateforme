'use client';

import { useState } from 'react';
import { useAtom } from 'jotai';
import { SubmitHandler, useForm } from 'react-hook-form';
import FormSummary from '@/app/shared/client-form/client-form-multi-step/form-summary';
import { formDataAtom, useStepper } from '@/app/shared/client-form/client-form-multi-step';
import { questionnaireLocaleAtom } from '@/app/shared/questionnaire-locale';
import { STEP4_T } from '@/app/shared/client-form/client-form-translations';
import { Input } from 'rizzui';
import DynamicTable from './dynamic-table';
import type { EducationEntry } from '@/validators/client-form.schema';

const STEP4_LABELS = {
  fr: {
    elementary: "Élémentaire/École primaire (nombre d'années):",
    secondary: "Secondaire (nombre d'années):",
    university: "Université/Collège (nombre d'années):",
    vocational: "École de formation professionnelle ou autre école postsecondaire (nombre d'années):",
    historyTitle: 'Historique des études',
    fromDate: 'Du (AAAA-MM)',
    toDate: 'Au (AAAA-MM)',
    fieldOfStudy: "Domaine d'étude",
    certificateType: 'Type de certificat ou de diplôme décerné',
    city: 'Ville ou village',
    country: 'Pays ou territoire',
    institutionName: "Nom de l'établissement",
  },
  en: {
    elementary: 'Elementary/Primary school (number of years):',
    secondary: 'Secondary (number of years):',
    university: 'University/College (number of years):',
    vocational: 'Vocational training school or other post-secondary school (number of years):',
    historyTitle: 'Education history',
    fromDate: 'From (YYYY-MM)',
    toDate: 'To (YYYY-MM)',
    fieldOfStudy: 'Field of study',
    certificateType: 'Type of certificate or degree awarded',
    city: 'City or town',
    country: 'Country or territory',
    institutionName: 'Institution name',
  },
  es: {
    elementary: 'Primaria/Escuela primaria (número de años):',
    secondary: 'Secundaria (número de años):',
    university: 'Universidad/Colegio (número de años):',
    vocational: 'Escuela de formación profesional u otra escuela postsecundaria (número de años):',
    historyTitle: 'Historial académico',
    fromDate: 'Desde (AAAA-MM)',
    toDate: 'Hasta (AAAA-MM)',
    fieldOfStudy: 'Campo de estudio',
    certificateType: 'Tipo de certificado o diploma otorgado',
    city: 'Ciudad o pueblo',
    country: 'País o territorio',
    institutionName: 'Nombre de la institución',
  },
} as const;

export default function StepFour() {
  const { step, gotoNextStep } = useStepper();
  const [formData, setFormData] = useAtom(formDataAtom);
  const [locale] = useAtom(questionnaireLocaleAtom);
  const t = STEP4_T[locale] || STEP4_T.fr;
  const l = STEP4_LABELS[locale] || STEP4_LABELS.fr;
  const [educationHistory, setEducationHistory] = useState<EducationEntry[]>(
    formData?.educationHistory || []
  );

  const {
    register,
    handleSubmit,
  } = useForm({
    defaultValues: {
      elementaryYears: formData?.elementaryYears || '',
      secondaryYears: formData?.secondaryYears || '',
      universityYears: formData?.universityYears || '',
      vocationalYears: formData?.vocationalYears || '',
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
          title={t.summaryTitle}
          description={t.summaryDesc}
        />
      </div>

      <form
        id={`rhf-${step.toString()}`}
        onSubmit={handleSubmit(onSubmit)}
        className="col-span-full rounded-lg bg-white p-5 @4xl:col-span-7 @4xl:p-7 dark:bg-gray-0"
      >
        <div className="grid gap-6">
          <div className="grid gap-4 @3xl:grid-cols-2">
            <Input label={l.elementary} type="number" {...register('elementaryYears')} />
            <Input label={l.secondary} type="number" {...register('secondaryYears')} />
            <Input label={l.university} type="number" {...register('universityYears')} />
            <Input label={l.vocational} type="number" {...register('vocationalYears')} />
          </div>

          <DynamicTable<EducationEntry>
            title={l.historyTitle}
            columns={[
              { key: 'fromDate', label: l.fromDate, type: 'date', placeholder: 'YYYY-MM' },
              { key: 'toDate', label: l.toDate, type: 'date', placeholder: 'YYYY-MM' },
              { key: 'fieldOfStudy', label: l.fieldOfStudy, type: 'text' },
              { key: 'certificateType', label: l.certificateType, type: 'text' },
              { key: 'city', label: l.city, type: 'text' },
              { key: 'country', label: l.country, type: 'text' },
              { key: 'institutionName', label: l.institutionName, type: 'text' },
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
