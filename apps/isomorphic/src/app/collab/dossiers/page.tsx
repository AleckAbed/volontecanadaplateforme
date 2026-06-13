'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { collabWorkspaceService, CollabDossierSummary } from '@/services/collaborators';
import CollabHeader from '../_components/collab-header';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  en_cours: { label: 'En cours', color: 'bg-blue-100 text-blue-800' },
  soumis: { label: 'Soumis', color: 'bg-amber-100 text-amber-800' },
  accorde: { label: 'Accordé', color: 'bg-green-100 text-green-800' },
  refuse: { label: 'Refusé', color: 'bg-red-100 text-red-700' },
  rejete: { label: 'Rejeté', color: 'bg-red-100 text-red-700' },
  annule: { label: 'Annulé', color: 'bg-gray-100 text-gray-700' },
};

export default function CollaboratorDossiersPage() {
  const router = useRouter();
  const [items, setItems] = useState<CollabDossierSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setItems(await collabWorkspaceService.listMyDossiers());
      } catch (e: any) {
        toast.error(e.message || 'Erreur');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <>
      <CollabHeader />
      <main className="mx-auto max-w-6xl p-6">
        <h1 className="mb-1 text-2xl font-bold text-gray-900">Mes dossiers</h1>
        <p className="mb-6 text-sm text-gray-500">
          Voici les dossiers sur lesquels vous avez été assigné. Cliquez pour ouvrir.
        </p>

        {loading ? (
          <div className="p-10 text-center text-gray-400">Chargement…</div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
            Aucun dossier ne vous est attribué pour le moment.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {items.map((d) => {
              const status = STATUS_LABELS[d.status] || { label: d.status, color: 'bg-gray-100 text-gray-700' };
              return (
                <button
                  key={d.id}
                  onClick={() => router.push(`/collab/dossiers/${d.id}`)}
                  className="rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-400 hover:shadow-md"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="flex-1 overflow-hidden">
                      <div className="truncate text-base font-semibold text-gray-900">{d.name}</div>
                      {d.client && (
                        <div className="mt-0.5 truncate text-xs text-gray-500">{d.client.name}</div>
                      )}
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  {d.service_name && (
                    <div className="mb-3 text-xs text-gray-500">{d.service_name}</div>
                  )}
                  <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-3 text-center">
                    <div>
                      <div className="text-[10px] uppercase text-gray-400">Docs de base</div>
                      <div className="mt-0.5 text-sm font-semibold text-gray-900">{d.docs_progress}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-gray-400">Invitations</div>
                      <div className="mt-0.5 text-sm font-semibold text-gray-900">{d.invitation_progress}</div>
                    </div>
                  </div>
                  {d.deadline_at && (
                    <div className="mt-3 text-xs text-gray-500">📅 Échéance : {d.deadline_at}</div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
