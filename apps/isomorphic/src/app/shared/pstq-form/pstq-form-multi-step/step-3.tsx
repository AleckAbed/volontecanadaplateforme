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

const STEP3_LABELS = {
  fr: {
    alert: "Bloc C - Facteurs d'adaptation (180 points maximum)",
    scoreLabel: 'Score actuel (Bloc C):',
    scorePoints: '/ 180 points',
    etudesQc: 'Études QC',
    famille: 'Famille',
    conjoint: 'Conjoint',
    c1Title: 'C1. Études au Québec sans diplôme',
    durationMonths: 'Durée en mois',
    durationPlaceholder: 'Ex: 12',
    c2Title: 'C2. Famille au Québec',
    familleCheckbox: "J'ai de la famille au Québec",
    familleLien: 'Lien de parenté',
    select: 'Sélectionner',
    direct: 'Direct',
    viaConjoint: 'Via conjoint',
    c3Title: 'C3. Profil du conjoint',
    franchais: 'Connaissance du français',
    listening: 'Compréhension orale (1-12)',
    speaking: 'Production orale (1-12)',
    reading: 'Compréhension écrite (1-12)',
    writing: 'Production écrite (1-12)',
    age: 'Âge',
    agePlaceholder: 'Ex: 30',
    expQc: 'Expérience au Québec (mois)',
    expQcPlaceholder: 'Ex: 24',
    niveauScolarite: 'Niveau de scolarité',
    diplomeQc: 'Diplôme obtenu au Québec',
    level: 'Niveau',
    eduSecondaire: 'Secondaire',
    eduPostsec: 'Postsecondaire général (2 ans)',
    eduTechnique: 'Technique (3 ans)',
    eduUniv1: 'Université 1er cycle (3-4 ans)',
    eduUniv2: 'Université 2e cycle',
    eduUniv3: 'Université 3e cycle',
    diplomeAucun: 'Aucun',
    diplomeSecondaire: 'Secondaire',
    diplomeDep900: 'DEP ≥900h',
    diplomeTechnique: 'Technique 3 ans',
    diplomeUniv: 'Université 3-4 ans',
    diplome2: '2e cycle',
    diplome3: '3e cycle',
  },
  en: {
    alert: 'Block C - Adaptability factors (180 points maximum)',
    scoreLabel: 'Current score (Block C):',
    scorePoints: '/ 180 points',
    etudesQc: 'QC Studies',
    famille: 'Family',
    conjoint: 'Spouse',
    c1Title: 'C1. Studies in Quebec without diploma',
    durationMonths: 'Duration in months',
    durationPlaceholder: 'E.g. 12',
    c2Title: 'C2. Family in Quebec',
    familleCheckbox: 'I have family in Quebec',
    familleLien: 'Family relationship',
    select: 'Select',
    direct: 'Direct',
    viaConjoint: 'Via spouse',
    c3Title: 'C3. Spouse profile',
    franchais: 'French language proficiency',
    listening: 'Listening comprehension (1-12)',
    speaking: 'Oral production (1-12)',
    reading: 'Reading comprehension (1-12)',
    writing: 'Written production (1-12)',
    age: 'Age',
    agePlaceholder: 'E.g. 30',
    expQc: 'Quebec experience (months)',
    expQcPlaceholder: 'E.g. 24',
    niveauScolarite: 'Level of education',
    diplomeQc: 'Diploma obtained in Quebec',
    level: 'Level',
    eduSecondaire: 'Secondary',
    eduPostsec: 'General post-secondary (2 years)',
    eduTechnique: 'Technical (3 years)',
    eduUniv1: 'University 1st cycle (3-4 years)',
    eduUniv2: 'University 2nd cycle',
    eduUniv3: 'University 3rd cycle',
    diplomeAucun: 'None',
    diplomeSecondaire: 'Secondary',
    diplomeDep900: 'DEP ≥900h',
    diplomeTechnique: 'Technical 3 years',
    diplomeUniv: 'University 3-4 years',
    diplome2: '2nd cycle',
    diplome3: '3rd cycle',
  },
  es: {
    alert: 'Bloque C - Factores de adaptación (180 puntos máximo)',
    scoreLabel: 'Puntaje actual (Bloque C):',
    scorePoints: '/ 180 puntos',
    etudesQc: 'Estudios QC',
    famille: 'Familia',
    conjoint: 'Cónyuge',
    c1Title: 'C1. Estudios en Quebec sin diploma',
    durationMonths: 'Duración en meses',
    durationPlaceholder: 'Ej: 12',
    c2Title: 'C2. Familia en Quebec',
    familleCheckbox: 'Tengo familia en Quebec',
    familleLien: 'Vínculo de parentesco',
    select: 'Seleccionar',
    direct: 'Directo',
    viaConjoint: 'Vía cónyuge',
    c3Title: 'C3. Perfil del cónyuge',
    franchais: 'Conocimiento del francés',
    listening: 'Comprensión oral (1-12)',
    speaking: 'Producción oral (1-12)',
    reading: 'Comprensión escrita (1-12)',
    writing: 'Producción escrita (1-12)',
    age: 'Edad',
    agePlaceholder: 'Ej: 30',
    expQc: 'Experiencia en Quebec (meses)',
    expQcPlaceholder: 'Ej: 24',
    niveauScolarite: 'Nivel de estudios',
    diplomeQc: 'Diploma obtenido en Quebec',
    level: 'Nivel',
    eduSecondaire: 'Secundaria',
    eduPostsec: 'Postsecundaria general (2 años)',
    eduTechnique: 'Técnica (3 años)',
    eduUniv1: 'Universidad 1er ciclo (3-4 años)',
    eduUniv2: 'Universidad 2do ciclo',
    eduUniv3: 'Universidad 3er ciclo',
    diplomeAucun: 'Ninguno',
    diplomeSecondaire: 'Secundaria',
    diplomeDep900: 'DEP ≥900h',
    diplomeTechnique: 'Técnica 3 años',
    diplomeUniv: 'Universidad 3-4 años',
    diplome2: '2do ciclo',
    diplome3: '3er ciclo',
  },
} as const;

