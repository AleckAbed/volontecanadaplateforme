import { z } from 'zod';
import { fileSchema } from '@/validators/common-rules';
import { tMsg } from '@/validators/i18n-helper';

// Schéma de validation pour le formulaire client basé sur le PDF form1.pdf

// Étape 1: Détails de la demande et informations personnelles
export const clientFormStep1Schema = z.object({
  // Détails de la demande
  numberOfFamilyMembers: z.string().min(1, { message: tMsg('Le nombre de membres de famille est requis', 'Number of family members is required', 'El número de miembros de familia es requerido') }),
  preferredLanguageCorrespondence: z.string().min(1, { message: tMsg('La langue de correspondance est requise', 'Correspondence language is required', 'El idioma de correspondencia es requerido') }),
  preferredLanguageInterview: z.string().min(1, { message: tMsg("La langue d'entrevue est requise", 'Interview language is required', 'El idioma de entrevista es requerido') }),
  hasCSQ: z.enum(['yes', 'no'], { required_error: tMsg('Veuillez indiquer si vous avez un CSQ', 'Please indicate if you have a CSQ', 'Por favor indique si tiene un CSQ') }),
  csqNumber: z.string().optional(),
  csqApplicationDate: z.string().optional(),

  lastName: z.string().min(1, { message: tMsg('Le nom de famille est requis', 'Surname is required', 'El apellido es requerido') }),
  firstName: z.string().optional(),
  uci: z.string().optional(),

  sex: z.string().min(1, { message: tMsg('Le sexe est requis', 'Sex is required', 'El sexo es requerido') }),
  eyeColor: z.string().min(1, { message: tMsg('La couleur des yeux est requise', 'Eye color is required', 'El color de ojos es requerido') }),
  height: z.string().min(1, { message: tMsg('La taille est requise', 'Height is required', 'La altura es requerida') }),

  dateOfBirth: z.string().min(1, { message: tMsg('La date de naissance est requise', 'Date of birth is required', 'La fecha de nacimiento es requerida') }),
  placeOfBirth: z.string().min(1, { message: tMsg('La ville de naissance est requise', 'City of birth is required', 'La ciudad de nacimiento es requerida') }),
  countryOfBirth: z.string().min(1, { message: tMsg('Le pays de naissance est requis', 'Country of birth is required', 'El país de nacimiento es requerido') }),
});

// Étape 2: Citoyenneté, résidence et état matrimonial
export const clientFormStep2Schema = z.object({
  // Nombre de citoyennetés (1 par défaut), puis autant de pays que ce nombre
  numberOfCitizenships: z.string().min(1, { message: tMsg('Veuillez indiquer le nombre de citoyennetés', 'Please indicate the number of citizenships', 'Por favor indique el número de ciudadanías') }),
  citizenship1: z.string().optional(),
  citizenship2: z.string().optional(),
  citizenship3: z.string().optional(),
  citizenship4: z.string().optional(),
  citizenship5: z.string().optional(),
  
  // Dernière entrée au Canada
  lastEntryDate: z.string().optional(),
  lastEntryPlace: z.string().optional(),
  
  // Pays de résidence antérieur
  hasPreviousResidence: z.enum(['yes', 'no']).optional(),
  previousResidenceDetails: z.string().optional(),
  
  // État matrimonial actuel
  currentMaritalStatus: z.string().min(1, { message: tMsg("L'état matrimonial est requis", 'Marital status is required', 'El estado civil es requerido') }),
  marriageDate: z.string().optional(),
  spouseLastName: z.string().optional(),
  spouseFirstName: z.string().optional(),
  
  // Ancien conjoint
  hasPreviousSpouse: z.enum(['yes', 'no']).optional(),
  previousSpouseLastName: z.string().optional(),
  previousSpouseFirstName: z.string().optional(),
  previousSpouseDateOfBirth: z.string().optional(),
  previousSpouseRelationshipType: z.string().optional(),
  previousSpouseRelationshipStartDate: z.string().optional(),
  previousSpouseRelationshipEndDate: z.string().optional(),
  
  // Coordonnées
  apartmentUnit: z.string().optional(),
  streetNumber: z.string().optional(),
  streetName: z.string().optional(),
  city: z.string().min(1, { message: tMsg('La ville est requise', 'City is required', 'La ciudad es requerida') }),
  province: z.string().optional(),
  country: z.string().min(1, { message: tMsg('Le pays est requis', 'Country is required', 'El país es requerido') }),
  postalCode: z.string().optional(),
}).refine(
  (data) => {
    const n = parseInt(String(data.numberOfCitizenships || '1'), 10) || 1;
    if (n >= 1 && !data.citizenship1?.trim()) return false;
    if (n >= 2 && !data.citizenship2?.trim()) return false;
    if (n >= 3 && !data.citizenship3?.trim()) return false;
    if (n >= 4 && !data.citizenship4?.trim()) return false;
    if (n >= 5 && !data.citizenship5?.trim()) return false;
    return true;
  },
  { message: tMsg('Veuillez sélectionner le pays pour chaque citoyenneté indiquée.', 'Please select a country for each citizenship indicated.', 'Por favor seleccione un país para cada ciudadanía indicada.'), path: ['citizenship1'] }
);

