'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader } from 'rizzui';

/**
 * Page de redirection vers la nouvelle page de connexion admin
 */
export default function SignInRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Rediriger vers la nouvelle page de connexion admin
    router.replace('/auth/admin-signin');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <Loader size="xl" />
    </div>
  );
}
