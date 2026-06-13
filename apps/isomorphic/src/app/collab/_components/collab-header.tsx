'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { collabWorkspaceService, Collaborator } from '@/services/collaborators';
import { removeAuthToken } from '@/lib/auth-storage';

export default function CollabHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<Collaborator | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await collabWorkspaceService.me();
        setMe(data);
        try { localStorage.setItem('collab_user', JSON.stringify(data)); } catch {}
      } catch {
        router.replace('/collab/login');
      }
    })();
  }, [router]);

  const handleLogout = async () => {
    try { await collabWorkspaceService.logout(); } catch {}
    try { localStorage.removeItem('collab_user'); } catch {}
    removeAuthToken();
    router.replace('/collab/login');
  };

  const showBackToDossiers = pathname && pathname !== '/collab/dossiers' && pathname.startsWith('/collab/');

  return (
    <header className="border-b border-gray-200 bg-white px-6 py-3">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/collab/dossiers')}
            className="text-sm font-semibold text-red-700 hover:text-red-800"
          >
            Volonté Canada — Espace collaborateur
          </button>
          {showBackToDossiers && (
            <button
              onClick={() => router.push('/collab/dossiers')}
              className="text-xs text-gray-500 hover:text-gray-800"
            >
              ← Mes dossiers
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {me && (
            <span className="text-sm text-gray-700">
              {me.first_name} {me.last_name}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="rounded-lg border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </header>
  );
}
