# 🎨 Nouvelles Pages d'Authentification - Design sign-up-2

## ✅ Pages créées avec le design AuthWrapperTwo

Votre application utilise maintenant le magnifique design **sign-up-2** du template avec toutes les fonctionnalités d'authentification connectées à l'API Laravel.

---

## 📍 Nouvelles Routes

### 🔐 **Connexion Administrateur**

**URL** : `http://localhost:3001/auth/admin-signin`

**Design** : AuthWrapperTwo (style sign-in-2)

**Fonctionnalités** :
- Formulaire avec email et mot de passe
- Checkbox "Se souvenir de moi"
- Lien "Mot de passe oublié"
- Connexion avec l'API Laravel (guard admin)
- Redirection intelligente après connexion
- États de chargement pendant la connexion
- Messages d'erreur/succès avec toast

**Identifiants de test** :
```
Email: admin@cabinet-immigration.com
Password: password
```

**Lien vers espace client** : Oui (en bas du formulaire)

---

### 👤 **Connexion Client**

**URL** : `http://localhost:3001/auth/client-signin`

**Design** : AuthWrapperTwo (style sign-in-2)

**Fonctionnalités** :
- Formulaire avec email et mot de passe
- Checkbox "Se souvenir de moi"
- Lien "Mot de passe oublié"
- Connexion avec l'API Laravel (guard client)
- Redirection intelligente après connexion
- États de chargement pendant la connexion
- Messages d'erreur/succès avec toast

**Liens** :
- Vers inscription client (en bas)
- Vers connexion admin (en bas)

---

### ✍️ **Inscription Client**

**URL** : `http://localhost:3001/auth/client-signup`

**Design** : AuthWrapperTwo (style sign-up-2)

**Fonctionnalités** :
- Formulaire d'inscription complet
  - Prénom
  - Nom
  - Email
  - Téléphone (optionnel)
  - Mot de passe
  - Confirmation mot de passe
  - Checkbox conditions d'utilisation
- Validation robuste avec Zod
- Création de compte via API Laravel
- Redirection automatique après inscription
- Messages d'erreur détaillés

**Validation du mot de passe** :
- Minimum 8 caractères
- Au moins 1 majuscule
- Au moins 1 minuscule
- Au moins 1 chiffre
- Confirmation doit correspondre

**Lien vers connexion** : Oui (en bas du formulaire)

---

## 🎨 Design AuthWrapperTwo

### Caractéristiques visuelles

✅ **Layout moderne**
- Sidebar gauche avec navigation
- Bannière droite avec image et texte promotionnel
- Formulaire centré avec design arrondi (pills)
- Responsive design

