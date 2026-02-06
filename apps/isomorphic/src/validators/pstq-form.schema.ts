import { z } from 'zod';

// Schéma de validation pour le formulaire PSTQ (Programme de sélection des travailleurs qualifiés)

// Bloc A - Capital humain
export const pstqFormBlocASchema = z.object({
  // A1. Connaissance du français
  comprehension_orale: z.number().min(1).max(12),
  production_orale: z.number().min(1).max(12),
  comprehension_ecrite: z.number().min(1).max(12),
  production_ecrite: z.number().min(1).max(12),
  avec_conjoint: z.boolean(),
  
  // A2. Âge (calculé à la date d'extraction)
  date_naissance: z.string(), // Format: YYYY-MM-DD
  
  // A3. Expérience de travail (5 dernières années)
  experience_travail_mois: z.number().min(0),
  
  // A4. Niveau de scolarité (plus élevé retenu)
  niveau_scolarite: z.enum([
    'secondaire',
    'postsec_general_2ans',
    'technique_3ans',
    'univ_1er_cycle',
    'univ_2e_cycle',
    'univ_3e_cycle',
  ]),
});

// Bloc B - Réponse aux besoins du Québec
export const pstqFormBlocBSchema = z.object({
  // B1. Profession principale + diagnostic
  cnp_code: z.string().min(1),
  diagnostic: z.enum(['equilibre', 'leger_deficit', 'deficit']),
  experience_profession_mois: z.number().min(0),
  
  // B2. Diplôme obtenu au Québec
  diplome_quebec: z.enum([
    'aucun',
    'secondaire',
    'dep_900h',
    'technique_3ans',
    'univ_3_4ans',
    '2e_cycle',
    '3e_cycle',
  ]).optional(),
  
  // B3. Expérience de travail au Québec
  experience_quebec_mois: z.number().min(0),
  
  // B4. Expérience hors Montréal
  residence_hors_montreal_mois: z.number().min(0),
  travail_hors_montreal_mois: z.number().min(0),
  etudes_hors_montreal_mois: z.number().min(0),
  
  // B5. Offre d'emploi validée
  offre_emploi: z.boolean().optional(),
  offre_emploi_lieu: z.enum(['montreal', 'hors_montreal']).optional(),
  
  // B6. Autorisation d'exercer
  autorisation_exercer: z.boolean().optional(),
});

// Bloc C - Facteurs d'adaptation
export const pstqFormBlocCSchema = z.object({
  // C1. Études au Québec sans diplôme
  etudes_quebec_sans_diplome_mois: z.number().min(0),
  
  // C2. Famille au Québec
  famille_quebec: z.boolean().optional(),
  famille_quebec_lien: z.enum(['direct', 'via_conjoint']).optional(),
  
  // C3. Profil du conjoint
  conjoint_francais_comprehension_orale: z.number().min(1).max(12).optional(),
  conjoint_francais_production_orale: z.number().min(1).max(12).optional(),
  conjoint_francais_comprehension_ecrite: z.number().min(1).max(12).optional(),
  conjoint_francais_production_ecrite: z.number().min(1).max(12).optional(),
  conjoint_age: z.number().optional(),
  conjoint_experience_quebec_mois: z.number().min(0).optional(),
  conjoint_scolarite: z.enum([
    'secondaire',
    'postsec_general_2ans',
    'technique_3ans',
    'univ_1er_cycle',
    'univ_2e_cycle',
    'univ_3e_cycle',
  ]).optional(),
  conjoint_diplome_quebec: z.enum([
    'aucun',
    'secondaire',
    'dep_900h',
    'technique_3ans',
    'univ_3_4ans',
    '2e_cycle',
    '3e_cycle',
  ]).optional(),
});

// Schéma complet du formulaire PSTQ
export const pstqFormSchema = pstqFormBlocASchema.merge(pstqFormBlocBSchema).merge(pstqFormBlocCSchema);

export type PSTQFormInput = z.infer<typeof pstqFormSchema>;
export type PSTQFormBlocA = z.infer<typeof pstqFormBlocASchema>;
export type PSTQFormBlocB = z.infer<typeof pstqFormBlocBSchema>;
export type PSTQFormBlocC = z.infer<typeof pstqFormBlocCSchema>;



