'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PiBuildingOfficeDuotone } from 'react-icons/pi';
import { companyService } from '@/services/companies';

/** Employeurs du client (entreprises clientes du cabinet), actuels et anciens. */
export default function EmployersCard({ clientId }: { clientId: number }) {
  const [items, setItems] = useState<{ id: number; name: string; job_title: string | null; started_at: string | null; ended_at: string | null }[]>([]);
  useEffect(() => { companyService.forClient(clientId).then(setItems).catch(() => setItems([])); }, [clientId]);
  if (items.length === 0) return null;
  return (
    <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900"><PiBuildingOfficeDuotone className="h-5 w-5 text-blue-600" /> Employeur{items.length > 1 ? 's' : ''}</h2>
      <ul className="mt-2 space-y-1 text-sm">
        {items.map((c) => (
          <li key={`${c.id}-${c.started_at}`}>
            <Link href={`/admin/entreprises/${c.id}`} className="font-medium text-blue-700 hover:underline">{c.name}</Link>
            <span className="text-gray-600">{c.job_title ? ` · ${c.job_title}` : ''}{c.ended_at ? ` · jusqu’au ${c.ended_at}` : ' · employeur actuel'}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
