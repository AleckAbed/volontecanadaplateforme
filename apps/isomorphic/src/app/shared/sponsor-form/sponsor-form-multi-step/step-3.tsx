'use client';

import { useEffect, useRef, useState } from 'react';
import { useAtom } from 'jotai';
import { toast } from 'react-hot-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import FormSummary from '@/app/shared/sponsor-form/sponsor-form-multi-step/form-summary';
import { sponsorFormDataAtom, useSponsorStepper, useSponsorFormLoad } from '@/app/shared/sponsor-form/sponsor-form-multi-step';
import { questionnaireLocaleAtom } from '@/app/shared/questionnaire-locale';
import { SPONSOR_STEP3_T } from '@/app/shared/sponsor-form/sponsor-form-translations';
import { Input, Textarea, RadioGroup, AdvancedRadio, Button } from 'rizzui';
import {
  sponsorFormStep3Schema,
  SponsorFormStep3Input,
} from '@/validators/sponsor-form.schema';
import DynamicTable from '@/app/shared/client-form/client-form-multi-step/dynamic-table';
import DateField from '@/app/shared/client-form/date-field';

const STEP3_LABELS = {
  fr: {
    alert: 'Renseignements concernant la relation - À remplir par le répondant et le demandeur principal',
    yes: 'Oui',
    no: 'Non',
    q11: "11. Avez-vous parrainé, dans le passé, ou parrainez-vous actuellement d'autres membres de votre famille dans une demande différente ?",
    q11Details: 'Si oui, donnez les détails :',
    q11Placeholder: 'Décrivez les autres parrainages...',
    q12: "12. Donnez des détails sur toute autre personne qui dépend financièrement de vous (qu'elle vive ou non avec vous) et qui ne figure pas déjà dans les tableaux ci-dessus. Incluez les anciens époux ou conjoints et tous les enfants issus des relations antérieures",
    dependentsTitle: 'Autres personnes à charge',
    dName: 'Nom et Prénoms',
    dRelationship: 'Lien de parenté',
    dDateOfBirth: 'Né le',
    q13: '13. Quel est le niveau de scolarité le plus élevé que vous avez atteint ?',
    q13Placeholder: 'Ex: Baccalauréat, Maîtrise, Doctorat, etc.',
    q14: "14. Indiquez toutes les adresses où vous avez résidé au cours des cinq dernières années. N'utilisez pas d'adresse comportant une case postale",
    addressTitle: 'Historique des adresses',
    aFromDate: 'De (AAAA-MM)',
    aToDate: 'À (AAAA-MM)',
    aStreet: 'Rue et numéro',
    aCity: 'Ville',
    aProvince: 'Province',
    aPostalCode: 'Code postal',
    aCountry: 'Pays',
    q15: "15. Avez-vous déjà été marié ou vécu dans une relation d'union de fait/concubinage auparavant?",
    q15Note: "(Vous avez vécu en union de fait si vous avez déjà vécu avec un partenaire dans une relation engagée et conjugale – assimilable à un mariage – pendant une période d'un an ou plus)",
    q15Intro: 'Si oui, donnez des détails sur votre époux ou conjoint de fait(s) dans le tableau ci-dessous.',
    prevTitle: 'Relations antérieures',
    pLastName: 'Nom',
    pFirstName: 'Prénoms',
    pDateOfBirth: 'Date de naissance',
    pPlaceOfBirth: 'Ville de naissance',
    pDeathDate: 'Si décédé, la date',
  },
  en: {
    alert: 'Relationship information - To be completed by the sponsor and principal applicant',
    yes: 'Yes',
    no: 'No',
    q11: '11. Have you previously sponsored, or are you currently sponsoring, other family members in a different application?',
    q11Details: 'If yes, provide details:',
    q11Placeholder: 'Describe the other sponsorships...',
    q12: '12. Provide details for any other person who financially depends on you (whether or not they live with you) and who is not already listed in the tables above. Include former spouses or partners and all children from previous relationships',
    dependentsTitle: 'Other dependents',
    dName: 'Name and given names',
    dRelationship: 'Relationship',
    dDateOfBirth: 'Born on',
    q13: '13. What is the highest level of education you have completed?',
    q13Placeholder: "E.g. Bachelor's, Master's, Doctorate, etc.",
    q14: '14. List all addresses where you have resided in the last five years. Do not use a P.O. box address',
    addressTitle: 'Address history',
    aFromDate: 'From (YYYY-MM)',
    aToDate: 'To (YYYY-MM)',
    aStreet: 'Street and number',
    aCity: 'City',
    aProvince: 'Province',
    aPostalCode: 'Postal code',
    aCountry: 'Country',
    q15: '15. Have you previously been married or lived in a common-law/cohabitation relationship?',
    q15Note: '(You have lived in a common-law relationship if you have already lived with a partner in a committed and conjugal relationship – similar to marriage – for a period of one year or more)',
    q15Intro: 'If yes, provide details about your spouse or common-law partner(s) in the table below.',
    prevTitle: 'Previous relationships',
    pLastName: 'Surname',
    pFirstName: 'Given names',
    pDateOfBirth: 'Date of birth',
    pPlaceOfBirth: 'City of birth',
    pDeathDate: 'If deceased, the date',
  },
  es: {
    alert: 'Información sobre la relación - Para completar por el patrocinador y el solicitante principal',
    yes: 'Sí',
    no: 'No',
    q11: '11. ¿Ha patrocinado anteriormente o está patrocinando actualmente a otros miembros de su familia en una solicitud diferente?',
    q11Details: 'Si sí, proporcione los detalles:',
    q11Placeholder: 'Describa los otros patrocinios...',
    q12: '12. Proporcione detalles sobre cualquier otra persona que dependa económicamente de usted (viva o no con usted) y que no figure ya en los cuadros anteriores. Incluya ex cónyuges o parejas y todos los hijos de relaciones anteriores',
    dependentsTitle: 'Otras personas a cargo',
    dName: 'Nombre y apellidos',
    dRelationship: 'Vínculo de parentesco',
    dDateOfBirth: 'Nacido(a) el',
    q13: '13. ¿Cuál es el nivel de estudios más alto que ha alcanzado?',
    q13Placeholder: 'Ej: Licenciatura, Maestría, Doctorado, etc.',
    q14: '14. Indique todas las direcciones donde ha residido en los últimos cinco años. No use direcciones de apartado postal',
    addressTitle: 'Historial de direcciones',
    aFromDate: 'Desde (AAAA-MM)',
    aToDate: 'Hasta (AAAA-MM)',
    aStreet: 'Calle y número',
    aCity: 'Ciudad',
    aProvince: 'Provincia',
    aPostalCode: 'Código postal',
    aCountry: 'País',
    q15: '15. ¿Ha estado casado anteriormente o ha vivido en una relación de unión de hecho/concubinato?',
    q15Note: '(Ha vivido en unión de hecho si ya ha vivido con una pareja en una relación comprometida y conyugal – similar al matrimonio – durante un período de un año o más)',
    q15Intro: 'Si sí, proporcione detalles sobre su cónyuge o pareja(s) de hecho en el cuadro siguiente.',
    prevTitle: 'Relaciones anteriores',
    pLastName: 'Apellido',
    pFirstName: 'Nombres',
    pDateOfBirth: 'Fecha de nacimiento',
    pPlaceOfBirth: 'Ciudad de nacimiento',
    pDeathDate: 'Si fallecido, la fecha',
  },
} as const;

