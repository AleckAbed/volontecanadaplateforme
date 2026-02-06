'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, Button } from 'rizzui';
import { apiService } from '@/services/api';
import toast from 'react-hot-toast';
import Image from 'next/image';

const verifySchema = z.object({
  email: z.string().email('Email invalide'),
  code: z.string().length(32, 'Le code doit contenir 32 caractères'),
});

type VerifyInput = z.infer<typeof verifySchema>;

export default function VerifyQuestionnaireClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyInput>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      email: searchParams.get('email') || '',
      code: searchParams.get('code') || '',
    },
  });

  const onSubmit: SubmitHandler<VerifyInput> = async (data) => {
    setIsLoading(true);
    try {
      const response = await apiService.verifyQuestionnaireAccess(data.email, data.code);

      if (response.success && response.data) {
        const { status, unique_code, form_data, form_type, days_remaining } = response.data;

        localStorage.setItem('questionnaire_code', unique_code);
        localStorage.setItem('questionnaire_email', data.email);
        localStorage.setItem('questionnaire_days_remaining', days_remaining?.toString() || '14');
        localStorage.setItem('questionnaire_form_type', form_type || 'questionnaire_demandeur_001');

        if (status === 'completed') {
          router.push(`/questionnaire/completed?code=${unique_code}`);
        } else if (status === 'expired') {
          router.push(`/questionnaire/expired?code=${unique_code}`);
        } else {
          if (form_data) {
            if (form_type === 'questionnaire_repondant') {
              localStorage.setItem('sponsorMultiStepForm', JSON.stringify(form_data));
            } else if (form_type === 'questionnaire_pstq_pointage') {
              localStorage.setItem('pstqMultiStepForm', JSON.stringify(form_data));
            } else {
              localStorage.setItem('clientMultiStepForm', JSON.stringify(form_data));
            }
          }
          if (form_type === 'questionnaire_repondant') {
            router.push(`/sponsor-form?code=${unique_code}`);
          } else if (form_type === 'questionnaire_pstq_pointage') {
            router.push(`/pstq-form?code=${unique_code}`);
          } else {
            router.push(`/client-form?code=${unique_code}`);
          }
        }
      } else {
        toast.error(response.message || 'Email ou code invalide');
      }
    } catch (error: any) {
      console.error('Erreur:', error);
      if (error.message?.includes('expiré')) {
        router.push('/questionnaire/expired');
      } else {
        toast.error(error.message || 'Erreur lors de la vérification');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-red-600/70 to-red-800/70 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
          style={{ backgroundImage: 'url(/bg0.jpg)' }}
        />
        <div className="fixed inset-0 bg-gradient-to-r from-red-600/70 to-red-800/70 -z-10" />

        <div className="relative bg-white rounded-lg shadow-xl p-8 dark:bg-gray-0">
          <div className="mb-6 text-center">
            <Image
              src="/logo2.png"
              alt="Logo"
              width={150}
              height={50}
              className="mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Accès au Formulaire
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Veuillez entrer votre email et le code unique reçu par courriel
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="votre@email.com"
              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              label="Code unique"
              placeholder="Entrez le code à 32 caractères"
              {...register('code')}
              error={errors.code?.message}
              maxLength={32}
            />
            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full"
              size="lg"
            >
              Accéder au Formulaire
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
