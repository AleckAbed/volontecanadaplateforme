'use client';

import { useAtom } from 'jotai';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import FormSummary from '@/app/shared/client-form/client-form-multi-step/form-summary';
import { formDataAtom, useStepper } from '@/app/shared/client-form/client-form-multi-step';
import { Input, Select } from 'rizzui';
import CountrySelect from '@/app/shared/client-form/country-select';
import DateField from '@/app/shared/client-form/date-field';

const maritalStatusOptions = [
  { label: 'Célibataire', value: 'single' },
  { label: 'Marié(e)', value: 'married' },
  { label: 'Divorcé(e)', value: 'divorced' },
  { label: 'Veuf(ve)', value: 'widowed' },
  { label: 'Union de fait', value: 'common-law' },
];

export default function StepNine() {
  const { step, gotoNextStep } = useStepper();
  const [formData, setFormData] = useAtom(formDataAtom);

  const {
    register,
    handleSubmit,
    control,
  } = useForm({
    defaultValues: {
      applicantInfoFullName: formData.applicantInfo?.fullName || formData.applicant?.fullName || '',
      applicantInfoDateOfBirth: formData.applicantInfo?.dateOfBirth || formData.applicant?.dateOfBirth || '',
      applicantInfoCountryOfBirth: formData.applicantInfo?.countryOfBirth || formData.applicant?.countryOfBirth || '',
      applicantInfoMaritalStatus: formData.applicantInfo?.maritalStatus || formData.applicant?.maritalStatus || '',
      applicantInfoEmail: formData.applicantInfo?.email || formData.applicant?.email || '',
      applicantInfoCurrentAddress: formData.applicantInfo?.currentAddress || formData.applicant?.currentAddress || '',
      spouseInfoFullName: formData.spouseInfo?.fullName || formData.spouse?.fullName || '',
      spouseInfoDateOfBirth: formData.spouseInfo?.dateOfBirth || formData.spouse?.dateOfBirth || '',
      spouseInfoCountryOfBirth: formData.spouseInfo?.countryOfBirth || formData.spouse?.countryOfBirth || '',
      spouseInfoMaritalStatus: formData.spouseInfo?.maritalStatus || formData.spouse?.maritalStatus || '',
      spouseInfoEmail: formData.spouseInfo?.email || formData.spouse?.email || '',
      spouseInfoCurrentAddress: formData.spouseInfo?.currentAddress || formData.spouse?.currentAddress || '',
      motherInfoFullName: formData.motherInfo?.fullName || formData.mother?.fullName || '',
      motherInfoDateOfBirth: formData.motherInfo?.dateOfBirth || formData.mother?.dateOfBirth || '',
      motherInfoCountryOfBirth: formData.motherInfo?.countryOfBirth || formData.mother?.countryOfBirth || '',
      motherInfoMaritalStatus: formData.motherInfo?.maritalStatus || formData.mother?.maritalStatus || '',
      motherInfoEmail: formData.motherInfo?.email || formData.mother?.email || '',
      motherInfoCurrentAddress: formData.motherInfo?.currentAddress || formData.mother?.currentAddress || '',
      fatherInfoFullName: formData.fatherInfo?.fullName || formData.father?.fullName || '',
      fatherInfoDateOfBirth: formData.fatherInfo?.dateOfBirth || formData.father?.dateOfBirth || '',
      fatherInfoCountryOfBirth: formData.fatherInfo?.countryOfBirth || formData.father?.countryOfBirth || '',
      fatherInfoMaritalStatus: formData.fatherInfo?.maritalStatus || formData.father?.maritalStatus || '',
      fatherInfoEmail: formData.fatherInfo?.email || formData.father?.email || '',
      fatherInfoCurrentAddress: formData.fatherInfo?.currentAddress || formData.father?.currentAddress || '',
    },
  });

  const onSubmit: SubmitHandler<any> = (data) => {
    setFormData((prev) => ({
      ...prev,
      applicantInfo: {
        fullName: data.applicantInfoFullName,
        dateOfBirth: data.applicantInfoDateOfBirth,
        countryOfBirth: data.applicantInfoCountryOfBirth,
        maritalStatus: data.applicantInfoMaritalStatus,
        email: data.applicantInfoEmail,
        currentAddress: data.applicantInfoCurrentAddress,
      },
      spouseInfo: {
        fullName: data.spouseInfoFullName,
        dateOfBirth: data.spouseInfoDateOfBirth,
        countryOfBirth: data.spouseInfoCountryOfBirth,
        maritalStatus: data.spouseInfoMaritalStatus,
        email: data.spouseInfoEmail,
        currentAddress: data.spouseInfoCurrentAddress,
      },
      motherInfo: {
        fullName: data.motherInfoFullName,
        dateOfBirth: data.motherInfoDateOfBirth,
        countryOfBirth: data.motherInfoCountryOfBirth,
        maritalStatus: data.motherInfoMaritalStatus,
        email: data.motherInfoEmail,
        currentAddress: data.motherInfoCurrentAddress,
      },
      fatherInfo: {
        fullName: data.fatherInfoFullName,
        dateOfBirth: data.fatherInfoDateOfBirth,
        countryOfBirth: data.fatherInfoCountryOfBirth,
        maritalStatus: data.fatherInfoMaritalStatus,
        email: data.fatherInfoEmail,
        currentAddress: data.fatherInfoCurrentAddress,
      },
    }));
    gotoNextStep();
  };

  return (
    <>
      <div className="col-span-full flex flex-col justify-center @4xl:col-span-5">
        <FormSummary
          descriptionClassName="@7xl:me-10"
          title="Section A - Lien de parenté"
          description="Veuillez confirmer les informations sur les membres de votre famille"
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
              Lien de parenté - Demandeur
            </h3>
            <div className="grid gap-4 @3xl:grid-cols-2">
              <Input label="Nom complet" {...register('applicantInfoFullName')} />
              <DateField
                name="applicantInfoDateOfBirth"
                control={control}
                label="Date de naissance (AAAA/MM/JJ)"
              />
              <Controller
                name="applicantInfoCountryOfBirth"
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
                name="applicantInfoMaritalStatus"
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
              <Input label="Adresse électronique" type="email" {...register('applicantInfoEmail')} />
              <Input label="Adresse actuelle" {...register('applicantInfoCurrentAddress')} />
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Lien de parenté – Époux, conjoint de fait ou partenaire conjugal
            </h3>
            <div className="grid gap-4 @3xl:grid-cols-2">
              <Input label="Nom complet" {...register('spouseInfoFullName')} />
              <DateField
                name="spouseInfoDateOfBirth"
                control={control}
                label="Date de naissance (AAAA/MM/JJ)"
              />
              <Controller
                name="spouseInfoCountryOfBirth"
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
                name="spouseInfoMaritalStatus"
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
              <Input label="Adresse électronique" type="email" {...register('spouseInfoEmail')} />
              <Input label="Adresse actuelle (si décédé, dites la ville, pays et date du décès)" {...register('spouseInfoCurrentAddress')} />
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Lien de parenté - Mère
            </h3>
            <div className="grid gap-4 @3xl:grid-cols-2">
              <Input label="Nom complet" {...register('motherInfoFullName')} />
              <DateField
                name="motherInfoDateOfBirth"
                control={control}
                label="Date de naissance (AAAA/MM/JJ)"
              />
              <Controller
                name="motherInfoCountryOfBirth"
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
                name="motherInfoMaritalStatus"
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
              <Input label="Adresse électronique" type="email" {...register('motherInfoEmail')} />
              <Input label="Adresse actuelle (si décédé, dites la ville, pays et date du décès)" {...register('motherInfoCurrentAddress')} />
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Lien de parenté - Père
            </h3>
            <div className="grid gap-4 @3xl:grid-cols-2">
              <Input label="Nom complet" {...register('fatherInfoFullName')} />
              <DateField
                name="fatherInfoDateOfBirth"
                control={control}
                label="Date de naissance (AAAA/MM/JJ)"
              />
              <Controller
                name="fatherInfoCountryOfBirth"
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
                name="fatherInfoMaritalStatus"
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
              <Input label="Adresse électronique" type="email" {...register('fatherInfoEmail')} />
              <Input label="Adresse actuelle (si décédé, dites la ville, pays et date du décès)" {...register('fatherInfoCurrentAddress')} />
            </div>
          </div>
        </div>
      </form>
    </>
  );
}

