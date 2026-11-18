import { redirect } from 'next/navigation';

/** (2.16) Les questionnaires se retrouvent maintenant dans « Envois ». */
export default function LegacyQuestionnairesPage() {
  redirect('/envois');
}
