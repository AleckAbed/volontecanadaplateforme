# 📋 Guide des Sidebars Admin & Client

## ✅ Système de sidebar dynamique

Votre application dispose maintenant de **deux versions de sidebar** : une pour les administrateurs et une pour les clients. La sidebar s'adapte automatiquement selon le type d'utilisateur connecté.

---

## 🎯 Deux versions de menu

### 📊 **Menu Administrateur**

**Fichier** : `isomorphic/apps/isomorphic/src/layouts/hydrogen/admin-menu-items.tsx`

#### Sections du menu admin

```
📊 Tableau de bord
  └─ Dashboard
  └─ Statistiques

👥 Gestion des Clients
  └─ Clients
      ├─ Liste des clients
      └─ Ajouter un client
  └─ Dossiers
      ├─ Tous les dossiers
      ├─ En cours
      ├─ Terminés
      └─ Créer un dossier
  └─ Documents

📅 Agenda & Rendez-vous
  └─ Rendez-vous
      ├─ Calendrier
      └─ Nouveau rendez-vous

💼 Services
  └─ Services d'immigration
      ├─ Tous les services
      └─ Ajouter un service
  └─ Types de visa

💬 Communication
  └─ Messages
  └─ Notifications

⚙️ Administration
  └─ Utilisateurs
      ├─ Administrateurs
      └─ Ajouter un admin
  └─ Paramètres
      ├─ Général
      ├─ Mon profil
      └─ Sécurité
```

---

### 👤 **Menu Client**

**Fichier** : `isomorphic/apps/isomorphic/src/layouts/hydrogen/client-menu-items.tsx`

#### Sections du menu client

```
🏠 Mon Espace
  └─ Tableau de bord

📁 Mon Dossier
  └─ Mon dossier d'immigration
      ├─ Vue d'ensemble
      ├─ Statut
      └─ Historique
  └─ Documents
      ├─ Mes documents
      ├─ Uploader un document
      └─ Documents requis

📅 Rendez-vous & Communication
  └─ Rendez-vous
      ├─ Mes rendez-vous
      └─ Prendre rendez-vous
  └─ Messages
  └─ Notifications

💼 Services & Paiements
  └─ Services
      ├─ Mes services
      └─ Services disponibles
  └─ Paiements
      ├─ Mes paiements
      └─ Factures

👤 Mon Compte
  └─ Mon profil
      ├─ Informations personnelles
      ├─ Modifier mon profil
      └─ Sécurité
  └─ Aide & Support
      ├─ Centre d'aide
      ├─ FAQ
      └─ Contacter le support
```

---

## 🔧 Comment ça fonctionne

### 1. Détection automatique du type d'utilisateur

Le composant `SidebarMenu` détecte automatiquement le type d'utilisateur connecté :

```typescript
const { userType } = useAuth();

const currentMenuItems = useMemo(() => {
  if (userType === 'admin') {
    return adminMenuItems;
  } else if (userType === 'client') {
    return clientMenuItems;
  }
  return adminMenuItems; // Par défaut
}, [userType]);
```

### 2. Affichage conditionnel

Selon le `userType` :
- **'admin'** → Affiche `adminMenuItems`
- **'client'** → Affiche `clientMenuItems`
- **null/undefined** → Affiche `adminMenuItems` par défaut

---

## 📁 Structure des fichiers

```
isomorphic/apps/isomorphic/src/layouts/hydrogen/
├── menu-items.tsx              # ❌ Ancien menu (template)
├── admin-menu-items.tsx        # ✅ Menu pour administrateurs
├── client-menu-items.tsx       # ✅ Menu pour clients
├── sidebar-menu.tsx            # ✅ Composant qui charge le bon menu
└── sidebar.tsx                 # Sidebar principale
```

---

## 🧪 Tests

### Test 1 : Menu Administrateur

1. **Se connecter** en tant qu'admin :
   - URL : `http://localhost:3001/auth/admin-signin`
   - Email : `admin@cabinet-immigration.com`
   - Password : `password`

2. **Vérifier la sidebar** :
   - ✅ Section "Tableau de bord"
   - ✅ Section "Gestion des Clients"
   - ✅ Section "Agenda & Rendez-vous"
   - ✅ Section "Services"
   - ✅ Section "Communication"
   - ✅ Section "Administration"

3. **Vérifier les menus déroulants** :
   - Cliquer sur "Clients" → voir "Liste des clients" et "Ajouter un client"
   - Cliquer sur "Dossiers" → voir les sous-menus
   - Cliquer sur "Paramètres" → voir les sous-menus

### Test 2 : Menu Client

1. **Créer un compte client** (si pas encore fait)
2. **Se connecter** en tant que client :
   - URL : `http://localhost:3001/auth/client-signin`

3. **Vérifier la sidebar** :
   - ✅ Section "Mon Espace"
   - ✅ Section "Mon Dossier"
   - ✅ Section "Rendez-vous & Communication"
   - ✅ Section "Services & Paiements"
   - ✅ Section "Mon Compte"

4. **Vérifier que le menu est différent** :
   - ❌ Pas de "Gestion des Clients"
   - ❌ Pas de "Administration"
   - ✅ "Mon dossier d'immigration" à la place

### Test 3 : Changement de type d'utilisateur

1. **Se connecter** en tant qu'admin
2. **Vérifier** le menu admin
3. **Se déconnecter**
4. **Se connecter** en tant que client
5. **Vérifier** que le menu a changé pour le menu client

---

## 🎨 Personnalisation

### Ajouter un élément au menu admin

Modifier `admin-menu-items.tsx` :

