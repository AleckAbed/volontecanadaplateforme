import AuthWrapperTwo from '@/app/shared/auth-layout/auth-wrapper-two';
import ClientSignUpForm from './client-signup-form';
import { metaObject } from '@/config/site.config';

export const metadata = {
  ...metaObject('Inscription Client'),
};

export default function ClientSignUpPage() {
  return (
    <AuthWrapperTwo 
      title="Créer un compte client" 
      isSocialLoginActive={false}
    >
      <ClientSignUpForm />
    </AuthWrapperTwo>
  );
}


