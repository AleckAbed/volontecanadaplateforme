'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  PiArrowLeftBold,
  PiTrashDuotone,
  PiPlusBold,
  PiFloppyDiskDuotone,
} from 'react-icons/pi';
import { useTranslation } from 'react-i18next';
import { apiService } from '@/services/api';
import CountrySelect from '@/app/shared/client-form/country-select';
import CanadaAddressInput from '@/components/CanadaAddressInput';

interface FamilyMemberInput {
  id?: number; // existing
  first_name: string;
  last_name: string;
  relationship: string;
  date_of_birth?: string;
  nationality?: string;
  country_of_residence?: string;
  address?: string;
  passport_number?: string;
  phone?: string;
  email?: string;
}

interface ClientForm {
  client_type: 'single' | 'family';
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  nationality: string;
  country_of_residence: string;
  passport_number: string;
  address: string;
  is_active: boolean;
}

const RELATIONSHIP_KEYS = ['conjoint', 'enfant', 'parent', 'frere_soeur', 'autre'] as const;

export default function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useTranslation();
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalMembers, setOriginalMembers] = useState<FamilyMemberInput[]>([]);
  const [form, setForm] = useState<ClientForm>({
    client_type: 'single',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    nationality: '',
    country_of_residence: '',
    passport_number: '',
    address: '',
    is_active: true,
  });
  const [members, setMembers] = useState<FamilyMemberInput[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiService.getModuleClient(id);
        if (res.success && res.data) {
          const c = res.data as any;
          setForm({
            client_type: c.client_type || 'single',
            first_name: c.first_name || '',
            last_name: c.last_name || '',
            email: c.email || '',
            phone: c.phone || '',
            date_of_birth: c.date_of_birth || '',
            nationality: c.nationality || '',
            country_of_residence: c.country_of_residence || '',
            passport_number: c.passport_number || '',
            address: c.address || '',
            is_active: c.is_active !== false,
          });
          const fm: FamilyMemberInput[] = (c.family_members || []).map((m: any) => ({
            id: m.id,
            first_name: m.first_name || '',
            last_name: m.last_name || '',
            relationship: m.relationship || 'autre',
            date_of_birth: m.date_of_birth || '',
            nationality: m.nationality || '',
            country_of_residence: m.country_of_residence || '',
            address: m.address || '',
            passport_number: m.passport_number || '',
            phone: m.phone || '',
            email: m.email || '',
          }));
          setMembers(fm);
          setOriginalMembers(fm);
        }
      } catch (e: any) {
        toast.error(e.message || t('dossiers.load_error'));
      } finally {
        setLoading(false);
      }
    })();
  }, [id, t]);

  const addMember = () => {
    setMembers((prev) => [
      ...prev,
      { first_name: '', last_name: '', relationship: 'conjoint', email: '', phone: '' },
    ]);
  };

  const updateMember = (idx: number, patch: Partial<FamilyMemberInput>) => {
    setMembers((prev) => prev.map((m, i) => (i === idx ? { ...m, ...patch } : m)));
  };

  const removeMember = (idx: number) => {
    setMembers((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim()) {
      toast.error(t('clients.required_basic'));
      return;
    }

    try {
      setSaving(true);

      // 1. Update main client info
      await apiService.updateModuleClient(id, {
        client_type: form.client_type,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        date_of_birth: form.date_of_birth || null,
        nationality: form.nationality.trim() || null,
        country_of_residence: form.country_of_residence.trim() || null,
        passport_number: form.passport_number.trim() || null,
        address: form.address.trim() || null,
        is_active: form.is_active,
      });

      // 2. Diff family members: detect deletions, updates, creations
      const originalIds = new Set(originalMembers.map((m) => m.id).filter(Boolean) as number[]);
      const currentIds = new Set(members.map((m) => m.id).filter(Boolean) as number[]);

      // Deletions
      for (const oldId of Array.from(originalIds)) {
        if (!currentIds.has(oldId)) {
          await apiService.deleteFamilyMember(id, oldId);
        }
      }
      // Updates + creations
      for (const m of members) {
        if (!m.first_name.trim() || !m.last_name.trim()) continue;
        const payload = {
          first_name: m.first_name.trim(),
          last_name: m.last_name.trim(),
          relationship: m.relationship,
          date_of_birth: m.date_of_birth || null,
          nationality: m.nationality || null,
          country_of_residence: m.country_of_residence || null,
          address: m.address || null,
          passport_number: m.passport_number || null,
          phone: m.phone || null,
          email: m.email || null,
        };
        if (m.id) {
          await apiService.updateFamilyMember(id, m.id, payload);
        } else {
          await apiService.addFamilyMember(id, payload);
        }
      }

      toast.success(t('clients.toasts.updated'));
      router.push(`/admin/clients/${id}`);
    } catch (e: any) {
      toast.error(e.message || t('clients.save_error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-400">{t('common.loading')}</div>;

  return (
    <div className="p-6 2xl:p-8">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
        >
          <PiArrowLeftBold className="h-4 w-4" /> {t('clients.back')}
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{t('clients.edit_title')}</h1>
      </div>

      <form onSubmit={handleSave} className="grid gap-5 lg:grid-cols-3">
        {/* Main info - 2/3 */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">{t('clients.info_title')}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={`${t('clients.fields.first_name')} *`}>
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="input"
                required
              />
            </Field>
            <Field label={`${t('clients.fields.last_name')} *`}>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="input"
                required
              />
            </Field>
            <Field label={`${t('clients.fields.email')} *`}>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input"
                required
              />
            </Field>
            <Field label={t('clients.fields.phone')}>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input"
              />
            </Field>
            <Field label={t('clients.fields.birth_date')}>
              <input
                type="date"
                value={form.date_of_birth}
                onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                className="input"
              />
            </Field>
            <Field label={t('clients.fields.nationality')}>
              <CountrySelect
                value={form.nationality}
                onChange={(v) => setForm({ ...form, nationality: v })}
                placeholder={t('clients.select_country')}
              />
            </Field>
            <Field label={t('clients.country_residence')}>
              <CountrySelect
                value={form.country_of_residence}
                onChange={(v) => setForm({ ...form, country_of_residence: v })}
                placeholder={t('clients.select_country')}
              />
            </Field>
            <Field label={t('clients.passport_number')}>
              <input
                type="text"
                value={form.passport_number}
                onChange={(e) => setForm({ ...form, passport_number: e.target.value })}
                className="input"
              />
            </Field>
            <Field label={t('clients.client_type_label')}>
              <select
                value={form.client_type}
                onChange={(e) => setForm({ ...form, client_type: e.target.value as 'single' | 'family' })}
                className="input"
              >
                <option value="single">{t('clients.type.single')}</option>
                <option value="family">{t('clients.type.family')}</option>
              </select>
            </Field>
            <Field label={t('clients.fields.address')} className="md:col-span-2">
              <CanadaAddressInput
                value={form.address}
                onChange={(v) => setForm({ ...form, address: v })}
                enabled={form.country_of_residence.toLowerCase() === 'canada'}
                placeholder={form.country_of_residence.toLowerCase() === 'canada'
                  ? t('clients.address_ca_placeholder')
                  : t('clients.address_full')}
                rows={2}
              />
              {form.country_of_residence && form.country_of_residence.toLowerCase() !== 'canada' && (
                <p className="mt-1 text-xs text-gray-500">{t('clients.address_ca_hint')}</p>
              )}
            </Field>
            <label className="flex items-center gap-2 md:col-span-2">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              <span className="text-sm text-gray-700">{t('clients.client_active')}</span>
            </label>
          </div>
        </div>

        {/* Family members - 1/3 */}
        <div className="space-y-5 lg:col-span-1">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t('clients.family_members')} ({members.length})</h2>
              <button
                type="button"
                onClick={addMember}
                className="inline-flex items-center gap-1 rounded-lg border border-blue-600 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
              >
                <PiPlusBold className="h-3 w-3" /> {t('clients.add_short')}
              </button>
            </div>
            {members.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-400">{t('clients.no_members_short')}</p>
            ) : (
              <div className="space-y-3">
                {members.map((m, idx) => (
                  <div key={m.id ?? `new-${idx}`} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase text-gray-500">
                        {t('clients.member_n', { n: idx + 1 })}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeMember(idx)}
                        className="text-red-500 hover:text-red-700"
                        aria-label={t('clients.remove_member')}
                      >
                        <PiTrashDuotone className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder={t('clients.fields.first_name')}
                          value={m.first_name}
                          onChange={(e) => updateMember(idx, { first_name: e.target.value })}
                          className="input-sm"
                        />
                        <input
                          type="text"
                          placeholder={t('clients.fields.last_name')}
                          value={m.last_name}
                          onChange={(e) => updateMember(idx, { last_name: e.target.value })}
                          className="input-sm"
                        />
                      </div>
                      <select
                        value={m.relationship}
                        onChange={(e) => updateMember(idx, { relationship: e.target.value })}
                        className="input-sm"
                      >
                        {RELATIONSHIP_KEYS.map((k) => (
                          <option key={k} value={k}>{t(`clients.relationship.${k}`)}</option>
                        ))}
                      </select>
                      <input
                        type="date"
                        placeholder={t('clients.fields.birth_date')}
                        value={m.date_of_birth || ''}
                        onChange={(e) => updateMember(idx, { date_of_birth: e.target.value })}
                        className="input-sm"
                      />
                      <input
                        type="email"
                        placeholder={t('clients.email_member_placeholder')}
                        value={m.email || ''}
                        onChange={(e) => updateMember(idx, { email: e.target.value })}
                        className="input-sm"
                      />
                      <input
                        type="text"
                        placeholder={t('clients.fields.phone')}
                        value={m.phone || ''}
                        onChange={(e) => updateMember(idx, { phone: e.target.value })}
                        className="input-sm"
                      />
                      <div>
                        <label className="mb-0.5 block text-[11px] uppercase text-gray-500">{t('clients.fields.nationality')}</label>
                        <CountrySelect
                          value={m.nationality || ''}
                          onChange={(v) => updateMember(idx, { nationality: v })}
                          placeholder={t('clients.fields.nationality')}
                        />
                      </div>
                      <div>
                        <label className="mb-0.5 block text-[11px] uppercase text-gray-500">{t('clients.country_residence')}</label>
                        <CountrySelect
                          value={m.country_of_residence || ''}
                          onChange={(v) => updateMember(idx, { country_of_residence: v })}
                          placeholder={t('clients.country_residence')}
                        />
                      </div>
                      <div>
                        <label className="mb-0.5 block text-[11px] uppercase text-gray-500">{t('clients.address_full')}</label>
                        <CanadaAddressInput
                          value={m.address || ''}
                          onChange={(v) => updateMember(idx, { address: v })}
                          enabled={(m.country_of_residence || '').toLowerCase() === 'canada'}
                          placeholder={(m.country_of_residence || '').toLowerCase() === 'canada'
                            ? t('clients.address_ca_placeholder')
                            : t('clients.address_full')}
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions full-width */}
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
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </form>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgb(209 213 219);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
        :global(.input:focus) {
          outline: none;
          border-color: rgb(37 99 235);
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
        }
        :global(.input-sm) {
          width: 100%;
          border-radius: 0.375rem;
          border: 1px solid rgb(209 213 219);
          padding: 0.375rem 0.5rem;
          font-size: 0.8125rem;
          background: white;
        }
      `}</style>
    </div>
  );
}

function Field({
  label, children, className = '',
}: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}
