'use client';

import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { useResetAtom } from 'jotai/utils';
import { PiArrowUpLight, PiCheck } from 'react-icons/pi';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from 'rizzui';
import cn from '@core/utils/class-names';
import {
  formDataAtom,
  initialFormData,
  stepperAtom,
  useStepper,
} from '@/app/shared/client-form/client-form-multi-step';

interface FooterProps {
  formId?: number;
  className?: string;
  isLoading?: boolean;
}


export default function Footer({ isLoading, className }: FooterProps) {
  const { push } = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const setFormData = useSetAtom(formDataAtom);
  const { step, gotoPrevStep } = useStepper();
  const resetLocation = useResetAtom(stepperAtom);
  const totalSteps = 11; // 10 étapes + 1 page de confirmation

  useEffect(() => {
    resetLocation();
    setFormData(initialFormData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  function buttonAttr() {
    if (step === totalSteps - 1) {
      return {
        onClick: () => {
          // Soumettre le formulaire
          console.log('Soumission du formulaire...');
          push('/');
        },
      };
    }
    return { form: `rhf-${step?.toString()}` };
  }

  function buttonLabel() {
    if (step === totalSteps - 2) {
      return 'Soumettre';
    }
    if (step === totalSteps - 1) {
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
      {step > 0 && step < totalSteps && (
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
        type={'submit'}
        className="ml-auto gap-1 bg-gray-900/[.35] backdrop-blur-lg dark:bg-gray-0/[.35] dark:text-white dark:active:enabled:bg-gray-0/75"
      >
        {buttonLabel()}
      </Button>
    </footer>
  );
}

