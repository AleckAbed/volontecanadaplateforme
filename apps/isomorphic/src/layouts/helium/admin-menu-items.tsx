import { routes } from '@/config/routes';
import {
  PiFolder,
  PiCalendar,
  PiUsers,
  PiFolderUser,
  PiChartBar,
  PiGear,
  PiFile,
  PiBriefcase,
  PiClipboardText,
  PiHeadset,
  PiUserGear,
  PiUserPlus,
  PiBell,
  PiFileText,
} from 'react-icons/pi';

// Menu pour les Administrateurs du Cabinet d'Immigration
export const adminMenuItems = [
  // label start
  {
    name: 'Tableau de bord',
  },
  // label end
  {
    name: 'Dashboard',
    href: '/',
    icon: <PiChartBar />,
  },
  {
    name: 'Statistiques',
    href: routes.analytics,
    icon: <PiChartBar />,
  },

  // label start
  {
    name: 'Gestion des Clients',
  },
  // label end
  {
    name: 'Clients',
    href: '/admin/clients',
    icon: <PiUsers />,
    dropdownItems: [
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
    href: '/admin/dossiers',
    icon: <PiFolderUser />,
    dropdownItems: [
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
    href: '/admin/documents',
    icon: <PiFile />,
  },

  // label start
  {
    name: 'Agenda & Rendez-vous',
  },
  // label end
  {
    name: 'Rendez-vous',
    href: '/admin/appointments',
    icon: <PiCalendar />,
    dropdownItems: [
      {
        name: 'Calendrier',
        href: '/admin/appointments',
      },
      {
        name: 'Nouveau rendez-vous',
        href: '/admin/appointments/create',
      },
    ],
  },

  // label start
  {
    name: 'Services',
  },
  // label end
  {
    name: 'Services d\'immigration',
    href: '/services-immigration',
    icon: <PiBriefcase />,
  },
  {
    name: 'Types de visa',
    href: '/admin/visa-types',
    icon: <PiClipboardText />,
  },

  // label start
  {
    name: 'Formulaires',
  },
  // label end
  {
    name: 'Questionnaires',
    href: routes.questionnaires.list,
    icon: <PiFileText />,
  },

  // label start
  {
    name: 'Communication',
  },
  // label end
  {
    name: 'Messages',
    href: '/admin/messages',
    icon: <PiHeadset />,
    badge: '',
  },
  {
    name: 'Notifications',
    href: '/admin/notifications',
    icon: <PiBell />,
  },

  // label start
  {
    name: 'Administration',
  },
  // label end
  {
    name: 'Utilisateurs',
    href: '/admin/users',
    icon: <PiUserGear />,
    dropdownItems: [
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
    href: '/admin/settings',
    icon: <PiGear />,
    dropdownItems: [
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
];


