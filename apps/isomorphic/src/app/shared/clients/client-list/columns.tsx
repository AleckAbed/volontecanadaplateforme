'use client';

import TableRowActionGroup from '@core/components/table-utils/table-row-action-group';
import { routes } from '@/config/routes';
import { createColumnHelper } from '@tanstack/react-table';
import Link from 'next/link';
import { Avatar, Badge, Checkbox } from 'rizzui';
import type { ClientListRow } from './table';

const columnHelper = createColumnHelper<ClientListRow>();

/**
 * Pick a default avatar (out of 15 available) deterministically from the
 * client id, so each client keeps the same picture between renders / reloads.
 */
function getDefaultAvatarUrl(id: number | string): string {
  const n = typeof id === 'number' ? id : parseInt(String(id), 10) || 0;
  const idx = ((n - 1) % 15 + 15) % 15 + 1; // 1..15
  const formatted = idx.toString().padStart(2, '0');
  return `https://isomorphic-furyroad.s3.amazonaws.com/public/avatars/avatar-${formatted}.png`;
}

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
      size: 260,
      header: 'Nom',
      cell: ({ row }) => {
        const fullName = `${row.original.first_name} ${row.original.last_name}`.trim() || 'Client';
        const avatarUrl = (row.original as any).avatar
          || getDefaultAvatarUrl(row.original.id);
        return (
          <Link
            href={routes.clients.details(String(row.original.id))}
            className="flex items-center gap-3 duration-200 hover:text-gray-900"
          >
            <Avatar name={fullName} src={avatarUrl} size="sm" />
            <span className="hover:underline">
              {row.original.first_name} {row.original.last_name}
            </span>
          </Link>
        );
      },
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
