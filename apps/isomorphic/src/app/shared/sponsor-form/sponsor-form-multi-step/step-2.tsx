'use client';

import { useEffect, useRef, useState } from 'react';
import { useAtom } from 'jotai';
import { toast } from 'react-hot-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import FormSummary from '@/app/shared/sponsor-form/sponsor-form-multi-step/form-summary';
import { sponsorFormDataAtom, useSponsorStepper, useSponsorFormLoad } from '@/app/shared/sponsor-form/sponsor-form-multi-step';
import { Input, Textarea, RadioGroup, AdvancedRadio, Button } from 'rizzui';
import {
  sponsorFormStep2Schema,
  SponsorFormStep2Input,
} from '@/validators/sponsor-form.schema';
import DynamicTable from '@/app/shared/client-form/client-form-multi-step/dynamic-table';
import DateField from '@/app/shared/client-form/date-field';

export default function StepTwo() {
  const { step, gotoNextStep } = useSponsorStepper();
  const [formData, setFormData] = useAtom(sponsorFormDataAtom);
  const { dataLoadedKey } = useSponsorFormLoad();
  const [isAlertVisible, setIsAlertVisible] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<SponsorFormStep2Input>({
    resolver: zodResolver(sponsorFormStep2Schema),
    defaultValues: {
      lastName: formData.lastName || '',
      firstName: formData.firstName || '',
      phoneNumber: formData.phoneNumber || '',
      dateAndPlaceOfBirth: formData.dateAndPlaceOfBirth || '',
      nationality: formData.nationality || '',
      whereLivedLast5Years: formData.whereLivedLast5Years || '',
      maritalStatus: formData.maritalStatus || '',
      marriageDate: formData.marriageDate || '',
      spouseName: formData.spouseName || '',
      hasBeenMarried: formData.hasBeenMarried || 'no',
      exSpouseName: formData.exSpouseName || '',
      exSpouseDateOfBirth: formData.exSpouseDateOfBirth || '',
      relationshipStartDate: formData.relationshipStartDate || '',
      relationshipEndDate: formData.relationshipEndDate || '',
      employmentHistory: formData.employmentHistory || [],
    },
  });

  const hasBeenMarried = watch('hasBeenMarried');
  const isInitialLoad = useRef(true);

  // Mettre à jour le formulaire quand formData change
  useEffect(() => {
    if (isInitialLoad.current) {
      reset({
        lastName: formData.lastName || '',
        firstName: formData.firstName || '',
        phoneNumber: formData.phoneNumber || '',
        dateAndPlaceOfBirth: formData.dateAndPlaceOfBirth || '',
        nationality: formData.nationality || '',
        whereLivedLast5Years: formData.whereLivedLast5Years || '',
        maritalStatus: formData.maritalStatus || '',
        marriageDate: formData.marriageDate || '',
        spouseName: formData.spouseName || '',
        hasBeenMarried: formData.hasBeenMarried || 'no',
        exSpouseName: formData.exSpouseName || '',
        exSpouseDateOfBirth: formData.exSpouseDateOfBirth || '',
        relationshipStartDate: formData.relationshipStartDate || '',
        relationshipEndDate: formData.relationshipEndDate || '',
        employmentHistory: formData.employmentHistory || [],
      });
      isInitialLoad.current = false;
    }
  }, [formData, reset]);

  // Réappliquer les données chargées quand le parent a fini de charger (retour sur la page)
  useEffect(() => {
    if (dataLoadedKey != null) {
      reset({
        lastName: formData.lastName || '',
        firstName: formData.firstName || '',
        phoneNumber: formData.phoneNumber || '',
        dateAndPlaceOfBirth: formData.dateAndPlaceOfBirth || '',
        nationality: formData.nationality || '',
        whereLivedLast5Years: formData.whereLivedLast5Years || '',
        maritalStatus: formData.maritalStatus || '',
        marriageDate: formData.marriageDate || '',
        spouseName: formData.spouseName || '',
        hasBeenMarried: formData.hasBeenMarried || 'no',
        exSpouseName: formData.exSpouseName || '',
        exSpouseDateOfBirth: formData.exSpouseDateOfBirth || '',
        relationshipStartDate: formData.relationshipStartDate || '',
        relationshipEndDate: formData.relationshipEndDate || '',
        employmentHistory: formData.employmentHistory || [],
      });
    }
  }, [dataLoadedKey]);

  // Synchroniser les données du formulaire avec l'atom
  const formValues = watch();
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (!isInitialLoad.current) {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      
      syncTimeoutRef.current = setTimeout(() => {
        setFormData((prev) => ({
          ...prev,
          ...formValues,
        }));
      }, 500);
    }
    
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [formValues, setFormData]);

  useEffect(() => {
    if (errors.lastName) toast.error(errors.lastName.message as string);
    if (errors.firstName) toast.error(errors.firstName.message as string);
  }, [errors]);

  const onSubmit: SubmitHandler<SponsorFormStep2Input> = (data) => {
    setFormData((prev) => ({
      ...prev,
      ...data,
    }));
    gotoNextStep();
  };

  // Gestion de l'historique professionnel
  const handleAddEmployment = () => {
    const currentHistory = watch('employmentHistory') || [];
    setFormData((prev) => ({
      ...prev,
      employmentHistory: [...(currentHistory || []), {
        fromDate: '',
        toDate: '',
        employerName: '',
        employerAddress: '',
        employerPhone: '',
        profession: '',
        monthlySalary: '',
      }],
    }));
    reset({
      ...watch(),
      employmentHistory: [...(currentHistory || []), {
        fromDate: '',
        toDate: '',
        employerName: '',
        employerAddress: '',
        employerPhone: '',
        profession: '',
        monthlySalary: '',
      }],
    });
  };

  const handleRemoveEmployment = (index: number) => {
    const currentHistory = watch('employmentHistory') || [];
    const updated = currentHistory.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      employmentHistory: updated,
    }));
    reset({
      ...watch(),
      employmentHistory: updated,
    });
  };

  const handleUpdateEmployment = (index: number, field: string, value: any) => {
    const currentHistory = watch('employmentHistory') || [];
    const updated = [...currentHistory];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev) => ({
      ...prev,
      employmentHistory: updated,
    }));
    reset({
      ...watch(),
      employmentHistory: updated,
    });
  };

  return (
    <>
      <div className="col-span-full flex flex-col justify-center @4xl:col-span-4">
        {isAlertVisible && (
          <div className="mb-6">
            <div className="relative rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-bold text-blue-800 dark:text-blue-200">
                    Renseignements concernant la relation - À remplir par le répondant et le demandeur principal
                  </p>
                </div>
              </div>
              <Button
                variant="text"
                onClick={() => setIsAlertVisible(false)}
                className="absolute right-2 top-2 p-1 text-blue-600 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-800"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          </div>
        )}

        <FormSummary
          descriptionClassName="@7xl:me-10"
          title="Renseignements sur le répondant"
          description="Veuillez remplir toutes les informations personnelles et professionnelles"
        />
      </div>

      <form
        id={`rhf-${step.toString()}`}
        onSubmit={handleSubmit(onSubmit)}
        className="col-span-full rounded-lg bg-white p-5 @4xl:col-span-8 @4xl:p-7 dark:bg-gray-0"
      >
        <div className="grid gap-6">
          {/* Section: DONNÉES PERSONNELLES */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              DONNÉES PERSONNELLES
            </h3>
            <div className="grid gap-4">
              <Input
                label="1. Nom"
                placeholder="Entrez votre nom de famille"
                {...register('lastName')}
                error={errors.lastName?.message}
              />
              <Input
                label="2. Prénoms"
                placeholder="Entrez vos prénoms"
                {...register('firstName')}
                error={errors.firstName?.message}
              />
              <Input
                label="3. Numéro de téléphone"
                placeholder="Ex: +1 514 123 4567"
                {...register('phoneNumber')}
                error={errors.phoneNumber?.message}
              />
              <Textarea
                label="4. Date et lieu de naissance"
                placeholder="Ex: 15 janvier 1985, Montréal, Canada"
                rows={2}
                {...register('dateAndPlaceOfBirth')}
                error={errors.dateAndPlaceOfBirth?.message}
              />
              <Input
                label="5. Nationalité"
                placeholder="Ex: Canadienne"
                {...register('nationality')}
                error={errors.nationality?.message}
              />
              <Textarea
                label="6. Où avez-vous vécu les 5 dernières années ?"
                placeholder="Listez tous les endroits où vous avez résidé"
                rows={3}
                {...register('whereLivedLast5Years')}
                error={errors.whereLivedLast5Years?.message}
              />
              <Input
                label="7. État matrimonial"
                placeholder="Ex: Marié(e), Célibataire, etc."
                {...register('maritalStatus')}
                error={errors.maritalStatus?.message}
              />
              <Textarea
                label="8. Date du mariage (s'il y a lieu, nom et prénom de l'époux)"
                placeholder="Ex: 10 juin 2010, Jean Dupont"
                rows={2}
                {...register('spouseName')}
                error={errors.spouseName?.message}
              />
              
              {/* Question 9: Avez-vous déjà été marié */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  9. Avez-vous déjà été marié dans le passé ?
                </label>
                <Controller
                  name="hasBeenMarried"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <RadioGroup
                      value={value || 'no'}
                      setValue={onChange}
                      className="flex items-center gap-4"
                    >
                      <AdvancedRadio
                        value="yes"
                        className="flex-1 cursor-pointer rounded-md border border-gray-200 px-5 py-3 text-center hover:bg-gray-100 peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary"
                      >
                        Oui
                      </AdvancedRadio>
                      <AdvancedRadio
                        value="no"
                        className="flex-1 cursor-pointer rounded-md border border-gray-200 px-5 py-3 text-center hover:bg-gray-100 peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary"
                      >
                        Non
                      </AdvancedRadio>
                    </RadioGroup>
                  )}
                />
                {hasBeenMarried === 'yes' && (
                  <div className="mt-4 grid gap-4 @3xl:grid-cols-2">
                    <Input
                      label="Nom et prénoms"
                      placeholder="Nom et prénoms de l'ex-époux"
                      {...register('exSpouseName')}
                      error={errors.exSpouseName?.message}
                    />
                    <DateField
                      name="exSpouseDateOfBirth"
                      control={control}
                      label="Date de naissance (JJ/MM/AAAA)"
                      error={errors.exSpouseDateOfBirth}
                    />
                    <DateField
                      name="relationshipStartDate"
                      control={control}
                      label="Début de relation (JJ/MM/AAAA)"
                      error={errors.relationshipStartDate}
                    />
                    <DateField
                      name="relationshipEndDate"
                      control={control}
                      label="Fin de relation (JJ/MM/AAAA)"
                      error={errors.relationshipEndDate}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section: ANTECEDANT PROFESSIONNELS */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              ANTECEDANT PROFESSIONNELS
            </h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              10. En commençant par l'emploi actuel, remplir le tableau sur les 5 dernières années
            </p>
            <DynamicTable
              title="Historique professionnel"
              columns={[
                { key: 'fromDate', label: 'De (AAAA-MM)', type: 'text', placeholder: 'YYYY-MM' },
                { key: 'toDate', label: 'À (AAAA-MM)', type: 'text', placeholder: 'YYYY-MM' },
                { key: 'employerName', label: 'Inscrivez le nom, l\'adresse complète et le numéro de téléphone de chaque employeur', type: 'text' },
                { key: 'profession', label: 'Profession/Poste', type: 'text' },
                { key: 'monthlySalary', label: 'Salaire/Revenu Mensuel brut', type: 'text' },
              ]}
              data={watch('employmentHistory') || []}
              onAdd={handleAddEmployment}
              onRemove={handleRemoveEmployment}
              onUpdate={handleUpdateEmployment}
              maxRows={5}
            />
          </div>
        </div>
      </form>
    </>
  );
}

