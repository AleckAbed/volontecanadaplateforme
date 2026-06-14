'use client';

import { useEffect, useState, use } from 'react';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import { collabWorkspaceService } from '@/services/collaborators';
import CollabHeader from '../../../_components/collab-header';

const XfaPdfViewer = dynamic(() => import('@/components/XfaPdfViewer'), { ssr: false });

type Item = Awaited<ReturnType<typeof collabWorkspaceService.getInvitationItem>>;

export default function CollabItemViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const itemId = Number(id);
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfPromise, setPdfPromise] = useState<Promise<ArrayBuffer> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await collabWorkspaceService.getInvitationItem(itemId);
        setItem(data);
        // Si c'est un document avec PDF rempli, on charge le PDF en lecture seule
        if (data.kind === 'document' && data.has_filled_pdf) {
          const url = collabWorkspaceService.getInvitationItemPdfUrl(
            data.dossier_id, data.invitation_id, data.id
          );
          const promise = fetch(url, { credentials: 'include' }).then((r) => {
            if (!r.ok) throw new Error('PDF indisponible');
            return r.arrayBuffer();
          });
          setPdfPromise(promise);
        }
      } catch (e: any) {
        toast.error(e.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    })();
  }, [itemId]);

  if (loading) return (<><CollabHeader /><div className="p-10 text-center text-gray-400">Chargement…</div></>);
  if (!item) return (<><CollabHeader /><div className="p-10 text-center text-red-500">Élément introuvable</div></>);

  const title = item.form_type?.name ?? item.document_template?.name ?? 'Élément';

  return (
    <>
      <CollabHeader />
      <main className="mx-auto max-w-5xl p-6">
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              item.kind === 'form' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
            }`}>
              {item.kind === 'form' ? 'Formulaire' : 'Document'}
            </span>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              🔒 Lecture seule
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              item.status === 'completed' ? 'bg-green-100 text-green-700' :
              item.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {item.status === 'completed' ? '✓ Complété' : item.status === 'in_progress' ? '◐ En cours' : '○ À faire'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {item.client_name && (
            <p className="mt-1 text-sm text-gray-500">
              Rempli par : <strong>{item.client_name}</strong>
            </p>
          )}
          {item.last_saved_at && (
            <p className="mt-0.5 text-xs text-gray-400">Dernière sauvegarde : {item.last_saved_at}</p>
          )}
        </div>

        {item.kind === 'document' ? (
          item.has_filled_pdf && pdfPromise ? (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="h-[80vh]">
                <XfaPdfViewer
                  filePromise={pdfPromise}
                  fileName={`${title}.pdf`}
                  readOnly={true}
                  initialFormData={item.form_data || undefined}
                />
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-amber-50 p-6 text-center text-sm text-amber-800">
              Le client n&apos;a pas encore rempli ce document.
            </div>
          )
        ) : (
          <FormResponsesView formData={item.form_data} />
        )}
      </main>
    </>
  );
}

function FormResponsesView({ formData }: { formData: any }) {
  if (!formData || (typeof formData === 'object' && Object.keys(formData).length === 0)) {
    return (
      <div className="rounded-xl bg-amber-50 p-6 text-center text-sm text-amber-800">
        Le client n&apos;a pas encore rempli ce formulaire.
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <FormGroup value={formData} title={null} level={0} />
    </div>
  );
}

function FormGroup({
  value, title, level,
}: { value: any; title: string | null; level: number }) {
  if (value === null || value === undefined) return null;

  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    return (
      <div className="mb-5">
        {title && (
          <h2 className="mb-3 border-b border-gray-200 pb-1.5 text-sm font-bold uppercase tracking-wide text-gray-600">
            {title}
          </h2>
        )}
        <div className="space-y-3">
          {value.map((v, i) => (
            <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="mb-2 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                Élément #{i + 1}
              </div>
              {typeof v === 'object' && v !== null && !Array.isArray(v) ? (
                <FormFieldsGrid entries={Object.entries(v)} />
              ) : (
                <FieldDisplay label={`Valeur #${i + 1}`} value={v} />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (typeof value !== 'object') {
    return (
      <div className="mb-3">
        <FieldDisplay label={title ?? '—'} value={value} />
      </div>
    );
  }

  const entries = Object.entries(value).filter(
    ([, v]) => v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0),
  );
  if (entries.length === 0) return null;

  const scalarEntries: Array<[string, any]> = [];
  const nestedEntries: Array<[string, any]> = [];
  entries.forEach(([k, v]) => {
    if (v !== null && typeof v === 'object') nestedEntries.push([k, v]);
    else scalarEntries.push([k, v]);
  });

  return (
    <>
      {(title || scalarEntries.length > 0) && (
        <div className="mb-5">
          {title && (
            <h2 className="mb-3 border-b border-gray-200 pb-1.5 text-sm font-bold uppercase tracking-wide text-gray-600">
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

function FormFieldsGrid({ entries }: { entries: Array<[string, any]> }) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
      {entries.map(([k, v]) => (
        <FieldDisplay key={k} label={humanize(k)} value={v} />
      ))}
    </div>
  );
}

function FieldDisplay({ label, value }: { label: string; value: any }) {
  const isLong = typeof value === 'string' && value.length > 60;
  const isBool = typeof value === 'boolean';

  return (
    <div className={isLong ? 'md:col-span-2' : ''}>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </label>
      {isBool ? (
        <div className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
          value ? 'border-green-200 bg-green-50 text-green-800' : 'border-gray-200 bg-gray-50 text-gray-600'
        }`}>
          {value ? 'Oui' : 'Non'}
        </div>
      ) : isLong ? (
        <div className="min-h-[5rem] whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900">
          {String(value)}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900">
          {value === '' || value == null ? <span className="text-gray-400">—</span> : String(value)}
        </div>
      )}
    </div>
  );
}

function humanize(key: string): string {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^\w/, (c) => c.toUpperCase());
}
