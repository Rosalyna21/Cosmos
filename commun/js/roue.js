/* ============================================================
   COSMOS — LA ROUE DES 17 CAPACITÉS  (budget/roue/)

   Deux notes de 0 à 10 par capacité :
     s  où j'en suis aujourd'hui   → la surface pleine du secteur
     i  ce que ça compte pour moi  → le trait posé sur le secteur
     nc ça ne me concerne pas      → secteur hachuré, aucune note

   Ce qui se lit, c'est L'ÉCART entre les deux. Aucun total n'est
   calculé, aucune moyenne, aucune couleur de jugement : c'est la
   posture de l'écran de confrontation, et elle n'est pas négociable.

   Persistance : on passe par PDEtat (clé 'cosmos-point-depart',
   sous-clé 'roue'). JAMAIS de localStorage.setItem ici — c'est ce
   qui permettra de brancher un jour une version compte sans
   réécrire l'écran, et c'est ce qui fait que « Mes données »
   exporte la roue comme le reste.
   ============================================================ */

(function () {
  const svg = document.getElementById('roueSvg');
  if (!svg) return;
  if (typeof ROUE_CAPACITES === 'undefined' || typeof PDEtat === 'undefined') return;

  const CAPS = ROUE_CAPACITES;
  const N    = CAPS.length;

  /* ---------- géométrie de la roue ---------- */
  const CX = 220, CY = 220, R_MIN = 32, R_MAX = 150, R_NUM = 176;
  const PAS = 360 / N, JEU = 1.1;
  const SVGNS = 'http://www.w3.org/2000/svg';

  const pt = (ang, r) => {
    const a = (ang - 90) * Math.PI / 180;
    return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
  };
  const rayon = (v) => R_MIN + (Math.max(0, Math.min(10, v)) / 10) * (R_MAX - R_MIN);

  const part = (k, r) => {                      // le secteur plein, du centre au rayon r
    const [x0, y0] = pt(k * PAS + JEU, r);
    const [x1, y1] = pt((k + 1) * PAS - JEU, r);
    return `M ${CX} ${CY} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
  };
  const trait = (k, r) => {                     // le petit arc posé au rayon r
    const [x0, y0] = pt(k * PAS + JEU + 1.4, r);
    const [x1, y1] = pt((k + 1) * PAS - JEU - 1.4, r);
    return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  };
  const noeud = (nom, attrs) => {
    const e = document.createElementNS(SVGNS, nom);
    Object.keys(attrs || {}).forEach(k => e.setAttribute(k, attrs[k]));
    return e;
  };

  /* ---------- l'état ---------- */
  const vide  = () => CAPS.map(c => ({ id: c.id, s: null, i: null, nc: false }));
  let etat    = vide();
  let exemple = false;                          // on affiche le jeu de démonstration ?

  const rempli = () => etat.some(e => e.s !== null || e.i !== null || e.nc);

  const lireEtat = () => {
    const o = (PDEtat.lire().roue || {}).notes || {};
    etat = CAPS.map(c => {
      const v = o[c.id] || {};
      return {
        id: c.id,
        s:  typeof v.s === 'number' ? v.s : null,
        i:  typeof v.i === 'number' ? v.i : null,
        nc: v.nc === true
      };
    });
  };

  const ecrireEtat = () => {
    if (exemple) return;                        // la démonstration ne s'enregistre pas
    const notes = {};
    etat.forEach(e => { notes[e.id] = { s: e.s, i: e.i, nc: e.nc }; });
    PDEtat.ecrire({ roue: { notes, maj: PDEtat.aujourdhui() } }, 'roue');
  };

  const poserExemple = () => {
    if (typeof ROUE_EXEMPLE === 'undefined') return;
    etat = CAPS.map(c => {
      const v = ROUE_EXEMPLE[c.id] || [null, null, false];
      return { id: c.id, s: v[2] ? null : v[0], i: v[2] ? null : v[1], nc: v[2] };
    });
  };

  /* ---------- la roue ---------- */
  const gGrille = document.getElementById('roueGrille');
  const gPart   = document.getElementById('rouePart');
  const gTrait  = document.getElementById('roueTrait');
  const gNum    = document.getElementById('roueNum');
  const gClic   = document.getElementById('roueClic');
  const parts = [], traits = [], halos = [], nums = [];

  [2, 4, 6, 8, 10].forEach(v => gGrille.appendChild(noeud('circle', { cx: CX, cy: CY, r: rayon(v), class: 'rw-anneau' })));
  for (let k = 0; k < N; k++) {
    const [x, y] = pt(k * PAS, R_MAX);
    gGrille.appendChild(noeud('line', { x1: CX, y1: CY, x2: x.toFixed(2), y2: y.toFixed(2), class: 'rw-rayon' }));
  }

  CAPS.forEach((c, k) => {
    gPart.appendChild(noeud('path', { d: part(k, R_MAX), class: 'rw-fond' }));
    const halo = noeud('path', { d: part(k, R_MAX), class: 'rw-halo' });
    gPart.appendChild(halo); halos.push(halo);
    const p = noeud('path', { d: '', class: 'rw-plein' });
    gPart.appendChild(p); parts.push(p);
    const t = noeud('path', { d: '', class: 'rw-trait' });
    gTrait.appendChild(t); traits.push(t);

    const [x, y] = pt(k * PAS + PAS / 2, R_NUM);
    const txt = noeud('text', { x: x.toFixed(1), y: y.toFixed(1), class: 'rw-num' });
    txt.textContent = String(c.id);
    gNum.appendChild(txt); nums.push(txt);

    const clic = noeud('path', { d: part(k, R_MAX + 22), class: 'rw-clic' });
    clic.dataset.k = k;
    gClic.appendChild(clic);
  });

  const dessiner = (k) => {
    const e = etat[k];
    if (e.nc) {
      parts[k].setAttribute('class', 'rw-nc');
      parts[k].setAttribute('d', part(k, R_MAX));
      traits[k].setAttribute('d', '');
      return;
    }
    parts[k].setAttribute('class', 'rw-plein');
    parts[k].setAttribute('d', e.s === null ? '' : part(k, rayon(e.s)));
    traits[k].setAttribute('d', e.i === null ? '' : trait(k, rayon(e.i)));
  };

  /* ---------- la liste ---------- */
  const corps  = document.getElementById('roueCorps');
  const lignes = [];

  const eclairer = (k, on) => {
    lignes[k].classList.toggle('survol', on);
    halos[k].classList.toggle('on', on);
    nums[k].classList.toggle('actif', on);
  };

  CAPS.forEach((c, k) => {
    const tr = document.createElement('tr');
    tr.className = 'rw-ligne';
    const lib = c.n.replace(/"/g, '&quot;');
    tr.innerHTML =
      '<td class="rw-n">' + c.id + '</td>' +
      '<td class="rw-lib">' + c.n + '</td>' +
      '<td class="rw-ch"><input class="rw-note rw-sit" id="rwSit' + c.id + '" type="number" min="0" max="10" step="1" inputmode="numeric" aria-label="Où j\'en suis — ' + lib + '"></td>' +
      '<td class="rw-ch"><input class="rw-note rw-imp" id="rwImp' + c.id + '" type="number" min="0" max="10" step="1" inputmode="numeric" aria-label="Ce que ça compte — ' + lib + '"></td>' +
      '<td class="rw-nc"><input class="rw-cb" id="rwNc' + c.id + '" type="checkbox" aria-label="Ne me concerne pas — ' + lib + '"></td>';
    corps.appendChild(tr);
    lignes.push(tr);

    const sit = tr.querySelector('.rw-sit');
    const imp = tr.querySelector('.rw-imp');
    const ncb = tr.querySelector('.rw-cb');

    const borne = (champ) => {
      if (champ.value === '') return null;
      const v = parseInt(champ.value, 10);
      if (isNaN(v)) return null;
      return Math.max(0, Math.min(10, v));
    };

    const saisie = () => {
      exemple = false;
      etat[k].nc = ncb.checked;
      etat[k].s  = ncb.checked ? null : borne(sit);
      etat[k].i  = ncb.checked ? null : borne(imp);
      if (ncb.checked) { sit.value = ''; imp.value = ''; }
      sit.disabled = imp.disabled = ncb.checked;
      tr.classList.toggle('inactive', ncb.checked);
      dessiner(k);
      ecrireEtat();
      majOutils();
    };

    sit.addEventListener('input', saisie);
    imp.addEventListener('input', saisie);
    ncb.addEventListener('change', saisie);

    tr.addEventListener('mouseenter', () => eclairer(k, true));
    tr.addEventListener('mouseleave', () => eclairer(k, false));
    [sit, imp].forEach(ch => {
      ch.addEventListener('focus', () => eclairer(k, true));
      ch.addEventListener('blur',  () => eclairer(k, false));
    });

    tr._champs = { sit, imp, ncb };
  });

  Array.prototype.forEach.call(gClic.children, (clic) => {
    const k = parseInt(clic.dataset.k, 10);
    clic.addEventListener('mouseenter', () => eclairer(k, true));
    clic.addEventListener('mouseleave', () => eclairer(k, false));
    clic.addEventListener('click', () => {
      const ch = lignes[k]._champs.sit;
      if (ch.disabled) return;
      ch.focus(); ch.select();
    });
  });

  /* ---------- peindre l'écran à partir de l'état ---------- */
  const peindre = () => {
    etat.forEach((e, k) => {
      const c = lignes[k]._champs;
      c.ncb.checked  = e.nc;
      c.sit.value    = e.s === null ? '' : e.s;
      c.imp.value    = e.i === null ? '' : e.i;
      c.sit.disabled = c.imp.disabled = e.nc;
      lignes[k].classList.toggle('inactive', e.nc);
      dessiner(k);
    });
    majOutils();
  };

  /* ---------- les deux boutons ---------- */
  const btnEx    = document.getElementById('roueExemple');
  const btnVider = document.getElementById('roueVider');
  const note     = document.getElementById('roueNote');

  function majOutils() {
    const aDesNotes = rempli();
    if (btnEx)    btnEx.hidden    = aDesNotes && !exemple;
    if (btnVider) btnVider.hidden = !aDesNotes;
    if (note)     note.hidden     = !exemple;
  }

  if (btnEx) btnEx.addEventListener('click', () => {
    exemple = true;
    poserExemple();
    peindre();
  });

  if (btnVider) btnVider.addEventListener('click', () => {
    exemple = false;
    etat = vide();
    peindre();
    ecrireEtat();
  });

  /* ---------- démarrage, et écoute des autres écrans ---------- */
  lireEtat();
  peindre();

  PDEtat.surChangement((cles, source) => {
    if (source === 'roue') return;                              // c'est nous qui venons d'écrire
    if (cles && cles.indexOf('roue') === -1) return;             // ça ne nous concerne pas
    exemple = false;
    lireEtat();
    peindre();
  });
})();
