/* ============================================================
   COSMOS — LA PAGE « LE MUR DES REPÈRES » (/budget/mur/)

   Ce que fait cette page : elle MONTRE les 22 repères, une tuile
   chacun, et propose pour chacun un défi de cinq minutes.

   Ce qu'elle N'ÉCRIT PAS : la liste des repères retenus (repSel).
   Elle l'affiche en lecture seule (le signet vert), rien de plus.
   Le choix se fait dans Point de départ ③. Elle n'écrit qu'une
   seule chose : les défis relevés (clé 'defis').

   Contenu : commun/js/reperes-contenu.js
   Mémoire : commun/js/point-depart-etat.js
   ============================================================ */

(function () {
  if (typeof PD_REPERES === 'undefined' || typeof PDEtat === 'undefined') return;

  /* Racine du site, déduite de l'adresse de ce script : la page peut
     donc être déplacée sans retoucher un seul lien. */
  const BASE = document.currentScript.src.replace(/commun\/js\/mur\.js.*$/, '');

  const $ = (id) => document.getElementById(id);
  const grille = $('murGrille');
  const barre  = $('murFiltres');
  const modale = $('murModale');
  if (!grille || !barre || !modale) return;

  const R = PD_REPERES;
  const famille = (k) => PD_FAMILLES.filter(f => f.k === k)[0] || PD_FAMILLES[0];
  const parId   = (id) => R.filter(c => c.id === id)[0];

  /* ── L'état partagé avec Point de départ ─────────────────── */
  let retenus = [];
  let defis   = [];
  const relire = () => {
    const o = PDEtat.lire();
    retenus = Array.isArray(o.repSel) ? o.repSel : [];
    defis   = Array.isArray(o.defis)  ? o.defis  : [];
  };
  relire();

  const aDefi    = (id) => defis.some(d => d.id === id && !d.arch);
  const defiFait = (id) => defis.some(d => d.id === id && !d.arch && d.fait);

  /* Relever un défi = ajouter une ligne. Le retirer n'est possible QUE
     tant qu'il n'est pas fait : une fois coché, il s'archive depuis
     Mes défis, il ne s'efface pas. */
  const basculerDefi = (c) => {
    if (defiFait(c.id)) return;
    if (aDefi(c.id)) {
      defis = defis.filter(d => !(d.id === c.id && !d.arch));
    } else {
      defis = defis.concat([{
        id: c.id,
        t: c.defi,          /* le texte est COPIÉ : il doit survivre à une réécriture */
        src: c.n,
        o: c.outil || '',
        pris: PDEtat.aujourdhui(),
        fait: false, faitLe: null, note: '', arch: false
      }]);
    }
    PDEtat.ecrire({ defis: defis }, 'le-mur');
  };

  let filtre = 'tous';
  let ouvert = null;
  let declencheur = null;   /* la tuile qui a ouvert la modale : on lui rend le focus */

  /* ── Les pastilles de filtre ─────────────────────────────── */
  const renderFiltres = () => {
    const chip = (k, lab, ic, n, g) =>
      '<button class="seg" data-f="' + k + '" aria-pressed="' + (filtre === k) + '" ' +
        'style="min-height:44px;display:inline-flex;align-items:center;gap:7px;padding:10px 15px;border-radius:999px;font-size:13.5px;font-weight:600;' +
        (filtre === k ? 'background:' + g + ';color:#fff;box-shadow:0 12px 24px -16px rgba(90,60,120,.8);' : 'background:var(--soft);color:var(--ink2);') + '">' +
        (ic ? '<span class="ic" style="font-size:18px;">' + ic + '</span>' : '') + lab +
        '<span class="mono" style="font-size:11.5px;opacity:.85;">' + n + '</span></button>';

    barre.innerHTML =
      '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
        chip('tous', 'Tout le mur', 'grid_view', R.length, 'linear-gradient(135deg,#A78BE8,#8CC7F0)') +
        PD_FAMILLES.map(f => chip(f.k, f.n, f.ic, R.filter(c => c.fam === f.k).length, f.g)).join('') +
      '</div>' +
      '<span style="font-size:13px;color:var(--ink2);">Clique une carte pour l\'ouvrir</span>';

    barre.querySelectorAll('[data-f]').forEach(b => b.addEventListener('click', () => {
      filtre = b.getAttribute('data-f'); renderFiltres(); renderGrille();
    }));
  };

  /* ── La grille de tuiles ─────────────────────────────────── */
  const renderGrille = () => {
    const liste = R.filter(c => filtre === 'tous' || c.fam === filtre);
    grille.innerHTML = liste.map(c => {
      const f = famille(c.fam);
      const pris = retenus.indexOf(c.id) > -1;
      return '<button class="tuile seg" data-open="' + c.id + '" ' +
        'style="text-align:left;display:flex;flex-direction:column;gap:10px;padding:17px 18px;border-radius:20px;background:var(--surface);border:1.5px solid ' +
        (pris ? 'rgba(52,211,153,.55)' : 'var(--line)') + ';box-shadow:0 16px 32px -28px rgba(90,60,120,.6);min-height:158px;color:var(--ink);">' +
          '<span style="display:flex;align-items:center;gap:8px;">' +
            '<span style="width:26px;height:26px;flex:none;border-radius:9px;background:' + f.g + ';display:flex;align-items:center;justify-content:center;color:#fff;"><span class="ic" style="font-size:15px;">' + f.ic + '</span></span>' +
            '<span class="mono" style="font-size:9.5px;font-weight:700;letter-spacing:.7px;color:var(--ink2);">' + (c.col === 'cmd' ? 'COMMANDEMENT' : 'PRINCIPE') + '</span>' +
            '<span style="margin-left:auto;display:inline-flex;align-items:center;gap:5px;">' +
              (aDefi(c.id) ? '<span class="ic" title="Défi en cours" aria-label="Défi en cours" style="font-size:17px;color:var(--acc-amber);">task_alt</span>' : '') +
              (pris ? '<span class="ic" title="Retenu dans ton Point de départ" aria-label="Retenu dans ton Point de départ" style="font-size:17px;color:var(--acc-green);">bookmark</span>' : '') +
            '</span>' +
          '</span>' +
          '<b style="font-size:14.5px;line-height:1.34;font-weight:600;">' + c.n + '</b>' +
          '<span style="font-size:11.5px;color:var(--ink2);line-height:1.45;">' + c.s + '</span>' +
          '<span style="margin-top:auto;display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:600;color:var(--acc-violet);"><span class="ic" style="font-size:15px;">bolt</span>Un exemple, un défi</span>' +
        '</button>';
    }).join('');
    grille.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => {
      declencheur = b; ouvrir(b.getAttribute('data-open'));
    }));
  };

  /* ── La modale ───────────────────────────────────────────── */
  const bloc = (ic, coul, titre, corps) =>
    '<div style="display:flex;gap:12px;align-items:flex-start;">' +
      '<span class="ic" style="font-size:20px;color:' + coul + ';flex:none;margin-top:1px;">' + ic + '</span>' +
      '<span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;">' +
        '<span class="mono" style="font-size:10px;font-weight:700;letter-spacing:1px;color:var(--ink2);">' + titre + '</span>' +
        '<span style="font-size:14.5px;line-height:1.6;">' + corps + '</span>' +
      '</span></div>';

  const fermer = () => {
    ouvert = null;
    modale.innerHTML = '';
    document.body.style.overflow = '';
    if (declencheur && document.contains(declencheur)) declencheur.focus();
    declencheur = null;
  };

  const ouvrir = (id) => {
    const c = parId(id); if (!c) return;
    ouvert = id;
    const f = famille(c.fam);
    const pris = retenus.indexOf(c.id) > -1;
    const o = PD_OUTILS[c.outil];
    const petitEcran = window.matchMedia('(max-width: 640px)').matches;
    document.body.style.overflow = 'hidden';

    modale.innerHTML =
      '<div id="murBack" style="position:fixed;inset:0;z-index:60;background:rgba(40,26,64,.44);backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;padding:' + (petitEcran ? '12px' : '28px') + ';">' +
        '<div role="dialog" aria-modal="true" aria-label="' + c.n.replace(/"/g, '&quot;') + '" ' +
          'style="width:min(620px,100%);max-height:' + (petitEcran ? '96vh' : '88vh') + ';overflow:auto;background:var(--surface);border-radius:' + (petitEcran ? '20px' : '28px') + ';padding:' + (petitEcran ? '20px 18px' : '28px 30px') + ';box-shadow:0 40px 80px -30px rgba(40,20,70,.6);display:flex;flex-direction:column;gap:18px;">' +

          '<div style="display:flex;align-items:flex-start;gap:13px;">' +
            '<span style="width:40px;height:40px;flex:none;border-radius:14px;background:' + f.g + ';display:flex;align-items:center;justify-content:center;color:#fff;"><span class="ic" style="font-size:22px;">' + f.ic + '</span></span>' +
            '<span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:5px;">' +
              '<span class="mono" style="font-size:10px;font-weight:700;letter-spacing:1px;color:var(--ink2);">' + (c.col === 'cmd' ? 'COMMANDEMENT' : 'PRINCIPE') + ' · ' + f.n.toUpperCase() + '</span>' +
              '<b style="font-size:23px;font-weight:600;line-height:1.25;letter-spacing:-.4px;">' + c.n + '</b>' +
              '<span style="font-size:13.5px;color:var(--ink2);">' + c.s + '</span>' +
            '</span>' +
            '<button class="seg" data-close="1" aria-label="Fermer" style="width:44px;height:44px;flex:none;border-radius:12px;background:var(--soft);color:var(--ink2);display:flex;align-items:center;justify-content:center;"><span class="ic" style="font-size:20px;">close</span></button>' +
          '</div>' +

          (pris ? '<span style="display:inline-flex;align-self:flex-start;align-items:center;gap:7px;padding:6px 12px;border-radius:999px;background:rgba(52,211,153,.16);color:var(--acc-green);font-size:12.5px;font-weight:600;"><span class="ic" style="font-size:16px;">bookmark</span>Dans ta liste du Point de départ</span>' : '') +
          '<div style="height:1px;background:var(--line);"></div>' +

          '<div style="display:flex;flex-direction:column;gap:17px;">' +
            bloc('calculate', 'var(--acc-violet)', 'CE QUE ÇA DONNE EN CHIFFRES', c.ex) +
            bloc('help', 'var(--acc-teal)', 'LA QUESTION À TE POSER', '<i>' + c.q + '</i>') +
          '</div>' +

          '<div style="padding:18px 20px;border-radius:20px;background:var(--soft);display:flex;flex-direction:column;gap:11px;">' +
            '<span style="display:inline-flex;align-items:center;gap:9px;"><span class="ic" style="font-size:20px;color:var(--acc-amber);">bolt</span><span class="mono" style="font-size:10px;font-weight:700;letter-spacing:1px;color:var(--acc-amber);">LE DÉFI — CINQ MINUTES</span></span>' +
            '<span style="font-size:15px;line-height:1.55;font-weight:500;">' + c.defi + '</span>' +
            '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:2px;">' +
              (defiFait(c.id)
                ? '<span style="min-height:44px;display:inline-flex;align-items:center;gap:8px;padding:12px 17px;border-radius:14px;font-size:14px;font-weight:600;background:rgba(52,211,153,.16);color:var(--acc-green);"><span class="ic" style="font-size:19px;">check_circle</span>Fait — c\'est dans tes défis</span>'
                : '<button class="seg" data-defi="' + c.id + '" style="min-height:44px;display:inline-flex;align-items:center;gap:8px;padding:12px 17px;border-radius:14px;font-size:14px;font-weight:600;' +
                  (aDefi(c.id) ? 'background:rgba(52,211,153,.16);color:var(--acc-green);' : 'background:linear-gradient(135deg,#FBBF24,#FF7A45);color:#fff;') + '">' +
                  '<span class="ic" style="font-size:19px;">' + (aDefi(c.id) ? 'task_alt' : 'add_task') + '</span>' +
                  (aDefi(c.id) ? 'Dans mes défis — retirer' : 'Je relève ce défi') + '</button>') +
              (o ? '<a class="bande-lien" href="' + BASE + o.href + '" style="display:inline-flex;align-items:center;gap:7px;font-size:13.5px;font-weight:600;text-decoration:none;"><span class="ic" style="font-size:17px;">' + o.ic + '</span>Le faire dans ' + c.outil + '<span class="ic" style="font-size:16px;">arrow_forward</span></a>' : '') +
            '</div>' +
            (aDefi(c.id) ? '<span style="font-size:12.5px;color:var(--ink2);">Tu le retrouveras dans <a href="' + BASE + 'budget/index.html#sec-defis">Point de départ</a>, avec une case à cocher et un mot à écrire une fois fait.</span>' : '') +
          '</div>' +

          '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">' +
            '<button class="seg" data-pas="-1" style="min-height:44px;display:inline-flex;align-items:center;gap:7px;padding:11px 15px;border-radius:13px;background:var(--soft);color:var(--ink2);font-size:13.5px;font-weight:600;"><span class="ic" style="font-size:18px;">arrow_back</span>Précédent</button>' +
            '<span class="mono" style="font-size:11.5px;color:var(--ink2);">' + (R.indexOf(c) + 1) + ' / ' + R.length + '</span>' +
            '<button class="seg" data-pas="1" style="min-height:44px;display:inline-flex;align-items:center;gap:7px;padding:11px 15px;border-radius:13px;background:var(--soft);color:var(--ink2);font-size:13.5px;font-weight:600;">Suivant<span class="ic" style="font-size:18px;">arrow_forward</span></button>' +
          '</div>' +
        '</div>' +
      '</div>';

    const back = $('murBack');
    back.addEventListener('click', (e) => { if (e.target === back) fermer(); });
    modale.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', fermer));
    modale.querySelectorAll('[data-defi]').forEach(b => b.addEventListener('click', () => {
      basculerDefi(parId(b.getAttribute('data-defi')));
      ouvrir(ouvert); renderGrille();
    }));
    /* ←/→ et les deux boutons suivent l'ordre du tableau COMPLET,
       pas celui du filtre courant : on parcourt les 22, toujours. */
    modale.querySelectorAll('[data-pas]').forEach(b => b.addEventListener('click', () => {
      saut(+b.getAttribute('data-pas'));
    }));
    const dlg = modale.querySelector('[role="dialog"]');
    if (dlg) { dlg.setAttribute('tabindex', '-1'); dlg.focus(); }
  };

  const saut = (pas) => {
    const i = R.indexOf(parId(ouvert));
    ouvrir(R[(i + pas + R.length) % R.length].id);
  };

  document.addEventListener('keydown', (e) => {
    if (!ouvert) return;
    if (e.key === 'Escape')     { e.preventDefault(); fermer(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); saut(1); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); saut(-1); }
  });

  /* Un autre onglet a changé la sélection ou les défis : on se met à jour. */
  PDEtat.surChangement((cles, source) => {
    if (source === 'le-mur') return;   /* c'est nous : déjà à l'écran */
    relire();
    renderGrille();
    if (ouvert) ouvrir(ouvert);
  });

  renderFiltres();
  renderGrille();
})();
