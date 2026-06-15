'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from 'recharts';
import MetricCard from '@core/components/cards/metric-card';
import { Text } from 'rizzui';
import {
  PiUsersThreeDuotone, PiFolderUserDuotone, PiPaperPlaneTiltDuotone,
  PiUserPlusDuotone, PiFileTextDuotone, PiCheckCircleDuotone,
} from 'react-icons/pi';
import { statisticsService, StatisticsOverview } from '@/services/statistics';

const STATUS_COLORS: Record<string, string> = {
  en_cours: '#3b82f6',
  soumis: '#f59e0b',
  accorde: '#10b981',
  refuse: '#ef4444',
  rejete: '#dc2626',
  annule: '#94a3b8',
};

const LOCATION_COLORS = ['#2563eb', '#f59e0b', '#94a3b8'];
const SERVICE_PALETTE = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#f97316', '#14b8a6', '#a855f7', '#84cc16'];

export default function CabinetDashboard() {
  const [data, setData] = useState<StatisticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statisticsService.overview()
      .then(setData)
      .catch((e: any) => toast.error(e.message || 'Erreur de chargement des statistiques'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-gradient-to-br from-gray-100 to-gray-50" />
        ))}
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="@container space-y-6">
      {/* === KPI cards === */}
      <div className="grid grid-cols-1 gap-5 @xl:grid-cols-2 @5xl:grid-cols-4">
        <KpiCard
          title="Clients"
          metric={data.kpis.clients.total.toString()}
          sub={`${data.kpis.clients.active} actifs`}
          icon={<PiUsersThreeDuotone className="h-5 w-5" />}
          color="#2563eb"
          spark={data.kpis.clients.spark}
        />
        <KpiCard
          title="Dossiers en cours"
          metric={data.kpis.dossiers.active.toString()}
          sub={`${data.kpis.dossiers.total} au total`}
          icon={<PiFolderUserDuotone className="h-5 w-5" />}
          color="#10b981"
          spark={data.kpis.dossiers.spark}
        />
        <KpiCard
          title="Invitations (30j)"
          metric={data.kpis.invitations.last_30_days.toString()}
          sub={`${data.kpis.invitations.completion_rate}% complétées`}
          icon={<PiPaperPlaneTiltDuotone className="h-5 w-5" />}
          color="#8b5cf6"
          spark={data.kpis.invitations.spark}
        />
        <KpiCard
          title="Collaborateurs actifs"
          metric={data.kpis.collaborators.active.toString()}
          sub={`${data.kpis.collaborators.total} au total`}
          icon={<PiUserPlusDuotone className="h-5 w-5" />}
          color="#ec4899"
          spark={data.kpis.collaborators.spark}
        />
      </div>

      {/* === Time series — 12 mois === */}
      <Card title="Évolution sur 12 mois" subtitle="Créations mensuelles de clients, dossiers et invitations">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.monthly} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
              cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" />
            <Line type="monotone" dataKey="clients" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} name="Clients" />
            <Line type="monotone" dataKey="dossiers" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} name="Dossiers" />
            <Line type="monotone" dataKey="invitations" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} name="Invitations" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* === Distribution dossiers === */}
      <div className="grid grid-cols-1 gap-5 @4xl:grid-cols-2">
        <Card title="Dossiers par statut" subtitle="Répartition de tous les dossiers">
          {data.dossiers_by_status.every((s) => s.count === 0) ? (
            <EmptyChart label="Aucun dossier" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data.dossiers_by_status.filter((d) => d.count > 0)}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  label={(e: any) => `${e.label}: ${e.count}`}
                  labelLine={false}
                >
                  {data.dossiers_by_status.filter((d) => d.count > 0).map((entry) => (
                    <Cell key={entry.key} fill={STATUS_COLORS[entry.key] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card title="Localisation des clients" subtitle="Sur le territoire canadien ou hors du Canada">
          {data.clients_by_location.every((s) => s.count === 0) ? (
            <EmptyChart label="Aucun client" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data.clients_by_location.filter((d) => d.count > 0)}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  label={(e: any) => `${e.label}: ${e.count}`}
                  labelLine={false}
                >
                  {data.clients_by_location.filter((d) => d.count > 0).map((entry, i) => (
                    <Cell key={entry.key} fill={LOCATION_COLORS[i % LOCATION_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* === Dossiers par service + charge collaborateurs === */}
      <div className="grid grid-cols-1 gap-5 @4xl:grid-cols-2">
        <Card title="Dossiers par service d'immigration" subtitle="Top 10 des services les plus représentés">
          {data.dossiers_by_service.length === 0 ? (
            <EmptyChart label="Aucun dossier avec service" />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(260, data.dossiers_by_service.length * 38)}>
              <BarChart data={data.dossiers_by_service} layout="vertical" margin={{ left: 10, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="service" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} width={140} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {data.dossiers_by_service.map((_, i) => (
                    <Cell key={i} fill={SERVICE_PALETTE[i % SERVICE_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card title="Charge des collaborateurs" subtitle="Top 5 par nombre de dossiers assignés">
          {data.collaborator_load.length === 0 ? (
            <EmptyChart label="Aucun collaborateur assigné" />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(260, data.collaborator_load.length * 50)}>
              <BarChart data={data.collaborator_load} layout="vertical" margin={{ left: 10, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} width={130} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="count" fill="#ec4899" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* === Statistiques secondaires === */}
      <div className="grid grid-cols-1 gap-5 @4xl:grid-cols-3">
        <MiniStat
          icon={<PiFileTextDuotone className="h-6 w-6" />}
          title="Modèles documents"
          value={data.kpis.templates.total}
          tone="indigo"
        />
        <MiniStat
          icon={<PiCheckCircleDuotone className="h-6 w-6" />}
          title="Documents IRCC remplis"
          value={data.kpis.documents.completed}
          sub={`${data.kpis.documents.in_progress} en cours`}
          tone="emerald"
        />
        <MiniStat
          icon={<PiPaperPlaneTiltDuotone className="h-6 w-6" />}
          title="Éléments envoyés"
          value={data.kpis.items.forms + data.kpis.items.documents}
          sub={`${data.kpis.items.forms} formulaires · ${data.kpis.items.documents} documents`}
          tone="purple"
        />
      </div>

      {/* === Activité récente === */}
      <div className="grid grid-cols-1 gap-5 @4xl:grid-cols-2">
        <Card title="Derniers dossiers" subtitle="10 plus récentes créations">
          {data.recent_dossiers.length === 0 ? (
            <EmptyChart label="Aucun dossier" />
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.recent_dossiers.map((d) => (
                <li key={d.id} className="flex items-center gap-3 py-2.5">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                    <PiFolderUserDuotone className="h-5 w-5" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <Link href={`/admin/dossiers/${d.id}`} className="block truncate text-sm font-medium text-gray-900 hover:text-blue-700">
                      {d.name}
                    </Link>
                    <div className="truncate text-xs text-gray-500">
                      {d.client_name}{d.service_name ? ` · ${d.service_name}` : ''}
                    </div>
                  </div>
                  <StatusPill status={d.status} />
                  <span className="text-xs text-gray-400">{d.created_at}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Dernières invitations" subtitle="10 plus récents envois">
          {data.recent_invitations.length === 0 ? (
            <EmptyChart label="Aucune invitation" />
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.recent_invitations.map((i) => (
                <li key={i.id} className="flex items-center gap-3 py-2.5">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
                    <PiPaperPlaneTiltDuotone className="h-5 w-5" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <Link href={`/envois/${i.id}`} className="block truncate text-sm font-medium text-gray-900 hover:text-blue-700">
                      {i.email}
                    </Link>
                    <div className="truncate text-xs text-gray-500">
                      {i.client_name}
                      {!i.email_sent && <span className="ml-1 text-red-500">· email échoué</span>}
                    </div>
                  </div>
                  <InvitationStatusPill status={i.status} />
                  <span className="text-xs text-gray-400">{i.sent_at}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function KpiCard({
  title, metric, sub, icon, color, spark,
}: {
  title: string; metric: string; sub: string;
  icon: React.ReactNode; color: string;
  spark: { day: string; count: number }[];
}) {
  return (
    <MetricCard
      title={title}
      metric={metric}
      rounded="lg"
      metricClassName="text-2xl mt-1"
      icon={<span style={{ color }} className="rounded-lg p-1.5" >{icon}</span>}
      info={<Text className="mt-2 text-xs text-gray-500">{sub}</Text>}
      chart={
        <div className="h-12 w-24">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={spark}>
              <Bar dataKey="count" fill={color} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      }
      chartClassName="flex flex-col w-auto h-auto"
      className="[&>div]:items-end"
    />
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-400">
      {label}
    </div>
  );
}

const TONE_STYLES = {
  indigo: { bg: 'from-indigo-500 to-blue-600', icon: 'bg-indigo-100 text-indigo-700' },
  emerald: { bg: 'from-emerald-500 to-teal-600', icon: 'bg-emerald-100 text-emerald-700' },
  purple: { bg: 'from-purple-500 to-fuchsia-600', icon: 'bg-purple-100 text-purple-700' },
} as const;

function MiniStat({
  icon, title, value, sub, tone,
}: { icon: React.ReactNode; title: string; value: number; sub?: string; tone: keyof typeof TONE_STYLES }) {
  const styles = TONE_STYLES[tone];
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${styles.icon}`}>
          {icon}
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</div>
          <div className="mt-0.5 text-2xl font-bold text-gray-900">{value}</div>
          {sub && <div className="text-xs text-gray-500">{sub}</div>}
        </div>
      </div>
    </div>
  );
}

const DOSSIER_STATUS_STYLES: Record<string, string> = {
  en_cours: 'bg-blue-100 text-blue-800',
  soumis: 'bg-amber-100 text-amber-800',
  accorde: 'bg-emerald-100 text-emerald-800',
  refuse: 'bg-red-100 text-red-700',
  rejete: 'bg-red-100 text-red-700',
  annule: 'bg-gray-100 text-gray-700',
};
const DOSSIER_STATUS_LABEL: Record<string, string> = {
  en_cours: 'En cours', soumis: 'Soumis', accorde: 'Accordé',
  refuse: 'Refusé', rejete: 'Rejeté', annule: 'Annulé',
};

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${DOSSIER_STATUS_STYLES[status] || 'bg-gray-100 text-gray-700'}`}>
      {DOSSIER_STATUS_LABEL[status] || status}
    </span>
  );
}

const INV_STATUS_STYLES: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-amber-100 text-amber-800',
  completed: 'bg-emerald-100 text-emerald-800',
  expired: 'bg-red-100 text-red-700',
};
const INV_STATUS_LABEL: Record<string, string> = {
  pending: 'En attente', sent: 'Envoyée', in_progress: 'En cours',
  completed: 'Complétée', expired: 'Expirée',
};

function InvitationStatusPill({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${INV_STATUS_STYLES[status] || 'bg-gray-100 text-gray-700'}`}>
      {INV_STATUS_LABEL[status] || status}
    </span>
  );
}