export default function StepThree() {
  const { step, gotoNextStep } = useSponsorStepper();
  const [formData, setFormData] = useAtom(sponsorFormDataAtom);
  const [locale] = useAtom(questionnaireLocaleAtom);
  const t = SPONSOR_STEP3_T[locale] || SPONSOR_STEP3_T.fr;
  const l = STEP3_LABELS[locale] || STEP3_LABELS.fr;
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
              {l.q11}
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
            {hasOtherSponsorships === 'yes' && (
              <Textarea
                label={l.q11Details}
                placeholder={l.q11Placeholder}
                rows={3}
                {...register('otherSponsorshipsDetails')}
                error={errors.otherSponsorshipsDetails?.message}
              />
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {l.q12}
            </label>
            <DynamicTable
              title={l.dependentsTitle}
              columns={[
                { key: 'name', label: l.dName, type: 'text' },
                { key: 'relationship', label: l.dRelationship, type: 'text' },
                { key: 'dateOfBirth', label: l.dDateOfBirth, type: 'date' },
              ]}
              data={watch('otherDependents') || []}
              onAdd={handleAddDependent}
              onRemove={handleRemoveDependent}
              onUpdate={handleUpdateDependent}
              maxRows={2}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {l.q13}
            </label>
            <Input
              placeholder={l.q13Placeholder}
              {...register('educationLevel')}
              error={errors.educationLevel?.message}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {l.q14}
            </label>
            <DynamicTable
              title={l.addressTitle}
              columns={[
                { key: 'fromDate', label: l.aFromDate, type: 'text', placeholder: 'YYYY-MM' },
                { key: 'toDate', label: l.aToDate, type: 'text', placeholder: 'YYYY-MM' },
                { key: 'street', label: l.aStreet, type: 'text' },
                { key: 'city', label: l.aCity, type: 'text' },
                { key: 'province', label: l.aProvince, type: 'text' },
                { key: 'postalCode', label: l.aPostalCode, type: 'text' },
                { key: 'country', label: l.aCountry, type: 'text' },
              ]}
              data={watch('addressHistory') || []}
              onAdd={handleAddAddress}
              onRemove={handleRemoveAddress}
              onUpdate={handleUpdateAddress}
              maxRows={6}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {l.q15}
            </label>
            <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
              {l.q15Note}
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
            {hasPreviousRelationships === 'yes' && (
              <div>
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  {l.q15Intro}
                </p>
                <DynamicTable
                  title={l.prevTitle}
                  columns={[
                    { key: 'lastName', label: l.pLastName, type: 'text' },
                    { key: 'firstName', label: l.pFirstName, type: 'text' },
                    { key: 'dateOfBirth', label: l.pDateOfBirth, type: 'date' },
                    { key: 'placeOfBirth', label: l.pPlaceOfBirth, type: 'text' },
                    { key: 'deathDate', label: l.pDeathDate, type: 'date' },
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

