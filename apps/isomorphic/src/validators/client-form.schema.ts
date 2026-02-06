import { z } from 'zod';
import { fileSchema } from '@/validators/common-rules';

// Schéma de validation pour le formulaire client basé sur le PDF form1.pdf

// Étape 1: Détails de la demande et informations personnelles
export const clientFormStep1Schema = z.object({
  // Détails de la demande
  numberOfFamilyMembers: z.string().min(1, { message: 'Le nombre de membres de famille est requis' }),
  preferredLanguageCorrespondence: z.string().min(1, { message: 'La langue de correspondance est requise' }),
  preferredLanguageInterview: z.string().min(1, { message: 'La langue d\'entrevue est requise' }),
  hasCSQ: z.enum(['yes', 'no'], { required_error: 'Veuillez indiquer si vous avez un CSQ' }),
  csqNumber: z.string().optional(),
  csqApplicationDate: z.string().optional(),
  
  // Renseignements personnels
  lastName: z.string().min(1, { message: 'Le nom de famille est requis' }),
  firstName: z.string().optional(),
  uci: z.string().optional(),
  
  // Caractéristiques physiques
  sex: z.string().min(1, { message: 'Le sexe est requis' }),
  eyeColor: z.string().min(1, { message: 'La couleur des yeux est requise' }),
  height: z.string().min(1, { message: 'La taille est requise' }),
  
  // Renseignements sur la naissance
  dateOfBirth: z.string().min(1, { message: 'La date de naissance est requise' }),
  placeOfBirth: z.string().min(1, { message: 'Le lieu de naissance est requis' }),
  countryOfBirth: z.string().min(1, { message: 'Le pays de naissance est requis' }),
});

// Étape 2: Citoyenneté, résidence et état matrimonial
export const clientFormStep2Schema = z.object({
  // Citoyenneté(s)
  citizenship1: z.string().optional(),
  citizenship2: z.string().optional(),
  
  // Dernière entrée au Canada
  lastEntryDate: z.string().optional(),
  lastEntryPlace: z.string().optional(),
  
  // Pays de résidence antérieur
  hasPreviousResidence: z.enum(['yes', 'no']).optional(),
  previousResidenceDetails: z.string().optional(),
  
  // État matrimonial actuel
  currentMaritalStatus: z.string().min(1, { message: 'L\'état matrimonial est requis' }),
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
  city: z.string().min(1, { message: 'La ville est requise' }),
  province: z.string().optional(),
  country: z.string().min(1, { message: 'Le pays est requis' }),
  postalCode: z.string().optional(),
});

// Étape 3: Passeport, pièce d'identité et scolarité/emploi
export const clientFormStep3Schema = z.object({
  // Passeport
  passportNumber: z.string().min(1, { message: 'Le numéro de passeport est requis' }),
  passportIssueCountry: z.string().min(1, { message: 'Le pays de délivrance est requis' }),
  passportIssueDate: z.string().min(1, { message: 'La date de délivrance est requise' }),
  passportExpiryDate: z.string().min(1, { message: 'La date d\'expiration est requise' }),
  
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
  dateOfBirth: z.string().optional(),
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

// Étape 9: Section A - Lien de parenté (répétition de certaines infos famille)
export const clientFormStep9Schema = z.object({
  applicantInfo: familyMemberSchema.optional(),
  spouseInfo: familyMemberSchema.optional(),
  motherInfo: familyMemberSchema.optional(),
  fatherInfo: familyMemberSchema.optional(),
});

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
    message: 'Vous devez accepter les termes et conditions',
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
export type ClientFormStep9Input = z.infer<typeof clientFormStep9Schema>;
export type ClientFormStep10Input = z.infer<typeof clientFormStep10Schema>;
export type EducationEntry = z.infer<typeof educationEntrySchema>;
export type AddressEntry = z.infer<typeof addressEntrySchema>;
export type PersonalBackgroundEntry = z.infer<typeof personalBackgroundEntrySchema>;
export type TravelEntry = z.infer<typeof travelEntrySchema>;
export type FamilyMember = z.infer<typeof familyMemberSchema>;
