'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { invitationsService, Category } from '@/services/invitations';

const COLORS = ['blue', 'purple', 'green', 'red', 'amber', 'pink', 'gray', 'indigo'];

interface FormState {
  name: string;
  type: string;
  color: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

const emptyForm: FormState = {
  name: '',
  type: 'form',
  color: 'blue',
  description: '',
  sort_order: 0,
  is_active: true,
};

export default function CategoriesPage() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<string>('');

  const typeLabel = (type: string) => {
    if (type === 'form') return t('configuration.type_form');
    if (type === 'document') return t('configuration.type_document');
    return type;
  };

  const load = async () => {
    try {
      setLoading(true);
      const data = await invitationsService.listCategories();
      setCategories(data);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error(t('configuration.name_required')); return; }
    if (!form.type.trim()) { toast.error(t('configuration.type_required')); return; }
    try {
      if (editing) {
        await invitationsService.updateCategory(editing.id, form);
        toast.success(t('configuration.updated'));
      } else {
        await invitationsService.createCategory(form);
        toast.success(t('configuration.created'));
      }
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(t('configuration.delete_confirm', { name: cat.name }))) return;
    try {
      await invitationsService.deleteCategory(cat.id);
      toast.success(t('configuration.deleted'));
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleEdit = (cat: Category) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      type: cat.type,
      color: cat.color || 'blue',
      description: cat.description || '',
      sort_order: cat.sort_order ?? 0,
      is_active: cat.is_active,
    });
    setShowForm(true);
  };

  const handleNew = () => {
    setEditing(null);
    setForm({ ...emptyForm, type: filterType || 'form' });
    setShowForm(true);
  };

  const filtered = filterType
    ? categories.filter((c) => c.type === filterType)
    : categories;

  const existingTypes = Array.from(new Set(categories.map((c) => c.type)));

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('configuration.categories_title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('configuration.categories_subtitle')}</p>
        </div>
        <button
          onClick={handleNew}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {t('configuration.new_category')}
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setFilterType('')}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            !filterType ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          {t('configuration.all_count', { count: categories.length })}
        </button>
        {existingTypes.map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              filterType === type ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {typeLabel(type)} ({categories.filter((c) => c.type === type).length})
          </button>
        ))}
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-lg font-semibold">
            {editing ? t('configuration.category_edit_title') : t('configuration.category_new_title')}
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
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('configuration.type_label')} *</label>
              <input
                type="text"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                placeholder={t('configuration.type_placeholder')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">{t('configuration.type_hint')}</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('configuration.color_label')}</label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, color: c })}
                    className={`h-8 w-8 rounded-full border-2 bg-${c}-500 ${
                      form.color === c ? 'border-gray-900' : 'border-transparent'
                    }`}
                    title={c}
                  />
                ))}
              </div>
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
                className="rounded"
              />
              <span className="text-sm text-gray-700">{t('configuration.is_active_label')}</span>
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
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center">
          <p className="text-gray-500">{t('configuration.no_categories')}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('configuration.cols_name')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('configuration.cols_type')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('configuration.cols_color')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('configuration.cols_order')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('configuration.cols_status')}</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('dossiers.columns.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{c.name}</div>
                    {c.description && <div className="text-xs text-gray-500">{c.description}</div>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{typeLabel(c.type)}</td>
                  <td className="px-4 py-3">
                    {c.color && <span className={`inline-block h-5 w-5 rounded-full bg-${c.color}-500`} />}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{c.sort_order}</td>
                  <td className="px-4 py-3">
                    {c.is_active ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">{t('common.active')}</span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{t('common.inactive')}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleEdit(c)} className="mr-2 text-sm text-blue-600 hover:underline">
                      {t('common.edit')}
                    </button>
                    <button onClick={() => handleDelete(c)} className="text-sm text-red-600 hover:underline">
                      {t('common.delete')}
                    </button>
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
