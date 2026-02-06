'use client';

import { useEffect, useState, useRef } from 'react';
import { useAtom } from 'jotai';
import { toast } from 'react-hot-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import FormSummary from '@/app/shared/client-form/client-form-multi-step/form-summary';
import { formDataAtom, useStepper } from '@/app/shared/client-form/client-form-multi-step';
import { Input, Select, RadioGroup, AdvancedRadio } from 'rizzui';
import {
  clientFormStep1Schema,
  ClientFormStep1Input,
} from '@/validators/client-form.schema';
import CountrySelect from '@/app/shared/client-form/country-select';
import DateField from '@/app/shared/client-form/date-field';
import { PiX } from 'react-icons/pi';

const languageOptions = [
  { label: 'Français', value: 'Français' },
  { label: 'Anglais', value: 'Anglais' },
];

const sexOptions = [
  { label: 'Masculin', value: 'male' },
  { label: 'Féminin', value: 'female' },
  { label: 'Autre', value: 'other' },
];

const eyeColorOptions = [
  { label: 'Bleu', value: 'blue' },
  { label: 'Vert', value: 'green' },
  { label: 'Marron', value: 'brown' },
  { label: 'Noir', value: 'black' },
  { label: 'Gris', value: 'gray' },
  { label: 'Noisette', value: 'hazel' },
];

