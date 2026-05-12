/**
 * Données mockées pour la page "Nouvelles" (immigration).
 * À remplacer plus tard par des appels backend si on crée un module CMS.
 */

import {
  PiScalesThin,
  PiPassportThin,
  PiBuildingsThin,
  PiGlobeThin,
  PiUsersThreeThin,
  PiGraduationCapThin,
} from 'react-icons/pi';

// Annonces récentes (remplace "Recently Played")
export const recentNews = [
  {
    id: 1,
    name: 'Mise à jour du seuil minimum d\'Entrée Express',
    authorName: 'Bureau IRCC — 8 mai 2026',
    thumb:
      'https://isomorphic-furyroad.s3.amazonaws.com/public/podcast/recent-played-image-1.webp',
    track:
      'https://isomorphic-furyroad.s3.amazonaws.com/public/podcast/melody.mp3',
  },
  {
    id: 2,
    name: 'PSTQ : nouveaux critères de pointage 2026',
    authorName: 'MIFI Québec — 3 mai 2026',
    thumb:
      'https://isomorphic-furyroad.s3.amazonaws.com/public/podcast/recent-played-image-2.webp',
    track:
      'https://isomorphic-furyroad.s3.amazonaws.com/public/podcast/audio.mp3',
  },
  {
    id: 3,
    name: 'Permis de travail post-diplôme : durée prolongée',
    authorName: 'IRCC — 28 avril 2026',
    thumb:
      'https://isomorphic-furyroad.s3.amazonaws.com/public/podcast/recent-played-image-3.webp',
    track:
      'https://isomorphic-furyroad.s3.amazonaws.com/public/podcast/melody.mp3',
  },
  {
    id: 4,
    name: 'Programme des candidats des provinces : ouverture des tirages',
    authorName: 'PCP — 22 avril 2026',
    thumb:
      'https://isomorphic-furyroad.s3.amazonaws.com/public/podcast/recent-played-image-4.webp',
    track:
      'https://isomorphic-furyroad.s3.amazonaws.com/public/podcast/audio.mp3',
  },
];

// Programmes d'immigration (remplace "Featured by Creator")
export const featuredPrograms = [
  {
    id: 1,
    name: 'Entrée Express — Travailleurs qualifiés fédéraux',
    thumb:
      'https://isomorphic-furyroad.s3.amazonaws.com/public/podcast/featured-podcast-1.webp',
  },
  {
    id: 2,
    name: 'Programme régulier des travailleurs qualifiés (PRTQ)',
    thumb:
      'https://isomorphic-furyroad.s3.amazonaws.com/public/podcast/featured-podcast-2.webp',
  },
  {
    id: 3,
    name: 'Programme de l\'expérience québécoise (PEQ)',
    thumb:
      'https://isomorphic-furyroad.s3.amazonaws.com/public/podcast/featured-podcast-3.webp',
  },
  {
    id: 4,
    name: 'Programme des candidats des provinces (PCP)',
    thumb:
      'https://isomorphic-furyroad.s3.amazonaws.com/public/podcast/featured-podcast-4.webp',
  },
];

// Sources / agences (remplace "Top podcasters")
export const topSources = [
  {
    id: 1,
    name: 'IRCC Canada',
    avatar:
      'https://isomorphic-furyroad.s3.amazonaws.com/public/avatars/avatar-15.webp',
    followers: 24560,
    following: true,
  },
  {
    id: 2,
    name: 'MIFI Québec',
    avatar:
      'https://isomorphic-furyroad.s3.amazonaws.com/public/avatars/avatar-14.webp',
    followers: 18230,
    following: true,
  },
  {
    id: 3,
    name: 'CISR — Conseil d\'immigration',
    avatar:
      'https://isomorphic-furyroad.s3.amazonaws.com/public/avatars/avatar-10.webp',
    followers: 12110,
    following: false,
  },
  {
    id: 4,
    name: 'Programme PCP Ontario',
    avatar:
      'https://isomorphic-furyroad.s3.amazonaws.com/public/avatars/avatar-11.webp',
    followers: 9870,
    following: true,
  },
  {
    id: 5,
    name: 'Service Canada',
    avatar:
      'https://isomorphic-furyroad.s3.amazonaws.com/public/avatars/avatar-12.webp',
    followers: 15040,
    following: false,
  },
  {
    id: 6,
    name: 'Bureau d\'Immigration QC',
    avatar:
      'https://isomorphic-furyroad.s3.amazonaws.com/public/avatars/avatar-13.webp',
    followers: 8650,
    following: false,
  },
  {
    id: 7,
    name: 'PCP Colombie-Britannique',
    avatar:
      'https://isomorphic-furyroad.s3.amazonaws.com/public/avatars/avatar-14.webp',
    followers: 6420,
    following: false,
  },
  {
    id: 8,
    name: 'PCP Alberta',
    avatar:
      'https://isomorphic-furyroad.s3.amazonaws.com/public/avatars/avatar-15.webp',
    followers: 5230,
    following: true,
  },
];

// Guides favoris (remplace "Favourite playlist")
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

// Catégories — lois et règlements IRCC (remplace "Podcast Categories")
export const newsCategories = [
  {
    id: 1,
    name: 'Lois IRCC',
    icon: PiScalesThin,
  },
  {
    id: 2,
    name: 'Passeport & Visa',
    icon: PiPassportThin,
  },
  {
    id: 3,
    name: 'Programmes provinciaux',
    icon: PiBuildingsThin,
  },
  {
    id: 4,
    name: 'Immigration internationale',
    icon: PiGlobeThin,
  },
  {
    id: 5,
    name: 'Regroupement familial',
    icon: PiUsersThreeThin,
  },
  {
    id: 6,
    name: 'Permis d\'études',
    icon: PiGraduationCapThin,
  },
];

// Agenda des annonces / webinaires
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
