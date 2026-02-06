'use client';

import { createContext, useContext } from 'react';
import { useAtom } from 'jotai';
import { atomWithReset, atomWithStorage } from 'jotai/utils';
import { useEffect, useRef, useState } from 'react';
import cn from '@core/utils/class-names';
// Footer importé dans le layout
import { apiService } from '@/services/api';
import toast from 'react-hot-toast';
import { Loader } from 'rizzui';
import StepOne from '@/app/shared/sponsor-form/sponsor-form-multi-step/step-2'; // Renseignements sur le répondant (étape 1)
import StepTwo from '@/app/shared/sponsor-form/sponsor-form-multi-step/step-3'; // Renseignements sur le répondant - Suite (étape 2)
import StepThree from '@/app/shared/sponsor-form/sponsor-form-multi-step/step-1'; // Renseignements concernant la relation (étape 3)
import Congratulations from '@/app/shared/client-form/client-form-multi-step/congratulations';

/** Contexte pour que les étapes réinitialisent le formulaire quand les données ont été chargées depuis l’API */
export const SponsorFormLoadContext = createContext<{ dataLoadedKey: number | null }>({ dataLoadedKey: null });
export function useSponsorFormLoad() {
  return useContext(SponsorFormLoadContext);
}

import type {
  RelationshipWitness,
  CeremonyEvent,
  EmploymentHistory,
  DependentPerson,
  AddressHistory,
  PreviousRelationship,
} from '@/validators/sponsor-form.schema';

type SponsorFormDataType = {
  // Étape 1: Renseignements concernant la relation
  firstMeetingDate?: string;
  firstMeetingPlace?: string;
  firstMeetingCircumstances?: string;
  wasIntroduced?: string;
  introducedBy?: string;
  hadContactBeforeMeeting?: 'yes' | 'no';
  contactBeforeMeetingDetails?: string;
  familyAwareOfRelationship?: string;
  familyAwareDetails?: string;
  relationshipWitnesses?: RelationshipWitness[];
  ceremonies?: CeremonyEvent[];
  
  // Étape 2: Renseignements sur le répondant - Données personnelles
  lastName?: string;
  firstName?: string;
  phoneNumber?: string;
  dateAndPlaceOfBirth?: string;
  nationality?: string;
  whereLivedLast5Years?: string;
  maritalStatus?: string;
  marriageDate?: string;
  spouseName?: string;
  hasBeenMarried?: 'yes' | 'no';
  exSpouseName?: string;
  exSpouseDateOfBirth?: string;
  relationshipStartDate?: string;
  relationshipEndDate?: string;
  employmentHistory?: EmploymentHistory[];
  
  // Étape 3: Renseignements sur le répondant - Suite
  hasOtherSponsorships?: 'yes' | 'no';
  otherSponsorshipsDetails?: string;
  otherDependents?: DependentPerson[];
  educationLevel?: string;
  addressHistory?: AddressHistory[];
  hasPreviousRelationships?: 'yes' | 'no';
  previousRelationships?: PreviousRelationship[];
  
  [key: string]: any;
};

export const initialSponsorFormData: SponsorFormDataType = {
  firstMeetingDate: '',
  firstMeetingPlace: '',
  firstMeetingCircumstances: '',
  wasIntroduced: '',
  introducedBy: '',
  hadContactBeforeMeeting: 'no',
  contactBeforeMeetingDetails: '',
  familyAwareOfRelationship: '',
  familyAwareDetails: '',
  relationshipWitnesses: [],
  ceremonies: [],
  lastName: '',
  firstName: '',
  phoneNumber: '',
  dateAndPlaceOfBirth: '',
  nationality: '',
  whereLivedLast5Years: '',
  maritalStatus: '',
  marriageDate: '',
  spouseName: '',
  hasBeenMarried: 'no',
  exSpouseName: '',
  exSpouseDateOfBirth: '',
  relationshipStartDate: '',
  relationshipEndDate: '',
  employmentHistory: [],
  hasOtherSponsorships: 'no',
  otherSponsorshipsDetails: '',
  otherDependents: [],
  educationLevel: '',
  addressHistory: [],
  hasPreviousRelationships: 'no',
  previousRelationships: [],
};

// Stockage sûr pour SSR (évite null/undefined et erreurs localStorage)
const safeSponsorFormStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};

export const sponsorFormDataAtom = atomWithStorage<SponsorFormDataType>(
  'sponsorFormData',
  initialSponsorFormData,
  safeSponsorFormStorage as any
);

export function pickSponsorFields(input: any): SponsorFormDataType {
  if (input == null || typeof input !== 'object' || Array.isArray(input)) return {};
  const template = initialSponsorFormData != null && typeof initialSponsorFormData === 'object' ? initialSponsorFormData : {};
  const allowedKeys = Object.keys(template);
  const out: Record<string, any> = {};
  for (const key of allowedKeys) {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      out[key] = (input as any)[key];
    }
  }
  return out as SponsorFormDataType;
}

export enum SponsorStep {
  StepOne,
  StepTwo,
  StepThree,
  StepFour, // Congratulations
}

const firstStep = SponsorStep.StepOne;
export const sponsorStepperAtom = atomWithReset<SponsorStep>(firstStep);

