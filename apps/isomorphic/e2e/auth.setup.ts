import { test as setup, expect } from '@playwright/test';
import { PASSWORD, USERS, authState } from './fixtures';

/** Une connexion par rôle, enregistrée et réutilisée par les parcours. */

for (const role of ['owner', 'assistant'] as const) {
  setup(`connexion du cabinet : ${role}`, async ({ page }) => {
    await page.goto('/auth/admin-signin');
    await page.getByLabel('Email').fill(USERS[role].email);
    await page.getByLabel('Mot de passe', { exact: true }).fill(PASSWORD);
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await page.waitForURL((url) => !url.pathname.startsWith('/auth/'));
    await page.context().storageState({ path: authState(role) });
  });
}

setup('connexion du client', async ({ page }) => {
  await page.goto('/auth/client-signin');
  await page.getByLabel('Email').fill(USERS.client.email);
  await page.getByLabel('Mot de passe', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/auth/'));
  await page.context().storageState({ path: authState('client') });
});

setup('connexion de l’entreprise', async ({ page }) => {
  await page.goto('/entreprise/connexion');
  await page.getByLabel('Courriel').fill(USERS.company.email);
  await page.getByLabel('Mot de passe').fill(PASSWORD);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL(/\/entreprise$/);
  await page.context().storageState({ path: authState('company') });
});
