/* ============================================================
   COSMOS — Point de départ : LE CONTENU ÉDITORIAL
   Ce fichier est du texte, pas du code : relis-le et modifie-le
   librement sans rien casser (garde juste les guillemets et les virgules).
   La mécanique est dans point-depart.js.
   ============================================================ */

/* ① Les 8 phrases à situer. k = le script auquel la phrase se rattache.
   Deux phrases par script, volontairement mélangées. */
const PD_PHRASES = [
  { k: 'evitement', t: "Je préfère ne pas regarder mes comptes de trop près." },
  { k: 'quete',     t: "Avec plus d'argent, la plupart de mes problèmes s'arrangeraient." },
  { k: 'statut',    t: "Ce que je possède en dit long sur ce que je vaux." },
  { k: 'vigilance', t: "Je me sens coupable quand je dépense pour moi." },
  { k: 'evitement', t: "Parler d'argent me met mal à l'aise." },
  { k: 'quete',     t: "J'ai du mal à me dire que j'en ai assez." },
  { k: 'statut',    t: "J'aime que mes choix montrent que je réussis." },
  { k: 'vigilance', t: "Je préfère garder de côté plutôt que d'en profiter maintenant." },
];

/* Les 4 rapports à l'argent.
   r = ce que c'est · f = la force · a = l'angle mort · q = une question
   ⚠️ Ne jamais afficher l'angle mort sans la force : c'est ce qui garantit
   qu'on éclaire sans faire la leçon. */
const PD_SCRIPTS = {
  evitement: {
    n: 'Évitement', ic: 'visibility_off', g: 'linear-gradient(135deg,#8CC7F0,#4DA8FF)',
    r: "L'argent te met mal à l'aise. Tu préfères ne pas trop regarder, comme si en parler ou compter précisément risquait de gâcher quelque chose.",
    f: "Tu n'es pas guidé par l'appât du gain. Tes décisions ne sont pas dictées par l'argent, ce qui te rend souvent généreux et détaché.",
    a: "Ne pas regarder ne fait pas disparaître. Les mauvaises surprises arrivent plus souvent quand on ne suit rien.",
    q: "Qu'est-ce que je crains de découvrir en ouvrant mes comptes ?",
  },
  quete: {
    n: 'Quête', ic: 'travel_explore', g: 'linear-gradient(135deg,#34D399,#22B4C4)',
    r: "Tu associes l'argent à la solution. Plus il y en a, mieux ça ira — et il n'y en a jamais tout à fait assez.",
    f: "Tu as un moteur puissant. Tu te projettes, tu construis, tu ne te contentes pas de subir ta situation.",
    a: "Le seuil du « assez » recule à mesure qu'on l'atteint. Sans point d'arrivée défini, la course n'a pas de fin.",
    q: "À partir de quel montant précis est-ce que je m'estimerai tranquille ?",
  },
  statut: {
    n: 'Statut', ic: 'workspace_premium', g: 'linear-gradient(135deg,#F472B6,#A855F7)',
    r: "Ce que tu possèdes dit quelque chose de ce que tu vaux. Réussir se montre, au moins un peu.",
    f: "Tu oses viser haut et tu sais te vendre. Cette ambition ouvre des portes que la discrétion referme.",
    a: "Une partie des dépenses part vers le regard des autres plutôt que vers ton propre plaisir.",
    q: "Cet achat, est-ce que je le ferais si personne ne le voyait ?",
  },
  vigilance: {
    n: 'Vigilance', ic: 'shield', g: 'linear-gradient(135deg,#FBBF24,#FF7A45)',
    r: "Mieux vaut prévoir. Tu épargnes, tu anticipes, et dépenser pour toi demande un effort.",
    f: "C'est le rapport à l'argent le plus solide sur la durée. Tu es rarement pris au dépourvu.",
    a: "La prudence peut virer à l'anxiété — et à une vie qu'on repousse indéfiniment « au cas où ».",
    q: "De quoi est-ce que je me prive aujourd'hui pour un risque qui n'arrivera peut-être jamais ?",
  },
};

/* ② Les 8 valeurs. L'ordre de sélection compte (1re = priorité n°1). */
/* ② Les 8 valeurs. L'ORDRE DE SÉLECTION COMPTE : la première est la
   priorité n°1, celle qui départage — et c'est elle qui sert de colonne
   gauche au convertisseur du bloc ⑤.
   d = la définition · q = la question à se poser (lien « Creuser »)

   ⚠ « Liberté » veut dire ne plus dépendre d'une SEULE source de revenus.
   Cette définition-là est calculable (un placement sert la Liberté s'il
   produit un revenu récurrent avant la retraite) et c'est ce qui rend ⑤
   possible : ne pas la reformuler en « pouvoir dire non, partir », qui se
   confondait avec Temps. Même logique pour l'axe maintenant/après :
   Générosité = de mon vivant · Transmission = après moi · Confort = tout de suite. */
