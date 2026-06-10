import { z } from 'zod';

/**
 * NOTE i18n : les messages sont capturés au chargement du module. Pour avoir des
 * messages localisés, il faudrait soit utiliser `messages` de @/config/messages
 * (Proxy localisé) avec des clés existantes, soit refactorer en errorMap Zod.
 * Ici on utilise des messages multilingues simples via une fonction utilitaire.
 */
function localMsg(fr: string, en: string, es: string): string {
  if (typeof window === 'undefined') return fr;
  try {
    const v = localStorage.getItem('app_language');
    if (v === 'en') return en;
    if (v === 'es') return es;
  } catch {}
  return fr;
}

export const createServiceSchema = z.object({
  serviceName: z
    .string()
    .min(1, { message: localMsg('Le nom du service est requis', 'Service name is required', 'El nombre del servicio es requerido') })
    .min(3, { message: localMsg('Le nom doit contenir au moins 3 caractères', 'Name must be at least 3 characters', 'El nombre debe tener al menos 3 caracteres') }),
  description: z
    .string()
    .min(1, { message: localMsg('La description est requise', 'Description is required', 'La descripción es requerida') })
    .min(10, { message: localMsg('La description doit contenir au moins 10 caractères', 'Description must be at least 10 characters', 'La descripción debe tener al menos 10 caracteres') }),
  category: z
    .string()
    .min(1, { message: localMsg('La catégorie est requise', 'Category is required', 'La categoría es requerida') }),
  duration: z
    .string()
    .min(1, { message: localMsg('La durée est requise', 'Duration is required', 'La duración es requerida') }),
  status: z.enum(['active', 'inactive', 'pending'], {
    required_error: localMsg('Le statut est requis', 'Status is required', 'El estado es requerido'),
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

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
