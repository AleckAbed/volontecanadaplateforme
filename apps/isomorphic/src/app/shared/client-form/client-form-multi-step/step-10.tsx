'use client';

import { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { toast } from 'react-hot-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import FormSummary from '@/app/shared/client-form/client-form-multi-step/form-summary';
import { formDataAtom, useStepper } from '@/app/shared/client-form/client-form-multi-step';
import { questionnaireLocaleAtom } from '@/app/shared/questionnaire-locale';
import { STEP10_T } from '@/app/shared/client-form/client-form-translations';
import { Checkbox, Textarea } from 'rizzui';
import {
  clientFormStep10Schema,
  ClientFormStep10Input,
} from '@/validators/client-form.schema';

const STEP10_LABELS = {
  fr: {
    yes: 'OUI',
    no: 'NON',
    yesAnswersPrompt: 'Pour toute question à laquelle vous avez répondu « OUI », veuillez donner des précisions ci-dessous :',
    detailsPlaceholder: 'Veuillez fournir des détails pour chaque question à laquelle vous avez répondu OUI...',
    termsPrefix: "J'accepte les ",
    termsLink: 'termes et conditions',
    termsSuffix: ' et confirme que toutes les informations fournies sont exactes',
    questions: [
      "avez déjà été reconnu coupable d'un crime ou un délit au Canada pour lequel un pardon n'a pas été accordé en vertu de la Loi sur le casier judiciaire?",
      'avez déjà été reconnu coupable, ou êtes-vous actuellement accusé, jugé pour, associé à un crime ou un délit, ou sujet à des procédures judiciaires dans un autre pays ou territoire?',
      "avez déjà présenté une demande d'asile au Canada ou dans un bureau canadien des visas à l'étranger, auprès d'un autre pays ou territoire(s), ou auprès du Haut Commissariat des Nations Unies pour les réfugiés (HCR)?",
      "avez déjà reçu le refus du statut de réfugié, un visa d'immigrant ou de résident permanent (incluant un Certificat de sélection du Québec (CSQ) ou demande au Programme des candidats des provinces) ou de visiteur ou de résident temporaire pour aller au Canada ou dans tout autre pays ou territoire?",
      "avez déjà reçu le refus d'admission au Canada ou dans tout autre pays ou territoire, ou reçu l'ordre de quitter le Canada ou tout autre pays ou territoire?",
      "avez déjà participé à un acte de génocide, à un crime de guerre ou à la perpétration d'un crime contre l'humanité?",
      "avez déjà utilisé, planifié d'utiliser ou prôné une lutte armée ou la violence pour atteindre des objectifs politiques, religieux ou sociaux?",
      'avez déjà été associé à un groupe qui a utilisé, utilise, a prôné ou prône une lutte armée ou la violence pour atteindre des objectifs politiques, religieux ou sociaux?',
      "avez déjà été membre d'une organisation qui est ou a été engagée dans une activité qui s'inscrit dans le cadre d'une activité criminelle?",
      'avez déjà été gardé en détention, incarcéré ou en prison?',
      "avez déjà souffert d'une maladie grave ou d'un désordre physique ou mental?",
    ],
  },
  en: {
    yes: 'YES',
    no: 'NO',
    yesAnswersPrompt: 'For any question to which you answered "YES", please provide details below:',
    detailsPlaceholder: 'Please provide details for each question you answered YES...',
    termsPrefix: 'I agree to the ',
    termsLink: 'terms and conditions',
    termsSuffix: ' and confirm that all information provided is accurate',
    questions: [
      'have ever been convicted of a crime or offence in Canada for which a pardon has not been granted under the Criminal Records Act?',
      'have ever been convicted, or are currently charged, tried for, associated with a crime or offence, or subject to legal proceedings in another country or territory?',
      'have ever filed an asylum claim in Canada or at a Canadian visa office abroad, with another country or territory(ies), or with the UN High Commissioner for Refugees (UNHCR)?',
      'have ever been refused refugee status, an immigrant or permanent resident visa (including a Québec Selection Certificate (CSQ) or Provincial Nominee Program application) or visitor/temporary resident status to come to Canada or any other country or territory?',
      'have ever been refused admission to Canada or any other country or territory, or been ordered to leave Canada or any other country or territory?',
      'have ever participated in an act of genocide, a war crime, or the commission of a crime against humanity?',
      'have ever used, planned to use, or advocated armed struggle or violence to achieve political, religious or social objectives?',
      'have ever been associated with a group that has used, uses, advocated or advocates armed struggle or violence to achieve political, religious or social objectives?',
      'have ever been a member of an organization that is or has been engaged in an activity that is part of criminal activity?',
      'have ever been kept in detention, incarcerated or in prison?',
      'have ever suffered from a serious illness or physical or mental disorder?',
    ],
  },
  es: {
    yes: 'SÍ',
    no: 'NO',
    yesAnswersPrompt: 'Para cualquier pregunta a la que respondió "SÍ", proporcione detalles a continuación:',
    detailsPlaceholder: 'Proporcione detalles para cada pregunta a la que respondió SÍ...',
    termsPrefix: 'Acepto los ',
    termsLink: 'términos y condiciones',
    termsSuffix: ' y confirmo que toda la información proporcionada es exacta',
    questions: [
      '¿alguna vez ha sido condenado por un crimen o delito en Canadá para el cual no se haya concedido un perdón bajo la Ley de Antecedentes Penales?',
      '¿alguna vez ha sido condenado, o está actualmente acusado, juzgado por, asociado con un crimen o delito, o sujeto a procedimientos judiciales en otro país o territorio?',
      '¿alguna vez ha presentado una solicitud de asilo en Canadá o en una oficina canadiense de visas en el extranjero, con otro país o territorio(s), o con la ACNUR?',
      '¿alguna vez ha sido rechazado para el estatus de refugiado, una visa de inmigrante o residente permanente (incluido un Certificado de Selección de Quebec (CSQ) o solicitud del Programa de Candidatos Provinciales) o de visitante o residente temporal para ir a Canadá o a cualquier otro país o territorio?',
      '¿alguna vez ha sido rechazado para entrar en Canadá o en cualquier otro país o territorio, o ha recibido la orden de salir de Canadá o de cualquier otro país o territorio?',
      '¿alguna vez ha participado en un acto de genocidio, un crimen de guerra o la comisión de un crimen contra la humanidad?',
      '¿alguna vez ha utilizado, planeado utilizar o defendido la lucha armada o la violencia para lograr objetivos políticos, religiosos o sociales?',
      '¿alguna vez ha estado asociado con un grupo que ha utilizado, utiliza, ha defendido o defiende la lucha armada o la violencia para lograr objetivos políticos, religiosos o sociales?',
      '¿alguna vez ha sido miembro de una organización que está o ha estado involucrada en una actividad que forma parte de una actividad criminal?',
      '¿alguna vez ha sido mantenido en detención, encarcelado o en prisión?',
      '¿alguna vez ha sufrido una enfermedad grave o un trastorno físico o mental?',
    ],
  },
} as const;

const QUESTION_KEYS = ['questionA', 'questionB', 'questionC', 'questionD', 'questionE', 'questionF', 'questionG', 'questionH', 'questionI', 'questionJ', 'questionK'] as const;

export default function StepTen() {
  const { step, gotoNextStep } = useStepper();
  const [formData, setFormData] = useAtom(formDataAtom);
  const [locale] = useAtom(questionnaireLocaleAtom);
  const t = STEP10_T[locale] || STEP10_T.fr;
  const l = STEP10_LABELS[locale] || STEP10_LABELS.fr;
  const [hasYesAnswers, setHasYesAnswers] = useState(false);

  const securityQuestions = QUESTION_KEYS.map((key, i) => ({ key, text: l.questions[i] }));

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<ClientFormStep10Input>({
    resolver: zodResolver(clientFormStep10Schema),
    defaultValues: {
      questionA: formData?.questionA || 'no',
      questionB: formData?.questionB || 'no',
      questionC: formData?.questionC || 'no',
      questionD: formData?.questionD || 'no',
      questionE: formData?.questionE || 'no',
      questionF: formData?.questionF || 'no',
      questionG: formData?.questionG || 'no',
      questionH: formData?.questionH || 'no',
      questionI: formData?.questionI || 'no',
      questionJ: formData?.questionJ || 'no',
      questionK: formData?.questionK || 'no',
      securityDetails: formData?.securityDetails || '',
      agreeToTerms: formData?.agreeToTerms || false,
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
          title={t.summaryTitle}
          description={t.summaryDesc}
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
                              <span className="text-sm">{l.yes}</span>
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
                              <span className="text-sm">{l.no}</span>
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
                {l.yesAnswersPrompt}
              </p>
              <Textarea
                {...register('securityDetails')}
                rows={6}
                className="w-full"
                placeholder={l.detailsPlaceholder}
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
                      {l.termsPrefix}
                      <a href="#" className="text-primary underline">
                        {l.termsLink}
                      </a>
                      {l.termsSuffix}
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
