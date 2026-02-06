'use client';

import { useEffect, useState, useRef } from 'react';
import { useAtom } from 'jotai';
import { toast } from 'react-hot-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import FormSummary from '@/app/shared/pstq-form/pstq-form-multi-step/form-summary';
import { pstqFormDataAtom, usePSTQStepper } from '@/app/shared/pstq-form/pstq-form-multi-step';
import { Input, Select, RadioGroup, AdvancedRadio, Button } from 'rizzui';
import {
  pstqFormBlocASchema,
  PSTQFormBlocA,
} from '@/validators/pstq-form.schema';
import DateField from '@/app/shared/client-form/date-field';
import { calculatePSTQScore } from '@/services/pstq-scoring';

const niveauFrancaisOptions = Array.from({ length: 12 }, (_, i) => ({
  label: `Niveau ${i + 1}`,
  value: (i + 1).toString(),
}));

const scolariteOptions = [
  { label: 'Secondaire', value: 'secondaire' },
  { label: 'Postsecondaire général (2 ans)', value: 'postsec_general_2ans' },
  { label: 'Technique (3 ans)', value: 'technique_3ans' },
  { label: 'Université 1er cycle (3-4 ans)', value: 'univ_1er_cycle' },
  { label: 'Université 2e cycle', value: 'univ_2e_cycle' },
  { label: 'Université 3e cycle', value: 'univ_3e_cycle' },
];

export default function StepOne() {
  const { step, gotoNextStep } = usePSTQStepper();
  const [formData, setFormData] = useAtom(pstqFormDataAtom);
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
          title="Bloc A - Capital humain"
          description="Renseignements sur votre capital humain (français, âge, expérience, scolarité)"
        />

        {/* Affichage du score en temps réel */}
        {score && (
          <div className="mt-6 rounded-lg bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-sm font-semibold text-white">Score actuel (Bloc A):</p>
            <p className="text-2xl font-bold text-white">{score.blocA.total} / 520 points</p>
            <div className="mt-2 text-xs text-white/80">
              Français: {score.blocA.francais} | Âge: {score.blocA.age} | Expérience: {score.blocA.experience} | Scolarité: {score.blocA.scolarite}
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
              A1. Connaissance du français
            </h3>
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Avez-vous un conjoint ?
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
            </div>
            <div className="grid gap-4 @3xl:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Compréhension orale (1-12)
                </label>
                <Controller
                  name="comprehension_orale"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <Select
                      placeholder="Sélectionner"
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
                  Production orale (1-12)
                </label>
                <Controller
                  name="production_orale"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <Select
                      placeholder="Sélectionner"
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
                  Compréhension écrite (1-12)
                </label>
                <Controller
                  name="comprehension_ecrite"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <Select
                      placeholder="Sélectionner"
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
                  Production écrite (1-12)
                </label>
                <Controller
                  name="production_ecrite"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <Select
                      placeholder="Sélectionner"
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
              A2. Date de naissance
            </h3>
            <DateField
              name="date_naissance"
              control={control}
              label="Date de naissance (JJ/MM/AAAA)"
              error={errors.date_naissance}
            />
          </div>

          {/* A3. Expérience de travail */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              A3. Expérience de travail (5 dernières années)
            </h3>
            <Input
              label="Durée en mois"
              type="number"
              placeholder="Ex: 36"
              {...register('experience_travail_mois', { valueAsNumber: true })}
              error={errors.experience_travail_mois?.message}
            />
          </div>

          {/* A4. Niveau de scolarité */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              A4. Niveau de scolarité (plus élevé retenu)
            </h3>
            <Controller
              name="niveau_scolarite"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Select
                  placeholder="Sélectionner"
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



