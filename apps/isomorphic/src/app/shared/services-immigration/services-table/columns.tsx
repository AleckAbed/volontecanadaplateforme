'use client';

import DateCell from '@core/ui/date-cell';
import { createColumnHelper } from '@tanstack/react-table';
import { Badge, Checkbox } from 'rizzui';
import { ServicesTableDataType } from '.';
import { getStatusBadge } from '@core/components/table-utils/get-status-badge';
import TableRowActionGroup from '@core/components/table-utils/table-row-action-group';
import cn from '@core/utils/class-names';

const columnHelper = createColumnHelper<ServicesTableDataType>();

export const servicesColumns = [
  columnHelper.display({
    id: 'select',
    size: 50,
    header: ({ table }) => (
      <Checkbox
        className="ps-3.5"
        aria-label="Select all Rows"
        checked={table.getIsAllPageRowsSelected()}
        onChange={() => table.toggleAllPageRowsSelected()}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        className="ps-3.5"
        aria-label="Select Row"
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
      />
    ),
  }),
  columnHelper.display({
    id: 'id',
    size: 100,
    header: 'ID',
    cell: ({ row }) => <>#{row.original.id}</>,
  }),
  columnHelper.accessor('serviceName', {
    id: 'serviceName',
    size: 250,
    header: 'Nom du Service',
    enableSorting: false,
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-gray-900">{row.original.serviceName}</p>
      </div>
    ),
  }),
  columnHelper.accessor('category', {
    id: 'category',
    size: 150,
    header: 'Catégorie',
    cell: ({ row }) => (
      <Badge
        rounded="lg"
        variant="outline"
        className="border-muted font-normal text-gray-500"
      >
        {row.original.category}
      </Badge>
    ),
  }),
  columnHelper.accessor('price', {
    id: 'price',
    size: 120,
    header: 'Prix',
    cell: ({ row }) => (
      <span className="font-semibold text-gray-900">{row.original.price}</span>
    ),
  }),
  columnHelper.accessor('duration', {
    id: 'duration',
    size: 150,
    header: 'Durée',
    cell: ({ row }) => (
      <span className="text-gray-600">{row.original.duration}</span>
    ),
  }),
  columnHelper.accessor('clients', {
    id: 'clients',
    size: 120,
    header: 'Clients',
    cell: ({ row }) => (
      <span className="font-medium text-gray-900">{row.original.clients}</span>
    ),
  }),
  columnHelper.accessor('status', {
    id: 'status',
    size: 150,
    header: 'Statut',
    enableSorting: false,
    cell: ({ row }) => {
      const statusColors = {
        active: 'bg-green-100 text-green-800',
        inactive: 'bg-gray-100 text-gray-800',
        pending: 'bg-yellow-100 text-yellow-800',
      };
      const statusLabels = {
        active: 'Actif',
        inactive: 'Inactif',
        pending: 'En attente',
      };
      return (
        <Badge
          className={cn(
            'text-xs',
            statusColors[row.original.status as keyof typeof statusColors] ||
              statusColors.inactive
          )}
        >
          {statusLabels[row.original.status as keyof typeof statusLabels] ||
            row.original.status}
        </Badge>
      );
    },
  }),
  columnHelper.accessor('createdAt', {
    id: 'createdAt',
    size: 200,
    header: 'Créé le',
    cell: ({ row }) => <DateCell date={new Date(row.original.createdAt)} />,
  }),
  columnHelper.display({
    id: 'action',
    size: 140,
    cell: ({
      row,
      table: {
        options: { meta },
      },
    }) => (
      <TableRowActionGroup
        deletePopoverTitle={`Supprimer ce service`}
        deletePopoverDescription={`Êtes-vous sûr de vouloir supprimer le service #${row.original.id} ?`}
        onDelete={() => meta?.handleDeleteRow?.(row.original)}
      />
    ),
  }),
];




