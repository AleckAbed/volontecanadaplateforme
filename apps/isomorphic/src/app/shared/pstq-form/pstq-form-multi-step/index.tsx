'use client';

import { useAtom } from 'jotai';
import { atomWithReset, atomWithStorage } from 'jotai/utils';
import { useEffect, useRef, useState } from 'react';
import cn from '@core/utils/class-names';
import { apiService } from '@/services/api';
import toast from 'react-hot-toast';
import { Loader } from 'rizzui';
import StepOne from '@/app/shared/pstq-form/pstq-form-multi-step/step-1';
import StepTwo from '@/app/shared/pstq-form/pstq-form-multi-step/step-2';
import StepThree from '@/app/shared/pstq-form/pstq-form-multi-step/step-3';
import StepFour from '@/app/shared/pstq-form/pstq-form-multi-step/step-4';
import StepFive from '@/app/shared/client-form/client-form-multi-step/congratulations';

import type { PSTQFormInput } from '@/validators/pstq-form.schema';
import { calculatePSTQScore } from '@/services/pstq-scoring';

type PSTQFormDataType = PSTQFormInput & {
  [key: string]: any;
};

export const initialPSTQFormData: PSTQFormDataType = {
  // Bloc A
  comprehension_orale: 1,
  production_orale: 1,
  comprehension_ecrite: 1,
  production_ecrite: 1,
  avec_conjoint: false,
  date_naissance: '',
  experience_travail_mois: 0,
  niveau_scolarite: 'secondaire',
  
  // Bloc B
  cnp_code: '',
  diagnostic: 'equilibre',
  experience_profession_mois: 0,
  diplome_quebec: 'aucun',
  experience_quebec_mois: 0,
  residence_hors_montreal_mois: 0,
  travail_hors_montreal_mois: 0,
  etudes_hors_montreal_mois: 0,
  offre_emploi: false,
  offre_emploi_lieu: 'montreal',
  autorisation_exercer: false,
  
  // Bloc C
  etudes_quebec_sans_diplome_mois: 0,
  famille_quebec: false,
  famille_quebec_lien: 'direct',
  conjoint_francais_comprehension_orale: 1,
  conjoint_francais_production_orale: 1,
  conjoint_francais_comprehension_ecrite: 1,
  conjoint_francais_production_ecrite: 1,
  conjoint_age: undefined,
  conjoint_experience_quebec_mois: 0,
  conjoint_scolarite: 'secondaire',
  conjoint_diplome_quebec: 'aucun',
};

export const pstqFormDataAtom = atomWithStorage<PSTQFormDataType>(
  'pstqFormData',
  initialPSTQFormData
);

export enum PSTQStep {
  StepOne, // Bloc A - Capital humain
  StepTwo, // Bloc B - Réponse aux besoins du Québec
  StepThree, // Bloc C - Facteurs d'adaptation
  StepFour, // Récapitulatif du score
  StepFive, // Congratulations
}

const firstStep = PSTQStep.StepOne;
export const pstqStepperAtom = atomWithReset<PSTQStep>(firstStep);

export function usePSTQStepper() {
  const [step, setStep] = useAtom(pstqStepperAtom);

  function gotoNextStep() {
    setStep(step + 1);
  }
  function gotoPrevStep() {
    setStep(step > firstStep ? step - 1 : step);
  }
  function resetStepper() {
    setStep(firstStep);
  }
  return {
    step,
    setStep,
    resetStepper,
    gotoNextStep,
    gotoPrevStep,
  };
}

const MAP_STEP_TO_COMPONENT = {
  [PSTQStep.StepOne]: StepOne,
  [PSTQStep.StepTwo]: StepTwo,
  [PSTQStep.StepThree]: StepThree,
  [PSTQStep.StepFour]: StepFour,
  [PSTQStep.StepFive]: StepFive,
};

export const pstqStepTotalSteps = Object.keys(MAP_STEP_TO_COMPONENT).length;

