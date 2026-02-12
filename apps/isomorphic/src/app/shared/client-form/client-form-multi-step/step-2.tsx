'use client';

import { useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import { toast } from 'react-hot-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import FormSummary from '@/app/shared/client-form/client-form-multi-step/form-summary';
import { formDataAtom, useStepper } from '@/app/shared/client-form/client-form-multi-step';
import { questionnaireLocaleAtom } from '@/app/shared/questionnaire-locale';
import { Input, Select, RadioGroup, AdvancedRadio, Checkbox } from 'rizzui';
import {
  clientFormStep2Schema,
  ClientFormStep2Input,
} from '@/validators/client-form.schema';
import CountrySelect from '@/app/shared/client-form/country-select';
import DateField from '@/app/shared/client-form/date-field';

const STEP2_T = {
  fr: {
    summaryTitle: 'Citoyenneté, Résidence et État matrimonial',
    summaryDesc: "Veuillez fournir vos informations sur la citoyenneté, la résidence et l'état matrimonial",
    citizenships: 'Citoyenneté(s)',
    howManyCitizenships: 'Combien de citoyenneté(s) avez-vous?',
    select: 'Sélectionner',
    oneCitizenship: '1 citoyenneté',
    citizenshipsCount: (n: number) => (n === 1 ? '1 citoyenneté' : `${n} citoyennetés`),
    citizenshipNum: (n: number) => `Citoyenneté ${n}:`,
    lastEntryTitle: 'Date et lieu de votre dernière entrée au Canada',
    date: 'Date (AAAA/MM/JJ):',
    place: 'Lieu:',
    previousResidenceTitle: 'Pays de résidence antérieur(s)',
    previousResidenceIntro: "Au cours des cinq dernières années, avez-vous vécu dans un pays autre que celui de votre citoyenneté ou de votre résidence actuelle (indiqué ci-dessus) pendant plus de six mois?",
    yes: 'Oui',
    no: 'Non',
    previousResidenceDetails: 'Si vous avez répondu « oui », veuillez fournir des détails:',
    maritalTitle: 'État matrimonial et relationnel',
    maritalLabel: 'Votre état civil actuel:',
    marriedIntro: '(Si vous êtes marié ou en union de fait) Fournir la date à laquelle vous vous êtes marié ou avez commencé à vivre en union de fait.',
    spouseIntro: 'Fournissez le nom de votre époux/conjoint de fait actuel.',
    surname: 'Nom(s) de famille:',
    givenName: 'Prénom(s):',
    previousSpouseTitle: 'Avez-vous déjà été marié ou en union de fait?',
    previousSpouseIntro: 'Fournissez les informations suivantes pour votre ancien conjoint/conjoint de fait:',
    dob: 'Date de naissance (AAAA/MM/JJ):',
    relationshipType: 'Type de relation:',
    relationshipStart: 'Date de début de la relation (AAAA/MM/JJ):',
    relationshipEnd: 'Date de fin de la relation (AAAA/MM/JJ):',
    contactTitle: 'Coordonnées',
    contactIntro: 'Adresse postale actuelle de votre domicile',
    aptUnit: "No d'app./unité:",
    streetNumber: 'Numéro de rue:',
    streetName: 'Nom de rue:',
    city: 'Village/ville:',
    province: 'Province ou État:',
    country: 'Pays:',
    postalCode: 'Code postal:',
    single: 'Célibataire',
    married: 'Marié(e)',
    divorced: 'Divorcé(e)',
    widowed: 'Veuf(ve)',
    commonLaw: 'Union de fait',
    separated: 'Séparé(e)',
    marriage: 'Mariage',
  },
  en: {
    summaryTitle: 'Citizenship, Residence and Marital Status',
    summaryDesc: 'Please provide your citizenship, residence and marital status information',
    citizenships: 'Citizenship(s)',
    howManyCitizenships: 'How many citizenship(s) do you have?',
    select: 'Select',
    oneCitizenship: '1 citizenship',
    citizenshipsCount: (n: number) => (n === 1 ? '1 citizenship' : `${n} citizenships`),
    citizenshipNum: (n: number) => `Citizenship ${n}:`,
    lastEntryTitle: 'Date and place of your last entry to Canada',
    date: 'Date (YYYY/MM/DD):',
    place: 'Place:',
    previousResidenceTitle: 'Previous country/countries of residence',
    previousResidenceIntro: 'In the past five years, have you lived in a country other than your country of citizenship or your current residence (indicated above) for more than six months?',
    yes: 'Yes',
    no: 'No',
    previousResidenceDetails: 'If you answered "yes", please provide details:',
    maritalTitle: 'Marital and relationship status',
    maritalLabel: 'Your current marital status:',
    marriedIntro: '(If you are married or in a common-law relationship) Provide the date you were married or started living in a common-law relationship.',
    spouseIntro: 'Provide the name of your current spouse or common-law partner.',
    surname: 'Surname(s):',
    givenName: 'Given name(s):',
    previousSpouseTitle: 'Have you ever been married or in a common-law relationship?',
    previousSpouseIntro: 'Provide the following information for your former spouse or common-law partner:',
    dob: 'Date of birth (YYYY/MM/DD):',
    relationshipType: 'Type of relationship:',
    relationshipStart: 'Relationship start date (YYYY/MM/DD):',
    relationshipEnd: 'Relationship end date (YYYY/MM/DD):',
    contactTitle: 'Contact information',
    contactIntro: 'Current mailing address of your residence',
    aptUnit: 'Apt/Unit no.:',
    streetNumber: 'Street number:',
    streetName: 'Street name:',
    city: 'City/Town:',
    province: 'Province or State:',
    country: 'Country:',
    postalCode: 'Postal code:',
    single: 'Single',
    married: 'Married',
    divorced: 'Divorced',
    widowed: 'Widowed',
    commonLaw: 'Common-law',
    separated: 'Separated',
    marriage: 'Marriage',
  },
} as const;

function getMaritalOptions(locale: 'fr' | 'en') {
  const t = STEP2_T[locale];
  return [
    { label: t.single, value: 'single' },
    { label: t.married, value: 'married' },
    { label: t.divorced, value: 'divorced' },
    { label: t.widowed, value: 'widowed' },
    { label: t.commonLaw, value: 'common-law' },
    { label: t.separated, value: 'separated' },
  ];
}

function getRelationshipOptions(locale: 'fr' | 'en') {
  const t = STEP2_T[locale];
  return [
    { label: t.marriage, value: 'marriage' },
    { label: t.commonLaw, value: 'common-law' },
  ];
}

export default function StepTwo() {
  const { step, gotoNextStep } = useStepper();
  const [formData, setFormData] = useAtom(formDataAtom);
  const [locale] = useAtom(questionnaireLocaleAtom);
  const t = STEP2_T[locale] || STEP2_T.fr;
  const maritalStatusOptions = getMaritalOptions(locale);
  const relationshipTypeOptions = getRelationshipOptions(locale);

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
      numberOfCitizenships: formData?.numberOfCitizenships || '1',
      citizenship1: formData?.citizenship1 || '',
      citizenship2: formData?.citizenship2 || '',
      citizenship3: formData?.citizenship3 || '',
      citizenship4: formData?.citizenship4 || '',
      citizenship5: formData?.citizenship5 || '',
      lastEntryDate: formData?.lastEntryDate || '',
      lastEntryPlace: formData?.lastEntryPlace || '',
      hasPreviousResidence: formData.hasPreviousResidence || 'no',
      previousResidenceDetails: formData?.previousResidenceDetails || '',
      currentMaritalStatus: formData.currentMaritalStatus || '',
      marriageDate: formData?.marriageDate || '',
      spouseLastName: formData.spouseLastName || '',
      spouseFirstName: formData?.spouseFirstName || '',
      hasPreviousSpouse: formData.hasPreviousSpouse || 'no',
      previousSpouseLastName: formData?.previousSpouseLastName || '',
      previousSpouseFirstName: formData.previousSpouseFirstName || '',
      previousSpouseDateOfBirth: formData?.previousSpouseDateOfBirth || '',
      previousSpouseRelationshipType: formData.previousSpouseRelationshipType || '',
      previousSpouseRelationshipStartDate: formData?.previousSpouseRelationshipStartDate || '',
      previousSpouseRelationshipEndDate: formData.previousSpouseRelationshipEndDate || '',
      apartmentUnit: formData?.apartmentUnit || '',
      streetNumber: formData.streetNumber || '',
      streetName: formData?.streetName || '',
      city: formData.city || '',
      province: formData?.province || '',
      country: formData.country || '',
      postalCode: formData?.postalCode || '',
    },
  });

  const numberOfCitizenships = watch('numberOfCitizenships');
  const currentMaritalStatus = watch('currentMaritalStatus');
  const hasPreviousResidence = watch('hasPreviousResidence');
  const hasPreviousSpouse = watch('hasPreviousSpouse');
  const isMarriedOrCommonLaw = currentMaritalStatus === 'married' || currentMaritalStatus === 'common-law';
  const nCitizenships = Math.min(5, Math.max(1, parseInt(String(numberOfCitizenships || '1'), 10) || 1));

  // Mettre à jour le formulaire quand formData change (chargement depuis la DB)
  const isInitialLoad = useRef(true);
  useEffect(() => {
    if (isInitialLoad.current) {
      reset({
        numberOfCitizenships: formData?.numberOfCitizenships || '1',
        citizenship1: formData?.citizenship1 || '',
        citizenship2: formData?.citizenship2 || '',
        citizenship3: formData?.citizenship3 || '',
        citizenship4: formData?.citizenship4 || '',
        citizenship5: formData?.citizenship5 || '',
        lastEntryDate: formData?.lastEntryDate || '',
        lastEntryPlace: formData?.lastEntryPlace || '',
        hasPreviousResidence: formData.hasPreviousResidence || 'no',
        previousResidenceDetails: formData?.previousResidenceDetails || '',
        currentMaritalStatus: formData.currentMaritalStatus || '',
        marriageDate: formData?.marriageDate || '',
        spouseLastName: formData.spouseLastName || '',
        spouseFirstName: formData?.spouseFirstName || '',
        hasPreviousSpouse: formData.hasPreviousSpouse || 'no',
        previousSpouseLastName: formData?.previousSpouseLastName || '',
        previousSpouseFirstName: formData.previousSpouseFirstName || '',
        previousSpouseDateOfBirth: formData?.previousSpouseDateOfBirth || '',
        previousSpouseRelationshipType: formData.previousSpouseRelationshipType || '',
        previousSpouseRelationshipStartDate: formData?.previousSpouseRelationshipStartDate || '',
        previousSpouseRelationshipEndDate: formData.previousSpouseRelationshipEndDate || '',
        apartmentUnit: formData?.apartmentUnit || '',
        streetNumber: formData.streetNumber || '',
        streetName: formData?.streetName || '',
        city: formData.city || '',
        province: formData?.province || '',
        country: formData.country || '',
        postalCode: formData?.postalCode || '',
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
          {/* Citoyenneté(s) */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {t.citizenships}
            </h3>
            <Controller
              name="numberOfCitizenships"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Select
                  label={t.howManyCitizenships}
                  placeholder={t.select}
                  options={[1, 2, 3, 4, 5].map((n) => ({
                    label: t.citizenshipsCount(n),
                    value: String(n),
                  }))}
                  value={value || '1'}
                  onChange={(selected) => onChange(typeof selected === 'string' ? selected : selected?.value ?? '1')}
                  getOptionValue={(option) => option.value}
                  displayValue={(selected) => {
                    const n = parseInt(String(selected), 10) || 1;
                    return t.citizenshipsCount(n);
                  }}
                  error={errors.numberOfCitizenships?.message}
                />
              )}
            />
            <div className="mt-4 grid gap-4 @3xl:grid-cols-2">
              {Array.from({ length: nCitizenships }, (_, i) => i + 1).map((num) => (
                <Controller
                  key={num}
                  name={num === 1 ? 'citizenship1' : num === 2 ? 'citizenship2' : num === 3 ? 'citizenship3' : num === 4 ? 'citizenship4' : 'citizenship5'}
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <CountrySelect
                      label={t.citizenshipNum(num)}
                      value={value}
                      onChange={onChange}
                      error={num === 1 ? errors.citizenship1?.message : undefined}
                    />
                  )}
                />
              ))}
            </div>
          </div>

          {/* Dernière entrée au Canada */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {t.lastEntryTitle}
            </h3>
            <div className="grid gap-4 @3xl:grid-cols-2">
              <Input
                label={t.date}
                type="date"
                {...register('lastEntryDate')}
              />
              <Input
                label={t.place}
                {...register('lastEntryPlace')}
              />
            </div>
          </div>

          {/* Pays de résidence antérieur */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {t.previousResidenceTitle}
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              {t.previousResidenceIntro}
            </p>
            <Controller
              name="hasPreviousResidence"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Select
                  placeholder={t.select}
                  options={[
                    { label: t.yes, value: 'yes' },
                    { label: t.no, value: 'no' },
                  ]}
                  value={value || ''}
                  onChange={(selected) => onChange(typeof selected === 'string' ? selected : selected?.value || '')}
                  getOptionValue={(option) => option.value}
                  displayValue={(selected) => {
                    const option = [
                      { label: t.yes, value: 'yes' },
                      { label: t.no, value: 'no' },
                    ].find((opt) => opt.value === selected);
                    return option?.label || '';
                  }}
                />
              )}
            />
            {hasPreviousResidence === 'yes' && (
              <Input
                label={t.previousResidenceDetails}
                {...register('previousResidenceDetails')}
                className="mt-4"
                rows={3}
              />
            )}
          </div>

          {/* État matrimonial actuel */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {t.maritalTitle}
            </h3>
            <Controller
              name="currentMaritalStatus"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Select
                  label={t.maritalLabel}
                  placeholder={t.select}
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
                  {t.marriedIntro}
                </p>
                <DateField
                  name="marriageDate"
                  control={control}
                  label={t.date}
                />
                <p className="text-sm text-gray-600">
                  {t.spouseIntro}
                </p>
                <div className="grid gap-4 @3xl:grid-cols-2">
                  <Input
                    label={t.surname}
                    {...register('spouseLastName')}
                  />
                  <Input
                    label={t.givenName}
                    {...register('spouseFirstName')}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Ancien conjoint */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {t.previousSpouseTitle}
            </h3>
            <Controller
              name="hasPreviousSpouse"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Select
                  placeholder={t.select}
                  options={[
                    { label: t.yes, value: 'yes' },
                    { label: t.no, value: 'no' },
                  ]}
                  value={value || ''}
                  onChange={(selected) => onChange(typeof selected === 'string' ? selected : selected?.value || '')}
                  getOptionValue={(option) => option.value}
                  displayValue={(selected) => {
                    const option = [
                      { label: t.yes, value: 'yes' },
                      { label: t.no, value: 'no' },
                    ].find((opt) => opt.value === selected);
                    return option?.label || '';
                  }}
                />
              )}
            />
            {hasPreviousSpouse === 'yes' && (
              <div className="mt-4 grid gap-4">
                <p className="text-sm text-gray-600">
                  {t.previousSpouseIntro}
                </p>
                <div className="grid gap-4 @3xl:grid-cols-2">
                  <Input
                    label={t.surname}
                    {...register('previousSpouseLastName')}
                  />
                  <Input
                    label={t.givenName}
                    {...register('previousSpouseFirstName')}
                  />
                  <DateField
                    name="previousSpouseDateOfBirth"
                    control={control}
                    label={t.dob}
                  />
                  <Controller
                    name="previousSpouseRelationshipType"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <Select
                        label={t.relationshipType}
                        placeholder={t.select}
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
                    label={t.relationshipStart}
                  />
                  <DateField
                    name="previousSpouseRelationshipEndDate"
                    control={control}
                    label={t.relationshipEnd}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Coordonnées */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {t.contactTitle}
            </h3>
            <p className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
              {t.contactIntro}
            </p>
            <div className="grid gap-4">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-6">
                  <Input
                    label={t.aptUnit}
                    {...register('apartmentUnit')}
                  />
                </div>
                <div className="col-span-6">
                  <Input
                    label={t.streetNumber}
                    {...register('streetNumber')}
                  />
                </div>
                <div className="col-span-12">
                  <Input
                    label={t.streetName}
                    {...register('streetName')}
                  />
                </div>
              </div>
              <div className="grid gap-4 @3xl:grid-cols-2">
                <Input
                  label={t.city}
                  {...register('city')}
                  error={errors.city?.message}
                />
                <Input
                  label={t.province}
                  {...register('province')}
                />
              </div>
              <div className="grid gap-4 @3xl:grid-cols-2">
                <Controller
                  name="country"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <CountrySelect
                      label={t.country}
                      value={value}
                      onChange={onChange}
                      error={errors.country?.message}
                    />
                  )}
                />
                <Input
                  label={t.postalCode}
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
