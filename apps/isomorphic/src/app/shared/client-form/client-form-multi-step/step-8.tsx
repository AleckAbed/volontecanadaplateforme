'use client';

import { useState } from 'react';
import { useAtom } from 'jotai';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import FormSummary from '@/app/shared/client-form/client-form-multi-step/form-summary';
import { formDataAtom, useStepper } from '@/app/shared/client-form/client-form-multi-step';
import { Checkbox } from 'rizzui';
import DynamicTable from './dynamic-table';
import type { TravelEntry } from '@/validators/client-form.schema';

export default function StepEight() {
  const { step, gotoNextStep } = useStepper();
  const [formData, setFormData] = useAtom(formDataAtom);
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
          title="Liste des voyages"
          description="Veuillez énumérer tous les voyages que vous et les membres de votre famille âgés de 18 ans ou plus avez effectués depuis les 10 dernières années hors de votre pays d'origine ou de résidence"
        />
      </div>

      <form
        id={`rhf-${step.toString()}`}
        onSubmit={handleSubmit(onSubmit)}
        className="col-span-full rounded-lg bg-white p-5 @4xl:col-span-7 @4xl:p-7 dark:bg-gray-0"
      >
        <div className="grid gap-6">
          <p className="text-sm text-gray-600">
            Veuillez énumérer tous les voyages que vous et les membres de votre famille âgés de 18 ans ou plus (s'il y a lieu) avez effectués depuis les 10 dernières années hors de votre pays d'origine ou de résidence (mais seulement depuis l'âge de 18 ans). Inclure les voyages à but touristique, les voyages d'affaires, les stages de formation, etc.
          </p>

          <Controller
            name="noTrips"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Checkbox
                label="Aucun voyage"
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
              title="Historique des voyages"
              columns={[
                { key: 'fromDate', label: 'Du (AAAA-MM)', type: 'date', placeholder: 'YYYY-MM' },
                { key: 'toDate', label: 'Au (AAAA-MM)', type: 'date', placeholder: 'YYYY-MM' },
                { key: 'duration', label: 'Durée (nombre de jours)', type: 'number' },
                { key: 'placeVisited', label: 'Lieu visité (Ville et pays)', type: 'text' },
                { key: 'purpose', label: 'But du voyage', type: 'text' },
                { key: 'details', label: 'Veuillez fournir des détails (s\'il y a lieu)', type: 'text' },
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



