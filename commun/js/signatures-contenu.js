/* ============================================================
   COSMOS — CE QUE CHAQUE PLACEMENT SERT ET COÛTE (bloc ⑤)

   Du texte, pas du code : relis-le et modifie-le librement.
   C'est ce fichier qui rend l'écran ⑤ possible — sans lui, la
   ligne « ce que mon argent fait » n'a rien à dire.

   Une entrée par placement :
     k / n / s / ic   clé, nom, sous-titre, icône
     sert : []        les valeurs de ② que ce placement sert
     coute: []        celles qu'il coûte
       v    la clé de la valeur (voir PD_VALEURS)
       w    la pondération (par défaut 1 pour « sert », 0,5 pour « coûte »)
       why  LA JUSTIFICATION — obligatoire, affichée au clic sur la ligne

   ⚠ Un même placement peut SERVIR et COÛTER la même valeur : l'immobilier
   locatif libère par le loyer et attache par l'illiquidité, la SCPI aussi.
   Ne pas simplifier : c'est justement ce qui se voit nulle part ailleurs.

   PD_HYP : les hypothèses de conversion. Chaque chiffre affiché à
   l'écran montre celle qui l'a produit — pas de chiffre orphelin.
   ============================================================ */

/* Les trois familles de destinations. Toutes ne sont pas des placements,
   et c'est voulu : dépenser et ne rien faire SONT des destinations. Sans
   elles, ⑤ ne pourrait rien dire d'Expériences ni de Confort, et « laisser
   dormir sur le compte courant » — la destination la plus fréquente —
   serait invisible alors qu'elle a un coût bien réel. */
const PD_GROUPES_ALLOC = [
  { k:'placer', n:'Ce que tu places',                   s:'supports d\'épargne et d\'investissement' },
  { k:'vivre',  n:'Ce que tu vis, ou investis sur toi', s:'ni placé, ni perdu' },
  { k:'dort',   n:'Ce qui attend',                     s:'ni placé, ni dépensé' }
];

