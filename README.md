# Cosmos 🌸✨

Ma plateforme personnelle : jeux, atelier créatif, finances apaisées, outils data & IA locaux, dashboard et labo ML. Chaque projet est une étoile, l'ensemble forme un tout.

## Trois zones : en ligne, brouillons, perso

Un seul dossier (`site/`), un seul design system, trois niveaux de visibilité.
Schéma complet : `../docs/architecture-publication.svg`.

| | Où | Publié ? | À quoi ça sert |
|---|---|---|---|
| **En ligne** | tout le reste | oui, sur GitHub Pages | ce que le monde voit |
| **Brouillons** | `brouillons/` | non — dans `.gitignore` | ce que je construis avant de le montrer |
| **Perso** | `prive/` | non — dans `.gitignore` | mon espace à moi, pas destiné à sortir |

Quatre règles à ne jamais enfreindre :

1. **Chemins relatifs uniquement** (`../commun/css/style.css`), jamais de `C:\Users\...`.
2. **Sens unique des liens** : une page de `prive/` ou de `brouillons/` peut pointer vers le public ; l'inverse ferait un lien mort en ligne.
3. **Ne jamais ajouter une page de `prive/` ou de `brouillons/` dans `CHEMIN`** (`commun/js/projects.js`) : la barre de navigation publique afficherait un lien mort.
4. **Une page devient visible en déménageant**, pas en modifiant `CHEMIN` toute seule — l'ordre est : déplacer le fichier, puis ouvrir le chemin.

« Privé » veut dire personnel, pas secret : aucun mot de passe ni donnée professionnelle dans `prive/`.
Et une fois en ligne, **une page est lisible par qui connaît son adresse** — GitHub Pages n'a pas de mot de passe. Ne pas publier reste le seul vrai secret.

### Les trois verrous de la visibilité

Une page n'est réellement visible que si les trois sont ouverts :

1. **Le fichier est parti** — hors `.gitignore`, donc ni dans `brouillons/` ni dans `prive/`.
2. **Un chemin y mène** — sa gare est en `etat: 'fait'` avec un `lien:` dans `CHEMIN`. Sinon la page est en ligne, mais aucun menu n'y conduit.
3. **Google peut l'indexer** — pas de `<meta name="robots" content="noindex, nofollow">` dans son `<head>`.

## Voir le site

Ouvrir `index.html` dans un navigateur. Pour l'outil de transcription, préférer un petit serveur local :
`python -m http.server` dans ce dossier, puis http://localhost:8000

## Structure

```
site/                   → LE SITE : ce dossier EST ce qu'on publie (Git s'initialise ici)
├── .gitignore          → ce qui ne part jamais en ligne
├── README.md           → ce fichier
├── index.html          → accueil (cartes générées depuis commun/js/projects.js)
├── commun/             → LE design system, partagé par le public ET le privé
│   ├── css/style.css   → thème clair printanier / nuit étoilée
│   ├── js/             → theme.js (bascule), nav.js (barre partagée), projects.js (LE CHEMIN)…
│   ├── fonts/          → polices auto-hébergées (aucun appel à Google)
│   └── img/            → logos jour/nuit, favicon, logo-day.ico (icône du raccourci bureau)
│
├── detente/            → hub Arcade + Atelier
├── budget/             → Finances : principes, flux, épargne, où placer
├── charges-fixes/      → liste des charges fixes
├── dashboard/          → dashboards + créateur
├── donnees/            → sauvegarde / export / import des données locales
├── a-propos/           → « Ce que ce site ne fait pas » : les limites assumées
├── ia/                 → boîte à outils data & IA locale
│   ├── transcription/  → speech-to-text Whisper
│   └── drawdb/         → présentation DrawDB
├── labo-ml/            → démos de modèles ML
│
├── brouillons/         → MON ATELIER — jamais publié (voir .gitignore)
│   ├── LISEZ-MOI.md    → comment travailler ici et comment publier ensuite
│   └── _gabarit.html   → page vierge à copier (design system + nav + noindex)
│
└── prive/              → MON ESPACE — jamais publié (voir .gitignore)
    ├── index.html      → accueil perso
    ├── tableau-de-bord.html
    ├── constellation.html
    └── outils.html     → bouton vers AnythingLLM (http://localhost:3001)

Un cran AU-DESSUS de site/, sur le PC mais HORS du site (jamais publiés) :
../docs/     → plan d'action, briefs, architecture, handoff design + outils/ (régénération des polices)
../archive/  → anciennes versions
../Cosmos/   → ancien handoff design
+ les dossiers de notes et transcriptions de travail
```

