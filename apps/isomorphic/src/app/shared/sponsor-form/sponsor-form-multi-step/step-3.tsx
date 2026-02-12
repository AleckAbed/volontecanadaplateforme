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
  sponsorFormStep3Schema,
  SponsorFormStep3Input,
} from '@/validators/sponsor-form.schema';
import DynamicTable from '@/app/shared/client-form/client-form-multi-step/dynamic-table';
import DateField from '@/app/shared/client-form/date-field';

export default function StepThree() {
  const { step, gotoNextStep } = useSponsorStepper();
  const [formData, setFormData] = useAtom(sponsorFormDataAtom);
  const [locale] = useAtom(questionnaireLocaleAtom);
  const t = SPONSOR_STEP3_T[locale] || SPONSOR_STEP3_T.fr;
  const { dataLoadedKey } = useSponsorFormLoad();
  const [isAlertVisible, setIsAlertVisible] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<SponsorFormStep3Input>({
    resolver: zodResolver(sponsorFormStep3Schema),
    defaultValues: {
      hasOtherSponsorships: formData.hasOtherSponsorships || 'no',
      otherSponsorshipsDetails: formData.otherSponsorshipsDetails || '',
      otherDependents: formData.otherDependents || [],
      educationLevel: formData.educationLevel || '',
      addressHistory: formData.addressHistory || [],
      hasPreviousRelationships: formData.hasPreviousRelationships || 'no',
      previousRelationships: formData.previousRelationships || [],
    },
  });

  const hasOtherSponsorships = watch('hasOtherSponsorships');
  const hasPreviousRelationships = watch('hasPreviousRelationships');
  const isInitialLoad = useRef(true);

  // Mettre à jour le formulaire quand formData change
  useEffect(() => {
    if (isInitialLoad.current) {
      reset({
        hasOtherSponsorships: formData.hasOtherSponsorships || 'no',
        otherSponsorshipsDetails: formData.otherSponsorshipsDetails || '',
        otherDependents: formData.otherDependents || [],
        educationLevel: formData.educationLevel || '',
        addressHistory: formData.addressHistory || [],
        hasPreviousRelationships: formData.hasPreviousRelationships || 'no',
        previousRelationships: formData.previousRelationships || [],
      });
      isInitialLoad.current = false;
    }
  }, [formData, reset]);

  // Réappliquer les données chargées quand le parent a fini de charger (retour sur la page)
  useEffect(() => {
    if (dataLoadedKey != null) {
      reset({
        hasOtherSponsorships: formData.hasOtherSponsorships || 'no',
        otherSponsorshipsDetails: formData.otherSponsorshipsDetails || '',
        otherDependents: formData.otherDependents || [],
        educationLevel: formData.educationLevel || '',
        addressHistory: formData.addressHistory || [],
        hasPreviousRelationships: formData.hasPreviousRelationships || 'no',
        previousRelationships: formData.previousRelationships || [],
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

  const onSubmit: SubmitHandler<SponsorFormStep3Input> = (data) => {
    setFormData((prev) => ({
      ...prev,
      ...data,
    }));
    gotoNextStep();
  };

  // Gestion des personnes à charge
  const handleAddDependent = () => {
    const currentDependents = watch('otherDependents') || [];
    setFormData((prev) => ({
      ...prev,
      otherDependents: [...(currentDependents || []), {
        name: '',
        relationship: '',
        dateOfBirth: '',
      }],
    }));
    reset({
      ...watch(),
      otherDependents: [...(currentDependents || []), {
        name: '',
        relationship: '',
        dateOfBirth: '',
      }],
    });
  };

  const handleRemoveDependent = (index: number) => {
    const currentDependents = watch('otherDependents') || [];
    const updated = currentDependents.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      otherDependents: updated,
    }));
    reset({
      ...watch(),
      otherDependents: updated,
    });
  };

  const handleUpdateDependent = (index: number, field: string, value: any) => {
    const currentDependents = watch('otherDependents') || [];
    const updated = [...currentDependents];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev) => ({
      ...prev,
      otherDependents: updated,
    }));
    reset({
      ...watch(),
      otherDependents: updated,
    });
  };

  // Gestion de l'historique des adresses
  const handleAddAddress = () => {
    const currentAddresses = watch('addressHistory') || [];
    setFormData((prev) => ({
      ...prev,
      addressHistory: [...(currentAddresses || []), {
        fromDate: '',
        toDate: '',
        street: '',
        city: '',
        province: '',
        postalCode: '',
        country: '',
      }],
    }));
    reset({
      ...watch(),
      addressHistory: [...(currentAddresses || []), {
        fromDate: '',
        toDate: '',
        street: '',
        city: '',
        province: '',
        postalCode: '',
        country: '',
      }],
    });
  };

  const handleRemoveAddress = (index: number) => {
    const currentAddresses = watch('addressHistory') || [];
    const updated = currentAddresses.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      addressHistory: updated,
    }));
    reset({
      ...watch(),
      addressHistory: updated,
    });
  };

  const handleUpdateAddress = (index: number, field: string, value: any) => {
    const currentAddresses = watch('addressHistory') || [];
    const updated = [...currentAddresses];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev) => ({
      ...prev,
      addressHistory: updated,
    }));
    reset({
      ...watch(),
      addressHistory: updated,
    });
  };

  // Gestion des relations antérieures
  const handleAddPreviousRelationship = () => {
    const currentRelationships = watch('previousRelationships') || [];
    setFormData((prev) => ({
      ...prev,
      previousRelationships: [...(currentRelationships || []), {
        lastName: '',
        firstName: '',
        dateOfBirth: '',
        placeOfBirth: '',
        deathDate: '',
      }],
    }));
    reset({
      ...watch(),
      previousRelationships: [...(currentRelationships || []), {
        lastName: '',
        firstName: '',
        dateOfBirth: '',
        placeOfBirth: '',
        deathDate: '',
      }],
    });
  };

  const handleRemovePreviousRelationship = (index: number) => {
    const currentRelationships = watch('previousRelationships') || [];
    const updated = currentRelationships.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      previousRelationships: updated,
    }));
    reset({
      ...watch(),
      previousRelationships: updated,
    });
  };

  const handleUpdatePreviousRelationship = (index: number, field: string, value: any) => {
    const currentRelationships = watch('previousRelationships') || [];
    const updated = [...currentRelationships];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev) => ({
      ...prev,
      previousRelationships: updated,
    }));
    reset({
      ...watch(),
      previousRelationships: updated,
    });
  };

  return (
    <>
      <div className="col-span-full flex flex-col justify-center @4xl:col-span-5">
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
          {/* Question 11: Autres parrainages */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              11. Avez-vous parrainé, dans le passé, ou parrainez-vous actuellement d'autres membres de votre famille dans une demande différente ?
            </label>
            <Controller
              name="hasOtherSponsorships"
              control={control}
              render={({ field: { value, onChange } }) => (
                <RadioGroup
                  value={value || 'no'}
                  setValue={onChange}
                  className="mb-4 flex items-center gap-4"
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
            {hasOtherSponsorships === 'yes' && (
              <Textarea
                label="Si oui, donnez les détails :"
                placeholder="Décrivez les autres parrainages..."
                rows={3}
                {...register('otherSponsorshipsDetails')}
                error={errors.otherSponsorshipsDetails?.message}
              />
            )}
          </div>

          {/* Question 12: Autres personnes à charge */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              12. Donnez des détails sur toute autre personne qui dépend financièrement de vous (qu'elle vive ou non avec vous) et qui ne figure pas déjà dans les tableaux ci-dessus. Incluez les anciens époux ou conjoints et tous les enfants issus des relations antérieures
            </label>
            <DynamicTable
              title="Autres personnes à charge"
              columns={[
                { key: 'name', label: 'Nom et Prénoms', type: 'text' },
                { key: 'relationship', label: 'Lien de parenté', type: 'text' },
                { key: 'dateOfBirth', label: 'Né le', type: 'date' },
              ]}
              data={watch('otherDependents') || []}
              onAdd={handleAddDependent}
              onRemove={handleRemoveDependent}
              onUpdate={handleUpdateDependent}
              maxRows={2}
            />
          </div>

          {/* Question 13: Niveau de scolarité */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              13. Quel est le niveau de scolarité le plus élevé que vous avez atteint ?
            </label>
            <Input
              placeholder="Ex: Baccalauréat, Maîtrise, Doctorat, etc."
              {...register('educationLevel')}
              error={errors.educationLevel?.message}
            />
          </div>

          {/* Question 14: Historique des adresses */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              14. Indiquez toutes les adresses où vous avez résidé au cours des cinq dernières années. N'utilisez pas d'adresse comportant une case postale
            </label>
            <DynamicTable
              title="Historique des adresses"
              columns={[
                { key: 'fromDate', label: 'De (AAAA-MM)', type: 'text', placeholder: 'YYYY-MM' },
                { key: 'toDate', label: 'À (AAAA-MM)', type: 'text', placeholder: 'YYYY-MM' },
                { key: 'street', label: 'Rue et numéro', type: 'text' },
                { key: 'city', label: 'Ville', type: 'text' },
                { key: 'province', label: 'Province', type: 'text' },
                { key: 'postalCode', label: 'Code postal', type: 'text' },
                { key: 'country', label: 'Pays', type: 'text' },
              ]}
              data={watch('addressHistory') || []}
              onAdd={handleAddAddress}
              onRemove={handleRemoveAddress}
              onUpdate={handleUpdateAddress}
              maxRows={6}
            />
          </div>

          {/* Question 15: Relations antérieures */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              15. Avez-vous déjà été marié ou vécu dans une relation d'union de fait/concubinage auparavant?
            </label>
            <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
              (Vous avez vécu en union de fait si vous avez déjà vécu avec un partenaire dans une relation engagée et conjugale – assimilable à un mariage – pendant une période d'un an ou plus)
            </p>
            <Controller
              name="hasPreviousRelationships"
              control={control}
              render={({ field: { value, onChange } }) => (
                <RadioGroup
                  value={value || 'no'}
                  setValue={onChange}
                  className="mb-4 flex items-center gap-4"
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
            {hasPreviousRelationships === 'yes' && (
              <div>
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  Si oui, donnez des détails sur votre époux ou conjoint de fait(s) dans le tableau ci-dessous.
                </p>
                <DynamicTable
                  title="Relations antérieures"
                  columns={[
                    { key: 'lastName', label: 'Nom', type: 'text' },
                    { key: 'firstName', label: 'Prénoms', type: 'text' },
                    { key: 'dateOfBirth', label: 'Date de naissance', type: 'date' },
                    { key: 'placeOfBirth', label: 'Ville de naissance', type: 'text' },
                    { key: 'deathDate', label: 'Si décédé, la date', type: 'date' },
                  ]}
                  data={watch('previousRelationships') || []}
                  onAdd={handleAddPreviousRelationship}
                  onRemove={handleRemovePreviousRelationship}
                  onUpdate={handleUpdatePreviousRelationship}
                  maxRows={3}
                />
              </div>
            )}
          </div>
        </div>
      </form>
    </>
  );
}

