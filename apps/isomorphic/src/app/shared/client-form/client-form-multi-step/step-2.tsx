'use client';

import { useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import { toast } from 'react-hot-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import FormSummary from '@/app/shared/client-form/client-form-multi-step/form-summary';
import { formDataAtom, useStepper } from '@/app/shared/client-form/client-form-multi-step';
import { Input, Select, RadioGroup, AdvancedRadio, Checkbox } from 'rizzui';
import {
  clientFormStep2Schema,
  ClientFormStep2Input,
} from '@/validators/client-form.schema';
import CountrySelect from '@/app/shared/client-form/country-select';
import DateField from '@/app/shared/client-form/date-field';

const maritalStatusOptions = [
  { label: 'Célibataire', value: 'single' },
  { label: 'Marié(e)', value: 'married' },
  { label: 'Divorcé(e)', value: 'divorced' },
  { label: 'Veuf(ve)', value: 'widowed' },
  { label: 'Union de fait', value: 'common-law' },
  { label: 'Séparé(e)', value: 'separated' },
];

const relationshipTypeOptions = [
  { label: 'Mariage', value: 'marriage' },
  { label: 'Union de fait', value: 'common-law' },
];

export default function StepTwo() {
  const { step, gotoNextStep } = useStepper();
  const [formData, setFormData] = useAtom(formDataAtom);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<ClientFormStep2Input>({
    resolver: zodResolver(clientFormStep2Schema),
    defaultValues: {
      citizenship1: formData.citizenship1 || '',
      citizenship2: formData.citizenship2 || '',
      lastEntryDate: formData.lastEntryDate || '',
      lastEntryPlace: formData.lastEntryPlace || '',
      hasPreviousResidence: formData.hasPreviousResidence || 'no',
      previousResidenceDetails: formData.previousResidenceDetails || '',
      currentMaritalStatus: formData.currentMaritalStatus || '',
      marriageDate: formData.marriageDate || '',
      spouseLastName: formData.spouseLastName || '',
      spouseFirstName: formData.spouseFirstName || '',
      hasPreviousSpouse: formData.hasPreviousSpouse || 'no',
      previousSpouseLastName: formData.previousSpouseLastName || '',
      previousSpouseFirstName: formData.previousSpouseFirstName || '',
      previousSpouseDateOfBirth: formData.previousSpouseDateOfBirth || '',
      previousSpouseRelationshipType: formData.previousSpouseRelationshipType || '',
      previousSpouseRelationshipStartDate: formData.previousSpouseRelationshipStartDate || '',
      previousSpouseRelationshipEndDate: formData.previousSpouseRelationshipEndDate || '',
      apartmentUnit: formData.apartmentUnit || '',
      streetNumber: formData.streetNumber || '',
      streetName: formData.streetName || '',
      city: formData.city || '',
      province: formData.province || '',
      country: formData.country || '',
      postalCode: formData.postalCode || '',
    },
  });

  const currentMaritalStatus = watch('currentMaritalStatus');
  const hasPreviousResidence = watch('hasPreviousResidence');
  const hasPreviousSpouse = watch('hasPreviousSpouse');
  const isMarriedOrCommonLaw = currentMaritalStatus === 'married' || currentMaritalStatus === 'common-law';

  // Mettre à jour le formulaire quand formData change (chargement depuis la DB)
  const isInitialLoad = useRef(true);
  useEffect(() => {
    if (isInitialLoad.current) {
      reset({
        citizenship1: formData.citizenship1 || '',
        citizenship2: formData.citizenship2 || '',
        lastEntryDate: formData.lastEntryDate || '',
        lastEntryPlace: formData.lastEntryPlace || '',
        hasPreviousResidence: formData.hasPreviousResidence || 'no',
        previousResidenceDetails: formData.previousResidenceDetails || '',
        currentMaritalStatus: formData.currentMaritalStatus || '',
        marriageDate: formData.marriageDate || '',
        spouseLastName: formData.spouseLastName || '',
        spouseFirstName: formData.spouseFirstName || '',
        hasPreviousSpouse: formData.hasPreviousSpouse || 'no',
        previousSpouseLastName: formData.previousSpouseLastName || '',
        previousSpouseFirstName: formData.previousSpouseFirstName || '',
        previousSpouseDateOfBirth: formData.previousSpouseDateOfBirth || '',
        previousSpouseRelationshipType: formData.previousSpouseRelationshipType || '',
        previousSpouseRelationshipStartDate: formData.previousSpouseRelationshipStartDate || '',
        previousSpouseRelationshipEndDate: formData.previousSpouseRelationshipEndDate || '',
        apartmentUnit: formData.apartmentUnit || '',
        streetNumber: formData.streetNumber || '',
        streetName: formData.streetName || '',
        city: formData.city || '',
        province: formData.province || '',
        country: formData.country || '',
        postalCode: formData.postalCode || '',
      });
      isInitialLoad.current = false;
    }
  }, [formData, reset]);

  useEffect(() => {
    if (errors.currentMaritalStatus) toast.error(errors.currentMaritalStatus.message as string);
    if (errors.city) toast.error(errors.city.message as string);
    if (errors.country) toast.error(errors.country.message as string);
  }, [errors]);

  const onSubmit: SubmitHandler<ClientFormStep2Input> = (data) => {
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
          title="Citoyenneté, Résidence et État matrimonial"
          description="Veuillez fournir vos informations sur la citoyenneté, la résidence et l'état matrimonial"
        />
      </div>

      <form
        id={`rhf-${step.toString()}`}
        onSubmit={handleSubmit(onSubmit)}
        className="col-span-full rounded-lg bg-white p-5 @4xl:col-span-7 @4xl:p-7 dark:bg-gray-0"
      >
        <div className="grid gap-6">
          {/* Citoyenneté(s) */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Citoyenneté(s)
            </h3>
            <div className="grid gap-4 @3xl:grid-cols-2">
              <Controller
                name="citizenship1"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <CountrySelect
                    label="Pays:"
                    value={value}
                    onChange={onChange}
                  />
                )}
              />
              <Controller
                name="citizenship2"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <CountrySelect
                    label="Pays:"
                    value={value}
                    onChange={onChange}
                  />
                )}
              />
            </div>
          </div>

          {/* Dernière entrée au Canada */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Date et lieu de votre dernière entrée au Canada
            </h3>
            <div className="grid gap-4 @3xl:grid-cols-2">
              <Input
                label="Date (AAAA/MM/JJ):"
                type="date"
                {...register('lastEntryDate')}
              />
              <Input
                label="Lieu:"
                {...register('lastEntryPlace')}
              />
            </div>
          </div>

          {/* Pays de résidence antérieur */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Pays de résidence antérieur(s)
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              Au cours des cinq dernières années, avez-vous vécu dans un pays autre que celui de votre citoyenneté ou de votre résidence actuelle (indiqué ci-dessus) pendant plus de six mois?
            </p>
            <Controller
              name="hasPreviousResidence"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Select
                  placeholder="Sélectionner"
                  options={[
                    { label: 'Oui', value: 'yes' },
                    { label: 'Non', value: 'no' },
                  ]}
                  value={value || ''}
                  onChange={(selected) => onChange(typeof selected === 'string' ? selected : selected?.value || '')}
                  getOptionValue={(option) => option.value}
                  displayValue={(selected) => {
                    const option = [
                      { label: 'Oui', value: 'yes' },
                      { label: 'Non', value: 'no' },
                    ].find((opt) => opt.value === selected);
                    return option?.label || '';
                  }}
                />
              )}
            />
            {hasPreviousResidence === 'yes' && (
              <Input
                label="Si vous avez répondu « oui », veuillez fournir des détails:"
                {...register('previousResidenceDetails')}
                className="mt-4"
                rows={3}
              />
            )}
          </div>

          {/* État matrimonial actuel */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              État matrimonial et relationnel
            </h3>
            <Controller
              name="currentMaritalStatus"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Select
                  label="Votre état civil actuel:"
                  placeholder="Sélectionner"
                  options={maritalStatusOptions}
                  value={value || ''}
                  onChange={(selected) => onChange(typeof selected === 'string' ? selected : selected?.value || '')}
                  getOptionValue={(option) => option.value}
                  displayValue={(selected) => {
                    const option = maritalStatusOptions.find((opt) => opt.value === selected);
                    return option?.label || '';
                  }}
                  error={errors.currentMaritalStatus?.message}
                />
              )}
            />
            {isMarriedOrCommonLaw && (
              <div className="mt-4 grid gap-4">
                <p className="text-sm text-gray-600">
                  (Si vous êtes marié ou en union de fait) Fournir la date à laquelle vous vous êtes marié ou avez commencé à vivre en union de fait.
                </p>
                <DateField
                  name="marriageDate"
                  control={control}
                  label="Date (AAAA/MM/JJ):"
                />
                <p className="text-sm text-gray-600">
                  Fournissez le nom de votre époux/conjoint de fait actuel.
                </p>
                <div className="grid gap-4 @3xl:grid-cols-2">
                  <Input
                    label="Nom(s) de famille:"
                    {...register('spouseLastName')}
                  />
                  <Input
                    label="Prénom(s):"
                    {...register('spouseFirstName')}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Ancien conjoint */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Avez-vous déjà été marié ou en union de fait?
            </h3>
            <Controller
              name="hasPreviousSpouse"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Select
                  placeholder="Sélectionner"
                  options={[
                    { label: 'Oui', value: 'yes' },
                    { label: 'Non', value: 'no' },
                  ]}
                  value={value || ''}
                  onChange={(selected) => onChange(typeof selected === 'string' ? selected : selected?.value || '')}
                  getOptionValue={(option) => option.value}
                  displayValue={(selected) => {
                    const option = [
                      { label: 'Oui', value: 'yes' },
                      { label: 'Non', value: 'no' },
                    ].find((opt) => opt.value === selected);
                    return option?.label || '';
                  }}
                />
              )}
            />
            {hasPreviousSpouse === 'yes' && (
              <div className="mt-4 grid gap-4">
                <p className="text-sm text-gray-600">
                  Fournissez les informations suivantes pour votre ancien conjoint/conjoint de fait:
                </p>
                <div className="grid gap-4 @3xl:grid-cols-2">
                  <Input
                    label="Nom(s) de famille:"
                    {...register('previousSpouseLastName')}
                  />
                  <Input
                    label="Prénom(s):"
                    {...register('previousSpouseFirstName')}
                  />
                  <DateField
                    name="previousSpouseDateOfBirth"
                    control={control}
                    label="Date de naissance (AAAA/MM/JJ):"
                  />
                  <Controller
                    name="previousSpouseRelationshipType"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <Select
                        label="Type de relation:"
                        placeholder="Sélectionner"
                        options={relationshipTypeOptions}
                        value={value || ''}
                        onChange={(selected) => onChange(typeof selected === 'string' ? selected : selected?.value || '')}
                        getOptionValue={(option) => option.value}
                        displayValue={(selected) => {
                          const option = relationshipTypeOptions.find((opt) => opt.value === selected);
                          return option?.label || '';
                        }}
                      />
                    )}
                  />
                  <DateField
                    name="previousSpouseRelationshipStartDate"
                    control={control}
                    label="Date de début de la relation (AAAA/MM/JJ):"
                  />
                  <DateField
                    name="previousSpouseRelationshipEndDate"
                    control={control}
                    label="Date de fin de la relation (AAAA/MM/JJ):"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Coordonnées */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Coordonnées
            </h3>
            <p className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
              Adresse postale actuelle de votre domicile
            </p>
            <div className="grid gap-4">
              <Input
                label="No d'app./unité:"
                {...register('apartmentUnit')}
              />
              <div className="grid gap-4 @3xl:grid-cols-2">
                <Input
                  label="Numéro de rue:"
                  {...register('streetNumber')}
                />
                <Input
                  label="Nom de rue:"
                  {...register('streetName')}
                />
              </div>
              <div className="grid gap-4 @3xl:grid-cols-2">
                <Input
                  label="Village/ville:"
                  {...register('city')}
                  error={errors.city?.message}
                />
                <Input
                  label="Province ou État:"
                  {...register('province')}
                />
              </div>
              <div className="grid gap-4 @3xl:grid-cols-2">
                <Controller
                  name="country"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <CountrySelect
                      label="Pays:"
                      value={value}
                      onChange={onChange}
                      error={errors.country?.message}
                    />
                  )}
                />
                <Input
                  label="Code postal:"
                  {...register('postalCode')}
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
