# 🔒 Système de Protection des Routes

## Vue d'ensemble

Le système d'authentification protège automatiquement toutes les routes de l'application et gère les redirections intelligentes.

## 🎯 Comment ça fonctionne

### 1. **Composant ProtectedRoute** (`src/components/ProtectedRoute.tsx`)

Ce composant enveloppe toute l'application dans le layout et vérifie l'authentification à chaque changement de page.

**Logique de protection :**

```typescript
// Routes publiques (accessibles sans connexion)
const publicRoutes = ['/signin', '/signin/client', '/signup', '/forgot-password'];

// Routes d'authentification (redirection si déjà connecté)
const authRoutes = ['/signin', '/signin/client', '/signup'];
```

**Comportements :**

1. **Utilisateur NON connecté + Route protégée**
   - ❌ Accès refusé
   - ↩️ Redirection vers `/signin` (admin) ou `/signin/client` (client)
   - 💾 L'URL de destination est sauvegardée : `?redirect=/page-voulue`

2. **Utilisateur connecté + Route d'authentification**
   - ❌ Pas besoin de se reconnecter
   - ↩️ Redirection vers `/` (dashboard)

3. **Utilisateur connecté + Route protégée**
   - ✅ Accès autorisé
   - 🎯 Affiche la page demandée

### 2. **Hook useAuth** (`src/hooks/useAuth.ts`)

Gère les redirections après connexion réussie.

**Redirection intelligente :**

```typescript
// Si l'URL contient ?redirect=/page-voulue
// Redirige vers /page-voulue après connexion
// Sinon, redirige vers le dashboard par défaut

const redirectUrl = searchParams.get('redirect') || '/'; // Admin
const redirectUrl = searchParams.get('redirect') || '/client/dashboard'; // Client
```

### 3. **Middleware Next.js** (`src/middleware.ts`)

Minimaliste car le token est dans `localStorage` (inaccessible côté serveur).

La vraie protection se fait côté client avec `ProtectedRoute`.

## 📋 Exemples de scénarios

### Scénario 1 : Utilisateur non connecté essaie d'accéder au dashboard

1. 🌐 Utilisateur va sur `http://localhost:3001/`
2. 🔍 ProtectedRoute détecte : pas de token
3. ↩️ Redirection vers `/signin?redirect=/`
4. ✅ Après connexion → redirection vers `/` (page d'origine)

### Scénario 2 : Utilisateur connecté essaie d'aller sur /signin

1. 🌐 Utilisateur va sur `http://localhost:3001/signin`
2. 🔍 ProtectedRoute détecte : token présent + route d'authentification
3. ↩️ Redirection vers `/` (dashboard)
4. ✅ Évite de redemander la connexion

### Scénario 3 : Utilisateur connecté navigue normalement

1. 🌐 Utilisateur va sur `http://localhost:3001/analytics`
2. 🔍 ProtectedRoute détecte : token présent + route protégée
3. ✅ Affiche la page `/analytics`
4. ✅ Navigation fluide

### Scénario 4 : Utilisateur se déconnecte

1. 🔴 Clic sur "Déconnexion"
2. 🗑️ Token supprimé du localStorage
3. ↩️ Redirection vers `/signin`
4. 🔒 Toutes les routes protégées sont maintenant inaccessibles

## 🔐 Vérification de l'authentification

Le composant vérifie 2 éléments dans le localStorage :

```javascript
const token = localStorage.getItem('auth_token');        // Token JWT
const userType = localStorage.getItem('user_type');      // 'admin' ou 'client'
```

**Si le token existe** → Utilisateur authentifié ✅  
**Si le token n'existe pas** → Utilisateur non authentifié ❌

## 📍 Routes par type d'utilisateur

### Administrateurs

- **Page de connexion** : `/signin`
- **Dashboard** : `/`
- **Toutes les autres pages** : Accès complet

### Clients

- **Page de connexion** : `/signin/client`
- **Dashboard** : `/client/dashboard`
- **Pages client** : `/client/*`

## ⚙️ Configuration

### Ajouter une route publique

Modifiez `src/components/ProtectedRoute.tsx` :

```typescript
const publicRoutes = [
  '/signin',
  '/signin/client',
  '/signup',
  '/forgot-password',
  '/ma-nouvelle-page-publique',  // ← Ajouter ici
];
```

### Changer la page de destination par défaut

Modifiez `src/hooks/useAuth.ts` :

```typescript
// Pour les admins
const redirectUrl = searchParams.get('redirect') || '/mon-dashboard-admin';

// Pour les clients
const redirectUrl = searchParams.get('redirect') || '/mon-dashboard-client';
```

## 🧪 Tests

### Test 1 : Protection des routes

1. Ouvrir le navigateur en mode incognito
2. Aller sur `http://localhost:3001/`
3. ✅ Devrait rediriger vers `/signin`

### Test 2 : Redirection après connexion

1. Aller sur `http://localhost:3001/analytics` (sans connexion)
2. Redirection vers `/signin?redirect=/analytics`
3. Se connecter
4. ✅ Devrait rediriger vers `/analytics`

### Test 3 : Éviter double connexion

1. Se connecter
2. Aller sur `http://localhost:3001/signin`
3. ✅ Devrait rediriger vers `/` (dashboard)

### Test 4 : Déconnexion

1. Être connecté
2. Cliquer sur "Déconnexion"
3. ✅ Devrait rediriger vers `/signin`
4. ✅ Essayer d'aller sur `/` → redirige vers `/signin`

## 🚀 Optimisations futures

### Option 1 : Cookies httpOnly (plus sécurisé)

Stocker le token dans un cookie httpOnly au lieu de localStorage pour activer le middleware serveur.

### Option 2 : Refresh Token

Implémenter un système de refresh token pour garder l'utilisateur connecté plus longtemps.

### Option 3 : Permissions par rôle

Ajouter une vérification des rôles (super_admin, admin, agent) pour restreindre certaines pages.

```typescript
// Exemple
if (admin.role !== 'super_admin') {
  router.replace('/unauthorized');
}
```

## 📚 Résumé

✅ **Protection automatique** de toutes les routes  
✅ **Redirection intelligente** avec paramètre `redirect`  
✅ **Séparation Admin/Client** avec routes dédiées  
✅ **Expérience utilisateur fluide** (pas de rechargement de page)  
✅ **État persistant** avec localStorage  
✅ **Loader pendant vérification** pour éviter le flash de contenu

Le système est prêt à l'emploi ! 🎉


