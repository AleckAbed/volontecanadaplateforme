'use client';

import ThemeSwitcher from '@/layouts/settings/theme-switcher';

/** Réglages d'affichage : thème clair ou sombre. La mise en page dépend du profil (cabinet ou client). */
export default function SettingsDrawer() {
  return (
    <div className="custom-scrollbar h-[calc(100%-70px)] overflow-y-auto scroll-smooth">
      <div className="px-5 py-6">
        <ThemeSwitcher />
      </div>
    </div>
  );
}
