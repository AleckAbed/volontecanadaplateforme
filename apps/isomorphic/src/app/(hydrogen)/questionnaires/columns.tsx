'use client';

import { HeaderCell } from '@core/components/legacy-table';
import { Badge, Text, ActionIcon } from 'rizzui';
import { routes } from '@/config/routes';
import { useRouter } from 'next/navigation';
import EyeIcon from '@core/components/icons/eye';

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
    <div className="flex items-center">
      <Badge color={badge.color as any} renderAsDot />
      <Text className="ms-2 font-medium text-gray-700 dark:text-gray-300">
        {badge.label}
      </Text>
    </div>
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

type Columns = {
  data: QuestionnaireRequest[];
  sortConfig?: any;
  onHeaderCellClick: (value: string) => void;
  onViewItem: (id: number) => void;
};

export const getColumns = ({
  data,
  sortConfig,
  onHeaderCellClick,
  onViewItem,
}: Columns) => [
  {
    title: (
      <HeaderCell
        title="Email"
        sortable
        ascending={
          sortConfig?.direction === 'asc' && sortConfig?.key === 'email'
        }
      />
    ),
    onHeaderCell: () => onHeaderCellClick('email'),
    dataIndex: 'email',
    key: 'email',
    width: 250,
    render: (email: string) => (
      <Text className="text-sm font-medium text-gray-900 dark:text-white">
        {email}
      </Text>
    ),
  },
  {
    title: (
      <HeaderCell
        title="Client"
        sortable
        ascending={
          sortConfig?.direction === 'asc' && sortConfig?.key === 'client'
        }
      />
    ),
    onHeaderCell: () => onHeaderCellClick('client'),
    dataIndex: 'client',
    key: 'client',
    width: 200,
    render: (_: any, row: QuestionnaireRequest) => (
      <Text className="text-sm text-gray-700 dark:text-gray-300">
        {row.client
          ? `${row.client.first_name} ${row.client.last_name}`
          : row.custom_name || '-'}
      </Text>
    ),
  },
  {
    title: (
      <HeaderCell
        title="Type"
        sortable
        ascending={
          sortConfig?.direction === 'asc' && sortConfig?.key === 'form_type'
        }
      />
    ),
    onHeaderCell: () => onHeaderCellClick('form_type'),
    dataIndex: 'form_type',
    key: 'form_type',
    width: 250,
    render: (formType: string) => (
      <Text className="text-sm text-gray-700 dark:text-gray-300">
        {getFormTypeLabel(formType)}
      </Text>
    ),
  },
  {
    title: (
      <HeaderCell
        title="Statut"
        sortable
        ascending={
          sortConfig?.direction === 'asc' && sortConfig?.key === 'status'
        }
      />
    ),
    onHeaderCell: () => onHeaderCellClick('status'),
    dataIndex: 'status',
    key: 'status',
    width: 150,
    render: (status: string) => getStatusBadge(status),
  },
  {
    title: <HeaderCell title="Email envoyé" />,
    dataIndex: 'email_sent',
    key: 'email_sent',
    width: 120,
    render: (_: unknown, row: QuestionnaireRequest) => {
      if (row.email_sent === true) {
        return (
          <Text className="text-sm font-medium text-green-600 dark:text-green-400">
            Oui
          </Text>
        );
      }
      if (row.email_sent === false) {
        return (
          <Text className="text-sm font-medium text-red-600 dark:text-red-400" title={row.email_error || undefined}>
            Non
          </Text>
        );
      }
      return <Text className="text-sm text-gray-400">—</Text>;
    },
  },
  {
    title: (
      <HeaderCell
        title="Date d'envoi"
        sortable
        ascending={
          sortConfig?.direction === 'asc' && sortConfig?.key === 'sent_at'
        }
      />
    ),
    onHeaderCell: () => onHeaderCellClick('sent_at'),
    dataIndex: 'sent_at',
    key: 'sent_at',
    width: 150,
    render: (date: string) => (
      <Text className="text-sm text-gray-700 dark:text-gray-300">
        {new Date(date).toLocaleDateString('fr-FR')}
      </Text>
    ),
  },
  {
    title: (
      <HeaderCell
        title="Expire le"
        sortable
        ascending={
          sortConfig?.direction === 'asc' && sortConfig?.key === 'expires_at'
        }
      />
    ),
    onHeaderCell: () => onHeaderCellClick('expires_at'),
    dataIndex: 'expires_at',
    key: 'expires_at',
    width: 150,
    render: (date: string) => (
      <Text className="text-sm text-gray-700 dark:text-gray-300">
        {new Date(date).toLocaleDateString('fr-FR')}
      </Text>
    ),
  },
  {
    title: <HeaderCell title="Actions" className="opacity-0" />,
    dataIndex: 'action',
    key: 'action',
    width: 100,
    render: (_: string, row: QuestionnaireRequest) => (
      <div className="flex items-center justify-end gap-3 pe-4">
        <ActionIcon
          size="sm"
          variant="outline"
          aria-label="Voir le questionnaire"
          onClick={() => onViewItem(row.id)}
        >
          <EyeIcon className="h-4 w-4" />
        </ActionIcon>
      </div>
    ),
  },
];



