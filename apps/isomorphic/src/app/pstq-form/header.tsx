'use client';

import { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from 'rizzui';
import { apiService } from '@/services/api';
import toast from 'react-hot-toast';
import { pstqFormDataAtom } from '@/app/shared/pstq-form/pstq-form-multi-step';
import { calculatePSTQScore } from '@/services/pstq-scoring';

export default function PSTQHeader() {
  const router = useRouter();
  const [formData] = useAtom(pstqFormDataAtom);
  const [score, setScore] = useState<number>(0);
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

  // Calculer le score en temps réel
  useEffect(() => {
    try {
      const calculatedScore = calculatePSTQScore(formData as any);
      setScore(calculatedScore.total);
    } catch (error) {
      // Si les données ne sont pas complètes, le score reste à 0
      setScore(0);
    }
  }, [formData]);

  const handleSave = async () => {
    if (!questionnaireCode) {
      toast.error('Code de questionnaire introuvable');
      return;
    }

    try {
      const payload = formData != null && typeof formData === 'object' && !Array.isArray(formData) ? formData : {};
      const response = await apiService.saveQuestionnaireData(questionnaireCode, payload);
      if (response.success) {
        toast.success('Données sauvegardées avec succès !');
      } else {
        toast.error(response.message || 'Erreur lors de la sauvegarde');
      }
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleQuit = () => {
    router.push('/');
  };

  // Score maximum selon la demande de l'utilisateur
  const maxScore = 950;

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between bg-white/10 px-4 py-4 backdrop-blur-lg lg:px-8 4xl:px-10">
      <Link href="/" className="flex items-center">
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
        {/* Affichage du score total */}
        <div className="rounded-lg bg-white/20 px-4 py-2 backdrop-blur-sm">
          <div className="text-center">
            <p className="text-xs text-white/80">Score total</p>
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
          Sauvegarder
        </Button>
        <Button
          rounded="pill"
          variant="outline"
          onClick={handleQuit}
          className="border-white text-white backdrop-blur-lg hover:border-white hover:bg-white hover:text-black"
        >
          Quitter
        </Button>
      </div>
    </header>
  );
}

