# 🚀 Guide d'optimisation des performances

## Pourquoi la latence en mode développement ?

### Le problème
Next.js en mode dev utilise la **compilation à la demande** (on-demand compilation) :
- ❌ Ce n'est PAS comme une SPA classique (React/Vue) où tout est bundlé au démarrage
- ✅ Chaque route est compilée **uniquement lors de la première visite**
- ⏱️ Première navigation = 5-8 secondes de compilation
- ⚡ Navigations suivantes vers la même page = instantané

### Pourquoi Next.js fait ça ?
- **Performance au démarrage** : Le serveur démarre en ~1 seconde au lieu de 30-60 secondes
- **Économie de ressources** : Compile seulement ce que vous utilisez
- **Code-splitting automatique** : Chaque page est un chunk séparé

## 📊 Comparaison des solutions

| Solution | Latence 1ère visite | Latence suivantes | Temps de démarrage | Utilisation |
|----------|---------------------|-------------------|-------------------|-------------|
| **Mode Dev normal** | 5-8s | Instantané | 1s | Développement |
| **Mode Dev + Turbopack** | 3-5s | Instantané | 1s | Développement (actuel) |
| **Mode Dev + Warmup** | Instantané* | Instantané | 2-3min | Développement |
| **Mode Production** | Instantané | Instantané | 2-5min build | Tests/Démo |

*après le warmup

## 🎯 Solutions

### Solution 1 : Accepter la latence en dev (recommandé)
**C'est le comportement normal de Next.js en développement**
- ✅ Démarrage rapide du serveur
- ✅ Hot reload rapide
- ❌ Latence à la première visite d'une page

**Quand l'utiliser** : Développement quotidien

---

### Solution 2 : Script de warmup
Pré-compile les routes principales au démarrage

```bash
# Lancer le dev avec warmup automatique
pnpm dev:warmup
```

Le script `scripts/warmup-routes.js` va visiter toutes les routes principales et les compiler.

**Avantages** :
- ✅ Navigation instantanée après warmup
- ✅ Toujours en mode dev (hot reload actif)

**Inconvénients** :
- ❌ Temps de démarrage plus long (2-3 minutes)
- ❌ À refaire après chaque restart

**Quand l'utiliser** : Démos, tests utilisateurs

---

### Solution 3 : Mode production local
Build + start pour avoir les vraies performances

```bash
# Build une fois
pnpm build

# Démarrer en mode production
pnpm start

# Ou tout en une commande
pnpm build:start
```

**Avantages** :
- ✅ Navigation **instantanée** (tout est pré-compilé)
- ✅ Performance identique à la production
- ✅ Optimisations activées (minification, tree-shaking)

**Inconvénients** :
- ❌ Pas de hot reload
- ❌ Rebuild nécessaire pour voir les changements
- ❌ Build initial long (2-5 minutes)

**Quand l'utiliser** : Tests de performance, démos clients, tests finaux

---

### Solution 4 : Fast Refresh amélioré
Activer le prefetching plus agressif (déjà fait)

Dans `next.config.mjs` :
```javascript
experimental: {
  optimizePackageImports: ['@headlessui/react', 'react-icons', 'recharts', 'motion'],
}
```

**Impact** : Réduit la latence de 30-40% mais ne l'élimine pas complètement

---

## 🔧 Configuration actuelle

Votre projet utilise actuellement :
- ✅ **Turbopack** activé (compilateur ultra-rapide en Rust)
- ✅ **Optimisation des imports** pour les bibliothèques lourdes
- ✅ Script **warmup** disponible via `pnpm dev:warmup`
- ✅ Script **build:start** pour mode production

## 📝 Recommandations par cas d'usage

### Développement quotidien
```bash
pnpm dev
```
- Accepter la latence à la première visite
- C'est normal et voulu par Next.js

### Démo client / Tests utilisateurs
```bash
pnpm dev:warmup
```
- Temps de démarrage plus long mais navigation fluide ensuite

### Tests de performance / Staging
```bash
pnpm build:start
```
- Performance réelle de production

## 🔍 Debug : Voir ce qui est compilé

Dans la console du terminal, vous verrez :
```
○ Compiling /your-page ...
✓ Compiled /your-page in 3.5s
```

C'est normal ! Ça n'arrive qu'**une fois par page** par session de développement.

## ❓ FAQ

**Q: Pourquoi ma SPA est lente alors que les pages ne se rechargent pas ?**
R: Next.js n'est pas une SPA traditionnelle. Il utilise le code-splitting automatique, donc chaque route est un chunk séparé qui doit être compilé en dev.

**Q: Les utilisateurs finaux auront cette latence ?**
R: Non ! En production, tout est pré-compilé. La navigation est instantanée.

**Q: Comment éliminer complètement la latence en dev ?**
R: Soit utiliser le script warmup, soit utiliser le mode production localement.

**Q: Est-ce que Turbopack résout le problème ?**
R: Partiellement. Il réduit la latence de ~8s à ~3-5s, mais ne l'élimine pas complètement en dev.


