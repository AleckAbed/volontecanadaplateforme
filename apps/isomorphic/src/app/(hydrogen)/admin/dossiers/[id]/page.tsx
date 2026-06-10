'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Badge } from 'rizzui';
import {
  PiArrowLeftBold,
  PiPencilDuotone,
  PiTrashDuotone,
  PiFolderOpenDuotone,
  PiCalendarDuotone,
  PiBriefcaseDuotone,
  PiUserDuotone,
  PiUsersThreeDuotone,
} from 'react-icons/pi';
import { apiService } from '@/services/api';

interface DossierDetail {
  id: number;
  name: string;
  service_name?: string;
  scope: 'client' | 'member' | 'family';
  status: string;
  opened_at?: string;
  deadline_at?: string;
  notes?: string;
  client_id: number;
  family_member_id?: number;
  client?: { id: number; first_name: string; last_name: string; email: string; client_type: string };
  family_member?: { id: number; first_name: string; last_name: string; relationship: string };
  created_at?: string;
}

const STATUS_COLOR: Record<string, 'warning' | 'info' | 'success' | 'danger' | 'secondary'> = {
  en_cours: 'info',
  soumis: 'warning',
  accorde: 'success',
  refuse: 'danger',
  annule: 'secondary',
};

export default function DossierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useTranslation();
  const { id } = use(params);
  const router = useRouter();
  const [dossier, setDossier] = useState<DossierDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService.getDossier(id)
      .then((res) => {
        if (res?.success && res.data) setDossier(res.data as any);
        else toast.error(res?.message || t('dossiers.not_found'));
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [id, t]);

  const handleDelete = async () => {
    if (!dossier) return;
    if (!confirm(t('dossiers.delete_confirm', { name: dossier.name }))) return;
    try {
      await apiService.deleteDossier(dossier.id);
      toast.success(t('dossiers.deleted'));
      router.push('/admin/dossiers');
    } catch (e: any) {
      toast.error(e.message || t('dossiers.delete_error'));
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-400">{t('common.loading')}</div>;
  if (!dossier) return <div className="p-6 text-center text-red-500">{t('dossiers.not_found')}</div>;

  const color = STATUS_COLOR[dossier.status] || 'info';
  const clientName = dossier.client ? `${dossier.client.first_name} ${dossier.client.last_name}` : '—';
  const memberName = dossier.family_member ? `${dossier.family_member.first_name} ${dossier.family_member.last_name}` : null;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <button onClick={() => router.push('/admin/dossiers')} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
          <PiArrowLeftBold className="h-4 w-4" /> {t('dossiers.back_to_list')}
        </button>
        <div className="flex items-center gap-2">
          <Link href={`/admin/dossiers/${dossier.id}/edit`} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            <PiPencilDuotone className="h-4 w-4" /> {t('common.edit')}
          </Link>
          <button onClick={handleDelete} className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
            <PiTrashDuotone className="h-4 w-4" /> {t('common.delete')}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <PiFolderOpenDuotone className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{dossier.name}</h1>
              <Badge variant="flat" color={color} rounded="lg">{t(`dossiers.status.${dossier.status}`, { defaultValue: dossier.status })}</Badge>
            </div>
            {dossier.service_name && (
              <p className="mt-1 text-sm font-medium text-blue-700">
                <PiBriefcaseDuotone className="mr-1 inline h-4 w-4" />
                {dossier.service_name}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {t(`dossiers.scope_label.${dossier.scope}`, { defaultValue: dossier.scope })}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <InfoCard
            icon={<PiUserDuotone className="h-5 w-5" />}
            label={dossier.scope === 'family' || dossier.scope === 'member' ? t('dossiers.step_client_main').replace(/^2\.\s*/, '') : t('dossiers.step_client').replace(/^2\.\s*/, '')}
            value={
              <Link href={`/admin/clients/${dossier.client_id}`} className="font-medium text-gray-900 hover:text-blue-700">
                {clientName}
              </Link>
            }
            sub={dossier.client?.email}
          />
          {memberName && (
            <InfoCard
              icon={<PiUsersThreeDuotone className="h-5 w-5" />}
              label={t('dossiers.member_concerned')}
              value={memberName}
              sub={dossier.family_member ? t(`clients.relationship.${dossier.family_member.relationship}`, { defaultValue: dossier.family_member.relationship }) : undefined}
            />
          )}
          <InfoCard
            icon={<PiCalendarDuotone className="h-5 w-5" />}
            label={t('dossiers.columns.opened_at')}
            value={dossier.opened_at ?? '—'}
            sub={dossier.deadline_at ? t('dossiers.deadline_short', { date: dossier.deadline_at }) : undefined}
          />
        </div>

        {dossier.notes && (
          <div className="mt-6 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
            <div className="text-xs font-semibold uppercase text-blue-700">{t('dossiers.notes_label')}</div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{dossier.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({
  icon, label, value, sub,
}: { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-1.5 text-xs uppercase text-gray-500">
        <span className="text-gray-400">{icon}</span>
        {label}
      </div>
      <div className="mt-1 font-medium text-gray-900">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-gray-500">{sub}</div>}
    </div>
  );
}
