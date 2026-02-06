'use client';

import { useEffect, useState, useRef } from 'react';
import { useAtom } from 'jotai';
import { toast } from 'react-hot-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import FormSummary from '@/app/shared/pstq-form/pstq-form-multi-step/form-summary';
import { pstqFormDataAtom, usePSTQStepper } from '@/app/shared/pstq-form/pstq-form-multi-step';
import { Input, Select, RadioGroup, AdvancedRadio, Checkbox, Button } from 'rizzui';
import {
  pstqFormBlocBSchema,
  PSTQFormBlocB,
} from '@/validators/pstq-form.schema';
import { calculatePSTQScore } from '@/services/pstq-scoring';

const diagnosticOptions = [
  { label: 'Équilibre', value: 'equilibre' },
  { label: 'Léger déficit', value: 'leger_deficit' },
  { label: 'Déficit', value: 'deficit' },
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

const offreEmploiLieuOptions = [
  { label: 'Montréal', value: 'montreal' },
  { label: 'Hors Montréal', value: 'hors_montreal' },
];

export default function StepTwo() {
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
                    Bloc B - Réponse aux besoins du Québec (700 points maximum)
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
          title="Bloc B - Réponse aux besoins du Québec"
          description="Renseignements sur votre réponse aux besoins du Québec"
        />

        {/* Affichage du score en temps réel */}
        {score && (
          <div className="mt-6 rounded-lg bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-sm font-semibold text-white">Score actuel (Bloc B):</p>
            <p className="text-2xl font-bold text-white">{score.blocB.total} / 700 points</p>
            <div className="mt-2 text-xs text-white/80">
              Profession: {score.blocB.profession} | Diplôme QC: {score.blocB.diplome_quebec} | Expérience QC: {score.blocB.experience_quebec}
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
          {/* B1. Profession principale + diagnostic */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              B1. Profession principale + diagnostic
            </h3>
            <div className="grid gap-4 @3xl:grid-cols-2">
              <div>
                <Input
                  label="Code CNP"
                  placeholder="Ex: 2171"
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
                      label="Diagnostic"
                      placeholder="Sélectionner"
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
                  label="Expérience professionnelle (mois)"
                  type="number"
                  placeholder="Ex: 36"
                  {...register('experience_profession_mois', { valueAsNumber: true })}
                  error={errors.experience_profession_mois?.message}
                />
              </div>
            </div>
          </div>

          {/* B2. Diplôme obtenu au Québec */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              B2. Diplôme obtenu au Québec
            </h3>
            <Controller
              name="diplome_quebec"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Select
                  placeholder="Sélectionner"
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

          {/* B3. Expérience de travail au Québec */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              B3. Expérience de travail au Québec
            </h3>
            <Input
              label="Durée en mois"
              type="number"
              placeholder="Ex: 24"
              {...register('experience_quebec_mois', { valueAsNumber: true })}
              error={errors.experience_quebec_mois?.message}
            />
          </div>

          {/* B4. Expérience hors Montréal */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              B4. Expérience hors Montréal
            </h3>
            <div className="grid gap-4 @3xl:grid-cols-3">
              <Input
                label="Résidence (mois)"
                type="number"
                placeholder="Ex: 48"
                {...register('residence_hors_montreal_mois', { valueAsNumber: true })}
                error={errors.residence_hors_montreal_mois?.message}
              />
              <Input
                label="Travail (mois)"
                type="number"
                placeholder="Ex: 48"
                {...register('travail_hors_montreal_mois', { valueAsNumber: true })}
                error={errors.travail_hors_montreal_mois?.message}
              />
              <Input
                label="Études (mois)"
                type="number"
                placeholder="Ex: 48"
                {...register('etudes_hors_montreal_mois', { valueAsNumber: true })}
                error={errors.etudes_hors_montreal_mois?.message}
              />
            </div>
          </div>

          {/* B5. Offre d'emploi validée */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              B5. Offre d'emploi validée
            </h3>
            <div className="mb-4">
              <Controller
                name="offre_emploi"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Checkbox
                    label="J'ai une offre d'emploi validée"
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
                    label="Lieu"
                    placeholder="Sélectionner"
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

          {/* B6. Autorisation d'exercer */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              B6. Autorisation d'exercer
            </h3>
            <Controller
              name="autorisation_exercer"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Checkbox
                  label="J'ai un permis ou une reconnaissance partielle/complète"
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

