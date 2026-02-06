import AuthWrapperTwo from '@/app/shared/auth-layout/auth-wrapper-two';
import ClientSignInForm from './client-signin-form';
import { metaObject } from '@/config/site.config';

export const metadata = {
  ...metaObject('Connexion Client'),
};

export default function ClientSignIn() {
  return (
    <AuthWrapperTwo 
      title="Espace Client" 
      isSignIn 
      isSocialLoginActive={false}
    >
      <ClientSignInForm />
    </AuthWrapperTwo>
  );
}


