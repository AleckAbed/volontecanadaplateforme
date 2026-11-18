import { redirect } from 'next/navigation';

/** (2.16) Un questionnaire s'envoie maintenant comme un envoi d'un seul formulaire. */
export default function LegacyQuestionnaireSendPage() {
  redirect('/envois/nouveau');
}
