import path from 'node:path';

/** Comptes de TEST créés par api/database/seeders/E2eSeeder.php (base e2e jetable). */
export const PASSWORD = 'E2e#Test2026!';

export const USERS = {
  owner: { email: 'owner@e2e.test', name: 'Sophie Propriétaire' },
  assistant: { email: 'assistant@e2e.test', name: 'Karim Adjoint' },
  client: { email: 'amina@e2e.test', name: 'Amina Diallo' },
  company: { email: 'rh@usinage.e2e.test', name: 'Julie RH' },
} as const;

export const CABINET = { name: 'Cabinet Horizon', slug: 'cabinet-horizon' };

/** Session enregistrée de chaque rôle (étape « connexion »). */
export const authState = (role: keyof typeof USERS) => path.join(__dirname, '.auth', `${role}.json`);
