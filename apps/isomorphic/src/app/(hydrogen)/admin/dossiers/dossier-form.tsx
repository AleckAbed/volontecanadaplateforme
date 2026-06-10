'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { PiArrowLeftBold, PiFloppyDiskDuotone } from 'react-icons/pi';
import { apiService } from '@/services/api';
import { servicesList } from '@/data/services-immigration';

type Scope = 'client' | 'member' | 'family';

interface DossierFormState {
  client_id: number | null;
  scope: Scope;
  family_member_id: number | null;
  name: string;
  service_name: string;
  status: string;
  opened_at: string;
  deadline_at: string;
  notes: string;
}

interface ClientItem {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  client_type: 'single' | 'family';
  family_members?: { id: number; first_name: string; last_name: string; relationship: string }[];
}

const STATUS_KEYS = ['en_cours', 'soumis', 'accorde', 'refuse', 'annule'] as const;
const SCOPE_KEYS = ['client', 'member', 'family'] as const;

interface DossierFormProps {
  mode: 'create' | 'edit';
  dossierId?: number;
}

export default function DossierForm({ mode, dossierId }: DossierFormProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [familyMembers, setFamilyMembers] = useState<ClientItem['family_members']>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<DossierFormState>({
    client_id: null,
    scope: 'client',
    family_member_id: null,
    name: '',
    service_name: '',
    status: 'en_cours',
    opened_at: new Date().toISOString().slice(0, 10),
    deadline_at: '',
    notes: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const clientsRes = await apiService.getModuleClients({ per_page: 200 });
        const list = Array.isArray(clientsRes?.data) ? clientsRes.data : (clientsRes?.data?.data ?? []);
        setClients(list as any);

        if (mode === 'edit' && dossierId) {
          const dRes = await apiService.getDossier(dossierId);
          if (dRes?.success && dRes.data) {
            const d = dRes.data;
            setForm({
              client_id: d.client_id,
              scope: d.scope,
              family_member_id: d.family_member_id,
              name: d.name || '',
              service_name: d.service_name || '',
              status: d.status || 'en_cours',
              opened_at: d.opened_at ? String(d.opened_at).slice(0, 10) : '',
              deadline_at: d.deadline_at ? String(d.deadline_at).slice(0, 10) : '',
              notes: d.notes || '',
            });
          }
        }
      } catch (e: any) {
        toast.error(e?.message ?? t('dossiers.load_error'));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, dossierId]);

  useEffect(() => {
    if (!form.client_id) {
      setFamilyMembers([]);
      return;
    }
    (async () => {
      try {
        const res = await apiService.getModuleClient(form.client_id!);
        const fm = (res?.data as any)?.family_members ?? [];
        setFamilyMembers(fm);
      } catch {
        setFamilyMembers([]);
      }
    })();
  }, [form.client_id]);

  const eligibleClients = useMemo(() => {
    if (form.scope === 'family' || form.scope === 'member') {
      return clients.filter((c) => c.client_type === 'family');
    }
    return clients;
  }, [clients, form.scope]);

  useEffect(() => {
    if (!form.client_id) return;
    const stillEligible = eligibleClients.some((c) => c.id === form.client_id);
    if (!stillEligible) {
      setForm((prev) => ({ ...prev, client_id: null, family_member_id: null }));
    }
    if (form.scope !== 'member' && form.family_member_id) {
      setForm((prev) => ({ ...prev, family_member_id: null }));
    }
  }, [form.scope, eligibleClients, form.client_id, form.family_member_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_id) { toast.error(t('dossiers.select_client_required')); return; }
    if (!form.name.trim()) { toast.error(t('dossiers.name_required')); return; }
    if (form.scope === 'member' && !form.family_member_id) {
      toast.error(t('dossiers.select_member_required'));
      return;
    }

    try {
      setSaving(true);
      const payload = {
        client_id: form.client_id,
        scope: form.scope,
        family_member_id: form.scope === 'member' ? form.family_member_id! : undefined,
        name: form.name.trim(),
        service_name: form.service_name.trim() || undefined,
        status: form.status,
        opened_at: form.opened_at || undefined,
        deadline_at: form.deadline_at || undefined,
        notes: form.notes.trim() || undefined,
      };

      if (mode === 'create') {
        const res = await apiService.createDossier(payload as any);
        if (res?.success) {
          toast.success(t('dossiers.created'));
          router.push('/admin/dossiers');
        } else {
          toast.error(res?.message || t('dossiers.create_error'));
        }
      } else if (dossierId) {
        const res = await apiService.updateDossier(dossierId, payload);
        if (res?.success) {
          toast.success(t('dossiers.updated'));
          router.push(`/admin/dossiers/${dossierId}`);
        } else {
          toast.error(res?.message || t('dossiers.update_error'));
        }
      }
    } catch (e: any) {
      toast.error(e?.message ?? t('clients.toasts.error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-400">{t('common.loading')}</div>;

  return (
    <div className="p-6 2xl:p-8">
      <div className="mb-6 flex items-center justify-between">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
          <PiArrowLeftBold className="h-4 w-4" /> {t('clients.back')}
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {mode === 'create' ? t('dossiers.create_title') : t('dossiers.edit_title')}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-semibold">{t('dossiers.step_type')}</h2>
            <div className="grid gap-3 md:grid-cols-3">
              {SCOPE_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm({ ...form, scope: key as Scope })}
                  className={`rounded-lg border-2 p-3 text-left transition ${
                    form.scope === key
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="text-sm font-semibold text-gray-900">{t(`dossiers.scope_label.${key}`)}</div>
                  <div className="mt-1 text-xs text-gray-500">{t(`dossiers.scope_desc.${key}`)}</div>
                </button>
              ))}
            </div>
            {(form.scope === 'family' || form.scope === 'member') && (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                ⚠ {t('dossiers.family_required_hint')}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-semibold">
              {form.scope === 'family' || form.scope === 'member' ? t('dossiers.step_client_main') : t('dossiers.step_client')} *
            </h2>
            {eligibleClients.length === 0 ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {t('dossiers.no_compatible_client')}
                {(form.scope === 'family' || form.scope === 'member') && ' ' + t('dossiers.create_family_first')}
              </p>
            ) : (
              <select
                value={form.client_id ?? ''}
                onChange={(e) => setForm({ ...form, client_id: e.target.value ? Number(e.target.value) : null })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                required
              >
                <option value="">{t('dossiers.pick_client')}</option>
                {eligibleClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name} ({c.email}) {c.client_type === 'family' ? `· 👨‍👩‍👧 ${t('dossiers.family_label_suffix')}` : ''}
                  </option>
                ))}
              </select>
            )}

            {form.scope === 'member' && form.client_id && (
              <div className="mt-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">{t('dossiers.member_concerned')} *</label>
                {(familyMembers?.length ?? 0) === 0 ? (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                    {t('dossiers.no_family_members')}
                  </p>
                ) : (
                  <select
                    value={form.family_member_id ?? ''}
                    onChange={(e) => setForm({ ...form, family_member_id: e.target.value ? Number(e.target.value) : null })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    required
                  >
                    <option value="">{t('dossiers.pick_member')}</option>
                    {(familyMembers ?? []).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.first_name} {m.last_name} ({t(`clients.relationship.${m.relationship}`, { defaultValue: m.relationship })})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-semibold">{t('dossiers.step_details')}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">{t('dossiers.service_label')} *</label>
                <select
                  value={form.service_name}
                  onChange={(e) => {
                    const svc = e.target.value;
                    setForm({
                      ...form,
                      service_name: svc,
                      name: form.name || (svc ? `${svc}` : form.name),
                    });
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  required
                >
                  <option value="">{t('dossiers.pick_service')}</option>
                  {servicesList.filter((s) => s.status === 'active').map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {t('dossiers.service_managed_in')} <a href="/services-immigration" className="text-blue-600 hover:underline">{t('dossiers.service_link_text')}</a>
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">{t('dossiers.name_label')} *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t('dossiers.name_placeholder')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{t('dossiers.opened_label')}</label>
                <input
                  type="date"
                  value={form.opened_at}
                  onChange={(e) => setForm({ ...form, opened_at: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{t('dossiers.deadline_label')}</label>
                <input
                  type="date"
                  value={form.deadline_at}
                  onChange={(e) => setForm({ ...form, deadline_at: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">{t('dossiers.notes_label')}</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5 lg:col-span-1">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-semibold">{t('dossiers.status_title')}</h2>
            <div className="space-y-2">
              {STATUS_KEYS.map((key) => (
                <label
                  key={key}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition ${
                    form.status === key
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={key}
                    checked={form.status === key}
                    onChange={() => setForm({ ...form, status: key })}
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-medium text-gray-900">{t(`dossiers.status.${key}`)}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 lg:col-span-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <PiFloppyDiskDuotone className="h-4 w-4" />
            {saving ? t('common.saving') : mode === 'create' ? t('dossiers.submit_create') : t('common.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
