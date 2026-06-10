'use client';

import { useEffect, useState, useRef } from 'react';
import { useAtom } from 'jotai';
import { toast } from 'react-hot-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import FormSummary from '@/app/shared/client-form/client-form-multi-step/form-summary';
import { formDataAtom, useStepper } from '@/app/shared/client-form/client-form-multi-step';
import { questionnaireLocaleAtom } from '@/app/shared/questionnaire-locale';
import { Input, Select, RadioGroup, AdvancedRadio } from 'rizzui';
import {
  clientFormStep1Schema,
  ClientFormStep1Input,
} from '@/validators/client-form.schema';
import CountrySelect from '@/app/shared/client-form/country-select';
import DateField from '@/app/shared/client-form/date-field';
import { PiX } from 'react-icons/pi';

/** Traductions pour l’étape 1 du questionnaire (zone question / intro + titres) */
const STEP1_T = {
  fr: {
    intro: "Nous vous demandons de remplir ce questionnaire. Gardez votre passeport et/ou votre document national d'identité à portée de main pendant que vous remplissez ce questionnaire. Si vous avez des personnes à charge (accompagnant ou non), ces informations leur seront également demandées.",
    summaryTitle: "Détails de la demande et Informations personnelles",
    detailsTitle: "Détails de la demande",
    familyMembersLabel: "Combien de membres de votre famille, dont vous-même, seront inclus dans cette demande?",
    languagePreferenceLabel: "Langue de préférence pour:",
    correspondenceLabel: "La correspondance:",
    interviewLabel: "L'entrevue:",
    csqQuestion: "Avez-vous reçu votre Certificat de sélection du Québec (CSQ)?",
    yes: "Oui",
    no: "Non",
    csqNumberLabel: "Si oui, entrez le numéro. Numéro CSQ:",
    csqApplicationDateLabelWhenYes: "Date de la demande du CSQ (AAAA/MM/JJ):",
    csqDateLabel: "Si non, quand avez-vous demandé votre CSQ? Date (AAAA/MM/JJ):",
    personalInfoTitle: "Renseignements personnels",
    personalInfoIntro: "Entrez votre nom de famille complet, tel qu'il figure dans votre passeport ou titre de voyage. Si votre document ne comporte qu'un seul nom, inscrivez-le dans le champ du nom de famille et laissez le champ du prénom vide.",
    lastNameLabel: "Nom(s) de famille:",
    firstNameLabel: "Prénom(s):",
    uciLabel: "IUC (si vous avez un identificateur unique de client):",
    physicalTitle: "Caractéristiques physiques",
    sexLabel: "Sexe:",
    eyeColorLabel: "Couleur des yeux:",
    heightLabel: "Taille (cm):",
    birthTitle: "Renseignements sur la naissance",
    dobLabel: "Date de naissance (AAAAMM/JJ):",
    placeOfBirthLabel: "Lieu de naissance:",
    countryLabel: "Pays:",
    selectPlaceholder: "Sélectionner",
    step: "Étape",
    of: "sur",
    member: "membre",
    members: "membres",
    languageFr: "Français",
    languageEn: "Anglais",
    sexMale: "Masculin",
    sexFemale: "Féminin",
    sexOther: "Autre",
    eyeBlue: "Bleu",
    eyeGreen: "Vert",
    eyeBrown: "Marron",
    eyeBlack: "Noir",
    eyeGray: "Gris",
    eyeHazel: "Noisette",
  },
  en: {
    intro: "We ask you to complete this questionnaire. Keep your passport and/or national identity document on hand while you complete it. If you have dependants (accompanying or not), this information will also be requested for them.",
    summaryTitle: "Application details and Personal information",
    detailsTitle: "Application details",
    familyMembersLabel: "How many family members, including yourself, will be included in this application?",
    languagePreferenceLabel: "Preferred language for:",
    correspondenceLabel: "Correspondence:",
    interviewLabel: "Interview:",
    csqQuestion: "Have you received your Québec Certificate of Selection (CSQ)?",
    yes: "Yes",
    no: "No",
    csqNumberLabel: "If yes, enter the number. CSQ number:",
    csqApplicationDateLabelWhenYes: "CSQ application date (YYYY/MM/DD):",
    csqDateLabel: "If no, when did you apply for your CSQ? Date (YYYY/MM/DD):",
    personalInfoTitle: "Personal information",
    personalInfoIntro: "Enter your full surname as shown on your passport or travel document. If your document has only one name, enter it in the surname field and leave the given name field blank.",
    lastNameLabel: "Surname(s):",
    firstNameLabel: "Given name(s):",
    uciLabel: "UCI (if you have a unique client identifier):",
    physicalTitle: "Physical characteristics",
    sexLabel: "Sex:",
    eyeColorLabel: "Eye colour:",
    heightLabel: "Height (cm):",
    birthTitle: "Birth information",
    dobLabel: "Date of birth (YYYY/MM/DD):",
    placeOfBirthLabel: "Place of birth:",
    countryLabel: "Country:",
    selectPlaceholder: "Select",
    step: "Step",
    of: "of",
    member: "member",
    members: "members",
    languageFr: "French",
    languageEn: "English",
    sexMale: "Male",
    sexFemale: "Female",
    sexOther: "Other",
    eyeBlue: "Blue",
    eyeGreen: "Green",
    eyeBrown: "Brown",
    eyeBlack: "Black",
    eyeGray: "Gray",
    eyeHazel: "Hazel",
  },
  es: {
    intro: "Le pedimos completar este cuestionario. Tenga su pasaporte y/o su documento nacional de identidad a mano mientras lo completa. Si tiene personas a cargo (acompañantes o no), también se solicitará esta información sobre ellas.",
    summaryTitle: "Detalles de la solicitud e Información personal",
    detailsTitle: "Detalles de la solicitud",
    familyMembersLabel: "¿Cuántos miembros de su familia, incluido usted mismo, estarán incluidos en esta solicitud?",
    languagePreferenceLabel: "Idioma preferido para:",
    correspondenceLabel: "La correspondencia:",
    interviewLabel: "La entrevista:",
    csqQuestion: "¿Ha recibido su Certificado de selección de Quebec (CSQ)?",
    yes: "Sí",
    no: "No",
    csqNumberLabel: "Si sí, ingrese el número. Número CSQ:",
    csqApplicationDateLabelWhenYes: "Fecha de solicitud del CSQ (AAAA/MM/DD):",
    csqDateLabel: "Si no, ¿cuándo solicitó su CSQ? Fecha (AAAA/MM/DD):",
    personalInfoTitle: "Información personal",
    personalInfoIntro: "Ingrese su apellido completo, tal como aparece en su pasaporte o documento de viaje. Si su documento solo tiene un nombre, escríbalo en el campo de apellido y deje el campo de nombre vacío.",
    lastNameLabel: "Apellido(s):",
    firstNameLabel: "Nombre(s):",
    uciLabel: "IUC (si tiene un identificador único de cliente):",
    physicalTitle: "Características físicas",
    sexLabel: "Sexo:",
    eyeColorLabel: "Color de ojos:",
    heightLabel: "Altura (cm):",
    birthTitle: "Información sobre el nacimiento",
    dobLabel: "Fecha de nacimiento (AAAA/MM/DD):",
    placeOfBirthLabel: "Lugar de nacimiento:",
    countryLabel: "País:",
    selectPlaceholder: "Seleccionar",
    step: "Paso",
    of: "de",
    member: "miembro",
    members: "miembros",
    languageFr: "Francés",
    languageEn: "Inglés",
    sexMale: "Masculino",
    sexFemale: "Femenino",
    sexOther: "Otro",
    eyeBlue: "Azul",
    eyeGreen: "Verde",
    eyeBrown: "Marrón",
    eyeBlack: "Negro",
    eyeGray: "Gris",
    eyeHazel: "Avellana",
  },
} as const;

