'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import {
  PiArrowLeftBold,
  PiPencilDuotone,
  PiTrashDuotone,
  PiUsersDuotone,
  PiFolderOpenDuotone,
  PiEnvelopeDuotone,
  PiPhoneDuotone,
  PiMapPinDuotone,
  PiCalendarDuotone,
  PiIdentificationCardDuotone,
} from 'react-icons/pi';
import { Avatar, Badge } from 'rizzui';
import { apiService } from '@/services/api';

interface FamilyMember {
  id: number;
  first_name: string;
  last_name: string;
  relationship: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  nationality?: string;
  country_of_residence?: string;
  address?: string;
  passport_number?: string;
}

interface Dossier {
  id: number;
  name: string;
  status: string;
  scope: string;
  opened_at?: string;
  deadline_at?: string;
}

interface ClientDetail {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  nationality?: string;
  country_of_residence?: string;
  passport_number?: string;
  address?: string;
  client_type: 'single' | 'family';
  is_active?: boolean;
  family_members?: FamilyMember[];
  dossiers?: Dossier[];
  created_at?: string;
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useTranslation();
  const { id } = use(params);
  const router = useRouter();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiService.getModuleClient(id);
        if (res.success && res.data) {
          setClient(res.data as any);
        } else {
          toast.error(res.message || t('clients.not_found'));
        }
      } catch (e: any) {
        toast.error(e.message || t('dossiers.load_error'));
      } finally {
        setLoading(false);
      }
    })();
  }, [id, t]);

  const handleDelete = async () => {
    if (!client) return;
    const fullName = `${client.first_name} ${client.last_name}`;
    if (!confirm(t('clients.delete_warning', { name: fullName }))) return;
    try {
      setDeleting(true);
      await apiService.deleteModuleClient(client.id);
      toast.success(t('clients.toasts.deleted'));
      router.push('/admin/clients');
    } catch (e: any) {
      toast.error(e.message || t('dossiers.delete_error'));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-400">{t('common.loading')}</div>;
  if (!client) return <div className="p-6 text-center text-red-500">{t('clients.not_found')}</div>;

  const fullName = `${client.first_name} ${client.last_name}`.trim();
  const avatarUrl = `https://isomorphic-furyroad.s3.amazonaws.com/public/avatars/avatar-${String(((client.id - 1) % 15) + 1).padStart(2, '0')}.png`;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => router.push('/admin/clients')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
        >
          <PiArrowLeftBold className="h-4 w-4" /> {t('clients.back_to_list')}
        </button>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/clients/${client.id}/edit`}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <PiPencilDuotone className="h-4 w-4" /> {t('common.edit')}
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            <PiTrashDuotone className="h-4 w-4" /> {t('common.delete')}
          </button>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-start gap-5 sm:flex-row">
          <Avatar name={fullName} src={avatarUrl} size="xl" />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
              <Badge
                variant="flat"
                color={client.client_type === 'family' ? 'primary' : 'secondary'}
                rounded="lg"
              >
                {client.client_type === 'family' ? `👨‍👩‍👧 ${t('clients.type.family')}` : `👤 ${t('clients.type.single')}`}
              </Badge>
              <Badge
                variant="flat"
                color={client.is_active === false ? 'secondary' : 'success'}
                rounded="lg"
              >
                {client.is_active === false ? t('clients.inactive') : t('clients.active')}
              </Badge>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-2 lg:grid-cols-3">
              <InfoRow icon={<PiEnvelopeDuotone />} label={t('clients.fields.email')} value={client.email} />
              {client.phone && <InfoRow icon={<PiPhoneDuotone />} label={t('clients.fields.phone')} value={client.phone} />}
              {client.date_of_birth && (
                <InfoRow icon={<PiCalendarDuotone />} label={t('clients.fields.birth_date')} value={formatDateIso(client.date_of_birth)} />
              )}
              {client.nationality && (
                <InfoRow icon={<PiMapPinDuotone />} label={t('clients.fields.nationality')} value={client.nationality} />
              )}
              {client.country_of_residence && (
                <InfoRow icon={<PiMapPinDuotone />} label={t('clients.country_residence')} value={client.country_of_residence} />
              )}
              {client.passport_number && (
                <InfoRow icon={<PiIdentificationCardDuotone />} label={t('clients.passport_number')} value={client.passport_number} />
              )}
              {client.address && (
                <InfoRow icon={<PiMapPinDuotone />} label={t('clients.fields.address')} value={client.address} />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PiUsersDuotone className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                {t('clients.family_members')} ({client.family_members?.length ?? 0})
              </h2>
            </div>
            <Link
              href={`/admin/clients/${client.id}/edit`}
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              + {t('clients.add_short')}
            </Link>
          </div>
          {!client.family_members?.length ? (
            <p className="py-6 text-center text-sm text-gray-400">{t('clients.no_members')}</p>
          ) : (
            <ul className="space-y-3">
              {client.family_members.map((m) => (
                <li key={m.id} className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <Avatar name={`${m.first_name} ${m.last_name}`} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900">
                      {m.first_name} {m.last_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {t(`clients.relationship.${m.relationship}`, { defaultValue: m.relationship })}
                      {m.date_of_birth && <> · {t('clients.born_on', { date: formatDateIso(m.date_of_birth) })}</>}
                    </div>
                    {(m.email || m.phone) && (
                      <div className="mt-1 text-xs text-gray-600">
                        {m.email && <span>📧 {m.email}</span>}
                        {m.email && m.phone && <span className="mx-1">·</span>}
                        {m.phone && <span>📞 {m.phone}</span>}
                      </div>
                    )}
                    {(m.nationality || m.country_of_residence) && (
                      <div className="mt-1 text-xs text-gray-500">
                        {m.nationality && <>🌍 {m.nationality}</>}
                        {m.nationality && m.country_of_residence && <span className="mx-1">·</span>}
                        {m.country_of_residence && <>🏠 {t('clients.residence')} : {m.country_of_residence}</>}
                      </div>
                    )}
                    {m.address && (
                      <div className="mt-1 text-xs italic text-gray-500">
                        📍 {m.address}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PiFolderOpenDuotone className="h-5 w-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                {t('clients.dossiers_count_label')} ({client.dossiers?.length ?? 0})
              </h2>
            </div>
            <Link
              href={`/admin/dossiers/create?client_id=${client.id}`}
              className="text-xs font-medium text-purple-600 hover:underline"
            >
              + {t('clients.new_dossier_short')}
            </Link>
          </div>
          {!client.dossiers?.length ? (
            <p className="py-6 text-center text-sm text-gray-400">{t('clients.no_dossiers_open')}</p>
          ) : (
            <ul className="space-y-3">
              {client.dossiers.map((d) => (
                <li key={d.id} className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                    <PiFolderOpenDuotone className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/dossiers/${d.id}`}
                      className="font-medium text-gray-900 hover:text-purple-700"
                    >
                      {d.name}
                    </Link>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                      <Badge variant="flat" rounded="lg" color="secondary">
                        {t(`dossiers.status.${d.status}`, { defaultValue: d.status })}
                      </Badge>
                      {d.opened_at && <span>{t('clients.opened_on', { date: d.opened_at })}</span>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon, label, value,
}: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs uppercase text-gray-500">
        <span className="text-gray-400">{icon}</span>
        {label}
      </div>
      <div className="mt-0.5 text-sm font-medium text-gray-900">{value}</div>
    </div>
  );
}

function formatDateIso(value: string): string {
  if (!value) return '—';
  const m = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
