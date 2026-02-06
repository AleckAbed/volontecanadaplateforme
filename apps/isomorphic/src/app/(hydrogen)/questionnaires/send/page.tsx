'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import PageHeader from '@/app/shared/page-header';
import { Input, Select, Button, RadioGroup, AdvancedRadio } from 'rizzui';
import { Controller } from 'react-hook-form';
import { apiService } from '@/services/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

const sendQuestionnaireSchema = z.object({
  client_type: z.enum(['existing', 'custom']),
  client_id: z.number().optional(),
  custom_name: z.string().optional(),
  email: z.string().email('Email invalide'),
  phone: z.string().optional(),
  form_type: z.string().min(1, 'Le type de formulaire est requis'),
});

type SendQuestionnaireInput = z.infer<typeof sendQuestionnaireSchema>;

const formTypes = [
  { label: 'Questionnaire Demandeur 001', value: 'questionnaire_demandeur_001' },
  { label: 'Questionnaire Répondant', value: 'questionnaire_repondant' },
  { label: 'Questionnaire PSTQ Pointage', value: 'questionnaire_pstq_pointage' },
];

export default function SendQuestionnairePage() {
  const router = useRouter();
  const { isAuthenticated, userType } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<SendQuestionnaireInput>({
    resolver: zodResolver(sendQuestionnaireSchema),
    defaultValues: {
      client_type: 'existing',
      form_type: 'questionnaire_demandeur_001',
    },
  });

  const clientType = watch('client_type');

  useEffect(() => {
    if (isAuthenticated === false || userType !== 'admin') {
      router.push('/auth/admin-signin');
    }
  }, [isAuthenticated, userType, router]);

  useEffect(() => {
    if (clientType === 'existing') {
      loadClients();
    }
  }, [clientType]);

  const loadClients = async () => {
    setLoadingClients(true);
    try {
      const response = await apiService.getClients();
      if (response.success && response.data) {
        setClients(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
      toast.error('Erreur lors du chargement des clients');
    } finally {
      setLoadingClients(false);
    }
  };

  const onSubmit: SubmitHandler<SendQuestionnaireInput> = async (data) => {
    setIsLoading(true);
    try {
      const response = await apiService.sendQuestionnaire({
        client_type: data.client_type,
        client_id: data.client_type === 'existing' ? data.client_id : undefined,
        custom_name: data.client_type === 'custom' ? data.custom_name : undefined,
        email: data.email,
        phone: data.client_type === 'custom' ? data.phone : undefined,
        form_type: data.form_type,
      });

      if (response.success) {
        const emailSent = (response as any).email_sent === true;
        if (emailSent) {
          toast.success('Formulaire envoyé avec succès! Un email a été envoyé au client.');
        } else {
          toast.error(
            "Formulaire créé mais l'email n'a pas pu être envoyé au client. Vérifiez la configuration SMTP (api/.env) et les logs api/storage/logs/laravel.log.",
            { duration: 8000 }
          );
        }
        router.push('/questionnaires');
      } else {
        toast.error(response.message || 'Erreur lors de l\'envoi du formulaire');
      }
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error(error.message || 'Erreur lors de l\'envoi du formulaire');
    } finally {
      setIsLoading(false);
    }
  };

  const pageHeader = {
    title: 'Envoyer un Formulaire',
    breadcrumb: [
      {
        href: '/',
        name: 'Dashboard',
      },
      {
        name: 'Questionnaires',
      },
      {
        name: 'Envoyer',
      },
    ],
  };

  return (
    <>
      <PageHeader title={pageHeader.title} breadcrumb={pageHeader.breadcrumb} />
      <div className="mx-auto w-full max-w-4xl rounded-lg bg-white p-6 dark:bg-gray-0">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Type de client */}
          <div>
            <label className="mb-3 block text-sm font-medium text-gray-900 dark:text-white">
              Type de client
            </label>
            <Controller
              name="client_type"
              control={control}
              render={({ field: { value, onChange } }) => (
                <RadioGroup value={value} setValue={onChange} className="flex gap-6">
                  <AdvancedRadio
                    value="existing"
                    className="[&_.rizzui-advanced-radio]:px-4 [&_.rizzui-advanced-radio]:py-2"
                    inputClassName="[&~span]:border-0 [&~span]:ring-1 [&~span]:ring-gray-200 [&~span:hover]:ring-primary [&:checked~span:hover]:ring-primary [&:checked~span]:border-1 [&:checked~.rizzui-advanced-radio]:ring-2"
                  >
                    Client existant
                  </AdvancedRadio>
                  <AdvancedRadio
                    value="custom"
                    className="[&_.rizzui-advanced-radio]:px-4 [&_.rizzui-advanced-radio]:py-2"
                    inputClassName="[&~span]:border-0 [&~span]:ring-1 [&~span]:ring-gray-200 [&~span:hover]:ring-primary [&:checked~span:hover]:ring-primary [&:checked~span]:border-1 [&:checked~.rizzui-advanced-radio]:ring-2"
                  >
                    Client personnalisé
                  </AdvancedRadio>
                </RadioGroup>
              )}
            />
          </div>

          {/* Client existant */}
          {clientType === 'existing' && (
            <div>
              <Controller
                name="client_id"
                control={control}
                rules={{ required: 'Veuillez sélectionner un client' }}
                render={({ field: { value, onChange } }) => (
                  <Select
                    label="Sélectionner un client"
                    placeholder={loadingClients ? 'Chargement...' : 'Choisir un client'}
                    options={clients.map((client) => ({
                      label: `${client.first_name} ${client.last_name} (${client.email})`,
                      value: client.id.toString(),
                    }))}
                    value={value?.toString()}
                    onChange={(selected: string | { value: number } | null) => onChange(typeof selected === 'string' ? parseInt(selected) : selected?.value)}
                    getOptionValue={(option) => option.value}
                    displayValue={(selected) => {
                      const client = clients.find((c) => c.id.toString() === selected);
                      return client ? `${client.first_name} ${client.last_name} (${client.email})` : '';
                    }}
                    error={errors.client_id?.message}
                  />
                )}
              />
            </div>
          )}

          {/* Client personnalisé */}
          {clientType === 'custom' && (
            <>
              <Input
                label="Nom complet"
                placeholder="Nom et prénom du client"
                {...register('custom_name')}
                error={errors.custom_name?.message}
              />
              <Input
                label="Téléphone"
                placeholder="Numéro de téléphone"
                {...register('phone')}
                error={errors.phone?.message}
              />
            </>
          )}

          {/* Email */}
          <Input
            label="Email"
            type="email"
            placeholder="adresse@email.com"
            {...register('email')}
            error={errors.email?.message}
            disabled={clientType === 'existing'}
          />

          {/* Type de formulaire */}
          <Controller
            name="form_type"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Select
                label="Type de formulaire"
                placeholder="Sélectionner un type"
                options={formTypes}
                value={value}
                 onChange={(selected: string | { value: string; label: string } | null) => onChange(typeof selected === 'string' ? selected : selected?.value || '')}
                getOptionValue={(option) => option.value}
                displayValue={(selected) => {
                  const option = formTypes.find((opt) => opt.value === selected);
                  return option?.label || '';
                }}
                error={errors.form_type?.message}
              />
            )}
          />

          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Annuler
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Envoyer le Formulaire
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}

