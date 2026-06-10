'use client';

import { useEffect, useState, useRef } from 'react';
import { useAtom } from 'jotai';
import { toast } from 'react-hot-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import FormSummary from '@/app/shared/pstq-form/pstq-form-multi-step/form-summary';
import { pstqFormDataAtom, usePSTQStepper } from '@/app/shared/pstq-form/pstq-form-multi-step';
import { questionnaireLocaleAtom } from '@/app/shared/questionnaire-locale';
import { PSTQ_STEP1_T } from '@/app/shared/pstq-form/pstq-form-translations';
import { Input, Select, RadioGroup, AdvancedRadio, Button } from 'rizzui';
import {
  pstqFormBlocASchema,
  PSTQFormBlocA,
} from '@/validators/pstq-form.schema';
import DateField from '@/app/shared/client-form/date-field';
import { calculatePSTQScore } from '@/services/pstq-scoring';

const PSTQ_STEP1_LABELS = {
  fr: {
    scoreLabel: 'Score actuel (Bloc A):',
    scorePoints: '/ 520 points',
    scoreFr: 'Français',
    scoreAge: 'Âge',
    scoreExp: 'Expérience',
    scoreEdu: 'Scolarité',
    a1Title: 'A1. Connaissance du français',
    hasSpouse: 'Avez-vous un conjoint ?',
    yes: 'Oui',
    no: 'Non',
    listening: 'Compréhension orale (1-12)',
    speaking: 'Production orale (1-12)',
    reading: 'Compréhension écrite (1-12)',
    writing: 'Production écrite (1-12)',
    select: 'Sélectionner',
    a2Title: 'A2. Date de naissance',
    dobLabel: 'Date de naissance (JJ/MM/AAAA)',
    a3Title: 'A3. Expérience de travail (5 dernières années)',
    durationMonths: 'Durée en mois',
    durationPlaceholder: 'Ex: 36',
    a4Title: 'A4. Niveau de scolarité (plus élevé retenu)',
    level: 'Niveau',
    eduSecondaire: 'Secondaire',
    eduPostsec: 'Postsecondaire général (2 ans)',
    eduTechnique: 'Technique (3 ans)',
    eduUniv1: 'Université 1er cycle (3-4 ans)',
    eduUniv2: 'Université 2e cycle',
    eduUniv3: 'Université 3e cycle',
  },
  en: {
    scoreLabel: 'Current score (Block A):',
    scorePoints: '/ 520 points',
    scoreFr: 'French',
    scoreAge: 'Age',
    scoreExp: 'Experience',
    scoreEdu: 'Education',
    a1Title: 'A1. French language proficiency',
    hasSpouse: 'Do you have a spouse?',
    yes: 'Yes',
    no: 'No',
    listening: 'Listening comprehension (1-12)',
    speaking: 'Oral production (1-12)',
    reading: 'Reading comprehension (1-12)',
    writing: 'Written production (1-12)',
    select: 'Select',
    a2Title: 'A2. Date of birth',
    dobLabel: 'Date of birth (DD/MM/YYYY)',
    a3Title: 'A3. Work experience (last 5 years)',
    durationMonths: 'Duration in months',
    durationPlaceholder: 'E.g. 36',
    a4Title: 'A4. Level of education (highest retained)',
    level: 'Level',
    eduSecondaire: 'Secondary',
    eduPostsec: 'General post-secondary (2 years)',
    eduTechnique: 'Technical (3 years)',
    eduUniv1: 'University 1st cycle (3-4 years)',
    eduUniv2: 'University 2nd cycle',
    eduUniv3: 'University 3rd cycle',
  },
  es: {
    scoreLabel: 'Puntaje actual (Bloque A):',
    scorePoints: '/ 520 puntos',
    scoreFr: 'Francés',
    scoreAge: 'Edad',
    scoreExp: 'Experiencia',
    scoreEdu: 'Estudios',
    a1Title: 'A1. Conocimiento del francés',
    hasSpouse: '¿Tiene cónyuge?',
    yes: 'Sí',
    no: 'No',
    listening: 'Comprensión oral (1-12)',
    speaking: 'Producción oral (1-12)',
    reading: 'Comprensión escrita (1-12)',
    writing: 'Producción escrita (1-12)',
    select: 'Seleccionar',
    a2Title: 'A2. Fecha de nacimiento',
    dobLabel: 'Fecha de nacimiento (DD/MM/AAAA)',
    a3Title: 'A3. Experiencia laboral (últimos 5 años)',
    durationMonths: 'Duración en meses',
    durationPlaceholder: 'Ej: 36',
    a4Title: 'A4. Nivel de estudios (más alto retenido)',
    level: 'Nivel',
    eduSecondaire: 'Secundaria',
    eduPostsec: 'Postsecundaria general (2 años)',
    eduTechnique: 'Técnica (3 años)',
    eduUniv1: 'Universidad 1er ciclo (3-4 años)',
    eduUniv2: 'Universidad 2do ciclo',
    eduUniv3: 'Universidad 3er ciclo',
  },
} as const;

