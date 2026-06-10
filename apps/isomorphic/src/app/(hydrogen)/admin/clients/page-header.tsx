'use client';

import { useTranslation } from 'react-i18next';
import PageHeader from '@/app/shared/page-header';
import ModalButton from '@/app/shared/modal-button';
import CreateClient from '@/app/shared/clients/create-client';

export default function ClientsPageHeader() {
  const { t } = useTranslation();
  const pageHeader = {
    title: t('clients.title'),
    breadcrumb: [
      { href: '/', name: t('breadcrumb.dashboard') },
      { name: t('breadcrumb.clients_list') },
    ],
  };

  return (
    <PageHeader title={pageHeader.title} breadcrumb={pageHeader.breadcrumb}>
      <div className="mt-4 flex flex-col items-center gap-3 @sm:flex-row @lg:mt-0">
        <ModalButton
          label={t('clients.add')}
          view={<CreateClient />}
          customSize={720}
          className="w-full @lg:w-auto"
        />
      </div>
    </PageHeader>
  );
}
