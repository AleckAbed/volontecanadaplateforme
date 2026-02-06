'use client';

import { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { toast } from 'react-hot-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import FormSummary from '@/app/shared/client-form/client-form-multi-step/form-summary';
import { formDataAtom, useStepper } from '@/app/shared/client-form/client-form-multi-step';
import { Checkbox, Textarea } from 'rizzui';
import {
  clientFormStep10Schema,
  ClientFormStep10Input,
} from '@/validators/client-form.schema';

const securityQuestions = [
  {
    key: 'questionA',
    text: 'avez déjà été reconnu coupable d\'un crime ou un délit au Canada pour lequel un pardon n\'a pas été accordé en vertu de la Loi sur le casier judiciaire?',
  },
  {
    key: 'questionB',
    text: 'avez déjà été reconnu coupable, ou êtes-vous actuellement accusé, jugé pour, associé à un crime ou un délit, ou sujet à des procédures judiciaires dans un autre pays ou territoire?',
  },
  {
    key: 'questionC',
    text: 'avez déjà présenté une demande d\'asile au Canada ou dans un bureau canadien des visas à l\'étranger, auprès d\'un autre pays ou territoire(s), ou auprès du Haut Commissariat des Nations Unies pour les réfugiés (HCR)?',
  },
  {
    key: 'questionD',
    text: 'avez déjà reçu le refus du statut de réfugié, un visa d\'immigrant ou de résident permanent (incluant un Certificat de sélection du Québec (CSQ) ou demande au Programme des candidats des provinces) ou de visiteur ou de résident temporaire pour aller au Canada ou dans tout autre pays ou territoire?',
  },
  {
    key: 'questionE',
    text: 'avez déjà reçu le refus d\'admission au Canada ou dans tout autre pays ou territoire, ou reçu l\'ordre de quitter le Canada ou tout autre pays ou territoire?',
  },
  {
    key: 'questionF',
    text: 'avez déjà participé à un acte de génocide, à un crime de guerre ou à la perpétration d\'un crime contre l\'humanité?',
  },
  {
    key: 'questionG',
    text: 'avez déjà utilisé, planifié d\'utiliser ou prôné une lutte armée ou la violence pour atteindre des objectifs politiques, religieux ou sociaux?',
  },
  {
    key: 'questionH',
    text: 'avez déjà été associé à un groupe qui a utilisé, utilise, a prôné ou prône une lutte armée ou la violence pour atteindre des objectifs politiques, religieux ou sociaux?',
  },
  {
    key: 'questionI',
    text: 'avez déjà été membre d\'une organisation qui est ou a été engagée dans une activité qui s\'inscrit dans le cadre d\'une activité criminelle?',
  },
  {
    key: 'questionJ',
    text: 'avez déjà été gardé en détention, incarcéré ou en prison?',
  },
  {
    key: 'questionK',
    text: 'avez déjà souffert d\'une maladie grave ou d\'un désordre physique ou mental?',
  },
];

export default function StepTen() {
  const { step, gotoNextStep } = useStepper();
  const [formData, setFormData] = useAtom(formDataAtom);
  const [hasYesAnswers, setHasYesAnswers] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<ClientFormStep10Input>({
    resolver: zodResolver(clientFormStep10Schema),
    defaultValues: {
      questionA: formData.questionA || 'no',
      questionB: formData.questionB || 'no',
      questionC: formData.questionC || 'no',
      questionD: formData.questionD || 'no',
      questionE: formData.questionE || 'no',
      questionF: formData.questionF || 'no',
      questionG: formData.questionG || 'no',
      questionH: formData.questionH || 'no',
      questionI: formData.questionI || 'no',
      questionJ: formData.questionJ || 'no',
      questionK: formData.questionK || 'no',
      securityDetails: formData.securityDetails || '',
      agreeToTerms: formData.agreeToTerms || false,
    },
  });

  const watchedValues = watch();

  useEffect(() => {
    const hasYes = Object.values(watchedValues).some(
      (val) => val === 'yes'
    );
    setHasYesAnswers(hasYes);
  }, [watchedValues]);

  useEffect(() => {
    if (errors.agreeToTerms) {
      toast.error(errors.agreeToTerms.message as string);
    }
  }, [errors]);

  const onSubmit: SubmitHandler<ClientFormStep10Input> = (data) => {
    setFormData((prev) => ({
      ...prev,
      ...data,
    }));
    gotoNextStep();
  };

  return (
    <>
      <div className="col-span-full flex flex-col justify-center @4xl:col-span-5">
        <FormSummary
          descriptionClassName="@7xl:me-10"
          title="Questions de sécurité"
          description="Est-ce que vous-même ou, si vous êtes le requérant principal, l'un des membres de votre famille nommés sur la demande de résidence permanente au Canada :"
        />
      </div>

      <form
        id={`rhf-${step.toString()}`}
        onSubmit={handleSubmit(onSubmit)}
        className="col-span-full rounded-lg bg-white p-5 @4xl:col-span-7 @4xl:p-7 dark:bg-gray-0"
      >
        <div className="grid gap-6">
          <div className="space-y-4">
            {securityQuestions.map((question, index) => (
              <div key={question.key} className="rounded-lg border p-4">
                <div className="mb-2 flex items-start gap-4">
                  <span className="mt-1 font-semibold text-gray-900 dark:text-white">
                    {String.fromCharCode(97 + index)})
                  </span>
                  <div className="flex-1">
                    <p className="mb-3 text-sm text-gray-700 dark:text-gray-300">
                      {question.text}
                    </p>
                    <div className="flex gap-6">
                      <Controller
                        name={question.key as keyof ClientFormStep10Input}
                        control={control}
                        render={({ field: { value, onChange } }) => (
                          <>
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={question.key}
                                value="yes"
                                checked={value === 'yes'}
                                onChange={() => onChange('yes')}
                                className="h-4 w-4"
                              />
                              <span className="text-sm">OUI</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={question.key}
                                value="no"
                                checked={value === 'no'}
                                onChange={() => onChange('no')}
                                className="h-4 w-4"
                              />
                              <span className="text-sm">NON</span>
                            </label>
                          </>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {hasYesAnswers && (
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Pour toute question à laquelle vous avez répondu " OUI ", veuillez donner des précisions ci-dessous:
              </p>
              <Textarea
                {...register('securityDetails')}
                rows={6}
                className="w-full"
                placeholder="Veuillez fournir des détails pour chaque question à laquelle vous avez répondu OUI..."
              />
            </div>
          )}

          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <Controller
              name="agreeToTerms"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Checkbox
                  label={
                    <span>
                      J'accepte les{' '}
                      <a href="#" className="text-primary underline">
                        termes et conditions
                      </a>{' '}
                      et confirme que toutes les informations fournies sont exactes
                    </span>
                  }
                  checked={value}
                  onChange={(e) => onChange(e.target.checked)}
                  error={errors.agreeToTerms?.message}
                />
              )}
            />
          </div>
        </div>
      </form>
    </>
  );
}