const languageOptionsFr = [
  { label: 'Français', value: 'Français' },
  { label: 'Anglais', value: 'Anglais' },
];
const languageOptionsEn = [
  { label: 'French', value: 'Français' },
  { label: 'English', value: 'Anglais' },
];
const languageOptionsEs = [
  { label: 'Francés', value: 'Français' },
  { label: 'Inglés', value: 'Anglais' },
];

const sexOptionsFr = [
  { label: 'Masculin', value: 'male' },
  { label: 'Féminin', value: 'female' },
  { label: 'Autre', value: 'other' },
];
const sexOptionsEn = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
];
const sexOptionsEs = [
  { label: 'Masculino', value: 'male' },
  { label: 'Femenino', value: 'female' },
  { label: 'Otro', value: 'other' },
];

const eyeColorOptionsFr = [
  { label: 'Bleu', value: 'blue' },
  { label: 'Vert', value: 'green' },
  { label: 'Marron', value: 'brown' },
  { label: 'Noir', value: 'black' },
  { label: 'Gris', value: 'gray' },
  { label: 'Noisette', value: 'hazel' },
];
const eyeColorOptionsEn = [
  { label: 'Blue', value: 'blue' },
  { label: 'Green', value: 'green' },
  { label: 'Brown', value: 'brown' },
  { label: 'Black', value: 'black' },
  { label: 'Gray', value: 'gray' },
  { label: 'Hazel', value: 'hazel' },
];
const eyeColorOptionsEs = [
  { label: 'Azul', value: 'blue' },
  { label: 'Verde', value: 'green' },
  { label: 'Marrón', value: 'brown' },
  { label: 'Negro', value: 'black' },
  { label: 'Gris', value: 'gray' },
  { label: 'Avellana', value: 'hazel' },
];

