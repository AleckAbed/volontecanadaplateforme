'use client';

import React, { useEffect, useState } from 'react';
import { Title, Text, Avatar, Button, Popover } from 'rizzui';
import cn from '@core/utils/class-names';
import { routes } from '@/config/routes';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export default function ProfileMenu({
  buttonClassName,
  avatarClassName,
  username = false,
}: {
  buttonClassName?: string;
  avatarClassName?: string;
  username?: boolean;
}) {
  const { currentUser, userType } = useAuth();
  const { t } = useTranslation();

  const displayName = React.useMemo(() => {
    if (!currentUser) return 'User';
    
    if (userType === 'admin') {
      return (currentUser as any)?.name || 'Admin';
    } else if (userType === 'client') {
      return (currentUser as any)?.first_name || 'Client';
    }
    
    return 'User';
  }, [currentUser, userType]);

  return (
    <ProfileMenuPopover>
      <Popover.Trigger>
        <button
          className={cn(
            'w-9 shrink-0 rounded-full outline-none focus-visible:ring-[1.5px] focus-visible:ring-gray-400 focus-visible:ring-offset-2 active:translate-y-px sm:w-10',
            buttonClassName
          )}
        >
          <Avatar
            src="/avatar.webp"
            name={displayName}
            className={cn('!h-9 w-9 sm:!h-10 sm:!w-10', avatarClassName)}
          />
          {!!username && (
            <span className="username hidden text-gray-200 dark:text-gray-700 md:inline-flex">
              {t('profile_menu.hi')}, {displayName}
            </span>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Content className="z-[9999] p-0 dark:bg-gray-100 [&>svg]:dark:fill-gray-100">
        <DropdownMenu />
      </Popover.Content>
    </ProfileMenuPopover>
  );
}

function ProfileMenuPopover({ children }: React.PropsWithChildren<{}>) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <Popover
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      shadow="sm"
      placement="bottom-end"
    >
      {children}
    </Popover>
  );
}

function useMenuItems() {
  const { t } = useTranslation();
  return [
    { name: t('profile_menu.my_profile'), href: routes.profile },
    { name: t('profile_menu.account_settings'), href: routes.forms.profileSettings },
    { name: t('profile_menu.activity_log'), href: '#' },
  ];
}

function DropdownMenu() {
  const { logout, currentUser, userType } = useAuth();
  const { t } = useTranslation();
  const menuItems = useMenuItems();

  const handleSignOut = async () => {
    await logout();
  };

  // Déterminer le nom et l'email à afficher avec vérifications robustes
  const displayName = React.useMemo(() => {
    if (!currentUser) return 'User';
    
    if (userType === 'admin') {
      return (currentUser as any)?.name || 'Admin';
    } else if (userType === 'client') {
      const firstName = (currentUser as any)?.first_name || '';
      const lastName = (currentUser as any)?.last_name || '';
      const fullName = `${firstName} ${lastName}`.trim();
      return fullName || 'Client';
    }
    
    return 'User';
  }, [currentUser, userType]);
  
  const displayEmail = currentUser?.email || 'user@example.com';

  return (
    <div className="w-64 text-left rtl:text-right">
      <div className="flex items-center border-b border-gray-300 px-6 pb-5 pt-6">
        <Avatar 
          src="/avatar.webp" 
          name={displayName}
        />
        <div className="ms-3">
          <Title as="h6" className="font-semibold">
            {displayName}
          </Title>
          <Text className="text-gray-600">{displayEmail}</Text>
        </div>
      </div>
      <div className="grid px-3.5 py-3.5 font-medium text-gray-700">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="group my-0.5 flex items-center rounded-md px-2.5 py-2 hover:bg-gray-100 focus:outline-none hover:dark:bg-gray-50/50"
          >
            {item.name}
          </Link>
        ))}
      </div>
      <div className="border-t border-gray-300 px-6 pb-6 pt-5">
        <Button
          className="h-auto w-full justify-start p-0 font-medium text-gray-700 outline-none focus-within:text-gray-600 hover:text-gray-900 focus-visible:ring-0"
          variant="text"
          onClick={handleSignOut}
        >
          {t('profile_menu.sign_out')}
        </Button>
      </div>
    </div>
  );
}
