'use client';

import { useState } from 'react';
import { useAtom } from 'jotai';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import FormSummary from '@/app/shared/client-form/client-form-multi-step/form-summary';
import { formDataAtom, useStepper } from '@/app/shared/client-form/client-form-multi-step';
import { Input, Select, Button } from 'rizzui';
import { PiPlus, PiTrash } from 'react-icons/pi';
import DynamicTable from './dynamic-table';
import type { FamilyMember } from '@/validators/client-form.schema';
import CountrySelect from '@/app/shared/client-form/country-select';
import DateField from '@/app/shared/client-form/date-field';

const maritalStatusOptions = [
  { label: 'Célibataire', value: 'single' },
  { label: 'Marié(e)', value: 'married' },
  { label: 'Divorcé(e)', value: 'divorced' },
  { label: 'Veuf(ve)', value: 'widowed' },
  { label: 'Union de fait', value: 'common-law' },
];

export default function StepSeven() {
  const { step, gotoNextStep } = useStepper();
  const [formData, setFormData] = useAtom(formDataAtom);
  const [children, setChildren] = useState<FamilyMember[]>(formData?.children || []);
  const [siblings, setSiblings] = useState<FamilyMember[]>(formData?.siblings || []);

  const {
    register,
    handleSubmit,
    control,
  } = useForm({
    defaultValues: {
      applicantFullName: formData?.applicant?.fullName || '',
      applicantDateOfBirth: formData?.applicant?.dateOfBirth || '',
      applicantCountryOfBirth: formData?.applicant?.countryOfBirth || '',
      applicantMaritalStatus: formData?.applicant?.maritalStatus || '',
      applicantEmail: formData?.applicant?.email || '',
      applicantCurrentAddress: formData?.applicant?.currentAddress || '',
      spouseFullName: formData?.spouse?.fullName || '',
      spouseDateOfBirth: formData?.spouse?.dateOfBirth || '',
      spouseCountryOfBirth: formData?.spouse?.countryOfBirth || '',
      spouseMaritalStatus: formData?.spouse?.maritalStatus || '',
      spouseEmail: formData?.spouse?.email || '',
      spouseCurrentAddress: formData?.spouse?.currentAddress || '',
      motherFullName: formData?.mother?.fullName || '',
      motherDateOfBirth: formData?.mother?.dateOfBirth || '',
      motherCountryOfBirth: formData?.mother?.countryOfBirth || '',
      motherMaritalStatus: formData?.mother?.maritalStatus || '',
      motherEmail: formData?.mother?.email || '',
      motherCurrentAddress: formData?.mother?.currentAddress || '',
      fatherFullName: formData?.father?.fullName || '',
      fatherDateOfBirth: formData?.father?.dateOfBirth || '',
      fatherCountryOfBirth: formData?.father?.countryOfBirth || '',
      fatherMaritalStatus: formData?.father?.maritalStatus || '',
      fatherEmail: formData?.father?.email || '',
      fatherCurrentAddress: formData?.father?.currentAddress || '',
    },
  });

  const onSubmit: SubmitHandler<any> = (data) => {
    setFormData((prev) => ({
      ...prev,
      applicant: {
        fullName: data.applicantFullName,
        dateOfBirth: data.applicantDateOfBirth,
        countryOfBirth: data.applicantCountryOfBirth,
        maritalStatus: data.applicantMaritalStatus,
        email: data.applicantEmail,
        currentAddress: data.applicantCurrentAddress,
      },
      spouse: {
        fullName: data.spouseFullName,
        dateOfBirth: data.spouseDateOfBirth,
        countryOfBirth: data.spouseCountryOfBirth,
        maritalStatus: data.spouseMaritalStatus,
        email: data.spouseEmail,
        currentAddress: data.spouseCurrentAddress,
      },
      mother: {
        fullName: data.motherFullName,
        dateOfBirth: data.motherDateOfBirth,
        countryOfBirth: data.motherCountryOfBirth,
        maritalStatus: data.motherMaritalStatus,
        email: data.motherEmail,
        currentAddress: data.motherCurrentAddress,
      },
      father: {
        fullName: data.fatherFullName,
        dateOfBirth: data.fatherDateOfBirth,
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
    { key: 'fullName', label: 'Nom complet', type: 'text' as const },
    { key: 'dateOfBirth', label: 'Date de naissance (AAAA/MM/JJ)', type: 'date' as const },
    { key: 'countryOfBirth', label: 'Pays ou territoire de naissance', type: 'text' as const },
    { key: 'maritalStatus', label: 'État civil', type: 'select' as const, options: maritalStatusOptions },
    { key: 'email', label: 'Adresse électronique', type: 'text' as const },
    { key: 'currentAddress', label: 'Adresse actuelle (si décédé, dites la ville, pays et date du décès)', type: 'text' as const },
  ];

  return (
    <>
      <div className="col-span-full flex flex-col justify-center @4xl:col-span-5">
        <FormSummary
          descriptionClassName="@7xl:me-10"
          title="Famille"
          description="Veuillez fournir les informations sur les membres de votre famille"
        />
      </div>

      <form
        id={`rhf-${step.toString()}`}
        onSubmit={handleSubmit(onSubmit)}
        className="col-span-full rounded-lg bg-white p-5 @4xl:col-span-7 @4xl:p-7 dark:bg-gray-0"
      >
        <div className="grid gap-6">
          {/* Section A - Demandeur */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Section A - Lien de parenté - Demandeur
            </h3>
            <div className="grid gap-4 @3xl:grid-cols-2">
              <Input label="Nom complet" {...register('applicantFullName')} />
              <DateField
                name="applicantDateOfBirth"
                control={control}
                label="Date de naissance (AAAA/MM/JJ)"
              />
              <Controller
                name="applicantCountryOfBirth"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <CountrySelect
                    label="Pays ou territoire de naissance"
                    value={value}
                    onChange={onChange}
                  />
                )}
              />
              <Controller
                name="applicantMaritalStatus"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Select
                    label="État civil"
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
              <Input label="Adresse électronique" type="email" {...register('applicantEmail')} />
              <Input label="Adresse actuelle" {...register('applicantCurrentAddress')} />
            </div>
          </div>

          {/* Époux/Conjoint */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Lien de parenté – Époux, conjoint de fait ou partenaire conjugal
            </h3>
            <div className="grid gap-4 @3xl:grid-cols-2">
              <Input label="Nom complet" {...register('spouseFullName')} />
              <DateField
                name="spouseDateOfBirth"
                control={control}
                label="Date de naissance (AAAA/MM/JJ)"
              />
              <Controller
                name="spouseCountryOfBirth"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <CountrySelect
                    label="Pays ou territoire de naissance"
                    value={value}
                    onChange={onChange}
                  />
                )}
              />
              <Controller
                name="spouseMaritalStatus"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Select
                    label="État civil"
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
              <Input label="Adresse électronique" type="email" {...register('spouseEmail')} />
              <Input label="Adresse actuelle (si décédé, dites la ville, pays et date du décès)" {...register('spouseCurrentAddress')} />
            </div>
          </div>

          {/* Mère */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Lien de parenté - Mère
            </h3>
            <div className="grid gap-4 @3xl:grid-cols-2">
              <Input label="Nom complet" {...register('motherFullName')} />
              <DateField
                name="motherDateOfBirth"
                control={control}
                label="Date de naissance (AAAA/MM/JJ)"
              />
              <Controller
                name="motherCountryOfBirth"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <CountrySelect
                    label="Pays ou territoire de naissance"
                    value={value}
                    onChange={onChange}
                  />
                )}
              />
              <Controller
                name="motherMaritalStatus"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Select
                    label="État civil"
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
              <Input label="Adresse électronique" type="email" {...register('motherEmail')} />
              <Input label="Adresse actuelle (si décédé, dites la ville, pays et date du décès)" {...register('motherCurrentAddress')} />
            </div>
          </div>

          {/* Père */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Lien de parenté - Père
            </h3>
            <div className="grid gap-4 @3xl:grid-cols-2">
              <Input label="Nom complet" {...register('fatherFullName')} />
              <DateField
                name="fatherDateOfBirth"
                control={control}
                label="Date de naissance (AAAA/MM/JJ)"
              />
              <Controller
                name="fatherCountryOfBirth"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <CountrySelect
                    label="Pays ou territoire de naissance"
                    value={value}
                    onChange={onChange}
                  />
                )}
              />
              <Controller
                name="fatherMaritalStatus"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Select
                    label="État civil"
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
              <Input label="Adresse électronique" type="email" {...register('fatherEmail')} />
              <Input label="Adresse actuelle (si décédé, dites la ville, pays et date du décès)" {...register('fatherCurrentAddress')} />
            </div>
          </div>

          {/* Section B - Enfants */}
          <DynamicTable<FamilyMember>
            title="Section B: Enfants"
            columns={familyMemberColumns}
            data={children}
            onAdd={addChild}
            onRemove={removeChild}
            onUpdate={updateChild}
            maxRows={8}
          />

          {/* Section C - Frères et sœurs */}
          <DynamicTable<FamilyMember>
            title="Section C: Frères et sœurs"
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

