// Répartition — pyramides éditables (€ ↔ %) + détail de « Ma situation » :
// projets nommés (qui alimentent la poche « Projets ») et répartition par
// type de risque. Tout est mémorisé dans le navigateur.
(function () {
  const NIVEAUX = [
    { nom: 'Sécurité',   c1: '#34D399', c2: '#22B4C4' },
    { nom: 'Projets',    c1: '#FBBF24', c2: '#FF7A45' },
    { nom: 'Long terme', c1: '#A78BE8', c2: '#8CC7F0' },
    { nom: 'Pari',       c1: '#F472B6', c2: '#A855F7' },
  ];
  const ORDRE = ['Pari', 'Long terme', 'Projets', 'Sécurité'];

  const eur = n => Math.round(n).toLocaleString('fr-FR') + ' €';
  const couleur = nom => {
    const n = NIVEAUX.find(x => x.nom === nom);
    return 'linear-gradient(135deg,' + n.c1 + ',' + n.c2 + ')';
  };

  const carteSituation = document.querySelector('.pyra-card[data-edit="situation"]');

  function etat(carte) {
    const mode = carte.dataset.mode || 'eur';
    const champs = {};
    carte.querySelectorAll('input[data-niv]').forEach(i => {
      champs[i.dataset.niv] = Math.max(0, Number(i.value) || 0);
    });
    const montants = {}, pourc = {};
    let capital;
    if (mode === 'eur') {
      NIVEAUX.forEach(n => { montants[n.nom] = champs[n.nom] || 0; });
      capital = NIVEAUX.reduce((s, n) => s + montants[n.nom], 0);
      NIVEAUX.forEach(n => { pourc[n.nom] = capital > 0 ? montants[n.nom] / capital * 100 : 0; });
    } else {
      NIVEAUX.forEach(n => { pourc[n.nom] = champs[n.nom] || 0; });
      const cap = carte.querySelector('input[data-cap]');
      capital = Math.max(0, Number(cap && cap.value) || 0);
      NIVEAUX.forEach(n => { montants[n.nom] = capital * pourc[n.nom] / 100; });
    }
    return { mode, capital, montants, pourc };
  }

  function dessiner(carte) {
    const { mode, capital, montants, pourc } = etat(carte);
    const maxp = Math.max(1, ...NIVEAUX.map(n => pourc[n.nom] || 0));
    const mini = carte.querySelector('.pyra-mini');
    mini.innerHTML = '';
    ORDRE.forEach(nom => {
      const p = pourc[nom] || 0;
      if (p <= 0) return;
      const b = document.createElement('div');
      b.className = 'et';
      b.style.background = couleur(nom);
      b.style.width = Math.max(30, Math.round(p / maxp * 100)) + '%';
      b.innerHTML = nom + ' <small>' + Math.round(p) + ' %</small>';
      mini.appendChild(b);
    });
    carte.querySelectorAll('.reg[data-niv-row]').forEach(row => {
      const nom = row.dataset.nivRow;
      const em = row.querySelector('.derive');
      if (em) em.textContent = mode === 'eur' ? Math.round(pourc[nom] || 0) + ' %' : eur(montants[nom] || 0);
    });
    const totalPct = NIVEAUX.reduce((s, n) => s + (pourc[n.nom] || 0), 0);
    const t = carte.querySelector('.total');
    if (t) {
      t.querySelector('.tv').textContent = mode === 'eur'
        ? eur(capital) + ' · 100 %'
        : Math.round(totalPct) + ' % · ' + eur(capital);
      t.classList.toggle('ok', mode === 'eur' ? capital > 0 : Math.round(totalPct) === 100);
    }
    try {
      localStorage.setItem('cosmos-repartition-' + carte.dataset.edit, JSON.stringify({ mode, capital, montants }));
    } catch (e) {}
    if (carte === carteSituation) majRisque(pourc);
  }

  function basculer(carte, nouveau) {
    const st = etat(carte);
    carte.dataset.mode = nouveau;
    const capRow = carte.querySelector('.reg.capital');
    if (capRow) capRow.hidden = (nouveau !== 'pct');
    carte.querySelectorAll('.mode-tog .mode').forEach(b => b.classList.toggle('on', b.dataset.mode === nouveau));
    carte.querySelectorAll('input[data-niv]').forEach(i => {
      const nom = i.dataset.niv;
      i.value = nouveau === 'eur' ? Math.round(st.montants[nom] || 0) : Math.round(st.pourc[nom] || 0);
    });
    const cap = carte.querySelector('input[data-cap]');
    if (cap) cap.value = Math.round(st.capital || 0);
    if (carte === carteSituation) syncProjets();
    dessiner(carte);
  }

  // ---------- Projets nommés (carte « Ma situation ») ----------
  const CLE_PROJ = 'cosmos-projets-situation';
  let projets = [];
  try { const p = JSON.parse(localStorage.getItem(CLE_PROJ) || 'null'); if (Array.isArray(p)) projets = p; } catch (e) {}

  const listeEl = document.querySelector('.projets-liste');
  const totalEl = document.querySelector('.projets-total');
  const btnAjout = document.querySelector('.ajout-projet');

  const sommeProjets = () => projets.reduce((s, p) => s + (Number(p.montant) || 0), 0);
  const sauverProjets = () => { try { localStorage.setItem(CLE_PROJ, JSON.stringify(projets)); } catch (e) {} };

  function majTotalProjets() {
    if (!totalEl) return;
    totalEl.textContent = projets.length
      ? 'Total projets : ' + eur(sommeProjets()) + ' → alimente la poche « Projets »'
      : 'Aucun projet — ajoute-en un pour détailler ta poche « Projets ».';
  }

  function renderProjets() {
    if (!listeEl) return;
    listeEl.innerHTML = '';
    projets.forEach((p, idx) => {
      const row = document.createElement('div');
      row.className = 'projet';
      row.innerHTML = '<input class="pj-nom" type="text" placeholder="Nom du projet">'
        + '<span class="pj-inp"><input class="pj-montant" type="number" min="0" step="50"> €</span>'
        + '<button class="pj-suppr" type="button" aria-label="Supprimer le projet">&times;</button>';
      const nom = row.querySelector('.pj-nom');
      const mnt = row.querySelector('.pj-montant');
      nom.value = p.nom || '';
      mnt.value = (p.montant != null && p.montant !== 0) ? p.montant : (p.montant === 0 ? 0 : '');
      nom.addEventListener('input', e => { projets[idx].nom = e.target.value; sauverProjets(); });
      mnt.addEventListener('input', e => { projets[idx].montant = Math.max(0, Number(e.target.value) || 0); sauverProjets(); majTotalProjets(); majSituation(); });
      row.querySelector('.pj-suppr').addEventListener('click', () => { projets.splice(idx, 1); sauverProjets(); renderProjets(); majSituation(); });
      listeEl.appendChild(row);
    });
    majTotalProjets();
  }

  if (btnAjout) btnAjout.addEventListener('click', () => { projets.push({ nom: '', montant: 0 }); sauverProjets(); renderProjets(); majSituation(); });

  // Injecte la somme des projets dans le niveau « Projets » de Ma situation.
  function syncProjets() {
    if (!carteSituation) return;
    const inp = carteSituation.querySelector('input[data-niv="Projets"]');
    if (!inp) return;
    if (!projets.length) { inp.readOnly = false; inp.classList.remove('pilote'); return; }
    const mode = carteSituation.dataset.mode || 'eur';
    if (mode === 'eur') {
      inp.value = Math.round(sommeProjets());
    } else {
      const cap = carteSituation.querySelector('input[data-cap]');
      const capital = Math.max(0, Number(cap && cap.value) || 0);
      inp.value = capital > 0 ? Math.round(sommeProjets() / capital * 100) : 0;
    }
    inp.readOnly = true; inp.classList.add('pilote');
  }

  function majSituation() { if (carteSituation) { syncProjets(); dessiner(carteSituation); } }

  // ---------- Répartition par type de risque (Ma situation) ----------
  const RISQUES = [
    { cle: 'Sans risque', niveaux: ['Sécurité'],            c1: '#34D399', c2: '#22B4C4' },
    { cle: 'Peu risqué',  niveaux: ['Projets'],             c1: '#FBBF24', c2: '#FF7A45' },
    { cle: 'Risqué',      niveaux: ['Long terme', 'Pari'],  c1: '#A855F7', c2: '#F472B6' },
  ];
  const barreRisque = document.querySelector('.risque-bar');
  const legRisque = document.querySelector('.risque-legende');
  function majRisque(pourc) {
    if (!barreRisque || !legRisque) return;
    barreRisque.innerHTML = ''; legRisque.innerHTML = '';
    RISQUES.forEach(r => {
      const p = r.niveaux.reduce((s, n) => s + (pourc[n] || 0), 0);
      if (p > 0) {
        const seg = document.createElement('div');
        seg.className = 'seg';
        seg.style.width = p + '%';
        seg.style.background = 'linear-gradient(135deg,' + r.c1 + ',' + r.c2 + ')';
        seg.title = r.cle + ' ' + Math.round(p) + ' %';
        barreRisque.appendChild(seg);
      }
      const li = document.createElement('div');
      li.className = 'li';
      li.innerHTML = '<span class="pt" style="background:linear-gradient(135deg,' + r.c1 + ',' + r.c2 + ')"></span>' + r.cle + ' <b>' + Math.round(p) + ' %</b>';
      legRisque.appendChild(li);
    });
  }

  // ---------- Init ----------
  document.querySelectorAll('.pyra-card[data-edit]').forEach(carte => {
    try {
      const s = JSON.parse(localStorage.getItem('cosmos-repartition-' + carte.dataset.edit) || 'null');
      if (s && s.montants) {
        carte.dataset.mode = 'eur';
        const capRow = carte.querySelector('.reg.capital'); if (capRow) capRow.hidden = true;
        carte.querySelectorAll('.mode-tog .mode').forEach(b => b.classList.toggle('on', b.dataset.mode === 'eur'));
        carte.querySelectorAll('input[data-niv]').forEach(i => { if (s.montants[i.dataset.niv] != null) i.value = Math.round(s.montants[i.dataset.niv]); });
        const cap = carte.querySelector('input[data-cap]'); if (cap && s.capital) cap.value = Math.round(s.capital);
      }
    } catch (e) {}
    carte.querySelectorAll('.mode-tog .mode').forEach(b => b.addEventListener('click', () => basculer(carte, b.dataset.mode)));
    if (carte === carteSituation) carte.addEventListener('input', majSituation);
    else carte.addEventListener('input', () => dessiner(carte));
  });

  renderProjets();
  if (carteSituation) majSituation();
  document.querySelectorAll('.pyra-card[data-edit]').forEach(c => { if (c !== carteSituation) dessiner(c); });
})();
