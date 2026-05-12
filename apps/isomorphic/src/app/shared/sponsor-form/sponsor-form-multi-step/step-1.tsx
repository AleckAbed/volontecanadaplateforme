'use client';

import { useEffect, useState, useRef } from 'react';
import { useAtom } from 'jotai';
import { toast } from 'react-hot-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import FormSummary from '@/app/shared/sponsor-form/sponsor-form-multi-step/form-summary';
import { sponsorFormDataAtom, useSponsorStepper, useSponsorFormLoad } from '@/app/shared/sponsor-form/sponsor-form-multi-step';
import { questionnaireLocaleAtom } from '@/app/shared/questionnaire-locale';
import { SPONSOR_STEP1_T } from '@/app/shared/sponsor-form/sponsor-form-translations';
import { Input, Textarea, RadioGroup, AdvancedRadio, Button } from 'rizzui';
import {
  sponsorFormStep1Schema,
  SponsorFormStep1Input,
} from '@/validators/sponsor-form.schema';
import DynamicTable from '@/app/shared/client-form/client-form-multi-step/dynamic-table';
import DateField from '@/app/shared/client-form/date-field';

export default function StepOne() {
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
  } = useForm<SponsorFormStep1Input>({
    resolver: zodResolver(sponsorFormStep1Schema),
    defaultValues: {
      firstMeetingDate: formData.firstMeetingDate || '',
      firstMeetingPlace: formData.firstMeetingPlace || '',
      firstMeetingCircumstances: formData.firstMeetingCircumstances || '',
      wasIntroduced: formData.wasIntroduced || '',
      introducedBy: formData.introducedBy || '',
      hadContactBeforeMeeting: formData.hadContactBeforeMeeting || 'no',
      contactBeforeMeetingDetails: formData.contactBeforeMeetingDetails || '',
      familyAwareOfRelationship: formData.familyAwareOfRelationship || '',
      familyAwareDetails: formData.familyAwareDetails || '',
      relationshipWitnesses: formData.relationshipWitnesses || [],
      ceremonies: formData.ceremonies || [],
    },
  });

  const hadContactBeforeMeeting = watch('hadContactBeforeMeeting');
  const isInitialLoad = useRef(true);

  // Mettre à jour le formulaire quand formData change (chargement depuis la DB)
  useEffect(() => {
    if (isInitialLoad.current) {
      reset({
        firstMeetingDate: formData.firstMeetingDate || '',
        firstMeetingPlace: formData.firstMeetingPlace || '',
        firstMeetingCircumstances: formData.firstMeetingCircumstances || '',
        wasIntroduced: formData.wasIntroduced || '',
        introducedBy: formData.introducedBy || '',
        hadContactBeforeMeeting: formData.hadContactBeforeMeeting || 'no',
        contactBeforeMeetingDetails: formData.contactBeforeMeetingDetails || '',
        familyAwareOfRelationship: formData.familyAwareOfRelationship || '',
        familyAwareDetails: formData.familyAwareDetails || '',
        relationshipWitnesses: formData.relationshipWitnesses || [],
        ceremonies: formData.ceremonies || [],
      });
      isInitialLoad.current = false;
    }
  }, [formData, reset]);

  // Réappliquer les données chargées quand le parent a fini de charger (retour sur la page)
  useEffect(() => {
    if (dataLoadedKey != null) {
      reset({
        firstMeetingDate: formData.firstMeetingDate || '',
        firstMeetingPlace: formData.firstMeetingPlace || '',
        firstMeetingCircumstances: formData.firstMeetingCircumstances || '',
        wasIntroduced: formData.wasIntroduced || '',
        introducedBy: formData.introducedBy || '',
        hadContactBeforeMeeting: formData.hadContactBeforeMeeting || 'no',
        contactBeforeMeetingDetails: formData.contactBeforeMeetingDetails || '',
        familyAwareOfRelationship: formData.familyAwareOfRelationship || '',
        familyAwareDetails: formData.familyAwareDetails || '',
        relationshipWitnesses: formData.relationshipWitnesses || [],
        ceremonies: formData.ceremonies || [],
      });
    }
  }, [dataLoadedKey]);

  // Synchroniser les données du formulaire avec l'atom avant la sauvegarde
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

  const onSubmit: SubmitHandler<SponsorFormStep1Input> = (data) => {
    setFormData((prev) => ({
      ...prev,
      ...data,
    }));
    gotoNextStep();
  };

  // Gestion des témoins de la relation
  const handleAddWitness = () => {
    const currentWitnesses = watch('relationshipWitnesses') || [];
    setFormData((prev) => ({
      ...prev,
      relationshipWitnesses: [...(currentWitnesses || []), {
        lastName: '',
        firstName: '',
        hasFamilyRelationship: '',
        relationshipType: '',
        meetingDate: '',
      }],
    }));
    reset({
      ...watch(),
      relationshipWitnesses: [...(currentWitnesses || []), {
        lastName: '',
        firstName: '',
        hasFamilyRelationship: '',
        relationshipType: '',
        meetingDate: '',
      }],
    });
  };

  const handleRemoveWitness = (index: number) => {
    const currentWitnesses = watch('relationshipWitnesses') || [];
    const updated = currentWitnesses.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      relationshipWitnesses: updated,
    }));
    reset({
      ...watch(),
      relationshipWitnesses: updated,
    });
  };

  const handleUpdateWitness = (index: number, field: string, value: any) => {
    const currentWitnesses = watch('relationshipWitnesses') || [];
    const updated = [...currentWitnesses];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev) => ({
      ...prev,
      relationshipWitnesses: updated,
    }));
    reset({
      ...watch(),
      relationshipWitnesses: updated,
    });
  };

  // Gestion des cérémonies
  const handleAddCeremony = () => {
    const currentCeremonies = watch('ceremonies') || [];
    setFormData((prev) => ({
      ...prev,
      ceremonies: [...(currentCeremonies || []), {
        date: '',
        description: '',
        location: '',
        numberOfGuests: '',
        officiatedBy: '',
      }],
    }));
    reset({
      ...watch(),
      ceremonies: [...(currentCeremonies || []), {
        date: '',
        description: '',
        location: '',
        numberOfGuests: '',
        officiatedBy: '',
      }],
    });
  };

  const handleRemoveCeremony = (index: number) => {
    const currentCeremonies = watch('ceremonies') || [];
    const updated = currentCeremonies.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      ceremonies: updated,
    }));
    reset({
      ...watch(),
      ceremonies: updated,
    });
  };

  const handleUpdateCeremony = (index: number, field: string, value: any) => {
    const currentCeremonies = watch('ceremonies') || [];
    const updated = [...currentCeremonies];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev) => ({
      ...prev,
      ceremonies: updated,
    }));
    reset({
      ...watch(),
      ceremonies: updated,
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
          {/* Question 16: Première rencontre */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              16. Quand vous êtes-vous rencontrés en personne pour la première fois ? (Date, Endroit, Décrivez les circonstances de votre première rencontre)
            </label>
            <div className="grid gap-4">
              <DateField
                name="firstMeetingDate"
                control={control}
                label="Date (JJ/MM/AAAA)"
                error={errors.firstMeetingDate}
              />
              <Input
                label="Endroit"
                placeholder="Entrez le lieu de la première rencontre"
                {...register('firstMeetingPlace')}
                error={errors.firstMeetingPlace?.message}
              />
              <Textarea
                label="Décrivez les circonstances de votre première rencontre"
                placeholder="Décrivez en détail les circonstances..."
                rows={4}
                {...register('firstMeetingCircumstances')}
                error={errors.firstMeetingCircumstances?.message}
              />
            </div>
          </div>

          {/* Question 17: Présentation */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              17. Quelqu&apos;un vous a-t-il présentés l&apos;un à l&apos;autre ?
            </label>
            <Input
              placeholder="Si oui, précisez qui"
              {...register('introducedBy')}
              error={errors.introducedBy?.message}
            />
          </div>

          {/* Question 18: Contact avant rencontre */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              18. Avez-vous été en contact avant de vous rencontrer en personne ?
            </label>
            <Controller
              name="hadContactBeforeMeeting"
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
            {hadContactBeforeMeeting === 'yes' && (
              <Textarea
                label="Si oui, donnez les détails :"
                placeholder="Décrivez le type de contact..."
                rows={3}
                className="mt-4"
                {...register('contactBeforeMeetingDetails')}
                error={errors.contactBeforeMeetingDetails?.message}
              />
            )}
          </div>

          {/* Question 19: Amis/famille au courant */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              19. Vos amis proches, votre famille et vos enfants sont-ils au courant de votre relation ?
            </label>
            <Textarea
              label="Si oui, donnez les détails :"
              placeholder="Décrivez qui est au courant..."
              rows={3}
              {...register('familyAwareDetails')}
              error={errors.familyAwareDetails?.message}
            />
          </div>

          {/* Tableau: Personnes qui connaissent la relation */}
          <div>
            <DynamicTable
              title="Personnes qui connaissent la relation"
              columns={[
                { key: 'lastName', label: 'Nom', type: 'text' },
                { key: 'firstName', label: 'Prénoms', type: 'text' },
                { key: 'hasFamilyRelationship', label: 'Ont-ils un lien de parenté avec le répondant ou le demandeur principal?', type: 'text' },
                { key: 'relationshipType', label: 'Relation avec le répondant ou le demandeur principal', type: 'text' },
                { key: 'meetingDate', label: 'Date à laquelle ils ont rencontré le répondant ou le demandeur principal (AAAA-MM-JJ)', type: 'date' },
              ]}
              data={watch('relationshipWitnesses') || []}
              onAdd={handleAddWitness}
              onRemove={handleRemoveWitness}
              onUpdate={handleUpdateWitness}
              maxRows={5}
            />
          </div>

          {/* Question 20: Cérémonies/événements */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              20. Donnez des détails dans le tableau ci-dessous des cérémonies ou des événements officiels ont-ils été organisés pour reconnaître ou célébrer votre union
            </label>
            <DynamicTable
              title="Cérémonies et événements"
              columns={[
                { key: 'date', label: 'Date (AAAA-MM-JJ)', type: 'date' },
                { key: 'description', label: 'Description de la cérémonie ou de l\'événement', type: 'text' },
                { key: 'location', label: 'Lieu', type: 'text' },
                { key: 'numberOfGuests', label: 'Nombre d\'invités', type: 'number' },
                { key: 'officiatedBy', label: 'Qui a célébré la cérémonie, le cas échéant?', type: 'text' },
              ]}
              data={watch('ceremonies') || []}
              onAdd={handleAddCeremony}
              onRemove={handleRemoveCeremony}
              onUpdate={handleUpdateCeremony}
              maxRows={4}
            />
          </div>
        </div>
      </form>
    </>
  );
}

