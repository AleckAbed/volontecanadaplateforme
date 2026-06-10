'use client';

import Image from 'next/image';
import cn from '@core/utils/class-names';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarMenu } from './sidebar-menu';

const VOLONTE_SITE_URL = 'https://volontecanada.ca';

export default function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const isQuestionnaires = pathname?.startsWith('/questionnaires');
  const logoHref = isQuestionnaires ? VOLONTE_SITE_URL : '/';

  const LogoImg = (
    <Image
      src="/logo1.png"
      alt="Volonté Canada"
      width={180}
      height={60}
      priority
      style={{ height: 'auto', maxHeight: 56, width: 'auto', maxWidth: 180 }}
    />
  );

  return (
    <aside
      className={cn(
        'fixed bottom-0 start-0 z-50 h-full w-[270px] border-e-2 border-gray-100 bg-white dark:bg-gray-100/50 2xl:w-72',
        className
      )}
    >
      <div className="sticky top-0 z-40 bg-gray-0/10 px-6 pb-5 pt-5 dark:bg-gray-100/5 2xl:px-8 2xl:pt-6">
        {isQuestionnaires ? (
          <a href={logoHref} aria-label="Volonté Canada" className="inline-block">
            {LogoImg}
          </a>
        ) : (
          <Link href={logoHref} aria-label="Volonté Canada" className="inline-block">
            {LogoImg}
          </Link>
        )}
      </div>

      <div className="custom-scrollbar h-[calc(100%-80px)] overflow-y-auto">
        <SidebarMenu />
      </div>
    </aside>
  );
}
