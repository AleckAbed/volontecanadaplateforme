'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { invitationsService, FormType, Category, FamilyMember, Dossier } from '@/services/invitations';
import { documentService, DocumentTemplate } from '@/services/documents';
import { apiService } from '@/services/api';

type SelectedItem =
  | { kind: 'form'; form_type_id: number }
  | { kind: 'document'; document_template_id: number };

export default function NouvelEnvoiPage() {
  const router = useRouter();

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
  const [selectedForms, setSelectedForms] = useState<Set<number>>(new Set());
  const [selectedDocs, setSelectedDocs] = useState<Set<number>>(new Set());

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
      } catch (e: any) {
        toast.error(e.message || 'Erreur de chargement');
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
        setDossierId(null);
      } catch (e: any) {
        if (!cancelled) toast.error(e.message || 'Erreur de chargement du client');
      } finally {
        if (!cancelled) setLoadingClientDetails(false);
      }
    })();
    return () => { cancelled = true; };
  }, [clientType, clientId]);

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

  // Group documents by category_id (or fallback to category enum)
  const docsByCategory = useMemo(() => {
    const map = new Map<string, DocumentTemplate[]>();
    for (const d of docTemplates) {
      const k = (d as any).category_id ? String((d as any).category_id) : `enum:${d.category}`;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(d);
    }
    return map;
  }, [docTemplates]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (totalSelected === 0) { toast.error('Sélectionnez au moins un formulaire ou document'); return; }
    if (!email.trim()) { toast.error('Email requis'); return; }
    if (clientType === 'existing' && !clientId) { toast.error('Sélectionnez un client'); return; }
    if (clientType === 'custom' && !customName.trim()) { toast.error('Nom du client requis'); return; }

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
        expires_days: expiresDays,
        items,
      });

      if (res.email_sent) {
        toast.success('Invitation envoyée avec succès — email transmis au client.');
      } else {
        toast.error(`Invitation créée mais l'email n'a pas pu être envoyé.`, { duration: 7000 });
      }
      router.push(`/envois/${res.data.id}`);
    } catch (e: any) {
      toast.error(e.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-400">Chargement…</div>;

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nouvel envoi</h1>
        <p className="mt-1 text-sm text-gray-500">
          Créez une invitation contenant un ou plusieurs formulaires et documents à remplir par le client.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* === CLIENT === */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">1. Destinataire</h2>

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
              Client existant
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
              Client personnalisé
            </button>
          </div>

          {clientType === 'existing' ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Client principal *</label>
                <select
                  value={clientId ?? ''}
                  onChange={(e) => setClientId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">— Choisir —</option>
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
                      Destinataire de l&apos;invitation
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
                        Le client principal lui-même
                      </option>
                      {familyMembers.map((m) => (
                        <option key={m.id} value={m.id} disabled={!m.email}>
                          {m.first_name} {m.last_name} ({m.relationship})
                          {m.email ? ` — ${m.email}` : ' — pas d\'email'}
                        </option>
                      ))}
                    </select>
                    {familyMembers.length === 0 && !loadingClientDetails && (
                      <p className="mt-1 text-xs text-gray-500">
                        Ce client n&apos;a pas de membres de famille enregistrés.
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Le client principal recevra l&apos;invitation et la gérera, peu importe le destinataire.
                    </p>
                  </div>

                  {/* Dossier optionnel */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Dossier (optionnel)
                    </label>
                    <select
                      value={dossierId ?? ''}
                      onChange={(e) => setDossierId(e.target.value ? Number(e.target.value) : null)}
                      disabled={loadingClientDetails}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="">— Aucun dossier —</option>
                      {dossiers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} — {d.status}
                        </option>
                      ))}
                    </select>
                    {dossiers.length === 0 && !loadingClientDetails && (
                      <p className="mt-1 text-xs text-gray-500">
                        Ce client n&apos;a pas encore de dossier.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Nom complet *</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Téléphone</label>
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
            <label className="mb-1 block text-sm font-medium text-gray-700">Email *</label>
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
              2. Formulaires <span className="text-sm font-normal text-gray-500">({selectedForms.size} sélectionné{selectedForms.size > 1 ? 's' : ''})</span>
            </h2>
          </div>

          {formTypes.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun type de formulaire. <a href="/configuration/form-types" className="text-blue-600 hover:underline">En créer</a></p>
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
                <CategorySection title="Sans catégorie">
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

        {/* === DOCUMENTS === */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              3. Documents PDF <span className="text-sm font-normal text-gray-500">({selectedDocs.size} sélectionné{selectedDocs.size > 1 ? 's' : ''})</span>
            </h2>
          </div>

          {docTemplates.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun modèle de document. <a href="/documents/nouveau" className="text-blue-600 hover:underline">En uploader</a></p>
          ) : (
            <div className="space-y-4">
              {docCategories.map((cat) => {
                const items = docsByCategory.get(String(cat.id)) || [];
                if (items.length === 0) return null;
                return (
                  <CategorySection key={`dcat-${cat.id}`} title={cat.name} color={cat.color}>
                    {items.map((d) => (
                      <CheckItem
                        key={`d-${d.id}`}
                        checked={selectedDocs.has(d.id)}
                        onToggle={() => toggleDoc(d.id)}
                        title={d.name}
                        subtitle={d.description}
                      />
                    ))}
                  </CategorySection>
                );
              })}
              {/* Docs without category_id (legacy enum-only) */}
              {Array.from(docsByCategory.entries())
                .filter(([k]) => k.startsWith('enum:'))
                .map(([k, items]) => (
                  <CategorySection key={k} title={items[0].category_label ?? k.replace('enum:', '')}>
                    {items.map((d) => (
                      <CheckItem
                        key={`d-${d.id}`}
                        checked={selectedDocs.has(d.id)}
                        onToggle={() => toggleDoc(d.id)}
                        title={d.name}
                        subtitle={d.description}
                      />
                    ))}
                  </CategorySection>
                ))}
            </div>
          )}
        </div>

        {/* === MESSAGE / EXPIRATION === */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">4. Détails</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Message au client (optionnel)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Ex : Voici les formulaires nécessaires pour votre dossier de visa…"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Expiration (jours)</label>
              <input
                type="number"
                min={1}
                max={365}
                value={expiresDays}
                onChange={(e) => setExpiresDays(Number(e.target.value))}
                className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        {/* === ACTIONS === */}
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5">
          <div className="text-sm text-gray-700">
            <strong>{totalSelected}</strong> élément{totalSelected !== 1 ? 's' : ''} à envoyer
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || totalSelected === 0}
              className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Envoi…' : 'Envoyer l\'invitation'}
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
