import { metaObject } from '@/config/site.config';
import FileManagerPageClient from './file-manager-page-client';

export const metadata = {
  ...metaObject('Gestionnaire de fichiers'),
};

export default function FileListPage() {
  return <FileManagerPageClient />;
}
