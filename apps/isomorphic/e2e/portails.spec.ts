import { test, expect } from '@playwright/test';
import { CABINET, authState } from './fixtures';

test.describe('Portail client', () => {
  test.use({ storageState: authState('client') });

  test('le client voit son dossier', async ({ page }) => {
    await page.goto('/client/dashboard');
    await expect(page.getByText('Permis de travail Amina')).toBeVisible();
  });
});

test.describe('Espace entreprise', () => {
  test.use({ storageState: authState('company') });

  test('l’entreprise suit son employé, sans détail par défaut', async ({ page }) => {
    await page.goto('/entreprise');
    await expect(page.getByRole('heading', { name: 'Usinage Laval' })).toBeVisible();
    await expect(page.getByText('Omar Haddad')).toBeVisible();
    await expect(page.getByText('Permis de travail Omar')).toBeVisible();
    // Visibilité « avancement » : ni formulaires ni documents.
    await expect(page.getByText('Formulaires', { exact: true })).toHaveCount(0);
  });

  test('l’entreprise envoie une invitation d’employé au cabinet', async ({ page }) => {
    await page.goto('/entreprise');
    await page.getByRole('button', { name: 'Inviter un employé' }).click();
    await page.getByLabel('Prénom').fill('Lina');
    await page.getByLabel('Nom', { exact: true }).fill('Benali');
    await page.getByLabel('Courriel de l’employé').fill('lina@e2e.test');
    await page.getByLabel(/J’ai informé l’employé/).check();
    await page.getByRole('button', { name: 'Envoyer au cabinet' }).click();
    await expect(page.getByText('Lina Benali')).toBeVisible();
    await expect(page.getByText('À traiter')).toBeVisible();
  });
});

test('un prospect réserve une consultation gratuite en ligne', async ({ page }) => {
  await page.goto(`/reserver/${CABINET.slug}`);
  await expect(page.getByRole('heading', { name: CABINET.name })).toBeVisible();

  await page.getByRole('button', { name: /Consultation initiale/ }).click();
  await page.getByRole('button', { name: /^\d{1,2}\s?(h|:)\s?\d{2}$/ }).first().click();

  await page.getByLabel(/Nom complet/).fill('Luis Moreno');
  await page.getByLabel(/Courriel/).fill('luis@e2e.test');
  await page.getByLabel(/J’accepte/).check();
  await page.getByRole('button', { name: 'Confirmer le rendez-vous' }).click();

  await expect(page).toHaveURL(/\/rendez-vous\/.+nouveau=1/);
  await expect(page.getByText(/Rendez-vous confirmé/)).toBeVisible();
});
