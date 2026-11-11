/* ============================================================
   COSMOS — MES RACCOURCIS (accueil)
   Affichage des bulles + modale « Personnaliser ».

   Données : CATALOGUE_RACCOURCIS et RACCOURCIS_DEFAUT (projects.js).
   Mémoire : localStorage['cosmos-raccourcis'] — un tableau d'ids,
             ex. ["budget","donnees"] — donc inclus dans « Mes données ».

   ┌─────────────────────────────────────────────────────────┐
   │  EXERCICE : les deux fonctions de la ZONE 1             │
   │  sont des brouillons à compléter.                       │
   │  → suivre docs/exercice-raccourcis.md                   │
   │  Tant qu'elles ne sont pas finies, tout fonctionne      │
   │  mais la page OUBLIE tes choix au rechargement.         │
   └─────────────────────────────────────────────────────────┘
   ============================================================ */

/* ============================================================
   ZONE 1 — LA MÉMOIRE (à toi de jouer ✏️)
   ============================================================ */

const CLE_RACCOURCIS = 'cosmos-raccourcis';

/* Lit le choix sauvegardé et le renvoie sous forme de tableau d'ids.
   Doit renvoyer une COPIE de RACCOURCIS_DEFAUT si :
   - rien n'a encore été sauvegardé,
   - ou si ce qui est stocké est illisible / n'est pas un tableau.
   Bonus : ignorer les ids qui n'existent plus dans le catalogue. */
function chargerRaccourcis() {
  // TODO exercice — étapes suggérées dans docs/exercice-raccourcis.md
  // 1. localStorage.getItem(CLE_RACCOURCIS)  → texte ou null
  // 2. si null → renvoyer [...RACCOURCIS_DEFAUT]   (pourquoi la copie [...] ?
  //    voir la fiche : sinon on modifierait la liste par défaut elle-même !)
  // 3. JSON.parse(texte) dans un try/catch  → si ça casse, renvoyer le défaut
  // 4. vérifier Array.isArray(...) ; sinon renvoyer le défaut
  // 5. bonus : liste.filter(id => CATALOGUE_RACCOURCIS.some(r => r.id === id))
  return [...RACCOURCIS_DEFAUT]; // ← brouillon : remplace-moi !
}

/* Sauvegarde le tableau d'ids reçu (ex. ["budget","donnees"]). */
function sauverRaccourcis(ids) {
  // TODO exercice — une seule vraie ligne :
  // localStorage.setItem(CLE_RACCOURCIS, JSON.stringify(ids))
}

/* ============================================================
   ZONE 2 — AFFICHAGE ET MODALE (fait par Claude, lis-moi 🙂)
   ============================================================ */

