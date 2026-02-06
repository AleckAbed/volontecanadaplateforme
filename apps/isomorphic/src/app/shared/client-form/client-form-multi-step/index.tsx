'use client';

import { useAtom } from 'jotai';
import { atomWithReset, atomWithStorage } from 'jotai/utils';
import { useEffect, useRef, useState } from 'react';
import cn from '@core/utils/class-names';
import Footer from '@/app/client-form/footer';
import { apiService } from '@/services/api';
import toast from 'react-hot-toast';
import StepOne from '@/app/shared/client-form/client-form-multi-step/step-1';
import StepTwo from '@/app/shared/client-form/client-form-multi-step/step-2';
import StepThree from '@/app/shared/client-form/client-form-multi-step/step-3';
import StepFour from '@/app/shared/client-form/client-form-multi-step/step-4';
import StepFive from '@/app/shared/client-form/client-form-multi-step/step-5';
import StepSix from '@/app/shared/client-form/client-form-multi-step/step-6';
import StepSeven from '@/app/shared/client-form/client-form-multi-step/step-7';
import StepEight from '@/app/shared/client-form/client-form-multi-step/step-8';
import StepNine from '@/app/shared/client-form/client-form-multi-step/step-9';
import StepTen from '@/app/shared/client-form/client-form-multi-step/step-10';
import Congratulations from '@/app/shared/client-form/client-form-multi-step/congratulations';

// Type de données du formulaire basé sur le PDF form1.pdf
import type {
  EducationEntry,
  AddressEntry,
  PersonalBackgroundEntry,
  TravelEntry,
  FamilyMember,
} from '@/validators/client-form.schema';

type FormDataType = {
  // Étape 1: Détails de la demande et informations personnelles
  numberOfFamilyMembers?: string;
  preferredLanguageCorrespondence?: string;
  preferredLanguageInterview?: string;
  hasCSQ?: 'yes' | 'no';
  csqNumber?: string;
  csqApplicationDate?: string;
  lastName?: string;
  firstName?: string;
  uci?: string;
  sex?: string;
  eyeColor?: string;
  height?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  countryOfBirth?: string;
  
  // Étape 2: Citoyenneté, résidence et état matrimonial
  citizenship1?: string;
  citizenship2?: string;
  lastEntryDate?: string;
  lastEntryPlace?: string;
  hasPreviousResidence?: 'yes' | 'no';
  previousResidenceDetails?: string;
  currentMaritalStatus?: string;
  marriageDate?: string;
  spouseLastName?: string;
  spouseFirstName?: string;
  hasPreviousSpouse?: 'yes' | 'no';
  previousSpouseLastName?: string;
  previousSpouseFirstName?: string;
  previousSpouseDateOfBirth?: string;
  previousSpouseRelationshipType?: string;
  previousSpouseRelationshipStartDate?: string;
  previousSpouseRelationshipEndDate?: string;
  apartmentUnit?: string;
  streetNumber?: string;
  streetName?: string;
  city?: string;
  province?: string;
  country?: string;
  postalCode?: string;
  
  // Étape 3: Passeport, pièce d'identité et scolarité/emploi
  passportNumber?: string;
  passportIssueCountry?: string;
  passportIssueDate?: string;
  passportExpiryDate?: string;
  nationalIdNumber?: string;
  nationalIdIssueCountry?: string;
  nationalIdIssueDate?: string;
  nationalIdExpiryDate?: string;
  highestEducationLevel?: string;
  totalYearsOfStudy?: string;
  currentEmployment?: string;
  plannedEmployment?: string;
  
  // Étape 4: Scolarité détaillée
  elementaryYears?: string;
  secondaryYears?: string;
  universityYears?: string;
  vocationalYears?: string;
  educationHistory?: EducationEntry[];
  
  // Étape 5: Adresses
  addressHistory?: AddressEntry[];
  
  // Étape 6: Antécédents personnels
  personalBackground?: PersonalBackgroundEntry[];
  
  // Étape 7: Famille
  applicant?: FamilyMember;
  spouse?: FamilyMember;
  mother?: FamilyMember;
  father?: FamilyMember;
  children?: FamilyMember[];
  siblings?: FamilyMember[];
  
  // Étape 8: Voyages
  noTrips?: boolean;
  travels?: TravelEntry[];
  
  // Étape 9: Section A - Lien de parenté
  applicantInfo?: FamilyMember;
  spouseInfo?: FamilyMember;
  motherInfo?: FamilyMember;
  fatherInfo?: FamilyMember;
  
  // Étape 10: Questions de sécurité
  questionA?: 'yes' | 'no';
  questionB?: 'yes' | 'no';
  questionC?: 'yes' | 'no';
  questionD?: 'yes' | 'no';
  questionE?: 'yes' | 'no';
  questionF?: 'yes' | 'no';
  questionG?: 'yes' | 'no';
  questionH?: 'yes' | 'no';
  questionI?: 'yes' | 'no';
  questionJ?: 'yes' | 'no';
  questionK?: 'yes' | 'no';
  securityDetails?: string;
  agreeToTerms?: boolean;
  
  [key: string]: any;
};

