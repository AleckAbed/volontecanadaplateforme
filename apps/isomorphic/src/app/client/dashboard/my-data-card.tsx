'use client';

import { useEffect, useState } from 'react';
import { PiDownloadSimpleBold, PiShieldCheckDuotone } from 'react-icons/pi';
import { clientDataService, MyDataRequest, DATA_REQUEST_STATUS, formatDay } from '@/services/compliance';

/** Droits du client sur ses renseignements (3.10) : copie de ses données, demande de suppression. */
export default function MyDataCard() {
  const [requests, setRequests] = useState<MyDataRequest[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [asking, setAsking] = useState(false);
  const [message, setMessage] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const load = () => clientDataService.requests().then(setRequests).catch(() => setRequests([]));
  useEffect(() => {
    load();
  }, []);

  const pending = requests.find((r) => r.status === 'pending');

  const download = async () => {
    setDownloading(true);
    setNotice(null);
    try {
      await clientDataService.download();
    } catch (e: any) {
      setNotice({ ok: false, text: e.message });
    } finally {
      setDownloading(false);
    }
  };

  const submit = async () => {
    setBusy(true);
    try {
      setNotice({ ok: true, text: await clientDataService.requestErasure(message) });
      setAsking(false);
      setMessage('');
      setConfirm(false);
      await load();
    } catch (e: any) {
      setNotice({ ok: false, text: e.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="my-data-title" className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 id="my-data-title" className="flex items-center gap-2 text-sm font-semibold text-gray-900">
        <PiShieldCheckDuotone className="h-5 w-5 text-blue-600" /> Mes données personnelles
      </h2>
      <p className="mt-1 text-sm text-gray-600">
        Téléchargez une copie de vos renseignements et des documents que vous avez transmis, ou demandez leur suppression.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={download} disabled={downloading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50">
          <PiDownloadSimpleBold className="h-4 w-4" /> {downloading ? 'Préparation…' : 'Télécharger mes données'}
        </button>
        {!pending && !asking && (
          <button onClick={() => { setAsking(true); setNotice(null); }}
            className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
            Demander la suppression
          </button>
        )}
      </div>

      {asking && (
        <div className="mt-3 space-y-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          <p>
            Le cabinet détruira vos dossiers, vos documents et vos formulaires, et fermera votre accès au portail. Il peut
            devoir garder certains éléments (par exemple vos factures) quand la loi l’y oblige ; il vous l’expliquera.
          </p>
          <label className="block">
            <span className="text-red-900">Précisions (facultatif)</span>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} maxLength={2000}
              className="mt-1 w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-gray-900" />
          </label>
          <label className="flex items-start gap-2">
            <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} className="mt-0.5" />
            <span>Je comprends que la suppression est définitive.</span>
          </label>
          <div className="flex gap-2">
            <button onClick={submit} disabled={!confirm || busy}
              className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50">
              {busy ? 'Envoi…' : 'Envoyer la demande'}
            </button>
            <button onClick={() => setAsking(false)} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700">Annuler</button>
          </div>
        </div>
      )}

      {notice && (
        <p role="status" className={`mt-3 rounded-lg px-3 py-2 text-sm ${notice.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>{notice.text}</p>
      )}

      {requests.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm">
          {requests.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-2 text-gray-700">
              Demande de suppression du {formatDay(r.created_at)}
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${DATA_REQUEST_STATUS[r.status].className}`}>
                {r.status === 'pending' ? 'En cours de traitement' : DATA_REQUEST_STATUS[r.status].label}
              </span>
              {r.response && <span className="w-full text-xs text-gray-600">Réponse du cabinet : {r.response}</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