(function () {
  /* La liste de travail : les ids actuellement affichés, dans l'ordre.
     Chaque action de la modale modifie `actifs`, sauvegarde, ré-affiche. */
  let actifs = chargerRaccourcis();

  const zone = document.getElementById('raccourcis');
  const parId = id => CATALOGUE_RACCOURCIS.find(r => r.id === id);

  /* ---- Les bulles de l'accueil ---- */
  function afficherBulles() {
    zone.innerHTML = '';
    actifs.map(parId).filter(Boolean).forEach(r => {
      const a = document.createElement('a');
      a.className = 'bul';
      a.href = r.lien;
      a.innerHTML = `
        <span class="rond" style="background:${r.grad}; box-shadow:0 20px 36px -18px ${r.ombre};">
          <span class="material-symbols-rounded" aria-hidden="true">${r.icon}</span>
        </span>
        <span style="text-align:center;">
          ${r.parent ? `<span class="chemin">${r.parent} /</span>` : ''}<b>${r.label}</b><span class="etat">${r.etat}</span>
        </span>`;
      zone.appendChild(a);
    });

    /* La bulle « Ajouter » en pointillés ouvre la modale */
    const ajout = document.createElement('button');
    ajout.className = 'bul ajouter';
    ajout.type = 'button';
    ajout.innerHTML = `
      <span class="rond"><span class="material-symbols-rounded" aria-hidden="true">add</span></span>
      <span class="bul-ajouter-lbl">Ajouter</span>`;
    ajout.addEventListener('click', ouvrirModale);
    zone.appendChild(ajout);
  }

  /* ---- Une action = modifier, sauvegarder, ré-afficher ---- */
  function appliquer() {
    sauverRaccourcis(actifs);
    afficherBulles();
    remplirModale();
  }
  function retirer(id)  { actifs = actifs.filter(x => x !== id); appliquer(); }
  function ajouter(id)  { actifs.push(id); appliquer(); }
  function deplacer(id, sens) {           /* sens : -1 = monter, +1 = descendre */
    const i = actifs.indexOf(id);
    const j = i + sens;
    if (i < 0 || j < 0 || j >= actifs.length) return;
    [actifs[i], actifs[j]] = [actifs[j], actifs[i]];
    appliquer();
  }
  function reinitialiser() { actifs = [...RACCOURCIS_DEFAUT]; appliquer(); }

  /* ---- La modale ---- */
  const voile = document.createElement('div');
  voile.className = 'voile-racc';
  voile.innerHTML = `
    <div class="modale-racc" role="dialog" aria-modal="true" aria-labelledby="raccTitre">
      <div class="modale-racc-tete">
        <span class="lbl" id="raccTitre">PERSONNALISER MES RACCOURCIS</span>
        <button class="modale-racc-fermer" type="button" aria-label="Fermer">
          <span class="material-symbols-rounded" aria-hidden="true">close</span>
        </button>
      </div>
      <p class="modale-racc-aide">Tes bulles, dans ton ordre. Tout se change ici, tout s'enregistre tout seul.</p>
      <div class="modale-racc-bloc">
        <span class="modale-racc-slbl">SUR MON ACCUEIL</span>
        <div id="raccActifs"></div>
      </div>
      <div class="modale-racc-bloc">
        <span class="modale-racc-slbl">À AJOUTER</span>
        <div id="raccDispo"></div>
      </div>
      <div class="modale-racc-pied">
        <button class="modale-racc-reset" type="button">
          <span class="material-symbols-rounded" aria-hidden="true">restart_alt</span>Revenir aux bulles d'origine
        </button>
      </div>
    </div>`;
  document.body.appendChild(voile);

  const listeActifs = voile.querySelector('#raccActifs');
  const listeDispo  = voile.querySelector('#raccDispo');

  function ligne(r) {
    const div = document.createElement('div');
    div.className = 'modale-racc-ligne';
    div.innerHTML = `
      <span class="mini-rond" style="background:${r.grad};">
        <span class="material-symbols-rounded" aria-hidden="true">${r.icon}</span>
      </span>
      <span class="modale-racc-nom"><b>${r.parent ? r.parent + ' / ' : ''}${r.label}</b><span>${r.etat}</span></span>
      <span class="modale-racc-actions"></span>`;
    return div;
  }
  function boutonIcone(icone, titre, action) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'modale-racc-btn';
    b.title = titre;
    b.setAttribute('aria-label', titre);
    b.innerHTML = `<span class="material-symbols-rounded" aria-hidden="true">${icone}</span>`;
    b.addEventListener('click', action);
    return b;
  }

  function remplirModale() {
    /* Bulles présentes : monter / descendre / retirer */
    listeActifs.innerHTML = '';
    if (!actifs.length) {
      listeActifs.innerHTML = '<p class="modale-racc-vide">Plus aucune bulle — ajoute-en depuis la liste ci-dessous 🌱</p>';
    }
    actifs.map(parId).filter(Boolean).forEach((r, i) => {
      const div = ligne(r);
      const actions = div.querySelector('.modale-racc-actions');
      const monter = boutonIcone('arrow_upward', 'Monter', () => deplacer(r.id, -1));
      const descendre = boutonIcone('arrow_downward', 'Descendre', () => deplacer(r.id, +1));
      if (i === 0) monter.disabled = true;
      if (i === actifs.length - 1) descendre.disabled = true;
      actions.append(monter, descendre, boutonIcone('close', 'Retirer', () => retirer(r.id)));
      listeActifs.appendChild(div);
    });

    /* Reste du catalogue : ajouter */
    listeDispo.innerHTML = '';
    const restants = CATALOGUE_RACCOURCIS.filter(r => !actifs.includes(r.id));
    if (!restants.length) {
      listeDispo.innerHTML = '<p class="modale-racc-vide">Tout le catalogue est déjà sur ton accueil ✦</p>';
    }
    restants.forEach(r => {
      const div = ligne(r);
      div.querySelector('.modale-racc-actions')
         .appendChild(boutonIcone('add', 'Ajouter', () => ajouter(r.id)));
      listeDispo.appendChild(div);
    });
  }

  function ouvrirModale() {
    remplirModale();
    voile.classList.add('visible');
    voile.querySelector('.modale-racc-fermer').focus();
  }
  function fermerModale() { voile.classList.remove('visible'); }

  voile.addEventListener('click', e => { if (e.target === voile) fermerModale(); });
  voile.querySelector('.modale-racc-fermer').addEventListener('click', fermerModale);
  voile.querySelector('.modale-racc-reset').addEventListener('click', reinitialiser);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && voile.classList.contains('visible')) fermerModale();
  });

  /* ---- Démarrage ---- */
  afficherBulles();
  const persoBtn = document.getElementById('persoBtn');
  if (persoBtn) persoBtn.addEventListener('click', ouvrirModale);
})();
