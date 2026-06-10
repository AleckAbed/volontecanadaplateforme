'use client';

import { useState } from 'react';
import { useAtom } from 'jotai';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import FormSummary from '@/app/shared/client-form/client-form-multi-step/form-summary';
import { formDataAtom, useStepper } from '@/app/shared/client-form/client-form-multi-step';
import { questionnaireLocaleAtom } from '@/app/shared/questionnaire-locale';
import { STEP8_T } from '@/app/shared/client-form/client-form-translations';
import { Checkbox } from 'rizzui';
import DynamicTable from './dynamic-table';
import type { TravelEntry } from '@/validators/client-form.schema';

const STEP8_LABELS = {
  fr: {
    intro: "Veuillez énumérer tous les voyages que vous et les membres de votre famille âgés de 18 ans ou plus (s'il y a lieu) avez effectués depuis les 10 dernières années hors de votre pays d'origine ou de résidence (mais seulement depuis l'âge de 18 ans). Inclure les voyages à but touristique, les voyages d'affaires, les stages de formation, etc.",
    noTrips: 'Aucun voyage',
    title: 'Historique des voyages',
    fromDate: 'Du (AAAA-MM)',
    toDate: 'Au (AAAA-MM)',
    duration: 'Durée (nombre de jours)',
    placeVisited: 'Lieu visité (Ville et pays)',
    purpose: 'But du voyage',
    details: "Veuillez fournir des détails (s'il y a lieu)",
  },
  en: {
    intro: 'Please list all trips you and family members aged 18 or over (if applicable) have made in the last 10 years outside your country of origin or residence (but only since age 18). Include tourist trips, business trips, training internships, etc.',
    noTrips: 'No trips',
    title: 'Travel history',
    fromDate: 'From (YYYY-MM)',
    toDate: 'To (YYYY-MM)',
    duration: 'Duration (number of days)',
    placeVisited: 'Place visited (City and country)',
    purpose: 'Purpose of the trip',
    details: 'Please provide details (if applicable)',
  },
  es: {
    intro: 'Por favor enumere todos los viajes que usted y los miembros de su familia mayores de 18 años (si aplica) han realizado en los últimos 10 años fuera de su país de origen o residencia (pero solo desde los 18 años). Incluya viajes turísticos, viajes de negocios, prácticas de formación, etc.',
    noTrips: 'Ningún viaje',
    title: 'Historial de viajes',
    fromDate: 'Desde (AAAA-MM)',
    toDate: 'Hasta (AAAA-MM)',
    duration: 'Duración (número de días)',
    placeVisited: 'Lugar visitado (Ciudad y país)',
    purpose: 'Motivo del viaje',
    details: 'Por favor proporcione los detalles (si aplica)',
  },
} as const;

export default function StepEight() {
  const { step, gotoNextStep } = useStepper();
  const [formData, setFormData] = useAtom(formDataAtom);
  const [locale] = useAtom(questionnaireLocaleAtom);
  const t = STEP8_T[locale] || STEP8_T.fr;
  const l = STEP8_LABELS[locale] || STEP8_LABELS.fr;
  const [travels, setTravels] = useState<TravelEntry[]>(formData?.travels || []);
  const [noTrips, setNoTrips] = useState(formData?.noTrips || false);

  const { handleSubmit, control } = useForm();

  const onSubmit: SubmitHandler<any> = () => {
    setFormData((prev) => ({
      ...prev,
      travels: noTrips ? [] : travels,
      noTrips,
    }));
    gotoNextStep();
  };

  const addTravel = () => {
    setTravels([...travels, {} as TravelEntry]);
  };

  const removeTravel = (index: number) => {
    setTravels(travels.filter((_, i) => i !== index));
  };

  const updateTravel = (index: number, field: string, value: any) => {
    const updated = [...travels];
    updated[index] = { ...updated[index], [field]: value };
    setTravels(updated);
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
          <p className="text-sm text-gray-600">{l.intro}</p>

          <Controller
            name="noTrips"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Checkbox
                label={l.noTrips}
                checked={value || noTrips}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setNoTrips(checked);
                  onChange(checked);
                  if (checked) {
                    setTravels([]);
                  }
                }}
              />
            )}
          />

          {!noTrips && (
            <DynamicTable<TravelEntry>
              title={l.title}
              columns={[
                { key: 'fromDate', label: l.fromDate, type: 'date', placeholder: 'YYYY-MM' },
                { key: 'toDate', label: l.toDate, type: 'date', placeholder: 'YYYY-MM' },
                { key: 'duration', label: l.duration, type: 'number' },
                { key: 'placeVisited', label: l.placeVisited, type: 'text' },
                { key: 'purpose', label: l.purpose, type: 'text' },
                { key: 'details', label: l.details, type: 'text' },
              ]}
              data={travels}
              onAdd={addTravel}
              onRemove={removeTravel}
              onUpdate={updateTravel}
              maxRows={12}
            />
          )}
        </div>
      </form>
    </>
  );
}



