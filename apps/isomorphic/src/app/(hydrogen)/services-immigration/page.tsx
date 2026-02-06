import PageHeader from '@/app/shared/page-header';
import ModalButton from '@/app/shared/modal-button';
import ServicesGrid from '@/app/shared/services-immigration/services-grid';
import ServicesTable from '@/app/shared/services-immigration/services-table';
import CreateService from '@/app/shared/services-immigration/create-service';

const pageHeader = {
  title: 'Services d\'Immigration',
  breadcrumb: [
    {
      href: '/',
      name: 'Dashboard',
    },
    {
      name: 'Gestion des Services',
    },
  ],
};

export default function ServicesImmigrationPage() {
  return (
    <>
      <PageHeader title={pageHeader.title} breadcrumb={pageHeader.breadcrumb}>
        <ModalButton label="Ajouter un Service" view={<CreateService />} />
      </PageHeader>
      <ServicesGrid />
      <ServicesTable />
    </>
  );
}