export default function StepOne() {
  const { step, gotoNextStep } = useStepper();
  const [formData, setFormData] = useAtom(formDataAtom);
  const [isAlertVisible, setIsAlertVisible] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<ClientFormStep1Input>({
    resolver: zodResolver(clientFormStep1Schema),
    defaultValues: {
      numberOfFamilyMembers: formData?.numberOfFamilyMembers || '',
      preferredLanguageCorrespondence: formData?.preferredLanguageCorrespondence || 'Français',
      preferredLanguageInterview: formData?.preferredLanguageInterview || 'Français',
      hasCSQ: formData?.hasCSQ || 'no',
      csqNumber: formData?.csqNumber || '',
      csqApplicationDate: formData?.csqApplicationDate || '',
      lastName: formData?.lastName || '',
      firstName: formData?.firstName || '',
      uci: formData?.uci || '',
      sex: formData?.sex || '',
      eyeColor: formData?.eyeColor || '',
      height: formData?.height || '',
      dateOfBirth: formData?.dateOfBirth || '',
      placeOfBirth: formData?.placeOfBirth || '',
      countryOfBirth: formData?.countryOfBirth || '',
    },
  });

  const hasCSQ = watch('hasCSQ');

  // Mettre à jour le formulaire quand formData change (chargement depuis la DB)
  // Utiliser un ref pour éviter les boucles infinies
  const isInitialLoad = useRef(true);
  useEffect(() => {
    if (isInitialLoad.current && formData != null) {
      reset({
        numberOfFamilyMembers: formData?.numberOfFamilyMembers || '',
        preferredLanguageCorrespondence: formData?.preferredLanguageCorrespondence || 'Français',
        preferredLanguageInterview: formData?.preferredLanguageInterview || 'Français',
        hasCSQ: formData?.hasCSQ || 'no',
        csqNumber: formData?.csqNumber || '',
        csqApplicationDate: formData?.csqApplicationDate || '',
        lastName: formData?.lastName || '',
        firstName: formData?.firstName || '',
        uci: formData?.uci || '',
        sex: formData?.sex || '',
        eyeColor: formData?.eyeColor || '',
        height: formData?.height || '',
        dateOfBirth: formData?.dateOfBirth || '',
        placeOfBirth: formData?.placeOfBirth || '',
        countryOfBirth: formData?.countryOfBirth || '',
      });
      isInitialLoad.current = false;
    }
  }, [formData, reset]);

  useEffect(() => {
    if (errors.lastName) toast.error(errors.lastName.message as string);
    if (errors.sex) toast.error(errors.sex.message as string);
    if (errors.eyeColor) toast.error(errors.eyeColor.message as string);
    if (errors.height) toast.error(errors.height.message as string);
    if (errors.dateOfBirth) toast.error(errors.dateOfBirth.message as string);
    if (errors.placeOfBirth) toast.error(errors.placeOfBirth.message as string);
    if (errors.countryOfBirth) toast.error(errors.countryOfBirth.message as string);
  }, [errors]);

  const onSubmit: SubmitHandler<ClientFormStep1Input> = (data) => {
    // Mettre à jour l'atom avec les données du formulaire
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
        {/* Alerte informative - juste au-dessus de "Étape 1 sur 10" */}
        {isAlertVisible && (
          <div className="mb-6">
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 dark:bg-blue-900/20 dark:border-blue-800 relative">
              <button
                onClick={() => setIsAlertVisible(false)}
                className="absolute top-2 right-2 text-blue-400 hover:text-blue-600 transition-colors"
                aria-label="Fermer l'alerte"
              >
                <PiX className="h-5 w-5" />
              </button>
              <div className="flex items-start pr-6">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-bold text-blue-800 dark:text-blue-200">
                    Nous vous demandons de remplir ce questionnaire y compris les informations figurant sur votre passeport
                    et/ou votre document national d'identité, si vous en possédez un. Gardez-les à portée de main pendant que
                    vous remplissez ce formulaire. Si vous avez des personnes à charge (accompagnant ou non), ces informations
                    leur seront également demandées.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <FormSummary
          descriptionClassName="@7xl:me-10"
          title="Détails de la demande et Informations personnelles"
          description="Veuillez remplir les détails de votre demande et vos informations personnelles de base"
        />
      </div>

      <form
        id={`rhf-${step.toString()}`}
        onSubmit={handleSubmit(onSubmit)}
        className="col-span-full rounded-lg bg-white p-5 @4xl:col-span-7 @4xl:p-7 dark:bg-gray-0"
      >
        <div className="grid gap-6">
          {/* Détails de la demande */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Détails de la demande
            </h3>
            <div className="grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Combien de membres de votre famille, dont vous-même, seront inclus dans cette demande?
                </label>
                <Controller
                  name="numberOfFamilyMembers"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <Select
                      placeholder="Sélectionner"
                      options={Array.from({ length: 10 }, (_, i) => ({
                        label: `${i + 1} membre${i > 0 ? 's' : ''}`,
                        value: `${i + 1}`,
                      }))}
                      value={value}
                      onChange={(selected: string | { value: string } | null) => onChange(typeof selected === 'string' ? selected : selected?.value || '')}
                      getOptionValue={(option) => option.value}
                      displayValue={(selected) => {
                        const option = Array.from({ length: 10 }, (_, i) => ({
                          label: `${i + 1} membre${i > 0 ? 's' : ''}`,
                          value: `${i + 1}`,
                        })).find((opt) => opt.value === selected);
                        return option?.label || '';
                      }}
                      error={errors.numberOfFamilyMembers?.message}
                    />
                  )}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Langue de préférence pour:
                </label>
                <div className="grid gap-4 @3xl:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-gray-600">La correspondance:</label>
                    <Controller
                      name="preferredLanguageCorrespondence"
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <Select
                          placeholder="Sélectionner"
                          options={languageOptions}
                          value={value}
                          onChange={(selected: string | { value: string } | null) => onChange(typeof selected === 'string' ? selected : selected?.value || '')}
                          getOptionValue={(option) => option.value}
                          displayValue={(selected) => {
                            const option = languageOptions.find((opt) => opt.value === selected);
                            return option?.label || '';
                          }}
                          error={errors.preferredLanguageCorrespondence?.message}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-600">L'entrevue:</label>
                    <Controller
                      name="preferredLanguageInterview"
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <Select
                          placeholder="Sélectionner"
                          options={languageOptions}
                          value={value}
                          onChange={(selected: string | { value: string } | null) => onChange(typeof selected === 'string' ? selected : selected?.value || '')}
                          getOptionValue={(option) => option.value}
                          displayValue={(selected) => {
                            const option = languageOptions.find((opt) => opt.value === selected);
                            return option?.label || '';
                          }}
                          error={errors.preferredLanguageInterview?.message}
                        />
                      )}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Avez-vous reçu votre Certificat de sélection du Québec (CSQ)?
                </label>
                <Controller
                  name="hasCSQ"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <RadioGroup value={value || ''} setValue={onChange} className="flex gap-6">
                      <AdvancedRadio
                        value="yes"
                        className="[&_.rizzui-advanced-radio]:px-4 [&_.rizzui-advanced-radio]:py-2"
                        inputClassName="[&~span]:border-0 [&~span]:ring-1 [&~span]:ring-gray-200 [&~span:hover]:ring-primary [&:checked~span:hover]:ring-primary [&:checked~span]:border-1 [&:checked~.rizzui-advanced-radio]:ring-2"
                      >
                        Oui
                      </AdvancedRadio>
                      <AdvancedRadio
                        value="no"
                        className="[&_.rizzui-advanced-radio]:px-4 [&_.rizzui-advanced-radio]:py-2"
                        inputClassName="[&~span]:border-0 [&~span]:ring-1 [&~span]:ring-gray-200 [&~span:hover]:ring-primary [&:checked~span:hover]:ring-primary [&:checked~span]:border-1 [&:checked~.rizzui-advanced-radio]:ring-2"
                      >
                        Non
                      </AdvancedRadio>
                    </RadioGroup>
                  )}
                />
                {hasCSQ === 'yes' && (
                  <Input
                    label="Si oui, entrez le numéro. Numéro CSQ:"
                    {...register('csqNumber')}
                    className="mt-4"
                  />
                )}
                {hasCSQ === 'no' && (
                  <DateField
                    name="csqApplicationDate"
                    control={control}
                    label="Si non, quand avez-vous demandé votre CSQ? Date (AAAA/MM/JJ):"
                    className="mt-4"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Renseignements personnels */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Renseignements personnels
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              Entrez votre nom de famille complet, tel qu'il figure dans votre passeport ou titre de voyage. Si votre document ne comporte qu'un seul nom, inscrivez-le dans le champ du nom de famille et laissez le champ du prénom vide.
            </p>
            <div className="grid gap-4 @3xl:grid-cols-2">
              <Input
                label="Nom(s) de famille:"
                {...register('lastName')}
                error={errors.lastName?.message}
                className="w-full"
              />
              <Input
                label="Prénom(s):"
                {...register('firstName')}
                className="w-full"
              />
              <Input
                label="IUC (si vous avez un identificateur unique de client):"
                {...register('uci')}
                className="w-full"
              />
            </div>
          </div>

          {/* Caractéristiques physiques */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Caractéristiques physiques
            </h3>
            <div className="grid gap-4 @3xl:grid-cols-3">
              <Controller
                name="sex"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Select
                    label="Sexe:"
                    placeholder="Sélectionner"
                    options={sexOptions}
                    value={value}
                    onChange={(selected: string | { value: string } | null) => onChange(typeof selected === 'string' ? selected : selected?.value || '')}
                    getOptionValue={(option) => option.value}
                    displayValue={(selected) => {
                      const option = sexOptions.find((opt) => opt.value === selected);
                      return option?.label || '';
                    }}
                    error={errors.sex?.message}
                  />
                )}
              />
              <Controller
                name="eyeColor"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Select
                    label="Couleur des yeux:"
                    placeholder="Sélectionner"
                    options={eyeColorOptions}
                    value={value}
                    onChange={(selected: string | { value: string } | null) => onChange(typeof selected === 'string' ? selected : selected?.value || '')}
                    getOptionValue={(option) => option.value}
                    displayValue={(selected) => {
                      const option = eyeColorOptions.find((opt) => opt.value === selected);
                      return option?.label || '';
                    }}
                    error={errors.eyeColor?.message}
                  />
                )}
              />
              <Input
                label="Taille (cm):"
                type="number"
                {...register('height')}
                error={errors.height?.message}
              />
            </div>
          </div>

          {/* Renseignements sur la naissance */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Renseignements sur la naissance
            </h3>
            <div className="grid gap-4 @3xl:grid-cols-3">
              <DateField
                name="dateOfBirth"
                control={control}
                label="Date de naissance (AAAAMM/JJ):"
                error={errors.dateOfBirth}
              />
              <Input
                label="Lieu de naissance:"
                {...register('placeOfBirth')}
                error={errors.placeOfBirth?.message}
              />
              <Controller
                name="countryOfBirth"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <CountrySelect
                    label="Pays:"
                    value={value}
                    onChange={onChange}
                    error={errors.countryOfBirth?.message}
                  />
                )}
              />
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
