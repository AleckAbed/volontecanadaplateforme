import { routes } from '@/config/routes';
import {
  PiFolderDuotone,
  PiCalendarDuotone,
  PiUserDuotone,
  PiFileDuotone,
  PiChartBarDuotone,
  PiHeadsetDuotone,
  PiBriefcaseDuotone,
  PiClipboardTextDuotone,
  PiBellDuotone,
  PiHouseDuotone,
  PiCreditCardDuotone,
  PiCheckCircleDuotone,
} from 'react-icons/pi';

// Menu pour les Clients du Cabinet d'Immigration
export const clientMenuItems = [
  // label start
  {
    name: 'Mon Espace',
  },
  // label end
  {
    name: 'Tableau de bord',
    href: '/client/dashboard',
    icon: <PiHouseDuotone />,
  },

  // label start
  {
    name: 'Mon Dossier',
  },
  // label end
  {
    name: 'Mon dossier d\'immigration',
    href: '/client/dossier',
    icon: <PiFolderDuotone />,
    dropdownItems: [
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
    href: '/client/documents',
    icon: <PiFileDuotone />,
    dropdownItems: [
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

  // label start
  {
    name: 'Rendez-vous & Communication',
  },
  // label end
  {
    name: 'Rendez-vous',
    href: '/client/appointments',
    icon: <PiCalendarDuotone />,
    dropdownItems: [
      {
        name: 'Mes rendez-vous',
        href: '/client/appointments',
      },
      {
        name: 'Prendre rendez-vous',
        href: '/client/appointments/create',
      },
    ],
  },
  {
    name: 'Messages',
    href: '/client/messages',
    icon: <PiHeadsetDuotone />,
    badge: '',
  },
  {
    name: 'Notifications',
    href: '/client/notifications',
    icon: <PiBellDuotone />,
  },

  // label start
  {
    name: 'Services & Paiements',
  },
  // label end
  {
    name: 'Services',
    href: '/client/services',
    icon: <PiBriefcaseDuotone />,
    dropdownItems: [
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
    href: '/client/payments',
    icon: <PiCreditCardDuotone />,
    dropdownItems: [
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

  // label start
  {
    name: 'Mon Compte',
  },
  // label end
  {
    name: 'Mon profil',
    href: '/client/profile',
    icon: <PiUserDuotone />,
    dropdownItems: [
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
    href: '/client/support',
    icon: <PiCheckCircleDuotone />,
    dropdownItems: [
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
];