export default function StepOne() {
  const { step, gotoNextStep } = useStepper();
  const [formData, setFormData] = useAtom(formDataAtom);
  const [locale] = useAtom(questionnaireLocaleAtom);
  const [isAlertVisible, setIsAlertVisible] = useState(true);
  const t = STEP1_T[locale] || STEP1_T.fr;
  const languageOptions = locale === 'en' ? languageOptionsEn : locale === 'es' ? languageOptionsEs : languageOptionsFr;
  const sexOptions = locale === 'en' ? sexOptionsEn : locale === 'es' ? sexOptionsEs : sexOptionsFr;
  const eyeColorOptions = locale === 'en' ? eyeColorOptionsEn : locale === 'es' ? eyeColorOptionsEs : eyeColorOptionsFr;

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
                    {t.intro}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <FormSummary
          descriptionClassName="@7xl:me-10"
          title={t.summaryTitle}
          description=""
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
              {t.detailsTitle}
            </h3>
            <div className="grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t.familyMembersLabel}
                </label>
                <Controller
                  name="numberOfFamilyMembers"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <Select
                      placeholder={t.selectPlaceholder}
                      options={Array.from({ length: 10 }, (_, i) => ({
                        label: `${i + 1} ${i > 0 ? t.members : t.member}`,
                        value: `${i + 1}`,
                      }))}
                      value={value}
                      onChange={(selected: string | { value: string } | null) => onChange(typeof selected === 'string' ? selected : selected?.value || '')}
                      getOptionValue={(option) => option.value}
                      displayValue={(selected) => {
                        const option = Array.from({ length: 10 }, (_, i) => ({
                          label: `${i + 1} ${i > 0 ? t.members : t.member}`,
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
                  {t.languagePreferenceLabel}
                </label>
                <div className="grid gap-4 @3xl:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-gray-600">{t.correspondenceLabel}</label>
                    <Controller
                      name="preferredLanguageCorrespondence"
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <Select
                          placeholder={t.selectPlaceholder}
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
                    <label className="mb-1 block text-xs text-gray-600">{t.interviewLabel}</label>
                    <Controller
                      name="preferredLanguageInterview"
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <Select
                          placeholder={t.selectPlaceholder}
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
                  {t.csqQuestion}
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
                        {t.yes}
                      </AdvancedRadio>
                      <AdvancedRadio
                        value="no"
                        className="[&_.rizzui-advanced-radio]:px-4 [&_.rizzui-advanced-radio]:py-2"
                        inputClassName="[&~span]:border-0 [&~span]:ring-1 [&~span]:ring-gray-200 [&~span:hover]:ring-primary [&:checked~span:hover]:ring-primary [&:checked~span]:border-1 [&:checked~.rizzui-advanced-radio]:ring-2"
                      >
                        {t.no}
                      </AdvancedRadio>
                    </RadioGroup>
                  )}
                />
                {hasCSQ === 'yes' && (
                  <>
                    <Input
                      label={t.csqNumberLabel}
                      {...register('csqNumber')}
                      className="mt-4"
                    />
                    <DateField
                      name="csqApplicationDate"
                      control={control}
                      label={t.csqApplicationDateLabelWhenYes}
                      className="mt-4"
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Renseignements personnels */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {t.personalInfoTitle}
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              {t.personalInfoIntro}
            </p>
            <div className="grid gap-4 @3xl:grid-cols-2">
              <Input
                label={t.lastNameLabel}
                {...register('lastName')}
                error={errors.lastName?.message}
                className="w-full"
              />
              <Input
                label={t.firstNameLabel}
                {...register('firstName')}
                className="w-full"
              />
              <Input
                label={t.uciLabel}
                {...register('uci')}
                className="w-full"
              />
            </div>
          </div>

          {/* Caractéristiques physiques */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {t.physicalTitle}
            </h3>
            <div className="grid gap-4 @3xl:grid-cols-3">
              <Controller
                name="sex"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Select
                    label={t.sexLabel}
                    placeholder={t.selectPlaceholder}
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
                    label={t.eyeColorLabel}
                    placeholder={t.selectPlaceholder}
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
                label="Ville de naissance:"
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
