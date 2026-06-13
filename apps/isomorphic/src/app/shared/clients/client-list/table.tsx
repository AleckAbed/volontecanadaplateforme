'use client';

import { useCallback, useEffect, useState } from 'react';
import Table from '@core/components/table';
import { useTanStackTable } from '@core/components/table/custom/use-TanStack-Table';
import TableFooter from '@core/components/table/footer';
import TablePagination from '@core/components/table/pagination';
import { Box, Button } from 'rizzui';
import { apiService } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { useClientListColumns } from './columns';
import { clientModuleDataFallback, type ClientListRow } from '@/data/client-module-data';
import { CLIENT_LIST_REFRESH_EVENT } from '@/app/shared/clients/create-client';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export type { ClientListRow };

/** Extrait le tableau de clients depuis la réponse Laravel (paginate ou liste directe). */
function extractClientRows(res: any): ClientListRow[] {
  const raw = res?.data;
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : (raw?.data ?? []);
  if (!Array.isArray(list)) return [];
  return list.map((r: any) => ({
    id: r.id,
    first_name: r.first_name ?? '',
    last_name: r.last_name ?? '',
    email: r.email ?? '',
    client_type: r.client_type ?? 'single',
    family_members_count: r.family_members_count ?? 0,
    dossiers_count: r.dossiers_count ?? 0,
    is_active: r.is_active,
  }));
}

export default function ClientListTable() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const clientListColumns = useClientListColumns();

  const { table, tableData, setData } = useTanStackTable<ClientListRow>({
    tableData: clientModuleDataFallback,
    columnConfig: clientListColumns,
    options: {
      initialState: {
        pagination: { pageIndex: 0, pageSize: 10 },
      },
      meta: {
        handleDeleteRow: async (row) => {
          try {
            await apiService.deleteModuleClient(row.id);
            setData((prev) => prev.filter((r) => r.id !== row.id));
            table.resetRowSelection();
            toast.success(t('clients.toasts.deleted'));
          } catch (e: any) {
            toast.error(e?.message || t('dossiers.delete_error'));
          }
        },
        handleMultipleDelete: async (rows) => {
          try {
            await Promise.all(rows.map((r: ClientListRow) => apiService.deleteModuleClient(r.id)));
            setData((prev) => prev.filter((r) => !rows.includes(r)));
            table.resetRowSelection();
            toast.success(t('clients.toasts.deleted'));
          } catch (e: any) {
            toast.error(e?.message || t('dossiers.delete_error'));
          }
        },
      },
      enableColumnResizing: false,
    },
  });

  const loadClients = useCallback(() => {
    setLoading(true);
    setError(null);
    apiService
      .getModuleClients({ per_page: 100 })
      .then((res) => {
        const rows = extractClientRows(res);
        setData(rows);
      })
      .catch((err) => {
        console.error('getModuleClients:', err);
        const message = err?.message ?? t('clients.toasts.error');
        toast.error(message);
        setError(message);
        setData([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [setData]);

  // Attendre que l'auth soit prête avant de charger (évite 401 sans token)
  useEffect(() => {
    if (isAuthenticated === true) {
      loadClients();
    } else if (isAuthenticated === false) {
      setLoading(false);
      setData([]);
    }
  }, [isAuthenticated, loadClients]);

  // Rafraîchir la liste quand un client est créé (modal « Ajouter un client »)
  useEffect(() => {
    const handler = () => loadClients();
    window.addEventListener(CLIENT_LIST_REFRESH_EVENT, handler);
    return () => window.removeEventListener(CLIENT_LIST_REFRESH_EVENT, handler);
  }, [loadClients]);

  if (loading && tableData.length === 0) {
    return (
      <Box className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-md border border-muted">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </Box>
    );
  }

  if (error && tableData.length === 0) {
    return (
      <Box className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-md border border-muted p-6">
        <p className="text-center text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={loadClients}>
          {t('common.retry')}
        </Button>
      </Box>
    );
  }

  if (tableData.length === 0) {
    return (
      <Box className="flex min-h-[200px] items-center justify-center rounded-md border border-muted">
        <p className="text-muted-foreground">{t('clients.no_clients')}</p>
      </Box>
    );
  }

  return (
    <Box>
      <Table
        table={table}
        variant="modern"
        classNames={{
          container: 'border border-muted rounded-md',
          rowClassName: 'last:border-0',
        }}
      />
      <TableFooter table={table} />
      <TablePagination table={table} className="py-4" />
    </Box>
  );
}
