import ClientSignInForm from '@/app/signin/client-sign-in-form';
import AuthWrapperOne from '@/app/shared/auth-layout/auth-wrapper-one';
import Image from 'next/image';
import UnderlineShape from '@core/components/shape/underline';
import { metaObject } from '@/config/site.config';

export const metadata = {
  ...metaObject('Connexion Client'),
};

export default function ClientSignIn() {
  return (
    <AuthWrapperOne
      title={
        <>
          Espace{' '}
          <span className="relative inline-block">
            Client
            <UnderlineShape className="absolute -bottom-2 start-0 h-2.5 w-24 text-blue md:w-28 xl:-bottom-1.5 xl:w-36" />
          </span>
        </>
      }
      description="Suivez l'avancement de votre dossier d'immigration et communiquez avec votre conseiller."
      bannerTitle="Votre parcours d'immigration simplifié"
      bannerDescription="Accédez à votre espace personnel pour suivre votre dossier, télécharger vos documents et rester informé de chaque étape."
      isSocialLoginActive={false}
      pageImage={
        <div className="relative mx-auto aspect-[4/3.37] w-[500px] xl:w-[620px] 2xl:w-[820px]">
          <Image
            src={
              'https://isomorphic-furyroad.s3.amazonaws.com/public/auth/sign-up.webp'
            }
            alt="Client Sign In"
            fill
            priority
            sizes="(max-width: 768px) 100vw"
            className="object-cover"
          />
        </div>
      }
    >
      <ClientSignInForm />
    </AuthWrapperOne>
  );
}


