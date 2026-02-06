'use client';

import Link from 'next/link';
import { SubmitHandler } from 'react-hook-form';
import { PiArrowRightBold } from 'react-icons/pi';
import { Checkbox, Password, Button, Input, Text } from 'rizzui';
import { Form } from '@core/ui/form';
import { routes } from '@/config/routes';
import { loginSchema, LoginSchema } from '@/validators/login.schema';
import { useAuth } from '@/hooks/useAuth';

const initialValues: LoginSchema = {
  email: '',
  password: '',
  rememberMe: true,
};

export default function ClientSignInForm() {
  const { loginClient, isLoading } = useAuth();

  const onSubmit: SubmitHandler<LoginSchema> = async (data) => {
    await loginClient({
      email: data.email,
      password: data.password,
    });
  };

  return (
    <>
      <Form<LoginSchema>
        validationSchema={loginSchema}
        onSubmit={onSubmit}
        useFormProps={{
          defaultValues: initialValues,
        }}
      >
        {({ register, formState: { errors } }) => (
          <div className="space-y-5">
            <Input
              type="email"
              size="lg"
              label="Email"
              placeholder="Entrez votre email"
              className="[&>label>span]:font-medium"
              inputClassName="text-sm"
              {...register('email')}
              error={errors.email?.message}
              disabled={isLoading}
            />
            <Password
              label="Mot de passe"
              placeholder="Entrez votre mot de passe"
              size="lg"
              className="[&>label>span]:font-medium"
              inputClassName="text-sm"
              {...register('password')}
              error={errors.password?.message}
              disabled={isLoading}
            />
            <div className="flex items-center justify-between pb-2">
              <Checkbox
                {...register('rememberMe')}
                label="Se souvenir de moi"
                className="[&>label>span]:font-medium"
                disabled={isLoading}
              />
              <Link
                href={routes.auth.forgotPassword1}
                className="h-auto p-0 text-sm font-semibold text-blue underline transition-colors hover:text-gray-900 hover:no-underline"
              >
                Mot de passe oublié ?
              </Link>
            </div>
            <Button 
              className="w-full" 
              type="submit" 
              size="lg"
              isLoading={isLoading}
              disabled={isLoading}
            >
              <span>Se connecter</span>{' '}
              {!isLoading && <PiArrowRightBold className="ms-2 mt-0.5 h-5 w-5" />}
            </Button>
          </div>
        )}
      </Form>
      <div className="mt-6 space-y-3 text-center lg:text-start">
        <Text className="leading-loose text-gray-500">
          Pas encore de compte ?{' '}
          <Link
            href="/signin/client/register"
            className="font-semibold text-gray-700 transition-colors hover:text-blue"
          >
            Créer un compte
          </Link>
        </Text>
        <Text className="leading-loose text-gray-500">
          Vous êtes administrateur ?{' '}
          <Link
            href="/signin"
            className="font-semibold text-gray-700 transition-colors hover:text-blue"
          >
            Connexion Admin
          </Link>
        </Text>
      </div>
    </>
  );
}


