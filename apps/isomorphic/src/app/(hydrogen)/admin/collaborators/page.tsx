'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import {
  PiUsersThreeDuotone,
  PiPlusBold,
  PiMagnifyingGlassBold,
  PiPencilSimpleDuotone,
  PiTrashDuotone,
  PiEnvelopeDuotone,
  PiPhoneDuotone,
  PiFolderUserDuotone,
  PiCheckCircleDuotone,
  PiXCircleDuotone,
  PiXBold,
  PiPaperPlaneTiltDuotone,
} from 'react-icons/pi';
import { collaboratorsService, Collaborator } from '@/services/collaborators';

export default function CollaboratorsPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Collaborator | null>(null);
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setItems(await collaboratorsService.list());
    } catch (e: any) {
      toast.error(e.message || t('common.error', { defaultValue: 'Erreur' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (c: Collaborator) => {
    if (!confirm(t('collaborators.delete_confirm', { name: `${c.first_name} ${c.last_name}` }))) return;
    try {
      await collaboratorsService.remove(c.id);
      toast.success(t('collaborators.deleted'));
      await load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleSendLink = async (c: Collaborator) => {
    if (!confirm(t('collaborators.send_link_confirm', { email: c.email }))) return;
    try {
      const res = await collaboratorsService.sendWelcomeLink(c.id);
      toast.success(res.message || t('collaborators.send_link_fallback_success'));
    } catch (e: any) {
      toast.error(e.message || t('collaborators.send_link_failed'));
    }
  };

  const stats = useMemo(() => {
    const total = items.length;
    const active = items.filter((c) => c.is_active).length;
    const totalDossiers = items.reduce((sum, c) => sum + (c.dossiers_count ?? 0), 0);
    return { total, active, totalDossiers, inactive: total - active };
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) => {
      const hay = `${c.first_name} ${c.last_name} ${c.email} ${c.phone ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, search]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-6 2xl:p-10">
      {/* === Header === */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
            <PiUsersThreeDuotone className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
              {t('collaborators.title')}
            </h1>
            <p className="mt-1 max-w-xl text-sm text-gray-500">
              {t('collaborators.subtitle')}
            </p>
          </div>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98]"
        >
          <PiPlusBold className="h-4 w-4" />
          {t('collaborators.new_btn')}
        </button>
      </div>

      {/* === Stats + recherche : visibles seulement si au moins un collab === */}
      {items.length > 0 && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              icon={<PiUsersThreeDuotone className="h-5 w-5" />}
              label={t('collaborators.stat_total')}
              value={stats.total}
              color="blue"
            />
            <StatCard
              icon={<PiCheckCircleDuotone className="h-5 w-5" />}
              label={t('collaborators.active')}
              value={stats.active}
              color="green"
            />
            <StatCard
              icon={<PiXCircleDuotone className="h-5 w-5" />}
              label={t('collaborators.inactive')}
              value={stats.inactive}
              color="gray"
            />
            <StatCard
              icon={<PiFolderUserDuotone className="h-5 w-5" />}
              label={t('collaborators.stat_dossiers')}
              value={stats.totalDossiers}
              color="purple"
            />
          </div>

          <div className="mb-5 flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm">
            <PiMagnifyingGlassBold className="ml-2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('collaborators.search_placeholder')}
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <PiXBold className="h-4 w-4" />
              </button>
            )}
          </div>
        </>
      )}

      {/* === Content === */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-xl bg-gradient-to-br from-gray-100 to-gray-50" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState onCreate={() => { setEditing(null); setShowForm(true); }} />
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
          {t('collaborators.no_search_result')}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <CollaboratorCard
              key={c.id}
              collaborator={c}
              onEdit={() => { setEditing(c); setShowForm(true); }}
              onDelete={() => handleDelete(c)}
              onSendLink={() => handleSendLink(c)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <CollaboratorFormModal
          collaborator={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={async () => { setShowForm(false); setEditing(null); await load(); }}
        />
      )}
    </div>
  );
}

// ─── Stat card ───────────────────────────────────────────────────────────────

const STAT_COLORS = {
  blue: { bg: 'from-blue-50 to-blue-100/50', icon: 'bg-blue-100 text-blue-600', value: 'text-blue-700' },
  green: { bg: 'from-emerald-50 to-emerald-100/50', icon: 'bg-emerald-100 text-emerald-600', value: 'text-emerald-700' },
  gray: { bg: 'from-gray-50 to-gray-100/50', icon: 'bg-gray-200 text-gray-600', value: 'text-gray-700' },
  purple: { bg: 'from-purple-50 to-purple-100/50', icon: 'bg-purple-100 text-purple-600', value: 'text-purple-700' },
} as const;

function StatCard({
  icon, label, value, color,
}: { icon: React.ReactNode; label: string; value: number; color: keyof typeof STAT_COLORS }) {
  const c = STAT_COLORS[color];
  return (
    <div className={`flex items-center gap-3 rounded-xl border border-white/60 bg-gradient-to-br ${c.bg} p-4 shadow-sm`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.icon}`}>
        {icon}
      </div>
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{label}</div>
        <div className={`text-xl font-bold ${c.value}`}>{value}</div>
      </div>
    </div>
  );
}

// ─── Collaborator card ──────────────────────────────────────────────────────

function CollaboratorCard({
  collaborator, onEdit, onDelete, onSendLink,
}: { collaborator: Collaborator; onEdit: () => void; onDelete: () => void; onSendLink: () => void }) {
  const { t } = useTranslation();
  const c = collaborator;
  const initials = `${c.first_name?.[0] ?? ''}${c.last_name?.[0] ?? ''}`.toUpperCase() || '?';
  // Couleur dérivée du nom pour un avatar coloré consistant
  const colorIdx = ((c.id ?? 0) * 13) % AVATAR_COLORS.length;
  const avatarBg = AVATAR_COLORS[colorIdx];

  return (
    <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5">
      {/* Statut pastille */}
      <div className="absolute right-4 top-4">
        {c.is_active ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {t('collaborators.active')}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-600">
            <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
            {t('collaborators.inactive')}
          </span>
        )}
      </div>

      {/* Identité */}
      <div className="mb-4 flex items-center gap-3">
        <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold text-white shadow-md ${avatarBg}`}>
          {initials}
        </div>
        <div className="flex-1 overflow-hidden pr-20">
          <h3 className="truncate text-base font-semibold text-gray-900">
            {c.first_name} {c.last_name}
          </h3>
          <p className="truncate text-xs text-gray-500">{t('collaborators.id_label', { id: c.id })}</p>
        </div>
      </div>

      {/* Infos */}
      <div className="mb-4 space-y-2">
        <InfoRow icon={<PiEnvelopeDuotone className="h-4 w-4" />} value={c.email} />
        <InfoRow icon={<PiPhoneDuotone className="h-4 w-4" />} value={c.phone || '—'} />
        <InfoRow
          icon={<PiFolderUserDuotone className="h-4 w-4" />}
          value={t(
            (c.dossiers_count ?? 0) > 1 ? 'collaborators.dossiers_assigned_other' : 'collaborators.dossiers_assigned_one',
            { count: c.dossiers_count ?? 0 }
          )}
        />
      </div>

      {/* Actions */}
      <div className="space-y-2 border-t border-gray-100 pt-3">
        <button
          onClick={onSendLink}
          disabled={!c.is_active}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-500/20 transition hover:shadow-lg hover:shadow-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50"
          title={c.is_active ? t('collaborators.send_link_tooltip_active') : t('collaborators.send_link_tooltip_inactive')}
        >
          <PiPaperPlaneTiltDuotone className="h-4 w-4" />
          {t('collaborators.send_link_btn')}
        </button>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
          >
            <PiPencilSimpleDuotone className="h-4 w-4" />
            {t('common.edit')}
          </button>
          <button
            onClick={onDelete}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
          >
            <PiTrashDuotone className="h-4 w-4" />
            {t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  );
}

const AVATAR_COLORS = [
  'bg-gradient-to-br from-blue-500 to-indigo-600',
  'bg-gradient-to-br from-emerald-500 to-teal-600',
  'bg-gradient-to-br from-purple-500 to-fuchsia-600',
  'bg-gradient-to-br from-orange-500 to-rose-600',
  'bg-gradient-to-br from-cyan-500 to-sky-600',
  'bg-gradient-to-br from-yellow-500 to-orange-600',
];

function InfoRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-700">
      <span className="text-gray-400">{icon}</span>
      <span className="truncate">{value}</span>
    </div>
  );
}

// ─── Empty state ────────────────────────────────────────────────────────────

function EmptyState({ onCreate }: { onCreate: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 shadow-inner">
        <PiUsersThreeDuotone className="h-10 w-10" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900">{t('collaborators.empty')}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
        {t('collaborators.empty_description')}
      </p>
      <button
        onClick={onCreate}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700"
      >
        <PiPlusBold className="h-4 w-4" />
        {t('collaborators.new_btn')}
      </button>
    </div>
  );
}

// ─── Form modal ─────────────────────────────────────────────────────────────

function CollaboratorFormModal({
  collaborator, onClose, onSaved,
}: { collaborator: Collaborator | null; onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState(collaborator?.first_name ?? '');
  const [lastName, setLastName] = useState(collaborator?.last_name ?? '');
  const [email, setEmail] = useState(collaborator?.email ?? '');
  const [phone, setPhone] = useState(collaborator?.phone ?? '');
  const [password, setPassword] = useState('');
  // Nouveau collab → inactif par défaut (le compte sera activé via le lien envoyé).
  // Édition → on garde l'état actuel.
  const [isActive, setIsActive] = useState(collaborator?.is_active ?? false);
  const [submitting, setSubmitting] = useState(false);

  const isEdit = !!collaborator;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload: any = { first_name: firstName, last_name: lastName, email, phone, is_active: isActive };
      if (password.trim()) payload.password = password;
      if (isEdit) {
        await collaboratorsService.update(collaborator!.id, payload);
        toast.success(t('collaborators.updated'));
      } else {
        if (!password.trim()) {
          toast.error(t('collaborators.password_required'));
          return;
        }
        await collaboratorsService.create(payload);
        toast.success(t('collaborators.created'));
      }
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header avec dégradé */}
        <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1 text-white/80 transition hover:bg-white/20 hover:text-white"
          >
            <PiXBold className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <PiUsersThreeDuotone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {isEdit ? t('collaborators.edit_title') : t('collaborators.new_title')}
              </h3>
              <p className="text-xs text-white/80">
                {isEdit
                  ? t('collaborators.modal_subtitle_edit')
                  : t('collaborators.modal_subtitle_new')}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {/* Section identité */}
          <Section title={t('collaborators.section_identity')}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={`${t('collaborators.first_name')} *`}>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </Field>
              <Field label={`${t('collaborators.last_name')} *`}>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </Field>
            </div>
          </Section>

          {/* Section contact */}
          <Section title={t('collaborators.section_contact')}>
            <div className="space-y-4">
              <Field label={`${t('collaborators.email')} *`}>
                <div className="relative">
                  <PiEnvelopeDuotone className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </Field>
              <Field label={t('collaborators.phone')}>
                <div className="relative">
                  <PiPhoneDuotone className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </Field>
            </div>
          </Section>

          {/* Section accès */}
          <Section title={t('collaborators.section_access')}>
            <div className="space-y-4">
              <Field label={isEdit ? t('collaborators.password_optional') : `${t('collaborators.password')} *`}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!isEdit}
                  minLength={6}
                  placeholder={isEdit ? t('collaborators.password_placeholder') : t('collaborators.password_min_placeholder')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </Field>

              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 transition hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{t('collaborators.is_active')}</div>
                  <div className="text-xs text-gray-500">
                    {t('collaborators.is_active_hint')}
                  </div>
                </div>
              </label>
            </div>
          </Section>

          {/* Footer actions */}
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  {t('common.saving')}
                </>
              ) : (
                isEdit ? t('common.save') : t('collaborators.create_btn')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">{title}</h4>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}
