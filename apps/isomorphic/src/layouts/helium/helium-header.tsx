'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Badge } from 'rizzui/badge';
import { ActionIcon } from 'rizzui/action-icon';
import { Tooltip } from 'rizzui';
import cn from '@core/utils/class-names';
import SearchWidget from '@/app/shared/search/search';
import ProfileMenu from '@/layouts/profile-menu';
import SettingsButton from '@/layouts/settings-button';
import LanguageSwitcher from '@/layouts/language-switcher';
import NotificationBell from '@/layouts/notification-bell';
import HamburgerButton from '@/layouts/hamburger-button';
import CabinetLogo from '@/components/cabinet-logo';
import { useCabinetBranding } from '@/hooks/use-cabinet-branding';
import { lockApp } from '@/layouts/lock-screen';
import {
  PiChatCircleDotsFill,
  PiBellSimpleRingingFill,
  PiGearFill,
  PiLockKeyDuotone,
} from 'react-icons/pi';
import Sidebar from './helium-sidebar';

function HeaderMenuRight() {
  const { t } = useTranslation();
  return (
    <div className="ms-auto flex shrink-0 items-center gap-2 text-gray-700 xs:gap-3 xl:gap-4">
      <NotificationBell />
      <LanguageSwitcher />
      <SettingsButton className="rounded-full before:absolute before:h-full before:w-full before:-rotate-45 before:rounded-full before:bg-gradient-to-l before:from-green-dark/25 before:via-green-dark/0 before:to-green-dark/0 3xl:h-10 3xl:w-10">
        <PiGearFill className="h-[22px] w-auto animate-spin-slow" />
      </SettingsButton>
      <Tooltip size="sm" content={t('header.lock_session')} placement="bottom" color="invert">
        <ActionIcon
          aria-label={t('header.lock_session')}
          variant="text"
          onClick={() => lockApp()}
          className="relative h-[34px] w-[34px] shadow backdrop-blur-md dark:bg-gray-100 md:h-9 md:w-9"
        >
          <PiLockKeyDuotone className="h-[18px] w-auto" />
        </ActionIcon>
      </Tooltip>
      <ProfileMenu />
    </div>
  );
}

export default function Header() {
  const branding = useCabinetBranding();

  return (
    <header
      className={
        'sticky top-0 z-[990] flex items-center bg-gray-0/80 px-4 py-4 backdrop-blur-xl dark:bg-gray-50/50 md:px-5 lg:px-6 xl:-ms-1.5 xl:pl-4 2xl:-ms-0 2xl:py-5 2xl:pl-6 3xl:px-8 3xl:pl-6 4xl:px-10 4xl:pl-9'
      }
    >
      <div className="flex w-full max-w-2xl items-center">
        <HamburgerButton
          view={
            <Sidebar className="static w-full xl:p-0 2xl:w-full [&>div]:xl:rounded-none" />
          }
        />
        <Link
          href="/"
          aria-label={branding?.name ?? 'Accueil'}
          className="me-4 shrink-0 lg:me-5 xl:hidden"
        >
          <CabinetLogo branding={branding} compact />
        </Link>
        <SearchWidget />
      </div>
      <HeaderMenuRight />
    </header>
  );
}
