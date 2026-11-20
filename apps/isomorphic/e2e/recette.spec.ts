import { execSync } from 'node:child_process';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { PASSWORD, USERS, authState } from './fixtures';
import { totp } from './totp';

/**
 * S21 — Corrections de la recette en préproduction (retours 1 à 18), vérifiées dans un
 * vrai navigateur. Les numéros renvoient à la liste de recette (docs/PLAN_DE_TEST.html).
 */

const apiDir = path.resolve(__dirname, '../../../../api');
const e2eEnv = { ...process.env, APP_ENV: 'e2e', DB_DATABASE: path.join(apiDir, 'database', 'e2e.sqlite') };

/** Lien d'activation d'un propriétaire de cabinet neuf (les courriels ne partent pas en e2e). */
function activationToken(): string {
  const out = execSync('php artisan e2e:activation-link', { cwd: apiDir, env: e2eEnv }).toString().trim().split(/\r?\n/);
  return out[out.length - 1];
}

test('R1/R6 — activation du compte avec la double authentification, puis tableau de bord sans boucle', async ({ page }) => {
  const token = activationToken();
  await page.goto(`/auth/definir-mot-de-passe?token=${encodeURIComponent(token)}`);

  await expect(page.getByRole('heading', { name: 'Activez votre compte' })).toBeVisible();
  await page.getByLabel('Mot de passe', { exact: true }).fill('Activation#2026x');
  await page.getByLabel('Confirmer le mot de passe').fill('Activation#2026x');
  await page.getByRole('button', { name: 'Continuer' }).click();

  await expect(page.getByRole('heading', { name: 'Protégez votre compte' })).toBeVisible();
  await page.getByRole('button', { name: /Application d’authentification/ }).click();
  const secret = (await page.getByTestId('totp-secret').textContent())!.trim();
  await page.getByLabel('Code de vérification').fill(totp(secret));
  await page.getByRole('button', { name: 'Vérifier et activer mon compte' }).click();

  await expect(page.getByRole('heading', { name: 'Notez vos codes de secours' })).toBeVisible();
  await expect(page.getByTestId('recovery-codes').locator('li')).toHaveCount(8);
  await page.getByRole('button', { name: /J’ai noté mes codes/ }).click();

  // Session ouverte directement : le tableau de bord s'affiche, pas de chargement sans fin.
  await page.waitForURL((url) => !url.pathname.startsWith('/auth/'));
  await expect(page.getByText('Action requise', { exact: true })).toBeVisible();
  await page.goto('/admin/clients');
  await expect(page).toHaveURL(/\/admin\/clients/);
  await expect(page.locator('[aria-label="Chargement"]')).toHaveCount(0);
});

test('R1 — un cabinet demande son ouverture (plus d’inscription libre)', async ({ page }) => {
  await page.goto('/auth/inscription');
  await expect(page.getByRole('heading', { name: 'Demander l’ouverture de votre cabinet' })).toBeVisible();
  await expect(page.getByLabel('Mot de passe')).toHaveCount(0);
  await page.getByLabel('Nom du cabinet').fill('Immigration Rive-Sud');
  await page.getByLabel('Nom complet').fill('Paul Demandeur');
  await page.getByLabel('Courriel professionnel').fill('paul@rivesud.e2e.test');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Envoyer ma demande' }).click();
  await expect(page.getByRole('heading', { name: 'Demande envoyée' })).toBeVisible();
});

test('R2 — chaque espace a sa page de connexion, et l’accueil demande le type de compte', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/connexion$/);
  await expect(page.getByRole('heading', { name: 'Bienvenue. Qui êtes-vous ?' })).toBeVisible();

  const spaces: [string, RegExp, string][] = [
    ['Je suis client', /\/auth\/client-signin/, 'client'],
    ['Je travaille dans un cabinet', /\/auth\/admin-signin/, 'firm'],
    ['Je représente une entreprise', /\/entreprise\/connexion/, 'company'],
    ['Je suis collaborateur externe', /\/collab\/login/, 'collaborator'],
  ];
  for (const [label, url, actor] of spaces) {
    await page.goto('/connexion');
    await page.getByRole('link', { name: new RegExp(label) }).click();
    await expect(page).toHaveURL(url);
    await expect(page.locator(`[data-actor="${actor}"]`)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Choisir un autre espace' })).toBeVisible();
    await expect(page.getByText(/Join 30,000|Start turning your ideas|Signe avec/)).toHaveCount(0);
  }
});

test.describe('Portail client', () => {
  test.use({ storageState: authState('client') });

  test('R17 — un client n’ouvre jamais une page du cabinet', async ({ page }) => {
    await page.goto('/admin/clients');
    await expect(page).toHaveURL((url) => url.pathname === '/');
    await page.goto('/analytics');
    await expect(page).toHaveURL((url) => url.pathname === '/');
    await expect(page.getByText('Unauthenticated.')).toHaveCount(0);
  });
});

test.describe.serial('Cabinet : propriétaire', () => {
  test.use({ storageState: authState('owner') });

  test('R8 — menu en casse française et « Accueil » traduit', async ({ page }) => {
    await page.goto('/');
    const menu = page.locator('aside, nav').first();
    await expect(menu.getByRole('link', { name: 'Accueil' })).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Rendez-vous' })).toBeVisible();
    await expect(menu.getByText('Rendez-Vous', { exact: true })).toHaveCount(0);
  });

  test('R16 — la fiche d’un client inscrit montre « Espace client actif », pas « Inviter »', async ({ page }) => {
    await page.goto('/admin/clients');
    await page.getByText(USERS.client.name).first().click();
    await expect(page).toHaveURL(/\/admin\/clients\/\d+/);
    await expect(page.getByText('Espace client actif')).toBeVisible();
    await expect(page.getByRole('button', { name: /Inviter à créer son espace/ })).toHaveCount(0);
  });

  test('R11/R12/R14 — modification d’un client : langue, téléphone international, pas de mot de passe', async ({ page }) => {
    await page.goto('/admin/clients');
    await page.getByText(USERS.client.name).first().click();
    await page.waitForURL(/\/admin\/clients\/\d+$/);
    await page.goto(`${page.url()}/edit`);
    await expect(page.getByLabel(/Langue de communication/)).toBeVisible();
    await expect(page.getByLabel('Pays de l’indicatif').first()).toBeVisible();
    await expect(page.getByLabel(/Mot de passe/)).toHaveCount(0);
  });

  test('R9 — le propriétaire masque « Facturation » aux adjoints', async ({ page }) => {
    await page.goto('/admin/equipe');
    const box = page.getByRole('checkbox', { name: 'Facturation — Adjoint' });
    await expect(box).toBeChecked();
    await box.uncheck();
    await page.getByRole('button', { name: 'Enregistrer les menus des rôles' }).click();
    await expect(page.getByText('Menus des rôles enregistrés.')).toBeVisible();
  });
});

test.describe('Cabinet : adjoint après réglage', () => {
  test.use({ storageState: authState('assistant') });

  test('R9 — l’adjoint ne voit plus « Facturation » et ne peut pas l’ouvrir', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Action requise', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Facturation' })).toHaveCount(0);
    await page.goto('/facturation');
    await expect(page).toHaveURL((url) => url.pathname === '/');
  });
});
