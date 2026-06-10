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

const STEP1_LABELS = {
  fr: {
    alert: 'Renseignements concernant la relation - À remplir par le répondant et le demandeur principal',
    q16Title: '16. Quand vous êtes-vous rencontrés en personne pour la première fois ? (Date, Endroit, Décrivez les circonstances de votre première rencontre)',
    dateLabel: 'Date (JJ/MM/AAAA)',
    placeLabel: 'Endroit',
    placePlaceholder: 'Entrez le lieu de la première rencontre',
    circumstancesLabel: 'Décrivez les circonstances de votre première rencontre',
    circumstancesPlaceholder: 'Décrivez en détail les circonstances...',
    q17Title: '17. Quelqu\'un vous a-t-il présentés l\'un à l\'autre ?',
    q17Placeholder: 'Si oui, précisez qui',
    q18Title: '18. Avez-vous été en contact avant de vous rencontrer en personne ?',
    yes: 'Oui',
    no: 'Non',
    q18Details: 'Si oui, donnez les détails :',
    q18DetailsPlaceholder: 'Décrivez le type de contact...',
    q19Title: '19. Vos amis proches, votre famille et vos enfants sont-ils au courant de votre relation ?',
    q19DetailsPlaceholder: 'Décrivez qui est au courant...',
    witnessesTitle: 'Personnes qui connaissent la relation',
    wLastName: 'Nom',
    wFirstName: 'Prénoms',
    wHasFamilyRelationship: 'Ont-ils un lien de parenté avec le répondant ou le demandeur principal?',
    wRelationshipType: 'Relation avec le répondant ou le demandeur principal',
    wMeetingDate: 'Date à laquelle ils ont rencontré le répondant ou le demandeur principal (AAAA-MM-JJ)',
    q20Title: '20. Donnez des détails dans le tableau ci-dessous des cérémonies ou des événements officiels ont-ils été organisés pour reconnaître ou célébrer votre union',
    ceremoniesTitle: 'Cérémonies et événements',
    cDate: 'Date (AAAA-MM-JJ)',
    cDescription: 'Description de la cérémonie ou de l\'événement',
    cLocation: 'Lieu',
    cNumberOfGuests: 'Nombre d\'invités',
    cOfficiatedBy: 'Qui a célébré la cérémonie, le cas échéant?',
  },
  en: {
    alert: 'Relationship information - To be completed by the sponsor and the principal applicant',
    q16Title: '16. When did you meet in person for the first time? (Date, Place, Describe the circumstances of your first meeting)',
    dateLabel: 'Date (DD/MM/YYYY)',
    placeLabel: 'Place',
    placePlaceholder: 'Enter the place of the first meeting',
    circumstancesLabel: 'Describe the circumstances of your first meeting',
    circumstancesPlaceholder: 'Describe the circumstances in detail...',
    q17Title: '17. Did anyone introduce you to each other?',
    q17Placeholder: 'If yes, specify who',
    q18Title: '18. Were you in contact before meeting in person?',
    yes: 'Yes',
    no: 'No',
    q18Details: 'If yes, provide details:',
    q18DetailsPlaceholder: 'Describe the type of contact...',
    q19Title: '19. Are your close friends, family and children aware of your relationship?',
    q19DetailsPlaceholder: 'Describe who is aware...',
    witnessesTitle: 'People who know about the relationship',
    wLastName: 'Surname',
    wFirstName: 'Given names',
    wHasFamilyRelationship: 'Are they related to the sponsor or principal applicant?',
    wRelationshipType: 'Relationship to the sponsor or principal applicant',
    wMeetingDate: 'Date they met the sponsor or principal applicant (YYYY-MM-DD)',
    q20Title: '20. Provide details below of any ceremonies or official events organized to recognize or celebrate your union',
    ceremoniesTitle: 'Ceremonies and events',
    cDate: 'Date (YYYY-MM-DD)',
    cDescription: 'Description of the ceremony or event',
    cLocation: 'Location',
    cNumberOfGuests: 'Number of guests',
    cOfficiatedBy: 'Who officiated the ceremony, if applicable?',
  },
  es: {
    alert: 'Información sobre la relación - Para completar por el patrocinador y el solicitante principal',
    q16Title: '16. ¿Cuándo se conocieron en persona por primera vez? (Fecha, Lugar, Describa las circunstancias de su primer encuentro)',
    dateLabel: 'Fecha (DD/MM/AAAA)',
    placeLabel: 'Lugar',
    placePlaceholder: 'Ingrese el lugar del primer encuentro',
    circumstancesLabel: 'Describa las circunstancias de su primer encuentro',
    circumstancesPlaceholder: 'Describa las circunstancias en detalle...',
    q17Title: '17. ¿Alguien los presentó el uno al otro?',
    q17Placeholder: 'Si sí, especifique quién',
    q18Title: '18. ¿Tuvieron contacto antes de conocerse en persona?',
    yes: 'Sí',
    no: 'No',
    q18Details: 'Si sí, proporcione los detalles:',
    q18DetailsPlaceholder: 'Describa el tipo de contacto...',
    q19Title: '19. ¿Sus amigos cercanos, familia e hijos están al tanto de su relación?',
    q19DetailsPlaceholder: 'Describa quién está al tanto...',
    witnessesTitle: 'Personas que conocen la relación',
    wLastName: 'Apellido',
    wFirstName: 'Nombres',
    wHasFamilyRelationship: '¿Tienen un vínculo de parentesco con el patrocinador o el solicitante principal?',
    wRelationshipType: 'Relación con el patrocinador o el solicitante principal',
    wMeetingDate: 'Fecha en que conocieron al patrocinador o al solicitante principal (AAAA-MM-DD)',
    q20Title: '20. Proporcione detalles en el cuadro siguiente sobre ceremonias o eventos oficiales organizados para reconocer o celebrar su unión',
    ceremoniesTitle: 'Ceremonias y eventos',
    cDate: 'Fecha (AAAA-MM-DD)',
    cDescription: 'Descripción de la ceremonia o evento',
    cLocation: 'Lugar',
    cNumberOfGuests: 'Número de invitados',
    cOfficiatedBy: '¿Quién ofició la ceremonia, si aplica?',
  },
} as const;

