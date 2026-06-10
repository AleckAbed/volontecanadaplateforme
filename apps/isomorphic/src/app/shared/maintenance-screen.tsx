'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Title, Text } from 'rizzui/typography';
import { Button } from 'rizzui/button';
import { PiHouseLineBold, PiArrowClockwiseBold } from 'react-icons/pi';
import MaintananceImg from '@public/maintanance.png';

export type MaintenanceReason = 'not-found' | 'error' | 'unavailable';

const HEADLINES: Record<MaintenanceReason, { title: string; text: string }> = {
  'not-found': {
    title: 'Cette page est introuvable',
    text: "L'adresse que vous avez visitée n'existe pas ou n'est plus disponible. Revenez à l'accueil pour reprendre votre navigation.",
  },
  error: {
    title: 'Une erreur est survenue',
    text: "Désolé, quelque chose s'est mal passé. Notre équipe est notifiée. Vous pouvez réessayer ou retourner à l'accueil.",
  },
  unavailable: {
    title: 'Site en maintenance',
    text: "Nous mettons l'application à jour. Merci de revenir dans quelques instants — le service sera rétabli rapidement.",
  },
};

export default function MaintenanceScreen({
  reason = 'unavailable',
}: {
  reason?: MaintenanceReason;
}) {
  const router = useRouter();
  const { title, text } = HEADLINES[reason] ?? HEADLINES.unavailable;

  return (
    <div className="flex min-h-screen grow items-center bg-gradient-to-br from-red-50 via-white to-red-50 px-6 xl:px-10">
      <div className="mx-auto flex w-full max-w-[1520px] flex-col-reverse items-center justify-between gap-5 text-center lg:flex-row lg:text-start">
        <div className="lg:max-w-2xl">
          <div className="mb-4 flex items-center justify-center gap-3 lg:justify-start">
            <Image
              src="/logo1.png"
              alt="Volonté Canada"
              width={140}
              height={48}
              style={{ height: 'auto', maxHeight: 48, width: 'auto' }}
              priority
            />
          </div>
          <Title
            as="h1"
            className="mb-3 text-[22px] font-bold leading-snug text-gray-900 sm:text-2xl md:mb-5 md:text-3xl md:leading-snug xl:mb-7 xl:text-4xl xl:leading-normal 2xl:text-[40px] 3xl:text-5xl 3xl:leading-snug"
          >
            {title}
          </Title>
          <Text className="mb-6 text-sm leading-loose text-gray-600 md:mb-8 xl:mb-10 xl:text-base xl:leading-loose">
            {text}
          </Text>

          <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Link href="/">
              <Button as="span" size="xl" color="primary" className="gap-2">
                <PiHouseLineBold className="text-lg" />
                Retour à l'accueil
              </Button>
            </Link>
            <Button
              variant="outline"
              size="xl"
              className="gap-2"
              onClick={() => router.back()}
            >
              <PiArrowClockwiseBold className="text-lg" />
              Revenir en arrière
            </Button>
          </div>

          <Text className="mt-8 text-xs text-gray-400">
            Volonté Canada — Cabinet d'immigration · Une erreur persistante ?{' '}
            <a
              href="mailto:formulaire.volontecanada@querga.ca"
              className="text-red-700 hover:underline"
            >
              Contactez-nous
            </a>
          </Text>
        </div>

        <div className="pt-5 lg:pt-0">
          <Image
            src={MaintananceImg}
            alt="maintenance"
            className="aspect-[768/558] max-w-[320px] dark:invert sm:max-w-sm xl:max-w-[580px] 2xl:max-w-[768px]"
          />
        </div>
      </div>
    </div>
  );
}
