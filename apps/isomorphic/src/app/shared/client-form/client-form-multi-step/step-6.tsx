'use client';

import { useState } from 'react';
import { useAtom } from 'jotai';
import { SubmitHandler, useForm } from 'react-hook-form';
import FormSummary from '@/app/shared/client-form/client-form-multi-step/form-summary';
import { formDataAtom, useStepper } from '@/app/shared/client-form/client-form-multi-step';
import { questionnaireLocaleAtom } from '@/app/shared/questionnaire-locale';
import { STEP6_T } from '@/app/shared/client-form/client-form-translations';
import DynamicTable from './dynamic-table';
import type { PersonalBackgroundEntry } from '@/validators/client-form.schema';

const STEP6_LABELS = {
  fr: {
    intro: "Veuillez préciser vos antécédents personnels au cours des 10 dernières années ou depuis votre 18e anniversaire de naissance si cela remonte à moins de 10 ans. Commencez par l'information la plus récente. À la rubrique « Activité, » inscrivez votre profession ou votre emploi, si vous travaillez. Si vous ne travaillez pas, donnez des renseignements sur ce que vous faisiez (p.ex., sans emploi, études, voyage, retraite, en détention, etc.). Si vous étiez à l'extérieur de votre pays ou territoire de nationalité, indiquez votre statut dans le pays ou le territoire où vous étiez. Remarque: Veuillez ne laisser aucune période inexpliquée.",
    title: 'Antécédents personnels',
    fromDate: 'Du (AAAA-MM)',
    toDate: 'Au (AAAA-MM)',
    activity: 'Activité/Profession',
    city: 'Ville ou village',
    statusInCountry: 'Statut dans le pays ou territoire',
    country: 'Pays ou territoire',
    employerName: "Nom de l'entreprise, de l'employeur, de l'école",
  },
  en: {
    intro: 'Please specify your personal background over the last 10 years or since your 18th birthday if that was less than 10 years ago. Start with the most recent information. Under "Activity", enter your profession or job if you work. If you don\'t work, provide information about what you were doing (e.g., unemployed, studies, travel, retirement, in detention, etc.). If you were outside your country or territory of nationality, indicate your status in the country or territory. Note: Please do not leave any unexplained period.',
    title: 'Personal background',
    fromDate: 'From (YYYY-MM)',
    toDate: 'To (YYYY-MM)',
    activity: 'Activity/Profession',
    city: 'City or town',
    statusInCountry: 'Status in the country or territory',
    country: 'Country or territory',
    employerName: 'Name of the company, employer, school',
  },
  es: {
    intro: 'Por favor especifique sus antecedentes personales de los últimos 10 años o desde su 18º cumpleaños si esto fue hace menos de 10 años. Empiece por la información más reciente. Bajo "Actividad", ingrese su profesión o empleo, si trabaja. Si no trabaja, dé información sobre lo que hacía (p. ej., desempleado, estudios, viaje, jubilación, en detención, etc.). Si estaba fuera de su país o territorio de nacionalidad, indique su estatus en el país o territorio. Nota: Por favor no deje ningún periodo sin explicar.',
    title: 'Antecedentes personales',
    fromDate: 'Desde (AAAA-MM)',
    toDate: 'Hasta (AAAA-MM)',
    activity: 'Actividad/Profesión',
    city: 'Ciudad o pueblo',
    statusInCountry: 'Estatus en el país o territorio',
    country: 'País o territorio',
    employerName: 'Nombre de la empresa, empleador, escuela',
  },
} as const;

export default function StepSix() {
  const { step, gotoNextStep } = useStepper();
  const [formData, setFormData] = useAtom(formDataAtom);
  const [locale] = useAtom(questionnaireLocaleAtom);
  const t = STEP6_T[locale] || STEP6_T.fr;
  const l = STEP6_LABELS[locale] || STEP6_LABELS.fr;
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
          title={t.summaryTitle}
          description={t.summaryDesc}
        />
      </div>

      <form
        id={`rhf-${step.toString()}`}
        onSubmit={handleSubmit(onSubmit)}
        className="col-span-full rounded-lg bg-white p-5 @4xl:col-span-7 @4xl:p-7 dark:bg-gray-0"
      >
        <p className="mb-4 text-sm text-gray-600">{l.intro}</p>
        <DynamicTable<PersonalBackgroundEntry>
          title={l.title}
          columns={[
            { key: 'fromDate', label: l.fromDate, type: 'date', placeholder: 'YYYY-MM' },
            { key: 'toDate', label: l.toDate, type: 'date', placeholder: 'YYYY-MM' },
            { key: 'activity', label: l.activity, type: 'text' },
            { key: 'city', label: l.city, type: 'text' },
            { key: 'statusInCountry', label: l.statusInCountry, type: 'text' },
            { key: 'country', label: l.country, type: 'text' },
            { key: 'employerName', label: l.employerName, type: 'text' },
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
