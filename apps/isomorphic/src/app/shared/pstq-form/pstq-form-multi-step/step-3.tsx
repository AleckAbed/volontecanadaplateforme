'use client';

import { useEffect, useState, useRef } from 'react';
import { useAtom } from 'jotai';
import { toast } from 'react-hot-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import FormSummary from '@/app/shared/pstq-form/pstq-form-multi-step/form-summary';
import { pstqFormDataAtom, usePSTQStepper } from '@/app/shared/pstq-form/pstq-form-multi-step';
import { questionnaireLocaleAtom } from '@/app/shared/questionnaire-locale';
import { PSTQ_STEP3_T } from '@/app/shared/pstq-form/pstq-form-translations';
import { Input, Select, RadioGroup, AdvancedRadio, Checkbox, Button } from 'rizzui';
import {
  pstqFormBlocCSchema,
  PSTQFormBlocC,
} from '@/validators/pstq-form.schema';
import { calculatePSTQScore } from '@/services/pstq-scoring';

const niveauFrancaisOptions = Array.from({ length: 12 }, (_, i) => ({
  label: `Niveau ${i + 1}`,
  value: (i + 1).toString(),
}));

const familleLienOptions = [
  { label: 'Direct', value: 'direct' },
  { label: 'Via conjoint', value: 'via_conjoint' },
];

const scolariteOptions = [
  { label: 'Secondaire', value: 'secondaire' },
  { label: 'Postsecondaire général (2 ans)', value: 'postsec_general_2ans' },
  { label: 'Technique (3 ans)', value: 'technique_3ans' },
  { label: 'Université 1er cycle (3-4 ans)', value: 'univ_1er_cycle' },
  { label: 'Université 2e cycle', value: 'univ_2e_cycle' },
  { label: 'Université 3e cycle', value: 'univ_3e_cycle' },
];

const diplomeQuebecOptions = [
  { label: 'Aucun', value: 'aucun' },
  { label: 'Secondaire', value: 'secondaire' },
  { label: 'DEP ≥900h', value: 'dep_900h' },
  { label: 'Technique 3 ans', value: 'technique_3ans' },
  { label: 'Université 3-4 ans', value: 'univ_3_4ans' },
  { label: '2e cycle', value: '2e_cycle' },
  { label: '3e cycle', value: '3e_cycle' },
];

