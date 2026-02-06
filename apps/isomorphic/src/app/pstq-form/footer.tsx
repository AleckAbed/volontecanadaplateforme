'use client';

import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { useResetAtom } from 'jotai/utils';
import { PiArrowUpLight, PiCheck } from 'react-icons/pi';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from 'rizzui';
import cn from '@core/utils/class-names';
import {
  pstqFormDataAtom,
  initialPSTQFormData,
  pstqStepperAtom,
  usePSTQStepper,
  PSTQStep,
} from '@/app/shared/pstq-form/pstq-form-multi-step';
import { apiService } from '@/services/api';
import toast from 'react-hot-toast';

interface FooterProps {
  formId?: number;
  className?: string;
  isLoading?: boolean;
}

export default function PSTQFooter({ isLoading, className }: FooterProps) {
  const { push } = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const setFormData = useSetAtom(pstqFormDataAtom);
  const { step, gotoPrevStep, gotoNextStep } = usePSTQStepper();
  const resetLocation = useResetAtom(pstqStepperAtom);
  const totalSteps = 5; // 4 étapes + 1 page de confirmation

  useEffect(() => {
    resetLocation();
    setFormData(initialPSTQFormData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  const handleSubmit = async () => {
    const questionnaireCode = typeof window !== 'undefined' ? localStorage.getItem('questionnaire_code') : null;
    let formData: Record<string, unknown> = {};
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('pstqFormData');
        formData = raw ? JSON.parse(raw) : {};
      } catch {
        formData = {};
      }
      if (formData == null || typeof formData !== 'object' || Array.isArray(formData)) formData = {};
    }

    if (!questionnaireCode) {
      toast.error('Code de questionnaire introuvable');
      return;
    }

    try {
      const response = await apiService.submitQuestionnaire(questionnaireCode, formData);
      if (response.success) {
        toast.success('Formulaire soumis avec succès !');
        gotoNextStep(); // Aller à la page de félicitations
      } else {
        toast.error(response.message || 'Erreur lors de la soumission');
      }
    } catch (error: any) {
      console.error('Erreur lors de la soumission:', error);
      toast.error(error.message || 'Erreur lors de la soumission');
    }
  };

  function buttonAttr() {
    if (step === PSTQStep.StepThree) {
      // Dernière étape avant le récapitulatif
      return {
        onClick: () => gotoNextStep(),
      };
    }
    if (step === PSTQStep.StepFour) {
      // Page de récapitulatif - soumettre
      return {
        onClick: handleSubmit,
      };
    }
    if (step === PSTQStep.StepFive) {
      // Page de félicitations
      return {
        onClick: () => {
          push('/');
        },
      };
    }
    return { form: `rhf-${step?.toString()}` };
  }

  function buttonLabel() {
    if (step === PSTQStep.StepThree) {
      return 'Voir le récapitulatif';
    }
    if (step === PSTQStep.StepFour) {
      return 'Soumettre';
    }
    if (step === PSTQStep.StepFive) {
      return 'Terminé';
    }
    return 'Suivant';
  }

  // Ne pas afficher le footer sur la page de félicitations
  if (step === PSTQStep.StepFive) {
    return null;
  }

  return (
    <footer
      className={cn(
        'fixed bottom-0 left-0 right-0 flex items-center justify-between gap-3 px-4 py-5 lg:px-8 4xl:px-10',
        className
      )}
    >
      {step > PSTQStep.StepOne && step < PSTQStep.StepFive && (
        <Button
          rounded="pill"
          variant="outline"
          onClick={gotoPrevStep}
          className="gap-1 border-white text-white backdrop-blur-lg hover:border-white hover:bg-white hover:text-black"
        >
          <PiArrowUpLight className="-rotate-90" />
          Retour
        </Button>
      )}
      <Button
        isLoading={isLoading}
        disabled={isLoading}
        rounded="pill"
        {...buttonAttr()}
        type={step === PSTQStep.StepThree || step === PSTQStep.StepFour ? 'button' : 'submit'}
        className="ml-auto gap-1 bg-gray-900/[.35] backdrop-blur-lg dark:bg-gray-0/[.35] dark:text-white dark:active:enabled:bg-gray-0/75"
      >
        {buttonLabel()}
      </Button>
    </footer>
  );
}

