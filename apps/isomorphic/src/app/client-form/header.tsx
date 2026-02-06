'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FiSave, FiX } from 'react-icons/fi';
import { Button } from 'rizzui';
import cn from '@core/utils/class-names';
import { siteConfig } from '@/config/site.config';
import { useAtom } from 'jotai';
import { formDataAtom } from '@/app/shared/client-form/client-form-multi-step';
import { apiService } from '@/services/api';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';

interface HeaderProps {
  className?: string;
}

export default function Header({ className }: HeaderProps) {
  const router = useRouter();
  const [formData] = useAtom(formDataAtom);
  const [isSaving, setIsSaving] = useState(false);
  const [questionnaireCode, setQuestionnaireCode] = useState<string | null>(null);

  // Récupérer le code depuis l'URL ou localStorage
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
      console.log('Sauvegarde manuelle - Code:', questionnaireCode, 'Données:', Object.keys(safeFormData).length, 'champs');
      const response = await apiService.saveQuestionnaireData(questionnaireCode, safeFormData);
      if (response.success) {
        toast.success('Données sauvegardées avec succès');
        console.log('Sauvegarde réussie:', response);
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
      <Link href={'/'}>
        <Image
          src="/logo2.png"
          alt={siteConfig.title}
          width={150}
          height={50}
          className="h-auto w-auto"
          priority
        />
      </Link>
      <div className="flex items-center gap-2">
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

