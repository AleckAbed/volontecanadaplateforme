import { z } from 'zod';
import { messages } from '@/config/messages';

// form zod validation schema
export const createServiceSchema = z.object({
  serviceName: z
    .string()
    .min(1, { message: 'Le nom du service est requis' })
    .min(3, { message: 'Le nom doit contenir au moins 3 caractères' }),
  description: z
    .string()
    .min(1, { message: 'La description est requise' })
    .min(10, { message: 'La description doit contenir au moins 10 caractères' }),
  category: z
    .string()
    .min(1, { message: 'La catégorie est requise' }),
  price: z
    .string()
    .min(1, { message: 'Le prix est requis' }),
  duration: z
    .string()
    .min(1, { message: 'La durée est requise' }),
  status: z.enum(['active', 'inactive', 'pending'], {
    required_error: 'Le statut est requis',
  }),
  serviceColor: z
    .object({
      r: z.number(),
      g: z.number(),
      b: z.number(),
      a: z.number(),
    })
    .optional(),
});

// generate form types from zod validation schema
export type CreateServiceInput = z.infer<typeof createServiceSchema>;