const PD_VALEURS = [
  { k: 'securite', n: 'Sécurité',       ic: 'shield',             d: "Ne pas dépendre des aléas",
    q: "Combien de mois peux-tu tenir sans revenu ? Et ça te suffit ?" },
  { k: 'liberte',  n: 'Liberté',        ic: 'key',                d: "Ne plus dépendre d'une seule source de revenus",
    q: "Si ton employeur disparaissait demain, il te resterait quoi comme revenu ?" },
  { k: 'temps',    n: 'Temps',          ic: 'schedule',           d: "Acheter des heures, pas des choses",
    q: "Quand as-tu payé pour la dernière fois afin de ne pas faire quelque chose toi-même ?" },
  { k: 'exper',    n: 'Expériences',    ic: 'explore',            d: "Voyages, découvertes, apprentissages, souvenirs",
    q: "Cite une chose que tu veux faire et qui sera plus dure dans vingt ans." },
  { k: 'generos',  n: 'Générosité',     ic: 'volunteer_activism', d: "Aider les miens, de mon vivant",
    q: "Aider les tiens maintenant, ou leur laisser plus après ? Choisis." },
  { k: 'confort',  n: 'Confort',        ic: 'weekend',            d: "Un quotidien doux, tout de suite",
    q: "Quelle petite dépense quotidienne tu défendrais bec et ongles ?" },
  { k: 'transm',   n: 'Transmission',   ic: 'family_restroom',    d: "Laisser quelque chose après moi",
    q: "Tu veux laisser quoi, exactement — de l'argent, ou autre chose ?" },
  { k: 'recon',    n: 'Reconnaissance', ic: 'star',               d: "Que mon travail soit reconnu",
    q: "Si personne ne savait jamais ce que tu gagnes, tu changerais quoi ?" },
];


/* ③ LES REPÈRES ONT DÉMÉNAGÉ.
   Ils sont passés de 12 à 22 et vivent maintenant dans leur propre
   fichier : commun/js/reperes-contenu.js — parce que la page « Le mur »
   s'en sert aussi, et qu'un même texte ne doit exister qu'à un endroit.
   Les identifiants (c1…c6, p1…p6) n'ont pas bougé : ce qui était déjà
   retenu le reste. */

/* ④ Les 3 profils d'investisseur.
   mix = les cibles par poche de la pyramide — c'est LA sortie de cet onglet,
   consommée par « Mon épargne ». Défaut : équilibré. */
const PD_PROFILS = [
  { k: 'prudent',   n: 'Prudent',   ic: 'shield',      g: 'linear-gradient(135deg,#34D399,#22B4C4)',
    d: "Préserver le capital avant tout. Horizon court ou tolérance faible à la baisse.",
    mix: { securite: 60, projets: 25, longterme: 13, pari: 2 } },
  { k: 'equilibre', n: 'Équilibré', ic: 'balance',     g: 'linear-gradient(135deg,#A78BE8,#8CC7F0)',
    d: "Moitié stabilité, moitié croissance. Le réglage par défaut, qui convient au plus grand nombre.",
    mix: { securite: 45, projets: 25, longterme: 25, pari: 5 } },
  { k: 'dynamique', n: 'Dynamique', ic: 'trending_up', g: 'linear-gradient(135deg,#F472B6,#A855F7)',
    d: "Accepter la volatilité pour viser plus de rendement. Suppose un horizon long et de quoi encaisser une baisse.",
    mix: { securite: 30, projets: 20, longterme: 40, pari: 10 } },
];

/* Le questionnaire qui SUGGÈRE un profil (jamais appliqué automatiquement). */
const PD_QUESTIONS = [
  { q: "Dans combien de temps auras-tu besoin de cet argent ?",
    a: ["Moins de 3 ans", "Entre 3 et 8 ans", "Plus de 8 ans"] },
  { q: "Ton épargne perd 20 % en un mois. Tu…",
    a: ["Vends pour arrêter les pertes", "T'inquiètes, mais tu attends", "En profites pour investir plus"] },
  { q: "Si tu perdais 30 % de cette somme, ton quotidien serait…",
    a: ["Bouleversé", "Gêné quelque temps", "Inchangé"] },
  { q: "Les placements financiers, tu…",
    a: ["N'y connais rien", "Comprends les bases", "Es à l'aise avec"] },
];
