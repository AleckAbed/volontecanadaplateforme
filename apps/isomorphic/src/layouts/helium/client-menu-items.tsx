'use client';

import { useTranslation } from 'react-i18next';
import { PiHouse, PiUser } from 'react-icons/pi';

type ClientMenuItem = {
  name: string;
  href?: string;
  icon?: React.ReactNode;
  badge?: string;
  dropdownItems?: { name: string; href: string; badge?: string }[];
};

// Menu des clients du cabinet : seules les pages qui existent réellement (portail S4).
export function useClientMenuItems(): ClientMenuItem[] {
  const { t } = useTranslation();
  return [
    { name: t('menu.client_section', 'Mon espace') },
    { name: t('menu.client_dashboard', 'Tableau de bord'), href: '/', icon: <PiHouse /> },
    { name: t('menu.client_profile', 'Mon profil'), href: '/client/profil', icon: <PiUser /> },
  ];
}
