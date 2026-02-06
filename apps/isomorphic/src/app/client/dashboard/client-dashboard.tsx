'use client';

/**
 * Dashboard Client - Cabinet d'Immigration
 */
export default function ClientDashboard() {
  return (
    <div className="@container">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenue dans votre espace client
        </h1>
        <p className="mt-2 text-gray-600">
          Suivez l&apos;avancement de votre dossier d&apos;immigration et gérez vos documents.
        </p>
      </div>

      {/* Grid de statistiques rapides */}
      <div className="grid gap-5 @xl:grid-cols-2 @3xl:grid-cols-3 @5xl:grid-cols-4 mb-6">
        <StatCard
          title="Statut du dossier"
          value="En cours"
          icon="📁"
          color="yellow"
        />
        <StatCard
          title="Documents envoyés"
          value="5/10"
          icon="📄"
          color="blue"
        />
        <StatCard
          title="Rendez-vous"
          value="2"
          icon="📅"
          color="green"
        />
        <StatCard
          title="Messages"
          value="3"
          icon="💬"
          color="purple"
        />
      </div>

      {/* Contenu principal */}
      <div className="grid gap-6 @container @xl:grid-cols-2">
        {/* Statut du dossier */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">
            État de votre dossier
          </h2>
          <div className="space-y-3">
            <StatusItem status="completed" label="Soumission initiale" />
            <StatusItem status="completed" label="Vérification des documents" />
            <StatusItem status="in-progress" label="Traitement en cours" />
            <StatusItem status="pending" label="Décision finale" />
          </div>
        </div>

        {/* Prochains rendez-vous */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">
            Prochains rendez-vous
          </h2>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Aucun rendez-vous planifié pour le moment.
            </p>
            <button className="mt-4 rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700">
              Prendre rendez-vous
            </button>
          </div>
        </div>
      </div>

      {/* Messages récents */}
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">
          Messages récents
        </h2>
        <p className="text-sm text-gray-600">
          Aucun nouveau message.
        </p>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: {
  title: string;
  value: string;
  icon: string;
  color: 'yellow' | 'blue' | 'green' | 'purple';
}) {
  const colorClasses = {
    yellow: 'bg-yellow-50 text-yellow-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className={`rounded-lg p-3 text-2xl ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function StatusItem({ status, label }: {
  status: 'completed' | 'in-progress' | 'pending';
  label: string;
}) {
  const statusConfig = {
    completed: {
      icon: '✓',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    'in-progress': {
      icon: '⟳',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    pending: {
      icon: '○',
      color: 'text-gray-400',
      bgColor: 'bg-gray-100',
    },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-3">
      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${config.bgColor} ${config.color}`}>
        {config.icon}
      </div>
      <span className="text-sm text-gray-700">{label}</span>
    </div>
  );
}

