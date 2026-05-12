'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PageHeader from '@/app/shared/page-header';
import { apiService } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from 'rizzui';
import { routes } from '@/config/routes';
import toast from 'react-hot-toast';
import { Loader, Badge } from 'rizzui';
import { PiFilePdf } from 'react-icons/pi';
import { calculatePSTQScore } from '@/services/pstq-scoring';

interface QuestionnaireRequest {
  id: number;
  unique_code: string;
  email: string;
  form_type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'expired';
  sent_at: string;
  expires_at: string;
  completed_at?: string;
  email_sent?: boolean;
  email_error?: string | null;
  client?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  custom_name?: string;
  form_data?: any;
}

function getStatusBadge(status: string) {
  const badges = {
    pending: { label: 'En attente', color: 'warning' },
    in_progress: { label: 'En cours', color: 'info' },
    completed: { label: 'Complété', color: 'success' },
    expired: { label: 'Expiré', color: 'danger' },
  };
  const badge = badges[status as keyof typeof badges] || badges.pending;
  
  return (
    <Badge color={badge.color as any} renderAsDot>
      {badge.label}
    </Badge>
  );
}

function getFormTypeLabel(formType: string) {
  const types: Record<string, string> = {
    questionnaire_demandeur_001: 'Questionnaire Demandeur 001',
    questionnaire_repondant: 'Questionnaire Répondant',
    questionnaire_pstq_pointage: 'Questionnaire PSTQ Pointage',
  };
  return types[formType] || formType;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function QuestionnaireDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, userType } = useAuth();
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pstqScore, setPstqScore] = useState<any>(null);

  useEffect(() => {
    if (isAuthenticated === false || userType !== 'admin') {
      router.push('/auth/admin-signin');
    } else if (params.id) {
      loadQuestionnaire();
    }
  }, [isAuthenticated, userType, router, params.id]);

  const loadQuestionnaire = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getQuestionnaire(Number(params.id));
      if (response.success && response.data) {
        setQuestionnaire(response.data);
        
        // Si c'est un formulaire PSTQ, calculer le score
        if (response.data.form_type === 'questionnaire_pstq_pointage' && response.data.form_data) {
          try {
            const score = calculatePSTQScore(response.data.form_data);
            setPstqScore(score);
          } catch (error) {
            console.error('Erreur lors du calcul du score PSTQ:', error);
          }
        }
      } else {
        toast.error('Questionnaire introuvable');
        router.push(routes.questionnaires.list);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement du questionnaire');
      router.push(routes.questionnaires.list);
    } finally {
      setIsLoading(false);
    }
  };

  const renderFormData = () => {
    if (!questionnaire?.form_data) {
      return (
        <div className="py-8 text-center text-gray-500">
          Aucune donnée remplie pour le moment.
        </div>
      );
    }

    const formData = questionnaire.form_data;

    if (questionnaire.form_type === 'questionnaire_pstq_pointage') {
      return (
        <div className="space-y-6">
          {pstqScore && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Score PSTQ
              </h3>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Score total</p>
                  <p className="text-2xl font-bold text-primary">{pstqScore.total} / 950</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Bloc A</p>
                  <p className="text-xl font-semibold">{pstqScore.blocA.total} / 520</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Bloc B</p>
                  <p className="text-xl font-semibold">{pstqScore.blocB.total} / 700</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Bloc C</p>
                  <p className="text-xl font-semibold">{pstqScore.blocC.total} / 180</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid gap-6 md:grid-cols-2">
            {Object.entries(formData).map(([key, value]) => {
              if (value === null || value === undefined || value === '') return null;
              if (Array.isArray(value) && value.length === 0) return null;
              
              return (
                <div key={key} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 capitalize">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {Array.isArray(value) ? JSON.stringify(value) : String(value)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Pour les autres types de formulaires, affichage générique
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {Object.entries(formData).map(([key, value]) => {
          if (value === null || value === undefined || value === '') return null;
          if (Array.isArray(value) && value.length === 0) return null;
          
          return (
            <div key={key} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 capitalize">
                {key.replace(/_/g, ' ')}
              </p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {Array.isArray(value) ? JSON.stringify(value) : String(value)}
              </p>
            </div>
          );
        })}
      </div>
    );
  };

  const pageHeader = {
    title: 'Détails du Questionnaire',
    breadcrumb: [
      {
        href: '/',
        name: 'Dashboard',
      },
      {
        href: routes.questionnaires.list,
        name: 'Questionnaires',
      },
      {
        name: 'Détails',
      },
    ],
  };

  if (isLoading) {
    return (
      <>
        <PageHeader title={pageHeader.title} breadcrumb={pageHeader.breadcrumb} />
        <div className="mt-6 flex items-center justify-center py-12">
          <Loader size="xl" />
        </div>
      </>
    );
  }

  if (!questionnaire) {
    return null;
  }

  return (
    <>
      <PageHeader title={pageHeader.title} breadcrumb={pageHeader.breadcrumb}>
        <div className="flex flex-wrap items-center gap-2">
          {questionnaire.form_type === 'questionnaire_demandeur_001' && questionnaire.form_data != null && (
            <>
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const { buildClientFormPdf } = await import('@/app/shared/client-form/client-form-multi-step/build-client-form-pdf');
                    await buildClientFormPdf(questionnaire.form_data ?? {}, 'fr', {
                      preview: true,
                      meta: {
                        formType: getFormTypeLabel(questionnaire.form_type),
                        submittedAt: questionnaire.sent_at,
                        status: questionnaire.status,
                        completedAt: questionnaire.completed_at,
                        updatedAt: (questionnaire as any).updated_at,
                      },
                    });
                  } catch (e: any) {
                    console.error(e);
                    toast.error(e?.message ? `PDF: ${e.message}` : 'Erreur lors de la génération du PDF');
                  }
                }}
              >
                <PiFilePdf className="me-2 h-5 w-5" />
                Prévisualiser le PDF
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const { buildClientFormPdf } = await import('@/app/shared/client-form/client-form-multi-step/build-client-form-pdf');
                    await buildClientFormPdf(questionnaire.form_data ?? {}, 'fr', {
                      meta: {
                        formType: getFormTypeLabel(questionnaire.form_type),
                        submittedAt: questionnaire.sent_at,
                        status: questionnaire.status,
                        completedAt: questionnaire.completed_at,
                        updatedAt: (questionnaire as any).updated_at,
                      },
                    });
                  } catch (e: any) {
                    console.error(e);
                    toast.error(e?.message ? `PDF: ${e.message}` : 'Erreur lors de la génération du PDF');
                  }
                }}
              >
                <PiFilePdf className="me-2 h-5 w-5" />
                Télécharger la version PDF
              </Button>
            </>
          )}
          <Button
            onClick={() => router.push(routes.questionnaires.list)}
            variant="outline"
          >
            Retour à la liste
          </Button>
        </div>
      </PageHeader>

      <div className="mt-6 space-y-6">
        {/* Informations générales */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-0">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Informations générales
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{questionnaire.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Client</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {questionnaire.client
                  ? `${questionnaire.client.first_name} ${questionnaire.client.last_name}`
                  : questionnaire.custom_name || '-'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Type de formulaire</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {getFormTypeLabel(questionnaire.form_type)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Statut</p>
              <div className="mt-1">{getStatusBadge(questionnaire.status)}</div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Date d&apos;envoi</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {formatDate(questionnaire.sent_at)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Expire le</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {formatDate(questionnaire.expires_at)}
              </p>
            </div>
            {questionnaire.completed_at && (
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Complété le</p>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {formatDate(questionnaire.completed_at)}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Code unique</p>
              <p className="mt-1 font-mono text-sm text-gray-900 dark:text-white">
                {questionnaire.unique_code}
              </p>
            </div>
            {questionnaire.email_sent !== undefined && (
              <>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Email envoyé au client</p>
                  <p className="mt-1 text-sm">
                    {questionnaire.email_sent ? (
                      <span className="font-medium text-green-600 dark:text-green-400">Oui</span>
                    ) : (
                      <span className="font-medium text-red-600 dark:text-red-400">Non</span>
                    )}
                  </p>
                </div>
                {questionnaire.email_sent === false && questionnaire.email_error && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Erreur d&apos;envoi</p>
                    <p className="mt-1 rounded bg-red-50 p-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                      {questionnaire.email_error}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Données du formulaire */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-0">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Données du formulaire
          </h2>
          {renderFormData()}
        </div>
      </div>
    </>
  );
}



