'use client';

import { useTranslation } from 'react-i18next';
import { routes } from '@/config/routes';
import {
  PiUsersDuotone,
  PiFolderUserDuotone,
  PiChartBarDuotone,
  PiGearDuotone,
  PiFileDuotone,
  PiBriefcaseDuotone,
  PiClipboardTextDuotone,
  PiFileTextDuotone,
  PiNewspaperDuotone,
} from 'react-icons/pi';

/**
 * Menu admin actif (Hydrogen layout).
 * Voir helium/admin-menu-items.tsx pour la liste des routes retirées.
 */
export function useAdminMenuItems() {
  const { t } = useTranslation();

  return [
    { name: t('menu.section_dashboard') },
    { name: t('menu.dashboard'), href: '/', icon: <PiChartBarDuotone /> },
    { name: t('menu.analytics'), href: routes.analytics, icon: <PiChartBarDuotone /> },

    { name: t('menu.section_clients') },
    { name: t('menu.clients'), href: '/admin/clients', icon: <PiUsersDuotone /> },
    { name: t('menu.dossiers'), href: '/admin/dossiers', icon: <PiFolderUserDuotone /> },
    { name: t('menu.documents'), href: '/file-manager', icon: <PiFileDuotone /> },

    { name: t('menu.section_services') },
    { name: t('menu.immigration_services'), href: '/services-immigration', icon: <PiBriefcaseDuotone /> },

    { name: t('menu.section_forms') },
    { name: t('menu.envois'), href: routes.invitations.list, icon: <PiFileTextDuotone /> },
    { name: t('menu.document_templates'), href: routes.configuration.documents, icon: <PiFileTextDuotone /> },
    {
      name: t('menu.configuration'),
      href: '#',
      icon: <PiBriefcaseDuotone />,
      dropdownItems: [
        { name: t('menu.categories'), href: routes.configuration.categories },
        { name: t('menu.form_types'), href: routes.configuration.formTypes },
      ],
    },
    { name: t('menu.questionnaires_legacy'), href: routes.questionnaires.list, icon: <PiClipboardTextDuotone /> },

    { name: t('menu.section_communication') },
    {
      name: t('menu.news'),
      href: '/podcast',
      icon: <PiNewspaperDuotone />,
      dropdownItems: [
        { name: t('menu.news_dashboard'), href: '/podcast' },
        { name: t('menu.news_articles'), href: '/admin/news/articles' },
      ],
    },

    { name: t('menu.section_admin') },
    { name: t('menu.settings_profile'), href: routes.forms.profileSettings, icon: <PiGearDuotone /> },
  ];
}

export const adminMenuItems = [] as ReturnType<typeof useAdminMenuItems>;
