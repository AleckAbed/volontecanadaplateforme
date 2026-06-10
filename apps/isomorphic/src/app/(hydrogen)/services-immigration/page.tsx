'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/app/shared/page-header';
import ModalButton from '@/app/shared/modal-button';
import ServicesGrid from '@/app/shared/services-immigration/services-grid';
import ServicesTable from '@/app/shared/services-immigration/services-table';
import CreateService from '@/app/shared/services-immigration/create-service';
import { ActionIcon, Tooltip } from 'rizzui';
import { PiSquaresFourDuotone, PiListDuotone } from 'react-icons/pi';
import cn from '@core/utils/class-names';

type ViewMode = 'grid' | 'table';
const STORAGE_KEY = 'servicesImmigrationView';

export default function ServicesImmigrationPage() {
  const { t } = useTranslation();
  const [view, setView] = useState<ViewMode>('grid');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'grid' || saved === 'table') setView(saved);
    } catch {}
  }, []);

  const setMode = (m: ViewMode) => {
    setView(m);
    try { localStorage.setItem(STORAGE_KEY, m); } catch {}
  };

  return (
    <>
      <PageHeader
        title={t('services_immigration.title')}
        breadcrumb={[
          { href: '/', name: t('breadcrumb.dashboard') },
          { name: t('services_immigration.breadcrumb_section') },
        ]}
      >
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-lg border border-gray-200 bg-white p-0.5">
            <Tooltip size="sm" content={t('services_immigration.view_grid')} placement="top" color="invert">
              <ActionIcon
                size="sm"
                variant={view === 'grid' ? 'solid' : 'text'}
                onClick={() => setMode('grid')}
                aria-label={t('services_immigration.view_grid_aria')}
                className={cn(view === 'grid' ? 'bg-primary text-white' : 'text-gray-600')}
              >
                <PiSquaresFourDuotone className="h-5 w-5" />
              </ActionIcon>
            </Tooltip>
            <Tooltip size="sm" content={t('services_immigration.view_table')} placement="top" color="invert">
              <ActionIcon
                size="sm"
                variant={view === 'table' ? 'solid' : 'text'}
                onClick={() => setMode('table')}
                aria-label={t('services_immigration.view_table_aria')}
                className={cn(view === 'table' ? 'bg-primary text-white' : 'text-gray-600')}
              >
                <PiListDuotone className="h-5 w-5" />
              </ActionIcon>
            </Tooltip>
          </div>

          <ModalButton label={t('services_immigration.add')} view={<CreateService />} />
        </div>
      </PageHeader>

      {view === 'grid' ? <ServicesGrid /> : <ServicesTable />}
    </>
  );
}
