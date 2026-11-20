import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/** Avant chaque lancement : environnement e2e prêt, base remise à zéro avec les données de départ. */
export default function globalSetup() {
  const apiDir = path.resolve(__dirname, '../../../../api');
  const env = { ...process.env, APP_ENV: 'e2e', DB_DATABASE: path.join(apiDir, 'database', 'e2e.sqlite') };

  const envFile = path.join(apiDir, '.env.e2e');
  if (!fs.existsSync(envFile)) {
    fs.copyFileSync(path.join(apiDir, '.env.e2e.example'), envFile);
    execSync('php artisan key:generate --force', { cwd: apiDir, env, stdio: 'inherit' });
  }

  // e2e:reset refuse de tourner hors de l'environnement e2e et de la base e2e.sqlite.
  execSync('php artisan e2e:reset', { cwd: apiDir, env, stdio: 'inherit' });

  fs.mkdirSync(path.join(__dirname, '.auth'), { recursive: true });
}
