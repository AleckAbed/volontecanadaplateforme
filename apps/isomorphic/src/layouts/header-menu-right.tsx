'use client';

import { Badge, ActionIcon, Tooltip } from 'rizzui';
import { PiLockKeyDuotone } from 'react-icons/pi';
import { useTranslation } from 'react-i18next';
import ProfileMenu from '@/layouts/profile-menu';
import SettingsButton from '@/layouts/settings-button';
import LanguageSwitcher from '@/layouts/language-switcher';
import RingBellSolidIcon from '@core/components/icons/ring-bell-solid';
import NotificationDropdown from './notification-dropdown';
import { lockApp } from '@/layouts/lock-screen';

export default function HeaderMenuRight() {
  const { t } = useTranslation();
  return (
    <div className="ms-auto grid shrink-0 grid-cols-5 items-center gap-2 text-gray-700 xs:gap-3 xl:gap-4">
      <NotificationDropdown>
        <ActionIcon
          aria-label={t('header.notifications')}
          variant="text"
          className="relative h-[34px] w-[34px] shadow backdrop-blur-md dark:bg-gray-100 md:h-9 md:w-9"
        >
          <RingBellSolidIcon className="h-[18px] w-auto" />
          <Badge
            renderAsDot
            color="warning"
            enableOutlineRing
            className="absolute right-2.5 top-2.5 -translate-y-1/3 translate-x-1/2"
          />
        </ActionIcon>
      </NotificationDropdown>
      <LanguageSwitcher />

      <SettingsButton />

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
