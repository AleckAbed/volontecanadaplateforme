'use client';

import { useTranslation } from 'react-i18next';
import { routes } from '@/config/routes';
import {
  PiUsers,
  PiFolderUser,
  PiChartBar,
  PiGear,
  PiFile,
  PiBriefcase,
  PiClipboardText,
  PiNewspaper,
  PiFileText,
} from 'react-icons/pi';

/**
 * Menu admin actif (Helium layout).
 *
 * Toutes les entrées pointent vers des routes qui EXISTENT vraiment.
 * Les sections fantômes ont été retirées en attendant leur implémentation :
 *  - Agenda / Rendez-vous (pas de page)
 *  - Messages, Notifications (pas de page)
 *  - Gestion des admins (pas de page)
 *  - Paramètres général/sécurité (pas de page — seul Mon profil existe)
 */
export function useAdminMenuItems() {
  const { t } = useTranslation();

  return [
    { name: t('menu.section_dashboard') },
    { name: t('menu.dashboard'), href: '/', icon: <PiChartBar /> },
    { name: t('menu.analytics'), href: routes.analytics, icon: <PiChartBar /> },

    { name: t('menu.section_clients') },
    { name: t('menu.clients'), href: '/admin/clients', icon: <PiUsers /> },
    { name: t('menu.dossiers'), href: '/admin/dossiers', icon: <PiFolderUser /> },
    { name: t('menu.collaborators'), href: '/admin/collaborators', icon: <PiUsers /> },
    { name: t('menu.documents'), href: '/file-manager', icon: <PiFile /> },

    { name: t('menu.section_services') },
    { name: t('menu.immigration_services'), href: '/services-immigration', icon: <PiBriefcase /> },

    { name: t('menu.section_forms') },
    { name: t('menu.envois'), href: routes.invitations.list, icon: <PiFileText /> },
    { name: t('menu.document_templates'), href: routes.configuration.documents, icon: <PiFileText /> },
    {
      name: t('menu.configuration'),
      href: '#',
      icon: <PiClipboardText />,
      dropdownItems: [
        { name: t('menu.categories'), href: routes.configuration.categories },
        { name: t('menu.form_types'), href: routes.configuration.formTypes },
      ],
    },
    { name: t('menu.questionnaires_legacy'), href: routes.questionnaires.list, icon: <PiClipboardText /> },

    { name: t('menu.section_communication') },
    {
      name: t('menu.news'),
      href: '/podcast',
      icon: <PiNewspaper />,
      dropdownItems: [
        { name: t('menu.news_dashboard'), href: '/podcast' },
        { name: t('menu.news_articles'), href: '/admin/news/articles' },
      ],
    },

    { name: t('menu.section_admin') },
    { name: t('menu.settings_profile'), href: routes.forms.profileSettings, icon: <PiGear /> },
  ];
}

export const adminMenuItems = [] as ReturnType<typeof useAdminMenuItems>;
