import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

/**
 * Tests de bout en bout : un vrai navigateur sur l'application complète.
 *
 * Tout tourne à part du développement :
 *  - API sur le port 8001, environnement « e2e » (api/.env.e2e), base SQLite jetable
 *    api/database/e2e.sqlite, courriels jamais envoyés (mailer « array »), aucun service externe ;
 *  - front sur le port 3101, compilé dans .next-e2e.
 * La base est remise à zéro avant chaque lancement (e2e/global-setup.ts).
 */
const apiDir = path.resolve(__dirname, '../../../api');
export const E2E_DB = path.join(apiDir, 'database', 'e2e.sqlite');
const API_PORT = 8001;
const WEB_PORT = 3101;

// Front et API sur la même adresse (127.0.0.1) : même site, donc le cookie de session passe.
const apiEnv = { APP_ENV: 'e2e', DB_DATABASE: E2E_DB, APP_URL: `http://127.0.0.1:${API_PORT}`, FRONTEND_URL: `http://127.0.0.1:${WEB_PORT}` };


export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false,
  workers: 1, // le serveur PHP intégré traite une requête à la fois
  retries: process.env.CI ? 1 : 0,
  timeout: 90_000, // la première ouverture d'une page compile en mode développement
  expect: { timeout: 20_000 },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    ...devices['Desktop Chrome'],
    // En local : Edge déjà installé, rien à télécharger. En CI : Chromium de Playwright.
    ...(process.env.CI ? {} : { channel: 'msedge' }),
    baseURL: `http://127.0.0.1:${WEB_PORT}`,
    locale: 'fr-CA',
    timezoneId: 'America/Toronto',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    navigationTimeout: 60_000,
  },
  projects: [
    { name: 'connexion', testMatch: /auth\.setup\.ts/ },
    { name: 'parcours', dependencies: ['connexion'], testIgnore: /auth\.setup\.ts/ },
  ],
  webServer: [
    {
      // Lancé depuis api/public : le routeur de Laravel y cherche index.php.
      // 127.0.0.1 explicite : « localhost » peut désigner IPv6 sur certains systèmes (CI).
      command: `php -S 127.0.0.1:${API_PORT} ../vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php`,
      cwd: path.join(apiDir, 'public'),
      env: apiEnv,
      url: `http://127.0.0.1:${API_PORT}/api/ping`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: `npx next dev --port ${WEB_PORT}`,
      env: { NEXT_PUBLIC_API_URL: `http://127.0.0.1:${API_PORT}/api`, NEXT_DIST_DIR: '.next-e2e' },
      url: `http://127.0.0.1:${WEB_PORT}/auth/admin-signin`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
});
