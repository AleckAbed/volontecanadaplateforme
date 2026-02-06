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

// Menu pour les Clients du Cabinet d'Immigration
export const lithiumClientMenuItems: LithiumMenuItem = {
  dashboard: {
    name: 'Mon Espace',
    type: 'link',
    dropdownItems: [
      {
        name: 'Tableau de bord',
        href: '/client/dashboard',
        icon: 'DashboardIcon',
      },
    ],
  },
  dossier: {
    name: 'Mon Dossier',
    type: 'enhance',
    dropdownItems: [
      {
        name: 'Mon dossier d\'immigration',
        icon: 'FolderIcon',
        description: 'Suivre mon dossier',
        subMenuItems: [
          {
            name: 'Vue d\'ensemble',
            href: '/client/dossier',
          },
          {
            name: 'Statut',
            href: '/client/dossier/status',
          },
          {
            name: 'Historique',
            href: '/client/dossier/history',
          },
        ],
      },
      {
        name: 'Documents',
        icon: 'DocumentIcon',
        description: 'Mes documents',
        subMenuItems: [
          {
            name: 'Mes documents',
            href: '/client/documents',
          },
          {
            name: 'Uploader un document',
            href: '/client/documents/upload',
          },
          {
            name: 'Documents requis',
            href: '/client/documents/required',
          },
        ],
      },
    ],
  },
  communication: {
    name: 'Rendez-vous & Communication',
    type: 'link',
    dropdownItems: [
      {
        name: 'Mes rendez-vous',
        href: '/client/appointments',
        icon: 'ScheduleIcon',
      },
      {
        name: 'Prendre rendez-vous',
        href: '/client/appointments/create',
        icon: 'CalendarPlusIcon',
      },
      {
        name: 'Messages',
        href: '/client/messages',
        icon: 'WalkmanIcon',
      },
      {
        name: 'Notifications',
        href: '/client/notifications',
        icon: 'NotificationIcon',
      },
    ],
  },
  services: {
    name: 'Services & Paiements',
    type: 'enhance',
    dropdownItems: [
      {
        name: 'Services',
        icon: 'SuitcaseIcon',
        description: 'Mes services',
        subMenuItems: [
          {
            name: 'Mes services',
            href: '/client/services',
          },
          {
            name: 'Services disponibles',
            href: '/client/services/available',
          },
        ],
      },
      {
        name: 'Paiements',
        icon: 'InvoiceIcon',
        description: 'Factures et paiements',
        subMenuItems: [
          {
            name: 'Mes paiements',
            href: '/client/payments',
          },
          {
            name: 'Factures',
            href: '/client/payments/invoices',
          },
        ],
      },
    ],
  },
  account: {
    name: 'Mon Compte',
    type: 'enhance',
    dropdownItems: [
      {
        name: 'Mon profil',
        icon: 'UserSettingsIcon',
        description: 'Gérer mon profil',
        subMenuItems: [
          {
            name: 'Informations personnelles',
            href: '/client/profile',
          },
          {
            name: 'Modifier mon profil',
            href: routes.forms.profileSettings,
          },
          {
            name: 'Sécurité',
            href: '/client/profile/security',
          },
        ],
      },
      {
        name: 'Aide & Support',
        icon: 'WalkmanIcon',
        description: 'Centre d\'aide',
        subMenuItems: [
          {
            name: 'Centre d\'aide',
            href: '/client/support',
          },
          {
            name: 'FAQ',
            href: '/client/support/faq',
          },
          {
            name: 'Contacter le support',
            href: '/client/support/contact',
          },
        ],
      },
    ],
  },
};


