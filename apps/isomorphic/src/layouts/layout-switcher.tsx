'use client';

import { useTranslation } from 'react-i18next';
import { RadioGroup } from 'rizzui';
import { useLayout } from '@/layouts/use-layout';
import { LAYOUT_OPTIONS } from '@/config/enums';
import RadioBox from '@/layouts/settings/radio-box';
import DrawerBlock from '@/layouts/settings/drawer-block';
import HydrogenIcon from './layout-icons/hydrogen-icon';
import HeliumIcon from './layout-icons/helium-icon';

const layoutOptions = [
  { icon: HydrogenIcon, value: LAYOUT_OPTIONS.HYDROGEN, labelKey: 'settings.layout_hydrogen' },
  { icon: HeliumIcon, value: LAYOUT_OPTIONS.HELIUM, labelKey: 'settings.layout_helium' },
];

export default function LayoutSwitcher() {
  const { layout, setLayout } = useLayout();
  const { t } = useTranslation();

  return (
    <DrawerBlock title={t('settings.layout_title')}>
      <RadioGroup
        value={layout}
        setValue={(selectedLayout: any) => setLayout(selectedLayout)}
        className="grid grid-cols-2 gap-4"
      >
        {layoutOptions.map((item) => (
          <RadioBox
            key={item.value}
            value={item.value}
            className="h-auto"
            contentClassName="p-0 [&_.radio-active]:ring-primary/0 peer-checked:ring-0 border-0 ring-0 peer-checked:border-0 peer-checked:[&_.radio-active]:ring-primary/100 [&_.radio-active]:ring-2 peer-checked:text-primary"
          >
            <span className="flex w-full justify-center">
              <span className="radio-active mb-3 inline-flex justify-center rounded-lg capitalize ring-offset-4 ring-offset-gray-0 duration-150 dark:ring-offset-gray-100">
                <item.icon
                  aria-label={t(item.labelKey)}
                  className="h-[92px] w-full"
                />
              </span>
            </span>{' '}
            <span className="inline-block w-full text-center">
              {t(item.labelKey)}
            </span>
          </RadioBox>
        ))}
      </RadioGroup>
    </DrawerBlock>
  );
}
