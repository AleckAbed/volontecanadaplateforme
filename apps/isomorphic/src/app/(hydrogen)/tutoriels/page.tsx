'use client';

import Link from 'next/link';
import {
  PiBookOpenDuotone,
  PiUsersThreeDuotone,
  PiFolderUserDuotone,
  PiFileDuotone,
  PiBriefcaseDuotone,
  PiFileTextDuotone,
  PiPaperPlaneTiltDuotone,
  PiUserPlusDuotone,
  PiChartBarDuotone,
  PiLightbulbDuotone,
} from 'react-icons/pi';

interface Guide {
  id: string;
  icon: React.ReactNode;
  title: string;
  summary: string;
  link?: string;
  /** Explication globale du rôle de la fonctionnalité dans le système. */
  whatItDoes: string;
  /** Cas d'usage concrets : « quand utiliser cette section ». */
  whenToUse: string[];
  /** Étapes détaillées avec contexte. */
  steps: { title: string; body: string }[];
  /** Pièges fréquents / conseils. */
  tips?: string[];
}

const GUIDES: Guide[] = [
  {
    id: 'clients',
    icon: <PiUsersThreeDuotone className="h-6 w-6" />,
    title: 'Gestion des clients',
    summary: 'Le carnet d\'adresses central de votre cabinet.',
    link: '/admin/clients',
    whatItDoes:
      'Cette section regroupe tous les clients que votre cabinet accompagne. Chaque client est une fiche centralisée qui contient ses coordonnées, son statut (au Canada ou à l\'étranger), ses membres de famille (s\'il s\'agit d\'un dossier familial) et toutes les invitations qui lui ont été envoyées. C\'est la porte d\'entrée de tout votre travail : sans client enregistré, vous ne pouvez créer ni dossier ni envoi.',
    whenToUse: [
      'Vous recevez une nouvelle demande de prise en charge — créez d\'abord la fiche client.',
      'Vous voulez consulter l\'historique d\'un client (dossiers ouverts, invitations envoyées, etc.).',
      'Vous devez mettre à jour les informations d\'un client (changement d\'adresse, statut au Canada, etc.).',
    ],
    steps: [
      {
        title: 'Créer un client',
        body: 'Cliquez sur « Ajouter un client » en haut à droite. Choisissez d\'abord le type : client unique (une seule personne) ou famille (avec membres rattachés). Renseignez les coordonnées de base : nom, courriel, téléphone, mot de passe. Indiquez si le client se trouve actuellement sur le territoire canadien — cette information adapte automatiquement les documents qui lui seront proposés (les modèles destinés aux clients hors Canada ne sont pas envoyés aux clients au Canada, et vice versa).',
      },
      {
        title: 'Ajouter des membres de famille',
        body: 'Si le client est de type famille, une seconde étape vous demande les membres : conjoint, enfants, parents, etc. Chacun a son propre courriel (optionnel) pour pouvoir recevoir directement des invitations distinctes de celles du client principal.',
      },
      {
        title: 'Consulter ou modifier',
        body: 'Cliquez sur une ligne du tableau pour voir la fiche détaillée du client. De là, vous pouvez modifier ses infos, lancer une nouvelle invitation, ouvrir un nouveau dossier, ou consulter l\'historique de ses échanges avec le cabinet.',
      },
      {
        title: 'Désactiver un compte',
        body: 'Plutôt que de supprimer un client (ce qui efface son historique), désactivez-le. Il n\'apparaît plus dans les listes mais ses dossiers et invitations restent consultables. Vous pouvez le réactiver à tout moment.',
      },
    ],
    tips: [
      'Le statut « au Canada » est crucial pour la sélection automatique des bons documents IRCC.',
      'Un courriel doit être unique : impossible de créer deux clients avec la même adresse.',
    ],
  },
  {
    id: 'dossiers',
    icon: <PiFolderUserDuotone className="h-6 w-6" />,
    title: 'Dossiers',
    summary: 'Le suivi d\'une demande d\'immigration de A à Z.',
    link: '/admin/dossiers',
    whatItDoes:
      'Un dossier représente une demande d\'immigration concrète (visa, résidence permanente, parrainage, etc.) qu\'un client a engagée auprès du cabinet. Il sert de regroupement pour tout ce qui touche cette demande : les documents IRCC à préparer en interne, les formulaires demandés au client, les fichiers téléversés, les notes, l\'échéance, le collaborateur en charge. C\'est l\'unité de travail principale du cabinet.',
    whenToUse: [
      'Un client signe une mission pour un type d\'immigration précis — ouvrez un dossier.',
      'Vous voulez suivre l\'avancement d\'un dossier (documents reçus, formulaires complétés, statut).',
      'Vous devez transmettre un dossier à un collègue (assignation à un collaborateur).',
    ],
    steps: [
      {
        title: 'Créer un dossier',
        body: 'Cliquez sur « Nouveau dossier ». Choisissez le client (déjà créé au préalable), définissez le périmètre (client seul, membre spécifique de la famille, ou toute la famille), et choisissez le service d\'immigration (par exemple « Résidence Permanente »). À la création, le système attache automatiquement les modèles de documents d\'immigration IRCC associés à ce service — vous n\'avez pas besoin de les chercher un par un.',
      },
      {
        title: 'Assigner un collaborateur',
        body: 'Sélectionnez le collaborateur qui va remplir les documents IRCC. Il reçoit aussitôt un email automatique avec un lien direct vers le dossier. Vous pouvez aussi cocher « Autoriser le collaborateur à téléverser des fichiers complémentaires » s\'il aura besoin d\'ajouter ses propres pièces (preuves, scans, justificatifs).',
      },
      {
        title: 'Préparer les documents IRCC',
        body: 'La section « Documents d\'immigration IRCC » liste les PDF à remplir avant la soumission. Vous pouvez en ajouter manuellement depuis la bibliothèque (modèles) ou téléverser un PDF spécifique. L\'option « Envoyer les documents d\'immigration IRCC au client » détermine si ces documents seront pré-cochés à la prochaine invitation envoyée au client.',
      },
      {
        title: 'Envoyer une invitation',
        body: 'Depuis la page de détail du dossier, cliquez sur « Nouvelle invitation ». Le client est pré-sélectionné, ainsi que le dossier. Cochez les formulaires et documents que vous voulez lui demander, ajoutez un message personnalisé, et envoyez. Le client reçoit un email avec un lien sécurisé.',
      },
      {
        title: 'Suivre l\'avancement',
        body: 'La page de détail du dossier affiche en temps réel : les documents IRCC remplis par le collaborateur, les invitations envoyées (avec leur statut : à faire, en cours, complété), les fichiers téléversés par le client, et les notes internes.',
      },
    ],
    tips: [
      'Le service d\'immigration choisi est filtré par la localisation du client (in_canada / outside_canada).',
      'Un dossier peut être assigné à un seul collaborateur à la fois.',
      'Les documents attachés sont des « snapshots » : modifier le modèle dans la bibliothèque ne change pas le PDF d\'un dossier déjà créé.',
    ],
  },
  {
    id: 'collaborators',
    icon: <PiUserPlusDuotone className="h-6 w-6" />,
    title: 'Collaborateurs',
    summary: 'Partagez le travail avec votre équipe.',
    link: '/admin/collaborators',
    whatItDoes:
      'Les collaborateurs sont des utilisateurs avec un accès restreint : ils peuvent travailler sur les dossiers qui leur sont assignés, mais ne voient ni les autres clients, ni les autres dossiers, ni les paramètres du cabinet. Ils disposent d\'un espace dédié (`/collab/login`) séparé de l\'interface administrateur. C\'est idéal pour déléguer le remplissage des documents IRCC, le suivi d\'un client précis, ou la sous-traitance ponctuelle.',
    whenToUse: [
      'Vous voulez confier le remplissage des documents IRCC d\'un dossier à un junior ou un consultant.',
      'Vous travaillez avec un partenaire externe sur un dossier en particulier.',
      'Vous voulez segmenter l\'accès aux dossiers selon les responsabilités de chaque collaborateur.',
    ],
    steps: [
      {
        title: 'Créer un compte collaborateur',
        body: 'Cliquez sur « + Nouveau collaborateur ». Renseignez le nom, prénom, courriel et téléphone. Saisissez un mot de passe initial — il sera remplacé par le collaborateur lors de l\'activation. Le compte est créé en mode « inactif » : il ne peut pas encore se connecter.',
      },
      {
        title: 'Envoyer le lien d\'activation',
        body: 'Cliquez sur « Envoyer le lien de connexion » sur la carte du collaborateur. Il reçoit un email avec un lien unique valable 7 jours. En cliquant dessus, il définit son propre mot de passe (avec les règles de sécurité : 8 caractères, majuscule, minuscule, chiffre, spécial). Une fois activé, son compte devient actif et il peut se connecter.',
      },
      {
        title: 'Affecter à un dossier',
        body: 'Depuis la fiche d\'un dossier (en édition), choisissez le collaborateur dans le dropdown. Une notification email automatique l\'informe immédiatement du nouveau dossier, avec un lien direct.',
      },
      {
        title: 'Suivi du travail',
        body: 'Vous voyez sur chaque carte le nombre de dossiers assignés à chaque collaborateur. Vous pouvez aussi consulter les documents qu\'ils ont remplis depuis la page de détail du dossier.',
      },
    ],
    tips: [
      'Un compte inactif ne peut pas se connecter, même avec le bon mot de passe.',
      'Si le lien d\'activation a expiré, renvoyez-en un — il invalide automatiquement l\'ancien.',
      'Vous pouvez désactiver un collaborateur sans supprimer son compte (utile en cas de départ temporaire).',
    ],
  },
  {
    id: 'document-templates',
    icon: <PiFileTextDuotone className="h-6 w-6" />,
    title: 'Modèles de documents',
    summary: 'Bibliothèque centrale des PDF récurrents.',
    link: '/documents',
    whatItDoes:
      'Les modèles de documents sont des PDF que vous utilisez régulièrement : formulaires IRCC, contrats du cabinet, lettres types, etc. Au lieu de re-téléverser le même PDF à chaque dossier, vous le déposez une fois dans la bibliothèque et il est ensuite disponible pour tous les dossiers et toutes les invitations. Vous pouvez aussi indiquer à quel service d\'immigration il est rattaché et à quel type de client (au Canada / hors Canada).',
    whenToUse: [
      'Vous avez un PDF qui revient sur plusieurs dossiers du même service (ex. IMM 5669 pour les RP).',
      'Vous voulez que ce PDF soit auto-attaché aux futurs dossiers du service correspondant.',
      'Vous voulez restreindre un document aux seuls clients au Canada ou hors Canada.',
    ],
    steps: [
      {
        title: 'Ajouter un modèle',
        body: 'Cliquez sur « + Nouveau modèle ». Téléversez le PDF (max 20 Mo). Donnez un nom (ex. « IMM 5257 - Demande de permis de travail ») et une description courte. Choisissez le service d\'immigration auquel il appartient (ou laissez « Aucun » pour un modèle général transverse).',
      },
      {
        title: 'Définir la localisation cible',
        body: 'Indiquez si le document est destiné : aux clients au Canada uniquement, aux clients hors Canada uniquement, ou aux deux. Cette information est utilisée pour filtrer les modèles auto-attachés selon le statut « in_canada » du client.',
      },
      {
        title: 'Filtrer et rechercher',
        body: 'Sur la liste, utilisez la barre de recherche pour trouver un modèle par nom ou description. Le dropdown « Filtrer » vous permet de n\'afficher que les modèles d\'un service précis ou d\'un type général (Cabinet, IRCC, etc.).',
      },
      {
        title: 'Modifier un modèle',
        body: 'Cliquez sur « Modifier » pour ajuster le nom, la description, le service ou la localisation cible. Attention : modifier un modèle ne change pas les PDF déjà attachés à des dossiers (ce sont des copies).',
      },
    ],
    tips: [
      'Un modèle « inactif » n\'apparaît plus dans la bibliothèque ni dans les listes d\'envoi, mais reste lié aux dossiers déjà créés.',
      'Pour un document jetable à n\'envoyer qu\'à un seul client, préférez le téléversement libre depuis la page d\'envoi.',
    ],
  },
  {
    id: 'envois',
    icon: <PiPaperPlaneTiltDuotone className="h-6 w-6" />,
    title: 'Envoi d\'invitations',
    summary: 'Demandez au client de remplir des éléments à distance.',
    link: '/envois',
    whatItDoes:
      'Une invitation est un email envoyé au client (ou à un membre de sa famille) qui lui demande de remplir un ou plusieurs éléments en ligne : formulaires (questionnaires web), documents PDF à remplir, ou téléversement libre de fichiers. Le client reçoit un lien sécurisé qui le mène à un espace personnel où il peut compléter sa tâche à son rythme, sauvegarder, puis soumettre. Vous voyez son avancement en temps réel.',
    whenToUse: [
      'Vous avez besoin que le client remplisse un IMM ou un autre formulaire à partir de chez lui.',
      'Vous voulez collecter des pièces justificatives (passeport, factures, photos, etc.).',
      'Vous voulez qu\'il signe ou valide un document précis.',
    ],
    steps: [
      {
        title: 'Choisir le destinataire',
        body: 'Sélectionnez un client existant (le formulaire pré-remplit son courriel) ou « destinataire personnalisé » pour une invitation ponctuelle sans créer de fiche client. Si le client est de type famille, vous pouvez envoyer l\'invitation au principal ou à un membre précis.',
      },
      {
        title: 'Lier au dossier (optionnel)',
        body: 'Si l\'invitation concerne un dossier précis, sélectionnez-le. Les éléments remplis seront alors automatiquement rattachés au dossier (utile pour le suivi et l\'historique).',
      },
      {
        title: 'Choisir les formulaires et documents',
        body: 'Cochez les formulaires (questionnaires web) et les documents PDF à inclure. Si le dossier a l\'option « Envoyer les documents d\'immigration IRCC au client » activée, ces documents sont pré-cochés automatiquement. Vous pouvez filtrer par service d\'immigration ou par type général. Vous pouvez aussi téléverser un PDF spécifique à cette invitation uniquement (il ne sera pas ajouté à la bibliothèque).',
      },
      {
        title: 'Personnaliser et envoyer',
        body: 'Ajoutez un message personnalisé (optionnel), fixez la durée de validité (par défaut 14 jours), cochez « Autoriser le client à téléverser des fichiers complémentaires » s\'il pourra ajouter ses propres pièces. Cliquez sur « Envoyer ».',
      },
      {
        title: 'Suivre l\'avancement',
        body: 'Depuis « Mes envois », cliquez sur une invitation pour voir l\'état de chaque élément (à faire, en cours, complété), prévisualiser les réponses ou télécharger les fichiers reçus. Vous pouvez aussi renvoyer le courriel si le client ne l\'a pas reçu.',
      },
    ],
    tips: [
      'Si le client ne peut pas remplir un PDF en ligne, il peut téléverser le PDF rempli en pièce jointe (option « fichiers complémentaires »).',
      'Les invitations expirées ne sont plus accessibles par le client mais restent visibles côté admin.',
    ],
  },
  {
    id: 'services-immigration',
    icon: <PiBriefcaseDuotone className="h-6 w-6" />,
    title: 'Services d\'immigration',
    summary: 'Catalogue des prestations du cabinet.',
    link: '/services-immigration',
    whatItDoes:
      'Les services d\'immigration sont les types de prestations que votre cabinet propose : « Résidence Permanente », « Visa de Visiteur », « Parrainage Familial », etc. Ils servent à classifier les dossiers et les modèles de documents. Quand un dossier est créé pour un service donné, les modèles rattachés à ce service sont automatiquement copiés comme documents IRCC du dossier — gain de temps énorme.',
    whenToUse: [
      'Le cabinet propose un nouveau type de prestation — créez un service.',
      'Vous voulez ranger vos modèles de documents par type de prestation.',
      'Vous voulez analyser le volume d\'activité par service.',
    ],
    steps: [
      {
        title: 'Ajouter un service',
        body: 'Cliquez sur « + Ajouter un service ». Renseignez nom, catégorie générale (Visa, Travail, Immigration, etc.), durée estimée et statut. Vous pouvez aussi associer une couleur pour l\'identifier visuellement dans les listes.',
      },
      {
        title: 'Lier des modèles de documents',
        body: 'Lors de la création d\'un modèle (section Modèles documents), choisissez le service auquel il appartient. À partir de là, chaque dossier créé pour ce service hérite automatiquement de ce modèle.',
      },
      {
        title: 'Désactiver un service',
        body: 'Plutôt que de supprimer un service obsolète, basculez son statut sur « inactif ». Il n\'apparaîtra plus dans les listes de création mais les dossiers existants restent intacts.',
      },
    ],
    tips: [
      'Un service inactif ne propose plus ses modèles auto-attachés sur les nouveaux dossiers.',
      'Pour les documents transverses (non liés à un service), utilisez le type général « Cabinet » ou « Autre ».',
    ],
  },
  {
    id: 'file-manager',
    icon: <PiFileDuotone className="h-6 w-6" />,
    title: 'Explorateur de fichiers',
    summary: 'Drive interne du cabinet, en accès rapide.',
    link: '/file-manager',
    whatItDoes:
      'L\'explorateur de fichiers est un espace de stockage organisé en dossiers et sous-dossiers, comme un Google Drive ou un Dropbox interne. C\'est utile pour stocker des fichiers de référence (modèles administratifs, documentation IRCC, notes internes, archives) qui ne sont pas liés à un client précis. Les dossiers sensibles peuvent être verrouillés par un code PIN partagé entre les utilisateurs autorisés.',
    whenToUse: [
      'Vous voulez archiver des dossiers terminés ou des documents de référence.',
      'Vous voulez centraliser des templates administratifs accessibles à tous les utilisateurs.',
      'Vous voulez sécuriser un dossier sensible avec un PIN.',
    ],
    steps: [
      {
        title: 'Naviguer',
        body: 'Cliquez sur les dossiers pour les ouvrir. La barre de navigation en haut montre le chemin courant et permet de revenir en arrière.',
      },
      {
        title: 'Téléversement',
        body: 'Glissez-déposez des fichiers depuis votre ordinateur sur la zone centrale, ou cliquez sur « + Téléverser ». Plusieurs fichiers à la fois sont acceptés.',
      },
      {
        title: 'Verrouillage d\'un dossier',
        body: 'Faites un clic droit sur un dossier → « Verrouiller » → définissez un code PIN. Les utilisateurs devront le saisir pour entrer dans le dossier. Le code est mémorisé en session — pas besoin de le re-saisir à chaque navigation.',
      },
    ],
    tips: [
      'Les fichiers liés aux dossiers et invitations ne s\'y trouvent pas — ils ont leur propre stockage géré automatiquement.',
      'Le verrouillage par PIN est une protection légère contre la vue accidentelle, pas un chiffrement fort.',
    ],
  },
  {
    id: 'analytics',
    icon: <PiChartBarDuotone className="h-6 w-6" />,
    title: 'Statistiques',
    summary: 'Tableau de bord de l\'activité du cabinet.',
    link: '/analytics',
    whatItDoes:
      'Vue d\'ensemble du fonctionnement du cabinet : nombre de clients actifs, dossiers en cours par statut, invitations envoyées récemment, taux de complétion par client. Permet de répondre rapidement à des questions du genre « combien de dossiers attendent une réponse IRCC ? » ou « quels clients n\'ont pas répondu à leur invitation ? ».',
    whenToUse: [
      'Au début de votre semaine de travail, pour avoir une vue globale.',
      'Pour identifier les dossiers en attente d\'une action de votre part.',
      'Pour des rapports périodiques au cabinet.',
    ],
    steps: [
      {
        title: 'Consulter le tableau de bord',
        body: 'Les indicateurs principaux sont affichés en haut. Survolez chaque carte pour voir les tendances sur les dernières semaines. Cliquez sur un chiffre pour accéder à la liste filtrée correspondante.',
      },
    ],
  },
];

