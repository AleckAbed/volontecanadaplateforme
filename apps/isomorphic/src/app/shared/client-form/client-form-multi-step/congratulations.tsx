'use client';

import { PiCheckCircleFill } from 'react-icons/pi';
import { Button } from 'rizzui';
import { useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { formDataAtom } from './index';
import { apiService } from '@/services/api';
import toast from 'react-hot-toast';

export default function Congratulations() {
  const router = useRouter();
  const [formData] = useAtom(formDataAtom);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    // Soumettre le formulaire automatiquement
    const submitForm = async () => {
      const questionnaireCode = localStorage.getItem('questionnaire_code');
      if (!questionnaireCode || isSubmitted) return;

      setIsSubmitting(true);
      try {
        const payload = formData != null && typeof formData === 'object' && !Array.isArray(formData) ? formData : {};
        const response = await apiService.submitQuestionnaire(questionnaireCode, payload);
        if (response.success) {
          setIsSubmitted(true);
          // Nettoyer les données locales
          localStorage.removeItem('questionnaire_code');
          localStorage.removeItem('questionnaire_days_remaining');
          localStorage.removeItem('clientFormData');
        } else {
          toast.error(response.message || 'Erreur lors de la soumission');
        }
      } catch (error: any) {
        console.error('Erreur:', error);
        toast.error(error.message || 'Erreur lors de la soumission du formulaire');
      } finally {
        setIsSubmitting(false);
      }
    };

    submitForm();
  }, [formData, isSubmitted]);

  return (
    <div className="col-span-full flex flex-col items-center justify-center text-center">
      <div className="mx-auto max-w-2xl">
        {isSubmitting ? (
          <>
            <div className="mx-auto h-20 w-20 animate-spin rounded-full border-4 border-white border-t-transparent" />
            <h1 className="mt-6 text-2xl font-semibold text-white @3xl:text-3xl">
          Soumission en cours...
        </h1>
            <p className="mt-4 text-base text-white/80">
              Veuillez patienter pendant que nous enregistrons votre formulaire.
            </p>
          </>
        ) : (
          <>
            <PiCheckCircleFill className="mx-auto h-20 w-20 text-white" />
            <h1 className="mt-6 text-2xl font-semibold text-white @3xl:text-3xl">
              Formulaire soumis avec succès !
            </h1>
            <p className="mt-4 text-base text-white/80">
              Votre formulaire a été soumis avec succès. Nous vous contacterons
              bientôt pour la suite du processus.
            </p>
            <Button
              onClick={() => router.push('/')}
              className="mt-8"
              size="lg"
            >
              Retour à l'accueil
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

