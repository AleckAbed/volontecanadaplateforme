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

// Menu pour les Clients du Cabinet d'Immigration.
// Seules les pages qui existent réellement sont listées (portail S4).
export const lithiumClientMenuItems: LithiumMenuItem = {
  dashboard: {
    name: 'Mon Espace',
    type: 'link',
    dropdownItems: [
      {
        name: 'Tableau de bord',
        description: 'Vos dossiers et ce qu’il reste à faire',
        href: '/',
        icon: 'DashboardIcon',
      },
      {
        name: 'Mon profil',
        description: 'Vos informations, réutilisées dans vos formulaires',
        href: '/client/profil',
        icon: 'UserSettingsIcon',
      },
    ],
  },
};
