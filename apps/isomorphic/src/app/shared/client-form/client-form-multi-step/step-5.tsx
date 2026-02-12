'use client';

import { useState } from 'react';
import { useAtom } from 'jotai';
import { SubmitHandler, useForm } from 'react-hook-form';
import FormSummary from '@/app/shared/client-form/client-form-multi-step/form-summary';
import { formDataAtom, useStepper } from '@/app/shared/client-form/client-form-multi-step';
import { questionnaireLocaleAtom } from '@/app/shared/questionnaire-locale';
import { STEP5_T } from '@/app/shared/client-form/client-form-translations';
import DynamicTable from './dynamic-table';
import type { AddressEntry } from '@/validators/client-form.schema';

export default function StepFive() {
  const { step, gotoNextStep } = useStepper();
  const [formData, setFormData] = useAtom(formDataAtom);
  const [locale] = useAtom(questionnaireLocaleAtom);
  const t = STEP5_T[locale] || STEP5_T.fr;
  const [addressHistory, setAddressHistory] = useState<AddressEntry[]>(
    formData?.addressHistory || []
  );

  const { handleSubmit } = useForm();

  const onSubmit: SubmitHandler<any> = () => {
    setFormData((prev) => ({
      ...prev,
      addressHistory,
    }));
    gotoNextStep();
  };

  const addAddressEntry = () => {
    setAddressHistory([...addressHistory, {} as AddressEntry]);
  };

  const removeAddressEntry = (index: number) => {
    setAddressHistory(addressHistory.filter((_, i) => i !== index));
  };

  const updateAddressEntry = (index: number, field: string, value: any) => {
    const updated = [...addressHistory];
    updated[index] = { ...updated[index], [field]: value };
    setAddressHistory(updated);
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
        <DynamicTable<AddressEntry>
          title={t.addressHistoryTitle}
          description={t.addressHistoryIntro}
          columns={[
            { key: 'fromDate', label: 'Du (AAAA-MM)', type: 'date', placeholder: 'YYYY-MM' },
            { key: 'toDate', label: 'Au (AAAA-MM)', type: 'date', placeholder: 'YYYY-MM' },
            { key: 'streetAndNumber', label: 'Rue et numéro civique', type: 'text' },
            { key: 'city', label: 'Ville ou village', type: 'text' },
            { key: 'province', label: 'Province, État ou district', type: 'text' },
            { key: 'postalCode', label: 'Code postal/ZIP', type: 'text' },
            { key: 'country', label: 'Pays ou territoire', type: 'text' },
          ]}
          data={addressHistory}
          onAdd={addAddressEntry}
          onRemove={removeAddressEntry}
          onUpdate={updateAddressEntry}
          maxRows={10}
        />
      </form>
    </>
  );
}
