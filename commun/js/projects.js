/* ============================================================
   COSMOS — LE CHEMIN : la seule liste à éditer pour maintenir le site.
   Les menus déroulants de la navigation, la ligne « En ce moment je
   construis » et les compteurs en sont tous dérivés.

   etat : 'fait'     → livré, apparaît dans le menu déroulant
          'encours'  → en chantier, apparaît dans la ligne de chantier
          'avenir'   → en préparation, compté sans être nommé

   Champs : label (nom court) · quoi (phrase d'explication, pour les 'fait')
            lien (optionnel) · long (nom complet pour la ligne de chantier)
   ============================================================ */

const CHEMIN = [
  {
    nom: 'Détente', icon: 'weekend', color: '#F472B6',
    grad: 'linear-gradient(135deg,#F472B6,#A855F7)',
    lien: 'detente/index.html',
    gares: [
      { label: 'Dessin libre', quoi: 'Un canvas, des couleurs, et c\'est tout.', lien: 'detente/atelier/dessin-libre/index.html', etat: 'fait' },
      { label: 'Arcade', long: 'les jeux de l\'arcade', etat: 'encours' },
      { label: 'Atelier créatif', long: 'l\'atelier créatif', etat: 'encours' },
      { label: 'Atelier Carnet', etat: 'avenir' },
      { label: 'Planches de BD', etat: 'avenir' },
    ],
  },
  {
    nom: 'Finances', icon: 'savings', color: '#34D399',
    grad: 'linear-gradient(135deg,#34D399,#22B4C4)',
    lien: 'budget/index.html#pratique',
    gares: [
      { label: 'Calculatrice financière', quoi: 'Calculs rapides, façon calculatrice.', lien: 'budget/index.html#pratique', etat: 'fait' },
      { label: 'Calculateurs de taux', quoi: 'Intérêts, mensualités, objectifs d\'épargne.', lien: 'budget/index.html#pratique', etat: 'fait' },
      { label: 'Où j\'en suis', long: 'le bilan des capacités', etat: 'avenir' },
      { label: 'Le mur', long: 'le mur des repères', etat: 'avenir' },
      { label: 'Mon budget type', etat: 'avenir' },
      { label: 'Mon épargne', etat: 'avenir' },
      { label: 'Où placer', etat: 'avenir' },
    ],
  },
  /* Dashboard retiré du plancher (section masquée de la navigation) */
  {
    nom: 'Outils IA', icon: 'smart_toy', color: '#FF9E5C',
    grad: 'linear-gradient(135deg,#FFC93C,#FF7A45)',
    lien: 'ia/index.html',
    gares: [
      { label: 'Agrégateur CSV', quoi: 'Empiler plusieurs CSV en un seul, même colonnes en désordre.', lien: 'ia/agregateur-csv/index.html', etat: 'fait' },
      { label: 'Synthèse vocale', quoi: 'Faire lire un texte à voix haute — voix du navigateur ou voix neuronale, en local.', lien: 'ia/synthese-vocale/index.html', etat: 'fait' },
      { label: 'Transcription', long: 'la transcription', etat: 'encours' },
      { label: 'OCR', long: 'l\'OCR', etat: 'encours' },
      { label: 'DrawDB', long: 'DrawDB', etat: 'avenir' },
      { label: 'Détourage', etat: 'avenir' },
      { label: 'Requêteur SQL', etat: 'avenir' },
      { label: 'Lecteur JSON', etat: 'avenir' },
    ],
  },
  /* Labo ML retiré du plancher (section masquée de la navigation) */
];

/* ------------------------------------------------------------
   MES RACCOURCIS — bulles configurables de l'accueil.

   CATALOGUE_RACCOURCIS : tout ce qu'on PEUT mettre en raccourci
   (chaque entrée a un id stable — jamais un index, cf. règle du projet).
   RACCOURCIS_DEFAUT    : les ids affichés tant que rien n'est personnalisé.
   label  : le nom EXACT de la page d'arrivée (celui de son onglet ou de son titre).
   parent : la page qui la contient, quand il y en a une → affiché « Finances / … ».
   Le choix de l'utilisatrice est géré par commun/js/raccourcis.js
   (clé localStorage 'cosmos-raccourcis', donc incluse dans « Mes données »).
   ------------------------------------------------------------ */
const CATALOGUE_RACCOURCIS = [
  { id: 'budget',        parent: 'Finances',  label: 'Calculateurs', etat: 'intérêts & taux',     icon: 'calculate',      grad: 'linear-gradient(135deg,#34D399,#22B4C4)', ombre: 'rgba(34,180,180,.85)',  lien: 'budget/index.html#pratique' },
  { id: 'transcription', parent: 'Outils IA', label: 'Transcription', etat: "prêt à l'emploi",   icon: 'graphic_eq',   grad: 'linear-gradient(135deg,#FFC93C,#FF7A45)', ombre: 'rgba(255,140,60,.85)',  lien: 'ia/transcription/index.html' },
  { id: 'donnees',       label: 'Mes données',   etat: 'exporter',          icon: 'database',     grad: 'linear-gradient(135deg,#F472B6,#A855F7)', ombre: 'rgba(168,85,247,.85)',  lien: 'donnees/index.html' },
  { id: 'detente',       label: 'Détente',       etat: 'faire une pause',   icon: 'weekend',      grad: 'linear-gradient(135deg,#F472B6,#A855F7)', ombre: 'rgba(168,85,247,.85)',  lien: 'detente/index.html' },
  { id: 'ia',            label: 'Outils IA',     etat: 'la boîte à outils', icon: 'smart_toy',    grad: 'linear-gradient(135deg,#FFC93C,#FF7A45)', ombre: 'rgba(255,140,60,.85)',  lien: 'ia/index.html' },
  { id: 'drawdb',        parent: 'Outils IA', label: 'DrawDB',        etat: 'schémas de BDD',    icon: 'account_tree', grad: 'linear-gradient(135deg,#22B4C4,#7C5CFF)', ombre: 'rgba(34,180,196,.85)',  lien: 'ia/drawdb/index.html' },
];
const RACCOURCIS_DEFAUT = ['budget', 'ia', 'detente'];
