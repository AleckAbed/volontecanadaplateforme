'use client';

import { useSearchParams } from 'next/navigation';
import { Button } from 'rizzui';
import Image from 'next/image';
import Link from 'next/link';

export default function QuestionnaireExpiredClient() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  return (
    <div className="min-h-screen bg-gradient-to-r from-red-600/70 to-red-800/70 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
          style={{ backgroundImage: 'url(/bg0.jpg)' }}
        />
        <div className="fixed inset-0 bg-gradient-to-r from-red-600/70 to-red-800/70 -z-10" />
        <div className="relative bg-white rounded-lg shadow-xl p-8 text-center dark:bg-gray-0">
          <Image src="/logo2.png" alt="Logo" width={150} height={50} className="mx-auto mb-6" />
          <div className="mb-6">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Formulaire Expiré</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Ce formulaire a expiré. La période de 14 jours pour compléter le formulaire est écoulée.
            </p>
          </div>
          <div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-900/20">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Que faire maintenant?</strong> Veuillez contacter votre consultant pour réactiver le formulaire et obtenir un nouveau lien d&apos;accès.
            </p>
          </div>
          <div className="mt-6">
            <Link href="/">
              <Button variant="outline" className="w-full">Retour à l&apos;accueil</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
