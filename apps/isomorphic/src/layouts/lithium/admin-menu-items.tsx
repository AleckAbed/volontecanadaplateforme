'use client';

import { useTranslation } from 'react-i18next';
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

/**
 * Menu admin (Lithium layout — top nav).
 * Voir helium/admin-menu-items.tsx pour la liste des sections retirées
 * (agenda, communication, gestion admins, settings général/sécurité).
 */
export function useLithiumAdminMenuItems(): LithiumMenuItem {
  const { t } = useTranslation();

  return {
    dashboard: {
      name: t('menu.section_dashboard'),
      type: 'link',
      dropdownItems: [
        { name: t('menu.dashboard'), href: '/', icon: 'AnalyticsCircularIcon' },
        { name: t('menu.analytics'), href: routes.analytics, icon: 'BarChartIcon' },
      ],
    },
    clients: {
      name: t('menu.section_clients'),
      type: 'enhance',
      dropdownItems: [
        {
          name: t('menu.clients'),
          icon: 'UserSettingsIcon',
          description: t('menu.clients'),
          href: '/admin/clients',
        },
        {
          name: t('menu.dossiers'),
          icon: 'FolderIcon',
          description: t('menu.dossiers'),
          subMenuItems: [
            { name: t('menu.dossiers'), href: '/admin/dossiers' },
            { name: t('common.create'), href: '/admin/dossiers/create' },
          ],
        },
        {
          name: t('menu.documents'),
          icon: 'DocumentIcon',
          description: t('menu.documents'),
          href: '/file-manager',
        },
      ],
    },
    services: {
      name: t('menu.section_services'),
      type: 'link',
      dropdownItems: [
        { name: t('menu.immigration_services'), icon: 'SuitcaseIcon', href: '/services-immigration' },
      ],
    },
    administration: {
      name: t('menu.section_admin'),
      type: 'link',
      dropdownItems: [
        {
          name: t('menu.settings_profile'),
          icon: 'SettingsIcon',
          href: routes.forms.profileSettings,
        },
      ],
    },
  };
}

export const lithiumAdminMenuItems: LithiumMenuItem = {} as LithiumMenuItem;