export default function TutorielsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-6 2xl:p-10">
      {/* Header */}
      <div className="mb-8 flex items-start gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
          <PiBookOpenDuotone className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Centre de tutoriels</h1>
          <p className="mt-1 max-w-3xl text-sm text-gray-500">
            Comprenez en profondeur le rôle de chaque fonctionnalité de la plateforme.
            Chaque guide explique <strong>ce que fait la section</strong>, <strong>quand l&apos;utiliser</strong>,
            <strong> les étapes pas à pas</strong> et les <strong>bonnes pratiques</strong>.
          </p>
        </div>
      </div>

      {/* Sommaire */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">Sommaire</h2>
        <ul className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
          {GUIDES.map((g) => (
            <li key={g.id}>
              <a
                href={`#${g.id}`}
                className="flex items-center gap-2 rounded-lg p-2 text-sm text-gray-700 transition hover:bg-blue-50 hover:text-blue-700"
              >
                <span className="text-blue-600">{g.icon}</span>
                <span className="truncate">{g.title}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Guides détaillés */}
      <div className="space-y-6">
        {GUIDES.map((g) => (
          <article
            key={g.id}
            id={g.id}
            className="scroll-mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8"
          >
            {/* En-tête du guide */}
            <div className="mb-5 flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700">
                {g.icon}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">{g.title}</h2>
                <p className="mt-1 text-sm text-gray-500">{g.summary}</p>
              </div>
              {g.link && (
                <Link
                  href={g.link}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                >
                  Accéder à la page →
                </Link>
              )}
            </div>

            {/* « À quoi ça sert » */}
            <div className="mb-5 rounded-xl border-l-4 border-blue-500 bg-blue-50/50 p-4">
              <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-800">
                <PiLightbulbDuotone className="h-4 w-4" />
                À quoi sert cette fonctionnalité
              </div>
              <p className="text-sm leading-relaxed text-gray-700">{g.whatItDoes}</p>
            </div>

            {/* Quand l'utiliser */}
            <div className="mb-5">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Quand l&apos;utiliser ?</h3>
              <ul className="space-y-1.5">
                {g.whenToUse.map((u, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                    {u}
                  </li>
                ))}
              </ul>
            </div>

            {/* Étapes */}
            <div className="mb-5">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">Mode d&apos;emploi pas à pas</h3>
              <ol className="space-y-3.5">
                {g.steps.map((s, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                      {i + 1}
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{s.title}</div>
                      <p className="mt-1 text-sm leading-relaxed text-gray-600">{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Conseils */}
            {g.tips && g.tips.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800">
                  💡 Conseils & pièges fréquents
                </div>
                <ul className="space-y-1.5">
                  {g.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-amber-900">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        ))}
      </div>

      {/* Aide supplémentaire */}
      <div className="mt-10 rounded-2xl border border-dashed border-blue-300 bg-blue-50/40 p-6 text-center">
        <h3 className="text-lg font-semibold text-blue-800">Besoin d&apos;aide supplémentaire ?</h3>
        <p className="mx-auto mt-1 max-w-xl text-sm text-blue-700/80">
          Vous ne trouvez pas la réponse à votre question ? Contactez votre administrateur ou un super-utilisateur pour obtenir de l&apos;aide personnalisée.
        </p>
      </div>
    </div>
  );
}
