/**
 * Citations courtes et textes de loi affichés aléatoirement sur l'écran de verrouillage.
 * Mix de citations sur l'immigration, le droit, et l'inspiration professionnelle.
 */

export interface LockQuote {
  text: string;
  author?: string;
}

export const LOCK_SCREEN_QUOTES: LockQuote[] = [
  // Droit & immigration canadienne
  {
    text: "Le Canada est une terre d'accueil bâtie sur la diversité et le respect.",
    author: 'Charte canadienne des droits',
  },
  {
    text: "Chaque dossier est l'histoire d'une vie qui aspire à un avenir meilleur.",
  },
  {
    text: "La loi sur l'immigration vise la réunification des familles et l'enrichissement social.",
    author: 'LIPR, art. 3',
  },
  {
    text: 'Toute personne a droit à la vie, à la liberté et à la sécurité de sa personne.',
    author: 'Charte, art. 7',
  },
  {
    text: "L'égalité devant la loi est un fondement de la démocratie canadienne.",
    author: 'Charte, art. 15',
  },
  {
    text: "Le statut de réfugié protège ceux qui craignent avec raison d'être persécutés.",
    author: 'Convention de Genève, 1951',
  },
  {
    text: "La citoyenneté est un lien sacré entre l'individu et la nation.",
  },
  {
    text: "L'intérêt supérieur de l'enfant doit guider toute décision migratoire.",
    author: 'LIPR, art. 25',
  },

  // Citations inspirantes
  {
    text: 'Le travail bien fait est sa propre récompense.',
    author: 'Proverbe',
  },
  {
    text: "La patience est l'art de cacher son impatience.",
    author: 'Guitry',
  },
  {
    text: "Rien de grand ne s'est jamais accompli sans enthousiasme.",
    author: 'Emerson',
  },
  {
    text: "L'avenir appartient à ceux qui croient à la beauté de leurs rêves.",
    author: 'Eleanor Roosevelt',
  },
  {
    text: "La justice retardée est une justice refusée.",
    author: 'William Gladstone',
  },
  {
    text: 'Chaque petit pas compte sur le long chemin vers la réussite.',
  },
  {
    text: "L'excellence est un voyage, pas une destination.",
  },
  {
    text: 'La rigueur et la bienveillance sont les piliers du conseil juridique.',
  },

  // Confidentialité & professionnalisme
  {
    text: 'Le secret professionnel protège la confiance qui nous est confiée.',
  },
  {
    text: 'Une session verrouillée est une donnée protégée.',
  },
  {
    text: 'La discrétion est la première vertu du conseiller.',
  },
  {
    text: "Protéger les informations de nos clients, c'est honorer leur confiance.",
  },

  // Pause / bien-être
  {
    text: 'Une pause bien prise vaut mieux qu’une heure de distraction.',
  },
  {
    text: 'Respire. Recentre-toi. Reprends.',
  },
  {
    text: "Le repos est aussi essentiel que l'effort.",
  },
  {
    text: 'Prendre du recul, c’est aussi avancer.',
  },
];

/** Retourne une citation aléatoire. */
export function getRandomLockQuote(): LockQuote {
  const i = Math.floor(Math.random() * LOCK_SCREEN_QUOTES.length);
  return LOCK_SCREEN_QUOTES[i];
}