export default function StepOne() {
  const { step, gotoNextStep } = useSponsorStepper();
  const [formData, setFormData] = useAtom(sponsorFormDataAtom);
  const [locale] = useAtom(questionnaireLocaleAtom);
  const t = SPONSOR_STEP1_T[locale] || SPONSOR_STEP1_T.fr;
  const l = STEP1_LABELS[locale] || STEP1_LABELS.fr;
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
        className="col-span-full rounded-lg bg-white p-5 @4xl:col-span-7 @4xl:p-7 dark:bg-gray-0"
      >
        <div className="grid gap-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {l.q16Title}
            </label>
            <div className="grid gap-4">
              <DateField
                name="firstMeetingDate"
                control={control}
                label={l.dateLabel}
                error={errors.firstMeetingDate}
              />
              <Input
                label={l.placeLabel}
                placeholder={l.placePlaceholder}
                {...register('firstMeetingPlace')}
                error={errors.firstMeetingPlace?.message}
              />
              <Textarea
                label={l.circumstancesLabel}
                placeholder={l.circumstancesPlaceholder}
                rows={4}
                {...register('firstMeetingCircumstances')}
                error={errors.firstMeetingCircumstances?.message}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {l.q17Title}
            </label>
            <Input
              placeholder={l.q17Placeholder}
              {...register('introducedBy')}
              error={errors.introducedBy?.message}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {l.q18Title}
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
            {hadContactBeforeMeeting === 'yes' && (
              <Textarea
                label={l.q18Details}
                placeholder={l.q18DetailsPlaceholder}
                rows={3}
                className="mt-4"
                {...register('contactBeforeMeetingDetails')}
                error={errors.contactBeforeMeetingDetails?.message}
              />
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {l.q19Title}
            </label>
            <Textarea
              label={l.q18Details}
              placeholder={l.q19DetailsPlaceholder}
              rows={3}
              {...register('familyAwareDetails')}
              error={errors.familyAwareDetails?.message}
            />
          </div>

          <div>
            <DynamicTable
              title={l.witnessesTitle}
              columns={[
                { key: 'lastName', label: l.wLastName, type: 'text' },
                { key: 'firstName', label: l.wFirstName, type: 'text' },
                { key: 'hasFamilyRelationship', label: l.wHasFamilyRelationship, type: 'text' },
                { key: 'relationshipType', label: l.wRelationshipType, type: 'text' },
                { key: 'meetingDate', label: l.wMeetingDate, type: 'date' },
              ]}
              data={watch('relationshipWitnesses') || []}
              onAdd={handleAddWitness}
              onRemove={handleRemoveWitness}
              onUpdate={handleUpdateWitness}
              maxRows={5}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {l.q20Title}
            </label>
            <DynamicTable
              title={l.ceremoniesTitle}
              columns={[
                { key: 'date', label: l.cDate, type: 'date' },
                { key: 'description', label: l.cDescription, type: 'text' },
                { key: 'location', label: l.cLocation, type: 'text' },
                { key: 'numberOfGuests', label: l.cNumberOfGuests, type: 'number' },
                { key: 'officiatedBy', label: l.cOfficiatedBy, type: 'text' },
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
