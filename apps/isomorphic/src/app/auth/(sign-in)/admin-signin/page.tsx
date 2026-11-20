import AuthWrapperTwo from '@/app/shared/auth-layout/auth-wrapper-two';
import AdminSignInForm from './admin-signin-form';
import { metaObject } from '@/config/site.config';

export const metadata = {
  ...metaObject('Connexion Administrateur'),
};

export default function AdminSignIn() {
  return (
    <AuthWrapperTwo 
      title={<>Bon retour !<br />Connectez-vous à votre cabinet.</>} 
      isSignIn 
      isSocialLoginActive={false}
    >
      <AdminSignInForm />
    </AuthWrapperTwo>
  );
}


