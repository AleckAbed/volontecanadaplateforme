'use client';

import CreateClientForm from '@/app/shared/clients/create-client-form';

export const CLIENT_LIST_REFRESH_EVENT = 'clients-updated';

export default function CreateClient() {
  return <CreateClientForm />;
}
