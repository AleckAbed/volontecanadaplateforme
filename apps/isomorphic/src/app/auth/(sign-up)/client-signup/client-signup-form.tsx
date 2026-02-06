'use client';

import Link from 'next/link';
import { useState } from 'react';
import { SubmitHandler } from 'react-hook-form';
import { Password, Checkbox, Button, Input, Text } from 'rizzui';
import { useMedia } from '@core/hooks/use-media';
import { Form } from '@core/ui/form';
import { routes } from '@/config/routes';
import { clientSignUpSchema, ClientSignUpSchema } from '@/validators/client-signup.schema';
import { useAuth } from '@/hooks/useAuth';

const initialValues: ClientSignUpSchema = {
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  password_confirmation: '',
  phone: '',
  isAgreed: false,
};

export default function ClientSignUpForm() {
  const isMedium = useMedia('(max-width: 1200px)', false);
  const { registerClient, isLoading } = useAuth();
  const [reset, setReset] = useState({});

  const onSubmit: SubmitHandler<ClientSignUpSchema> = async (data) => {
    await registerClient({
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      password: data.password,
      password_confirmation: data.password_confirmation,
      phone: data.phone,
    });
    
    // Reset form après inscription réussie
    setReset({ ...initialValues, isAgreed: false });
  };

  return (
    <>
      <Form<ClientSignUpSchema>
        validationSchema={clientSignUpSchema}
        resetValues={reset}
        onSubmit={onSubmit}
        useFormProps={{
          defaultValues: initialValues,
        }}
      >
        {({ register, formState: { errors } }) => (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                type="text"
                size={isMedium ? 'lg' : 'xl'}
                label="Prénom"
                placeholder="Votre prénom"
                rounded="pill"
                className="[&>label>span]:font-medium"
                {...register('first_name')}
                error={errors.first_name?.message}
                disabled={isLoading}
              />
              <Input
                type="text"
                size={isMedium ? 'lg' : 'xl'}
                label="Nom"
                placeholder="Votre nom"
                rounded="pill"
                className="[&>label>span]:font-medium"
                {...register('last_name')}
                error={errors.last_name?.message}
                disabled={isLoading}
              />
            </div>
            <Input
              type="email"
              size={isMedium ? 'lg' : 'xl'}
              label="Email"
              placeholder="Votre email"
              rounded="pill"
              className="[&>label>span]:font-medium"
              {...register('email')}
              error={errors.email?.message}
              disabled={isLoading}
            />
            <Input
              type="tel"
              size={isMedium ? 'lg' : 'xl'}
              label="Téléphone (optionnel)"
              placeholder="Votre numéro de téléphone"
              rounded="pill"
              className="[&>label>span]:font-medium"
              {...register('phone')}
              error={errors.phone?.message}
              disabled={isLoading}
            />
            <Password
              label="Mot de passe"
              placeholder="Créez un mot de passe"
              size={isMedium ? 'lg' : 'xl'}
              rounded="pill"
              className="[&>label>span]:font-medium"
              {...register('password')}
              error={errors.password?.message}
              disabled={isLoading}
            />
            <Password
              label="Confirmer le mot de passe"
              placeholder="Confirmez votre mot de passe"
              size={isMedium ? 'lg' : 'xl'}
              rounded="pill"
              className="[&>label>span]:font-medium"
              {...register('password_confirmation')}
              error={errors.password_confirmation?.message}
              disabled={isLoading}
            />
            <div className="flex items-start pb-2 text-gray-700">
              <Checkbox 
                {...register('isAgreed')} 
                variant="flat"
                disabled={isLoading}
              />
              <p className="-mt-0.5 ps-2 text-sm leading-relaxed">
                J&apos;accepte les{' '}
                <Link
                  href="/"
                  className="font-semibold text-blue transition-colors hover:text-gray-1000"
                >
                  Conditions d&apos;utilisation
                </Link>{' '}
                et la{' '}
                <Link
                  href="/"
                  className="font-semibold text-blue transition-colors hover:text-gray-1000"
                >
                  Politique de confidentialité
                </Link>
              </p>
            </div>
            {errors.isAgreed && (
              <Text className="text-red-500 text-sm">{errors.isAgreed.message}</Text>
            )}
            <Button
              className="border-primary-light w-full border-2 text-base font-medium"
              type="submit"
              size={isMedium ? 'lg' : 'xl'}
              rounded="pill"
              isLoading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Création du compte...' : 'Créer mon compte'}
            </Button>
          </div>
        )}
      </Form>
      <Text className="mt-5 text-center text-[15px] leading-loose text-gray-500 lg:text-start xl:mt-7 xl:text-base">
        Vous avez déjà un compte ?{' '}
        <Link
          href="/auth/client-signin"
          className="font-semibold text-gray-700 transition-colors hover:text-blue"
        >
          Se connecter
        </Link>
      </Text>
    </>
  );
}

