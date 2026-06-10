'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { invitationsService, FormType, Category } from '@/services/invitations';

interface FormState {
  code: string;
  name: string;
  description: string;
  category_id: number | null;
  sort_order: number;
  is_active: boolean;
}

const emptyForm: FormState = {
  code: '',
  name: '',
  description: '',
  category_id: null,
  sort_order: 0,
  is_active: true,
};

export default function FormTypesPage() {
  const { t } = useTranslation();
  const [formTypes, setFormTypes] = useState<FormType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<FormType | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [types, cats] = await Promise.all([
        invitationsService.listFormTypes(),
        invitationsService.listCategories({ type: 'form' }),
      ]);
      setFormTypes(types);
      setCategories(cats);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error(t('configuration.name_required')); return; }
    try {
      const payload: any = { ...form };
      if (!payload.code.trim()) delete payload.code;
      if (editing) {
        await invitationsService.updateFormType(editing.id, payload);
        toast.success(t('configuration.ft_updated'));
      } else {
        await invitationsService.createFormType(payload);
        toast.success(t('configuration.ft_created'));
      }
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (ft: FormType) => {
    if (!confirm(t('configuration.ft_delete_confirm', { name: ft.name }))) return;
    try {
      await invitationsService.deleteFormType(ft.id);
      toast.success(t('configuration.ft_deleted'));
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleEdit = (ft: FormType) => {
    setEditing(ft);
    setForm({
      code: ft.code,
      name: ft.name,
      description: ft.description || '',
      category_id: ft.category_id || null,
      sort_order: ft.sort_order,
      is_active: ft.is_active,
    });
    setShowForm(true);
  };

  const handleNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('configuration.form_types_title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('configuration.form_types_subtitle')}</p>
        </div>
        <button
          onClick={handleNew}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {t('configuration.new_form_type')}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-lg font-semibold">
            {editing ? t('configuration.form_type_edit_title') : t('configuration.form_type_new_title')}
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('configuration.name_label')} *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('configuration.code_label')}</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder={t('configuration.code_placeholder')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('configuration.category_label')}</label>
              <select
                value={form.category_id ?? ''}
                onChange={(e) => setForm({ ...form, category_id: e.target.value ? Number(e.target.value) : null })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">{t('configuration.none_option')}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('configuration.sort_order_label')}</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('configuration.description_label')}</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <label className="flex items-center gap-2 md:col-span-2">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              <span className="text-sm text-gray-700">{t('common.active')}</span>
            </label>
          </div>
          <div className="mt-5 flex gap-3">
            <button
              onClick={() => { setShowForm(false); setEditing(null); }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSave}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {editing ? t('configuration.update_button') : t('common.create')}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-10 text-center text-gray-400">{t('common.loading')}</div>
      ) : formTypes.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center">
          <p className="text-gray-500">{t('configuration.no_form_types')}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('configuration.cols_name')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('configuration.cols_code')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('configuration.cols_category')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('configuration.cols_status')}</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('dossiers.columns.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {formTypes.map((ft) => (
                <tr key={ft.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{ft.name}</div>
                    {ft.description && <div className="text-xs text-gray-500">{ft.description}</div>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{ft.code}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{ft.category?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    {ft.is_active ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">{t('common.active')}</span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{t('common.inactive')}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleEdit(ft)} className="mr-2 text-sm text-blue-600 hover:underline">{t('common.edit')}</button>
                    <button onClick={() => handleDelete(ft)} className="text-sm text-red-600 hover:underline">{t('common.delete')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
