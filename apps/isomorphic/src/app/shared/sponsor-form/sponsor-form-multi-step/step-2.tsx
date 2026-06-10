'use client';

import { useEffect, useRef, useState } from 'react';
import { useAtom } from 'jotai';
import { toast } from 'react-hot-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import FormSummary from '@/app/shared/sponsor-form/sponsor-form-multi-step/form-summary';
import { sponsorFormDataAtom, useSponsorStepper, useSponsorFormLoad } from '@/app/shared/sponsor-form/sponsor-form-multi-step';
import { questionnaireLocaleAtom } from '@/app/shared/questionnaire-locale';
import { SPONSOR_STEP2_T } from '@/app/shared/sponsor-form/sponsor-form-translations';
import { Input, Textarea, RadioGroup, AdvancedRadio, Button } from 'rizzui';
import {
  sponsorFormStep2Schema,
  SponsorFormStep2Input,
} from '@/validators/sponsor-form.schema';
import DynamicTable from '@/app/shared/client-form/client-form-multi-step/dynamic-table';
import DateField from '@/app/shared/client-form/date-field';

const STEP2_LABELS = {
  fr: {
    alert: 'Renseignements concernant la relation - À remplir par le répondant et le demandeur principal',
    personalSection: 'DONNÉES PERSONNELLES',
    q1Name: '1. Nom',
    q1Placeholder: 'Entrez votre nom de famille',
    q2FirstName: '2. Prénoms',
    q2Placeholder: 'Entrez vos prénoms',
    q3Phone: '3. Numéro de téléphone',
    q3Placeholder: 'Ex: +1 514 123 4567',
    q4DateOfBirth: '4. Date et lieu de naissance',
    q4Placeholder: 'Ex: 15 janvier 1985, Montréal, Canada',
    q5Nationality: '5. Nationalité',
    q5Placeholder: 'Ex: Canadienne',
    q6WhereLived: '6. Où avez-vous vécu les 5 dernières années ?',
    q6Placeholder: 'Listez tous les endroits où vous avez résidé',
    q7MaritalStatus: '7. État matrimonial',
    q7Placeholder: 'Ex: Marié(e), Célibataire, etc.',
    q8MarriageDate: "8. Date du mariage (s'il y a lieu, nom et prénom de l'époux)",
    q8Placeholder: 'Ex: 10 juin 2010, Jean Dupont',
    q9HasBeenMarried: '9. Avez-vous déjà été marié dans le passé ?',
    yes: 'Oui',
    no: 'Non',
    exSpouseName: 'Nom et prénoms',
    exSpousePlaceholder: "Nom et prénoms de l'ex-époux",
    exSpouseDob: 'Date de naissance (JJ/MM/AAAA)',
    relStart: 'Début de relation (JJ/MM/AAAA)',
    relEnd: 'Fin de relation (JJ/MM/AAAA)',
    profSection: 'ANTÉCÉDENTS PROFESSIONNELS',
    profIntro: "10. En commençant par l'emploi actuel, remplir le tableau sur les 5 dernières années",
    profHistory: 'Historique professionnel',
    eFromDate: 'De (AAAA-MM)',
    eToDate: 'À (AAAA-MM)',
    eEmployer: "Inscrivez le nom, l'adresse complète et le numéro de téléphone de chaque employeur",
    eProfession: 'Profession/Poste',
    eSalary: 'Salaire/Revenu mensuel brut',
  },
  en: {
    alert: 'Relationship information - To be completed by the sponsor and principal applicant',
    personalSection: 'PERSONAL DATA',
    q1Name: '1. Surname',
    q1Placeholder: 'Enter your surname',
    q2FirstName: '2. Given names',
    q2Placeholder: 'Enter your given names',
    q3Phone: '3. Phone number',
    q3Placeholder: 'E.g. +1 514 123 4567',
    q4DateOfBirth: '4. Date and place of birth',
    q4Placeholder: 'E.g. January 15, 1985, Montreal, Canada',
    q5Nationality: '5. Nationality',
    q5Placeholder: 'E.g. Canadian',
    q6WhereLived: '6. Where have you lived in the last 5 years?',
    q6Placeholder: 'List all places where you have lived',
    q7MaritalStatus: '7. Marital status',
    q7Placeholder: 'E.g. Married, Single, etc.',
    q8MarriageDate: '8. Date of marriage (if applicable, name of spouse)',
    q8Placeholder: 'E.g. June 10, 2010, John Doe',
    q9HasBeenMarried: '9. Have you ever been married in the past?',
    yes: 'Yes',
    no: 'No',
    exSpouseName: 'Name and given names',
    exSpousePlaceholder: 'Name and given names of ex-spouse',
    exSpouseDob: 'Date of birth (DD/MM/YYYY)',
    relStart: 'Relationship start (DD/MM/YYYY)',
    relEnd: 'Relationship end (DD/MM/YYYY)',
    profSection: 'PROFESSIONAL BACKGROUND',
    profIntro: '10. Starting with current employment, fill in the table for the last 5 years',
    profHistory: 'Employment history',
    eFromDate: 'From (YYYY-MM)',
    eToDate: 'To (YYYY-MM)',
    eEmployer: 'Enter the name, full address and phone number of each employer',
    eProfession: 'Profession/Position',
    eSalary: 'Gross monthly salary/income',
  },
  es: {
    alert: 'Información sobre la relación - Para completar por el patrocinador y el solicitante principal',
    personalSection: 'DATOS PERSONALES',
    q1Name: '1. Apellido',
    q1Placeholder: 'Ingrese su apellido',
    q2FirstName: '2. Nombres',
    q2Placeholder: 'Ingrese sus nombres',
    q3Phone: '3. Número de teléfono',
    q3Placeholder: 'Ej: +1 514 123 4567',
    q4DateOfBirth: '4. Fecha y lugar de nacimiento',
    q4Placeholder: 'Ej: 15 de enero de 1985, Montreal, Canadá',
    q5Nationality: '5. Nacionalidad',
    q5Placeholder: 'Ej: Canadiense',
    q6WhereLived: '6. ¿Dónde ha vivido los últimos 5 años?',
    q6Placeholder: 'Enumere todos los lugares donde ha residido',
    q7MaritalStatus: '7. Estado civil',
    q7Placeholder: 'Ej: Casado(a), Soltero(a), etc.',
    q8MarriageDate: '8. Fecha del matrimonio (si aplica, nombre y apellido del cónyuge)',
    q8Placeholder: 'Ej: 10 de junio de 2010, Juan Pérez',
    q9HasBeenMarried: '9. ¿Ha estado casado anteriormente?',
    yes: 'Sí',
    no: 'No',
    exSpouseName: 'Nombre y apellidos',
    exSpousePlaceholder: 'Nombre y apellidos del ex cónyuge',
    exSpouseDob: 'Fecha de nacimiento (DD/MM/AAAA)',
    relStart: 'Inicio de la relación (DD/MM/AAAA)',
    relEnd: 'Fin de la relación (DD/MM/AAAA)',
    profSection: 'ANTECEDENTES PROFESIONALES',
    profIntro: '10. Empezando por el empleo actual, complete la tabla de los últimos 5 años',
    profHistory: 'Historial profesional',
    eFromDate: 'Desde (AAAA-MM)',
    eToDate: 'Hasta (AAAA-MM)',
    eEmployer: 'Indique el nombre, dirección completa y número de teléfono de cada empleador',
    eProfession: 'Profesión/Puesto',
    eSalary: 'Salario/Ingreso mensual bruto',
  },
} as const;

