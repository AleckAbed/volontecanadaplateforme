import { z } from 'zod';
import { tMsg } from '@/validators/i18n-helper';

// Schéma de validation pour le formulaire de parrainage (Sponsor Form)

// Type pour les personnes qui connaissent la relation
export const relationshipWitnessSchema = z.object({
  lastName: z.string().optional(),
  firstName: z.string().optional(),
  hasFamilyRelationship: z.string().optional(),
  relationshipType: z.string().optional(),
  meetingDate: z.string().optional(),
});

// Type pour les cérémonies/événements
export const ceremonyEventSchema = z.object({
  date: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  numberOfGuests: z.string().optional(),
  officiatedBy: z.string().optional(),
});

// Type pour l'historique professionnel
export const employmentHistorySchema = z.object({
  fromDate: z.string().optional(), // Format: YYYY-MM
  toDate: z.string().optional(), // Format: YYYY-MM
  employerName: z.string().optional(),
  employerAddress: z.string().optional(),
  employerPhone: z.string().optional(),
  profession: z.string().optional(),
  monthlySalary: z.string().optional(),
});

// Type pour les personnes à charge
export const dependentPersonSchema = z.object({
  name: z.string().optional(),
  relationship: z.string().optional(),
  dateOfBirth: z.string().optional(),
});

// Type pour l'historique des adresses
export const addressHistorySchema = z.object({
  fromDate: z.string().optional(), // Format: YYYY-MM
  toDate: z.string().optional(), // Format: YYYY-MM
  street: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
});

// Type pour les relations antérieures
export const previousRelationshipSchema = z.object({
  lastName: z.string().optional(),
  firstName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  placeOfBirth: z.string().optional(),
  deathDate: z.string().optional(),
});

// Étape 1: Renseignements concernant la relation
export const sponsorFormStep1Schema = z.object({
  // Question 16: Première rencontre
  firstMeetingDate: z.string().optional(),
  firstMeetingPlace: z.string().optional(),
  firstMeetingCircumstances: z.string().optional(),
  
  // Question 17: Présentation
  wasIntroduced: z.string().optional(),
  introducedBy: z.string().optional(),
  
  // Question 18: Contact avant rencontre
  hadContactBeforeMeeting: z.enum(['yes', 'no']).optional(),
  contactBeforeMeetingDetails: z.string().optional(),
  
  // Question 19: Amis/famille au courant
  familyAwareOfRelationship: z.string().optional(),
  familyAwareDetails: z.string().optional(),
  
  // Tableau: Personnes qui connaissent la relation
  relationshipWitnesses: z.array(relationshipWitnessSchema).optional(),
  
  // Question 20: Cérémonies/événements
  ceremonies: z.array(ceremonyEventSchema).optional(),
});

// Étape 2: Renseignements sur le répondant - Données personnelles
export const sponsorFormStep2Schema = z.object({
  // Données personnelles
  lastName: z.string().min(1, { message: tMsg('Le nom de famille est requis', 'Surname is required', 'El apellido es requerido') }),
  firstName: z.string().min(1, { message: tMsg('Le prénom est requis', 'First name is required', 'El nombre es requerido') }),
  phoneNumber: z.string().optional(),
  dateAndPlaceOfBirth: z.string().optional(),
  nationality: z.string().optional(),
  whereLivedLast5Years: z.string().optional(),
  maritalStatus: z.string().optional(),
  marriageDate: z.string().optional(),
  spouseName: z.string().optional(),
  
  // Avez-vous déjà été marié
  hasBeenMarried: z.enum(['yes', 'no']).optional(),
  
  // Si oui, informations sur l'ex-époux
  exSpouseName: z.string().optional(),
  exSpouseDateOfBirth: z.string().optional(),
  relationshipStartDate: z.string().optional(),
  relationshipEndDate: z.string().optional(),
  
  // Antécédents professionnels
  employmentHistory: z.array(employmentHistorySchema).optional(),
});

// Étape 3: Renseignements sur le répondant - Suite
export const sponsorFormStep3Schema = z.object({
  // Question 11: Autres parrainages
  hasOtherSponsorships: z.enum(['yes', 'no']).optional(),
  otherSponsorshipsDetails: z.string().optional(),
  
  // Question 12: Autres personnes à charge
  otherDependents: z.array(dependentPersonSchema).optional(),
  
  // Question 13: Niveau de scolarité
  educationLevel: z.string().optional(),
  
  // Question 14: Historique des adresses
  addressHistory: z.array(addressHistorySchema).optional(),
  
  // Question 15: Relations antérieures
  hasPreviousRelationships: z.enum(['yes', 'no']).optional(),
  previousRelationships: z.array(previousRelationshipSchema).optional(),
});

export type SponsorFormStep1Input = z.infer<typeof sponsorFormStep1Schema>;
export type SponsorFormStep2Input = z.infer<typeof sponsorFormStep2Schema>;
export type SponsorFormStep3Input = z.infer<typeof sponsorFormStep3Schema>;
export type RelationshipWitness = z.infer<typeof relationshipWitnessSchema>;
export type CeremonyEvent = z.infer<typeof ceremonyEventSchema>;
export type EmploymentHistory = z.infer<typeof employmentHistorySchema>;
export type DependentPerson = z.infer<typeof dependentPersonSchema>;
export type AddressHistory = z.infer<typeof addressHistorySchema>;
export type PreviousRelationship = z.infer<typeof previousRelationshipSchema>;



