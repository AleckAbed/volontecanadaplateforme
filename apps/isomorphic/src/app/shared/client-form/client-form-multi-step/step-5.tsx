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

const STEP5_LABELS = {
  fr: {
    fromDate: 'Du (AAAA-MM)',
    toDate: 'Au (AAAA-MM)',
    streetAndNumber: 'Rue et numéro civique',
    city: 'Ville ou village',
    province: 'Province, État ou district',
    postalCode: 'Code postal/ZIP',
    country: 'Pays ou territoire',
  },
  en: {
    fromDate: 'From (YYYY-MM)',
    toDate: 'To (YYYY-MM)',
    streetAndNumber: 'Street and number',
    city: 'City or town',
    province: 'Province, State or district',
    postalCode: 'Postal/ZIP code',
    country: 'Country or territory',
  },
  es: {
    fromDate: 'Desde (AAAA-MM)',
    toDate: 'Hasta (AAAA-MM)',
    streetAndNumber: 'Calle y número',
    city: 'Ciudad o pueblo',
    province: 'Provincia, Estado o distrito',
    postalCode: 'Código postal/ZIP',
    country: 'País o territorio',
  },
} as const;

export default function StepFive() {
  const { step, gotoNextStep } = useStepper();
  const [formData, setFormData] = useAtom(formDataAtom);
  const [locale] = useAtom(questionnaireLocaleAtom);
  const t = STEP5_T[locale] || STEP5_T.fr;
  const l = STEP5_LABELS[locale] || STEP5_LABELS.fr;
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
            { key: 'fromDate', label: l.fromDate, type: 'date', placeholder: 'YYYY-MM' },
            { key: 'toDate', label: l.toDate, type: 'date', placeholder: 'YYYY-MM' },
            { key: 'streetAndNumber', label: l.streetAndNumber, type: 'text' },
            { key: 'city', label: l.city, type: 'text' },
            { key: 'province', label: l.province, type: 'text' },
            { key: 'postalCode', label: l.postalCode, type: 'text' },
            { key: 'country', label: l.country, type: 'text' },
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
