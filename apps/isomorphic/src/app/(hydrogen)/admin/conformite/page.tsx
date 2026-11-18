'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  PiShieldCheckDuotone,
  PiCheckCircleFill,
  PiWarningCircleFill,
  PiTrashDuotone,
  PiLockKeyDuotone,
} from 'react-icons/pi';
import {
  complianceService,
  ComplianceOverview,
  DataRequestItem,
  RetentionDossier,
  DATA_REQUEST_STATUS,
  formatDay,
} from '@/services/compliance';

const YEAR_CHOICES = [3, 5, 6, 7, 10, 15];

/** Conformité (gestionnaires) : conservation des dossiers, demandes des clients, registre, IA. */
export default function CompliancePage() {
  const [data, setData] = useState<ComplianceOverview | null>(null);
  const [years, setYears] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(
    () =>
      complianceService
        .overview()
        .then((d) => {
          setData(d);
          setYears(d.retention_years ? String(d.retention_years) : '');
        })
        .catch((e: any) => toast.error(e.message)),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  const saveRetention = async () => {
    setSaving(true);
    try {
      toast.success(await complianceService.setRetention(years ? Number(years) : null));
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleHold = async (d: RetentionDossier) => {
    try {
      toast.success(await complianceService.hold(d.id, !d.hold));
      await load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (!data) {
    return <div className="p-6 text-sm text-gray-500">Chargement…</div>;
  }

  const pending = data.requests.filter((r) => r.status === 'pending');
  const changed = (years ? Number(years) : null) !== data.retention_years;

  return (
    <div className="@container mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <header className="flex items-start gap-3">
        <PiShieldCheckDuotone className="mt-0.5 h-8 w-8 shrink-0 text-blue-600" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">Conformité et données</h1>
          <p className="text-sm text-gray-600">
            Durée de conservation des dossiers, demandes de vos clients sur leurs renseignements (Loi 25, LPRPDE) et
            registre des destructions.
          </p>
        </div>
      </header>

      {/* État général */}
      <section className="grid gap-3 sm:grid-cols-3">
        <Status ok={data.storage.documents_disk === 'objet'} title="Documents"
          okText="Stockage chiffré au Canada" koText="Disque local (développement)" />
        <Status ok={data.storage.backups} title="Sauvegardes" okText="Chiffrées, chaque nuit" koText="Non configurées" />
        <Status ok={!data.ai.enabled} title="Assistant IA"
          okText="Désactivé : aucune donnée envoyée"
          koText={`Activé${data.ai.enabled_by ? ` par ${data.ai.enabled_by}` : ''}${data.ai.enabled_at ? ` le ${formatDay(data.ai.enabled_at)}` : ''} (données traitées hors Canada)`}
          warn />
      </section>

      {/* Demandes des clients */}
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-gray-900">Demandes de suppression des clients</h2>
        <p className="mt-1 text-sm text-gray-600">
          Vos clients peuvent télécharger leurs données et demander leur suppression depuis leur portail. Répondez dans
          les 30 jours.
        </p>
        {data.requests.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">Aucune demande pour le moment.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {pending.map((r) => <PendingRequest key={r.id} r={r} onDone={load} />)}
            {data.requests.filter((r) => r.status !== 'pending').map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm">
                <span className="min-w-0">
                  <span className="font-medium text-gray-900">{r.client_name}</span>{' '}
                  <span className="text-gray-500">— demandée le {formatDay(r.created_at)}, traitée le {formatDay(r.handled_at)}{r.handled_by ? ` par ${r.handled_by}` : ''}</span>
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${DATA_REQUEST_STATUS[r.status].className}`}>{DATA_REQUEST_STATUS[r.status].label}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Conservation */}
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-gray-900">Conservation des dossiers fermés</h2>
        <p className="mt-1 text-sm text-gray-600">
          Un dossier est fermé quand son statut passe à Accordé, Refusé, Rejeté ou Annulé. À la fin de la durée choisie,
          le dossier, ses documents et ses formulaires sont détruits automatiquement, après un préavis de {data.notice_days} jours
          aux gestionnaires. Vérifiez la durée minimale qui s’applique à votre cabinet (code de déontologie du CICC,
          obligations fiscales) avant de la choisir.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-sm text-gray-700">
            Durée de conservation
            <select value={years} onChange={(e) => setYears(e.target.value)}
              className="mt-1 block rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">Sans limite (aucune destruction automatique)</option>
              {YEAR_CHOICES.map((y) => <option key={y} value={y}>{y} ans après la fermeture</option>)}
            </select>
          </label>
          <button onClick={saveRetention} disabled={saving || !changed}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">{data.closed_dossiers} dossier(s) fermé(s) dans le cabinet.</p>

        {data.retention_years && (
          <DossierTable title="À détruire dans les 90 prochains jours" empty="Aucun dossier à détruire prochainement."
            rows={data.upcoming} onToggle={toggleHold} />
        )}
        {data.held.length > 0 && (
          <DossierTable title="Conservés malgré la durée" empty="" rows={data.held} onToggle={toggleHold} />
        )}
      </section>

      {/* Registre */}
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-gray-900">Registre des destructions</h2>
        <p className="mt-1 text-sm text-gray-600">Preuve de ce qui a été détruit, quand et pourquoi. Aucun renseignement personnel n’y est gardé.</p>
        {data.log.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">Aucune destruction enregistrée.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-xs uppercase text-gray-500">
                <tr><th className="py-2 pr-3">Date</th><th className="py-2 pr-3">Élément</th><th className="py-2 pr-3">Motif</th><th className="py-2 pr-3">Fichiers</th><th className="py-2">Par</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.log.map((l) => (
                  <tr key={l.id}>
                    <td className="whitespace-nowrap py-2 pr-3 text-gray-600">{formatDay(l.created_at)}</td>
                    <td className="py-2 pr-3 text-gray-900">{l.label}</td>
                    <td className="py-2 pr-3 text-gray-700">{l.reason}</td>
                    <td className="py-2 pr-3 tabular-nums text-gray-700">{l.files_deleted}</td>
                    <td className="py-2 text-gray-700">{l.performed_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Status({ ok, title, okText, koText, warn }: { ok: boolean; title: string; okText: string; koText: string; warn?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${ok ? 'border-emerald-200 bg-emerald-50' : warn ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-gray-50'}`}>
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
        {ok ? <PiCheckCircleFill className="h-5 w-5 text-emerald-600" /> : <PiWarningCircleFill className={`h-5 w-5 ${warn ? 'text-amber-600' : 'text-gray-400'}`} />}
        {title}
      </div>
      <p className="mt-1 text-sm text-gray-700">{ok ? okText : koText}</p>
    </div>
  );
}

function DossierTable({ title, empty, rows, onToggle }: { title: string; empty: string; rows: RetentionDossier[]; onToggle: (d: RetentionDossier) => void }) {
  return (
    <div className="mt-5">
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">{empty}</p>
      ) : (
        <ul className="mt-2 divide-y divide-gray-100 rounded-lg border border-gray-100">
          {rows.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
              <span className="min-w-0">
                <Link href={`/admin/dossiers/${d.id}`} className="font-medium text-blue-700 hover:underline">{d.name}</Link>
                <span className="text-gray-600"> — {d.client ?? 'Client'} · fermé le {formatDay(d.closed_at)}</span>
                {d.destroy_on && !d.hold && <span className="text-red-700"> · destruction le {formatDay(d.destroy_on)}</span>}
              </span>
              <button onClick={() => onToggle(d)}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">
                <PiLockKeyDuotone className="h-4 w-4" /> {d.hold ? 'Ne plus conserver' : 'Conserver'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PendingRequest({ r, onDone }: { r: DataRequestItem; onDone: () => void }) {
  const [mode, setMode] = useState<'idle' | 'complete' | 'reject'>('idle');
  const [response, setResponse] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      toast.success(mode === 'complete' ? await complianceService.complete(r.id, response) : await complianceService.reject(r.id, response));
      setMode('idle');
      onDone();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-gray-900">
            {r.client_id ? <Link href={`/admin/clients/${r.client_id}`} className="hover:underline">{r.client_name}</Link> : r.client_name}{' '}
            <span className="font-normal text-gray-600">({r.client_email})</span>
          </p>
          <p className="text-gray-600">Demandée le {formatDay(r.created_at)}</p>
          {r.message && <p className="mt-1 whitespace-pre-line text-gray-800">« {r.message} »</p>}
        </div>
        {mode === 'idle' && (
          <div className="flex gap-2">
            <button onClick={() => setMode('complete')} className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700">
              <PiTrashDuotone className="h-4 w-4" /> Supprimer les données
            </button>
            <button onClick={() => setMode('reject')} className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
              Refuser
            </button>
          </div>
        )}
      </div>

      {mode !== 'idle' && (
        <div className="mt-3 space-y-2">
          {mode === 'complete' ? (
            <p className="rounded-md bg-white p-2 text-red-800">
              Les dossiers, documents, formulaires, rendez-vous et mandats de ce client seront <strong>détruits définitivement</strong>.
              S’il a des factures, son nom et son courriel restent avec elles (obligation fiscale).
            </p>
          ) : (
            <p className="text-gray-700">Expliquez au client pourquoi vous devez conserver ses données (obligation légale, dossier en cours…).</p>
          )}
          <label className="block">
            <span className="sr-only">Message au client</span>
            <textarea value={response} onChange={(e) => setResponse(e.target.value)} rows={3}
              placeholder={mode === 'complete' ? 'Message au client (facultatif)' : 'Motif du refus (obligatoire)'}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </label>
          <div className="flex gap-2">
            <button onClick={submit} disabled={busy || (mode === 'reject' && response.trim().length < 10)}
              className={`rounded-lg px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 ${mode === 'complete' ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-800 hover:bg-gray-900'}`}>
              {busy ? 'Traitement…' : mode === 'complete' ? 'Confirmer la suppression définitive' : 'Envoyer le refus'}
            </button>
            <button onClick={() => setMode('idle')} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs text-gray-700">Annuler</button>
          </div>
        </div>
      )}
    </li>
  );
}