✅ **Couleurs**
- Primary : Bleu (#043ABA)
- Background : Blanc/Gris clair
- Accents : Bleu pour les liens

✅ **Composants**
- Inputs avec design pill (arrondis)
- Buttons avec bordures
- States de loading
- Messages d'erreur inline

✅ **Navigation**
- Liens vers Inscription/Connexion dans le sidebar
- Bouton "Back" pour retour
- Logo en haut

---

## 🔄 Redirections

### Route `/signin` (ancienne)

Cette route redirige maintenant automatiquement vers `/auth/admin-signin`

### Routes `/signin/client` et `/signup`

Toujours fonctionnelles mais vous pouvez les rediriger vers les nouvelles pages si besoin.

---

## 📋 Configuration

### Fichiers créés

```
isomorphic/apps/isomorphic/src/app/auth/
├── (sign-in)/
│   ├── admin-signin/
│   │   ├── page.tsx
│   │   └── admin-signin-form.tsx
│   └── client-signin/
│       ├── page.tsx
│       └── client-signin-form.tsx
└── (sign-up)/
    └── client-signup/
        ├── page.tsx
        └── client-signup-form.tsx
```

### Fichiers modifiés

```
✅ isomorphic/apps/isomorphic/src/config/routes.ts
   - Ajout de routes.auth.adminSignIn
   - Ajout de routes.auth.clientSignIn
   - Ajout de routes.auth.clientSignUp

✅ isomorphic/apps/isomorphic/src/components/ProtectedRoute.tsx
   - Ajout des nouvelles routes publiques
   - Redirection vers /auth/admin-signin au lieu de /signin

✅ isomorphic/apps/isomorphic/src/app/shared/auth-layout/auth-wrapper-two.tsx
   - Navigation vers nouvelles routes
   - Texte en français

✅ isomorphic/apps/isomorphic/src/app/signin/page.tsx
   - Redirection automatique vers /auth/admin-signin

✅ isomorphic/apps/isomorphic/src/validators/client-signup.schema.ts
   - Nouveau schéma de validation pour inscription client
```

---

## 🧪 Tests

### Test 1 : Connexion Admin

1. **Aller sur** : `http://localhost:3001/auth/admin-signin`
2. **Vérifier** :
   - ✅ Design AuthWrapperTwo s'affiche
   - ✅ Sidebar avec navigation
   - ✅ Bannière promotionnelle
   - ✅ Formulaire avec inputs arrondis
3. **Se connecter avec** :
   - Email : `admin@cabinet-immigration.com`
   - Password : `password`
4. **Vérifier** :
   - ✅ Toast "Connexion réussie"
   - ✅ Redirection vers `/`
   - ✅ Token dans localStorage

### Test 2 : Navigation Sidebar

1. **Sur** : `http://localhost:3001/auth/admin-signin`
2. **Cliquer sur "Inscription"** dans le sidebar
3. **Vérifier** :
   - ✅ Redirige vers `/auth/client-signup`
   - ✅ Formulaire d'inscription s'affiche

### Test 3 : Inscription Client

1. **Aller sur** : `http://localhost:3001/auth/client-signup`
2. **Remplir le formulaire** :
   - Prénom : Jean
   - Nom : Dupont
   - Email : jean@test.com
   - Téléphone : 0600000000
   - Password : Test1234
   - Confirmation : Test1234
   - Cocher conditions
3. **Cliquer sur "Créer mon compte"**
4. **Vérifier** :
   - ✅ Appel API vers Laravel
   - ✅ Compte créé
   - ✅ Toast de succès
   - ✅ Redirection vers dashboard client

### Test 4 : Validation Mot de Passe

1. **Sur inscription client**
2. **Tester mot de passe faible** : `test123`
3. **Vérifier** :
   - ✅ Message d'erreur : "Le mot de passe doit contenir au moins une majuscule"
4. **Tester confirmation différente**
5. **Vérifier** :
   - ✅ Message d'erreur : "Les mots de passe ne correspondent pas"

### Test 5 : Redirection /signin

1. **Aller sur** : `http://localhost:3001/signin`
2. **Vérifier** :
   - ✅ Loader s'affiche brièvement
   - ✅ Redirection automatique vers `/auth/admin-signin`

### Test 6 : Connexion Client

1. **Aller sur** : `http://localhost:3001/auth/client-signin`
2. **Vérifier** :
   - ✅ Design AuthWrapperTwo
   - ✅ Lien vers inscription en bas
   - ✅ Lien vers connexion admin en bas
3. **Essayer de se connecter** (si client créé)
4. **Vérifier** :
   - ✅ Connexion réussie
   - ✅ Redirection vers dashboard client

---

## 🎯 Personnalisation

### Changer les textes de la bannière

Modifier `isomorphic/apps/isomorphic/src/app/shared/auth-layout/auth-wrapper-two.tsx` :

```tsx
<Title>
  Start turning your ideas into reality.
</Title>
<Text>
  Sign up now and start taking advantage...
</Text>
```

### Changer l'image de la bannière

Dans le même fichier :

```tsx
<Image
  src={'https://isomorphic-furyroad.s3.amazonaws.com/public/auth/sign-in-bg2.webp'}
  alt="Sign Up Thumbnail"
/>
```

### Désactiver la bannière sociale

Dans vos pages :

```tsx
<AuthWrapperTwo 
  title="Titre" 
  isSocialLoginActive={false}  // ← Déjà fait
>
```

### Ajouter des champs au formulaire d'inscription

Modifier `client-signup-form.tsx` et `client-signup.schema.ts`

---

## 📚 Ressources

### Composants utilisés

- **Input** (rizzui) - Champs de texte
- **Password** (rizzui) - Champ mot de passe avec toggle
- **Button** (rizzui) - Boutons avec states
- **Checkbox** (rizzui) - Cases à cocher
- **Form** (@core/ui/form) - Wrapper de formulaire avec validation
- **Text** (rizzui) - Textes stylisés

### Hooks utilisés

- **useAuth** - Hook personnalisé pour l'authentification
- **useMedia** - Hook pour responsive design
- **useRouter** - Navigation Next.js

### Validation

- **Zod** - Validation des schémas
- **React Hook Form** - Gestion des formulaires

---

## 🚀 Prochaines étapes

### Optionnel : Unifier les anciennes pages

Vous pouvez rediriger toutes les anciennes pages vers les nouvelles :

```typescript
// src/app/signin/client/page.tsx
'use client';
export default function() {
  const router = useRouter();
  useEffect(() => router.replace('/auth/client-signin'), []);
  return <Loader />;
}
```

### Ajouter "Mot de passe oublié"

Créer `/auth/forgot-password` avec le même design

### Ajouter vérification email

Créer `/auth/verify-email` avec OTP

### Personnaliser les messages

Modifier les toasts et messages d'erreur dans les formulaires

---

## 🎉 Félicitations !

Vos pages d'authentification utilisent maintenant le magnifique design **sign-up-2** du template tout en étant complètement intégrées avec votre API Laravel !

**URLs à tester** :
- 🔐 Admin : `http://localhost:3001/auth/admin-signin`
- 👤 Client : `http://localhost:3001/auth/client-signin`
- ✍️ Inscription : `http://localhost:3001/auth/client-signup`

**Bon développement ! 🚀**


