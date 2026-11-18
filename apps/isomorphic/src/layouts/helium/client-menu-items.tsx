import { PiHouse, PiUser } from 'react-icons/pi';

type ClientMenuItem = {
  name: string;
  href?: string;
  icon?: React.ReactNode;
  badge?: string;
  dropdownItems?: { name: string; href: string; badge?: string }[];
};

// Menu pour les Clients du Cabinet d'Immigration.
// Seules les pages qui existent réellement sont listées (portail S4).
export const clientMenuItems: ClientMenuItem[] = [
  { name: 'Mon Espace' },
  { name: 'Tableau de bord', href: '/', icon: <PiHouse /> },
  { name: 'Mon profil', href: '/client/profil', icon: <PiUser /> },
];
