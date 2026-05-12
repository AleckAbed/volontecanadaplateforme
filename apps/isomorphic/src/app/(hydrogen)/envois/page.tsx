'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Title, Text, Badge, ActionIcon, Tooltip, Avatar } from 'rizzui';
import { PiTrashDuotone, PiEyeDuotone, PiPlusBold } from 'react-icons/pi';
import BasicTableWidget from '@core/components/controlled-table/basic-table-widget';
import cn from '@core/utils/class-names';
import { invitationsService, Invitation } from '@/services/invitations';

const STATUS_INFO: Record<string, { label: string; color: 'warning' | 'info' | 'success' | 'secondary' }> = {
  pending: { label: 'En attente', color: 'warning' },
  in_progress: { label: 'En cours', color: 'info' },
  completed: { label: 'Complété', color: 'success' },
  expired: { label: 'Expiré', color: 'secondary' },
};

export default function EnvoisListPage() {
  const [items, setItems] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const load = async () => {
    try {
      setLoading(true);
      const res = await invitationsService.listInvitations(page);
      setItems(res.data);
      setTotalPages(res.last_page);
      setTotal(res.total);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page]);

  const handleDelete = async (inv: Invitation) => {
    const recipient = inv.client?.name || inv.custom_name || inv.email;
    if (!confirm(`Supprimer l'envoi à ${recipient} ?`)) return;
    try {
      await invitationsService.deleteInvitation(inv.id);
      toast.success('Envoi supprimé');
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const getColumns = () => [
    {
      title: <span className="block whitespace-nowrap">Destinataire</span>,
      dataIndex: 'recipient',
      key: 'recipient',
      width: 320,
      render: (_: any, inv: Invitation) => {
        const principal = inv.client?.name || inv.custom_name || '—';
        return (
          <div className="flex items-start gap-3">
            <Avatar name={principal} size="md" />
            <div className="min-w-0 flex-1">
              <Title as="h6" className="mb-0.5 truncate !text-sm font-medium text-gray-900">
                {principal}
              </Title>
              {inv.family_member && (
                <Text className="truncate text-[12px] font-medium text-blue-700">
                  → {inv.family_member.name}{' '}
                  <span className="text-gray-500">({inv.family_member.relationship})</span>
                </Text>
              )}
              <Text className="truncate text-[12px] text-gray-500">{inv.email}</Text>
              {inv.dossier && (
                <Text className="truncate text-[12px] font-medium text-purple-700">
                  📁 {inv.dossier.name}
                </Text>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: <span className="block whitespace-nowrap">Items</span>,
      dataIndex: 'items',
      key: 'items',
      width: 120,
      render: (_: any, inv: Invitation) => {
        const f = inv.items.filter((i) => i.kind === 'form').length;
        const d = inv.items.filter((i) => i.kind === 'document').length;
        return (
          <div className="flex gap-2">
            {f > 0 && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-800">
                {f} formulaire{f > 1 ? 's' : ''}
              </span>
            )}
            {d > 0 && (
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-medium text-purple-800">
                {d} document{d > 1 ? 's' : ''}
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: <span className="block whitespace-nowrap">Avancement</span>,
      dataIndex: 'progress',
      key: 'progress',
      width: 180,
      render: (_: any, inv: Invitation) => {
        const completed = inv.items.filter((i) => i.status === 'completed').length;
        const tot = inv.items.length;
        const pct = tot > 0 ? Math.round((completed / tot) * 100) : 0;
        return (
          <div className="flex items-center gap-2">
            <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
              <div className="h-full bg-blue-600 transition-all" style={{ width: `${pct}%` }} />
            </div>
            <Text className="text-[12px] font-medium text-gray-700">
              {completed}/{tot}
            </Text>
          </div>
        );
      },
    },
    {
      title: <span className="block whitespace-nowrap">Statut</span>,
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string, inv: Invitation) => {
        const info = STATUS_INFO[status] || STATUS_INFO.pending;
        return (
          <div className="flex flex-col gap-1">
            <Badge color={info.color} variant="flat" rounded="lg">
              {info.label}
            </Badge>
            {!inv.email_sent && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
                ✉ Email KO
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: <span className="block whitespace-nowrap">Envoyé le</span>,
      dataIndex: 'sent_at',
      key: 'sent_at',
      width: 160,
      render: (value?: string) => (
        <Text className="text-[13px] text-gray-700">{formatDateFr(value)}</Text>
      ),
    },
    {
      title: <span className="block whitespace-nowrap">Expire le</span>,
      dataIndex: 'expires_at',
      key: 'expires_at',
      width: 160,
      render: (value?: string) => (
        <Text className="text-[13px] text-gray-700">{formatDateFr(value)}</Text>
      ),
    },
    {
      title: <span className="block whitespace-nowrap text-right">Actions</span>,
      dataIndex: 'actions',
      key: 'actions',
      width: 130,
      render: (_: any, inv: Invitation) => (
        <div className="flex items-center justify-end gap-1.5">
          <Tooltip size="sm" content="Voir les détails" placement="top" color="invert">
            <Link href={`/envois/${inv.id}`}>
              <ActionIcon as="span" size="sm" variant="outline" aria-label="Voir">
                <PiEyeDuotone className="h-4 w-4" />
              </ActionIcon>
            </Link>
          </Tooltip>
          <Tooltip size="sm" content="Supprimer" placement="top" color="invert">
            <ActionIcon
              size="sm"
              variant="outline"
              aria-label="Supprimer"
              onClick={() => handleDelete(inv)}
            >
              <PiTrashDuotone className="h-4 w-4" />
            </ActionIcon>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Envois</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gérez les invitations envoyées aux clients (formulaires + documents).
          </p>
        </div>
        <Link
          href="/envois/nouveau"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <PiPlusBold className="h-4 w-4" />
          Nouvel envoi
        </Link>
      </div>

      {loading ? (
        <div className="py-10 text-center text-gray-400">Chargement…</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <p className="text-lg font-medium text-gray-500">Aucun envoi</p>
          <p className="mt-1 text-sm text-gray-400">Créez votre premier envoi.</p>
          <Link
            href="/envois/nouveau"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Nouvel envoi
          </Link>
        </div>
      ) : (
        <>
          <BasicTableWidget
            title={`Liste des envois (${total})`}
            data={items}
            getColumns={getColumns}
            noGutter
            searchPlaceholder="Rechercher par destinataire, email, dossier..."
            scroll={{ x: 1100 }}
            className={cn('pb-0 lg:pb-0 [&_.rc-table-row:last-child_td]:border-b-0')}
          />

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">{total} envoi{total > 1 ? 's' : ''} au total</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
                >
                  Précédent
                </button>
                <span className="text-sm">Page {page} / {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Format "2026-05-10 17:30" → "2026-05-10 à 17H30". */
function formatDateFr(value?: string | null): string {
  if (!value) return '—';
  const m = String(value).match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})/);
  if (m) return `${m[1]} à ${m[2]}H${m[3]}`;
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} à ${pad(d.getHours())}H${pad(d.getMinutes())}`;
}
