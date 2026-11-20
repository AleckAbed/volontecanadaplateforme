'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { SubmitHandler } from 'react-hook-form';
import { Input, Button, Password, Checkbox, Text } from 'rizzui';
import { Form } from '@core/ui/form';
import { routes } from '@/config/routes';
import { loginSchema, LoginSchema } from '@/validators/login.schema';
import { useAuth } from '@/hooks/useAuth';
import TwoFactorStep, { TwoFactorChallenge } from './two-factor-step';

const initialValues: LoginSchema = {
  email: '',
  password: '',
  rememberMe: false,
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
  const [challenge, setChallenge] = useState<TwoFactorChallenge | null>(null);

  const onSubmit: SubmitHandler<LoginSchema> = async (data) => {
    const pending = await loginAdmin({
      email: data.email,
      password: data.password,
    });
    if (pending) setChallenge(pending);
  };

  if (challenge) {
    return <TwoFactorStep challenge={challenge} onCancel={() => setChallenge(null)} />;
  }

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
              rounded="lg"
              className="[&>label>span]:font-medium"
              {...register('email')}
              error={errors.email?.message}
              disabled={isLoading}
            />
            <Password
              label="Mot de passe"
              placeholder="Entrez votre mot de passe"
              size={isMedium ? 'lg' : 'xl'}
              rounded="lg"
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
                href="/auth/mot-de-passe-oublie"
                className="text-sm font-semibold text-[var(--auth-accent)] underline transition-colors hover:text-gray-900 hover:no-underline"
              >
                Mot de passe oublié ?
              </Link>
            </div>
            <Button
              className="w-full !bg-[var(--auth-accent)] text-base font-bold hover:!bg-[var(--auth-accent-dark)]"
              type="submit"
              size={isMedium ? 'lg' : 'xl'}
              rounded="lg"
              isLoading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </div>
        )}
      </Form>
      <Text className="mt-5 text-center text-[15px] leading-loose text-gray-500 lg:text-start xl:mt-7 xl:text-base">
        Nouveau cabinet ?{' '}
        <Link
          href="/auth/inscription"
          className="font-semibold text-[var(--auth-accent)] hover:underline"
        >
          Demander l’ouverture
        </Link>
      </Text>
    </>
  );
}


