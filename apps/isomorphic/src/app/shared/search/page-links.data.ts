/**
 * Index des pages cherchables depuis la barre de recherche du header.
 *
 * Chaque entrée a :
 *  - name      : libellé affiché
 *  - href      : URL cible
 *  - keywords  : mots-clés (français + anglais + synonymes) qui matchent la recherche
 *  - section   : catégorie pour le groupement
 *
 * Les entêtes (sans `href`) servent de séparateurs de section dans la liste.
 */

export interface PageLink {
  name: string;
  href?: string;
  keywords?: string[];
  section?: string;
}

export const pageLinks: PageLink[] = [
  // ────────────────────────────── Tableau de bord ──────────────────────────────
  { name: 'Tableau de bord' },
  {
    name: 'Dashboard',
    href: '/',
    section: 'Tableau de bord',
    keywords: ['accueil', 'home', 'main', 'principal', 'overview', 'résumé', 'tableau de bord', 'kpi'],
  },
  {
    name: 'Statistiques',
    href: '/analytics',
    section: 'Tableau de bord',
    keywords: ['statistiques', 'stats', 'analytics', 'rapports', 'metrics', 'chiffres', 'kpi', 'donnees'],
  },

  // ────────────────────────────── Clients & Dossiers ───────────────────────────
  { name: 'Clients & Dossiers' },
  {
    name: 'Liste des clients',
    href: '/admin/clients',
    section: 'Clients & Dossiers',
    keywords: ['clients', 'client', 'liste', 'personnes', 'utilisateurs', 'fiche', 'people', 'customer'],
  },
  {
    name: 'Nouveau client',
    href: '/admin/clients/create',
    section: 'Clients & Dossiers',
    keywords: ['nouveau client', 'ajouter client', 'créer client', 'inscription', 'add client', 'new'],
  },
  {
    name: 'Dossiers',
    href: '/admin/dossiers',
    section: 'Clients & Dossiers',
    keywords: ['dossier', 'dossiers', 'cas', 'case', 'file', 'demande', 'demarche', 'immigration', 'visa'],
  },
  {
    name: 'Nouveau dossier',
    href: '/admin/dossiers/create',
    section: 'Clients & Dossiers',
    keywords: ['nouveau dossier', 'créer dossier', 'open case', 'new file', 'nouvelle demarche'],
  },

  // ────────────────────────────── Documents ────────────────────────────────────
  { name: 'Documents' },
  {
    name: 'Gestionnaire de fichiers',
    href: '/file-manager',
    section: 'Documents',
    keywords: ['fichiers', 'files', 'documents', 'pdf', 'dossier partage', 'stockage', 'storage', 'gestionnaire'],
  },
  {
    name: 'Modèles de documents',
    href: '/configuration/document-templates',
    section: 'Documents',
    keywords: ['modèles', 'templates', 'pdf', 'formulaires', 'gabarit', 'document type', 'documents officiels'],
  },

  // ────────────────────────────── Rendez-vous ──────────────────────────────────
  { name: 'Agenda & Rendez-vous' },
  {
    name: 'Calendrier des rendez-vous',
    href: '/admin/appointments',
    section: 'Agenda & Rendez-vous',
    keywords: ['rendez-vous', 'rdv', 'agenda', 'calendrier', 'meetings', 'appointments', 'planning'],
  },
  {
    name: 'Nouveau rendez-vous',
    href: '/admin/appointments/create',
    section: 'Agenda & Rendez-vous',
    keywords: ['nouveau rdv', 'créer rendez-vous', 'reservation', 'booking', 'new appointment'],
  },

  // ────────────────────────────── Services & Immigration ──────────────────────
  { name: 'Services & Immigration' },
  {
    name: "Services d'immigration",
    href: '/services-immigration',
    section: 'Services & Immigration',
    keywords: [
      'visa', 'visas', 'immigration', 'service', 'services', 'permis', 'permit',
      'travail', 'work', 'études', 'study', 'student', 'residence permanente',
      'pr', 'citoyenneté', 'citizenship', 'parrainage', 'sponsorship',
      'refugie', 'refugee', 'asile', 'asylum', 'express entry', 'pnp',
      'visiteur', 'tourist', 'visitor', 'super visa',
    ],
  },

  // ────────────────────────────── Envois & Formulaires ────────────────────────
  { name: 'Envois & Formulaires' },
  {
    name: 'Envois groupés',
    href: '/envois',
    section: 'Envois & Formulaires',
    keywords: ['envois', 'envoi', 'invitations', 'invitation', 'groupé', 'bulk', 'campagne'],
  },
  {
    name: 'Nouvel envoi',
    href: '/envois/nouveau',
    section: 'Envois & Formulaires',
    keywords: ['nouvel envoi', 'créer envoi', 'new send', 'nouvelle invitation'],
  },
  {
    name: 'Questionnaires (legacy)',
    href: '/questionnaires',
    section: 'Envois & Formulaires',
    keywords: ['questionnaire', 'formulaire', 'form', 'survey', 'enquête', 'legacy'],
  },
  {
    name: 'Catégories de formulaires',
    href: '/configuration/categories',
    section: 'Envois & Formulaires',
    keywords: ['catégorie', 'categories', 'classement', 'tags', 'rubrique'],
  },
  {
    name: 'Types de formulaires',
    href: '/configuration/form-types',
    section: 'Envois & Formulaires',
    keywords: ['type formulaire', 'form type', 'gabarit', 'modèle formulaire'],
  },

  // ────────────────────────────── Communication ────────────────────────────────
  { name: 'Communication' },
  {
    name: 'Messages',
    href: '/admin/messages',
    section: 'Communication',
    keywords: ['messages', 'chat', 'discussion', 'inbox', 'boîte de réception', 'conversations'],
  },
  {
    name: 'Notifications',
    href: '/admin/notifications',
    section: 'Communication',
    keywords: ['notifications', 'alertes', 'alerts', 'rappel', 'reminder'],
  },
  {
    name: 'Nouvelles & Articles',
    href: '/admin/news/articles',
    section: 'Communication',
    keywords: ['news', 'nouvelles', 'articles', 'blog', 'actualités', 'publications'],
  },
  {
    name: 'Tableau de bord nouvelles',
    href: '/podcast',
    section: 'Communication',
    keywords: ['news', 'nouvelles', 'feed', 'actualités', 'sources', 'rss'],
  },

  // ────────────────────────────── Administration ───────────────────────────────
  { name: 'Administration' },
  {
    name: 'Liste des administrateurs',
    href: '/admin/users/admins',
    section: 'Administration',
    keywords: ['administrateurs', 'admins', 'équipe', 'team', 'staff', 'utilisateurs admin'],
  },
  {
    name: 'Ajouter un administrateur',
    href: '/admin/users/admins/create',
    section: 'Administration',
    keywords: ['nouvel admin', 'créer admin', 'invitation admin', 'add admin', 'new admin'],
  },
  {
    name: 'Mon profil',
    href: '/forms/profile-settings',
    section: 'Administration',
    keywords: [
      'profil', 'profile', 'mon compte', 'paramètres profil', 'account', 'avatar',
      'mot de passe', 'password', 'écran de verrouillage', 'lock screen',
      'images de fond', 'wallpaper', 'background',
    ],
  },
  {
    name: 'Paramètres généraux',
    href: '/admin/settings/general',
    section: 'Administration',
    keywords: ['paramètres', 'settings', 'configuration', 'général'],
  },
  {
    name: 'Sécurité',
    href: '/admin/settings/security',
    section: 'Administration',
    keywords: ['sécurité', 'security', 'mot de passe', 'password', '2fa', 'sessions'],
  },
];

/** Normaliser une chaîne pour la comparaison (sans accents, minuscules). */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

/**
 * Filtre l'index selon la requête. Match sur le nom, la section et les mots-clés.
 * Chaque token de la requête doit matcher au moins une partie pour qu'une entrée soit retenue.
 * Les en-têtes de section sont injectées avant le premier résultat de chaque section.
 */
export function searchPages(query: string): PageLink[] {
  const q = normalize(query);
  if (!q) return pageLinks;

  const tokens = q.split(/\s+/).filter(Boolean);

  const matches = pageLinks.filter((p) => {
    if (!p.href) return false; // ignorer les en-têtes
    const haystack = normalize([p.name, p.section ?? '', (p.keywords ?? []).join(' ')].join(' '));
    return tokens.every((t) => haystack.includes(t));
  });

  // Re-grouper avec les en-têtes de section
  const result: PageLink[] = [];
  const sectionsAdded = new Set<string>();
  for (const m of matches) {
    const sec = m.section ?? '';
    if (sec && !sectionsAdded.has(sec)) {
      result.push({ name: sec });
      sectionsAdded.add(sec);
    }
    result.push(m);
  }
  return result;
}
