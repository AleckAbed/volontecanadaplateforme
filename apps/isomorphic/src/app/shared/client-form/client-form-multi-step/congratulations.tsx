'use client';

import { PiCheckCircleFill, PiFilePdf } from 'react-icons/pi';
import { Button } from 'rizzui';
import { useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { formDataAtom } from './index';
import { questionnaireLocaleAtom } from '@/app/shared/questionnaire-locale';
import { CONGRATULATIONS_T } from '@/app/shared/client-form/client-form-translations';
import { apiService } from '@/services/api';
import toast from 'react-hot-toast';

export default function Congratulations() {
  const router = useRouter();
  const [formData] = useAtom(formDataAtom);
  const [locale] = useAtom(questionnaireLocaleAtom);
  const t = CONGRATULATIONS_T[locale] || CONGRATULATIONS_T.fr;
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

          // If we were called from an invitation, return to it
          let invitationCode: string | null = null;
          try { invitationCode = sessionStorage.getItem('return_to_invitation'); } catch {}
          if (invitationCode) {
            try { sessionStorage.removeItem('return_to_invitation'); } catch {}
            setTimeout(() => router.push(`/invitation/${invitationCode}`), 1500);
          }
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
              {t.submitting}
            </h1>
            <p className="mt-4 text-base text-white/80">
              {t.pleaseWait}
            </p>
          </>
        ) : (
          <>
            <PiCheckCircleFill className="mx-auto h-20 w-20 text-white" />
            <h1 className="mt-6 text-2xl font-semibold text-white @3xl:text-3xl">
              {t.success}
            </h1>
            <p className="mt-4 text-base text-white/80">
              {t.successDesc}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white/10"
                size="lg"
                onClick={async () => {
                  try {
                    const { buildClientFormPdf } = await import('./build-client-form-pdf');
                    const data = formData != null && typeof formData === 'object' && !Array.isArray(formData) ? formData : {};
                    await buildClientFormPdf(data, locale === 'en' ? 'en' : 'fr', { preview: true });
                  } catch (e: any) {
                    console.error(e);
                    toast.error(e?.message ? `PDF: ${e.message}` : 'Erreur lors de la génération du PDF');
                  }
                }}
              >
                <PiFilePdf className="me-2 h-5 w-5" />
                {t.previewPdf}
              </Button>
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white/10"
                size="lg"
                onClick={async () => {
                  try {
                    const { buildClientFormPdf } = await import('./build-client-form-pdf');
                    const data = formData != null && typeof formData === 'object' && !Array.isArray(formData) ? formData : {};
                    await buildClientFormPdf(data, locale === 'en' ? 'en' : 'fr');
                  } catch (e: any) {
                    console.error(e);
                    toast.error(e?.message ? `PDF: ${e.message}` : 'Erreur lors de la génération du PDF');
                  }
                }}
              >
                <PiFilePdf className="me-2 h-5 w-5" />
                {t.downloadPdf}
              </Button>
              <Button
                onClick={() => router.push('/')}
                size="lg"
              >
                {t.backHome}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

