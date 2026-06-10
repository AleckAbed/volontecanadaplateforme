/**
 * Données mockées pour la page "Nouvelles".
 *
 * NOTE: depuis l'intégration du backend, la plupart des sections de
 * /podcast (Recently / Featured / Top Sources / Explore Categories) sont
 * branchées sur l'API. Ces données restent uniquement comme fallback pour
 * Favorite Playlist (Guides favoris) et l'agenda de planification d'annonces.
 */

// Guides favoris (encore en mock — pas encore de table dédiée côté backend)
export const favouriteGuides = [
  {
    id: 1,
    name: 'Guide complet de l\'Entrée Express',
    avatar:
      'https://isomorphic-furyroad.s3.amazonaws.com/public/podcast/playlist-image-1.webp',
    duration: '12 min de lecture',
    followed: true,
  },
  {
    id: 2,
    name: 'Préparer son dossier de RP au Québec',
    avatar:
      'https://isomorphic-furyroad.s3.amazonaws.com/public/podcast/playlist-image-2.webp',
    duration: '8 min de lecture',
    followed: true,
  },
  {
    id: 3,
    name: 'PSTQ : comprendre le calcul des points',
    avatar:
      'https://isomorphic-furyroad.s3.amazonaws.com/public/podcast/playlist-image-3.webp',
    duration: '15 min de lecture',
    followed: true,
  },
  {
    id: 4,
    name: 'Demande de citoyenneté : étapes clés',
    avatar:
      'https://isomorphic-furyroad.s3.amazonaws.com/public/podcast/playlist-image-4.webp',
    duration: '10 min de lecture',
    followed: false,
  },
  {
    id: 5,
    name: 'Permis d\'études : démarches IRCC',
    avatar:
      'https://isomorphic-furyroad.s3.amazonaws.com/public/podcast/playlist-image-5.webp',
    duration: '7 min de lecture',
    followed: false,
  },
  {
    id: 6,
    name: 'Regroupement familial expliqué',
    avatar:
      'https://isomorphic-furyroad.s3.amazonaws.com/public/podcast/playlist-image-1.webp',
    duration: '11 min de lecture',
    followed: true,
  },
];

// Agenda des annonces / webinaires (mock, pas encore de table dédiée)
const now = new Date();
export const newsScheduleData = [
  {
    id: 1,
    date: new Date(now.setHours(10, 0, 0, 0)),
    name: 'Webinaire : nouveautés Entrée Express 2026',
  },
  {
    id: 2,
    date: new Date(new Date().setHours(14, 30, 0, 0)),
    name: 'Annonce officielle MIFI — seuils PSTQ',
  },
  {
    id: 3,
    date: new Date(new Date().setHours(16, 0, 0, 0)),
    name: 'Mise à jour des frais consulaires',
  },
  {
    id: 4,
    date: new Date(new Date().setHours(18, 0, 0, 0)),
    name: 'Q&R : préparer son entrevue IRCC',
  },
];
