'use client';

import { useSearchParams } from 'next/navigation';
import FileGrid from '@/app/shared/file/manager/file-grid';
import FileManagerList from './file-manager-list';

export default function PageLayout() {
  const searchParams = useSearchParams();
  const layout = searchParams.get('layout');
  const isGridLayout = layout?.toLowerCase() === 'grid';

  // List view is backend-driven (folders + files + lock). Grid kept as legacy mock for now.
  return isGridLayout ? <FileGrid /> : <FileManagerList />;
}