## Ajouter un contenu

- Une carte sur l'accueil : ajouter une entrée dans `commun/js/projects.js`
- Un jeu : créer `detente/jeux/<nom>/index.html` + sa carte dans `detente/index.html`
- Un outil : créer `ia/<nom>/index.html` + sa carte dans `ia/index.html`
- Une page perso : créer `prive/<nom>.html` + sa carte dans `prive/index.html` — **et rien dans `projects.js`**
- Badges : `online` (En ligne) / `construction` (En construction) / aucun = disponible

## Commencer une page (et la publier plus tard)

1. Copier `brouillons/_gabarit.html`, le renommer, écrire la page. Elle s'ouvre par un
   double-clic : le design system et la barre de navigation marchent déjà.
2. Tant qu'elle est là, on peut la nommer dans `CHEMIN` avec `etat: 'encours'` ou
   `'avenir'` — **sans `lien:`**. Elle apparaît dans « En chantier », sans être cliquable.
3. Quand elle est prête : déplacer le fichier à sa place définitive, supprimer la ligne
   `noindex` de son `<head>`, puis passer sa gare en `etat: 'fait'` avec son `lien:`.

Détail complet dans `brouillons/LISEZ-MOI.md`.

## Changer un texte sans toucher au code

Presque tout ce qui se lit dans **Finances** est rangé dans des fichiers de contenu.
Ce sont des listes de phrases : on les relit et on les réécrit sans rien casser.

| Fichier | Ce qu'il contient |
|---|---|
| `commun/js/point-depart-contenu.js` | ① les 8 phrases et les 4 rapports à l'argent · ② les 8 valeurs · ④ les 3 profils et les 4 questions |
| `commun/js/reperes-contenu.js` | les **22 repères** (③ *et* Le mur) : intitulé, sous-titre, apport, coût, exemple chiffré, question, défi · les 5 familles · le plafond de 7 |
| `commun/js/signatures-contenu.js` | ⑤ ce que chaque destination **sert** et **coûte**, avec ses poids et ses justifications · les hypothèses de conversion · les 3 familles de destinations |
| `commun/js/projects.js` | LE CHEMIN (barre de navigation, cartes de l'accueil) et les raccourcis de l'accueil |

Les textes d'ambiance — chapeaux de blocs, page d'accueil, `a-propos/`, `donnees/` — sont
écrits directement dans le HTML de leur page.

La **mécanique** vit ailleurs et n'a pas besoin d'être ouverte pour changer un mot :
`commun/js/point-depart.js` (tout l'onglet Point de départ), `commun/js/mur.js` (la page
Le mur), `commun/js/finances.js` (flux, épargne, où placer, pratique).

Quatre précautions :

1. **Un texte n'existe qu'à un seul endroit.** Les 22 repères servent à la fois au bloc ③
   et à la page Le mur — on les corrige une fois, les deux écrans suivent. Ne jamais recopier.
2. **Garder la ponctuation du fichier** : les guillemets qui encadrent chaque phrase et les
   virgules entre les lignes. Une apostrophe à l'intérieur d'un texte encadré par `'`
   s'écrit `\'` — c'est la seule bizarrerie à retenir.
3. **Ne jamais renommer un identifiant** (`id:`, `k:`). Ils sont enregistrés dans le
   navigateur des visiteurs : les changer efface leurs réponses. Le libellé, lui, se
   réécrit librement.
4. **Recharger avec Ctrl+Shift+R** après modification. Le navigateur garde les anciens
   fichiers en mémoire et affiche l'ancienne version sans prévenir.

## Thème

Bouton « Mode nuit » en bas à droite — persistance dans le navigateur (`cosmos-theme`).
Le design suit `../docs/design/README.md` (+ CHANGELOG).

## Polices

Les polices (texte + icônes) sont **auto-hébergées** dans `commun/fonts/` — plus aucun
appel à Google. Les icônes sont un **sous-ensemble** : si tu ajoutes une icône inédite,
régénère-le, sinon elle s'affiche en toutes lettres. Détail et script :
`../docs/polices-auto-hebergees.md`.

## Documents

`../docs/plan-action.md` (phases), `../docs/brief-design.md` (pages), `../docs/architecture.svg` (cible technique),
`../docs/architecture-publication.svg` (les trois zones de visibilité),
`../docs/architecture-finances.svg` (Finances : ce que chaque écran demande, où c'est rangé,
et ce qui se saisit deux fois).
