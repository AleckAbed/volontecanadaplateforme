'use client';

import { use } from 'react';
import DossierForm from '../../dossier-form';

export default function EditDossierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <DossierForm mode="edit" dossierId={Number(id)} />;
}
