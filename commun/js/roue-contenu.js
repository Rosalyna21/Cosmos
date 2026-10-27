/* ============================================================
   COSMOS — LES 17 CAPACITÉS : LE CONTENU ÉDITORIAL
   Ce fichier est du texte, pas du code : relis-le et modifie-le
   librement sans rien casser (garde juste les guillemets et les virgules).
   La mécanique est dans roue.js.

   C'est la SEULE source de ces textes : ils ne sont recopiés nulle part.

   Champs par capacité :
     id  numéro stable — c'est lui qui s'affiche sur la roue,
         et c'est lui qui sert de clé dans les données enregistrées.
         NE JAMAIS LE RENUMÉROTER : les notes déjà saisies suivraient.
     n   l'intitulé, tel qu'il s'affiche dans la liste

   Source : docs/Principe bonne relation à l'argent.docx
   ============================================================ */

const ROUE_CAPACITES = [
  { id: 1,  n: "Gagner suffisamment sans se tuer au travail" },
  { id: 2,  n: "Savoir se faire plaisir" },
  { id: 3,  n: "Contrôler ses dépenses en fonction de ses recettes" },
  { id: 4,  n: "Épargner et emprunter" },
  { id: 5,  n: "Penser à l'argent dans la durée (patrimoine / matrimoine)" },
  { id: 6,  n: "Donner gratuitement et recevoir" },
  { id: 7,  n: "Recevoir, intégrer et gérer un héritage" },
  { id: 8,  n: "Transmettre à ses propres héritiers" },
  { id: 9,  n: "Avoir une représentation réaliste et positive de l'argent" },
  { id: 10, n: "Place modérée de l'argent dans sa vie psychique" },
  { id: 11, n: "Faire confiance en l'avenir" },
  { id: 12, n: "Faire confiance à un tiers" },
  { id: 13, n: "Respect de la loi et des usages" },
  { id: 14, n: "Faire avec autrui des transactions équitables" },
  { id: 15, n: "Distinguer l'argent flux et l'argent stock" },
  { id: 16, n: "Prendre des risques modérés" },
  { id: 17, n: "Manier une grosse somme d'argent" }
];

/* Un jeu de notes pour montrer à quoi ressemble une roue remplie.
   Il n'apparaît que tant que rien n'a été saisi, et ne s'enregistre pas.
   Format : id → [où j'en suis, ce que ça compte, ne me concerne pas] */
const ROUE_EXEMPLE = {
  1:[6,9,false],  2:[7,8,false],  3:[8,9,false],  4:[6,8,false],  5:[4,7,false],
  6:[7,5,false],  7:[0,0,true],   8:[3,6,false],  9:[5,8,false],  10:[4,9,false],
  11:[5,7,false], 12:[3,6,false], 13:[9,6,false], 14:[8,7,false], 15:[5,8,false],
  16:[4,7,false], 17:[2,4,false]
};
