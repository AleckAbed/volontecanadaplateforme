'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Title, Text, Badge, ActionIcon, Tooltip, Avatar } from 'rizzui';
import { PiTrashDuotone, PiEyeDuotone, PiPlusBold } from 'react-icons/pi';
import BasicTableWidget from '@core/components/controlled-table/basic-table-widget';
import cn from '@core/utils/class-names';
import { invitationsService, Invitation } from '@/services/invitations';

const STATUS_COLOR: Record<string, 'warning' | 'info' | 'success' | 'secondary'> = {
  pending: 'warning',
  in_progress: 'info',
  completed: 'success',
  expired: 'secondary',
};

export default function EnvoisListPage() {
  const { t, i18n } = useTranslation();
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
    if (!confirm(t('envois.delete_confirm', { recipient }))) return;
    try {
      await invitationsService.deleteInvitation(inv.id);
      toast.success(t('envois.deleted'));
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const formatDateLoc = (value?: string | null): string => {
    if (!value) return '—';
    const m = String(value).match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})/);
    const sep = t('envois.date_separator');
    if (m) return `${m[1]} ${sep} ${m[2]}H${m[3]}`;
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${sep} ${pad(d.getHours())}H${pad(d.getMinutes())}`;
  };

  const getColumns = () => [
    {
      title: <span className="block whitespace-nowrap">{t('envois.columns.recipient')}</span>,
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
                  <span className="text-gray-500">({t(`clients.relationship.${inv.family_member.relationship}`, { defaultValue: inv.family_member.relationship })})</span>
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
      title: <span className="block whitespace-nowrap">{t('envois.columns.items')}</span>,
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
                {t(f > 1 ? 'envois.forms_count_other' : 'envois.forms_count_one', { count: f })}
              </span>
            )}
            {d > 0 && (
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-medium text-purple-800">
                {t(d > 1 ? 'envois.documents_count_other' : 'envois.documents_count_one', { count: d })}
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: <span className="block whitespace-nowrap">{t('envois.columns.progress')}</span>,
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
      title: <span className="block whitespace-nowrap">{t('envois.columns.status')}</span>,
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string, inv: Invitation) => {
        const color = STATUS_COLOR[status] || 'warning';
        return (
          <div className="flex flex-col gap-1">
            <Badge color={color} variant="flat" rounded="lg">
              {t(`envois.status.${status}`, { defaultValue: status })}
            </Badge>
            {!inv.email_sent && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
                {t('envois.email_ko')}
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: <span className="block whitespace-nowrap">{t('envois.columns.sent_at')}</span>,
      dataIndex: 'sent_at',
      key: 'sent_at',
      width: 160,
      render: (value?: string) => (
        <Text className="text-[13px] text-gray-700">{formatDateLoc(value)}</Text>
      ),
    },
    {
      title: <span className="block whitespace-nowrap">{t('envois.columns.expires_at')}</span>,
      dataIndex: 'expires_at',
      key: 'expires_at',
      width: 160,
      render: (value?: string) => (
        <Text className="text-[13px] text-gray-700">{formatDateLoc(value)}</Text>
      ),
    },
    {
      title: <span className="block whitespace-nowrap text-right">{t('envois.columns.actions')}</span>,
      dataIndex: 'actions',
      key: 'actions',
      width: 130,
      render: (_: any, inv: Invitation) => (
        <div className="flex items-center justify-end gap-1.5">
          <Tooltip size="sm" content={t('envois.view_details')} placement="top" color="invert">
            <Link href={`/envois/${inv.id}`}>
              <ActionIcon as="span" size="sm" variant="outline" aria-label={t('common.view')}>
                <PiEyeDuotone className="h-4 w-4" />
              </ActionIcon>
            </Link>
          </Tooltip>
          <Tooltip size="sm" content={t('common.delete')} placement="top" color="invert">
            <ActionIcon
              size="sm"
              variant="outline"
              aria-label={t('common.delete')}
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
          <h1 className="text-2xl font-bold text-gray-900">{t('envois.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('envois.subtitle')}</p>
        </div>
        <Link
          href="/envois/nouveau"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <PiPlusBold className="h-4 w-4" />
          {t('envois.add')}
        </Link>
      </div>

      {loading ? (
        <div className="py-10 text-center text-gray-400">{t('common.loading')}</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <p className="text-lg font-medium text-gray-500">{t('envois.no_envois')}</p>
          <p className="mt-1 text-sm text-gray-400">{t('envois.create_first')}</p>
          <Link
            href="/envois/nouveau"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {t('envois.add')}
          </Link>
        </div>
      ) : (
        <>
          <BasicTableWidget
            title={t('envois.list_count', { count: total })}
            data={items}
            getColumns={getColumns}
            noGutter
            searchPlaceholder={t('envois.search_placeholder')}
            scroll={{ x: 1100 }}
            className={cn('pb-0 lg:pb-0 [&_.rc-table-row:last-child_td]:border-b-0')}
          />

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">{t('envois.total_count', { count: total })}</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
                >
                  {t('envois.prev')}
                </button>
                <span className="text-sm">{t('envois.page_of', { page, total: totalPages })}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
                >
                  {t('envois.next')}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
