'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { invitationsService, Invitation, InvitationItemSummary } from '@/services/invitations';

const XfaPdfViewer = dynamic(() => import('@/components/XfaPdfViewer'), { ssr: false });

const STATUS_CLASSNAMES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  expired: 'bg-gray-100 text-gray-700',
};

export default function EnvoiDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useTranslation();
  const { id } = use(params);
  const router = useRouter();
  const [inv, setInv] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewingItem, setViewingItem] = useState<InvitationItemSummary | null>(null);
  const [pdfPromise, setPdfPromise] = useState<Promise<ArrayBuffer> | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [viewingFormItem, setViewingFormItem] = useState<InvitationItemSummary | null>(null);
  const [formFullscreen, setFormFullscreen] = useState(false);
  const [resending, setResending] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await invitationsService.getInvitation(Number(id));
      setInv(data);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const openItemPdf = (item: InvitationItemSummary) => {
    if (item.kind !== 'document') return;
    setViewingItem(item);
    const url = invitationsService.getAdminItemPdfUrl(Number(id), item.id);
    const token = (typeof window !== 'undefined') ? localStorage.getItem('auth_token') : null;
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    setPdfPromise(fetch(url, { headers }).then((r) => {
      if (!r.ok) throw new Error(t('envois.pdf_load_error'));
      return r.arrayBuffer();
    }));
  };

  const copyLink = () => {
    if (!inv) return;
    const url = `${window.location.origin}/invitation/${inv.unique_code}`;
    navigator.clipboard.writeText(url);
    toast.success(t('envois.link_copied'));
  };

  const handleResend = async () => {
    if (!inv) return;
    if (!confirm(t('envois.resend_confirm', { email: inv.email }))) return;
    setResending(true);
    try {
      await invitationsService.resendInvitationEmail(inv.id);
      toast.success(t('envois.resend_success'));
      load();
    } catch (e: any) {
      toast.error(t('envois.resend_failed', { error: e.message || '' }));
    } finally {
      setResending(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-400">{t('common.loading')}</div>;
  if (!inv) return <div className="p-6 text-center text-red-500">{t('envois.not_found')}</div>;

  const statusClassName = STATUS_CLASSNAMES[inv.status] || STATUS_CLASSNAMES.pending;
  const statusLabel = t(`envois.status.${inv.status}`, { defaultValue: inv.status });
  const recipient = inv.client?.name || inv.custom_name || '—';
  const completed = inv.items.filter((i) => i.status === 'completed').length;
  const total = inv.items.length;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={() => router.push('/envois')}
            className="mb-2 text-sm text-gray-500 hover:text-gray-800"
          >
            {t('envois.back_to_list_btn')}
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{t('envois.send_to', { recipient })}</h1>
          <p className="mt-1 text-sm text-gray-500">{inv.email}</p>
          {inv.family_member && (
            <p className="mt-1 text-sm text-blue-700">
              {t('envois.actual_recipient', {
                name: inv.family_member.name,
                relationship: t(`clients.relationship.${inv.family_member.relationship}`, { defaultValue: inv.family_member.relationship }),
              })}
            </p>
          )}
          {inv.dossier && (
            <p className="mt-1 text-sm text-purple-700">
              {t('envois.dossier_short', { name: inv.dossier.name })}
              {inv.dossier.status ? ` — ${t(`dossiers.status.${inv.dossier.status}`, { defaultValue: inv.dossier.status })}` : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusClassName}`}>{statusLabel}</span>
          <button
            onClick={copyLink}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t('envois.copy_link')}
          </button>
          <button
            onClick={handleResend}
            disabled={resending}
            className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
          >
            {resending ? t('envois.resending') : t('envois.resend_email')}
          </button>
        </div>
      </div>

      {/* Meta */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label={t('envois.stat_progress')} value={`${completed} / ${total}`} />
        <Stat label={t('envois.stat_sent')} value={inv.sent_at ?? '—'} />
        <Stat label={t('envois.stat_expires')} value={inv.expires_at ?? '—'} />
        <Stat label={t('envois.stat_email')} value={inv.email_sent ? t('envois.email_ok') : t('envois.email_failed')} valueClassName={inv.email_sent ? 'text-green-700' : 'text-red-700'} />
      </div>

      {inv.message && (
        <div className="mb-6 rounded-xl border-l-4 border-blue-500 bg-blue-50 p-4">
          <div className="text-xs font-semibold uppercase text-blue-700">{t('envois.message_to_client')}</div>
          <p className="mt-1 text-sm text-gray-700">{inv.message}</p>
        </div>
      )}

      {/* Items */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('envois.items_count', { count: total })}</h2>
        <div className="space-y-2">
          {inv.items.map((item) => {
            const itemStatusClass = STATUS_CLASSNAMES[item.status] || STATUS_CLASSNAMES.pending;
            const itemStatusLabel = t(`envois.status.${item.status}`, { defaultValue: item.status });
            return (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
              >
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  item.kind === 'form' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                }`}>
                  {item.kind === 'form' ? t('envois.kind_form') : t('envois.kind_document')}
                </span>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {item.form_type?.name ?? item.document_template?.name ?? '—'}
                  </div>
                  {(item.form_type?.category || item.document_template?.category) && (
                    <div className="text-xs text-gray-500">
                      {item.form_type?.category ?? item.document_template?.category}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {item.last_saved_at && <span>{t('envois.modified_at', { date: item.last_saved_at })}</span>}
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${itemStatusClass}`}>
                  {itemStatusLabel}
                </span>
                {item.kind === 'document' && (item.has_filled_pdf || item.form_data) && (
                  <button
                    onClick={() => openItemPdf(item)}
                    className="rounded-lg border border-blue-600 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                  >
                    {t('envois.view_pdf')}
                  </button>
                )}
                {item.kind === 'form' && item.form_data && (
                  <button
                    onClick={() => setViewingFormItem(item)}
                    className="rounded-lg border border-blue-600 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                  >
                    {t('envois.view_responses')}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* PDF viewer modal */}
      {viewingItem && pdfPromise && (
        <div
          className={`fixed inset-0 z-[9999] flex bg-black/50 ${
            fullscreen ? 'p-0 items-stretch justify-stretch' : 'items-center justify-center p-4'
          }`}
        >
          <div
            className={`flex flex-col overflow-hidden bg-white ${
              fullscreen ? 'h-screen w-screen rounded-none' : 'h-[90vh] w-full max-w-5xl rounded-xl'
            }`}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <h3 className="font-semibold text-gray-900">
                {viewingItem.document_template?.name}
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFullscreen((f) => !f)}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  title={fullscreen ? t('envois.exit_fullscreen') : t('envois.fullscreen_btn')}
                >
                  {fullscreen ? t('envois.exit_fullscreen') : t('envois.fullscreen_btn')}
                </button>
                <button
                  onClick={() => { setViewingItem(null); setPdfPromise(null); setFullscreen(false); }}
                  className="text-sm text-gray-500 hover:text-gray-800"
                >
                  {t('envois.close_btn')}
                </button>
              </div>
            </div>
            <div className="flex-1">
              <XfaPdfViewer
                filePromise={pdfPromise}
                fileName={`${viewingItem.document_template?.name ?? 'document'}.pdf`}
                readOnly={true}
                initialFormData={viewingItem.form_data || undefined}
              />
            </div>
          </div>
        </div>
      )}

      {/* Form responses preview modal */}
      {viewingFormItem && (
        <div
          className={`fixed inset-0 z-[9999] flex bg-black/50 ${
            formFullscreen ? 'p-0 items-stretch justify-stretch' : 'items-center justify-center p-4'
          }`}
        >
          <div
            className={`flex flex-col overflow-hidden bg-white ${
              formFullscreen ? 'h-screen w-screen rounded-none' : 'h-[90vh] w-full max-w-4xl rounded-xl'
            }`}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <h3 className="font-semibold text-gray-900">
                {t('envois.responses_for', { form: viewingFormItem.form_type?.name })}
              </h3>
              <div className="flex items-center gap-3">
                {viewingFormItem.form_type?.code === 'questionnaire_demandeur_001' && (
                  <button
                    onClick={async () => {
                      try {
                        const { buildClientFormPdf } = await import('@/app/shared/client-form/client-form-multi-step/build-client-form-pdf');

                        // Merge invitation-level client info into formData so the
                        // builder's basic-info section displays them even when the
                        // client hasn't filled those fields yet.
                        const baseData = viewingFormItem.form_data || {};
                        const recipientName = (inv?.client?.name || inv?.custom_name || '').trim();
                        // Convention: "Last First" if it has a space, otherwise treat as last name
                        const parts = recipientName.split(/\s+/).filter(Boolean);
                        const fallbackFirstName = parts.length > 1 ? parts.slice(1).join(' ') : '';
                        const fallbackLastName = parts.length > 0 ? parts[0] : '';
                        const isFilled = (v: any) => v !== undefined && v !== null && String(v).trim() !== '';
                        const enrichedData = {
                          ...baseData,
                          firstName: isFilled(baseData.firstName) ? baseData.firstName : fallbackFirstName,
                          lastName: isFilled(baseData.lastName) ? baseData.lastName : fallbackLastName,
                          email: isFilled(baseData.email) ? baseData.email
                                 : isFilled(baseData.applicant?.email) ? baseData.applicant.email
                                 : (inv?.email || ''),
                          phone: isFilled(baseData.phone) ? baseData.phone
                                 : isFilled(baseData.telephone) ? baseData.telephone
                                 : (inv?.phone || ''),
                        };
                        console.log('[PDF] enriched name:', enrichedData.firstName, enrichedData.lastName, '/ email:', enrichedData.email);

                        await buildClientFormPdf(enrichedData, 'fr', {
                          preview: true,
                          meta: {
                            formType: viewingFormItem.form_type?.name,
                            submittedAt: inv?.sent_at,
                            status: viewingFormItem.status,
                            updatedAt: viewingFormItem.last_saved_at,
                            completedAt: viewingFormItem.completed_at,
                          },
                        });
                      } catch (e: any) {
                        toast.error(e?.message ?? t('envois.pdf_generation_failed'));
                      }
                    }}
                    className="rounded-lg border border-blue-600 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                  >
                    {t('envois.download_pdf')}
                  </button>
                )}
                <button
                  onClick={() => setFormFullscreen((f) => !f)}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  {formFullscreen ? t('envois.exit_fullscreen') : t('envois.fullscreen_btn')}
                </button>
                <button
                  onClick={() => { setViewingFormItem(null); setFormFullscreen(false); }}
                  className="text-sm text-gray-500 hover:text-gray-800"
                >
                  {t('envois.close_btn')}
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-gray-50 p-6">
              <FormResponsesView
                item={viewingFormItem}
                recipient={inv?.client?.name || inv?.custom_name || inv?.email}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Company branding for document headers/footers — adjust to your business. */
const COMPANY_INFO = {
  name: 'Volonté Canada',
  tagline: 'Cabinet d\'immigration',
  website: 'volontecanada.ca',
  email: 'formulaire.volontecanada@querga.ca',
  address: 'Montréal, Québec, Canada',
  /** White logo — use on colored backgrounds */
  logoSrcOnDark: '/logo2.png',
  /** Red logo — use on white/light backgrounds */
  logoSrcOnLight: '/logo1.png',
};

/** Form-style preview: labels + read-only input boxes grouped in sections. */
function FormResponsesView({
  item, recipient,
}: { item: InvitationItemSummary; recipient?: string }) {
  const { t, i18n } = useTranslation();
  const data = item.form_data || {};
  const localeMap: Record<string, string> = { fr: 'fr-CA', en: 'en-CA', es: 'es-CA' };
  const locale = localeMap[i18n.language] || 'fr-CA';
  const generatedAt = new Date().toLocaleDateString(locale, {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="mx-auto max-w-4xl">
      {/* Document header — printable */}
      <div className="mb-6 overflow-hidden rounded-xl bg-white shadow-sm">
        {/* Top bar */}
        <div className="bg-gradient-to-r from-red-700 to-red-900 px-8 py-5 text-white">
          <div className="flex items-center justify-between">
            <Image
              src={COMPANY_INFO.logoSrcOnDark}
              alt={COMPANY_INFO.name}
              width={180}
              height={64}
              style={{ height: 'auto', maxHeight: 64, width: 'auto', maxWidth: 200 }}
              priority
            />
            <div className="text-right text-xs text-red-100">
              <p>{COMPANY_INFO.website}</p>
              <p>{COMPANY_INFO.email}</p>
              <p>{COMPANY_INFO.address}</p>
            </div>
          </div>
        </div>
        {/* Form metadata */}
        <div className="px-8 py-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-red-700">
            {item.form_type?.category || t('envois.kind_form')}
          </div>
          <h2 className="mt-1 text-2xl font-bold text-gray-900">{item.form_type?.name}</h2>
          <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-gray-600 md:grid-cols-3">
            {recipient && (
              <div><span className="font-semibold text-gray-700">{t('envois.form_resp.applicant')} :</span> {recipient}</div>
            )}
            {item.last_saved_at && (
              <div><span className="font-semibold text-gray-700">{t('envois.form_resp.modified_on')} :</span> {item.last_saved_at}</div>
            )}
            <div><span className="font-semibold text-gray-700">{t('envois.form_resp.edited_on')} :</span> {generatedAt}</div>
          </div>
        </div>
      </div>

      {/* Body */}
      {Object.keys(data).length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center text-gray-400 shadow-sm">
          {t('envois.form_resp.no_responses')}
        </div>
      ) : (
        <FormGroup value={data} title={null} level={0} />
      )}

      {/* Footer */}
      <div className="mt-8 rounded-xl bg-white px-8 py-5 shadow-sm">
        <div className="flex items-center justify-center gap-3 border-b border-gray-200 pb-3">
          <Image
            src={COMPANY_INFO.logoSrcOnLight}
            alt={COMPANY_INFO.name}
            width={32}
            height={32}
            style={{ height: 'auto', maxHeight: 28, width: 'auto', maxWidth: 80 }}
          />
          <div className="text-sm">
            <strong className="text-gray-900">{COMPANY_INFO.name}</strong>
            <span className="text-gray-500"> — {COMPANY_INFO.tagline}</span>
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-gray-500">
          {t('envois.form_resp.footer_confidential', { date: generatedAt })} · {COMPANY_INFO.website} · {COMPANY_INFO.email}
        </p>
        <p className="mt-2 text-center text-[10px] text-gray-400">
          {t('envois.form_resp.footer_disclaimer')}
        </p>
      </div>
    </div>
  );
}

/** Recursively renders a section of form data. */
function FormGroup({
  value, title, level,
}: { value: any; title: string | null; level: number }) {
  const { t } = useTranslation();
  if (value === null || value === undefined) return null;

  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    return (
      <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
        {title && (
          <h2 className="mb-4 border-b border-gray-200 pb-2 text-base font-bold text-gray-900">
            {title}
          </h2>
        )}
        <div className="space-y-4">
          {value.map((v, i) => (
            <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="mb-3 inline-block rounded-full bg-red-100 px-3 py-0.5 text-xs font-semibold text-red-800">
                {t('envois.form_resp.element', { n: i + 1 })}
              </div>
              {typeof v === 'object' && v !== null && !Array.isArray(v) ? (
                <FormFieldsGrid entries={Object.entries(v)} />
              ) : (
                <FieldDisplay label={t('envois.form_resp.value_n', { n: i + 1 })} value={v} />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (typeof value !== 'object') {
    return (
      <div className="mb-4 rounded-xl bg-white p-6 shadow-sm">
        <FieldDisplay label={title ?? '—'} value={value} />
      </div>
    );
  }

  // Plain object
  const entries = Object.entries(value).filter(
    ([, v]) => v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0),
  );
  if (entries.length === 0) return null;

  // Separate scalar fields from nested objects/arrays
  const scalarEntries: Array<[string, any]> = [];
  const nestedEntries: Array<[string, any]> = [];
  entries.forEach(([k, v]) => {
    if (v !== null && typeof v === 'object') nestedEntries.push([k, v]);
    else scalarEntries.push([k, v]);
  });

  return (
    <>
      {(title || scalarEntries.length > 0) && (
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          {title && (
            <h2 className="mb-4 border-b border-gray-200 pb-2 text-base font-bold text-gray-900">
              {title}
            </h2>
          )}
          {scalarEntries.length > 0 && <FormFieldsGrid entries={scalarEntries} />}
        </div>
      )}
      {nestedEntries.map(([k, v]) => (
        <FormGroup key={k} value={v} title={humanize(k)} level={level + 1} />
      ))}
    </>
  );
}

/** Two-column grid of label + input-style box for scalar fields. */
function FormFieldsGrid({ entries }: { entries: Array<[string, any]> }) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
      {entries.map(([k, v]) => (
        <FieldDisplay key={k} label={humanize(k)} value={v} />
      ))}
    </div>
  );
}

/** A single labeled "input" displaying its value read-only. */
function FieldDisplay({ label, value }: { label: string; value: any }) {
  const { t } = useTranslation();
  const isLong = typeof value === 'string' && value.length > 60;
  const isBool = typeof value === 'boolean';

  return (
    <div className={isLong ? 'md:col-span-2' : ''}>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
        {label}
      </label>
      {isBool ? (
        <div
          className={`rounded-lg border px-3 py-2 text-sm font-medium ${
            value
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-gray-200 bg-gray-50 text-gray-600'
          }`}
        >
          {value ? t('envois.form_resp.yes') : t('envois.form_resp.no')}
        </div>
      ) : isLong ? (
        <div className="min-h-[6rem] whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900">
          {String(value)}
        </div>
      ) : (
        <div className="truncate rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900">
          {value === '' || value == null ? (
            <span className="text-gray-400">—</span>
          ) : (
            String(value)
          )}
        </div>
      )}
    </div>
  );
}

/** French labels for known field keys (extracted from the multi-step forms). */
const FIELD_LABELS_FR: Record<string, string> = {
  // Identity
  firstName: 'Prénom',
  lastName: 'Nom de famille',
  middleName: 'Second prénom',
  fullName: 'Nom complet',
  email: 'Courriel',
  phone: 'Téléphone',
  telephone: 'Téléphone',
  mobile: 'Mobile',
  dateOfBirth: 'Date de naissance',
  applicantDateOfBirth: 'Date de naissance du demandeur',
  countryOfBirth: 'Pays de naissance',
  applicantCountryOfBirth: 'Pays de naissance du demandeur',
  placeOfBirth: 'Lieu de naissance',
  cityOfBirth: 'Ville de naissance',
  nationality: 'Nationalité',
  citizenship: 'Citoyenneté',
  numberOfCitizenships: 'Nombre de citoyennetés',
  sex: 'Sexe',
  gender: 'Sexe',
  eyeColor: 'Couleur des yeux',
  hairColor: 'Couleur des cheveux',
  height: 'Taille',
  weight: 'Poids',

  // Marital
  maritalStatus: 'État civil',
  applicantMaritalStatus: 'État civil du demandeur',
  currentMaritalStatus: 'État civil actuel',
  spouseMaritalStatus: 'État civil du conjoint',
  marriageDate: 'Date du mariage',
  hasPreviousSpouse: 'A déjà eu un conjoint',
  previousSpouseDateOfBirth: 'Date de naissance du conjoint précédent',
  previousSpouseRelationshipStartDate: 'Début de la relation précédente',
  previousSpouseRelationshipEndDate: 'Fin de la relation précédente',
  previousSpouseRelationshipType: 'Type de relation précédente',

  // Address
  address: 'Adresse',
  addressLine1: 'Adresse (ligne 1)',
  addressLine2: 'Adresse (ligne 2)',
  street: 'Rue',
  city: 'Ville',
  province: 'Province',
  state: 'État/Province',
  country: 'Pays',
  postalCode: 'Code postal',
  zipCode: 'Code postal',
  from: 'Du',
  to: 'Au',
  fromDate: 'Date de début',
  toDate: 'Date de fin',
  hasPreviousResidence: 'Résidence précédente',

  // Passport / ID
  passport: 'Passeport',
  passportNumber: 'Numéro de passeport',
  passportIssueCountry: 'Pays de délivrance du passeport',
  passportIssueDate: 'Date de délivrance du passeport',
  passportExpiryDate: 'Date d\'expiration du passeport',
  issueCountry: 'Pays de délivrance',
  issueDate: 'Date de délivrance',
  expiryDate: 'Date d\'expiration',
  nationalId: 'Pièce d\'identité nationale',
  nationalIdNumber: 'Numéro pièce d\'identité',
  nationalIdIssueCountry: 'Pays de la pièce d\'identité',
  nationalIdIssueDate: 'Date de délivrance pièce d\'identité',
  nationalIdExpiryDate: 'Expiration pièce d\'identité',

  // Languages
  languages: 'Langues',
  motherTongue: 'Langue maternelle',
  preferredLanguageCorrespondence: 'Langue de correspondance préférée',
  preferredLanguageInterview: 'Langue d\'entrevue préférée',
  englishLevel: 'Niveau d\'anglais',
  frenchLevel: 'Niveau de français',

  // Education / Employment
  education: 'Études',
  educationLevel: 'Niveau d\'études',
  highestLevel: 'Niveau de scolarité le plus élevé',
  totalYears: 'Nombre total d\'années d\'études',
  yearsOfStudy: 'Années d\'études',
  schoolName: 'Établissement',
  schoolCountry: 'Pays de l\'établissement',
  degree: 'Diplôme',
  fieldOfStudy: 'Domaine d\'études',
  graduationDate: 'Date d\'obtention',
  employment: 'Emploi',
  employmentInfo: 'Renseignements sur l\'emploi',
  current: 'Actuel',
  planned: 'Prévu',
  currentEmployment: 'Emploi actuel',
  plannedEmployment: 'Emploi prévu',
  occupation: 'Profession',
  jobTitle: 'Titre du poste',
  employer: 'Employeur',
  employerAddress: 'Adresse de l\'employeur',
  salary: 'Salaire',
  income: 'Revenu',
  startDate: 'Date de début',
  endDate: 'Date de fin',
  duration: 'Durée',

  // Family
  applicant: 'Demandeur',
  spouse: 'Conjoint(e)',
  spouseDateOfBirth: 'Date de naissance du conjoint',
  spouseCountryOfBirth: 'Pays de naissance du conjoint',
  father: 'Père',
  fatherDateOfBirth: 'Date de naissance du père',
  fatherCountryOfBirth: 'Pays de naissance du père',
  fatherMaritalStatus: 'État civil du père',
  mother: 'Mère',
  motherDateOfBirth: 'Date de naissance de la mère',
  motherCountryOfBirth: 'Pays de naissance de la mère',
  motherMaritalStatus: 'État civil de la mère',
  children: 'Enfants',
  parents: 'Parents',
  siblings: 'Frères et sœurs',
  familyMembers: 'Membres de la famille',
  numberOfFamilyMembers: 'Nombre de membres de la famille',
  relationship: 'Lien de parenté',

  // CSQ / Travel
  hasCSQ: 'A un CSQ',
  csqApplicationDate: 'Date de demande du CSQ',
  noTrips: 'Aucun voyage',
  travels: 'Voyages',
  travelHistory: 'Historique des voyages',
  trip: 'Voyage',
  trips: 'Voyages',
  purposeOfVisit: 'Motif du voyage',
  destination: 'Destination',

  // Misc
  agreeToTerms: 'Acceptation des conditions',
  notes: 'Notes',
  comments: 'Commentaires',
  signature: 'Signature',
  date: 'Date',
  yes: 'Oui',
  no: 'Non',
};

function humanize(key: string): string {
  if (FIELD_LABELS_FR[key]) return FIELD_LABELS_FR[key];

  // Try lowercase match (in case PDF.js gives us lowercase variants)
  const lower = key.charAt(0).toLowerCase() + key.slice(1);
  if (FIELD_LABELS_FR[lower]) return FIELD_LABELS_FR[lower];

  // Strip trailing numeric suffixes (PDF.js sometimes appends ids)
  const stripped = key.replace(/\d+$/, '');
  if (FIELD_LABELS_FR[stripped]) return FIELD_LABELS_FR[stripped];

  // Default: humanize camelCase / snake_case
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^\w/, (c) => c.toUpperCase());
}

function Stat({ label, value, valueClassName = '' }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="text-xs uppercase text-gray-500">{label}</div>
      <div className={`mt-1 font-medium text-gray-900 ${valueClassName}`}>{value}</div>
    </div>
  );
}
