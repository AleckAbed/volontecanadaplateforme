'use client';

import { useTranslation } from 'react-i18next';
import PageHeader from '@/app/shared/page-header';
import PageLayout from '@/app/(hydrogen)/file-manager/page-layout';

export default function FileManagerPageClient() {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader
        title={t('file_manager.title')}
        breadcrumb={[
          { href: '/', name: t('breadcrumb.dashboard') },
          { name: t('breadcrumb.file_manager') },
        ]}
      />
      <PageLayout />
    </>
  );
}
