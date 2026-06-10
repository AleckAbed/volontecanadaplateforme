'use client';

import Link from 'next/link';
import { PiCaretDownBold } from 'react-icons/pi';
import cn from '@core/utils/class-names';
import { ForwardedRef, forwardRef, useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import BulletIcon from '@/layouts/lithium/bullet-icon';
import { AiFillCaretRight } from 'react-icons/ai';
import NavMenu from '@/layouts/nav-menu/nav-menu';
import {
  DropdownItemType,
  LithiumMenuItemsKeys,
  lithiumMenuItems,
} from '@/layouts/lithium/lithium-menu-items';
import { useLithiumAdminMenuItems } from '@/layouts/lithium/admin-menu-items';
import { lithiumClientMenuItems } from '@/layouts/lithium/client-menu-items';
import { useAuth } from '@/hooks/useAuth';
import { usePathname } from 'next/navigation';
import { LithiumMenuIconType, lithiumMenuIcons } from './lithium-menu-icons';
import { useActivePathname } from './use-pathname-active';
import { useDirection } from '@core/hooks/use-direction';
import { NavMenuDirection } from '../nav-menu/nav-menu-types';

function EnhancedMenuItems({
  items,
  currentState,
  className = '',
}: {
  items: DropdownItemType[];
  currentState: number;
  className?: string;
}) {
  const pathname = usePathname();
  return (
    <div
      className={cn(
        'w-[calc(100%_-_200px)] rounded-lg bg-white pl-3 dark:bg-gray-100',
        className
      )}
    >
      <ul className="grid list-none grid-cols-2 gap-x-10 gap-y-4 p-7">
        {items &&
          items[currentState] &&
          items[currentState]?.subMenuItems &&
          items[currentState]?.subMenuItems?.map((item, index) => {
            const isActive = pathname === item.href;
            return (
              <motion.li
                style={{ transformOrigin: 'center' }}
                initial={{ opacity: 0, scale: 0.75 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: index * 0.075 }}
                className="basis-1/2 text-left"
                key={`enhance-menu-item-${item.name}-${index}`}
              >
                <Link
                  href={item.href ?? '/'}
                  className="group/submenu-link flex items-center gap-3 font-medium text-gray-900"
                >
                  <span
                    className={cn(
                      'text-gray-500 duration-200 group-hover/submenu-link:text-gray-900',
                      {
                        'text-gray-900': isActive,
                      }
                    )}
                  >
                    <BulletIcon className="h-3 w-3" />
                  </span>
                  <span
                    className={cn('duration-200', {
                      'group-hover/submenu-link:translate-x-1': !isActive,
                      underline: isActive,
                    })}
                  >
                    {item.name}
                  </span>
                </Link>
              </motion.li>
            );
          })}
      </ul>
    </div>
  );
}

export const EnhancedMenu = forwardRef(
  (
    {
      items,
      className = '',
    }: {
      items: DropdownItemType[];
      className?: string;
    },
    ref: ForwardedRef<HTMLDivElement>
  ) => {
    const [currentState, setState] = useState<number>(0);
    const pathname = usePathname();

    useEffect(() => {
      if (
        items.some((item) =>
          item.subMenuItems?.some((subItem) => subItem.href === pathname)
        )
      ) {
        setState(
          items.findIndex((item) =>
            item.subMenuItems?.some((subItem) => subItem.href === pathname)
          )
        );
      }
    }, [items, pathname]);

    return (
      <motion.div
        key="enhanced-menu"
        initial={{ opacity: 0, scale: 0.75 }}
        transition={{ duration: 0.1 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.2 } }}
        className={cn('flex gap-x-2 p-1 pb-1.5 pe-1.5', className)}
      >
        <div className="col-span-3 flex w-[200px] flex-col gap-2 pe-0">
          {items.map((item, index) => {
            const Icon = lithiumMenuIcons?.[item.icon as LithiumMenuIconType];
            return (
              <button
                role="div"
                key={`link-menu-${item.name}-${index}`}
                className={cn(
                  'relative cursor-pointer rounded-lg p-3 pb-2.5 text-left font-medium text-gray-900 duration-200',
                  {
                    'bg-white dark:bg-gray-100': currentState === index,
                  }
                )}
                onClick={() => setState(index)}
              >
                <div className="mb-2 flex items-center gap-2">
                  {Icon && <Icon className="h-5 w-5" />}
                  <span>{item.name}</span>
                </div>
                <p className="text-xs font-normal leading-5 text-gray-500">
                  {item?.description}
                </p>
                <span
                  className={cn(
                    'absolute -end-[9px] top-1/2 -translate-y-1/2 text-white opacity-0 duration-200 dark:text-gray-100 rtl:rotate-180',
                    {
                      'opacity-100': currentState === index,
                    }
                  )}
                >
                  <AiFillCaretRight className="h-auto w-3.5" />
                </span>
                <span
                  className={cn(
                    'absolute -end-[17px] top-1/2 -translate-y-1/2 text-gray-50 opacity-0 duration-200 dark:text-gray-0 rtl:rotate-180',
                    {
                      'opacity-100': currentState === index,
                    }
                  )}
                >
                  <AiFillCaretRight className="h-auto w-3.5" />
                </span>
              </button>
            );
          })}
        </div>
        <EnhancedMenuItems items={items} currentState={currentState} />
      </motion.div>
    );
  }
);

