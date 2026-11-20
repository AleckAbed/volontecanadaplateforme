import { test, expect } from '@playwright/test';
import { PASSWORD, USERS, authState } from './fixtures';

test.describe('Cabinet : propriétaire', () => {
  test.use({ storageState: authState('owner') });

  test('l’accueil montre « Action requise » et le menu complet', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Action requise', { exact: true })).toBeVisible();
    const menu = page.locator('aside, nav').first();
    await expect(menu.getByRole('link', { name: 'Entreprises' })).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Équipe' })).toBeVisible();
  });

  test('créer une entreprise cliente et ouvrir sa fiche', async ({ page }) => {
    await page.goto('/admin/entreprises');
    await expect(page.getByRole('link', { name: 'Usinage Laval' })).toBeVisible();

    await page.getByRole('button', { name: 'Nouvelle entreprise' }).click();
    await page.getByLabel('Nom de l’entreprise').fill('Boulangerie du Nord');
    await page.getByLabel('Courriel de facturation').fill('compta@boulangerie.e2e.test');
    await page.getByRole('button', { name: 'Créer', exact: true }).click();

    await expect(page).toHaveURL(/\/admin\/entreprises\/\d+$/);
    await expect(page.getByText('Boulangerie du Nord').first()).toBeVisible();
  });

  test('la fiche d’une entreprise montre son employé et son dossier', async ({ page }) => {
    await page.goto('/admin/entreprises');
    await page.getByRole('link', { name: 'Usinage Laval' }).click();
    await expect(page.getByText('Omar Haddad').first()).toBeVisible();
    await expect(page.getByText('Permis de travail Omar').first()).toBeVisible();
  });
});

test.describe('Cabinet : adjoint', () => {
  test.use({ storageState: authState('assistant') });

  test('un adjoint ne voit pas l’écran Équipe', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Action requise', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Équipe' })).toHaveCount(0);
  });
});

test('un mauvais mot de passe est refusé', async ({ page }) => {
  await page.goto('/auth/admin-signin');
  await page.getByLabel('Email').fill(USERS.owner.email);
  await page.getByLabel('Mot de passe', { exact: true }).fill(`${PASSWORD}x`);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL(/\/auth\/admin-signin/);
  await expect(page.getByText(/incorrect|invalide|identifiants/i).first()).toBeVisible();
});
