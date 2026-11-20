# Tests de bout en bout (Playwright)

Un vrai navigateur parcourt l'application complète, comme un utilisateur.

## Lancer

Depuis `isomorphic/apps/isomorphic` :

```
npx playwright test          # tous les parcours
npx playwright test --ui     # mode visuel : on voit chaque étape
npx playwright show-report   # rapport du dernier lancement (captures, traces)
```

Prérequis : PHP (XAMPP) dans le PATH et Microsoft Edge installé. Rien à télécharger : en local, Playwright utilise Edge.

## Ce qui tourne, et pourquoi c'est sans risque

Tout est séparé du développement :

| | Développement | Tests de bout en bout |
| --- | --- | --- |
| API | port 8000, `api/.env` | 127.0.0.1:8001, `api/.env.e2e` |
| Base | MySQL `volont` | SQLite `api/database/e2e.sqlite`, remise à zéro à chaque lancement |
| Front | port 3001, `.next` | 127.0.0.1:3101, `.next-e2e` |
| Courriels | SMTP configuré | jamais envoyés (mailer `array`) |
| Stripe, Google, Sentry | selon `.env` | désactivés |

- Au premier lancement, `api/.env.e2e` est créé depuis `api/.env.e2e.example`, avec sa propre clé.
- `php artisan e2e:reset` refuse de tourner hors de l'environnement `e2e` et de la base `e2e.sqlite` : il ne peut pas vider la base de travail.
- Les données de départ sont dans `api/database/seeders/E2eSeeder.php` : « Cabinet Horizon », une propriétaire, un adjoint, deux clients, une entreprise et une consultation réservable. Les comptes sont des comptes de test, avec le mot de passe de `e2e/fixtures.ts`.

## Organisation

- `auth.setup.ts` : une connexion par rôle (propriétaire, adjoint, client, entreprise), enregistrée puis réutilisée.
- `cabinet.spec.ts` : accueil, menu selon le rôle, entreprises clientes, mot de passe refusé.
- `portails.spec.ts` : portail client, espace entreprise, réservation en ligne.
- `securite.spec.ts` : en-têtes de sécurité du front et de l’API, visualiseur PDF toujours affichable.

Pour un nouveau parcours : un fichier `*.spec.ts` dans `e2e/`, avec `test.use({ storageState: authState('owner') })` pour démarrer déjà connecté. Si le parcours a besoin de données, on les ajoute dans `E2eSeeder.php`.