export default function PSTQFormMultiStep() {
  const [step] = useAtom(pstqStepperAtom);
  const [formData, setFormData] = useAtom(pstqFormDataAtom);
  const Component = MAP_STEP_TO_COMPONENT[step];
  const saveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const formDataRef = useRef(formData);
  const questionnaireCodeRef = useRef<string | null>(null);

  // Récupérer le code depuis l'URL ou localStorage
  const [questionnaireCode, setQuestionnaireCode] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  // Clé pour forcer le remontage des étapes après chargement des données (affichage des valeurs chargées)
  const [dataLoadedKey, setDataLoadedKey] = useState<number | null>(null);

  formDataRef.current = formData;
  questionnaireCodeRef.current = questionnaireCode;

  // Réinitialiser le stepper à la première étape au chargement
  const [, setStep] = useAtom(pstqStepperAtom);
  useEffect(() => {
    setStep(firstStep);
  }, [setStep]);

  // Récupérer le code depuis l'URL ou localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const codeFromUrl = urlParams.get('code');
      const codeFromStorage = localStorage.getItem('questionnaire_code');
      
      // Priorité à l'URL, sinon localStorage
      const code = codeFromUrl || codeFromStorage;
      setQuestionnaireCode(code);
      
      // Si le code vient de l'URL et n'est pas dans localStorage, le sauvegarder
      if (codeFromUrl && codeFromUrl !== codeFromStorage) {
        localStorage.setItem('questionnaire_code', codeFromUrl);
      }
    }
  }, []);

  // Charger les données existantes depuis la base de données ou localStorage
  useEffect(() => {
    const loadExistingData = async () => {
      if (typeof window === 'undefined') {
        setIsLoadingData(false);
        return;
      }

      let loadedData: PSTQFormDataType = {};

      try {
        // D'abord, charger depuis localStorage (venant de la vérification)
        const savedData = localStorage.getItem('pstqMultiStepForm');
        if (savedData) {
          try {
            const parsedData = JSON.parse(savedData);
            loadedData = { ...loadedData, ...parsedData };
            localStorage.removeItem('pstqMultiStepForm');
            console.log('Données chargées depuis localStorage:', Object.keys(parsedData).length, 'champs');
          } catch (error) {
            console.error('Erreur lors du chargement des données depuis localStorage:', error);
          }
        }

        // Si on a un code mais pas d'email (retour après fermeture du navigateur), rediriger vers la vérification
        if (questionnaireCode && !localStorage.getItem('questionnaire_email')) {
          window.location.href = `/questionnaire/verify?code=${questionnaireCode}`;
          return;
        }

        // Ensuite, charger depuis la base de données si un code existe
        if (questionnaireCode) {
          try {
            const email = localStorage.getItem('questionnaire_email');
            if (email) {
              const response = await apiService.verifyQuestionnaireAccess(email, questionnaireCode);
              if (response.success && response.data?.form_data) {
                const existingData = response.data.form_data;
                if (existingData && typeof existingData === 'object' && !Array.isArray(existingData) && Object.keys(existingData).length > 0) {
                  loadedData = { ...loadedData, ...existingData };
                }
              }
            }
          } catch (error: any) {
            console.error('Erreur lors du chargement des données depuis la base:', error);
          }
        }

        // Remplacer l'atom par les données chargées (pas de merge avec localStorage pour éviter les valeurs par défaut)
        const safeLoadedData = loadedData && typeof loadedData === 'object' && !Array.isArray(loadedData) ? loadedData : {};
        if (Object.keys(safeLoadedData).length > 0) {
          setFormData(() => ({ ...initialPSTQFormData, ...safeLoadedData }));
          setDataLoadedKey(Date.now());
          toast.success('Vos données ont été chargées !');
          // Délai pour que l'atom soit bien mis à jour avant d'afficher les étapes
          requestAnimationFrame(() => {
            requestAnimationFrame(() => setIsLoadingData(false));
          });
        } else {
          setIsLoadingData(false);
        }
      } finally {
        // Si on n'a pas encore masqué le loader (pas de données chargées avec délai)
        if (Object.keys(loadedData || {}).length === 0) {
          setIsLoadingData(false);
        }
      }
    };

    loadExistingData();
  }, [setFormData, questionnaireCode]);

  // Sauvegarder automatiquement les données toutes les 5 secondes (intervalle fixe)
  useEffect(() => {
    if (!questionnaireCode) return;

    const runSave = async () => {
      const code = questionnaireCodeRef.current;
      const data = formDataRef.current;
      if (!code) return;
      const safeFormData = data != null && typeof data === 'object' && !Array.isArray(data) ? data : {};
      try {
        const response = await apiService.saveQuestionnaireData(code, safeFormData);
        if (response.success) {
          console.log('Sauvegarde automatique PSTQ réussie');
        } else {
          console.error('Sauvegarde automatique PSTQ échouée:', response.message);
        }
      } catch (error: any) {
        console.error('Erreur lors de la sauvegarde automatique PSTQ:', error);
      }
    };

    saveIntervalRef.current = setInterval(runSave, 5000);

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
        saveIntervalRef.current = null;
      }
    };
  }, [questionnaireCode]);

  if (isLoadingData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader size="xl" />
        <p className="ml-3 text-lg text-white">Chargement de vos données...</p>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          'mx-auto grid w-full max-w-screen-2xl grid-cols-12 place-content-center gap-6 px-5 py-10 @3xl:min-h-[calc(100vh-10rem)] @5xl:gap-8 @6xl:gap-16 xl:px-7'
        )}
      >
        <Component key={dataLoadedKey ?? 'initial'} />
      </div>
    </>
  );
}

