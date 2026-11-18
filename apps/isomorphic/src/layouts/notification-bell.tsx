'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PiBellSimpleRingingFill, PiChecksBold } from 'react-icons/pi';
import { notificationsService, NotificationItem } from '@/services/actions';
import Link from 'next/link';

const POLL_MS = 60_000;

function timeAgo(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'à l’instant';
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  return `il y a ${days} j`;
}

/**
 * Cloche de notifications du personnel : envois terminés, documents
 * téléversés, questionnaires soumis, rappels d'échéances.
 */
export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const data = await notificationsService.list();
      setItems(data.items);
      setUnread(data.unread);
    } catch {
      // Session expirée ou réseau : la cloche reste silencieuse, la page gère la session.
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const openItem = async (n: NotificationItem) => {
    setOpen(false);
    if (!n.read) {
      setItems((list) => list.map((i) => (i.id === n.id ? { ...i, read: true } : i)));
      setUnread((u) => Math.max(0, u - 1));
      notificationsService.markRead(n.id).catch(() => {});
    }
    if (n.link) router.push(n.link);
  };

  const markAll = async () => {
    await notificationsService.markAllRead().catch(() => {});
    setItems((list) => list.map((i) => ({ ...i, read: true })));
    setUnread(0);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); if (!open) load(); }}
        aria-label={unread > 0 ? `Notifications, ${unread} non lue${unread > 1 ? 's' : ''}` : 'Notifications'}
        aria-expanded={open}
        className="relative flex h-[34px] w-[34px] items-center justify-center rounded-full shadow backdrop-blur-md dark:bg-gray-100 md:h-9 md:w-9 3xl:h-10 3xl:w-10"
      >
        <PiBellSimpleRingingFill className="h-[18px] w-auto 3xl:h-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:bg-gray-100">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <span className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-900">Notifications</span>
              <Link href="/admin/notifications" onClick={() => setOpen(false)} className="text-xs text-gray-500 hover:text-gray-800 hover:underline">Préférences</Link>
            </span>
            {unread > 0 && (
              <button onClick={markAll} className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline">
                <PiChecksBold className="h-3.5 w-3.5" /> Tout marquer comme lu
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-500">Aucune notification pour le moment.</p>
          ) : (
            <ul className="max-h-[60vh] divide-y divide-gray-100 overflow-y-auto">
              {items.map((n) => (
                <li key={n.id}>
                  <button type="button" onClick={() => openItem(n)}
                    className={`flex w-full gap-3 px-4 py-3 text-left hover:bg-gray-50 ${n.read ? '' : 'bg-blue-50/50'}`}>
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-blue-600'}`} aria-hidden />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-gray-900">{n.title}</span>
                      {n.body && <span className="block truncate text-xs text-gray-600">{n.body}</span>}
                      <span className="mt-0.5 block text-[11px] text-gray-500">{timeAgo(n.created_at)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
