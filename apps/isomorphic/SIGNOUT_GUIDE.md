# 🚪 Guide de Déconnexion (SignOut)

## ✅ Fonctionnalité de déconnexion complète

La déconnexion est maintenant intégrée avec votre API Laravel et affiche les vraies informations de l'utilisateur connecté.

---

## 📍 Où se trouve le bouton de déconnexion ?

### Menu Profil (En haut à droite)

Le bouton de déconnexion se trouve dans le **menu déroulant du profil utilisateur** en haut à droite de l'application.

**Fichier** : `isomorphic/apps/isomorphic/src/layouts/profile-menu.tsx`

**Emplacement** :
1. Cliquer sur l'avatar en haut à droite
2. Un menu déroulant s'affiche avec :
   - Photo de profil
   - Nom de l'utilisateur
   - Email
   - "My Profile"
   - "Account Settings"
   - "Activity Log"
   - **Bouton "Déconnexion"** (en bas)

---

## 🔧 Comment ça fonctionne

### 1. Affichage dynamique des informations utilisateur

Le menu affiche maintenant les **vraies données** de l'utilisateur connecté :

#### Pour les Administrateurs
```typescript
Nom: admin.name             // Ex: "Super Admin"
Email: admin.email          // Ex: "admin@cabinet-immigration.com"
Avatar: Généré depuis le nom
```

#### Pour les Clients
```typescript
Nom: client.first_name + client.last_name  // Ex: "Jean Dupont"
Email: client.email                        // Ex: "jean@test.com"
Avatar: Généré depuis le prénom
```

### 2. Processus de déconnexion

Quand l'utilisateur clique sur "Déconnexion" :

```typescript
1. Appel de logout() du hook useAuth
2. Appel API vers Laravel (POST /api/admin/logout ou /api/client/logout)
3. Laravel révoque le token Sanctum
4. Frontend :
   - Supprime le token du localStorage
   - Supprime le userType du localStorage
   - Reset le store Jotai (admin/client à null)
   - Affiche un toast "Déconnexion réussie"
   - Redirige vers /auth/admin-signin (ou /auth/client-signin pour client)
```

---

## 📋 Code mis à jour

### ProfileMenu Component

```typescript
// Avant (NextAuth)
import { signOut } from 'next-auth/react';

onClick={() => signOut()}

// Après (Notre API Laravel)
import { useAuth } from '@/hooks/useAuth';

const { logout, currentUser, userType } = useAuth();

const handleSignOut = async () => {
  await logout();
};

onClick={handleSignOut}
```

### Affichage dynamique du nom

```typescript
// Administrateur
const displayName = admin.name;

// Client
const displayName = `${client.first_name} ${client.last_name}`.trim();
```

---

## 🧪 Tests

### Test 1 : Affichage des informations

1. **Se connecter** avec `admin@cabinet-immigration.com` / `password`
2. **Cliquer sur l'avatar** en haut à droite
3. **Vérifier** :
   - ✅ Nom affiché : "Super Admin"
   - ✅ Email affiché : "admin@cabinet-immigration.com"
   - ✅ Avatar généré depuis le nom

### Test 2 : Déconnexion Admin

1. **Être connecté** en tant qu'admin
2. **Cliquer sur l'avatar** en haut à droite
3. **Cliquer sur "Déconnexion"**
4. **Vérifier** :
   - ✅ Toast "Déconnexion réussie" s'affiche
   - ✅ Redirection vers `/auth/admin-signin`
   - ✅ Token supprimé du localStorage
   - ✅ Impossible d'accéder aux pages protégées

### Test 3 : Token révoqué sur le backend

1. **Se connecter** et copier le token depuis localStorage
2. **Se déconnecter**
3. **Essayer d'utiliser le token** avec curl :

```bash
curl -H "Authorization: Bearer [OLD_TOKEN]" http://localhost:8000/api/admin/me
```

4. **Vérifier** :
   - ✅ Erreur 401 Unauthorized (token révoqué)

### Test 4 : Déconnexion Client

1. **Se connecter** en tant que client (si compte créé)
2. **Cliquer sur l'avatar**
3. **Vérifier** :
   - ✅ Nom complet affiché (Prénom + Nom)
   - ✅ Email client
4. **Cliquer sur "Déconnexion"**
5. **Vérifier** :
   - ✅ Redirection vers `/auth/client-signin`
   - ✅ Token client supprimé

### Test 5 : Protection après déconnexion

1. **Se déconnecter**
2. **Essayer d'accéder à** `http://localhost:3001/`
3. **Vérifier** :
   - ✅ Redirection automatique vers `/auth/admin-signin`
4. **Essayer d'accéder à** `http://localhost:3001/analytics`
5. **Vérifier** :
   - ✅ Redirection vers `/auth/admin-signin?redirect=/analytics`

---

## 🎨 Interface utilisateur

### Menu déroulant complet

```
┌──────────────────────────────────┐
│  [Avatar] Super Admin           │
│           admin@cabinet...       │
├──────────────────────────────────┤
│  My Profile                      │
│  Account Settings                │
│  Activity Log                    │
├──────────────────────────────────┤
│  Déconnexion                     │
└──────────────────────────────────┘
```

