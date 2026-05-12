'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { documentService, DocumentRequest } from '@/services/documents';

const statusConfig: Record<string, { label: string; classes: string }> = {
  pending:    { label: 'En attente',  classes: 'bg-gray-100 text-gray-700' },
  in_progress:{ label: 'En cours',   classes: 'bg-blue-100 text-blue-700' },
  submitted:  { label: 'Soumis',     classes: 'bg-orange-100 text-orange-700' },
  validated:  { label: 'Validé',     classes: 'bg-green-100 text-green-700' },
  rejected:   { label: 'Rejeté',     classes: 'bg-red-100 text-red-700' },
};

export default function DemandesDocumentsPage() {
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    documentService.getRequests()
      .then(setRequests)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all'
    ? requests
    : requests.filter((r) => r.status === filter);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents envoyés</h1>
          <p className="mt-1 text-sm text-gray-500">
            Suivez les documents envoyés aux clients pour remplissage.
          </p>
        </div>
        <Link
          href="/documents"
          className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"
        >
          Gérer les modèles
        </Link>
      </div>

      {/* Filtres */}
      <div className="mb-4 flex gap-2 flex-wrap">
        {[
          { value: 'all', label: 'Tous' },
          { value: 'pending', label: 'En attente' },
          { value: 'in_progress', label: 'En cours' },
          { value: 'submitted', label: 'Soumis' },
          { value: 'validated', label: 'Validés' },
          { value: 'rejected', label: 'Rejetés' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition ${
              filter === f.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
            {f.value !== 'all' && (
              <span className="ml-1 text-xs opacity-70">
                ({requests.filter((r) => r.status === f.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-gray-400">Chargement…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <p className="text-gray-500">Aucun document trouvé</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Client', 'Document', 'Dossier', 'Statut', 'Envoyé le', 'Expire le', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((r) => {
                const sc = statusConfig[r.status] ?? statusConfig.pending;
                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{r.client_name}</div>
                      <div className="text-xs text-gray-400">{r.client_email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{r.template_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{r.dossier_name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium ${sc.classes}`}>
                          {sc.label}
                        </span>
                        {r.is_expired && r.status === 'pending' && (
                          <span className="text-xs text-red-500">⚠ Expiré</span>
                        )}
                        {!r.email_sent && (
                          <span className="text-xs text-orange-500">✗ Email non envoyé</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{r.sent_at}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{r.expires_at}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/documents/demandes/${r.id}`}
                        className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                      >
                        Voir →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
