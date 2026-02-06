# 🎨 Configuration Frontend - Authentification Cabinet d'Immigration

## ✅ Ce qui a été configuré

### 1. Service API (`src/services/api.ts`)
- Communication avec l'API Laravel
- Gestion automatique des tokens (localStorage)
- Méthodes pour admin et client (login, logout, register, profile)

### 2. Types TypeScript (`src/types/auth.ts`)
- `Admin` - Type pour les administrateurs
- `Client` - Type pour les clients
- `AuthState` - État d'authentification global
- `UserType` - Type d'utilisateur ('admin' | 'client')

### 3. Store Jotai (`src/store/auth.ts`)
- `authStateAtom` - État global d'authentification
- `adminAtom` - Données de l'admin connecté
- `clientAtom` - Données du client connecté
- `userTypeAtom` - Type d'utilisateur (persisté dans localStorage)
- `currentUserAtom` - Utilisateur actuellement connecté

### 4. Hook personnalisé (`src/hooks/useAuth.ts`)
Hook React pour faciliter l'authentification dans les composants :
```typescript
const {
  isAuthenticated,
  userType,
  admin,
  client,
  currentUser,
  isLoading,
  error,
  loginAdmin,
  loginClient,
  registerClient,
  logout,
} = useAuth();
```

### 5. Pages de connexion

#### Page Administrateur
- **Route** : `/signin`
- **Composant** : `AdminSignInForm`
- **Credentials par défaut** :
  - Email : `admin@cabinet-immigration.com`
  - Password : `password`

#### Page Client
- **Route** : `/signin/client`
- **Composant** : `ClientSignInForm`
- **Action** : Login ou lien vers inscription

### 6. Variables d'environnement
Fichier `.env.local` :
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## 🚀 Comment tester

### Pré-requis
1. ✅ **Backend Laravel** doit fonctionner sur `http://localhost:8000`
2. ✅ **Base de données** configurée avec les admins créés
3. ✅ **Frontend Next.js** en mode dev ou production

### Étape 1 : Démarrer le frontend

#### Mode développement :
```bash
cd d:\volont\isomorphic
pnpm run iso:dev
```

#### Mode production (plus rapide) :
```bash
cd d:\volont\isomorphic
pnpm run iso:build
pnpm run iso:start
```

### Étape 2 : Tester la connexion Administrateur

1. Ouvrir : `http://localhost:3001/signin`
2. Se connecter avec :
   - Email : `admin@cabinet-immigration.com`
   - Password : `password`
3. ✅ Vous devriez être redirigé vers le dashboard admin (`/`)

### Étape 3 : Tester la connexion Client

1. Ouvrir : `http://localhost:3001/signin/client`
2. Pour l'instant, aucun client n'existe
3. Il faudra créer une page d'inscription client

## 📡 Flow d'authentification

### Connexion Admin
```
1. User → Formulaire login (/signin)
2. Frontend → POST /api/admin/login
3. Backend → Validation credentials
4. Backend → Génère token Sanctum
5. Frontend → Stocke token + données admin
6. Frontend → Redirect vers dashboard admin
```

### Connexion Client
```
1. User → Formulaire login (/signin/client)
2. Frontend → POST /api/client/login
3. Backend → Validation credentials
4. Backend → Génère token Sanctum
5. Frontend → Stocke token + données client
6. Frontend → Redirect vers dashboard client
```

### Déconnexion
```
1. User → Click logout
2. Frontend → POST /api/admin/logout ou /api/client/logout
3. Backend → Révoque le token
4. Frontend → Supprime token + données
5. Frontend → Redirect vers /signin
```

## 🔒 Gestion de l'authentification

### Vérifier si connecté
```typescript
const { isAuthenticated, userType, admin, client } = useAuth();

if (!isAuthenticated) {
  // Rediriger vers login
}

if (userType === 'admin') {
  // Afficher interface admin
} else if (userType === 'client') {
  // Afficher interface client
}
```

### Se déconnecter
```typescript
const { logout } = useAuth();

<button onClick={logout}>Déconnexion</button>
```

### Obtenir l'utilisateur connecté
```typescript
const { currentUser } = useAuth();

if (currentUser?.type === 'admin') {
  console.log('Admin:', currentUser.user.name);
} else if (currentUser?.type === 'client') {
  console.log('Client:', currentUser.user.full_name);
}
```

## 🛡️ Prochaines étapes

### ✅ Déjà fait
- [x] Service API configuré
- [x] Store d'authentification créé
- [x] Hook useAuth fonctionnel
- [x] Pages de connexion admin et client
- [x] Gestion des tokens

### 📋 À faire
- [ ] Créer la page d'inscription client (`/signin/client/register`)
- [ ] Protéger les routes admin avec un middleware
- [ ] Protéger les routes client avec un middleware
- [ ] Créer un composant `ProtectedRoute`
- [ ] Adapter le layout pour afficher les infos utilisateur
- [ ] Créer le dashboard client
- [ ] Gérer le refresh automatique du profil
- [ ] Implémenter "Mot de passe oublié"

## 🐛 Debugging

### Le token n'est pas envoyé
Vérifiez dans le localStorage du navigateur :
```javascript
// Dans la console du navigateur
localStorage.getItem('auth_token')
```

### Erreur CORS
Vérifiez que l'API Laravel autorise `http://localhost:3001` :
```php
// api/config/cors.php
'allowed_origins' => [
    'http://localhost:3001',
],
```

### Erreur 401 Unauthorized
- Le token est peut-être expiré
- Vérifiez que Sanctum est bien installé
- Vérifiez les guards dans `api/config/auth.php`

## 📚 Ressources

- **Service API** : `src/services/api.ts`
- **Hook Auth** : `src/hooks/useAuth.ts`
- **Store Auth** : `src/store/auth.ts`
- **Types** : `src/types/auth.ts`
- **Page Admin** : `src/app/signin/page.tsx`
- **Page Client** : `src/app/signin/client/page.tsx`

## 💡 Notes importantes

1. **Sécurité** : Les tokens sont stockés dans localStorage (pour SPA simple)
   - Pour plus de sécurité, considérez httpOnly cookies
   
2. **Type d'utilisateur** : Sauvegardé dans localStorage pour persister entre les rechargements
   
3. **Auto-login** : Le hook `useAuth` charge automatiquement le profil au démarrage si un token existe

4. **Toast notifications** : Les succès/erreurs sont affichés via `react-hot-toast`


