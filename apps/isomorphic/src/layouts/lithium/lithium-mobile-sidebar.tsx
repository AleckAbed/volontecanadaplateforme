'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import cn from '@core/utils/class-names';
import CabinetLogo from '@/components/cabinet-logo';
import { useCabinetBranding } from '@/hooks/use-cabinet-branding';
import { lithiumClientMenuItems } from '@/layouts/lithium/client-menu-items';

/** Menu du portail client sur mobile : les mêmes liens que le menu du haut. */
export default function LithiumMobileSidebar() {
  const pathname = usePathname();
  const branding = useCabinetBranding();
  const sections = Object.values(lithiumClientMenuItems);

  return (
    <aside className="h-full w-full overflow-y-auto bg-white px-4 pb-6 dark:bg-gray-50">
      <div className="sticky top-0 z-10 bg-white py-5 dark:bg-gray-50">
        <Link href="/" aria-label={branding?.name ?? 'Accueil'}>
          <CabinetLogo branding={branding} />
        </Link>
      </div>
      <nav aria-label="Menu du portail">
        {sections.map((section) => (
          <div key={section.name} className="mb-4">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">{section.name}</p>
            <ul className="space-y-1">
              {section.dropdownItems.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href ?? '#'}
                    className={cn(
                      'block rounded-lg px-3 py-2 text-sm font-medium',
                      pathname === item.href ? 'bg-primary-lighter/50 text-primary' : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    {item.name}
                    {item.description && <span className="block text-xs font-normal text-gray-500">{item.description}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
