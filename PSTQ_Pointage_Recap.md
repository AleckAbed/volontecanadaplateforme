# PSTQ — Récapitulatif complet du système de pointage
## Spécification fonctionnelle et technique (Cursor-ready)

---

## 1. Objectif
Ce document décrit **intégralement** le système de pointage du **Programme de sélection des travailleurs qualifiés (PSTQ)** afin de permettre l’implémentation :
- d’un **formulaire de déclaration d’intérêt**,
- d’un **calculateur automatique de score**,
- d’un **classement des candidats** selon le score.

Le PSTQ fonctionne par **classement basé sur un pointage**, avec invitations émises aux candidats les mieux classés.

---

## 2. Processus global
1. Saisie de la déclaration d’intérêt
2. Validation des données
3. Calcul des points par blocs
4. Calcul du score total
5. Classement par score décroissant
6. En cas d’égalité : priorité à la **date et l’heure de soumission**

---

## 3. Structure du score

| Bloc | Intitulé | Points max |
|---|---|---|
| A | Capital humain | 520 |
| B | Réponse aux besoins du Québec | 700 |
| C | Facteurs d’adaptation | 180 |

**Score total maximal ≈ 1400 points**

---

## 4. Bloc A — Capital humain (520)

### A1. Connaissance du français (4 compétences)
**Champs :**
- comprehension_orale (1–12)
- production_orale (1–12)
- comprehension_ecrite (1–12)
- production_ecrite (1–12)
- avec_conjoint (bool)

**Barème (par compétence)**

| Niveau | Seul | Avec conjoint |
|---|---:|---:|
| 1–4 | 0 | 0 |
| 5–6 | 38 | 30 |
| 7–8 | 44 | 35 |
| 9–12 | 50 | 40 |

Max : **200 (seul)** / **160 (avec conjoint)**

---

### A2. Âge (calculé à la date d’extraction)

| Âge | Seul | Avec conjoint |
|---|---:|---:|
| 20–30 | 120 | 100 |
| 31 | 110 | 95 |
| 32 | 100 | 90 |
| 33 | 90 | 81 |
| 34 | 80 | 72 |
| 35 | 75 | 68 |
| 36 | 70 | 63 |
| 37 | 65 | 59 |
| 38 | 60 | 54 |
| 39 | 55 | 50 |
| 40 | 50 | 45 |
| 41 | 40 | 36 |
| 42 | 30 | 27 |
| 43 | 20 | 18 |
| 44 | 10 | 9 |
| ≥45 | 0 | 0 |

---

### A3. Expérience de travail (5 dernières années)

| Durée (mois) | Seul | Avec conjoint |
|---|---:|---:|
| <12 | 0 | 0 |
| 12–23 | 20 | 15 |
| 24–35 | 40 | 30 |
| 36–47 | 50 | 35 |
| ≥48 | 70 | 50 |

---

### A4. Niveau de scolarité (plus élevé retenu)

| Diplôme | Seul | Avec conjoint |
|---|---:|---:|
| Secondaire | 13 | 11 |
| Postsec. général (2 ans) | 39 | 33 |
| Technique (3 ans) | 78 | 66 |
| Univ. 1er cycle (3–4 ans) | 104 | 88 |
| Univ. 2e cycle | 117 | 99 |
| Univ. 3e cycle | 130 | 110 |

---

## 5. Bloc B — Réponse aux besoins du Québec (700)

### B1. Profession principale + diagnostic
**Champs :**
- cnp_code
- diagnostic (equilibre | leger_deficit | deficit)
- experience_profession_mois

**Extrait — Diagnostic “déficit”**

| Expérience | Points |
|---|---:|
| 12–23 | 90 |
| 24–35 | 100 |
| 36–47 | 110 |
| ≥48 | 120 |

---

### B2. Diplôme obtenu au Québec

| Diplôme QC | Points |
|---|---:|
| Secondaire | 20 |
| DEP ≥900h | 40 |
| Technique 3 ans | 120 |
| Univ. 3–4 ans | 160 |
| 2e cycle | 180 |
| 3e cycle | 200 |

---

### B3. Expérience de travail au Québec

| Durée | Points |
|---|---:|
| <12 | 0 |
| 12–23 | 40 |
| 24–35 | 80 |
| 36–47 | 120 |
| ≥48 | 160 |

---

### B4. Expérience hors Montréal
- **Résidence ≥48 mois** : 40 points
- **Travail ≥48 mois** : 60 points
- **Études ≥48 mois** : 20 points

---

### B5. Offre d’emploi validée

| Lieu | Points |
|---|---:|
| Hors Montréal | 50 |
| Montréal | 30 |

---

### B6. Autorisation d’exercer
- Permis ou reconnaissance partielle/complète : **50 points**

---

## 6. Bloc C — Facteurs d’adaptation (180)

### C1. Études au Québec sans diplôme
- Jusqu’à **30 points** selon la durée

### C2. Famille au Québec

| Lien | Points |
|---|---:|
| Direct | 10 |
| Via conjoint | 5 |

### C3. Profil du conjoint
- Français : max 40
- Âge : max 20
- Expérience QC : max 30
- Scolarité : max 20
- Diplôme QC : max 30

---

## 7. Calcul final
```
score_total = bloc_A + bloc_B + bloc_C
```

---

## 8. Règles de classement
- Classement par score décroissant
- En cas d’égalité : date puis heure de soumission

---

## 9. Exigences techniques
- Formulaire multi-étapes
- Calcul en temps réel
- Tables de correspondance centralisées
- Validation stricte
- Tests unitaires par barème

---

## 10. Livrables
- Formulaire PSTQ
- Calculateur de score
- Récapitulatif du score
- API de classement prête
