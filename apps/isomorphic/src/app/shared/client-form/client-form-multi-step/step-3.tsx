'use client';

import { useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import FormSummary from '@/app/shared/client-form/client-form-multi-step/form-summary';
import { formDataAtom, useStepper } from '@/app/shared/client-form/client-form-multi-step';
import { questionnaireLocaleAtom } from '@/app/shared/questionnaire-locale';
import { STEP3_T } from '@/app/shared/client-form/client-form-translations';
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
  const [locale] = useAtom(questionnaireLocaleAtom);
  const t = STEP3_T[locale] || STEP3_T.fr;

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
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {t.passport}
            </h3>
            <div className="grid gap-4 @3xl:grid-cols-2">
              <Input
                label={t.passportNumber}
                {...register('passportNumber')}
                className="w-full"
              />
              <Controller
                name="passportIssueCountry"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <CountrySelect
                    label={t.issueCountry}
                    value={value}
                    onChange={onChange}
                  />
                )}
              />
              <DateField
                name="passportIssueDate"
                control={control}
                label={t.issueDate}
                className="w-full"
              />
              <DateField
                name="passportExpiryDate"
                control={control}
                label={t.expiryDate}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {t.nationalId}
            </h3>
            <div className="grid gap-4 @3xl:grid-cols-2">
              <Input
                label={t.nationalIdNumber}
                {...register('nationalIdNumber')}
                className="w-full"
              />
              <Controller
                name="nationalIdIssueCountry"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <CountrySelect
                    label={t.nationalIdCountry}
                    value={value}
                    onChange={onChange}
                  />
                )}
              />
              <DateField
                name="nationalIdIssueDate"
                control={control}
                label={t.issueDate}
                className="w-full"
              />
              <DateField
                name="nationalIdExpiryDate"
                control={control}
                label={t.expiryDate}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {t.educationEmployment}
            </h3>
            <div className="grid gap-4">
              <div>
                <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t.educationInfo}
                </h4>
                <div className="grid gap-4 @3xl:grid-cols-2">
                  <Input
                    label={t.highestLevel}
                    {...register('highestEducationLevel')}
                    className="w-full"
                  />
                  <Input
                    label={t.totalYears}
                    type="number"
                    {...register('totalYearsOfStudy')}
                    className="w-full"
                  />
                </div>
              </div>
              <div>
                <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t.employmentInfo}
                </h4>
                <div className="grid gap-4 @3xl:grid-cols-2">
                  <Input
                    label={t.current}
                    {...register('currentEmployment')}
                    className="w-full"
                  />
                  <Input
                    label={t.planned}
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