export const initialFormData: FormDataType = {
  numberOfFamilyMembers: '',
  preferredLanguageCorrespondence: 'Français',
  preferredLanguageInterview: 'Français',
  hasCSQ: 'no',
  csqNumber: '',
  csqApplicationDate: '',
  lastName: '',
  firstName: '',
  uci: '',
  sex: '',
  eyeColor: '',
  height: '',
  dateOfBirth: '',
  placeOfBirth: '',
  countryOfBirth: '',
  citizenship1: '',
  citizenship2: '',
  lastEntryDate: '',
  lastEntryPlace: '',
  hasPreviousResidence: 'no',
  previousResidenceDetails: '',
  currentMaritalStatus: '',
  marriageDate: '',
  spouseLastName: '',
  spouseFirstName: '',
  hasPreviousSpouse: 'no',
  previousSpouseLastName: '',
  previousSpouseFirstName: '',
  previousSpouseDateOfBirth: '',
  previousSpouseRelationshipType: '',
  previousSpouseRelationshipStartDate: '',
  previousSpouseRelationshipEndDate: '',
  apartmentUnit: '',
  streetNumber: '',
  streetName: '',
  city: '',
  province: '',
  country: '',
  postalCode: '',
  passportNumber: '',
  passportIssueCountry: '',
  passportIssueDate: '',
  passportExpiryDate: '',
  nationalIdNumber: '',
  nationalIdIssueCountry: '',
  nationalIdIssueDate: '',
  nationalIdExpiryDate: '',
  highestEducationLevel: '',
  totalYearsOfStudy: '',
  currentEmployment: '',
  plannedEmployment: '',
  elementaryYears: '',
  secondaryYears: '',
  universityYears: '',
  vocationalYears: '',
  educationHistory: [],
  addressHistory: [],
  personalBackground: [],
  applicant: undefined,
  spouse: undefined,
  mother: undefined,
  father: undefined,
  children: [],
  siblings: [],
  noTrips: false,
  travels: [],
  applicantInfo: undefined,
  spouseInfo: undefined,
  motherInfo: undefined,
  fatherInfo: undefined,
  questionA: 'no',
  questionB: 'no',
  questionC: 'no',
  questionD: 'no',
  questionE: 'no',
  questionF: 'no',
  questionG: 'no',
  questionH: 'no',
  questionI: 'no',
  questionJ: 'no',
  questionK: 'no',
  securityDetails: '',
  agreeToTerms: false,
};

// Stockage sûr pour SSR (évite les erreurs quand localStorage n'existe pas)
const safeClientFormStorage = {
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

export const formDataAtom = atomWithStorage<FormDataType>(
  'clientFormData',
  initialFormData,
  safeClientFormStorage as any
);

function pickClientFields(input: any): FormDataType {
  if (input == null || typeof input !== 'object' || Array.isArray(input)) return {};
  const template = initialFormData != null && typeof initialFormData === 'object' ? initialFormData : {};
  const allowedKeys = Object.keys(template);
  const out: Record<string, any> = {};
  for (const key of allowedKeys) {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      out[key] = (input as any)[key];
    }
  }
  return out as FormDataType;
}

export enum Step {
  StepOne,
  StepTwo,
  StepThree,
  StepFour,
  StepFive,
  StepSix,
  StepSeven,
  StepEight,
  StepNine,
  StepTen,
  StepEleven,
}

const firstStep = Step.StepOne;
export const stepperAtom = atomWithReset<Step>(firstStep);

export function useStepper() {
  const [step, setStep] = useAtom(stepperAtom);

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
  [Step.StepOne]: StepOne,
  [Step.StepTwo]: StepTwo,
  [Step.StepThree]: StepThree,
  [Step.StepFour]: StepFour,
  [Step.StepFive]: StepFive,
  [Step.StepSix]: StepSix,
  [Step.StepSeven]: StepSeven,
  [Step.StepEight]: StepEight,
  [Step.StepNine]: StepNine,
  [Step.StepTen]: StepTen,
  [Step.StepEleven]: Congratulations,
};