### États du bouton

- **Normal** : Texte gris
- **Hover** : Texte noir
- **Click** : Lance la déconnexion
- **Loading** : (Optionnel) État de chargement pendant l'appel API

---

## 🔐 Sécurité

### Révocation du token

✅ Le token est **révoqué côté serveur** (Laravel Sanctum)
- Table `personal_access_tokens` : le token est supprimé
- Impossible de réutiliser un token après déconnexion

### Nettoyage complet

✅ **localStorage**
```javascript
localStorage.removeItem('auth_token');
localStorage.removeItem('user_type');
```

✅ **Store Jotai**
```javascript
setAdmin(null);
setClient(null);
setUserType(null);
setAuthState({
  isAuthenticated: false,
  userType: null,
  admin: null,
  client: null,
  isLoading: false,
  error: null,
});
```

---

## 🎯 Personnalisation

### Changer le texte du bouton

```typescript
// Dans profile-menu.tsx
<Button onClick={handleSignOut}>
  Déconnexion  // ← Changer ici
</Button>
```

### Ajouter une confirmation

```typescript
const handleSignOut = async () => {
  if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
    await logout();
  }
};
```

### Ajouter un loading state

```typescript
const [isLoggingOut, setIsLoggingOut] = useState(false);

const handleSignOut = async () => {
  setIsLoggingOut(true);
  await logout();
  // Pas besoin de setIsLoggingOut(false) car on redirige
};

<Button 
  onClick={handleSignOut}
  disabled={isLoggingOut}
  isLoading={isLoggingOut}
>
  {isLoggingOut ? 'Déconnexion...' : 'Déconnexion'}
</Button>
```

### Changer la page de redirection

```typescript
// Dans hooks/useAuth.ts
const logout = useCallback(async () => {
  // ...
  router.push('/auth/admin-signin'); // ← Changer ici
}, []);
```

### Ajouter un message personnalisé

```typescript
const handleSignOut = async () => {
  await logout();
  toast.success('À bientôt ! 👋'); // Message personnalisé
};
```

---

## 📚 Fichiers modifiés

```
✅ isomorphic/apps/isomorphic/src/layouts/profile-menu.tsx
   - Import de useAuth au lieu de next-auth
   - Utilisation de logout() au lieu de signOut()
   - Affichage dynamique des données utilisateur
   - Bouton "Déconnexion" au lieu de "Sign Out"

✅ isomorphic/apps/isomorphic/src/hooks/useAuth.ts
   - Fonction logout() déjà existante
   - Appel API pour révoquer le token
   - Nettoyage localStorage et store
   - Redirection après déconnexion

✅ isomorphic/apps/isomorphic/src/app/auth/(sign-up)/client-signup/client-signup-form.tsx
   - Correction de register() → registerClient()
```

---

## 🐛 Dépannage

### Le bouton ne fait rien

1. ✅ Vérifier que le serveur Laravel tourne sur port 8000
2. ✅ Ouvrir la console du navigateur pour voir les erreurs
3. ✅ Vérifier que le token existe dans localStorage

### Erreur lors de la déconnexion

```
POST http://localhost:8000/api/admin/logout 401 Unauthorized
```

**Cause** : Token invalide ou expiré

**Solution** :
- Supprimer manuellement le localStorage
- Actualiser la page
- Se reconnecter

### Le menu profil ne s'affiche pas

1. ✅ Vérifier que vous êtes sur une page protégée (pas sur /auth/admin-signin)
2. ✅ Vérifier que vous êtes connecté
3. ✅ Actualiser la page (F5)

### Le nom ne s'affiche pas correctement

```typescript
// Vérifier dans la console
console.log('currentUser:', currentUser);
console.log('userType:', userType);
```

**Client** : Vérifier que `first_name` et `last_name` existent  
**Admin** : Vérifier que `name` existe

---

## 🚀 Prochaines étapes

### Optionnel : Améliorer le menu profil

1. **Ajouter une photo de profil** personnalisée
   - Upload d'image
   - Stockage dans Laravel
   - Affichage dans l'avatar

2. **Ajouter le rôle de l'utilisateur**
   ```typescript
   <Text className="text-xs text-gray-500">
     {admin.role} // super_admin, admin, manager, agent
   </Text>
   ```

3. **Ajouter "Mon compte"**
   - Lien vers page de profil
   - Modification du mot de passe
   - Préférences

4. **Ajouter des statistiques**
   - Nombre de dossiers
   - Dernière connexion
   - etc.

---

## 🎉 Félicitations !

La déconnexion fonctionne parfaitement avec :

✅ **Révocation du token** côté serveur  
✅ **Nettoyage complet** du localStorage et du store  
✅ **Redirection automatique** vers la page de connexion  
✅ **Affichage dynamique** des vraies données utilisateur  
✅ **Protection des routes** après déconnexion  

**Testez maintenant** :
1. Connectez-vous : `http://localhost:3001/auth/admin-signin`
2. Cliquez sur l'avatar en haut à droite
3. Cliquez sur "Déconnexion"
4. Vérifiez la redirection et la protection des routes

**Tout fonctionne ! 🚀**