EnhancedMenu.displayName = 'EnhancedMenu';

export function LinkMenu({
  items,
  className = '',
}: {
  items: DropdownItemType[];
  className?: string;
}) {
  const pathname = usePathname();
  return (
    <ul className={cn('w-full', className, 'bg-gray-0 dark:bg-gray-100')}>
      {items.map((item, index) => {
        const Icon = lithiumMenuIcons?.[item.icon as LithiumMenuIconType];
        const isActive = item.href === pathname;
        return (
          <li
            key={`link-menu-${item.name}-${index}`}
            className="relative my-0.5"
          >
            <Link
              href={item.href ?? '/'}
              className={cn(
                'flex items-center gap-3 whitespace-nowrap rounded-md bg-gray-100/0 px-3 py-2 font-medium text-gray-900 duration-200 hover:bg-gray-100 hover:dark:bg-gray-50/50',
                { 'bg-gray-100 dark:bg-gray-50/50': isActive }
              )}
            >
              {Icon && <Icon className="h-5 w-5" />}
              <span className="relative block">{item.name}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function HeaderMenuLeft() {
  const { direction } = useDirection();
  const { userType } = useAuth();
  const lithiumAdminMenuItems = useLithiumAdminMenuItems();

  const currentMenuItems = useMemo(() => {
    if (userType === 'admin') {
      return lithiumAdminMenuItems;
    } else if (userType === 'client') {
      return lithiumClientMenuItems;
    }
    return lithiumAdminMenuItems;
  }, [userType, lithiumAdminMenuItems]);

  // Obtenir les clés de menu disponibles
  const menuKeys = Object.keys(currentMenuItems);

  return (
    <>
      <NavMenu
        dir={direction as NavMenuDirection}
        menuClassName="pb-5 top-3 gap-8 relative"
        menuContentClassName="mt-2 border border-gray-200 dark:border-gray-300"
      >
        {menuKeys.map((menuKey) => {
          const menu = currentMenuItems[menuKey];
          return (
            <NavMenu.Item key={menuKey}>
              <NavMenu.Trigger className="flex items-center gap-1 duration-200">
                <MenuTriggerButton name={menuKey} customLabel={menu.name} />
              </NavMenu.Trigger>
              <NavMenu.Content className="bg-white dark:bg-gray-100">
                {menu.type === 'link' ? (
                  <div className={menu.dropdownItems.length > 4 ? 'w-[420px]' : 'w-[220px]'}>
                    <LinkMenu
                      className={menu.dropdownItems.length > 4 ? 'grid grid-cols-2 gap-x-1 p-3 dark:bg-gray-100' : 'flex flex-col p-3 dark:bg-gray-100'}
                      items={menu.dropdownItems ?? []}
                    />
                  </div>
                ) : (
                  <div className="w-[670px]">
                    <EnhancedMenu
                      className="min-h-[336px] w-[670px] bg-gray-50 dark:bg-gray-0"
                      items={menu.dropdownItems ?? []}
                    />
                  </div>
                )}
              </NavMenu.Content>
            </NavMenu.Item>
          );
        })}
      </NavMenu>
    </>
  );
}

function MenuTriggerButton({ name, customLabel }: { name: LithiumMenuItemsKeys | string; customLabel?: string }) {
  const { isActive } = useActivePathname();
  
  // Utiliser customLabel si fourni, sinon utiliser le nom du menu original
  const label = customLabel || (lithiumMenuItems[name as LithiumMenuItemsKeys]?.name || name);
  const items = lithiumMenuItems[name as LithiumMenuItemsKeys]?.dropdownItems || [];
  
  return (
    <>
      <span
        className={cn(
          'inline-block w-full overflow-hidden whitespace-nowrap pe-1.5 ps-0 text-sm font-medium leading-5 text-gray-900 transition-all duration-200',
          isActive(items)
            ? 'text-primary'
            : 'group-hover:text-gray-900'
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          'text-gray-900 duration-200',
          isActive(items) && 'text-primary'
        )}
      >
        <PiCaretDownBold />
      </span>
    </>
  );
}
