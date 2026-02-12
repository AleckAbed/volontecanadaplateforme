'use client';

import { useAtom } from 'jotai';
import { questionnaireLocaleAtom } from '@/app/shared/questionnaire-locale';
import { getCommonT } from '@/app/shared/form-translations';
import {
  pstqStepTotalSteps,
  usePSTQStepper,
} from '@/app/shared/pstq-form/pstq-form-multi-step';
import cn from '@core/utils/class-names';

interface FormSummaryProps {
  title: string;
  description: string;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

export default function PSTQFormSummary({
  title,
  description,
  className,
  titleClassName,
  descriptionClassName,
}: FormSummaryProps) {
  const { step } = usePSTQStepper();
  const [locale] = useAtom(questionnaireLocaleAtom);
  const ct = getCommonT(locale);
  const totalFormSteps = 4;
  
  return (
    <div className={cn('text-base text-white', className)}>
      <div className="flex">
        <span className="me-2 mt-2.5 h-0.5 w-11 bg-white/[.35]" /> {ct.step}{' '}
        {step + 1} {ct.of} {totalFormSteps}
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



