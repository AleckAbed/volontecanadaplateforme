'use client';

import { useSearchParams } from 'next/navigation';
import { Button } from 'rizzui';
import Image from 'next/image';
import Link from 'next/link';

export default function QuestionnaireCompletedClient() {
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
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Formulaire Déjà Complété</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Ce formulaire a déjà été complété. Si vous avez des questions ou souhaitez modifier vos réponses, veuillez contacter votre consultant.
            </p>
          </div>
          <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Besoin d&apos;aide?</strong> Contactez votre consultant pour toute question concernant votre formulaire.
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
