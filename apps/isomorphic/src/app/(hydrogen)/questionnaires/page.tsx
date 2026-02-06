'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/app/shared/page-header';
import { apiService } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input, Select } from 'rizzui';
import { routes } from '@/config/routes';
import toast from 'react-hot-toast';
import { PiMagnifyingGlassBold, PiCaretUp, PiCaretDown } from 'react-icons/pi';
import { Badge, Text } from 'rizzui';

interface QuestionnaireRequest {
  id: number;
  unique_code: string;
  email: string;
  form_type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'expired';
  sent_at: string;
  expires_at: string;
  completed_at?: string;
  client?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  custom_name?: string;
}

const formTypeOptions = [
  { label: 'Tous les types', value: '' },
  { label: 'Questionnaire Demandeur 001', value: 'questionnaire_demandeur_001' },
  { label: 'Questionnaire Répondant', value: 'questionnaire_repondant' },
  { label: 'Questionnaire PSTQ Pointage', value: 'questionnaire_pstq_pointage' },
];

function getStatusBadge(status: string) {
  const badges = {
    pending: { label: 'En attente', color: 'warning' },
    in_progress: { label: 'En cours', color: 'info' },
    completed: { label: 'Complété', color: 'success' },
    expired: { label: 'Expiré', color: 'danger' },
  };
  const badge = badges[status as keyof typeof badges] || badges.pending;
  
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium bg-${badge.color}-100 text-${badge.color}-800`}>
      {badge.label}
    </span>
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

export default function QuestionnairesPage() {
  const router = useRouter();
  const { isAuthenticated, userType } = useAuth();
  const [questionnaires, setQuestionnaires] = useState<QuestionnaireRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormType, setSelectedFormType] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: 'asc' | 'desc' | null;
  }>({ key: null, direction: null });

  useEffect(() => {
    if (isAuthenticated === false || userType !== 'admin') {
      router.push('/auth/admin-signin');
    } else {
      loadQuestionnaires();
    }
  }, [isAuthenticated, userType, router, currentPage]);

  // Réinitialiser la page à 1 quand on change les filtres
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedFormType]);

  const loadQuestionnaires = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.listQuestionnaires(currentPage);
      if (response.success && response.data) {
        setQuestionnaires(response.data.data || []);
        setTotalPages(response.data.last_page || 1);
        setTotalItems(response.data.total || 0);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des questionnaires');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction de tri
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filtrer et trier les données localement
  const filteredAndSortedQuestionnaires = useMemo(() => {
    let filtered = [...questionnaires];

    // Filtre par type de formulaire
    if (selectedFormType) {
      filtered = filtered.filter((q) => q.form_type === selectedFormType);
    }

    // Recherche par mot-clé
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((q) => {
        const email = q.email?.toLowerCase() || '';
        const clientName = q.client
          ? `${q.client.first_name} ${q.client.last_name}`.toLowerCase()
          : q.custom_name?.toLowerCase() || '';
        const formType = getFormTypeLabel(q.form_type).toLowerCase();
        const status = q.status?.toLowerCase() || '';
        
        return (
          email.includes(searchLower) ||
          clientName.includes(searchLower) ||
          formType.includes(searchLower) ||
          status.includes(searchLower)
        );
      });
    }

    // Tri
    if (sortConfig.key && sortConfig.direction) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortConfig.key) {
          case 'email':
            aValue = a.email?.toLowerCase() || '';
            bValue = b.email?.toLowerCase() || '';
            break;
          case 'client':
            aValue = a.client
              ? `${a.client.first_name} ${a.client.last_name}`.toLowerCase()
              : a.custom_name?.toLowerCase() || '';
            bValue = b.client
              ? `${b.client.first_name} ${b.client.last_name}`.toLowerCase()
              : b.custom_name?.toLowerCase() || '';
            break;
          case 'form_type':
            aValue = getFormTypeLabel(a.form_type).toLowerCase();
            bValue = getFormTypeLabel(b.form_type).toLowerCase();
            break;
          case 'status':
            aValue = a.status?.toLowerCase() || '';
            bValue = b.status?.toLowerCase() || '';
            break;
          case 'sent_at':
            aValue = new Date(a.sent_at).getTime();
            bValue = new Date(b.sent_at).getTime();
            break;
          case 'expires_at':
            aValue = new Date(a.expires_at).getTime();
            bValue = new Date(b.expires_at).getTime();
            break;
          default:
            return 0;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [questionnaires, selectedFormType, searchTerm, sortConfig]);

  // Pagination des données filtrées
  const itemsPerPage = 10;
  const totalFilteredPages = Math.ceil(filteredAndSortedQuestionnaires.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedQuestionnaires = filteredAndSortedQuestionnaires.slice(startIndex, endIndex);

  const pageHeader = {
    title: 'Questionnaires Envoyés',
    breadcrumb: [
      {
        href: '/',
        name: 'Dashboard',
      },
      {
        name: 'Questionnaires',
      },
    ],
  };

  return (
    <>
      <PageHeader title={pageHeader.title} breadcrumb={pageHeader.breadcrumb}>
        <Button
          onClick={() => router.push(routes.questionnaires.send)}
          className="gap-2"
        >
          Envoyer un Formulaire
        </Button>
      </PageHeader>

      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-0">
        {/* Filtres */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              type="search"
              placeholder="Rechercher par email, client, type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              inputClassName="h-9"
              clearable={true}
              prefix={<PiMagnifyingGlassBold className="h-4 w-4" />}
            />
          </div>
          <div className="w-[250px]">
            <Select
              placeholder="Filtrer par type"
              options={formTypeOptions}
              value={selectedFormType}
              onChange={(selected: string | { value: string; label: string } | null) => setSelectedFormType(typeof selected === 'string' ? selected : selected?.value || '')}
              getOptionValue={(option) => option.value}
              displayValue={(selected) => {
                const option = formTypeOptions.find((opt) => opt.value === selected);
                return option?.label || 'Tous les types';
              }}
            />
          </div>
        </div>

        {/* Tableau */}
        {isLoading ? (
          <div className="py-8 text-center">Chargement...</div>
        ) : filteredAndSortedQuestionnaires.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            {searchTerm || selectedFormType
              ? 'Aucun questionnaire ne correspond aux critères de recherche.'
              : 'Aucun questionnaire envoyé pour le moment.'}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th
                      className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => handleSort('email')}
                    >
                      <div className="flex items-center gap-2">
                        Email
                        {sortConfig.key === 'email' && (
                          sortConfig.direction === 'asc' ? (
                            <PiCaretUp className="h-4 w-4" />
                          ) : (
                            <PiCaretDown className="h-4 w-4" />
                          )
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => handleSort('client')}
                    >
                      <div className="flex items-center gap-2">
                        Client
                        {sortConfig.key === 'client' && (
                          sortConfig.direction === 'asc' ? (
                            <PiCaretUp className="h-4 w-4" />
                          ) : (
                            <PiCaretDown className="h-4 w-4" />
                          )
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => handleSort('form_type')}
                    >
                      <div className="flex items-center gap-2">
                        Type
                        {sortConfig.key === 'form_type' && (
                          sortConfig.direction === 'asc' ? (
                            <PiCaretUp className="h-4 w-4" />
                          ) : (
                            <PiCaretDown className="h-4 w-4" />
                          )
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-2">
                        Statut
                        {sortConfig.key === 'status' && (
                          sortConfig.direction === 'asc' ? (
                            <PiCaretUp className="h-4 w-4" />
                          ) : (
                            <PiCaretDown className="h-4 w-4" />
                          )
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => handleSort('sent_at')}
                    >
                      <div className="flex items-center gap-2">
                        Date d'envoi
                        {sortConfig.key === 'sent_at' && (
                          sortConfig.direction === 'asc' ? (
                            <PiCaretUp className="h-4 w-4" />
                          ) : (
                            <PiCaretDown className="h-4 w-4" />
                          )
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => handleSort('expires_at')}
                    >
                      <div className="flex items-center gap-2">
                        Expire le
                        {sortConfig.key === 'expires_at' && (
                          sortConfig.direction === 'asc' ? (
                            <PiCaretUp className="h-4 w-4" />
                          ) : (
                            <PiCaretDown className="h-4 w-4" />
                          )
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedQuestionnaires.map((q) => (
                    <tr key={q.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="px-4 py-3 text-sm">{q.email}</td>
                      <td className="px-4 py-3 text-sm">
                        {q.client
                          ? `${q.client.first_name} ${q.client.last_name}`
                          : q.custom_name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">{getFormTypeLabel(q.form_type)}</td>
                      <td className="px-4 py-3 text-sm">{getStatusBadge(q.status)}</td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(q.sent_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(q.expires_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="text"
                          size="sm"
                          onClick={() => router.push(routes.questionnaires.details(q.id.toString()))}
                        >
                          Voir
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalFilteredPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Affichage de {startIndex + 1} à {Math.min(endIndex, filteredAndSortedQuestionnaires.length)} sur {filteredAndSortedQuestionnaires.length} questionnaire(s)
                  {searchTerm || selectedFormType ? ' (filtrés)' : ''}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentPage((prev) => Math.max(1, prev - 1));
                    }}
                    disabled={currentPage === 1}
                  >
                    Précédent
                  </Button>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Page {currentPage} sur {totalFilteredPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentPage((prev) => Math.min(totalFilteredPages, prev + 1));
                    }}
                    disabled={currentPage === totalFilteredPages}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
