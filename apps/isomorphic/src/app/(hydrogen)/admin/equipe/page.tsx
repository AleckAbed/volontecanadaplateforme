'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  PiUsersThreeDuotone,
  PiPlusBold,
  PiXBold,
  PiPaperPlaneTiltDuotone,
  PiProhibitDuotone,
  PiArrowCounterClockwiseDuotone,
} from 'react-icons/pi';
import { useCurrentAdmin } from '@/hooks/use-current-admin';
import {
  teamService,
  TeamMember,
  TeamRole,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
} from '@/services/team';

const ROLES: TeamRole[] = ['owner', 'admin', 'advisor', 'assistant'];

const STATUS_STYLES: Record<TeamMember['status'], { label: string; className: string }> = {
  active: { label: 'Actif', className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
  invited: { label: 'Invitation envoyée', className: 'bg-amber-50 text-amber-800 ring-amber-600/20' },
  inactive: { label: 'Désactivé', className: 'bg-gray-100 text-gray-600 ring-gray-500/20' },
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function TeamPage() {
  const me = useCurrentAdmin();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [seatsUsed, setSeatsUsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const canAssignOwner = !!me?.permissions?.assign_owner;

  const load = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await teamService.list();
      setMembers(data.members);
      setSeatsUsed(data.seats_used);
    } catch (e: any) {
      setLoadError(e.message || 'Impossible de charger l’équipe.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const run = async (id: number, action: () => Promise<any>, success: string) => {
    try {
      setBusyId(id);
      const res = await action();
      toast.success(res?.message || success);
      await load();
    } catch (e: any) {
      toast.error(e.message || 'Action impossible.');
    } finally {
      setBusyId(null);
    }
  };

  const changeRole = (m: TeamMember, role: TeamRole) =>
    run(m.id, () => teamService.update(m.id, { role }), `${m.name} est maintenant ${ROLE_LABELS[role].toLowerCase()}.`);

  const toggleActive = (m: TeamMember) => {
    if (m.is_active && !confirm(`Désactiver le compte de ${m.name} ? Ses sessions en cours seront fermées.`)) return;
    run(m.id, () => teamService.update(m.id, { is_active: !m.is_active }), m.is_active ? 'Compte désactivé.' : 'Compte réactivé.');
  };

  const canEdit = (m: TeamMember) => !m.is_me && (canAssignOwner || m.role !== 'owner');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-4 sm:p-6 2xl:p-10">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
            <PiUsersThreeDuotone className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Équipe</h1>
            <p className="mt-1 max-w-xl text-sm text-gray-500">
              Les membres du personnel de {me?.cabinet?.name ?? 'votre cabinet'} et leur rôle.
              {' '}<strong className="text-gray-700">{seatsUsed} siège{seatsUsed > 1 ? 's' : ''} utilisé{seatsUsed > 1 ? 's' : ''}</strong>
              {' '}(comptes actifs).
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:shadow-xl active:scale-[0.98]"
        >
          <PiPlusBold className="h-4 w-4" />
          Inviter un membre
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />)}
        </div>
      ) : loadError ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {loadError}
          <button onClick={load} className="ml-3 font-semibold underline">Réessayer</button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Membre</th>
                <th className="px-4 py-3 font-semibold">Rôle</th>
                <th className="px-4 py-3 font-semibold">Statut</th>
                <th className="px-4 py-3 font-semibold">Dernière connexion</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((m) => {
                const status = STATUS_STYLES[m.status];
                const editable = canEdit(m);
                const busy = busyId === m.id;
                return (
                  <tr key={m.id} className={m.is_active ? '' : 'bg-gray-50/60'}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {m.name}{m.is_me && <span className="ml-2 text-xs font-normal text-gray-500">(vous)</span>}
                      </div>
                      <div className="text-xs text-gray-500">{m.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      {editable ? (
                        <select
                          aria-label={`Rôle de ${m.name}`}
                          value={m.role}
                          disabled={busy}
                          onChange={(e) => changeRole(m, e.target.value as TeamRole)}
                          className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                        >
                          {ROLES.filter((r) => canAssignOwner || r !== 'owner').map((r) => (
                            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-gray-700">{m.role_label}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${status.className}`}>
                        {status.label}
                      </span>
                      {m.status === 'invited' && m.invitation_expires_at && (
                        <div className="mt-0.5 text-xs text-gray-500">Lien valable jusqu’au {formatDate(m.invitation_expires_at)}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(m.last_login_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {m.status === 'invited' && (
                          <button
                            onClick={() => run(m.id, () => teamService.resendInvitation(m.id), 'Invitation renvoyée.')}
                            disabled={busy}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                          >
                            <PiPaperPlaneTiltDuotone className="h-4 w-4" /> Renvoyer
                          </button>
                        )}
                        {editable && (
                          <button
                            onClick={() => toggleActive(m)}
                            disabled={busy}
                            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium disabled:opacity-50 ${
                              m.is_active ? 'border-red-200 text-red-700 hover:bg-red-50' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            {m.is_active
                              ? <><PiProhibitDuotone className="h-4 w-4" /> Désactiver</>
                              : <><PiArrowCounterClockwiseDuotone className="h-4 w-4" /> Réactiver</>}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <RolesLegend />

      {showInvite && (
        <InviteModal
          canAssignOwner={canAssignOwner}
          onClose={() => setShowInvite(false)}
          onInvited={async () => { setShowInvite(false); await load(); }}
        />
      )}
    </div>
  );
}

function RolesLegend() {
  return (
    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {ROLES.map((r) => (
        <div key={r} className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-sm font-semibold text-gray-900">{ROLE_LABELS[r]}</div>
          <div className="mt-1 text-xs text-gray-600">{ROLE_DESCRIPTIONS[r]}</div>
        </div>
      ))}
    </div>
  );
}

function InviteModal({
  canAssignOwner,
  onClose,
  onInvited,
}: {
  canAssignOwner: boolean;
  onClose: () => void;
  onInvited: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamRole>('advisor');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setSubmitting(true);
      const res = await teamService.invite({ name: name.trim(), email: email.trim(), role });
      if (res.email_sent === false) toast.error(res.message);
      else toast.success(res.message || 'Invitation envoyée.');
      onInvited();
    } catch (err: any) {
      setError(err.message || 'L’invitation a échoué.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4" role="dialog" aria-modal="true" aria-labelledby="invite-title">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 id="invite-title" className="text-lg font-semibold text-gray-900">Inviter un membre</h2>
          <button onClick={onClose} aria-label="Fermer" className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
            <PiXBold className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4 px-6 py-5">
          <p className="text-sm text-gray-600">Le membre reçoit un courriel pour choisir son mot de passe. Le lien est valable 7 jours.</p>
          <div>
            <label htmlFor="invite-name" className="mb-1 block text-sm font-medium text-gray-700">Nom complet</label>
            <input id="invite-name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label htmlFor="invite-email" className="mb-1 block text-sm font-medium text-gray-700">Courriel</label>
            <input id="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <fieldset>
            <legend className="mb-1 block text-sm font-medium text-gray-700">Rôle</legend>
            <div className="space-y-2">
              {ROLES.filter((r) => canAssignOwner || r !== 'owner').map((r) => (
                <label key={r} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${role === r ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200'}`}>
                  <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} className="mt-1" />
                  <span>
                    <span className="block text-sm font-medium text-gray-900">{ROLE_LABELS[r]}</span>
                    <span className="block text-xs text-gray-600">{ROLE_DESCRIPTIONS[r]}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Annuler
            </button>
            <button type="submit" disabled={submitting}
              className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {submitting ? 'Envoi…' : 'Envoyer l’invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
