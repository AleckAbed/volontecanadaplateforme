'use client';

import { useState } from 'react';
import { useAtom } from 'jotai';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import FormSummary from '@/app/shared/client-form/client-form-multi-step/form-summary';
import { formDataAtom, useStepper } from '@/app/shared/client-form/client-form-multi-step';
import { questionnaireLocaleAtom } from '@/app/shared/questionnaire-locale';
import { STEP7_T } from '@/app/shared/client-form/client-form-translations';
import { Input, Select, Button } from 'rizzui';
import { PiPlus, PiTrash } from 'react-icons/pi';
import DynamicTable from './dynamic-table';
import type { FamilyMember } from '@/validators/client-form.schema';
import CountrySelect from '@/app/shared/client-form/country-select';
import DateField from '@/app/shared/client-form/date-field';

const STEP7_LABELS = {
  fr: {
    sectionA: 'Section A - Lien de parenté - Demandeur',
    sectionSpouse: 'Lien de parenté – Époux, conjoint de fait ou partenaire conjugal',
    sectionMother: 'Lien de parenté - Mère',
    sectionFather: 'Lien de parenté - Père',
    sectionChildren: 'Section B: Enfants',
    sectionSiblings: 'Section C: Frères et sœurs',
    lastName: 'Nom de famille',
    firstName: 'Prénom',
    dob: 'Date de naissance (AAAA/MM/JJ)',
    placeOfBirth: 'Lieu de naissance (ville)',
    countryOfBirth: 'Pays ou territoire de naissance',
    maritalStatus: 'État civil',
    email: 'Adresse électronique',
    currentAddress: 'Adresse actuelle',
    currentAddressDeceased: 'Adresse actuelle (si décédé, dites la ville, pays et date du décès)',
    single: 'Célibataire',
    married: 'Marié(e)',
    divorced: 'Divorcé(e)',
    widowed: 'Veuf(ve)',
    commonLaw: 'Union de fait',
  },
  en: {
    sectionA: 'Section A - Family relationship - Applicant',
    sectionSpouse: 'Family relationship – Spouse, common-law partner or conjugal partner',
    sectionMother: 'Family relationship - Mother',
    sectionFather: 'Family relationship - Father',
    sectionChildren: 'Section B: Children',
    sectionSiblings: 'Section C: Siblings',
    lastName: 'Surname',
    firstName: 'Given name',
    dob: 'Date of birth (YYYY/MM/DD)',
    placeOfBirth: 'Place of birth (city)',
    countryOfBirth: 'Country or territory of birth',
    maritalStatus: 'Marital status',
    email: 'Email address',
    currentAddress: 'Current address',
    currentAddressDeceased: 'Current address (if deceased, indicate city, country and date of death)',
    single: 'Single',
    married: 'Married',
    divorced: 'Divorced',
    widowed: 'Widowed',
    commonLaw: 'Common-law',
  },
  es: {
    sectionA: 'Sección A - Vínculo de parentesco - Solicitante',
    sectionSpouse: 'Vínculo de parentesco – Cónyuge, pareja de hecho o pareja conyugal',
    sectionMother: 'Vínculo de parentesco - Madre',
    sectionFather: 'Vínculo de parentesco - Padre',
    sectionChildren: 'Sección B: Hijos',
    sectionSiblings: 'Sección C: Hermanos y hermanas',
    lastName: 'Apellido',
    firstName: 'Nombre',
    dob: 'Fecha de nacimiento (AAAA/MM/DD)',
    placeOfBirth: 'Lugar de nacimiento (ciudad)',
    countryOfBirth: 'País o territorio de nacimiento',
    maritalStatus: 'Estado civil',
    email: 'Correo electrónico',
    currentAddress: 'Dirección actual',
    currentAddressDeceased: 'Dirección actual (si fallecido, indique ciudad, país y fecha del fallecimiento)',
    single: 'Soltero(a)',
    married: 'Casado(a)',
    divorced: 'Divorciado(a)',
    widowed: 'Viudo(a)',
    commonLaw: 'Unión de hecho',
  },
} as const;

function buildMaritalOptions(loc: 'fr' | 'en' | 'es') {
  const l = STEP7_LABELS[loc] || STEP7_LABELS.fr;
  return [
    { label: l.single, value: 'single' },
    { label: l.married, value: 'married' },
    { label: l.divorced, value: 'divorced' },
    { label: l.widowed, value: 'widowed' },
    { label: l.commonLaw, value: 'common-law' },
  ];
}