export default function StepThree() {
  const { step, gotoNextStep } = usePSTQStepper();
  const [formData, setFormData] = useAtom(pstqFormDataAtom);
  const [locale] = useAtom(questionnaireLocaleAtom);
  const t = PSTQ_STEP3_T[locale] || PSTQ_STEP3_T.fr;
  const l = STEP3_LABELS[locale] || STEP3_LABELS.fr;
  const niveauFrancaisOptions = Array.from({ length: 12 }, (_, i) => ({
    label: `${l.level} ${i + 1}`,
    value: (i + 1).toString(),
  }));
  const familleLienOptions = [
    { label: l.direct, value: 'direct' },
    { label: l.viaConjoint, value: 'via_conjoint' },
  ];
  const scolariteOptions = [
    { label: l.eduSecondaire, value: 'secondaire' },
    { label: l.eduPostsec, value: 'postsec_general_2ans' },
    { label: l.eduTechnique, value: 'technique_3ans' },
    { label: l.eduUniv1, value: 'univ_1er_cycle' },
    { label: l.eduUniv2, value: 'univ_2e_cycle' },
    { label: l.eduUniv3, value: 'univ_3e_cycle' },
  ];
  const diplomeQuebecOptions = [
    { label: l.diplomeAucun, value: 'aucun' },
    { label: l.diplomeSecondaire, value: 'secondaire' },
    { label: l.diplomeDep900, value: 'dep_900h' },
    { label: l.diplomeTechnique, value: 'technique_3ans' },
    { label: l.diplomeUniv, value: 'univ_3_4ans' },
    { label: l.diplome2, value: '2e_cycle' },
    { label: l.diplome3, value: '3e_cycle' },
  ];
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

        {/* Affichage du score en temps réel */}
        {score && (
          <div className="mt-6 rounded-lg bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-sm font-semibold text-white">{l.scoreLabel}</p>
            <p className="text-2xl font-bold text-white">{score.blocC.total} {l.scorePoints}</p>
            <div className="mt-2 text-xs text-white/80">
              {l.etudesQc}: {score.blocC.etudes_quebec} | {l.famille}: {score.blocC.famille} | {l.conjoint}: {score.blocC.conjoint}
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
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {l.c1Title}
            </h3>
            <Input
              label={l.durationMonths}
              type="number"
              placeholder={l.durationPlaceholder}
              {...register('etudes_quebec_sans_diplome_mois', { valueAsNumber: true })}
              error={errors.etudes_quebec_sans_diplome_mois?.message}
            />
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {l.c2Title}
            </h3>
            <div className="mb-4">
              <Controller
                name="famille_quebec"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Checkbox
                    label={l.familleCheckbox}
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
                    label={l.familleLien}
                    placeholder={l.select}
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

          {avecConjoint && (
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                {l.c3Title}
              </h3>
              <div className="grid gap-6">
                <div>
                  <h4 className="mb-3 text-base font-medium text-gray-700 dark:text-gray-300">
                    {l.franchais}
                  </h4>
                  <div className="grid gap-4 @3xl:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {l.listening}
                      </label>
                      <Controller
                        name="conjoint_francais_comprehension_orale"
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
                            error={errors.conjoint_francais_comprehension_orale?.message}
                          />
                        )}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {l.speaking}
                      </label>
                      <Controller
                        name="conjoint_francais_production_orale"
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
                            error={errors.conjoint_francais_production_orale?.message}
                          />
                        )}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {l.reading}
                      </label>
                      <Controller
                        name="conjoint_francais_comprehension_ecrite"
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
                            error={errors.conjoint_francais_comprehension_ecrite?.message}
                          />
                        )}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {l.writing}
                      </label>
                      <Controller
                        name="conjoint_francais_production_ecrite"
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
                      label={l.age}
                      type="number"
                      placeholder={l.agePlaceholder}
                      {...register('conjoint_age', { valueAsNumber: true })}
                      error={errors.conjoint_age?.message}
                    />
                  </div>
                  <div>
                    <Input
                      label={l.expQc}
                      type="number"
                      placeholder={l.expQcPlaceholder}
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
                          label={l.niveauScolarite}
                          placeholder={l.select}
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
                          label={l.diplomeQc}
                          placeholder={l.select}
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