const PD_SIGNATURES = [
  { k:'precaution', grp:'placer', n:'Épargne de précaution', s:'livrets', ic:'savings',
    sert:[ { v:'securite', why:'Trois à six mois de dépenses disponibles : c\'est ce qui absorbe un coup dur sans crédit.' },
           { v:'temps', w:.6, why:'Zéro gestion — l\'argent dort et tu n\'y penses plus.' } ],
    coute:[ { v:'confort', why:'Ce capital ne finance rien de ton quotidien : il attend.' } ] },
  { k:'per', grp:'placer', n:'PER', s:'plan d\'épargne retraite', ic:'lock_clock',
    sert:[ { v:'securite', why:'Un revenu garanti pour la période où tu ne travailleras plus.' },
           { v:'confort', w:.6, why:'Du confort, mais daté : celui de ta retraite, pas celui de cette année.' } ],
    coute:[ { v:'liberte', w:1, why:'Le PER coûte de la liberté parce qu\'il ne produit aucun revenu avant la retraite.' },
            { v:'exper', why:'L\'argent bloqué ne paie aucun voyage d\'ici là — et certaines expériences ont une date de péremption.' },
            { v:'temps', w:.5, why:'Les heures rachetées sont renvoyées à après le déblocage.' } ] },
  { k:'av', grp:'placer', n:'Assurance-vie', s:'fonds euros + unités de compte', ic:'shield_moon',
    sert:[ { v:'securite', why:'Une poche disponible à tout moment, fiscalement douce après huit ans.' },
           { v:'transm', why:'La clause bénéficiaire transmet hors succession — c\'est sa vraie spécialité.' } ],
    coute:[] },
  { k:'pea', grp:'placer', n:'PEA / ETF capitalisants', s:'actions, capitalisation', ic:'trending_up',
    sert:[ { v:'securite', w:.8, why:'Sur quinze ans et plus, un indice large a jusqu\'ici battu l\'inflation.' },
           { v:'transm', w:.7, why:'Le capital grossit sans être entamé : c\'est ce qui reste après.' } ],
    coute:[ { v:'liberte', why:'Capitalisant veut dire aucun revenu versé : tu ne peux pas en vivre sans vendre.' },
            { v:'exper', w:.5, why:'Chaque versement est une expérience repoussée à plus tard.' } ] },
  { k:'dist', grp:'placer', n:'ETF distribuants, dividendes', s:'revenus versés', ic:'payments',
    sert:[ { v:'liberte', why:'Un revenu tombe sans que tu vendes quoi que ce soit — la définition même d\'une deuxième source.' },
           { v:'confort', w:.6, why:'Ce revenu améliore ton quotidien maintenant, pas dans trente ans.' } ],
    coute:[ { v:'securite', why:'Le dividende peut être coupé et le cours baisse : ce n\'est pas un livret.' } ] },
  { k:'scpi', grp:'placer', n:'SCPI', s:'immobilier papier', ic:'apartment',
    sert:[ { v:'liberte', why:'Un loyer mensuel sans locataire à gérer.' },
           { v:'temps', why:'La gestion est déléguée : tu n\'y passes aucune heure.' } ],
    coute:[ { v:'liberte', w:.7, why:'Revendre prend des mois : la même ligne te donne du revenu et te retire ta sortie.' },
            { v:'securite', w:.6, why:'Le prix de la part peut être révisé à la baisse, et les frais d\'entrée sont élevés.' } ] },
  { k:'loc', grp:'placer', n:'Immobilier locatif', s:'en direct', ic:'holiday_village',
    sert:[ { v:'liberte', why:'Le loyer est un revenu qui ne dépend pas de ton employeur.' },
           { v:'transm', why:'Un bien se transmet, et le crédit se rembourse en partie avec les loyers.' } ],
    coute:[ { v:'temps', why:'Recherche, travaux, impayés, comptabilité : des heures, chaque année.' },
            { v:'liberte', w:.8, why:'La dette et l\'illiquidité te lient : la même ligne libère et attache.' } ] },
  { k:'form', grp:'vivre', n:'Se former, créer une activité', s:'investir sur soi', ic:'school',
    sert:[ { v:'liberte', why:'Une compétence ou une activité crée un revenu qui t\'appartient.' },
           { v:'recon', why:'C\'est le seul placement dont le résultat porte ton nom.' },
           { v:'exper', w:.6, why:'Apprendre est aussi une expérience, pas seulement un investissement.' } ],
    coute:[ { v:'securite', why:'Aucun rendement garanti : ça peut ne rien donner.' },
            { v:'temps', why:'Des soirées et des week-ends, avant tout retour.' } ] },
  { k:'voy', grp:'vivre', n:'Voyages, sorties', s:'dépenses choisies', ic:'flight_takeoff',
    sert:[ { v:'exper', why:'Le seul poste qui achète des souvenirs — et le seul qui a une date de péremption.' } ],
    coute:[ { v:'securite', why:'Cet argent est sorti : il ne sera pas là au prochain coup dur.' },
            { v:'transm', w:.5, why:'Ce qui est vécu n\'est pas laissé.' } ] },
  { k:'rien', grp:'dort', n:'Rien — compte courant', s:'l\'argent qui reste là', ic:'account_balance_wallet',
    sert:[ { v:'liberte', w:.4, why:'Disponible à tout moment : une liberté apparente, qui ne produit aucun revenu.' } ],
    coute:[ { v:'securite', why:'L\'inflation prélève sans prévenir : à 2 %/an, 10 000 € valent environ 8 200 € dans dix ans.' },
            { v:'transm', w:.5, why:'Ce qui ne grossit pas ne se transmet qu\'à l\'identique.' },
            { v:'exper', w:.4, why:'Un argent qui attend sans projet ne finance rien de choisi.' } ] }
];
// hypothèses de conversion — affichées en clair sous chaque chiffre
const PD_HYP = { rdt:.04, voyage:2500, heure:25, retrait:.04 };
