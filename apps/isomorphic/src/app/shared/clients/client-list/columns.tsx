'use client';

import TableRowActionGroup from '@core/components/table-utils/table-row-action-group';
import { routes } from '@/config/routes';
import { createColumnHelper } from '@tanstack/react-table';
import Link from 'next/link';
import { Badge, Checkbox } from 'rizzui';
import type { ClientListRow } from './table';

const columnHelper = createColumnHelper<ClientListRow>();

export const clientListColumns = [
  columnHelper.display({
    id: 'select',
    size: 50,
    header: ({ table }) => (
      <Checkbox
        className="ps-3.5"
        aria-label="Sélectionner tout"
        checked={table.getIsAllPageRowsSelected()}
        onChange={() => table.toggleAllPageRowsSelected()}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        className="ps-3.5"
        aria-label="Sélectionner"
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
      />
    ),
  }),
  columnHelper.accessor('id', {
    id: 'id',
    size: 80,
    header: 'ID',
    cell: ({ getValue }) => getValue(),
  }),
  columnHelper.accessor(
    (row) => `${row.first_name} ${row.last_name}`.trim(),
    {
      id: 'name',
      size: 220,
      header: 'Nom',
      cell: ({ row }) => (
        <Link
          href={routes.clients.details(String(row.original.id))}
          className="duration-200 hover:text-gray-900 hover:underline"
        >
          {row.original.first_name} {row.original.last_name}
        </Link>
      ),
    }
  ),
  columnHelper.accessor('email', {
    id: 'email',
    size: 220,
    header: 'Email',
    cell: ({ getValue }) => getValue(),
  }),
  columnHelper.accessor('client_type', {
    id: 'client_type',
    size: 120,
    header: 'Type',
    cell: ({ row }) => (
      <Badge
        variant="flat"
        color={row.original.client_type === 'family' ? 'primary' : 'secondary'}
      >
        {row.original.client_type === 'family' ? 'Famille' : 'Unique'}
      </Badge>
    ),
  }),
  columnHelper.accessor((row) => row.family_members_count ?? 0, {
    id: 'family_members_count',
    size: 100,
    header: 'Membres',
    cell: ({ getValue }) => getValue(),
  }),
  columnHelper.accessor((row) => row.dossiers_count ?? 0, {
    id: 'dossiers_count',
    size: 100,
    header: 'Dossiers',
    cell: ({ getValue }) => getValue(),
  }),
  columnHelper.display({
    id: 'actions',
    size: 120,
    cell: ({
      row,
      table: {
        options: { meta },
      },
    }) => (
      <TableRowActionGroup
        deletePopoverTitle="Supprimer le client"
        onDelete={() => meta?.handleDeleteRow?.(row.original)}
        editUrl={`/admin/clients/${row.original.id}/edit`}
        viewUrl={routes.clients.details(String(row.original.id))}
        deletePopoverDescription={`Êtes-vous sûr de vouloir supprimer ${row.original.first_name} ${row.original.last_name} ?`}
      />
    ),
  }),
];
