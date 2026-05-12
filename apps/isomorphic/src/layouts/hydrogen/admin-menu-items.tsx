import { routes } from '@/config/routes';
import {
  PiFolderDuotone,
  PiCalendarDuotone,
  PiUsersDuotone,
  PiFolderUserDuotone,
  PiChartBarDuotone,
  PiGearDuotone,
  PiFileDuotone,
  PiBriefcaseDuotone,
  PiClipboardTextDuotone,
  PiHeadsetDuotone,
  PiUserGearDuotone,
  PiUserPlusDuotone,
  PiBellDuotone,
  PiFileTextDuotone,
  PiNewspaperDuotone,
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
    icon: <PiChartBarDuotone />,
  },
  {
    name: 'Statistiques',
    href: routes.analytics,
    icon: <PiChartBarDuotone />,
  },

  // label start
  {
    name: 'Gestion des Clients',
  },
  // label end
  {
    name: 'Clients',
    href: '/admin/clients',
    icon: <PiUsersDuotone />,
  },
  {
    name: 'Dossiers',
    href: '/admin/dossiers',
    icon: <PiFolderUserDuotone />,
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
    icon: <PiFileDuotone />,
  },

  // label start
  {
    name: 'Agenda & Rendez-vous',
  },
  // label end
  {
    name: 'Rendez-vous',
    href: '/admin/appointments',
    icon: <PiCalendarDuotone />,
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
    icon: <PiBriefcaseDuotone />,
  },
  {
    name: 'Types de visa',
    href: '/admin/visa-types',
    icon: <PiClipboardTextDuotone />,
  },

  // label start
  {
    name: 'Formulaires & Documents',
  },
  // label end
  {
    name: 'Envois',
    href: routes.invitations.list,
    icon: <PiFileTextDuotone />,
  },
  {
    name: 'Modèles documents',
    href: routes.configuration.documents,
    icon: <PiFileTextDuotone />,
  },
  {
    name: 'Configuration',
    href: '#',
    icon: <PiBriefcaseDuotone />,
    dropdownItems: [
      { name: 'Catégories', href: routes.configuration.categories },
      { name: 'Types de formulaires', href: routes.configuration.formTypes },
    ],
  },
  {
    name: 'Questionnaires (legacy)',
    href: routes.questionnaires.list,
    icon: <PiClipboardTextDuotone />,
  },

  // label start
  {
    name: 'Communication',
  },
  // label end
  {
    name: 'Messages',
    href: '/admin/messages',
    icon: <PiHeadsetDuotone />,
    badge: '',
  },
  {
    name: 'Notifications',
    href: '/admin/notifications',
    icon: <PiBellDuotone />,
  },
  {
    name: 'Nouvelles',
    href: '/podcast',
    icon: <PiNewspaperDuotone />,
    dropdownItems: [
      { name: 'Tableau de bord', href: '/podcast' },
      { name: 'Articles', href: '/admin/news/articles' },
    ],
  },

  // label start
  {
    name: 'Administration',
  },
  // label end
  {
    name: 'Utilisateurs',
    href: '/admin/users',
    icon: <PiUserGearDuotone />,
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
    icon: <PiGearDuotone />,
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


