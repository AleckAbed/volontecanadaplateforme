'use client';

import { useEffect, useState, useRef } from 'react';
import { useAtom } from 'jotai';
import { toast } from 'react-hot-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import FormSummary from '@/app/shared/pstq-form/pstq-form-multi-step/form-summary';
import { pstqFormDataAtom, usePSTQStepper } from '@/app/shared/pstq-form/pstq-form-multi-step';
import { questionnaireLocaleAtom } from '@/app/shared/questionnaire-locale';
import { PSTQ_STEP2_T } from '@/app/shared/pstq-form/pstq-form-translations';
import { Input, Select, RadioGroup, AdvancedRadio, Checkbox, Button } from 'rizzui';
import {
  pstqFormBlocBSchema,
  PSTQFormBlocB,
} from '@/validators/pstq-form.schema';
import { calculatePSTQScore } from '@/services/pstq-scoring';

const PSTQ_STEP2_LABELS = {
  fr: {
    alert: 'Bloc B - Réponse aux besoins du Québec (700 points maximum)',
    scoreLabel: 'Score actuel (Bloc B):',
    scorePoints: '/ 700 points',
    scoreProfession: 'Profession',
    scoreDiplome: 'Diplôme QC',
    scoreExpQc: 'Expérience QC',
    b1Title: 'B1. Profession principale + diagnostic',
    cnpCode: 'Code CNP',
    cnpPlaceholder: 'Ex: 2171',
    diagnostic: 'Diagnostic',
    select: 'Sélectionner',
    diagEquilibre: 'Équilibre',
    diagLeger: 'Léger déficit',
    diagDeficit: 'Déficit',
    expProfMois: 'Expérience professionnelle (mois)',
    expProfPlaceholder: 'Ex: 36',
    b2Title: 'B2. Diplôme obtenu au Québec',
    diplomeAucun: 'Aucun',
    diplomeSecondaire: 'Secondaire',
    diplomeDep900: 'DEP ≥900h',
    diplomeTechnique: 'Technique 3 ans',
    diplomeUniv: 'Université 3-4 ans',
    diplome2: '2e cycle',
    diplome3: '3e cycle',
    b3Title: 'B3. Expérience de travail au Québec',
    durationMonths: 'Durée en mois',
    durationPlaceholder: 'Ex: 24',
    b4Title: 'B4. Expérience hors Montréal',
    residenceMonths: 'Résidence (mois)',
    workMonths: 'Travail (mois)',
    studyMonths: 'Études (mois)',
    extPlaceholder: 'Ex: 48',
    b5Title: "B5. Offre d'emploi validée",
    offreLabel: "J'ai une offre d'emploi validée",
    offreLieu: 'Lieu',
    lieuMontreal: 'Montréal',
    lieuHorsMontreal: 'Hors Montréal',
    b6Title: "B6. Autorisation d'exercer",
    autorisationLabel: "J'ai un permis ou une reconnaissance partielle/complète",
  },
  en: {
    alert: "Block B - Response to Quebec's needs (700 points maximum)",
    scoreLabel: 'Current score (Block B):',
    scorePoints: '/ 700 points',
    scoreProfession: 'Profession',
    scoreDiplome: 'QC Diploma',
    scoreExpQc: 'QC Experience',
    b1Title: 'B1. Main profession + diagnostic',
    cnpCode: 'NOC code',
    cnpPlaceholder: 'E.g. 2171',
    diagnostic: 'Diagnostic',
    select: 'Select',
    diagEquilibre: 'Balanced',
    diagLeger: 'Slight deficit',
    diagDeficit: 'Deficit',
    expProfMois: 'Professional experience (months)',
    expProfPlaceholder: 'E.g. 36',
    b2Title: 'B2. Diploma obtained in Quebec',
    diplomeAucun: 'None',
    diplomeSecondaire: 'Secondary',
    diplomeDep900: 'DEP ≥900h',
    diplomeTechnique: 'Technical 3 years',
    diplomeUniv: 'University 3-4 years',
    diplome2: '2nd cycle',
    diplome3: '3rd cycle',
    b3Title: 'B3. Work experience in Quebec',
    durationMonths: 'Duration in months',
    durationPlaceholder: 'E.g. 24',
    b4Title: 'B4. Experience outside Montreal',
    residenceMonths: 'Residence (months)',
    workMonths: 'Work (months)',
    studyMonths: 'Studies (months)',
    extPlaceholder: 'E.g. 48',
    b5Title: 'B5. Validated job offer',
    offreLabel: 'I have a validated job offer',
    offreLieu: 'Location',
    lieuMontreal: 'Montreal',
    lieuHorsMontreal: 'Outside Montreal',
    b6Title: 'B6. Authorization to practice',
    autorisationLabel: 'I have a permit or partial/full recognition',
  },
  es: {
    alert: 'Bloque B - Respuesta a las necesidades de Quebec (700 puntos máximo)',
    scoreLabel: 'Puntaje actual (Bloque B):',
    scorePoints: '/ 700 puntos',
    scoreProfession: 'Profesión',
    scoreDiplome: 'Diploma QC',
    scoreExpQc: 'Experiencia QC',
    b1Title: 'B1. Profesión principal + diagnóstico',
    cnpCode: 'Código NOC',
    cnpPlaceholder: 'Ej: 2171',
    diagnostic: 'Diagnóstico',
    select: 'Seleccionar',
    diagEquilibre: 'Equilibrio',
    diagLeger: 'Déficit leve',
    diagDeficit: 'Déficit',
    expProfMois: 'Experiencia profesional (meses)',
    expProfPlaceholder: 'Ej: 36',
    b2Title: 'B2. Diploma obtenido en Quebec',
    diplomeAucun: 'Ninguno',
    diplomeSecondaire: 'Secundaria',
    diplomeDep900: 'DEP ≥900h',
    diplomeTechnique: 'Técnica 3 años',
    diplomeUniv: 'Universidad 3-4 años',
    diplome2: '2do ciclo',
    diplome3: '3er ciclo',
    b3Title: 'B3. Experiencia laboral en Quebec',
    durationMonths: 'Duración en meses',
    durationPlaceholder: 'Ej: 24',
    b4Title: 'B4. Experiencia fuera de Montreal',
    residenceMonths: 'Residencia (meses)',
    workMonths: 'Trabajo (meses)',
    studyMonths: 'Estudios (meses)',
    extPlaceholder: 'Ej: 48',
    b5Title: 'B5. Oferta de empleo validada',
    offreLabel: 'Tengo una oferta de empleo validada',
    offreLieu: 'Lugar',
    lieuMontreal: 'Montreal',
    lieuHorsMontreal: 'Fuera de Montreal',
    b6Title: 'B6. Autorización para ejercer',
    autorisationLabel: 'Tengo un permiso o reconocimiento parcial/completo',
  },
} as const;

