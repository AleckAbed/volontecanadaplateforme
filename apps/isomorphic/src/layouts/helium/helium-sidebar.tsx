'use client';

import { siteConfig } from '@/config/site.config';
import cn from '@core/utils/class-names';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HeliumSidebarMenu } from './helium-sidebar-menu';

const VOLONTE_SITE_URL = 'https://volontecanada.ca';

export default function HeliumSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const isQuestionnaires = pathname?.startsWith('/questionnaires');
  const logoHref = isQuestionnaires ? VOLONTE_SITE_URL : '/';

  return (
    <aside
      className={cn(
        'fixed bottom-0 start-0 z-50 h-full w-[284px] dark:bg-gray-100/50 xl:p-5 2xl:w-[308px]',
        className
      )}
    >
      <div className="h-full bg-gray-900 p-1.5 pl-0 pr-1.5 dark:bg-gray-100/70 xl:rounded-2xl">
        <div className="sticky top-0 z-40 flex justify-center px-6 pb-5 pt-5 2xl:px-8 2xl:pt-6">
          {isQuestionnaires ? (
            <a href={logoHref} aria-label="Volonté Canada">
              <Image
                src="/logo-short-light.svg"
                alt={siteConfig.title}
                width={58}
                height={35}
                priority
              />
            </a>
          ) : (
            <Link href={logoHref} aria-label="Site Logo">
              <Image
                src="/logo-short-light.svg"
                alt={siteConfig.title}
                width={58}
                height={35}
                priority
              />
            </Link>
          )}
        </div>

        <div className="custom-scrollbar h-[calc(100%-80px)] overflow-y-auto scroll-smooth">
          <HeliumSidebarMenu />
        </div>
      </div>
    </aside>
  );
}
