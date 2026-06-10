import { redirect } from 'next/navigation';

export default function NotFoundPage() {
  redirect('/maintenance?reason=not-found');
}
