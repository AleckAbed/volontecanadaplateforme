'use client';

import { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, RadioGroup, AdvancedRadio } from 'rizzui';
import { apiService } from '@/services/api';
import toast from 'react-hot-toast';
import { pstqFormDataAtom } from '@/app/shared/pstq-form/pstq-form-multi-step';
import { questionnaireLocaleAtom, type FormLocale } from '@/app/shared/questionnaire-locale';
import { getCommonT } from '@/app/shared/form-translations';
import { calculatePSTQScore } from '@/services/pstq-scoring';

export default function PSTQHeader() {
  const router = useRouter();
  const [formData] = useAtom(pstqFormDataAtom);
  const [locale, setLocale] = useAtom(questionnaireLocaleAtom);
  const [score, setScore] = useState<number>(0);
  const [questionnaireCode, setQuestionnaireCode] = useState<string | null>(null);
  const t = getCommonT(locale);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const codeFromUrl = urlParams.get('code');
      const codeFromStorage = localStorage.getItem('questionnaire_code');
      const code = codeFromUrl || codeFromStorage;
      setQuestionnaireCode(code);
    }
  }, []);

  useEffect(() => {
    try {
      const calculatedScore = calculatePSTQScore(formData as any);
      setScore(calculatedScore.total);
    } catch (error) {
      setScore(0);
    }
  }, [formData]);

  const pickMsg = (fr: string, en: string, es: string) =>
    locale === 'en' ? en : locale === 'es' ? es : fr;

  const handleSave = async () => {
    if (!questionnaireCode) {
      toast.error(pickMsg(
        'Code de questionnaire introuvable',
        'Questionnaire code not found',
        'Código de cuestionario no encontrado'
      ));
      return;
    }

    try {
      const payload = formData != null && typeof formData === 'object' && !Array.isArray(formData) ? formData : {};
      const response = await apiService.saveQuestionnaireData(questionnaireCode, payload);
      const msgSuccess = pickMsg('Données sauvegardées avec succès !', 'Data saved successfully!', '¡Datos guardados con éxito!');
      const msgError = pickMsg('Erreur lors de la sauvegarde', 'Save error', 'Error al guardar');
      if (response.success) {
        toast.success(msgSuccess);
      } else {
        toast.error(response.message || msgError);
      }
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || pickMsg('Erreur lors de la sauvegarde', 'Save error', 'Error al guardar'));
    }
  };

  const handleQuit = () => {
    router.push('/');
  };

  const scoreLabel = pickMsg('Score total', 'Total score', 'Puntaje total');
  const maxScore = 950;

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between bg-white/10 px-4 py-4 backdrop-blur-lg lg:px-8 4xl:px-10">
      <Link href="https://volontecanada.ca" target="_blank" rel="noopener noreferrer" className="flex items-center">
        <Image
          src="/logo2.png"
          alt="Logo"
          width={120}
          height={40}
          className="h-auto w-auto"
          priority
        />
      </Link>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-lg border border-white/40 bg-white/10 px-4 py-2 backdrop-blur-sm">
          <span className="text-xs font-medium text-white/90">{t.language}</span>
          <RadioGroup
            value={locale}
            setValue={(v) => setLocale((v as FormLocale) || 'fr')}
            className="flex gap-4"
          >
            <AdvancedRadio
              value="fr"
              title="Français"
              className="[&_.rizzui-advanced-radio]:flex [&_.rizzui-advanced-radio]:items-center [&_.rizzui-advanced-radio]:gap-2 [&_.rizzui-advanced-radio]:px-3 [&_.rizzui-advanced-radio]:py-1.5"
              inputClassName="[&~span]:border-2 [&~span]:border-white/70 [&~span]:rounded-full [&:checked~span]:bg-white [&:checked~span]:border-white [&:checked~span]:ring-2 [&:checked~span]:ring-white/50"
            >
              <span className="text-lg leading-none" aria-hidden>🇫🇷</span>
              <span className="text-sm text-white">Français</span>
            </AdvancedRadio>
            <AdvancedRadio
              value="en"
              title="English"
              className="[&_.rizzui-advanced-radio]:flex [&_.rizzui-advanced-radio]:items-center [&_.rizzui-advanced-radio]:gap-2 [&_.rizzui-advanced-radio]:px-3 [&_.rizzui-advanced-radio]:py-1.5"
              inputClassName="[&~span]:border-2 [&~span]:border-white/70 [&~span]:rounded-full [&:checked~span]:bg-white [&:checked~span]:border-white [&:checked~span]:ring-2 [&:checked~span]:ring-white/50"
            >
              <span className="text-lg leading-none" aria-hidden>🇬🇧</span>
              <span className="text-sm text-white">English</span>
            </AdvancedRadio>
            <AdvancedRadio
              value="es"
              title="Español"
              className="[&_.rizzui-advanced-radio]:flex [&_.rizzui-advanced-radio]:items-center [&_.rizzui-advanced-radio]:gap-2 [&_.rizzui-advanced-radio]:px-3 [&_.rizzui-advanced-radio]:py-1.5"
              inputClassName="[&~span]:border-2 [&~span]:border-white/70 [&~span]:rounded-full [&:checked~span]:bg-white [&:checked~span]:border-white [&:checked~span]:ring-2 [&:checked~span]:ring-white/50"
            >
              <span className="text-lg leading-none" aria-hidden>🇪🇸</span>
              <span className="text-sm text-white">Español</span>
            </AdvancedRadio>
          </RadioGroup>
        </div>
        <div className="rounded-lg bg-white/20 px-4 py-2 backdrop-blur-sm">
          <div className="text-center">
            <p className="text-xs text-white/80">{scoreLabel}</p>
            <p className="text-xl font-bold text-white">
              {score} / {maxScore}
            </p>
          </div>
        </div>

        <Button
          rounded="pill"
          variant="outline"
          onClick={handleSave}
          className="border-white text-white backdrop-blur-lg hover:border-white hover:bg-white hover:text-black"
        >
          {t.save}
        </Button>
        <Button
          rounded="pill"
          variant="outline"
          onClick={handleQuit}
          className="border-white text-white backdrop-blur-lg hover:border-white hover:bg-white hover:text-black"
        >
          {t.quit}
        </Button>
      </div>
    </header>
  );
}