export default function StepTwo() {
  const { step, gotoNextStep } = usePSTQStepper();
  const [formData, setFormData] = useAtom(pstqFormDataAtom);
  const [locale] = useAtom(questionnaireLocaleAtom);
  const t = PSTQ_STEP2_T[locale] || PSTQ_STEP2_T.fr;
  const l = PSTQ_STEP2_LABELS[locale] || PSTQ_STEP2_LABELS.fr;
  const diagnosticOptions = [
    { label: l.diagEquilibre, value: 'equilibre' },
    { label: l.diagLeger, value: 'leger_deficit' },
    { label: l.diagDeficit, value: 'deficit' },
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
  const offreEmploiLieuOptions = [
    { label: l.lieuMontreal, value: 'montreal' },
    { label: l.lieuHorsMontreal, value: 'hors_montreal' },
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
  } = useForm<PSTQFormBlocB>({
    resolver: zodResolver(pstqFormBlocBSchema),
    defaultValues: {
      cnp_code: formData.cnp_code || '',
      diagnostic: formData.diagnostic || 'equilibre',
      experience_profession_mois: formData.experience_profession_mois || 0,
      diplome_quebec: formData.diplome_quebec || 'aucun',
      experience_quebec_mois: formData.experience_quebec_mois || 0,
      residence_hors_montreal_mois: formData.residence_hors_montreal_mois || 0,
      travail_hors_montreal_mois: formData.travail_hors_montreal_mois || 0,
      etudes_hors_montreal_mois: formData.etudes_hors_montreal_mois || 0,
      offre_emploi: formData.offre_emploi || false,
      offre_emploi_lieu: formData.offre_emploi_lieu || 'montreal',
      autorisation_exercer: formData.autorisation_exercer || false,
    },
  });

  const offreEmploi = watch('offre_emploi');
  const isInitialLoad = useRef(true);

  // Mettre à jour le formulaire quand formData change
  useEffect(() => {
    if (isInitialLoad.current) {
      reset({
        cnp_code: formData.cnp_code || '',
        diagnostic: formData.diagnostic || 'equilibre',
        experience_profession_mois: formData.experience_profession_mois || 0,
        diplome_quebec: formData.diplome_quebec || 'aucun',
        experience_quebec_mois: formData.experience_quebec_mois || 0,
        residence_hors_montreal_mois: formData.residence_hors_montreal_mois || 0,
        travail_hors_montreal_mois: formData.travail_hors_montreal_mois || 0,
        etudes_hors_montreal_mois: formData.etudes_hors_montreal_mois || 0,
        offre_emploi: formData.offre_emploi || false,
        offre_emploi_lieu: formData.offre_emploi_lieu || 'montreal',
        autorisation_exercer: formData.autorisation_exercer || false,
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

  const onSubmit: SubmitHandler<PSTQFormBlocB> = (data) => {
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
            <p className="text-2xl font-bold text-white">{score.blocB.total} {l.scorePoints}</p>
            <div className="mt-2 text-xs text-white/80">
              {l.scoreProfession}: {score.blocB.profession} | {l.scoreDiplome}: {score.blocB.diplome_quebec} | {l.scoreExpQc}: {score.blocB.experience_quebec}
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
              {l.b1Title}
            </h3>
            <div className="grid gap-4 @3xl:grid-cols-2">
              <div>
                <Input
                  label={l.cnpCode}
                  placeholder={l.cnpPlaceholder}
                  {...register('cnp_code')}
                  error={errors.cnp_code?.message}
                />
              </div>
              <div>
                <Controller
                  name="diagnostic"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <Select
                      label={l.diagnostic}
                      placeholder={l.select}
                      options={diagnosticOptions}
                      value={value}
                      onChange={(selected) => onChange(typeof selected === 'string' ? selected : selected?.value || '')}
                      getOptionValue={(option) => option.value}
                      displayValue={(selected) => {
                        const option = diagnosticOptions.find((opt) => opt.value === selected);
                        return option?.label || '';
                      }}
                      error={errors.diagnostic?.message}
                    />
                  )}
                />
              </div>
              <div>
                <Input
                  label={l.expProfMois}
                  type="number"
                  placeholder={l.expProfPlaceholder}
                  {...register('experience_profession_mois', { valueAsNumber: true })}
                  error={errors.experience_profession_mois?.message}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {l.b2Title}
            </h3>
            <Controller
              name="diplome_quebec"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Select
                  placeholder={l.select}
                  options={diplomeQuebecOptions}
                  value={value}
                  onChange={(selected) => onChange(typeof selected === 'string' ? selected : selected?.value || '')}
                  getOptionValue={(option) => option.value}
                  displayValue={(selected) => {
                    const option = diplomeQuebecOptions.find((opt) => opt.value === selected);
                    return option?.label || '';
                  }}
                  error={errors.diplome_quebec?.message}
                />
              )}
            />
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {l.b3Title}
            </h3>
            <Input
              label={l.durationMonths}
              type="number"
              placeholder={l.durationPlaceholder}
              {...register('experience_quebec_mois', { valueAsNumber: true })}
              error={errors.experience_quebec_mois?.message}
            />
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {l.b4Title}
            </h3>
            <div className="grid gap-4 @3xl:grid-cols-3">
              <Input
                label={l.residenceMonths}
                type="number"
                placeholder={l.extPlaceholder}
                {...register('residence_hors_montreal_mois', { valueAsNumber: true })}
                error={errors.residence_hors_montreal_mois?.message}
              />
              <Input
                label={l.workMonths}
                type="number"
                placeholder={l.extPlaceholder}
                {...register('travail_hors_montreal_mois', { valueAsNumber: true })}
                error={errors.travail_hors_montreal_mois?.message}
              />
              <Input
                label={l.studyMonths}
                type="number"
                placeholder={l.extPlaceholder}
                {...register('etudes_hors_montreal_mois', { valueAsNumber: true })}
                error={errors.etudes_hors_montreal_mois?.message}
              />
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {l.b5Title}
            </h3>
            <div className="mb-4">
              <Controller
                name="offre_emploi"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Checkbox
                    label={l.offreLabel}
                    checked={value || false}
                    onChange={(e) => onChange(e.target.checked)}
                  />
                )}
              />
            </div>
            {offreEmploi && (
              <Controller
                name="offre_emploi_lieu"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Select
                    label={l.offreLieu}
                    placeholder={l.select}
                    options={offreEmploiLieuOptions}
                    value={value}
                    onChange={(selected) => onChange(typeof selected === 'string' ? selected : selected?.value || '')}
                    getOptionValue={(option) => option.value}
                    displayValue={(selected) => {
                      const option = offreEmploiLieuOptions.find((opt) => opt.value === selected);
                      return option?.label || '';
                    }}
                    error={errors.offre_emploi_lieu?.message}
                  />
                )}
              />
            )}
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {l.b6Title}
            </h3>
            <Controller
              name="autorisation_exercer"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Checkbox
                  label={l.autorisationLabel}
                  checked={value || false}
                  onChange={(e) => onChange(e.target.checked)}
                />
              )}
            />
          </div>
        </div>
      </form>
    </>
  );
}

