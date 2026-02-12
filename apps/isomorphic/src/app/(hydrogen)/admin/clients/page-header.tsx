'use client';

import PageHeader from '@/app/shared/page-header';
import ModalButton from '@/app/shared/modal-button';
import CreateClient from '@/app/shared/clients/create-client';

const pageHeader = {
  title: 'Clients',
  breadcrumb: [
    { href: '/', name: 'Dashboard' },
    { name: 'Liste des clients' },
  ],
};

export default function ClientsPageHeader() {
  return (
    <PageHeader title={pageHeader.title} breadcrumb={pageHeader.breadcrumb}>
      <div className="mt-4 flex flex-col items-center gap-3 @sm:flex-row @lg:mt-0">
        <ModalButton
          label="Ajouter un client"
          view={<CreateClient />}
          customSize={720}
          className="w-full @lg:w-auto"
        />
      </div>
    </PageHeader>
  );
}
