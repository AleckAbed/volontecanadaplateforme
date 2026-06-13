'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { collaboratorsService, Collaborator } from '@/services/collaborators';

export default function CollaboratorsPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Collaborator | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setItems(await collaboratorsService.list());
    } catch (e: any) {
      toast.error(e.message || 'Erreur');
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

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('collaborators.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('collaborators.subtitle')}</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {t('collaborators.new_btn')}
        </button>
      </div>

      {loading ? (
        <div className="p-10 text-center text-gray-400">{t('common.loading')}</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
          {t('collaborators.empty')}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">{t('collaborators.col_name')}</th>
                <th className="px-4 py-3">{t('collaborators.col_email')}</th>
                <th className="px-4 py-3">{t('collaborators.col_phone')}</th>
                <th className="px-4 py-3 text-center">{t('collaborators.col_dossiers')}</th>
                <th className="px-4 py-3 text-center">{t('collaborators.col_status')}</th>
                <th className="px-4 py-3 text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {c.first_name} {c.last_name}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{c.email}</td>
                  <td className="px-4 py-3 text-gray-700">{c.phone || '—'}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{c.dossiers_count ?? 0}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      c.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {c.is_active ? t('collaborators.active') : t('collaborators.inactive')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => { setEditing(c); setShowForm(true); }}
                      className="mr-2 rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      {t('common.edit')}
                    </button>
                    <button
                      onClick={() => handleDelete(c)}
                      className="rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      {t('common.delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

function CollaboratorFormModal({
  collaborator, onClose, onSaved,
}: { collaborator: Collaborator | null; onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState(collaborator?.first_name ?? '');
  const [lastName, setLastName] = useState(collaborator?.last_name ?? '');
  const [email, setEmail] = useState(collaborator?.email ?? '');
  const [phone, setPhone] = useState(collaborator?.phone ?? '');
  const [password, setPassword] = useState('');
  const [isActive, setIsActive] = useState(collaborator?.is_active ?? true);
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEdit ? t('collaborators.edit_title') : t('collaborators.new_title')}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={`${t('collaborators.first_name')} *`}>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </Field>
            <Field label={`${t('collaborators.last_name')} *`}>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </Field>
          </div>
          <Field label={`${t('collaborators.email')} *`}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </Field>
          <Field label={t('collaborators.phone')}>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </Field>
          <Field label={isEdit ? t('collaborators.password_optional') : `${t('collaborators.password')} *`}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!isEdit}
              minLength={6}
              placeholder={isEdit ? t('collaborators.password_placeholder') : ''}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            {t('collaborators.is_active')}
          </label>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? t('common.saving') : (isEdit ? t('common.save') : t('collaborators.create_btn'))}
            </button>
          </div>
        </form>
      </div>
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