export function useSponsorStepper() {
  const [step, setStep] = useAtom(sponsorStepperAtom);

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
  [SponsorStep.StepOne]: StepOne,
  [SponsorStep.StepTwo]: StepTwo,
  [SponsorStep.StepThree]: StepThree,
  [SponsorStep.StepFour]: Congratulations,
};

export const sponsorStepTotalSteps = Object.keys(MAP_STEP_TO_COMPONENT).length;

export default function SponsorFormMultiStep() {
  const [step, setStep] = useAtom(sponsorStepperAtom);
  const [formData, setFormData] = useAtom(sponsorFormDataAtom);
  const Component = MAP_STEP_TO_COMPONENT[step];
  const saveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const formDataRef = useRef(formData);
  const questionnaireCodeRef = useRef<string | null>(null);

  // Refs à jour pour que l’intervalle lise toujours les dernières valeurs
  // Récupérer le code depuis l'URL ou localStorage
  const [questionnaireCode, setQuestionnaireCode] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  // Clé pour forcer le remontage des étapes après chargement des données (afin que les champs affichent les valeurs chargées)
  const [dataLoadedKey, setDataLoadedKey] = useState<number | null>(null);

  formDataRef.current = formData;
  questionnaireCodeRef.current = questionnaireCode;

  // Réinitialiser le stepper à la première étape au chargement
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

  // Charger les données existantes depuis la base de données ou localStorage (au montage et quand le code est dispo)
  useEffect(() => {
    const loadExistingData = async () => {
      if (typeof window === 'undefined') {
        setIsLoadingData(false);
        return;
      }

      let loadedData: SponsorFormDataType = {};
      const codeFromUrl = new URLSearchParams(window.location.search).get('code');
      const code = questionnaireCode ?? codeFromUrl ?? localStorage.getItem('questionnaire_code');
      let loadingHandled = false;

      try {
        // Si on a un code mais pas d'email (ex: retour après fermeture du navigateur), rediriger vers la page de vérification
        if (code && !localStorage.getItem('questionnaire_email')) {
          window.location.href = `/questionnaire/verify?code=${code}`;
          return;
        }

        // D'abord, charger depuis localStorage (venant de la vérification)
        const savedData = localStorage.getItem('sponsorMultiStepForm');
        if (savedData) {
          try {
            const parsedData = JSON.parse(savedData);
            if (parsedData != null && typeof parsedData === 'object' && !Array.isArray(parsedData)) {
              loadedData = { ...loadedData, ...pickSponsorFields(parsedData) };
            }
            localStorage.removeItem('sponsorMultiStepForm'); // Nettoyer après chargement
          } catch (error) {
            console.error('Erreur lors du chargement des données depuis localStorage:', error);
          }
        }

        // Ensuite, charger depuis la base de données si un code existe
        if (code) {
          try {
            const email = localStorage.getItem('questionnaire_email');
            if (email) {
              const response = await apiService.verifyQuestionnaireAccess(email, code);
              if (response.success && response.data?.form_data != null) {
                const existingData = response.data.form_data;
                if (typeof existingData === 'object' && !Array.isArray(existingData)) {
                  loadedData = { ...loadedData, ...pickSponsorFields(existingData) };
                }
              }
            }
          } catch (error: any) {
            console.error('Erreur lors du chargement des données depuis la base:', error);
          }
        }

        // S'assurer que loadedData est toujours un objet (évite "can't convert null to object")
        const safeLoadedData = loadedData != null && typeof loadedData === 'object' && !Array.isArray(loadedData) ? loadedData : {};

        // Remplacer l'atom par les données chargées (pas de merge avec localStorage pour éviter les anciennes valeurs)
        if (code) {
          setFormData(() => ({ ...initialSponsorFormData, ...safeLoadedData }));
          setDataLoadedKey(Date.now());
          if (Object.keys(safeLoadedData).length > 0) {
            toast.success('Vos données ont été rechargées.');
          }
          loadingHandled = true;
          // Délai pour que l’atom soit bien mis à jour avant d’afficher les étapes
          requestAnimationFrame(() => {
            requestAnimationFrame(() => setIsLoadingData(false));
          });
        }
      } finally {
        if (!loadingHandled) {
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
      const dataToSave = data != null && typeof data === 'object' && !Array.isArray(data) ? data : {};
      const filteredDataToSave = pickSponsorFields(dataToSave);
      try {
        const response = await apiService.saveQuestionnaireData(code, filteredDataToSave);
        if (response.success) {
          console.log('Sauvegarde automatique réussie');
        } else {
          console.error('Sauvegarde automatique échouée:', response.message);
        }
      } catch (error: any) {
        console.error('Erreur lors de la sauvegarde automatique:', error);
      }
    };

    // Première sauvegarde après 5 s, puis toutes les 5 s
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
    <SponsorFormLoadContext.Provider value={{ dataLoadedKey }}>
      <div
        className={cn(
          'mx-auto grid w-full max-w-[1800px] grid-cols-12 place-content-center gap-6 px-4 py-10 @3xl:min-h-[calc(100vh-10rem)] @4xl:px-6 @5xl:gap-8 @5xl:px-8 @6xl:gap-12 @6xl:px-10 @7xl:max-w-[2000px]'
        )}
      >
        <Component key={dataLoadedKey ?? 'initial'} />
      </div>
    </SponsorFormLoadContext.Provider>
  );
}