export default function StepThree() {
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
  } = useForm<PSTQFormBlocC>({
    resolver: zodResolver(pstqFormBlocCSchema),
    defaultValues: {
      etudes_quebec_sans_diplome_mois: formData.etudes_quebec_sans_diplome_mois || 0,
      famille_quebec: formData.famille_quebec || false,
      famille_quebec_lien: formData.famille_quebec_lien || 'direct',
      conjoint_francais_comprehension_orale: formData.conjoint_francais_comprehension_orale || 1,
      conjoint_francais_production_orale: formData.conjoint_francais_production_orale || 1,
      conjoint_francais_comprehension_ecrite: formData.conjoint_francais_comprehension_ecrite || 1,
      conjoint_francais_production_ecrite: formData.conjoint_francais_production_ecrite || 1,
      conjoint_age: formData.conjoint_age,
      conjoint_experience_quebec_mois: formData.conjoint_experience_quebec_mois || 0,
      conjoint_scolarite: formData.conjoint_scolarite || 'secondaire',
      conjoint_diplome_quebec: formData.conjoint_diplome_quebec || 'aucun',
    },
  });

  const familleQuebec = watch('famille_quebec');
  const avecConjoint = formData.avec_conjoint;
  const isInitialLoad = useRef(true);

  // Mettre à jour le formulaire quand formData change
  useEffect(() => {
    if (isInitialLoad.current) {
      reset({
        etudes_quebec_sans_diplome_mois: formData.etudes_quebec_sans_diplome_mois || 0,
        famille_quebec: formData.famille_quebec || false,
        famille_quebec_lien: formData.famille_quebec_lien || 'direct',
        conjoint_francais_comprehension_orale: formData.conjoint_francais_comprehension_orale || 1,
        conjoint_francais_production_orale: formData.conjoint_francais_production_orale || 1,
        conjoint_francais_comprehension_ecrite: formData.conjoint_francais_comprehension_ecrite || 1,
        conjoint_francais_production_ecrite: formData.conjoint_francais_production_ecrite || 1,
        conjoint_age: formData.conjoint_age,
        conjoint_experience_quebec_mois: formData.conjoint_experience_quebec_mois || 0,
        conjoint_scolarite: formData.conjoint_scolarite || 'secondaire',
        conjoint_diplome_quebec: formData.conjoint_diplome_quebec || 'aucun',
      });
      isInitialLoad.current = false;
    }
  }, [formData, reset]);

  // Calculer le score en temps réel
  useEffect(() => {
    const formValues = watch();
    try {
      const fullData = { ...formData, ...formValues };
      const calculatedScore = calculatePSTQScore(fullData as any);
      setScore(calculatedScore);
    } catch (error) {
      console.error('Erreur lors du calcul du score:', error);
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

  const onSubmit: SubmitHandler<PSTQFormBlocC> = (data) => {
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
                    Bloc C - Facteurs d&apos;adaptation (180 points maximum)
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
            <p className="text-sm font-semibold text-white">Score actuel (Bloc C):</p>
            <p className="text-2xl font-bold text-white">{score.blocC.total} / 180 points</p>
            <div className="mt-2 text-xs text-white/80">
              Études QC: {score.blocC.etudes_quebec} | Famille: {score.blocC.famille} | Conjoint: {score.blocC.conjoint}
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
          {/* C1. Études au Québec sans diplôme */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              C1. Études au Québec sans diplôme
            </h3>
            <Input
              label="Durée en mois"
              type="number"
              placeholder="Ex: 12"
              {...register('etudes_quebec_sans_diplome_mois', { valueAsNumber: true })}
              error={errors.etudes_quebec_sans_diplome_mois?.message}
            />
          </div>

          {/* C2. Famille au Québec */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              C2. Famille au Québec
            </h3>
            <div className="mb-4">
              <Controller
                name="famille_quebec"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Checkbox
                    label="J'ai de la famille au Québec"
                    checked={value || false}
                    onChange={(e) => onChange(e.target.checked)}
                  />
                )}
              />
            </div>
            {familleQuebec && (
              <Controller
                name="famille_quebec_lien"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Select
                    label="Lien de parenté"
                    placeholder="Sélectionner"
                    options={familleLienOptions}
                    value={value}
                    onChange={(selected) => onChange(typeof selected === 'string' ? selected : selected?.value || '')}
                    getOptionValue={(option) => option.value}
                    displayValue={(selected) => {
                      const option = familleLienOptions.find((opt) => opt.value === selected);
                      return option?.label || '';
                    }}
                    error={errors.famille_quebec_lien?.message}
                  />
                )}
              />
            )}
          </div>

          {/* C3. Profil du conjoint */}
          {avecConjoint && (
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                C3. Profil du conjoint
              </h3>
              <div className="grid gap-6">
                <div>
                  <h4 className="mb-3 text-base font-medium text-gray-700 dark:text-gray-300">
                    Connaissance du français
                  </h4>
                  <div className="grid gap-4 @3xl:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Compréhension orale (1-12)
                      </label>
                      <Controller
                        name="conjoint_francais_comprehension_orale"
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
                            error={errors.conjoint_francais_comprehension_orale?.message}
                          />
                        )}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Production orale (1-12)
                      </label>
                      <Controller
                        name="conjoint_francais_production_orale"
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
                            error={errors.conjoint_francais_production_orale?.message}
                          />
                        )}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Compréhension écrite (1-12)
                      </label>
                      <Controller
                        name="conjoint_francais_comprehension_ecrite"
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
                            error={errors.conjoint_francais_comprehension_ecrite?.message}
                          />
                        )}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Production écrite (1-12)
                      </label>
                      <Controller
                        name="conjoint_francais_production_ecrite"
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
                            error={errors.conjoint_francais_production_ecrite?.message}
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 @3xl:grid-cols-2">
                  <div>
                    <Input
                      label="Âge"
                      type="number"
                      placeholder="Ex: 30"
                      {...register('conjoint_age', { valueAsNumber: true })}
                      error={errors.conjoint_age?.message}
                    />
                  </div>
                  <div>
                    <Input
                      label="Expérience au Québec (mois)"
                      type="number"
                      placeholder="Ex: 24"
                      {...register('conjoint_experience_quebec_mois', { valueAsNumber: true })}
                      error={errors.conjoint_experience_quebec_mois?.message}
                    />
                  </div>
                </div>
                <div className="grid gap-4 @3xl:grid-cols-2">
                  <div>
                    <Controller
                      name="conjoint_scolarite"
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <Select
                          label="Niveau de scolarité"
                          placeholder="Sélectionner"
                          options={scolariteOptions}
                          value={value}
                          onChange={(selected) => onChange(typeof selected === 'string' ? selected : selected?.value || '')}
                          getOptionValue={(option) => option.value}
                          displayValue={(selected) => {
                            const option = scolariteOptions.find((opt) => opt.value === selected);
                            return option?.label || '';
                          }}
                          error={errors.conjoint_scolarite?.message}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <Controller
                      name="conjoint_diplome_quebec"
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <Select
                          label="Diplôme obtenu au Québec"
                          placeholder="Sélectionner"
                          options={diplomeQuebecOptions}
                          value={value}
                          onChange={(selected) => onChange(typeof selected === 'string' ? selected : selected?.value || '')}
                          getOptionValue={(option) => option.value}
                          displayValue={(selected) => {
                            const option = diplomeQuebecOptions.find((opt) => opt.value === selected);
                            return option?.label || '';
                          }}
                          error={errors.conjoint_diplome_quebec?.message}
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </form>
    </>
  );
}