// Étape 3: Passeport, pièce d'identité et scolarité/emploi
export const clientFormStep3Schema = z.object({
  // Passeport
  passportNumber: z.string().min(1, { message: tMsg('Le numéro de passeport est requis', 'Passport number is required', 'El número de pasaporte es requerido') }),
  passportIssueCountry: z.string().min(1, { message: tMsg('Le pays de délivrance est requis', 'Country of issue is required', 'El país de expedición es requerido') }),
  passportIssueDate: z.string().min(1, { message: tMsg('La date de délivrance est requise', 'Date of issue is required', 'La fecha de expedición es requerida') }),
  passportExpiryDate: z.string().min(1, { message: tMsg("La date d'expiration est requise", 'Expiry date is required', 'La fecha de expiración es requerida') }),
  
  // Pièce d'identité nationale
  nationalIdNumber: z.string().optional(),
  nationalIdIssueCountry: z.string().optional(),
  nationalIdIssueDate: z.string().optional(),
  nationalIdExpiryDate: z.string().optional(),
  
  // Scolarité
  highestEducationLevel: z.string().optional(),
  totalYearsOfStudy: z.string().optional(),
  
  // Emploi
  currentEmployment: z.string().optional(),
  plannedEmployment: z.string().optional(),
});

// Étape 4: Scolarité détaillée
export const educationEntrySchema = z.object({
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  certificateType: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  institutionName: z.string().optional(),
});

export const clientFormStep4Schema = z.object({
  elementaryYears: z.string().optional(),
  secondaryYears: z.string().optional(),
  universityYears: z.string().optional(),
  vocationalYears: z.string().optional(),
  educationHistory: z.array(educationEntrySchema).optional(),
});

// Étape 5: Adresses
export const addressEntrySchema = z.object({
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  streetAndNumber: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
});

export const clientFormStep5Schema = z.object({
  addressHistory: z.array(addressEntrySchema).optional(),
});

// Étape 6: Antécédents personnels
export const personalBackgroundEntrySchema = z.object({
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  activity: z.string().optional(),
  city: z.string().optional(),
  statusInCountry: z.string().optional(),
  country: z.string().optional(),
  employerName: z.string().optional(),
});

export const clientFormStep6Schema = z.object({
  personalBackground: z.array(personalBackgroundEntrySchema).optional(),
});

// Étape 7: Famille (Demandeur, Époux, Mère, Père, Enfants, Frères et sœurs)
export const familyMemberSchema = z.object({
  fullName: z.string().optional(),
  lastName: z.string().optional(),
  firstName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  placeOfBirth: z.string().optional(),
  countryOfBirth: z.string().optional(),
  maritalStatus: z.string().optional(),
  email: z.string().optional(),
  currentAddress: z.string().optional(),
});

export const clientFormStep7Schema = z.object({
  applicant: familyMemberSchema.optional(),
  spouse: familyMemberSchema.optional(),
  mother: familyMemberSchema.optional(),
  father: familyMemberSchema.optional(),
  children: z.array(familyMemberSchema).optional(),
  siblings: z.array(familyMemberSchema).optional(),
});

// Étape 8: Liste des voyages
export const travelEntrySchema = z.object({
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  duration: z.string().optional(),
  placeVisited: z.string().optional(),
  purpose: z.string().optional(),
  details: z.string().optional(),
});

export const clientFormStep8Schema = z.object({
  noTrips: z.boolean().optional(),
  travels: z.array(travelEntrySchema).optional(),
});

// Étape 9 du PDF original (Section A - Lien de parenté) a été fusionnée dans
// l'étape 7 (Famille). Le step-9.tsx n'existe pas — on saute directement de
// step-8 (voyages) à step-10 (sécurité) dans le stepper.
// L'utilisateur voit "Étape 9 sur 10" car le stepper compte séquentiellement.

// Étape 10: Questions de sécurité
export const clientFormStep10Schema = z.object({
  questionA: z.enum(['yes', 'no']).optional(),
  questionB: z.enum(['yes', 'no']).optional(),
  questionC: z.enum(['yes', 'no']).optional(),
  questionD: z.enum(['yes', 'no']).optional(),
  questionE: z.enum(['yes', 'no']).optional(),
  questionF: z.enum(['yes', 'no']).optional(),
  questionG: z.enum(['yes', 'no']).optional(),
  questionH: z.enum(['yes', 'no']).optional(),
  questionI: z.enum(['yes', 'no']).optional(),
  questionJ: z.enum(['yes', 'no']).optional(),
  questionK: z.enum(['yes', 'no']).optional(),
  securityDetails: z.string().optional(),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: tMsg('Vous devez accepter les termes et conditions', 'You must accept the terms and conditions', 'Debe aceptar los términos y condiciones'),
  }),
});

// Types
export type ClientFormStep1Input = z.infer<typeof clientFormStep1Schema>;
export type ClientFormStep2Input = z.infer<typeof clientFormStep2Schema>;
export type ClientFormStep3Input = z.infer<typeof clientFormStep3Schema>;
export type ClientFormStep4Input = z.infer<typeof clientFormStep4Schema>;
export type ClientFormStep5Input = z.infer<typeof clientFormStep5Schema>;
export type ClientFormStep6Input = z.infer<typeof clientFormStep6Schema>;
export type ClientFormStep7Input = z.infer<typeof clientFormStep7Schema>;
export type ClientFormStep8Input = z.infer<typeof clientFormStep8Schema>;
export type ClientFormStep10Input = z.infer<typeof clientFormStep10Schema>;
export type EducationEntry = z.infer<typeof educationEntrySchema>;
export type AddressEntry = z.infer<typeof addressEntrySchema>;
export type PersonalBackgroundEntry = z.infer<typeof personalBackgroundEntrySchema>;
export type TravelEntry = z.infer<typeof travelEntrySchema>;
export type FamilyMember = z.infer<typeof familyMemberSchema>;