export default function StepSeven() {
  const { step, gotoNextStep } = useStepper();
  const [formData, setFormData] = useAtom(formDataAtom);
  const [locale] = useAtom(questionnaireLocaleAtom);
  const t = STEP7_T[locale] || STEP7_T.fr;
  const l = STEP7_LABELS[locale] || STEP7_LABELS.fr;
  const maritalStatusOptions = buildMaritalOptions(locale);
  const [children, setChildren] = useState<FamilyMember[]>(formData?.children || []);
  const [siblings, setSiblings] = useState<FamilyMember[]>(formData?.siblings || []);

  const {
    register,
    handleSubmit,
    control,
  } = useForm({
    defaultValues: {
      applicantLastName: formData?.applicant?.lastName || '',
      applicantFirstName: formData?.applicant?.firstName || formData?.applicant?.fullName || '',
      applicantDateOfBirth: formData?.applicant?.dateOfBirth || '',
      applicantPlaceOfBirth: formData?.applicant?.placeOfBirth || '',
      applicantCountryOfBirth: formData?.applicant?.countryOfBirth || '',
      applicantMaritalStatus: formData?.applicant?.maritalStatus || '',
      applicantEmail: formData?.applicant?.email || '',
      applicantCurrentAddress: formData?.applicant?.currentAddress || '',
      spouseLastName: formData?.spouse?.lastName || '',
      spouseFirstName: formData?.spouse?.firstName || formData?.spouse?.fullName || '',
      spouseDateOfBirth: formData?.spouse?.dateOfBirth || '',
      spousePlaceOfBirth: formData?.spouse?.placeOfBirth || '',
      spouseCountryOfBirth: formData?.spouse?.countryOfBirth || '',
      spouseMaritalStatus: formData?.spouse?.maritalStatus || '',
      spouseEmail: formData?.spouse?.email || '',
      spouseCurrentAddress: formData?.spouse?.currentAddress || '',
      motherLastName: formData?.mother?.lastName || '',
      motherFirstName: formData?.mother?.firstName || formData?.mother?.fullName || '',
      motherDateOfBirth: formData?.mother?.dateOfBirth || '',
      motherPlaceOfBirth: formData?.mother?.placeOfBirth || '',
      motherCountryOfBirth: formData?.mother?.countryOfBirth || '',
      motherMaritalStatus: formData?.mother?.maritalStatus || '',
      motherEmail: formData?.mother?.email || '',
      motherCurrentAddress: formData?.mother?.currentAddress || '',
      fatherLastName: formData?.father?.lastName || '',
      fatherFirstName: formData?.father?.firstName || formData?.father?.fullName || '',
      fatherDateOfBirth: formData?.father?.dateOfBirth || '',
      fatherPlaceOfBirth: formData?.father?.placeOfBirth || '',
      fatherCountryOfBirth: formData?.father?.countryOfBirth || '',
      fatherMaritalStatus: formData?.father?.maritalStatus || '',
      fatherEmail: formData?.father?.email || '',
      fatherCurrentAddress: formData?.father?.currentAddress || '',
    },
  });

  const buildFullName = (lastName: string, firstName: string) =>
    [lastName, firstName].filter(Boolean).join(' ') || undefined;

  const onSubmit: SubmitHandler<any> = (data) => {
    setFormData((prev) => ({
      ...prev,
      applicant: {
        fullName: buildFullName(data.applicantLastName, data.applicantFirstName),
        lastName: data.applicantLastName,
        firstName: data.applicantFirstName,
        dateOfBirth: data.applicantDateOfBirth,
        placeOfBirth: data.applicantPlaceOfBirth,
        countryOfBirth: data.applicantCountryOfBirth,
        maritalStatus: data.applicantMaritalStatus,
        email: data.applicantEmail,
        currentAddress: data.applicantCurrentAddress,
      },
      spouse: {
        fullName: buildFullName(data.spouseLastName, data.spouseFirstName),
        lastName: data.spouseLastName,
        firstName: data.spouseFirstName,
        dateOfBirth: data.spouseDateOfBirth,
        placeOfBirth: data.spousePlaceOfBirth,
        countryOfBirth: data.spouseCountryOfBirth,
        maritalStatus: data.spouseMaritalStatus,
        email: data.spouseEmail,
        currentAddress: data.spouseCurrentAddress,
      },
      mother: {
        fullName: buildFullName(data.motherLastName, data.motherFirstName),
        lastName: data.motherLastName,
        firstName: data.motherFirstName,
        dateOfBirth: data.motherDateOfBirth,
        placeOfBirth: data.motherPlaceOfBirth,
        countryOfBirth: data.motherCountryOfBirth,
        maritalStatus: data.motherMaritalStatus,
        email: data.motherEmail,
        currentAddress: data.motherCurrentAddress,
      },
      father: {
        fullName: buildFullName(data.fatherLastName, data.fatherFirstName),
        lastName: data.fatherLastName,
        firstName: data.fatherFirstName,
        dateOfBirth: data.fatherDateOfBirth,
        placeOfBirth: data.fatherPlaceOfBirth,
        countryOfBirth: data.fatherCountryOfBirth,
        maritalStatus: data.fatherMaritalStatus,
        email: data.fatherEmail,
        currentAddress: data.fatherCurrentAddress,
      },
      children,
      siblings,
    }));
    gotoNextStep();
  };

  const addChild = () => setChildren([...children, {} as FamilyMember]);
  const removeChild = (index: number) => setChildren(children.filter((_, i) => i !== index));
  const updateChild = (index: number, field: string, value: any) => {
    const updated = [...children];
    updated[index] = { ...updated[index], [field]: value };
    setChildren(updated);
  };

  const addSibling = () => setSiblings([...siblings, {} as FamilyMember]);
  const removeSibling = (index: number) => setSiblings(siblings.filter((_, i) => i !== index));
  const updateSibling = (index: number, field: string, value: any) => {
    const updated = [...siblings];
    updated[index] = { ...updated[index], [field]: value };
    setSiblings(updated);
  };

  const familyMemberColumns = [
    { key: 'lastName', label: l.lastName, type: 'text' as const },
    { key: 'firstName', label: l.firstName, type: 'text' as const },
    { key: 'dateOfBirth', label: l.dob, type: 'date' as const },
    { key: 'placeOfBirth', label: l.placeOfBirth, type: 'text' as const },
    { key: 'countryOfBirth', label: l.countryOfBirth, type: 'text' as const },
    { key: 'maritalStatus', label: l.maritalStatus, type: 'select' as const, options: maritalStatusOptions },
    { key: 'email', label: l.email, type: 'text' as const },
    { key: 'currentAddress', label: l.currentAddressDeceased, type: 'text' as const },
  ];

  const renderRelativeBlock = (
    title: string,
    prefix: 'applicant' | 'spouse' | 'mother' | 'father',
    addressLabel: string,
  ) => (
    <div>
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      <div className="grid gap-4">
        <div className="grid gap-4 @3xl:grid-cols-2">
          <Input label={l.lastName} {...register(`${prefix}LastName` as any)} />
          <Input label={l.firstName} {...register(`${prefix}FirstName` as any)} />
        </div>
        <div className="grid gap-4 @3xl:grid-cols-3">
          <DateField
            name={`${prefix}DateOfBirth`}
            control={control}
            label={l.dob}
          />
          <Controller
            name={`${prefix}CountryOfBirth` as any}
            control={control}
            render={({ field: { value, onChange } }) => (
              <CountrySelect
                label={l.countryOfBirth}
                value={value}
                onChange={onChange}
              />
            )}
          />
          <Controller
            name={`${prefix}MaritalStatus` as any}
            control={control}
            render={({ field: { value, onChange } }) => (
              <Select
                label={l.maritalStatus}
                options={maritalStatusOptions}
                value={value || ''}
                onChange={(selected) => onChange(typeof selected === 'string' ? selected : selected?.value || '')}
                getOptionValue={(option) => option.value}
                displayValue={(selected) => {
                  const option = maritalStatusOptions.find((opt) => opt.value === selected);
                  return option?.label || '';
                }}
              />
            )}
          />
        </div>
        <div className="grid gap-4 @3xl:grid-cols-2">
          <Input label={l.email} type="email" {...register(`${prefix}Email` as any)} />
          <Input label={addressLabel} {...register(`${prefix}CurrentAddress` as any)} />
        </div>
      </div>
    </div>
  );

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
          {renderRelativeBlock(l.sectionA, 'applicant', l.currentAddress)}
          {renderRelativeBlock(l.sectionSpouse, 'spouse', l.currentAddressDeceased)}
          {renderRelativeBlock(l.sectionMother, 'mother', l.currentAddressDeceased)}
          {renderRelativeBlock(l.sectionFather, 'father', l.currentAddressDeceased)}

          <DynamicTable<FamilyMember>
            title={l.sectionChildren}
            columns={familyMemberColumns}
            data={children}
            onAdd={addChild}
            onRemove={removeChild}
            onUpdate={updateChild}
            maxRows={8}
          />

          <DynamicTable<FamilyMember>
            title={l.sectionSiblings}
            columns={familyMemberColumns}
            data={siblings}
            onAdd={addSibling}
            onRemove={removeSibling}
            onUpdate={updateSibling}
            maxRows={8}
          />
        </div>
      </form>
    </>
  );
}
