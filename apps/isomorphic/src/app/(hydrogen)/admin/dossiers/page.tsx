'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Badge, ActionIcon, Tooltip } from 'rizzui';
import { PiPlusBold, PiEyeDuotone, PiPencilDuotone, PiTrashDuotone, PiFolderOpenDuotone } from 'react-icons/pi';
import { apiService } from '@/services/api';

interface Dossier {
  id: number;
  name: string;
  service_name?: string;
  scope: 'client' | 'member' | 'family';
  status: string;
  opened_at?: string;
  deadline_at?: string;
  client?: { id: number; first_name: string; last_name: string };
  family_member?: { id: number; first_name: string; last_name: string };
}

const STATUS_COLOR: Record<string, 'warning' | 'info' | 'success' | 'danger' | 'secondary'> = {
  en_cours: 'info',
  soumis: 'warning',
  accorde: 'success',
  refuse: 'danger',
  rejete: 'danger',
  annule: 'secondary',
};

export default function DossiersListPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const statusKeys = useMemo(() => Object.keys(STATUS_COLOR), []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiService.getDossiers({
        per_page: 100,
        ...(statusFilter ? { status: statusFilter } : {}),
      });
      const list = Array.isArray(res?.data) ? res.data : (res?.data?.data ?? []);
      setItems(list as any);
    } catch (e: any) {
      toast.error(e?.message ?? t('dossiers.load_error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [statusFilter]);

  const handleDelete = async (d: Dossier) => {
    if (!confirm(t('dossiers.delete_confirm', { name: d.name }))) return;
    try {
      await apiService.deleteDossier(d.id);
      toast.success(t('dossiers.deleted'));
      load();
    } catch (e: any) {
      toast.error(e?.message ?? t('dossiers.delete_error'));
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('dossiers.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('dossiers.subtitle')}</p>
        </div>
        <Link
          href="/admin/dossiers/create"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <PiPlusBold className="h-4 w-4" /> {t('dossiers.add')}
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <FilterPill active={!statusFilter} onClick={() => setStatusFilter('')}>
          {t('dossiers.all_count', { count: items.length })}
        </FilterPill>
        {statusKeys.map((key) => (
          <FilterPill key={key} active={statusFilter === key} onClick={() => setStatusFilter(key)}>
            {t(`dossiers.status.${key}`)}
          </FilterPill>
        ))}
      </div>

      {loading ? (
        <div className="py-10 text-center text-gray-400">{t('common.loading')}</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <PiFolderOpenDuotone className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-lg font-medium text-gray-500">{t('dossiers.no_dossiers')}</p>
          <Link
            href="/admin/dossiers/create"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {t('dossiers.create_first')}
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('dossiers.columns.dossier')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('dossiers.columns.client')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('dossiers.columns.service')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('dossiers.columns.scope')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('dossiers.columns.status')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('dossiers.columns.opened_at')}</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('dossiers.columns.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((d) => {
                const color = STATUS_COLOR[d.status] || 'info';
                const clientName = d.client ? `${d.client.first_name} ${d.client.last_name}` : '—';
                const memberName = d.family_member ? `${d.family_member.first_name} ${d.family_member.last_name}` : null;
                return (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/dossiers/${d.id}`} className="font-medium text-gray-900 hover:text-blue-700">
                        {d.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="text-gray-900">{clientName}</div>
                      {memberName && (
                        <div className="text-xs text-blue-700">→ {memberName}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{d.service_name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{t(`dossiers.scope.${d.scope}`, { defaultValue: d.scope })}</td>
                    <td className="px-4 py-3">
                      <Badge variant="flat" color={color} rounded="lg">{t(`dossiers.status.${d.status}`, { defaultValue: d.status })}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{d.opened_at ?? '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Tooltip size="sm" content={t('common.view')} placement="top" color="invert">
                          <Link href={`/admin/dossiers/${d.id}`}>
                            <ActionIcon as="span" size="sm" variant="outline">
                              <PiEyeDuotone className="h-4 w-4" />
                            </ActionIcon>
                          </Link>
                        </Tooltip>
                        <Tooltip size="sm" content={t('common.edit')} placement="top" color="invert">
                          <Link href={`/admin/dossiers/${d.id}/edit`}>
                            <ActionIcon as="span" size="sm" variant="outline">
                              <PiPencilDuotone className="h-4 w-4" />
                            </ActionIcon>
                          </Link>
                        </Tooltip>
                        <Tooltip size="sm" content={t('common.delete')} placement="top" color="invert">
                          <ActionIcon size="sm" variant="outline" onClick={() => handleDelete(d)}>
                            <PiTrashDuotone className="h-4 w-4" />
                          </ActionIcon>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FilterPill({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );
}