```typescript
{
  name: 'Nouveau menu',
  href: '/admin/nouveau',
  icon: <PiIconDuotone />,
  dropdownItems: [  // Optionnel
    {
      name: 'Sous-menu 1',
      href: '/admin/nouveau/sub1',
    },
  ],
},
```

### Ajouter un élément au menu client

Modifier `client-menu-items.tsx` :

```typescript
{
  name: 'Nouveau menu',
  href: '/client/nouveau',
  icon: <PiIconDuotone />,
},
```

### Ajouter un badge

```typescript
{
  name: 'Messages',
  href: '/admin/messages',
  icon: <PiHeadsetDuotone />,
  badge: 'NEW',  // ← Badge
},
```

### Ajouter une séparation (label)

```typescript
// label start
{
  name: 'Ma Nouvelle Section',
},
// label end
{
  name: 'Premier item',
  href: '/path',
  icon: <PiIcon />,
},
```

---

## 🔍 Icônes disponibles

Toutes les icônes viennent de `react-icons/pi` (Phosphor Icons Duotone) :

```typescript
import {
  PiFolderDuotone,         // Dossier
  PiCalendarDuotone,       // Calendrier
  PiUsersDuotone,          // Utilisateurs
  PiChartBarDuotone,       // Graphique
  PiGearDuotone,           // Paramètres
  PiFileDuotone,           // Document
  PiBriefcaseDuotone,      // Mallette
  PiHeadsetDuotone,        // Casque (support)
  PiBellDuotone,           // Cloche (notifications)
  PiCreditCardDuotone,     // Carte de crédit
  PiHouseDuotone,          // Maison
  PiUserDuotone,           // Utilisateur
  // ... et beaucoup d'autres
} from 'react-icons/pi';
```

**Voir toutes les icônes** : https://react-icons.github.io/react-icons/icons/pi/

---

## 📋 Routes à créer

Maintenant que les menus sont créés, vous devez créer les pages correspondantes :

### Routes Admin

```
/                           # Dashboard admin
/admin/clients              # Liste des clients
/admin/clients/create       # Ajouter un client
/admin/dossiers             # Tous les dossiers
/admin/dossiers/en-cours    # Dossiers en cours
/admin/dossiers/termines    # Dossiers terminés
/admin/dossiers/create      # Créer un dossier
/admin/documents            # Documents
/admin/appointments         # Rendez-vous
/admin/services             # Services
/admin/messages             # Messages
/admin/notifications        # Notifications
/admin/users/admins         # Liste des admins
/admin/settings             # Paramètres
```

### Routes Client

```
/client/dashboard           # Dashboard client
/client/dossier             # Dossier d'immigration
/client/dossier/status      # Statut du dossier
/client/documents           # Documents
/client/documents/upload    # Upload document
/client/appointments        # Rendez-vous
/client/appointments/create # Prendre rendez-vous
/client/messages            # Messages
/client/services            # Services
/client/payments            # Paiements
/client/profile             # Profil
/client/support             # Support
```

---

## 🎯 Prochaines étapes

### 1. Créer les pages correspondantes

Pour chaque lien dans les menus, créer la page correspondante :

```typescript
// Exemple: /admin/clients/page.tsx
export default function ClientsListPage() {
  return (
    <div>
      <h1>Liste des clients</h1>
      {/* ... */}
    </div>
  );
}
```

### 2. Protéger les routes par rôle

Ajouter une vérification du rôle dans `ProtectedRoute.tsx` :

```typescript
// Si route commence par /admin/ → vérifier userType === 'admin'
// Si route commence par /client/ → vérifier userType === 'client'
```

### 3. Ajouter des compteurs/badges dynamiques

Modifier les menus pour afficher des compteurs :

```typescript
{
  name: 'Messages',
  href: '/admin/messages',
  icon: <PiHeadsetDuotone />,
  badge: unreadCount.toString(), // Nombre dynamique
},
```

### 4. Créer les autres layouts

Répéter le processus pour les autres layouts si nécessaire :
- Helium
- Beryllium
- Carbon
- Boron
- Lithium

---

## 🐛 Dépannage

### Le menu ne change pas après connexion

1. ✅ Vérifier que `userType` est bien défini dans localStorage
2. ✅ Actualiser la page (F5)
3. ✅ Vérifier la console : `console.log('userType:', userType)`

### Erreur "Cannot read property..."

1. ✅ Vérifier que `useAuth()` retourne bien `userType`
2. ✅ Vérifier que les imports sont corrects dans `sidebar-menu.tsx`

### Les icônes ne s'affichent pas

1. ✅ Vérifier que l'import est correct : `from 'react-icons/pi'`
2. ✅ Vérifier que l'icône existe (nom exact avec Duotone)

---

## ✅ Résumé

Vous avez maintenant :

✅ **Menu Admin complet** avec :
- Gestion des clients et dossiers
- Agenda et rendez-vous
- Services d'immigration
- Communication (messages, notifications)
- Administration (utilisateurs, paramètres)

✅ **Menu Client complet** avec :
- Dashboard personnel
- Suivi de dossier
- Documents
- Rendez-vous
- Paiements
- Support

✅ **Chargement dynamique** :
- Détection automatique du type d'utilisateur
- Affichage conditionnel du bon menu
- useMemo pour optimisation

✅ **Personnalisable** :
- Facile d'ajouter des éléments
- Structure claire et organisée
- Icônes Phosphor harmonieuses

---

## 🎉 Félicitations !

Votre sidebar s'adapte maintenant automatiquement selon le type d'utilisateur. Les administrateurs et les clients ont chacun leur propre menu adapté à leurs besoins.

**Prochaine étape** : Créer les pages correspondantes pour chaque lien du menu ! 🚀


