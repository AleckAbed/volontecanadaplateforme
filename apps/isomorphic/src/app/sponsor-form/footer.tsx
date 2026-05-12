'use client';

import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { useResetAtom } from 'jotai/utils';
import { PiArrowUpLight, PiCheck } from 'react-icons/pi';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from 'rizzui';
import cn from '@core/utils/class-names';
import {
  sponsorFormDataAtom,
  initialSponsorFormData,
  sponsorStepperAtom,
  useSponsorStepper,
  SponsorStep,
} from '@/app/shared/sponsor-form/sponsor-form-multi-step';
import { apiService } from '@/services/api';
import toast from 'react-hot-toast';

interface FooterProps {
  formId?: number;
  className?: string;
  isLoading?: boolean;
}

export default function SponsorFooter({ isLoading, className }: FooterProps) {
  const { push } = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const setFormData = useSetAtom(sponsorFormDataAtom);
  const { step, gotoPrevStep, gotoNextStep } = useSponsorStepper();
  const resetLocation = useResetAtom(sponsorStepperAtom);
  const totalSteps = 4; // 3 étapes + 1 page de confirmation

  // Ne pas réinitialiser formData ici : cela effaçait les données rechargées depuis l'API au rechargement de la page
  useEffect(() => {
    resetLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  const handleSubmit = async () => {
    const questionnaireCode = typeof window !== 'undefined' ? localStorage.getItem('questionnaire_code') : null;
    let formData: Record<string, unknown> = {};
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('sponsorFormData');
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
        // Return to invitation if applicable
        let invitationCode: string | null = null;
        try { invitationCode = sessionStorage.getItem('return_to_invitation'); } catch {}
        if (invitationCode) {
          try { sessionStorage.removeItem('return_to_invitation'); } catch {}
          setTimeout(() => { window.location.href = `/invitation/${invitationCode}`; }, 1500);
        }
      } else {
        toast.error(response.message || 'Erreur lors de la soumission');
      }
    } catch (error: any) {
      console.error('Erreur lors de la soumission:', error);
      toast.error(error.message || 'Erreur lors de la soumission');
    }
  };

  function buttonAttr() {
    if (step === SponsorStep.StepThree) {
      // Dernière étape avant les félicitations
      return {
        onClick: handleSubmit,
      };
    }
    if (step === SponsorStep.StepFour) {
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
    if (step === SponsorStep.StepThree) {
      return 'Soumettre';
    }
    if (step === SponsorStep.StepFour) {
      return 'Terminé';
    }
    return 'Suivant';
  }

  return (
    <footer
      className={cn(
        'fixed bottom-0 left-0 right-0 flex items-center justify-between gap-3 px-4 py-5 lg:px-8 4xl:px-10',
        className
      )}
    >
      {step > SponsorStep.StepOne && step < SponsorStep.StepFour && (
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
        type={step === SponsorStep.StepThree || step === SponsorStep.StepFour ? 'button' : 'submit'}
        className="ml-auto gap-1 bg-gray-900/[.35] backdrop-blur-lg dark:bg-gray-0/[.35] dark:text-white dark:active:enabled:bg-gray-0/75"
      >
        {buttonLabel()}
      </Button>
    </footer>
  );
}



