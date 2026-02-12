import ClientsPageHeader from './page-header';
import ClientListTable from '@/app/shared/clients/client-list/table';
import { metaObject } from '@/config/site.config';

export const metadata = {
  ...metaObject('Clients'),
};

export default function ClientsListPage() {
  return (
    <>
      <ClientsPageHeader />
      <div className="flex flex-col gap-10">
        <ClientListTable />
      </div>
    </>
  );
}
