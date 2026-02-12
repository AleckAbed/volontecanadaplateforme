'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FiSave, FiX } from 'react-icons/fi';
import { Button, RadioGroup, AdvancedRadio } from 'rizzui';
import cn from '@core/utils/class-names';
import { siteConfig } from '@/config/site.config';
import { useAtom } from 'jotai';
import {
  sponsorFormDataAtom,
  pickSponsorFields,
} from '@/app/shared/sponsor-form/sponsor-form-multi-step';
import { questionnaireLocaleAtom, type FormLocale } from '@/app/shared/questionnaire-locale';
import { apiService } from '@/services/api';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';

interface HeaderProps {
  className?: string;
}

export default function SponsorFormHeader({ className }: HeaderProps) {
  const router = useRouter();
  const [formData] = useAtom(sponsorFormDataAtom);
  const [locale, setLocale] = useAtom(questionnaireLocaleAtom);
  const [isSaving, setIsSaving] = useState(false);
  const [questionnaireCode, setQuestionnaireCode] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const codeFromUrl = urlParams.get('code');
      const codeFromStorage = localStorage.getItem('questionnaire_code');
      const code = codeFromUrl || codeFromStorage;
      setQuestionnaireCode(code);
    }
  }, []);

  const handleSave = async () => {
    if (!questionnaireCode) {
      toast.error('Code de questionnaire introuvable. Veuillez accéder au formulaire via le lien reçu par email.');
      return;
    }

    setIsSaving(true);
    try {
      const safeFormData = formData != null && typeof formData === 'object' && !Array.isArray(formData) ? formData : {};
      const payload = pickSponsorFields(safeFormData);
      const response = await apiService.saveQuestionnaireData(questionnaireCode, payload);
      if (response.success) {
        toast.success('Données sauvegardées avec succès');
      } else {
        toast.error(response.message || 'Erreur lors de la sauvegarde');
      }
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuit = () => {
    if (confirm('Êtes-vous sûr de vouloir quitter ? Vos modifications non sauvegardées seront perdues.')) {
      router.push('/');
    }
  };

  return (
    <header
      className={cn(
        'flex w-full items-center justify-between px-4 py-5 md:h-20 md:px-5 lg:px-8 4xl:px-10',
        className
      )}
    >
      <Link href="https://volontecanada.ca" target="_blank" rel="noopener noreferrer">
        <Image
          src="/logo2.png"
          alt={siteConfig.title}
          width={150}
          height={50}
          className="h-auto w-auto"
          priority
        />
      </Link>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-white/40 bg-white/10 px-4 py-2 backdrop-blur-sm">
          <span className="text-xs font-medium text-white/90">Langue</span>
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
          </RadioGroup>
        </div>
        <Button variant="text" className="text-white hover:enabled:text-white">
          Questions?
        </Button>
        <Button
          rounded="pill"
          variant="outline"
          className="gap-2 whitespace-nowrap border-white text-white hover:border-white hover:bg-white hover:text-black"
          onClick={handleSave}
          isLoading={isSaving}
          disabled={!questionnaireCode}
        >
          <FiSave className="h-4 w-4" />
          Sauvegarder
        </Button>
        <Button
          rounded="pill"
          variant="outline"
          className="gap-2 whitespace-nowrap border-white text-white hover:border-white hover:bg-white hover:text-black"
          onClick={handleQuit}
        >
          <FiX className="h-4 w-4" />
          Quitter
        </Button>
      </div>
    </header>
  );
}
