'use client';

import { useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import FormSummary from '@/app/shared/client-form/client-form-multi-step/form-summary';
import { formDataAtom, useStepper } from '@/app/shared/client-form/client-form-multi-step';
import { Input } from 'rizzui';
import {
  clientFormStep3Schema,
  ClientFormStep3Input,
} from '@/validators/client-form.schema';
import CountrySelect from '@/app/shared/client-form/country-select';
import DateField from '@/app/shared/client-form/date-field';

export default function StepThree() {
  const { step, gotoNextStep } = useStepper();
  const [formData, setFormData] = useAtom(formDataAtom);

  const methods = useForm<ClientFormStep3Input>({
    defaultValues: {
      passportNumber: formData?.passportNumber || '',
      passportIssueCountry: formData?.passportIssueCountry || '',
      passportIssueDate: formData?.passportIssueDate || '',
      passportExpiryDate: formData?.passportExpiryDate || '',
      nationalIdNumber: formData?.nationalIdNumber || '',
      nationalIdIssueCountry: formData?.nationalIdIssueCountry || '',
      nationalIdIssueDate: formData?.nationalIdIssueDate || '',
      nationalIdExpiryDate: formData?.nationalIdExpiryDate || '',
      highestEducationLevel: formData?.highestEducationLevel || '',
      totalYearsOfStudy: formData?.totalYearsOfStudy || '',
      currentEmployment: formData?.currentEmployment || '',
      plannedEmployment: formData?.plannedEmployment || '',
    },
  });

  const { register, handleSubmit, control, watch } = methods;

  // Mettre à jour le formulaire quand formData change (chargement depuis la DB)
  const isInitialLoad = useRef(true);
  useEffect(() => {
    if (isInitialLoad.current && formData != null && typeof methods.reset === 'function') {
      methods.reset({
        passportNumber: formData.passportNumber || '',
        passportIssueCountry: formData.passportIssueCountry || '',
        passportIssueDate: formData.passportIssueDate || '',
        passportExpiryDate: formData.passportExpiryDate || '',
        nationalIdNumber: formData.nationalIdNumber || '',
        nationalIdIssueCountry: formData.nationalIdIssueCountry || '',
        nationalIdIssueDate: formData.nationalIdIssueDate || '',
        nationalIdExpiryDate: formData.nationalIdExpiryDate || '',
        highestEducationLevel: formData.highestEducationLevel || '',
        totalYearsOfStudy: formData.totalYearsOfStudy || '',
        currentEmployment: formData.currentEmployment || '',
        plannedEmployment: formData.plannedEmployment || '',
      });
      isInitialLoad.current = false;
    }
  }, [formData, methods]);

  const onSubmit: SubmitHandler<ClientFormStep3Input> = (data) => {
    setFormData((prev) => ({
      ...prev,
      ...data,
    }));
    gotoNextStep();
  };

  // Synchroniser les données du formulaire avec l'atom avant la sauvegarde
  // Utiliser un debounce pour éviter trop de mises à jour
  const formValues = watch();
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Ne synchroniser que si on n'est pas en train de charger les données initiales
    if (!isInitialLoad.current) {
      // Debounce pour éviter trop de mises à jour
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      
      syncTimeoutRef.current = setTimeout(() => {
        // Mettre à jour l'atom avec les valeurs actuelles du formulaire
        setFormData((prev) => ({
          ...prev,
          ...formValues,
        }));
      }, 500); // 500ms de délai
    }
    
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [formValues, setFormData]);

  return (
    <>
      <div className="col-span-full flex flex-col justify-center @4xl:col-span-5">
        <FormSummary
          descriptionClassName="@7xl:me-10"
          title="Passeport, Pièce d'identité et Scolarité/Emploi"
          description="Veuillez fournir les informations sur votre passeport, pièce d'identité nationale et vos détails de scolarité/emploi"
        />
      </div>

      <form
        id={`rhf-${step.toString()}`}
        onSubmit={handleSubmit(onSubmit)}
        className="col-span-full rounded-lg bg-white p-5 @4xl:col-span-7 @4xl:p-7 dark:bg-gray-0"
      >
        <div className="grid gap-6">
          {/* Passeport */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Passeport
            </h3>
            <div className="grid gap-4 @3xl:grid-cols-2">
              <Input
                label="Numéro du passeport/titre de voyage:"
                {...register('passportNumber')}
                className="w-full"
              />
              <Controller
                name="passportIssueCountry"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <CountrySelect
                    label="Pays de délivrance:"
                    value={value}
                    onChange={onChange}
                  />
                )}
              />
              <DateField
                name="passportIssueDate"
                control={control}
                label="Date de délivrance (AAAA/MM/JJ):"
                className="w-full"
              />
              <DateField
                name="passportExpiryDate"
                control={control}
                label="Date d'expiration (AAAA/MM/JJ):"
                className="w-full"
              />
            </div>
          </div>

          {/* Pièce d'identité nationale */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Pièce d'identité nationale
            </h3>
            <div className="grid gap-4 @3xl:grid-cols-2">
              <Input
                label="Numéro Pièce d'identité nationale:"
                {...register('nationalIdNumber')}
                className="w-full"
              />
              <Controller
                name="nationalIdIssueCountry"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <CountrySelect
                    label="Pays de délivrance:"
                    value={value}
                    onChange={onChange}
                  />
                )}
              />
              <DateField
                name="nationalIdIssueDate"
                control={control}
                label="Date de délivrance (AAAA/MM/JJ):"
                className="w-full"
              />
              <DateField
                name="nationalIdExpiryDate"
                control={control}
                label="Date d'expiration (AAAA/MM/JJ):"
                className="w-full"
              />
            </div>
          </div>

          {/* Détails de scolarité/emploi */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Détails de scolarité/emploi
            </h3>
            <div className="grid gap-4">
              <div>
                <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Renseignements sur les études
                </h4>
                <div className="grid gap-4 @3xl:grid-cols-2">
                  <Input
                    label="Niveau de scolarité le plus élevé:"
                    {...register('highestEducationLevel')}
                    className="w-full"
                  />
                  <Input
                    label="Nombre d'années d'études au total:"
                    type="number"
                    {...register('totalYearsOfStudy')}
                    className="w-full"
                  />
                </div>
              </div>
              <div>
                <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Renseignements sur la profession
                </h4>
                <div className="grid gap-4 @3xl:grid-cols-2">
                  <Input
                    label="Emploi actuel:"
                    {...register('currentEmployment')}
                    className="w-full"
                  />
                  <Input
                    label="Emploi prévu:"
                    {...register('plannedEmployment')}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
