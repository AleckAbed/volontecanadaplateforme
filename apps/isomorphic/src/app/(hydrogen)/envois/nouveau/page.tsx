'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { invitationsService, FormType, Category, FamilyMember, Dossier } from '@/services/invitations';
import { documentService, DocumentTemplate } from '@/services/documents';
import { apiService } from '@/services/api';
import { servicesList } from '@/data/services-immigration';

type SelectedItem =
  | { kind: 'form'; form_type_id: number }
  | { kind: 'document'; document_template_id: number };

export default function NouvelEnvoiPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillClientId = searchParams?.get('client_id');
  const prefillDossierId = searchParams?.get('dossier_id');

  const [clients, setClients] = useState<any[]>([]);
  const [formTypes, setFormTypes] = useState<FormType[]>([]);
  const [docTemplates, setDocTemplates] = useState<DocumentTemplate[]>([]);
  const [formCategories, setFormCategories] = useState<Category[]>([]);
  const [docCategories, setDocCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [clientType, setClientType] = useState<'existing' | 'custom'>('existing');
  const [clientId, setClientId] = useState<number | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  /** 'principal' = send to the client themselves; otherwise number = family_member_id */
  const [recipient, setRecipient] = useState<'principal' | number>('principal');
  const [dossierId, setDossierId] = useState<number | null>(null);
  const [loadingClientDetails, setLoadingClientDetails] = useState(false);
  const [customName, setCustomName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [expiresDays, setExpiresDays] = useState(14);
  const [allowUploads, setAllowUploads] = useState(false);
  const [selectedForms, setSelectedForms] = useState<Set<number>>(new Set());
  const [selectedDocs, setSelectedDocs] = useState<Set<number>>(new Set());

  // Documents de base du dossier sélectionné (template_ids) — affichés en section dédiée
  const [baseDocTemplateIds, setBaseDocTemplateIds] = useState<Set<number>>(new Set());

  // Filtre par service d'immigration sur la liste « Autres modèles »
  const [docServiceFilter, setDocServiceFilter] = useState<string>('');

  // PDF téléversés ad-hoc pour cette invitation (créés comme modèles inactifs côté serveur)
  const [oneOffDocs, setOneOffDocs] = useState<Array<{ template_id: number; name: string }>>([]);
  const [uploadingOneOff, setUploadingOneOff] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [clientsRes, formTypesRes, docsRes, formCatsRes, docCatsRes] = await Promise.all([
          apiService.getClients(),
          invitationsService.listFormTypes({ activeOnly: true }),
          documentService.getTemplates(),
          invitationsService.listCategories({ type: 'form', activeOnly: true }),
          invitationsService.listCategories({ type: 'document', activeOnly: true }),
        ]);
        setClients(Array.isArray(clientsRes.data) ? clientsRes.data : []);
        setFormTypes(formTypesRes);
        setDocTemplates(docsRes);
        setFormCategories(formCatsRes);
        setDocCategories(docCatsRes);

        // Préremplissage depuis l'URL (lien « + Nouvelle invitation » sur un dossier).
        // L'effet ci-dessous (clientId watcher) chargera les family_members + dossiers,
        // après quoi on applique dossierId.
        if (prefillClientId) {
          const cid = Number(prefillClientId);
          if (cid > 0) setClientId(cid);
        }
      } catch (e: any) {
        toast.error(e.message || t('dossiers.load_error'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // When existing client picked, fetch their family members + dossiers, lock email
  useEffect(() => {
    if (clientType !== 'existing' || !clientId) {
      setFamilyMembers([]);
      setDossiers([]);
      setRecipient('principal');
      setDossierId(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoadingClientDetails(true);
        const details = await invitationsService.getClientDetails(clientId);
        if (cancelled) return;
        setFamilyMembers(details.family_members ?? []);
        setDossiers(details.dossiers ?? []);
        setEmail(details.email);
        setRecipient('principal');
        // Si on est venu depuis un dossier précis, on le pré-sélectionne.
        const fromUrl = prefillDossierId ? Number(prefillDossierId) : null;
        const exists = fromUrl && (details.dossiers ?? []).some((d) => d.id === fromUrl);
        setDossierId(exists ? fromUrl : null);
      } catch (e: any) {
        if (!cancelled) toast.error(e.message || t('envois.load_client_error'));
      } finally {
        if (!cancelled) setLoadingClientDetails(false);
      }
    })();
    return () => { cancelled = true; };
  }, [clientType, clientId]);

  // Lorsqu'un dossier est sélectionné, si le flag « envoyer les documents de base au client »
  // est coché côté dossier, on charge ses documents de base et on les pré-coche.
  // Si le flag n'est pas coché, on n'affiche AUCUNE section dédiée (baseDocTemplateIds reste vide).
  useEffect(() => {
    if (!dossierId) {
      setBaseDocTemplateIds(new Set());
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await apiService.getDossier(dossierId);
        if (cancelled) return;
        const d = res?.data as any;
        if (!d?.send_base_docs_to_client) {
          // Flag désactivé → on ignore les docs de base sur cette page d'envoi
          setBaseDocTemplateIds(new Set());
          return;
        }
        const templateIds: number[] = (d?.documents ?? [])
          .map((doc: any) => doc?.document_template_id)
          .filter((v: any): v is number => typeof v === 'number');
        setBaseDocTemplateIds(new Set(templateIds));
        if (templateIds.length > 0) {
          setSelectedDocs((prev) => {
            const next = new Set(prev);
            templateIds.forEach((id) => next.add(id));
            return next;
          });
        }
      } catch {
        if (!cancelled) setBaseDocTemplateIds(new Set());
      }
    })();
    return () => { cancelled = true; };
  }, [dossierId]);

  // Update email/phone display when recipient changes (informational only — backend resolves it)
  useEffect(() => {
    if (clientType !== 'existing') return;
    if (recipient === 'principal') {
      const c = clients.find((x) => x.id === clientId);
      if (c) setEmail(c.email);
    } else {
      const m = familyMembers.find((fm) => fm.id === recipient);
      if (m && m.email) setEmail(m.email);
    }
  }, [recipient, clientType, clientId, clients, familyMembers]);

  const toggleForm = (id: number) => {
    setSelectedForms((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleDoc = (id: number) => {
    setSelectedDocs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  /**
   * Téléverse un PDF ad-hoc pour cette invitation : crée un modèle « inactif »
   * (donc invisible dans la bibliothèque) et l'ajoute automatiquement à la sélection.
   */
  const handleOneOffUpload = async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast.error(t('envois.one_off_pdf_only'));
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error(t('envois.one_off_too_big'));
      return;
    }
    try {
      setUploadingOneOff(true);
      const defaultName = file.name.replace(/\.pdf$/i, '').trim() || file.name;
      const fd = new FormData();
      fd.append('name', defaultName);
      fd.append('is_active', '0');
      fd.append('pdf', file);
      const res = await documentService.createTemplate(fd);
      setOneOffDocs((prev) => [...prev, { template_id: res.id, name: defaultName }]);
      setSelectedDocs((prev) => {
        const next = new Set(prev);
        next.add(res.id);
        return next;
      });
      toast.success(t('envois.one_off_added'));
    } catch (e: any) {
      toast.error(e?.message || t('envois.one_off_failed'));
    } finally {
      setUploadingOneOff(false);
    }
  };

  const removeOneOff = (templateId: number) => {
    setOneOffDocs((prev) => prev.filter((d) => d.template_id !== templateId));
    setSelectedDocs((prev) => {
      const next = new Set(prev);
      next.delete(templateId);
      return next;
    });
  };

  const totalSelected = selectedForms.size + selectedDocs.size;

  // Group form types by category
  const formsByCategory = useMemo(() => {
    const map = new Map<number | null, FormType[]>();
    for (const ft of formTypes) {
      const k = ft.category_id ?? null;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(ft);
    }
    return map;
  }, [formTypes]);

  // Documents de base du dossier (résolus depuis docTemplates par template_id)
  const baseDocs = useMemo(() => {
    if (baseDocTemplateIds.size === 0) return [] as DocumentTemplate[];
    return docTemplates.filter((d) => baseDocTemplateIds.has(d.id));
  }, [docTemplates, baseDocTemplateIds]);

  // Autres modèles (hors docs de base du dossier), filtrés par service si applicable
  const otherDocs = useMemo(() => {
    return docTemplates.filter((d) => {
      if (baseDocTemplateIds.has(d.id)) return false;
      if (docServiceFilter && (d.service_name || '') !== docServiceFilter) return false;
      return true;
    });
  }, [docTemplates, baseDocTemplateIds, docServiceFilter]);

  // Liste complète des services d'immigration actifs (source de vérité = servicesList).
  // L'admin voit donc tous les services, même ceux sans modèle encore associé.
  const docServiceOptions = useMemo(() => {
    return servicesList.filter((s) => s.status === 'active').map((s) => s.name);
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (totalSelected === 0) { toast.error(t('envois.select_at_least_one')); return; }
    if (!email.trim()) { toast.error(t('envois.email_required')); return; }
    if (clientType === 'existing' && !clientId) { toast.error(t('envois.select_client_required')); return; }
    if (clientType === 'custom' && !customName.trim()) { toast.error(t('envois.custom_name_required')); return; }

    const items: SelectedItem[] = [
      ...Array.from(selectedForms).map((id) => ({ kind: 'form' as const, form_type_id: id })),
      ...Array.from(selectedDocs).map((id) => ({ kind: 'document' as const, document_template_id: id })),
    ];

    try {
      setSubmitting(true);
      const res = await invitationsService.createInvitation({
        client_type: clientType,
        client_id: clientType === 'existing' ? clientId! : undefined,
        family_member_id: clientType === 'existing' && recipient !== 'principal' ? recipient : undefined,
        dossier_id: clientType === 'existing' && dossierId ? dossierId : undefined,
        custom_name: clientType === 'custom' ? customName : undefined,
        email,
        phone: clientType === 'custom' ? phone : undefined,
        message: message.trim() || undefined,
        allow_uploads: allowUploads,
        expires_days: expiresDays,
        items,
      });

      if (res.email_sent) {
        toast.success(t('envois.invitation_sent'));
      } else {
        toast.error(t('envois.invitation_created_email_failed'), { duration: 7000 });
      }
      router.push(`/envois/${res.data.id}`);
    } catch (e: any) {
      toast.error(e.message || t('clients.toasts.error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-400">{t('common.loading')}</div>;

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('envois.new_title')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('envois.new_subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* === CLIENT === */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('envois.step1_recipient')}</h2>

          <div className="mb-4 flex gap-3">
            <button
              type="button"
              onClick={() => setClientType('existing')}
              className={`flex-1 rounded-lg border-2 px-4 py-2 text-sm font-medium ${
                clientType === 'existing'
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-700'
              }`}
            >
              {t('envois.client_existing')}
            </button>
            <button
              type="button"
              onClick={() => setClientType('custom')}
              className={`flex-1 rounded-lg border-2 px-4 py-2 text-sm font-medium ${
                clientType === 'custom'
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-700'
              }`}
            >
              {t('envois.client_custom')}
            </button>
          </div>

          {clientType === 'existing' ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{t('envois.main_client')} *</label>
                <select
                  value={clientId ?? ''}
                  onChange={(e) => setClientId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">{t('envois.choose_short')}</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.first_name} {c.last_name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              {clientId && (
                <>
                  {/* Destinataire de l&apos;invitation : principal ou un membre de famille */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      {t('envois.invitation_recipient')}
                    </label>
                    <select
                      value={String(recipient)}
                      onChange={(e) => {
                        const v = e.target.value;
                        setRecipient(v === 'principal' ? 'principal' : Number(v));
                      }}
                      disabled={loadingClientDetails}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="principal">
                        {t('envois.principal_himself')}
                      </option>
                      {familyMembers.map((m) => (
                        <option key={m.id} value={m.id} disabled={!m.email}>
                          {m.first_name} {m.last_name} ({t(`clients.relationship.${m.relationship}`, { defaultValue: m.relationship })})
                          {m.email ? ` — ${m.email}` : ` — ${t('envois.no_email_suffix')}`}
                        </option>
                      ))}
                    </select>
                    {familyMembers.length === 0 && !loadingClientDetails && (
                      <p className="mt-1 text-xs text-gray-500">
                        {t('envois.no_family_members_short')}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      {t('envois.principal_will_receive')}
                    </p>
                  </div>

                  {/* Dossier optionnel */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      {t('envois.dossier_optional')}
                    </label>
                    <select
                      value={dossierId ?? ''}
                      onChange={(e) => setDossierId(e.target.value ? Number(e.target.value) : null)}
                      disabled={loadingClientDetails}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="">{t('envois.no_dossier_option')}</option>
                      {dossiers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} — {t(`dossiers.status.${d.status}`, { defaultValue: d.status })}
                        </option>
                      ))}
                    </select>
                    {dossiers.length === 0 && !loadingClientDetails && (
                      <p className="mt-1 text-xs text-gray-500">
                        {t('envois.no_dossiers_for_client')}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{t('envois.full_name_label')} *</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{t('envois.phone_label')}</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('envois.email_label')} *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={clientType === 'existing'}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50"
            />
          </div>
        </div>

        {/* === FORMULAIRES === */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('envois.step2_forms')} <span className="text-sm font-normal text-gray-500">({t(selectedForms.size > 1 ? 'envois.selected_count_other' : 'envois.selected_count_one', { count: selectedForms.size })})</span>
            </h2>
          </div>

          {formTypes.length === 0 ? (
            <p className="text-sm text-gray-400">{t('envois.no_form_types_short')} <a href="/configuration/form-types" className="text-blue-600 hover:underline">{t('envois.create_one')}</a></p>
          ) : (
            <div className="space-y-4">
              {formCategories.map((cat) => {
                const items = formsByCategory.get(cat.id) || [];
                if (items.length === 0) return null;
                return (
                  <CategorySection key={`fcat-${cat.id}`} title={cat.name} color={cat.color}>
                    {items.map((ft) => (
                      <CheckItem
                        key={`ft-${ft.id}`}
                        checked={selectedForms.has(ft.id)}
                        onToggle={() => toggleForm(ft.id)}
                        title={ft.name}
                        subtitle={ft.description}
                      />
                    ))}
                  </CategorySection>
                );
              })}
              {/* Forms without category */}
              {(formsByCategory.get(null) || []).length > 0 && (
                <CategorySection title={t('envois.no_categories_short')}>
                  {formsByCategory.get(null)!.map((ft) => (
                    <CheckItem
                      key={`ft-${ft.id}`}
                      checked={selectedForms.has(ft.id)}
                      onToggle={() => toggleForm(ft.id)}
                      title={ft.name}
                      subtitle={ft.description}
                    />
                  ))}
                </CategorySection>
              )}
            </div>
          )}
        </div>

        {/* === DOCUMENTS DE BASE DU DOSSIER === */}
        {baseDocs.length > 0 && (
          <div className="rounded-xl border-2 border-blue-200 bg-blue-50/50 p-5">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-xl">📋</span>
              <h2 className="text-lg font-semibold text-gray-900">
                {t('envois.base_docs_title')}{' '}
                <span className="text-sm font-normal text-gray-500">({baseDocs.length})</span>
              </h2>
            </div>
            <p className="mb-3 text-xs text-gray-600">{t('envois.base_docs_hint')}</p>
            <div className="space-y-2">
              {baseDocs.map((d) => (
                <CheckItem
                  key={`base-d-${d.id}`}
                  checked={selectedDocs.has(d.id)}
                  onToggle={() => toggleDoc(d.id)}
                  title={d.name}
                  subtitle={d.service_name ? `${d.description ?? ''}${d.description ? ' · ' : ''}${d.service_name}` : d.description}
                />
              ))}
            </div>
          </div>
        )}

        {/* === AUTRES MODÈLES === */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              {baseDocs.length > 0 ? t('envois.other_docs_title') : t('envois.step3_documents')}{' '}
              <span className="text-sm font-normal text-gray-500">({t(selectedDocs.size > 1 ? 'envois.selected_count_other' : 'envois.selected_count_one', { count: selectedDocs.size })})</span>
            </h2>
            {docServiceOptions.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">{t('envois.doc_filter_service')}</label>
                <select
                  value={docServiceFilter}
                  onChange={(e) => setDocServiceFilter(e.target.value)}
                  className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
                >
                  <option value="">{t('envois.doc_filter_all_services')}</option>
                  {docServiceOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {docServiceFilter && (
                  <button
                    type="button"
                    onClick={() => setDocServiceFilter('')}
                    className="text-xs text-gray-500 hover:underline"
                  >
                    {t('envois.doc_filter_reset')}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* PDF ad-hoc téléversés pour cette invitation */}
          {oneOffDocs.length > 0 && (
            <div className="mb-3 space-y-2">
              {oneOffDocs.map((d) => (
                <div
                  key={`one-off-${d.template_id}`}
                  className="flex items-center gap-3 rounded-lg border border-purple-200 bg-purple-50 p-3"
                >
                  <span className="text-xl">📤</span>
                  <div className="flex-1 overflow-hidden">
                    <div className="truncate text-sm font-medium text-gray-900">{d.name}</div>
                    <div className="text-xs text-purple-700">{t('envois.one_off_label')}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeOneOff(d.template_id)}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    {t('common.delete')}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Bouton téléverser un PDF ad-hoc */}
          <div className="mb-3">
            <label
              className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-blue-400 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 ${
                uploadingOneOff ? 'opacity-60' : ''
              }`}
            >
              <span>📤</span>
              {uploadingOneOff ? t('envois.one_off_uploading') : t('envois.one_off_button')}
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                disabled={uploadingOneOff}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleOneOffUpload(f);
                  e.target.value = '';
                }}
              />
            </label>
            <p className="mt-1 text-xs text-gray-500">{t('envois.one_off_hint')}</p>
          </div>

          {docTemplates.length === 0 ? (
            <p className="text-sm text-gray-400">{t('envois.no_doc_templates_short')} <a href="/documents/nouveau" className="text-blue-600 hover:underline">{t('envois.upload_one')}</a></p>
          ) : otherDocs.length === 0 ? (
            <p className="rounded-lg bg-gray-50 px-3 py-3 text-sm text-gray-500">
              {docServiceFilter ? t('envois.no_docs_for_filter') : t('envois.no_other_docs')}
            </p>
          ) : (
            <div className="space-y-2">
              {otherDocs.map((d) => (
                <CheckItem
                  key={`d-${d.id}`}
                  checked={selectedDocs.has(d.id)}
                  onToggle={() => toggleDoc(d.id)}
                  title={d.name}
                  subtitle={d.service_name ? `${d.description ?? ''}${d.description ? ' · ' : ''}${d.service_name}` : d.description}
                />
              ))}
            </div>
          )}
        </div>

        {/* === MESSAGE / EXPIRATION === */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('envois.step4_details')}</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('envois.message_optional')}</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder={t('envois.message_placeholder')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('envois.expires_days_label')}</label>
              <input
                type="number"
                min={1}
                max={365}
                value={expiresDays}
                onChange={(e) => setExpiresDays(Number(e.target.value))}
                className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <input
                  type="checkbox"
                  checked={allowUploads}
                  onChange={(e) => setAllowUploads(e.target.checked)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{t('envois.allow_uploads_label')}</div>
                  <div className="text-xs text-gray-500">{t('envois.allow_uploads_hint')}</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* === ACTIONS === */}
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5">
          <div className="text-sm text-gray-700">
            {t(totalSelected !== 1 ? 'envois.items_to_send_other' : 'envois.items_to_send_one', { count: totalSelected })}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting || totalSelected === 0}
              className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? t('envois.submitting') : t('envois.submit_send')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function CategorySection({
  title, color, children,
}: { title: string; color?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
      <div className="mb-2 flex items-center gap-2">
        {color && <span className={`h-3 w-3 rounded-full bg-${color}-500`} />}
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function CheckItem({
  checked, onToggle, title, subtitle,
}: { checked: boolean; onToggle: () => void; title: string; subtitle?: string }) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
        checked ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <input type="checkbox" checked={checked} onChange={onToggle} className="mt-0.5" />
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-900">{title}</div>
        {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
      </div>
    </label>
  );
}
