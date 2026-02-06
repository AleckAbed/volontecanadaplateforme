'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { SubmitHandler } from 'react-hook-form';
import { Input, Button, Password, Checkbox, Text } from 'rizzui';
import { Form } from '@core/ui/form';
import { routes } from '@/config/routes';
import { loginSchema, LoginSchema } from '@/validators/login.schema';
import { useAuth } from '@/hooks/useAuth';

const initialValues: LoginSchema = {
  email: 'admin@cabinet-immigration.com',
  password: 'password',
  rememberMe: true,
};

export default function AdminSignInForm() {
  const [isMedium, setIsMedium] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const m = window.matchMedia('(max-width: 1200px)');
    setIsMedium(m.matches);
    const listener = () => setIsMedium(m.matches);
    m.addEventListener('change', listener);
    return () => m.removeEventListener('change', listener);
  }, []);
  const { loginAdmin, isLoading } = useAuth();

  const onSubmit: SubmitHandler<LoginSchema> = async (data) => {
    await loginAdmin({
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
          mode: 'onChange',
          defaultValues: initialValues,
        }}
      >
        {({ register, formState: { errors } }) => (
          <div className="space-y-5">
            <Input
              type="email"
              size={isMedium ? 'lg' : 'xl'}
              label="Email"
              placeholder="Entrez votre email"
              rounded="pill"
              className="[&>label>span]:font-medium"
              {...register('email')}
              error={errors.email?.message}
              disabled={isLoading}
            />
            <Password
              label="Mot de passe"
              placeholder="Entrez votre mot de passe"
              size={isMedium ? 'lg' : 'xl'}
              rounded="pill"
              className="[&>label>span]:font-medium"
              {...register('password')}
              error={errors.password?.message}
              disabled={isLoading}
            />
            <div className="flex items-center justify-between pb-2">
              <Checkbox
                {...register('rememberMe')}
                label="Se souvenir de moi"
                variant="flat"
                className="[&>label>span]:font-medium"
                disabled={isLoading}
              />
              <Link
                href={routes.auth.forgotPassword2}
                className="h-auto p-0 text-sm font-semibold text-blue underline transition-colors hover:text-gray-900 hover:no-underline"
              >
                Mot de passe oublié ?
              </Link>
            </div>
            <Button
              className="border-primary-light w-full border-2 text-base font-bold"
              type="submit"
              size={isMedium ? 'lg' : 'xl'}
              rounded="pill"
              isLoading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </div>
        )}
      </Form>
      <Text className="mt-5 text-center text-[15px] leading-loose text-gray-500 lg:text-start xl:mt-7 xl:text-base">
        Vous êtes un client ?{' '}
        <Link
          href="/auth/client-signin"
          className="font-semibold text-gray-700 transition-colors hover:text-blue"
        >
          Connexion Client
        </Link>
      </Text>
    </>
  );
}