function buildNiveauOptions(levelLabel: string) {
  return Array.from({ length: 12 }, (_, i) => ({
    label: `${levelLabel} ${i + 1}`,
    value: (i + 1).toString(),
  }));
}

function buildScolariteOptions(l: typeof PSTQ_STEP1_LABELS.fr) {
  return [
    { label: l.eduSecondaire, value: 'secondaire' },
    { label: l.eduPostsec, value: 'postsec_general_2ans' },
    { label: l.eduTechnique, value: 'technique_3ans' },
    { label: l.eduUniv1, value: 'univ_1er_cycle' },
    { label: l.eduUniv2, value: 'univ_2e_cycle' },
    { label: l.eduUniv3, value: 'univ_3e_cycle' },
  ];
}

export default function StepOne() {
  const { step, gotoNextStep } = usePSTQStepper();
  const [formData, setFormData] = useAtom(pstqFormDataAtom);
  const [locale] = useAtom(questionnaireLocaleAtom);
  const t = PSTQ_STEP1_T[locale] || PSTQ_STEP1_T.fr;
  const l = PSTQ_STEP1_LABELS[locale] || PSTQ_STEP1_LABELS.fr;
  const niveauFrancaisOptions = buildNiveauOptions(l.level);
  const scolariteOptions = buildScolariteOptions(l);
  const [isAlertVisible, setIsAlertVisible] = useState(true);
  const [score, setScore] = useState<any>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<PSTQFormBlocA>({
    resolver: zodResolver(pstqFormBlocASchema),
    defaultValues: {
      comprehension_orale: formData.comprehension_orale || 1,
      production_orale: formData.production_orale || 1,
      comprehension_ecrite: formData.comprehension_ecrite || 1,
      production_ecrite: formData.production_ecrite || 1,
      avec_conjoint: formData.avec_conjoint || false,
      date_naissance: formData.date_naissance || '',
      experience_travail_mois: formData.experience_travail_mois || 0,
      niveau_scolarite: formData.niveau_scolarite || 'secondaire',
    },
  });

  const avecConjoint = watch('avec_conjoint');
  const isInitialLoad = useRef(true);

  // Mettre à jour le formulaire quand formData change
  useEffect(() => {
    if (isInitialLoad.current) {
      reset({
        comprehension_orale: formData.comprehension_orale || 1,
        production_orale: formData.production_orale || 1,
        comprehension_ecrite: formData.comprehension_ecrite || 1,
        production_ecrite: formData.production_ecrite || 1,
        avec_conjoint: formData.avec_conjoint || false,
        date_naissance: formData.date_naissance || '',
        experience_travail_mois: formData.experience_travail_mois || 0,
        niveau_scolarite: formData.niveau_scolarite || 'secondaire',
      });
      isInitialLoad.current = false;
    }
  }, [formData, reset]);

  // Calculer le score en temps réel
  useEffect(() => {
    const formValues = watch();
    if (formValues.date_naissance) {
      try {
        const fullData = { ...formData, ...formValues };
        const calculatedScore = calculatePSTQScore(fullData as any);
        setScore(calculatedScore);
      } catch (error) {
        console.error('Erreur lors du calcul du score:', error);
      }
    }
  }, [watch(), formData]);

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

  const onSubmit: SubmitHandler<PSTQFormBlocA> = (data) => {
    setFormData((prev) => ({
      ...prev,
      ...data,
    }));
    gotoNextStep();
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
                    Bloc A - Capital humain (520 points maximum)
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

        {/* Affichage du score en temps réel */}
        {score && (
          <div className="mt-6 rounded-lg bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-sm font-semibold text-white">{l.scoreLabel}</p>
            <p className="text-2xl font-bold text-white">{score.blocA.total} {l.scorePoints}</p>
            <div className="mt-2 text-xs text-white/80">
              {l.scoreFr}: {score.blocA.francais} | {l.scoreAge}: {score.blocA.age} | {l.scoreExp}: {score.blocA.experience} | {l.scoreEdu}: {score.blocA.scolarite}
            </div>
          </div>
        )}
      </div>

      <form
        id={`rhf-${step.toString()}`}
        onSubmit={handleSubmit(onSubmit)}
        className="col-span-full rounded-lg bg-white p-5 @4xl:col-span-7 @4xl:p-7 dark:bg-gray-0"
      >
        <div className="grid gap-6">
          {/* A1. Connaissance du français */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {l.a1Title}
            </h3>
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {l.hasSpouse}
              </label>
              <Controller
                name="avec_conjoint"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <RadioGroup
                    value={value ? 'yes' : 'no'}
                    setValue={(val) => onChange(val === 'yes')}
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
            </div>
            <div className="grid gap-4 @3xl:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {l.listening}
                </label>
                <Controller
                  name="comprehension_orale"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <Select
                      placeholder={l.select}
                      options={niveauFrancaisOptions}
                      value={value?.toString()}
                      onChange={(selected) => onChange(parseInt(typeof selected === 'string' ? selected : selected?.value || '1'))}
                      getOptionValue={(option) => option.value}
                      displayValue={(selected) => {
                        const option = niveauFrancaisOptions.find((opt) => opt.value === selected?.toString());
                        return option?.label || '';
                      }}
                      error={errors.comprehension_orale?.message}
                    />
                  )}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {l.speaking}
                </label>
                <Controller
                  name="production_orale"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <Select
                      placeholder={l.select}
                      options={niveauFrancaisOptions}
                      value={value?.toString()}
                      onChange={(selected) => onChange(parseInt(typeof selected === 'string' ? selected : selected?.value || '1'))}
                      getOptionValue={(option) => option.value}
                      displayValue={(selected) => {
                        const option = niveauFrancaisOptions.find((opt) => opt.value === selected?.toString());
                        return option?.label || '';
                      }}
                      error={errors.production_orale?.message}
                    />
                  )}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {l.reading}
                </label>
                <Controller
                  name="comprehension_ecrite"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <Select
                      placeholder={l.select}
                      options={niveauFrancaisOptions}
                      value={value?.toString()}
                      onChange={(selected) => onChange(parseInt(typeof selected === 'string' ? selected : selected?.value || '1'))}
                      getOptionValue={(option) => option.value}
                      displayValue={(selected) => {
                        const option = niveauFrancaisOptions.find((opt) => opt.value === selected?.toString());
                        return option?.label || '';
                      }}
                      error={errors.comprehension_ecrite?.message}
                    />
                  )}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {l.writing}
                </label>
                <Controller
                  name="production_ecrite"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <Select
                      placeholder={l.select}
                      options={niveauFrancaisOptions}
                      value={value?.toString()}
                      onChange={(selected) => onChange(parseInt(typeof selected === 'string' ? selected : selected?.value || '1'))}
                      getOptionValue={(option) => option.value}
                      displayValue={(selected) => {
                        const option = niveauFrancaisOptions.find((opt) => opt.value === selected?.toString());
                        return option?.label || '';
                      }}
                      error={errors.production_ecrite?.message}
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* A2. Âge */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {l.a2Title}
            </h3>
            <DateField
              name="date_naissance"
              control={control}
              label={l.dobLabel}
              error={errors.date_naissance}
            />
          </div>

          {/* A3. Expérience de travail */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {l.a3Title}
            </h3>
            <Input
              label={l.durationMonths}
              type="number"
              placeholder={l.durationPlaceholder}
              {...register('experience_travail_mois', { valueAsNumber: true })}
              error={errors.experience_travail_mois?.message}
            />
          </div>

          {/* A4. Niveau de scolarité */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {l.a4Title}
            </h3>
            <Controller
              name="niveau_scolarite"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Select
                  placeholder={l.select}
                  options={scolariteOptions}
                  value={value}
                  onChange={(selected) => onChange(typeof selected === 'string' ? selected : selected?.value || '')}
                  getOptionValue={(option) => option.value}
                  displayValue={(selected) => {
                    const option = scolariteOptions.find((opt) => opt.value === selected);
                    return option?.label || '';
                  }}
                  error={errors.niveau_scolarite?.message}
                />
              )}
            />
          </div>
        </div>
      </form>
    </>
  );
}



