'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PiSealCheckDuotone, PiPaperPlaneTiltDuotone, PiXBold } from 'react-icons/pi';
import { mandateService, MandateItem, MANDATE_STATUS } from '@/services/booking';

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString('fr-CA', { dateStyle: 'medium', timeStyle: 'short' }) : '');

/** Mandats de représentation du client : envoi pour signature en ligne et preuve de signature. */
export default function MandatesCard({ clientId, hasEmail, dossiers }: { clientId: number; hasEmail: boolean; dossiers: { id: number; name: string }[] }) {
  const [items, setItems] = useState<MandateItem[] | null>(null);
  const [composer, setComposer] = useState<{ dossierId: number | null; body: string | null } | null>(null);
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState<number | null>(null);

  const load = () => mandateService.list(clientId).then(setItems).catch(() => setItems([]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [clientId]);

  const startCompose = async (dossierId: number | null) => {
    setComposer({ dossierId, body: null });
    try {
      const p = await mandateService.preview(clientId, dossierId);
      setComposer({ dossierId, body: p.body });
    } catch (e: any) {
      toast.error(e.message);
      setComposer(null);
    }
  };

  const send = async () => {
    if (!composer) return;
    setSending(true);
    try {
      toast.success(await mandateService.send(clientId, composer.dossierId));
      setComposer(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  const voidMandate = async (m: MandateItem) => {
    if (!window.confirm('Annuler ce mandat ? Le lien de signature ne fonctionnera plus.')) return;
    try {
      await mandateService.void(m.id);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PiSealCheckDuotone className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Mandats de représentation</h2>
        </div>
        {!composer && hasEmail && (
          <button onClick={() => startCompose(null)} className="text-xs font-medium text-blue-700 hover:underline">+ Envoyer un mandat</button>
        )}
      </div>

      {!hasEmail && <p className="mb-3 text-xs text-amber-700">Ajoutez un courriel au client pour lui envoyer un mandat.</p>}

      {composer && (
        <div className="mb-4 space-y-3 rounded-lg border border-blue-200 bg-blue-50/40 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-800">Aperçu du mandat</p>
            <button onClick={() => setComposer(null)} aria-label="Fermer" className="text-gray-400 hover:text-gray-700"><PiXBold className="h-4 w-4" /></button>
          </div>
          {dossiers.length > 0 && (
            <label className="block text-sm text-gray-700">Dossier concerné
              <select value={composer.dossierId ?? ''} onChange={(e) => startCompose(e.target.value ? Number(e.target.value) : null)}
                className="ml-2 rounded-lg border border-gray-300 px-2 py-1 text-sm">
                <option value="">Aucun en particulier</option>
                {dossiers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </label>
          )}
          <div className="max-h-56 overflow-y-auto whitespace-pre-line rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-700">
            {composer.body ?? 'Chargement…'}
          </div>
          <p className="text-xs text-gray-500">Le texte se modifie dans Rendez-vous › Page publique et mandat.</p>
          <button onClick={send} disabled={sending || !composer.body} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            <PiPaperPlaneTiltDuotone className="h-4 w-4" /> {sending ? 'Envoi…' : 'Envoyer pour signature'}
          </button>
        </div>
      )}

      {items === null ? (
        <p className="py-4 text-center text-sm text-gray-400">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-400">Aucun mandat envoyé.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((m) => {
            const st = MANDATE_STATUS[m.status];
            return (
              <li key={m.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button onClick={() => setOpen(open === m.id ? null : m.id)} className="text-left font-medium text-gray-900 hover:text-blue-700">
                    {m.title}{m.dossier ? ` — ${m.dossier}` : ''}
                  </button>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.className}`}>{st.label}</span>
                </div>
                <p className="mt-0.5 text-xs text-gray-500">
                  Envoyé le {fmt(m.sent_at)}{m.signed_at ? ` · signé le ${fmt(m.signed_at)} par ${m.signed_name}` : ''}
                </p>
                {open === m.id && (
                  <div className="mt-2 space-y-2">
                    <div className="max-h-56 overflow-y-auto whitespace-pre-line rounded border border-gray-200 bg-white p-2 text-xs text-gray-700">{m.body}</div>
                    {m.status === 'signed' && (
                      <dl className="space-y-0.5 text-xs text-gray-600">
                        <div>Adresse IP : {m.signed_ip}</div>
                        <div className="break-all">Navigateur : {m.signed_user_agent}</div>
                        <div className="break-all">Empreinte SHA-256 : {m.body_hash}</div>
                      </dl>
                    )}
                    <div className="flex gap-3 text-xs">
                      <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">Ouvrir la page de signature</a>
                      {m.status === 'sent' && <button onClick={() => voidMandate(m)} className="text-red-700 hover:underline">Annuler le mandat</button>}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
