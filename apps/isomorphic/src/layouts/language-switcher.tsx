'use client';

import { useEffect, useState } from 'react';
import { ActionIcon, Popover, Title } from 'rizzui';
import { PiCheckBold } from 'react-icons/pi';
import { useTranslation } from 'react-i18next';
import cn from '@core/utils/class-names';
import { changeLanguage, getCurrentLanguage, type Lang } from '@/i18n';

const LANGUAGES: { code: Lang; native: string; flag: string }[] = [
  { code: 'fr', native: 'Français', flag: '🇫🇷' },
  { code: 'en', native: 'English', flag: '🇬🇧' },
  { code: 'es', native: 'Español', flag: '🇪🇸' },
];

export default function LanguageSwitcher() {
  const { t } = useTranslation();
  const [current, setCurrent] = useState<Lang>('fr');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setCurrent(getCurrentLanguage());
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<Lang>).detail;
      if (detail) setCurrent(detail);
    };
    window.addEventListener('app:language-changed', handler);
    return () => window.removeEventListener('app:language-changed', handler);
  }, []);

  const handleSelect = (code: Lang) => {
    changeLanguage(code);
    setCurrent(code);
    setOpen(false);
  };

  const active = LANGUAGES.find((l) => l.code === current) ?? LANGUAGES[0];

  return (
    <Popover isOpen={open} setIsOpen={setOpen} placement="bottom-end">
      <Popover.Trigger>
        <ActionIcon
          aria-label={t('header.change_language')}
          variant="text"
          className="relative h-[34px] w-[34px] shadow backdrop-blur-md dark:bg-gray-100 md:h-9 md:w-9"
        >
          <span className="text-base leading-none" aria-hidden>
            {active.flag}
          </span>
          <span className="sr-only">{active.native}</span>
        </ActionIcon>
      </Popover.Trigger>
      <Popover.Content className="z-[9999] w-56 p-0 dark:bg-gray-100">
        <div className="px-4 py-3 border-b border-gray-200">
          <Title as="h6" className="text-sm font-semibold">
            {t('header.language')}
          </Title>
        </div>
        <ul className="py-1">
          {LANGUAGES.map((lang) => {
            const isActive = lang.code === current;
            return (
              <li key={lang.code}>
                <button
                  type="button"
                  onClick={() => handleSelect(lang.code)}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-50',
                    isActive ? 'font-semibold text-gray-900' : 'text-gray-700'
                  )}
                >
                  <span className="text-lg leading-none" aria-hidden>
                    {lang.flag}
                  </span>
                  <span className="flex-1 text-left">{lang.native}</span>
                  {isActive && <PiCheckBold className="h-4 w-4 text-primary" />}
                </button>
              </li>
            );
          })}
        </ul>
      </Popover.Content>
    </Popover>
  );
}
