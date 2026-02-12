import { z } from 'zod';
import { messages } from '@/config/messages';
import { validateEmail, validatePassword } from './common-rules';

const familyMemberSchema = z.object({
  first_name: z.string().min(1, { message: messages.firstNameRequired }),
  last_name: z.string().min(1, { message: messages.lastNameRequired }),
  relationship: z.string().min(1, { message: 'La relation est requise' }),
  date_of_birth: z.string().optional(),
  nationality: z.string().optional(),
  passport_number: z.string().optional(),
  phone: z.string().optional(),
  email: z
    .string()
    .optional()
    .refine((v) => !v || v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
      message: messages.invalidEmail,
    }),
});

export const createClientSchema = z
  .object({
    client_type: z.enum(['single', 'family'], {
      required_error: 'Choisissez le type de client',
    }),
    first_name: z.string().min(1, { message: messages.firstNameRequired }),
    last_name: z.string().min(1, { message: messages.lastNameRequired }),
    email: validateEmail,
    password: validatePassword,
    phone: z.string().optional(),
    date_of_birth: z.string().optional(),
    nationality: z.string().optional(),
    passport_number: z.string().optional(),
    address: z.string().optional(),
    family_members: z.array(familyMemberSchema).optional().default([]),
  });

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type FamilyMemberInput = z.infer<typeof familyMemberSchema>;
