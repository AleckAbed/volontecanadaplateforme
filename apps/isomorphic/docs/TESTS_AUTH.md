# Tests manuels – persistance de l’auth

## Prérequis
- API Laravel démarrée (port 8000)
- Frontend Next.js démarré (port 3001)

## 1. Connexion et enregistrement du token
1. Ouvrir http://localhost:3001/auth/admin-signin
2. Se connecter avec un compte admin valide
3. **Vérification** : Ouvrir DevTools (F12) → Application → Cookies → `http://localhost:3001`
   - Un cookie `auth_token` doit être présent
4. **Vérification** : Même onglet → Local Storage
   - Clé `auth_token` doit être présente
   - Clé `user_type` = `admin`

## 2. Persistance après rafraîchissement (F5)
1. Après connexion, être sur le tableau de bord (/)
2. Appuyer sur **F5** (ou Ctrl+R)
3. **Résultat attendu** : Reste sur le tableau de bord, pas de redirection vers la page de connexion

## 3. Cookie « auth vu » (middleware)
1. Après connexion, rafraîchir la page
2. Dans DevTools → Application → Cookies
3. **Vérification** : Un cookie `auth_seen` (valeur `1`) peut apparaître brièvement ; il confirme que le serveur a reçu `auth_token`

## 4. Déconnexion
1. Se déconnecter via l’interface
2. **Vérification** : Cookies et Local Storage ne doivent plus contenir `auth_token`
3. **Résultat attendu** : Redirection vers la page de connexion

## 5. Accès réseau (optionnel)
1. Démarrer l’API avec `php artisan serve --host=0.0.0.0 --port 8000`
2. Depuis un autre appareil du LAN, ouvrir `http://<IP>:3001`
3. Se connecter puis rafraîchir
4. **Résultat attendu** : La session persiste (même origine = même IP:3001, cookie valide)

## Dépannage
- Si après F5 vous êtes redirigé vers login : vérifier que le cookie `auth_token` est bien présent après la connexion (étape 1).
- Si le cookie est absent après connexion : vérifier la réponse de l’API (onglet Network, requête POST vers `/api/admin/login` ou `/api/client/login`) et que `data.token` est bien renvoyé.
