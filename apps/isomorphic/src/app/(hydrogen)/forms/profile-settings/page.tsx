import { metaObject } from '@/config/site.config';
import AdminProfileSettings from '@/app/shared/account-settings/admin-profile-settings';

export const metadata = {
  ...metaObject('Mon profil'),
};

export default function ProfileSettingsFormPage() {
  return <AdminProfileSettings />;
}
