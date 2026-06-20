'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { documentService } from '@/services/documents';
import { immigrationServicesService, ImmigrationServiceItem } from '@/services/immigration-services';
import { IMMIGRATION_SERVICES_REFRESH_EVENT } from '@/data/services-immigration';

export default function NouveauModelePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    description: '',
    service_name: '',
    target_location: 'any' as 'any' | 'in_canada' | 'outside_canada',
    doc_type: 'ircc' as 'ircc' | 'fo',
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [services, setServices] = useState<ImmigrationServiceItem[]>([]);

  useEffect(() => {
    const loadServices = () => {
      immigrationServicesService.list(true) // active_only=true
        .then(setServices)
        .catch(() => setServices([]));
    };
    loadServices();
    // Recharge automatique si on crée/modifie un service dans un autre onglet/page
    const handler = () => loadServices();
    if (typeof window !== 'undefined') {
      window.addEventListener(IMMIGRATION_SERVICES_REFRESH_EVENT, handler);
      return () => window.removeEventListener(IMMIGRATION_SERVICES_REFRESH_EVENT, handler);
    }
  }, []);

  const handleFile = (f: File) => {
    if (f.type !== 'application/pdf') {
      toast.error('Veuillez sélectionner un fichier PDF');
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      toast.error('Le fichier ne doit pas dépasser 20 Mo');
      return;
    }
    setFile(f);
    if (!form.name) {
      setForm((prev) => ({ ...prev, name: f.name.replace('.pdf', '') }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { toast.error('Veuillez sélectionner un fichier PDF'); return; }
    if (!form.name.trim()) { toast.error('Veuillez saisir un nom'); return; }

    try {
      setLoading(true);
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('description', form.description.trim());
      if (form.service_name) fd.append('service_name', form.service_name);
      fd.append('target_location', form.target_location);
      fd.append('doc_type', form.doc_type);
      fd.append('pdf', file);

      const result = await documentService.createTemplate(fd);
      toast.success('Modèle créé avec succès !');
      router.push(`/documents/editeur/${result.id}`);
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nouveau modèle de document</h1>
        <p className="mt-1 text-sm text-gray-500">
          Uploadez votre formulaire PDF. Les formulaires IRCC sont automatiquement convertis.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Zone drag & drop PDF */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition ${
            dragOver ? 'border-blue-500 bg-blue-50' : file ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50 hover:border-blue-400'
          }`}
        >
          {file ? (
            <>
              <div className="mb-2 text-4xl">📄</div>
              <p className="font-semibold text-green-700">{file.name}</p>
              <p className="text-sm text-green-600">{(file.size / 1024 / 1024).toFixed(2)} Mo</p>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="mt-2 text-xs text-red-500 underline"
              >
                Changer de fichier
              </button>
            </>
          ) : (
            <>
              <div className="mb-3 text-5xl text-gray-300">📁</div>
              <p className="font-medium text-gray-600">Glissez votre PDF ici</p>
              <p className="mt-1 text-sm text-gray-400">ou</p>
              <label className="mt-2 cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                Choisir un fichier
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
              </label>
              <p className="mt-2 text-xs text-gray-400">PDF — 20 Mo max (IRCC accepté)</p>
            </>
          )}
        </div>

        {/* Nom */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Nom du modèle *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="ex: IMM 5669 — Antécédents"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            required
          />
        </div>

        {/* Service d'immigration */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Service d&apos;immigration / Type</label>
          <select
            value={form.service_name}
            onChange={(e) => setForm((p) => ({ ...p, service_name: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">— Aucun (modèle général) —</option>
            <optgroup label="Services d'immigration">
              {services.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}{s.category ? ` (${s.category})` : ''}
                </option>
              ))}
            </optgroup>
            <optgroup label="Types généraux">
              <option value="Documents du cabinet">Documents du cabinet</option>
              <option value="Autre">Autre</option>
            </optgroup>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Ce document sera automatiquement ajouté aux dossiers créés pour le service correspondant.
          </p>
        </div>

        {/* Type de document (gouv. IRCC vs provincial FO) */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Nature du document</label>
          <div className="grid gap-2 md:grid-cols-2">
            {([
              { value: 'ircc', label: 'Fédéral (IRCC)', hint: 'Formulaire fédéral d\'Immigration, Réfugiés et Citoyenneté Canada' },
              { value: 'fo', label: 'Provincial (MIFI)', hint: 'Formulaire provincial du Ministère de l\'Immigration (CSQ, etc.)' },
            ] as const).map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer flex-col rounded-lg border-2 px-3 py-2 text-sm transition ${
                  form.doc_type === opt.value ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="doc_type"
                    checked={form.doc_type === opt.value}
                    onChange={() => setForm((p) => ({ ...p, doc_type: opt.value }))}
                    className="h-4 w-4"
                  />
                  <span className="font-medium text-gray-900">{opt.label}</span>
                </div>
                <span className="ml-6 mt-0.5 text-xs text-gray-500">{opt.hint}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Destinataire selon localisation */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Destinataire selon la localisation du client</label>
          <div className="grid gap-2 md:grid-cols-3">
            {([
              { value: 'any', label: 'Tous (Canada + hors Canada)', hint: 'Aucune restriction' },
              { value: 'in_canada', label: 'Au Canada uniquement', hint: 'Clients sur le territoire' },
              { value: 'outside_canada', label: 'Hors Canada uniquement', hint: 'Clients à l\'étranger' },
            ] as const).map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer flex-col rounded-lg border-2 px-3 py-2 text-sm transition ${
                  form.target_location === opt.value ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="target_location"
                    checked={form.target_location === opt.value}
                    onChange={() => setForm((p) => ({ ...p, target_location: opt.value }))}
                    className="h-4 w-4"
                  />
                  <span className="font-medium text-gray-900">{opt.label}</span>
                </div>
                <span className="ml-6 mt-0.5 text-xs text-gray-500">{opt.hint}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Description (optionnel)</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Décrivez à quoi sert ce formulaire…"
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading || !file}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Création…' : 'Créer le modèle →'}
          </button>
        </div>
      </form>
    </div>
  );
}
