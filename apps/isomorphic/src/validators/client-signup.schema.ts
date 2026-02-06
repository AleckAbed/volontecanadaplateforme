import { z } from 'zod';
import { messages } from '@/config/messages';

// form zod validation schema
export const clientSignUpSchema = z.object({
  first_name: z.string().min(2, { message: 'Le prénom doit contenir au moins 2 caractères' }),
  last_name: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères' }),
  email: z.string().email({ message: messages.invalidEmail }),
  password: z
    .string()
    .min(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
    .regex(/[A-Z]/, { message: 'Le mot de passe doit contenir au moins une majuscule' })
    .regex(/[a-z]/, { message: 'Le mot de passe doit contenir au moins une minuscule' })
    .regex(/[0-9]/, { message: 'Le mot de passe doit contenir au moins un chiffre' }),
  password_confirmation: z.string(),
  phone: z.string().optional(),
  isAgreed: z.boolean().refine((val) => val === true, {
    message: 'Vous devez accepter les conditions d\'utilisation',
  }),
}).refine((data) => data.password === data.password_confirmation, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['password_confirmation'],
});

// generate form types from zod validation schema
export type ClientSignUpSchema = z.infer<typeof clientSignUpSchema>;


