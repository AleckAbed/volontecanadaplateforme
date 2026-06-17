'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTanStackTable } from '@core/components/table/custom/use-TanStack-Table';
import { servicesColumns } from './columns';
import Table from '@core/components/table';
import TableFooter from '@core/components/table/footer';
import TablePagination from '@core/components/table/pagination';
import Filters from './filters';
import { immigrationServicesService, ImmigrationServiceItem } from '@/services/immigration-services';
import { IMMIGRATION_SERVICES_REFRESH_EVENT } from '@/data/services-immigration';

// Type adapté à la colonne pour rester compatible avec services/columns.tsx
export type ServicesTableDataType = {
  id: number;
  serviceName: string;
  category: string;
  duration: string;
  status: string;
  clients: number;
  createdAt: string;
};

function adapt(s: ImmigrationServiceItem): ServicesTableDataType {
  return {
    id: s.id,
    serviceName: s.name,
    category: s.category ?? '',
    duration: s.duration ?? '',
    status: s.status,
    clients: 0,
    createdAt: s.created_at?.slice(0, 10) ?? '',
  };
}

export default function ServicesTable() {
  const [loading, setLoading] = useState(true);

  const { table, setData } = useTanStackTable<ServicesTableDataType>({
    tableData: [],
    columnConfig: servicesColumns,
    options: {
      initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
      meta: {
        handleDeleteRow: async (row) => {
          if (!confirm(`Supprimer "${row.serviceName}" ?`)) return;
          try {
            await immigrationServicesService.remove(row.id);
            setData((prev) => prev.filter((r) => r.id !== row.id));
            table.resetRowSelection();
            toast.success('Service supprimé');
          } catch (e: any) {
            toast.error(e.message || 'Suppression impossible');
          }
        },
        handleMultipleDelete: async (rows) => {
          if (!confirm(`Supprimer ${rows.length} service(s) ?`)) return;
          try {
            await Promise.all(rows.map((r: ServicesTableDataType) => immigrationServicesService.remove(r.id)));
            setData((prev) => prev.filter((r) => !rows.includes(r)));
            table.resetRowSelection();
            toast.success('Services supprimés');
          } catch (e: any) {
            toast.error(e.message || 'Suppression partielle');
          }
        },
      },
      enableColumnResizing: false,
    },
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const list = await immigrationServicesService.list();
      setData(list.map(adapt));
    } catch (e: any) {
      toast.error(e.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [setData]);

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener(IMMIGRATION_SERVICES_REFRESH_EVENT, handler);
    return () => window.removeEventListener(IMMIGRATION_SERVICES_REFRESH_EVENT, handler);
  }, [load]);

  return (
    <div className="mt-14">
      <Filters table={table} />
      {loading ? (
        <div className="rounded-md border border-muted p-10 text-center text-sm text-gray-500">
          Chargement…
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
