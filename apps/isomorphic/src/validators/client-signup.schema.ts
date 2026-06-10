import { z } from 'zod';
import { messages } from '@/config/messages';
import { tMsg } from './i18n-helper';

export const clientSignUpSchema = z.object({
  first_name: z.string().min(2, { message: tMsg('Le prénom doit contenir au moins 2 caractères', 'First name must be at least 2 characters', 'El nombre debe tener al menos 2 caracteres') }),
  last_name: z.string().min(2, { message: tMsg('Le nom doit contenir au moins 2 caractères', 'Last name must be at least 2 characters', 'El apellido debe tener al menos 2 caracteres') }),
  email: z.string().email({ message: messages.invalidEmail }),
  password: z
    .string()
    .min(8, { message: tMsg('Le mot de passe doit contenir au moins 8 caractères', 'Password must be at least 8 characters', 'La contraseña debe tener al menos 8 caracteres') })
    .regex(/[A-Z]/, { message: tMsg('Le mot de passe doit contenir au moins une majuscule', 'Password must contain at least one uppercase letter', 'La contraseña debe contener al menos una mayúscula') })
    .regex(/[a-z]/, { message: tMsg('Le mot de passe doit contenir au moins une minuscule', 'Password must contain at least one lowercase letter', 'La contraseña debe contener al menos una minúscula') })
    .regex(/[0-9]/, { message: tMsg('Le mot de passe doit contenir au moins un chiffre', 'Password must contain at least one number', 'La contraseña debe contener al menos un número') }),
  password_confirmation: z.string(),
  phone: z.string().optional(),
  isAgreed: z.boolean().refine((val) => val === true, {
    message: tMsg("Vous devez accepter les conditions d'utilisation", 'You must accept the terms of use', 'Debe aceptar las condiciones de uso'),
  }),
}).refine((data) => data.password === data.password_confirmation, {
  message: tMsg('Les mots de passe ne correspondent pas', 'Passwords do not match', 'Las contraseñas no coinciden'),
  path: ['password_confirmation'],
});

export type ClientSignUpSchema = z.infer<typeof clientSignUpSchema>;
