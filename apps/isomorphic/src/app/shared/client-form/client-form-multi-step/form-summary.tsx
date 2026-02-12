'use client';

import { useAtom } from 'jotai';
import { questionnaireLocaleAtom } from '@/app/shared/questionnaire-locale';
import {
  stepTotalSteps,
  useStepper,
} from '@/app/shared/client-form/client-form-multi-step';
import cn from '@core/utils/class-names';

interface FormSummaryProps {
  title: string;
  description: string;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

const stepLabel = { fr: { step: 'Étape', of: 'sur' }, en: { step: 'Step', of: 'of' } } as const;

export default function FormSummary({
  title,
  description,
  className,
  titleClassName,
  descriptionClassName,
}: FormSummaryProps) {
  const { step } = useStepper();
  const [locale] = useAtom(questionnaireLocaleAtom);
  const labels = stepLabel[locale] || stepLabel.fr;
  return (
    <div className={cn('text-base text-white', className)}>
      <div className="flex">
        <span className="me-2 mt-2.5 h-0.5 w-11 bg-white/[.35]" /> {labels.step}{' '}
        {step + 1} {labels.of} {stepTotalSteps - 1}
      </div>
      <article className="mt-4 @3xl:mt-9">
        <h1
          className={cn(
            'text-xl text-white @3xl:text-2xl @7xl:text-3xl @[113rem]:text-4xl',
            titleClassName
          )}
        >
          {title}
        </h1>
        <p
          className={cn(
            'mt-3 text-sm leading-relaxed @3xl:text-base',
            descriptionClassName
          )}
        >
          {description}
        </p>
      </article>
    </div>
  );
}