export const stepTotalSteps = Object.keys(MAP_STEP_TO_COMPONENT).length;

export default function ClientFormMultiStep() {
  const [step] = useAtom(stepperAtom);
  const [formData, setFormData] = useAtom(formDataAtom);
  const Component = MAP_STEP_TO_COMPONENT[step];
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Récupérer le code depuis l'URL ou localStorage
  const [questionnaireCode, setQuestionnaireCode] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  // Clé pour forcer le remontage des étapes après chargement des données (afin que les champs affichent les valeurs chargées)
  const [dataLoadedKey, setDataLoadedKey] = useState<number | null>(null);

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

      const codeFromUrl = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('code') : null;
      const code = questionnaireCode ?? codeFromUrl ?? (typeof window !== 'undefined' ? localStorage.getItem('questionnaire_code') : null);

      try {
        // Si on a un code mais pas d'email (ex: retour après fermeture du navigateur), rediriger vers la page de vérification
        if (code && typeof window !== 'undefined' && !localStorage.getItem('questionnaire_email')) {
          window.location.href = `/questionnaire/verify?code=${code}`;
          return;
        }

        let loadedData: any = {};

        // D'abord, charger depuis localStorage (venant de la vérification)
        const savedData = localStorage.getItem('clientMultiStepForm');
        if (savedData) {
          try {
            const parsedData = JSON.parse(savedData) as Record<string, any>;
            loadedData = { ...loadedData, ...pickClientFields(parsedData) };
            localStorage.removeItem('clientMultiStepForm'); // Nettoyer après chargement
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
              
              if (response.success && response.data) {
                const existingData = response.data.form_data;
                
                if (existingData && typeof existingData === 'object' && Object.keys(existingData).length > 0) {
                  loadedData = { ...loadedData, ...pickClientFields(existingData) };
                }
              }
            }
          } catch (error: any) {
            console.error('Erreur lors du chargement des données depuis la base:', error);
          }
        }

        // Appliquer toutes les données chargées en une seule fois et forcer le remontage des étapes
        if (Object.keys(loadedData).length > 0) {
          setFormData((prev) => ({ ...prev, ...loadedData }));
          setDataLoadedKey(Date.now()); // pour que les champs affichent bien les valeurs chargées
          toast.success(`Données chargées: ${Object.keys(loadedData).length} champs pré-remplis`);
        }
      } finally {
        setIsLoadingData(false);
      }
    };

    loadExistingData();
  }, [setFormData, questionnaireCode]);

  // Sauvegarder automatiquement les données toutes les 5 secondes
  useEffect(() => {
    if (!questionnaireCode) return;

    // Sauvegarder immédiatement au changement
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      if (!questionnaireCode) {
        console.warn('Sauvegarde automatique annulée: aucun code de questionnaire');
        return;
      }

      try {
        const safeFormData = formData != null && typeof formData === 'object' && !Array.isArray(formData) ? formData : {};
        const filteredFormData = pickClientFields(safeFormData);
        const fieldsToSave = Object.keys(filteredFormData).filter(k => {
          const val = (filteredFormData as any)[k];
          return val !== '' && val !== null && val !== undefined;
        });
        console.log('Sauvegarde automatique:', fieldsToSave.length, 'champs', 'Code:', questionnaireCode);
        const response = await apiService.saveQuestionnaireData(questionnaireCode, filteredFormData);
        if (response.success) {
          console.log('Sauvegarde automatique réussie');
        } else {
          console.error('Sauvegarde automatique échouée:', response.message);
        }
      } catch (error: any) {
        console.error('Erreur lors de la sauvegarde automatique:', error);
        console.error('Détails:', error.message, error.stack);
      }
    }, 5000); // 5 secondes de délai

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formData, questionnaireCode]);

  // Afficher un loader pendant le chargement des données
  if (isLoadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
          <p className="mt-4 text-white">Chargement de vos données...</p>
        </div>
      </div>
    );
  }

  const StepComponent = Component ?? StepOne;
  return (
    <>
      <div
        className={cn(
          'mx-auto grid w-full max-w-screen-2xl grid-cols-12 place-content-center gap-6 px-5 py-10 @3xl:min-h-[calc(100vh-10rem)] @5xl:gap-8 @6xl:gap-16 xl:px-7'
        )}
      >
        <StepComponent key={dataLoadedKey ?? 'initial'} />
      </div>
      <Footer />
    </>
  );
}

