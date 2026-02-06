'use client';

import LayoutSwitcher from '@/layouts/layout-switcher';
import ThemeSwitcher from '@/layouts/settings/theme-switcher';
import { useAuth } from '@/hooks/useAuth';
import EnvatoIcon from '@core/components/icons/envato';
import { Button } from 'rizzui';

/**
 * Settings Drawer configuré pour le Cabinet d'Immigration
 * 
 * Configuration fixe :
 * - Couleur : Rose (pink)
 * - Direction : LTR
 * 
 * Modifiable :
 * - Thème (light/dark) : Tous les utilisateurs
 * - Layout : Uniquement les administrateurs
 */
export default function SettingsDrawer() {
  const { userType } = useAuth();
  const isAdmin = userType === 'admin';

  return (
    <>
      <div className="custom-scrollbar overflow-y-auto scroll-smooth h-[calc(100%-138px)]">
        <div className="px-5 py-6">
          <ThemeSwitcher />
          {/* AppDirection masqué - fixé sur LTR */}
          {/* LayoutSwitcher visible uniquement pour les admins */}
          {isAdmin && <LayoutSwitcher />}
          {/* ColorOptions masqué - fixé sur Rose (pink) */}
        </div>
      </div>

      <SettingsFooterButton />
    </>
  );
}

function SettingsFooterButton() {
  return (
    <a
      href="https://themeforest.net/item/isomorphic-react-redux-admin-dashboard/20262330?ref=redqteam"
      target="_blank"
      className="grid grid-cols-1 border-t border-muted px-6 pt-4"
    >
      <Button size="lg" as="span" className={'text-base font-semibold'}>
        <EnvatoIcon className="me-2 h-5 w-5" />
        <span className="">Purchase for $24</span>
      </Button>
    </a>
  );
}
