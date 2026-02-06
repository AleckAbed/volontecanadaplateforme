import { routes } from '@/config/routes';

export type SubMenuItemType = {
  name: string;
  href: string;
};

export type DropdownItemType = {
  name: string;
  icon: string;
  description?: string;
  href?: string;
  subMenuItems?: SubMenuItemType[];
};

export type LithiumMenuItem = {
  [key: string]: {
    name: string;
    type: string;
    dropdownItems: DropdownItemType[];
  };
};

// Menu pour les Administrateurs du Cabinet d'Immigration
export const lithiumAdminMenuItems: LithiumMenuItem = {
  dashboard: {
    name: 'Tableau de bord',
    type: 'link',
    dropdownItems: [
      {
        name: 'Dashboard',
        href: '/',
        icon: 'AnalyticsCircularIcon',
      },
      {
        name: 'Statistiques',
        href: routes.analytics,
        icon: 'BarChartIcon',
      },
    ],
  },
  clients: {
    name: 'Gestion des Clients',
    type: 'enhance',
    dropdownItems: [
      {
        name: 'Clients',
        icon: 'UserSettingsIcon',
        description: 'Gérer les clients du cabinet',
        subMenuItems: [
          {
            name: 'Liste des clients',
            href: '/admin/clients',
          },
          {
            name: 'Ajouter un client',
            href: '/admin/clients/create',
          },
        ],
      },
      {
        name: 'Dossiers',
        icon: 'FolderIcon',
        description: 'Dossiers d\'immigration',
        subMenuItems: [
          {
            name: 'Tous les dossiers',
            href: '/admin/dossiers',
          },
          {
            name: 'En cours',
            href: '/admin/dossiers/en-cours',
          },
          {
            name: 'Terminés',
            href: '/admin/dossiers/termines',
          },
          {
            name: 'Créer un dossier',
            href: '/admin/dossiers/create',
          },
        ],
      },
      {
        name: 'Documents',
        icon: 'DocumentIcon',
        description: 'Gestion des documents',
        href: '/admin/documents',
      },
    ],
  },
  agenda: {
    name: 'Agenda & Rendez-vous',
    type: 'link',
    dropdownItems: [
      {
        name: 'Calendrier',
        href: '/admin/appointments',
        icon: 'ScheduleIcon',
      },
      {
        name: 'Nouveau rendez-vous',
        href: '/admin/appointments/create',
        icon: 'CalendarPlusIcon',
      },
    ],
  },
  services: {
    name: 'Services',
    type: 'link',
    dropdownItems: [
      {
        name: 'Services d\'immigration',
        icon: 'SuitcaseIcon',
        href: '/services-immigration',
      },
      {
        name: 'Types de visa',
        icon: 'DocumentIcon',
        href: '/admin/visa-types',
      },
    ],
  },
  communication: {
    name: 'Communication',
    type: 'link',
    dropdownItems: [
      {
        name: 'Messages',
        href: '/admin/messages',
        icon: 'WalkmanIcon',
      },
      {
        name: 'Notifications',
        href: '/admin/notifications',
        icon: 'NotificationIcon',
      },
    ],
  },
  administration: {
    name: 'Administration',
    type: 'enhance',
    dropdownItems: [
      {
        name: 'Utilisateurs',
        icon: 'UserSettingsIcon',
        description: 'Gérer les administrateurs',
        subMenuItems: [
          {
            name: 'Administrateurs',
            href: '/admin/users/admins',
          },
          {
            name: 'Ajouter un admin',
            href: '/admin/users/admins/create',
          },
        ],
      },
      {
        name: 'Paramètres',
        icon: 'SettingsIcon',
        description: 'Configuration du système',
        subMenuItems: [
          {
            name: 'Général',
            href: '/admin/settings/general',
          },
          {
            name: 'Mon profil',
            href: routes.forms.profileSettings,
          },
          {
            name: 'Sécurité',
            href: '/admin/settings/security',
          },
        ],
      },
    ],
  },
};


