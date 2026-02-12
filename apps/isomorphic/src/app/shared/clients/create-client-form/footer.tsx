'use client';

import { useAtom } from 'jotai';
import { Button } from 'rizzui';
import cn from '@core/utils/class-names';
import {
  clientFormDataAtom,
  useStepperClient,
  stepClientTotalSteps,
} from '@/app/shared/clients/create-client-form';

interface FooterProps {
  className?: string;
  nextLabel?: string;
  submitLabel?: string;
  showSubmit?: boolean;
  isLoading?: boolean;
}

export default function CreateClientFormFooter({
  className,
  nextLabel = 'Suivant',
  submitLabel = 'Créer le client',
  showSubmit = false,
  isLoading = false,
}: FooterProps) {
  const { step, gotoPrevStep } = useStepperClient();
  const [formData] = useAtom(clientFormDataAtom);
  const isFamily = formData.client_type === 'family';
  const totalSteps = isFamily ? stepClientTotalSteps : 2;
  const isLastStep = isFamily ? step === stepClientTotalSteps - 1 : step === 1;

  return (
    <footer
      className={cn(
        'flex w-full items-center justify-between border-t border-gray-200 px-5 py-4 md:px-7',
        className
      )}
    >
      <div className="flex shrink-0 gap-1.5">
        {Array.from({ length: totalSteps }, (_, x) => (
          <Button
            key={`step-${x}`}
            variant="text"
            className={cn(
              'h-2 p-0',
              x === step ? 'w-6 bg-primary' : 'w-3 bg-gray-200'
            )}
          />
        ))}
      </div>

      <div className="flex gap-3">
        {step > 0 && (
          <Button
            type="button"
            onClick={gotoPrevStep}
            variant="outline"
            className="!w-auto"
            rounded="lg"
          >
            Retour
          </Button>
        )}
        <Button
          className="!w-auto"
          type="submit"
          rounded="lg"
          isLoading={isLoading}
        >
          {showSubmit || isLastStep ? submitLabel : nextLabel}
        </Button>
      </div>
    </footer>
  );
}