export default function StepTwo() {
  const { step, gotoNextStep } = useSponsorStepper();
  const [formData, setFormData] = useAtom(sponsorFormDataAtom);
  const [locale] = useAtom(questionnaireLocaleAtom);
  const t = SPONSOR_STEP2_T[locale] || SPONSOR_STEP2_T.fr;
  const l = STEP2_LABELS[locale] || STEP2_LABELS.fr;
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
                    {l.alert}
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
          title={t.summaryTitle}
          description={t.summaryDesc}
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
              {l.personalSection}
            </h3>
            <div className="grid gap-4">
              <Input
                label={l.q1Name}
                placeholder={l.q1Placeholder}
                {...register('lastName')}
                error={errors.lastName?.message}
              />
              <Input
                label={l.q2FirstName}
                placeholder={l.q2Placeholder}
                {...register('firstName')}
                error={errors.firstName?.message}
              />
              <Input
                label={l.q3Phone}
                placeholder={l.q3Placeholder}
                {...register('phoneNumber')}
                error={errors.phoneNumber?.message}
              />
              <Textarea
                label={l.q4DateOfBirth}
                placeholder={l.q4Placeholder}
                rows={2}
                {...register('dateAndPlaceOfBirth')}
                error={errors.dateAndPlaceOfBirth?.message}
              />
              <Input
                label={l.q5Nationality}
                placeholder={l.q5Placeholder}
                {...register('nationality')}
                error={errors.nationality?.message}
              />
              <Textarea
                label={l.q6WhereLived}
                placeholder={l.q6Placeholder}
                rows={3}
                {...register('whereLivedLast5Years')}
                error={errors.whereLivedLast5Years?.message}
              />
              <Input
                label={l.q7MaritalStatus}
                placeholder={l.q7Placeholder}
                {...register('maritalStatus')}
                error={errors.maritalStatus?.message}
              />
              <Textarea
                label={l.q8MarriageDate}
                placeholder={l.q8Placeholder}
                rows={2}
                {...register('spouseName')}
                error={errors.spouseName?.message}
              />

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {l.q9HasBeenMarried}
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
                        {l.yes}
                      </AdvancedRadio>
                      <AdvancedRadio
                        value="no"
                        className="flex-1 cursor-pointer rounded-md border border-gray-200 px-5 py-3 text-center hover:bg-gray-100 peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary"
                      >
                        {l.no}
                      </AdvancedRadio>
                    </RadioGroup>
                  )}
                />
                {hasBeenMarried === 'yes' && (
                  <div className="mt-4 grid gap-4 @3xl:grid-cols-2">
                    <Input
                      label={l.exSpouseName}
                      placeholder={l.exSpousePlaceholder}
                      {...register('exSpouseName')}
                      error={errors.exSpouseName?.message}
                    />
                    <DateField
                      name="exSpouseDateOfBirth"
                      control={control}
                      label={l.exSpouseDob}
                      error={errors.exSpouseDateOfBirth}
                    />
                    <DateField
                      name="relationshipStartDate"
                      control={control}
                      label={l.relStart}
                      error={errors.relationshipStartDate}
                    />
                    <DateField
                      name="relationshipEndDate"
                      control={control}
                      label={l.relEnd}
                      error={errors.relationshipEndDate}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {l.profSection}
            </h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              {l.profIntro}
            </p>
            <DynamicTable
              title={l.profHistory}
              columns={[
                { key: 'fromDate', label: l.eFromDate, type: 'text', placeholder: 'YYYY-MM' },
                { key: 'toDate', label: l.eToDate, type: 'text', placeholder: 'YYYY-MM' },
                { key: 'employerName', label: l.eEmployer, type: 'text' },
                { key: 'profession', label: l.eProfession, type: 'text' },
                { key: 'monthlySalary', label: l.eSalary, type: 'text' },
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

