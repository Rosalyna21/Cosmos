/* ============================================================
   COSMOS — POINT DE DÉPART (onglet « principes » de Finances)

   Six blocs, aucun obligatoire, aucun score :
     ①  Ce que l'argent déclenche chez moi
     ②  Ce qui compte pour moi
     ③  Des repères, pas des règles   → Ma liste / Le catalogue
     ③bis Mes défis                    → relevés sur la page Le mur
     ④  Quel investisseur je suis      → fixe les cibles de « Mon épargne »
     ⑤  Ce que mon argent fait vraiment

   Contenu éditorial : point-depart-contenu.js  (①②④⑤)
                       reperes-contenu.js       (③ et Le mur)
   Mémoire partagée   : point-depart-etat.js    (clé 'cosmos-point-depart')

   Ce fichier ne calcule qu'une chose qui sort d'ici : le profil
   d'investisseur, lu par « Mon épargne » dans finances.js.
   ============================================================ */

(function () {
  if (typeof PD_PHRASES === 'undefined' || typeof PDEtat === 'undefined') return;

  const $   = (id) => document.getElementById(id);
  const eur = (n) => Math.round(n).toLocaleString('fr-FR') + ' €';
  const nbfr = (n, d) => n.toLocaleString('fr-FR', { minimumFractionDigits:(d||0), maximumFractionDigits:(d||0) });

  /* Re-render en conservant le focus et le caret du champ en cours de frappe */
  const keepFocus = (fn) => {
    const a = document.activeElement;
    const id = a && a.id, pos = (a && a.selectionStart) || null;
    fn();
    if (id) {
      const el = document.getElementById(id);
      if (el && el !== document.activeElement) {
        el.focus();
        try { if (pos !== null) el.setSelectionRange(pos, pos); } catch (e) {}
      }
    }
  };

  /* Prévenir « Mon épargne » que le profil a bougé (la pyramide en dépend) */
  const majFinances = () => {
    if (window.cosmosFinances && window.cosmosFinances.rafraichir) window.cosmosFinances.rafraichir();
  };
  const allerOnglet = (nom) => {
    if (window.cosmosFinances && window.cosmosFinances.onglet) window.cosmosFinances.onglet(nom);
  };
  const ETAPES_ID = ['sec-rapport', 'sec-valeurs', 'sec-reperes', 'sec-profil', 'sec-reel'];
  const allerA = (id) => {
    const filer = () => {
      const el = $(id);
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 20, behavior:'smooth' });
    };
    /* les cinq blocs vivent dans l'accordéon : on ouvre l'étape d'abord */
    if (ETAPES_ID.indexOf(id) > -1) ouvrirEtape(id, filer); else filer();
  };

  /* ── L'état ────────────────────────────────────────────────
     Persisté : ce que l'utilisatrice a saisi.
     Non persisté : les états d'affichage (volet ouvert, recherche…). */
  const st = {
    /* persisté */
    pdMq:[null,null,null,null,null,null,null,null],
    pdValeurs:[], pdRepSel:[], pdRepCustom:[], pdPq:[null,null,null,null],
    profil:'equilibre', age:35,
    defis:[], alloc:{}, allocObj:{}, assume:[], tueuse:{ age:'', txt:'', date:'' }, conv:{ m:null, ans:30 },
    /* affichage seulement */
    pdPqOuvert:false,
    repMode:'liste', repF:'tous', repQ:'', repOpen:null,
    defiOpen:null, defiHist:false,
    reelDetail:null, sortie:null, assumeDraft:{ v:null, txt:'' }, convOpen:false
  };

  const PAIRES = [
    ['pdMq','mq'], ['pdValeurs','valeurs'], ['pdRepSel','repSel'], ['pdRepCustom','repCustom'],
    ['pdPq','pq'], ['profil','profil'], ['age','age'],
    ['defis','defis'], ['alloc','alloc'], ['allocObj','allocObj'], ['assume','assume'], ['tueuse','tueuse'], ['conv','conv']
  ];

  const pdCharger = () => {
    const o = PDEtat.lire();
    PAIRES.forEach(([champ, cle]) => {
      const v = o[cle];
      if (v === undefined || v === null) return;
      if (Array.isArray(st[champ]) && !Array.isArray(v)) return;
      st[champ] = v;
    });
    /* ① est passé de quatre réponses à trois : on convertit une fois ce
       qui a été répondu avant (0-3 → 0-2), sinon les anciennes réponses
       n'auraient plus de bouton correspondant. */
    if (st.pdMq.some(v => v === 3)) {
      st.pdMq = st.pdMq.map(v => (v === null || v === undefined) ? v : (v >= 3 ? 2 : (v >= 2 ? 1 : v)));
      PDEtat.ecrire({ mq: st.pdMq }, 'point-depart');
    }
    /* (les charges fixes ne servent plus ici depuis que le convertisseur
       est parti dans brouillons/ — voir docs/architecture-finances.svg) */
  };

  const pdSauver = () => {
    const patch = {};
    PAIRES.forEach(([champ, cle]) => { patch[cle] = st[champ]; });
    PDEtat.ecrire(patch, 'point-depart');
  };

  /* ④ Le profil — la seule sortie de cet onglet vers le reste du site */
  const profil = () => PD_PROFILS.filter(p => p.k === st.profil)[0] || PD_PROFILS[1];
  const carteById = (id) =>
    PD_REPERES.filter(c => c.id === id)[0] || (st.pdRepCustom || []).filter(c => c.id === id)[0];

    /* --- ① Les 8 phrases → deux scripts dominants --- */
    const pdDominants = () => {
      const somme = {};
      PD_PHRASES.forEach((p, i) => {
        const r = st.pdMq[i];
        if (r === null || r === undefined) return;
        somme[p.k] = (somme[p.k] || 0) + r;
      });
      const cles = Object.keys(somme).filter(k => somme[k] > 0).sort((a, b) => somme[b] - somme[a]);
      return { dom: cles[0] || null, sec: cles[1] || null, repondu: st.pdMq.filter(r => r !== null).length };
    };

    const renderPdPhrases = () => {
      const box = $('pdPhrases'); if (!box) return;
      const ech = ['Pas moi', 'Un peu', 'Tout à fait'];
      box.innerHTML = PD_PHRASES.map((p, i) => {
        const val = st.pdMq[i];
        return '<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:12px 15px;border-radius:15px;background:var(--soft);">' +
          '<span style="flex:1 1 190px;min-width:0;font-size:14.5px;">' + p.t + '</span>' +
          '<span style="display:inline-flex;gap:3px;background:var(--surface);border-radius:999px;padding:3px;">' +
            ech.map((e, n) => '<button class="seg" data-mq="' + i + '" data-val="' + n + '" ' +
              'style="min-height:38px;padding:7px 12px;border-radius:999px;font-size:12.5px;font-weight:600;border:0;cursor:pointer;font-family:inherit;' +
              (val === n ? 'background:linear-gradient(135deg,#A78BE8,#8CC7F0);color:#fff;' : 'background:transparent;color:var(--ink2);') +
              '">' + e + '</button>').join('') +
          '</span></div>';
      }).join('');
      box.querySelectorAll('[data-mq]').forEach(b => b.addEventListener('click', () => {
        st.pdMq[+b.getAttribute('data-mq')] = +b.getAttribute('data-val');
        pdSauver(); renderPdPhrases(); renderPdScripts(); majEcrans();
      }));
    };

    const renderPdScripts = () => {
      const box = $('pdScripts'); if (!box) return;
      const { dom, sec, repondu } = pdDominants();
      if (!dom) {
        box.innerHTML = '<div style="padding:16px 18px;border-radius:16px;background:var(--soft);font-size:14px;color:var(--ink2);">' +
          'Réponds à quelques phrases : ton rapport à l\'argent apparaîtra ici. ' +
          (repondu ? '' : 'Rien n\'est obligatoire, et tu peux revenir plus tard.') + '</div>';
        return;
      }
      const bloc = (k, titre) => {
        const S = PD_SCRIPTS[k];
        return '<div class="card" style="padding:22px 24px;display:flex;flex-direction:column;gap:13px;">' +
          '<div style="display:flex;align-items:center;gap:12px;">' +
            '<span style="width:44px;height:44px;flex:none;border-radius:14px;background:' + S.g + ';display:flex;align-items:center;justify-content:center;color:#fff;"><span class="ic" style="font-size:23px;">' + S.ic + '</span></span>' +
            '<div><span class="mono" style="font-size:10.5px;letter-spacing:1.1px;color:var(--ink2);">' + titre + '</span>' +
            '<b style="display:block;font-size:18px;">' + S.n + '</b></div>' +
          '</div>' +
          '<p style="margin:0;font-size:14.5px;line-height:1.55;">' + S.r + '</p>' +
          '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(240px,100%),1fr));gap:12px;">' +
            '<div style="padding:13px 15px;border-radius:14px;background:var(--soft);">' +
              '<span style="display:flex;align-items:center;gap:7px;font-size:13px;font-weight:600;color:var(--acc-green);"><span class="ic" style="font-size:17px;">bolt</span>Ta force</span>' +
              '<p style="margin:6px 0 0;font-size:13.5px;color:var(--ink2);line-height:1.5;">' + S.f + '</p></div>' +
            '<div style="padding:13px 15px;border-radius:14px;background:var(--soft);">' +
              '<span style="display:flex;align-items:center;gap:7px;font-size:13px;font-weight:600;color:var(--acc-amber);"><span class="ic" style="font-size:17px;">visibility_off</span>L\'angle mort</span>' +
              '<p style="margin:6px 0 0;font-size:13.5px;color:var(--ink2);line-height:1.5;">' + S.a + '</p></div>' +
          '</div>' +
          '<div style="display:flex;align-items:flex-start;gap:9px;padding-top:4px;font-size:14px;font-style:italic;color:var(--ink2);">' +
            '<span class="ic" style="font-size:18px;color:var(--acc-violet);">help</span><span>' + S.q + '</span></div>' +
        '</div>';
      };
      box.innerHTML = '<div style="display:flex;flex-direction:column;gap:16px;">' +
        bloc(dom, 'CE QUI DOMINE') + (sec ? bloc(sec, 'EN SECOND') : '') +
        '<div style="text-align:center;font-size:13px;color:var(--ink2);">Tu peux changer tes réponses quand tu veux : rien n\'est figé.</div></div>';
    };

    /* --- ② Les valeurs, dans l'ordre --- */
    const renderPdValeurs = () => {
      const box = $('pdValeurs'); if (!box) return;
      box.innerHTML = PD_VALEURS.map(v => {
        const rang = st.pdValeurs.indexOf(v.k);
        const choisi = rang >= 0;
        return '<button class="seg" data-val="' + v.k + '" style="text-align:left;display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:16px;border:2px solid ' +
          (choisi ? 'transparent' : 'var(--line)') + ';cursor:pointer;font-family:inherit;min-height:44px;' +
          (choisi ? 'background:linear-gradient(135deg,#34D399,#22B4C4);color:#fff;' : 'background:var(--surface);color:var(--ink);') + '">' +
          '<span class="ic" style="font-size:24px;">' + v.ic + '</span>' +
          '<span style="flex:1;"><b style="font-size:15px;">' + v.n + '</b>' +
          '<span style="display:block;font-size:12.5px;opacity:.8;">' + v.d + '</span></span>' +
          (choisi ? '<span class="num" style="font-size:17px;">' + (rang + 1) + '</span>' : '') +
        '</button>';
      }).join('');
      box.querySelectorAll('[data-val]').forEach(b => b.addEventListener('click', () => {
        const k = b.getAttribute('data-val'), i = st.pdValeurs.indexOf(k);
        if (i >= 0) st.pdValeurs.splice(i, 1);
        else if (st.pdValeurs.length < 3) st.pdValeurs.push(k);
        pdSauver(); renderPdValeurs(); renderPdValeursSynth(); majEcrans();
      }));
    };

    const renderPdValeursSynth = () => {
      const box = $('pdValeursSynth'); if (!box) return;
      if (!st.pdValeurs.length) {
        box.innerHTML = '<div style="padding:14px 16px;border-radius:15px;background:var(--soft);font-size:13.5px;color:var(--ink2);">Rien de choisi pour l\'instant — et c\'est très bien aussi.</div>';
        return;
      }
      const noms = st.pdValeurs.map(k => PD_VALEURS.filter(v => v.k === k)[0].n);
      box.innerHTML = '<div style="padding:16px 18px;border-radius:16px;background:var(--soft);">' +
        '<span class="mono" style="font-size:11px;letter-spacing:1px;color:var(--ink2);">CE QUE TON ARGENT SERT D\'ABORD</span>' +
        '<p style="margin:8px 0 0;font-size:15.5px;">' + noms.join(' <span style="color:var(--ink2);">→</span> ') + '</p>' +
        (st.pdValeurs.length < 3 ? '<p style="margin:7px 0 0;font-size:13px;color:var(--ink2);">Tu peux en choisir ' + (3 - st.pdValeurs.length) + ' de plus.</p>' : '') +
      '</div>';
    };

    /* --- ④ Le profil (partagé avec « Mon épargne » via st.profil) --- */
    const renderPdProfil = () => {
      const box = $('pdProfil'); if (!box) return;
      const P = profil();
      const rep = st.pdPq;
      const fini = rep.every(r => r !== null);
      const score = rep.reduce((s, r) => s + (r || 0), 0);
      const sugg = !fini ? null : (score <= 2 ? 'prudent' : score <= 5 ? 'equilibre' : 'dynamique');
      const S = sugg ? PD_PROFILS.filter(p => p.k === sugg)[0] : null;

      box.innerHTML =
        '<div style="display:flex;flex-direction:column;gap:16px;">' +
          '<div style="display:inline-flex;gap:4px;background:var(--soft);border-radius:999px;padding:5px;flex-wrap:wrap;">' +
            PD_PROFILS.map(p => '<button class="seg" data-pdprof="' + p.k + '" style="min-height:44px;display:inline-flex;align-items:center;gap:7px;padding:10px 17px;border-radius:999px;border:0;cursor:pointer;font-family:inherit;font-size:13.5px;font-weight:600;' +
              (st.profil === p.k ? 'background:' + p.g + ';color:#fff;' : 'background:transparent;color:var(--ink2);') +
              '"><span class="ic" style="font-size:18px;">' + p.ic + '</span>' + p.n + '</button>').join('') +
          '</div>' +
          '<p style="margin:0;font-size:14.5px;line-height:1.55;">' + P.d + '</p>' +
          '<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:14px 16px;border-radius:15px;background:var(--soft);">' +
            '<label for="pdAge" style="font-size:14px;font-weight:600;">Mon âge</label>' +
            '<input id="pdAge" class="fld" inputmode="numeric" value="' + (st.age || '') + '" style="width:84px;">' +
            '<span style="font-size:13px;color:var(--ink2);">Règle de pouce : <b>100 − âge</b> = ' + Math.max(0, 100 - (st.age || 0)) + ' % en long terme. L\'horizon prime toujours sur le tempérament.</span>' +
          '</div>' +
          '<div style="border-radius:19px;background:var(--soft);overflow:hidden;">' +
            '<button id="pdPqAcc" class="acc" aria-expanded="' + (st.pdPqOuvert ? 'true' : 'false') + '" style="width:100%;display:flex;align-items:center;gap:12px;padding:15px 18px;text-align:left;border:0;cursor:pointer;font-family:inherit;background:none;color:var(--ink);">' +
              '<span class="ic" style="font-size:21px;color:var(--acc-violet);">quiz</span>' +
              '<b style="flex:1;font-size:15px;">Je ne sais pas quel est mon profil</b>' +
              '<span class="ic" id="pdPqIc" style="font-size:20px;">' + (st.pdPqOuvert ? 'expand_less' : 'expand_more') + '</span>' +
            '</button>' +
            (st.pdPqOuvert ?
              '<div style="padding:0 18px 18px;display:flex;flex-direction:column;gap:14px;">' +
                PD_QUESTIONS.map((q, i) =>
                  '<div><b style="font-size:14px;">' + q.q + '</b>' +
                  '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:8px;">' +
                    q.a.map((a, n) => '<button class="seg" data-pq="' + i + '" data-pqv="' + n + '" style="min-height:44px;padding:9px 14px;border-radius:12px;border:0;cursor:pointer;font-family:inherit;font-size:13px;font-weight:600;' +
                      (rep[i] === n ? 'background:linear-gradient(135deg,#A78BE8,#8CC7F0);color:#fff;' : 'background:var(--surface);color:var(--ink2);') + '">' + a + '</button>').join('') +
                  '</div></div>').join('') +
                (S ? '<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:14px 16px;border-radius:14px;background:var(--surface);">' +
                  '<span style="flex:1 1 200px;min-width:0;font-size:14.5px;">Tes réponses penchent vers un profil <b>' + S.n + '</b>.</span>' +
                  (st.profil === sugg
                    ? '<span style="display:inline-flex;align-items:center;gap:6px;font-size:13.5px;font-weight:600;color:var(--acc-green);"><span class="ic" style="font-size:18px;">check</span>C\'est déjà le tien</span>'
                    : '<button id="pdAdopt" data-k="' + sugg + '" class="seg" style="min-height:44px;padding:11px 18px;border-radius:13px;border:0;cursor:pointer;font-family:inherit;font-size:13.5px;font-weight:600;background:' + S.g + ';color:#fff;">Adopter ce profil</button>') +
                '</div>' : '') +
              '</div>' : '') +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:9px;font-size:13.5px;color:var(--ink2);">' +
            '<span class="ic" style="font-size:18px;color:var(--acc-green);">arrow_forward</span>' +
            'Ce profil fixe les cibles de la pyramide dans <b>Mon épargne</b>.' +
          '</div>' +
        '</div>';

      box.querySelectorAll('[data-pdprof]').forEach(b => b.addEventListener('click', () => {
        st.profil = b.getAttribute('data-pdprof'); pdSauver(); renderPdProfil(); majEcrans(); majFinances();
      }));
      const age = $('pdAge');
      if (age) age.addEventListener('input', () => {
        st.age = parseInt(age.value, 10) || 0; pdSauver(); keepFocus(renderPdProfil);
      });
      const acc = $('pdPqAcc');
      if (acc) acc.addEventListener('click', () => { st.pdPqOuvert = !st.pdPqOuvert; renderPdProfil(); });
      box.querySelectorAll('[data-pq]').forEach(b => b.addEventListener('click', () => {
        st.pdPq[+b.getAttribute('data-pq')] = +b.getAttribute('data-pqv');
        pdSauver(); renderPdProfil();
      }));
      const ad = $('pdAdopt');
      if (ad) ad.addEventListener('click', () => {
        st.profil = ad.getAttribute('data-k'); pdSauver(); renderPdProfil(); majEcrans(); majFinances();
      });
    };

  /* ══════════════════════════════════════════════════════════
     ③ DES REPÈRES, PAS DES RÈGLES

     Deux volets sur la même donnée :
       Ma liste    — les repères retenus, dans TON ordre
       Le catalogue— les 22, cherchables, plus les tiens

     Le plafond de 7 est un REPÈRE, pas une limite : la jauge
     s'allonge, elle ne se remplit pas, et aucun bouton n'est
     jamais désactivé. On prévient, on n'empêche pas.
     ══════════════════════════════════════════════════════════ */

  const BASE = document.currentScript.src.replace(/commun\/js\/point-depart\.js.*$/, '');
  const LIEN_MUR = BASE + 'brouillons/mur/index.html';

  const provenance = (c) => c.col === 'pri' ? 'Principe' : (c.col === 'cmd' ? 'Commandement' : 'Mon repère');
  const OMBRE = '0 10px 22px -20px rgba(90,60,120,.6)';

  const renderPdReperes = () => {
    const rb = $('pdReperes'); if (!rb) return;
    const choisi = st.pdRepSel || [];
    const tous = PD_REPERES.concat(st.pdRepCustom || []);
    const MAX = (typeof PD_PLAFOND !== 'undefined') ? PD_PLAFOND : 7;
    const ALERTE = (typeof PD_ALERTE !== 'undefined') ? PD_ALERTE : 10;
    const surCap = choisi.length >= MAX;
    const alerte = choisi.length > ALERTE;

    /* La jauge : autant de segments que max(7, ce que tu as retenu).
       Le compteur n/7 porte la même information en texte — la couleur
       ne doit jamais être le seul signal. */
    const jauge =
      '<span style="display:inline-flex;align-items:center;gap:8px;">' +
        '<span aria-hidden="true" style="display:flex;gap:4px;flex-wrap:wrap;max-width:180px;">' +
          Array.from({ length: Math.max(MAX, choisi.length) }).map((_, i) =>
            '<span style="width:15px;height:6px;border-radius:3px;background:' +
            (i >= ALERTE ? 'var(--acc-red)' : (i >= MAX ? 'var(--acc-amber)' : (i < choisi.length ? 'var(--acc-green)' : 'var(--line)'))) +
            ';"></span>').join('') +
        '</span>' +
        '<span class="mono" style="font-size:11.5px;color:' + (alerte ? 'var(--acc-red)' : (surCap ? 'var(--acc-amber)' : 'var(--ink2)')) + ';">' +
          choisi.length + '/' + MAX + '</span></span>';

    const message = !surCap ? '' :
      '<div style="font-size:12.5px;line-height:1.5;color:' + (alerte ? 'var(--acc-red)' : 'var(--acc-amber)') + ';">' +
        (alerte
          ? choisi.length + ' repères retenus — à ce stade c\'est un catalogue, plus une boussole. Rien ne t\'empêche de continuer.'
          : choisi.length > MAX
          ? choisi.length + ' repères retenus. Sept est un repère, pas une limite — mais au-delà, une liste se retient rarement.'
          : 'Sept repères — le nombre au-delà duquel une liste cesse de se retenir. Tu peux continuer.') +
      '</div>';

    const volets = (actif) => {
      const onglet = (k, lab, ic, sous) =>
        '<button class="seg" data-repmode="' + k + '" aria-pressed="' + (actif === k) + '" ' +
          'style="min-height:44px;display:inline-flex;align-items:center;gap:8px;padding:11px 17px;border-radius:999px;font-size:14px;font-weight:600;' +
          (actif === k ? 'background:linear-gradient(135deg,#FBBF24,#FF7A45);color:#fff;' : 'background:transparent;color:var(--ink2);') + '">' +
          '<span class="ic" style="font-size:19px;">' + ic + '</span>' + lab +
          (sous ? '<span class="mono" style="font-size:11.5px;opacity:.8;">' + sous + '</span>' : '') + '</button>';
      return '<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;justify-content:space-between;">' +
          '<span style="display:inline-flex;gap:3px;padding:4px;border-radius:999px;background:var(--soft);flex-wrap:wrap;">' +
            onglet('liste', 'Ma liste', 'bookmark', choisi.length ? String(choisi.length) : '') +
            onglet('catalogue', 'Le catalogue', 'search', String(tous.length)) +
          '</span>' + jauge +
          '<span style="font-size:12.5px;color:var(--ink2);max-width:320px;">' +
            (actif === 'liste'
              ? 'Remonte ou descends une ligne pour changer l\'ordre, la croix pour retirer.'
              : 'Ouvre une ligne pour lire ce qu\'elle apporte et ce qu\'elle coûte.') +
          '</span></div>';
    };

    /* ── Volet « Ma liste » ─────────────────────────────────── */
    if (st.repMode !== 'catalogue') {
      const ligne = (c, i, n) =>
        '<div draggable="true" data-lid="' + c.id + '" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:13px 15px;border-radius:15px;background:var(--surface);border:1.5px solid var(--line);box-shadow:' + OMBRE + ';">' +
          '<span class="ic" aria-hidden="true" style="font-size:19px;color:var(--ink2);flex:none;cursor:grab;">drag_indicator</span>' +
          '<span class="mono" style="font-size:13px;color:var(--acc-green);flex:none;width:16px;">' + (i + 1) + '</span>' +
          '<span style="flex:1 1 130px;min-width:0;display:flex;flex-direction:column;gap:3px;">' +
            '<b style="font-size:14.5px;line-height:1.35;">' + c.n + '</b>' +
            '<span style="font-size:11.5px;color:var(--ink2);">' + provenance(c) + (c.s ? ' · ' + c.s : '') + '</span>' +
          '</span>' +
          '<span style="display:inline-flex;gap:4px;flex:none;">' +
            '<button class="seg pd-mini" data-haut="' + c.id + '"' + (i === 0 ? ' disabled' : '') + ' aria-label="Remonter : ' + c.n.replace(/"/g,'&quot;') + '" style="border-radius:11px;background:var(--soft);color:var(--ink2);display:flex;align-items:center;justify-content:center;opacity:' + (i === 0 ? '.35' : '1') + ';"><span class="ic" style="font-size:18px;">arrow_upward</span></button>' +
            '<button class="seg pd-mini" data-bas="' + c.id + '"' + (i === n - 1 ? ' disabled' : '') + ' aria-label="Descendre : ' + c.n.replace(/"/g,'&quot;') + '" style="border-radius:11px;background:var(--soft);color:var(--ink2);display:flex;align-items:center;justify-content:center;opacity:' + (i === n - 1 ? '.35' : '1') + ';"><span class="ic" style="font-size:18px;">arrow_downward</span></button>' +
            '<button class="seg pd-mini" data-move="' + c.id + '" aria-label="Retirer de ma liste : ' + c.n.replace(/"/g,'&quot;') + '" style="border-radius:11px;background:var(--soft);color:var(--ink2);display:flex;align-items:center;justify-content:center;"><span class="ic" style="font-size:18px;">close</span></button>' +
          '</span></div>';

      rb.innerHTML = volets('liste') + message +
        (choisi.length
          ? '<div id="repList" style="display:flex;flex-direction:column;gap:10px;">' +
              choisi.map((id, i) => { const c = carteById(id); return c ? ligne(c, i, choisi.length) : ''; }).join('') +
            '</div>'
          : '<div style="padding:26px 20px;border:2px dashed var(--line);border-radius:18px;text-align:center;display:flex;flex-direction:column;gap:12px;align-items:center;">' +
              '<span class="ic" style="font-size:26px;color:var(--ink2);">bookmark_border</span>' +
              '<span style="font-size:14px;color:var(--ink2);max-width:420px;line-height:1.55;">Rien de retenu pour l\'instant. Le catalogue réunit ' + PD_REPERES.length + ' principes et commandements à prendre — ou à ignorer.</span>' +
              '<button class="seg" data-repmode="catalogue" style="min-height:44px;display:inline-flex;align-items:center;gap:9px;padding:12px 18px;border-radius:14px;background:linear-gradient(135deg,#FBBF24,#FF7A45);color:#fff;font-size:14px;font-weight:600;"><span class="ic" style="font-size:19px;">tune</span>Ouvrir le catalogue</button>' +
            '</div>') +
        lienMur();

      /* déplacer : au clavier avec les deux flèches, à la souris en glissant */
      const bouge = (id, pas) => {
        const cur = (st.pdRepSel || []).slice();
        const i = cur.indexOf(id);
        const j = i + pas;
        if (i < 0 || j < 0 || j >= cur.length) return;
        cur.splice(j, 0, cur.splice(i, 1)[0]);
        st.pdRepSel = cur; pdSauver(); renderPdReperes(); majEcrans();
      };
      rb.querySelectorAll('[data-haut]').forEach(b => b.addEventListener('click', () => bouge(b.getAttribute('data-haut'), -1)));
      rb.querySelectorAll('[data-bas]').forEach(b => b.addEventListener('click', () => bouge(b.getAttribute('data-bas'), 1)));

      rb.querySelectorAll('[data-lid]').forEach(el => {
        const reset = () => { el.style.boxShadow = OMBRE; el.style.opacity = '1'; };
        el.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', el.getAttribute('data-lid'));
          e.dataTransfer.effectAllowed = 'move';
          el.style.opacity = '.45';
        });
        el.addEventListener('dragend', () => rb.querySelectorAll('[data-lid]').forEach(reset));
        el.addEventListener('dragover', (e) => {
          e.preventDefault();
          const r = el.getBoundingClientRect();
          el.style.boxShadow = (e.clientY > r.top + r.height / 2 ? '0 3px 0 0 var(--acc-green)' : '0 -3px 0 0 var(--acc-green)');
        });
        el.addEventListener('dragleave', reset);
        el.addEventListener('drop', (e) => {
          e.preventDefault();
          const id = e.dataTransfer.getData('text/plain');
          const cible = el.getAttribute('data-lid');
          if (!id || id === cible) { reset(); return; }
          const r = el.getBoundingClientRect();
          const apres = e.clientY > r.top + r.height / 2;
          const cur = (st.pdRepSel || []).slice();
          const from = cur.indexOf(id);
          if (from > -1) cur.splice(from, 1);
          let to = cur.indexOf(cible);
          if (to < 0) to = cur.length; else if (apres) to += 1;
          cur.splice(to, 0, id);
          st.pdRepSel = cur; pdSauver(); renderPdReperes(); majEcrans();
        });
      });
      brancherCommun(rb);
      return;
    }

    /* ── Volet « Le catalogue » ─────────────────────────────── */
    const ownIds = (st.pdRepCustom || []).map(c => c.id);
    const fCur = st.repF || 'tous';
    const norm = (x) => x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const qCur = norm((st.repQ || '').trim());
    const estOwn = (c) => ownIds.indexOf(c.id) > -1;
    const passeF = (c) => fCur === 'tous' ? true
      : fCur === 'sel' ? choisi.indexOf(c.id) > -1
      : fCur === 'own' ? estOwn(c)
      : (c.col === fCur && !estOwn(c));
    const passeQ = (c) => !qCur || norm([c.n, c.s, c.p, c.c].filter(Boolean).join(' ')).indexOf(qCur) > -1;
    const liste = tous.filter(c => passeF(c) && passeQ(c));

    const nb = (k) => k === 'tous' ? tous.length
      : k === 'sel' ? choisi.length
      : k === 'own' ? ownIds.length
      : tous.filter(c => c.col === k && !estOwn(c)).length;
    const nbPris = (k) => k === 'tous' ? choisi.length
      : k === 'own' ? choisi.filter(id => ownIds.indexOf(id) > -1).length
      : choisi.filter(id => { const c = carteById(id); return c && c.col === k && ownIds.indexOf(id) === -1; }).length;
    const chip = (k, lab) => {
      const n = nb(k), pris = k === 'sel' ? 0 : nbPris(k);
      return '<button class="seg" data-catf="' + k + '" aria-pressed="' + (fCur === k) + '" ' +
        'style="min-height:44px;display:inline-flex;align-items:center;gap:7px;padding:10px 15px;border-radius:999px;font-size:13px;font-weight:600;' +
        (fCur === k ? 'background:var(--ink);color:var(--surface);' : 'background:var(--soft);color:var(--ink2);') + '">' + lab +
        '<span class="mono" style="font-size:11px;opacity:.85;">' + (pris > 0 ? pris + '/' + n : n) + '</span></button>';
    };

    const rang = (c) => {
      const pris = choisi.indexOf(c.id) > -1;
      const ouv = st.repOpen === c.id;
      const pastille = estOwn(c) ? '#34D399' : (c.col === 'cmd' ? '#FF7A45' : '#A78BE8');
      return '<div style="border-bottom:1px solid var(--line);">' +
        '<div style="display:flex;align-items:center;gap:11px;padding:9px 6px;">' +
          '<span aria-hidden="true" style="width:8px;height:8px;flex:none;border-radius:50%;background:' + pastille + ';"></span>' +
          '<button class="seg" data-catdet="' + c.id + '" aria-expanded="' + ouv + '" style="flex:1;min-width:0;min-height:44px;text-align:left;background:none;padding:0;color:var(--ink);font-size:14px;line-height:1.4;white-space:' + (ouv ? 'normal' : 'nowrap') + ';overflow:hidden;text-overflow:ellipsis;">' + c.n + '</button>' +
          '<button class="seg pd-mini" data-move="' + c.id + '" aria-label="' + (pris ? 'Retirer de ma liste' : 'Ajouter à ma liste') + ' : ' + c.n.replace(/"/g,'&quot;') + '" style="flex:none;border-radius:11px;display:flex;align-items:center;justify-content:center;' +
            (pris ? 'background:linear-gradient(135deg,#34D399,#22B4C4);color:#fff;' : 'background:var(--soft);color:var(--ink2);') + '"><span class="ic" style="font-size:19px;">' + (pris ? 'check' : 'add') + '</span></button>' +
        '</div>' +
        (ouv ? '<div style="padding:0 6px 14px 27px;display:flex;flex-direction:column;gap:8px;">' +
          '<span style="font-size:11.5px;color:var(--ink2);">' + provenance(c) + (c.s ? ' · ' + c.s : '') + '</span>' +
          (c.p ? '<span style="font-size:13px;line-height:1.55;"><b style="color:var(--acc-green);">+</b> ' + c.p + '</span>' : '') +
          (c.c ? '<span style="font-size:13px;line-height:1.55;color:var(--ink2);"><b style="color:var(--acc-amber);">−</b> ' + c.c + '</span>' : '') +
        '</div>' : '') +
      '</div>';
    };

    const etroit = window.matchMedia('(max-width: 640px)').matches;
    rb.innerHTML = volets('catalogue') +
      '<div style="display:flex;align-items:center;gap:9px;padding:0 14px;height:44px;border-radius:13px;border:1.5px solid var(--line);background:var(--field);">' +
        '<span class="ic" aria-hidden="true" style="font-size:19px;color:var(--ink2);">search</span>' +
        '<input id="repQ" aria-label="Chercher dans le catalogue" value="' + (st.repQ || '').replace(/"/g, '&quot;') + '" placeholder="Chercher : dette, plaisir, frais…" style="flex:1;min-width:0;align-self:stretch;border:0;outline:0;background:none;font-family:Fredoka,sans-serif;font-size:14px;color:var(--ink);">' +
      '</div>' +
      '<div style="display:flex;gap:7px;flex-wrap:wrap;">' +
        chip('tous', 'Tous') + chip('cmd', 'Commandements') + chip('pri', 'Principes') +
        (ownIds.length ? chip('own', 'Les miens') : '') + chip('sel', 'Ma liste') +
      '</div>' + message +
      '<div style="display:flex;flex-direction:column;' + (etroit ? '' : 'max-height:430px;overflow:auto;') + 'margin:0 -6px;padding:0 6px;">' +
        (liste.length ? liste.map(rang).join('')
          : '<div style="padding:30px;text-align:center;font-size:13.5px;color:var(--ink2);">Rien ne correspond' + (qCur ? ' à «&nbsp;' + (st.repQ || '') + '&nbsp;»' : '') + '.</div>') +
      '</div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">' +
        '<span class="ic" aria-hidden="true" style="font-size:19px;color:var(--acc-green);">add_circle</span>' +
        '<input id="newRep" aria-label="Ajouter mon propre repère" placeholder="Ajouter mon propre repère…" style="flex:1;min-width:220px;height:44px;padding:10px 14px;border-radius:12px;border:1.5px solid var(--line);background:var(--field);color:var(--ink);font-family:Fredoka,sans-serif;font-size:14px;">' +
        '<button id="addRep" class="seg" style="min-height:44px;padding:11px 18px;border-radius:12px;background:linear-gradient(135deg,#34D399,#22B4C4);color:#fff;font-size:13.5px;font-weight:600;">Ajouter</button>' +
      '</div>' + lienMur();

    const inQ = $('repQ');
    if (inQ) inQ.addEventListener('input', () => { st.repQ = inQ.value; keepFocus(renderPdReperes); });
    rb.querySelectorAll('[data-catf]').forEach(b => b.addEventListener('click', () => {
      st.repF = b.getAttribute('data-catf'); renderPdReperes();
    }));
    rb.querySelectorAll('[data-catdet]').forEach(b => b.addEventListener('click', () => {
      const id = b.getAttribute('data-catdet');
      st.repOpen = st.repOpen === id ? null : id; renderPdReperes();
    }));
    const ajouter = () => {
      const inR = $('newRep');
      const v = ((inR && inR.value) || '').trim();
      if (!v) return;
      const id = 'x' + Date.now();
      st.pdRepCustom = (st.pdRepCustom || []).concat([{ id: id, col:'pri', n: v, s:'Mon repère' }]);
      st.pdRepSel = (st.pdRepSel || []).concat([id]);
      st.repQ = '';
      pdSauver(); renderPdReperes(); majEcrans();
    };
    const addR = $('addRep'); if (addR) addR.addEventListener('click', ajouter);
    const inR = $('newRep');
    if (inR) inR.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); ajouter(); } });
    brancherCommun(rb);
  };

  const lienMur = () =>
    '<a class="bande-lien" href="' + LIEN_MUR + '" style="align-self:flex-start;display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:600;text-decoration:none;"><span class="ic" style="font-size:17px;">grid_view</span>Les découvrir un par un sur Le mur<span class="ic" style="font-size:16px;">arrow_forward</span></a>';

  /* boutons présents dans les deux volets */
  const brancherCommun = (rb) => {
    rb.querySelectorAll('[data-repmode]').forEach(b => b.addEventListener('click', () => {
      st.repMode = b.getAttribute('data-repmode'); renderPdReperes();
    }));
    rb.querySelectorAll('[data-move]').forEach(b => b.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const id = b.getAttribute('data-move');
      const cur = (st.pdRepSel || []).slice();
      const i = cur.indexOf(id);
      if (i > -1) cur.splice(i, 1); else cur.push(id);   /* jamais de refus : sept est un repère */
      st.pdRepSel = cur; pdSauver(); renderPdReperes(); majEcrans();
    }));
  };

  /* ══════════════════════════════════════════════════════════
     ③bis MES DÉFIS

     Les petites actions relevées sur Le mur. On coche, on note,
     on archive — on n'efface pas : l'historique reste lisible et
     chaque défi archivé garde un bouton « Reprendre ».

     Ni score, ni pourcentage, ni série de jours d'affilée :
     c'est la même posture que le reste de l'onglet.
     ══════════════════════════════════════════════════════════ */

  const renderPdDefis = () => {
    const db = $('pdDefis'); if (!db) return;
    const tous = (st.defis || []).map((d, i) => Object.assign({ _i: i }, d));
    const actifs = tous.filter(d => !d.arch);
    const hist = tous.filter(d => d.arch);
    const faits = actifs.filter(d => d.fait).length;

    const maj = (i, patch) => {
      const cur = (st.defis || []).slice();
      cur[i] = Object.assign({}, cur[i], patch);
      st.defis = cur; pdSauver();
    };

    const carte = (d) => {
      const ouv = st.defiOpen === d._i;
      return '<div style="border-radius:18px;border:1.5px solid ' + (d.fait ? 'rgba(52,211,153,.55)' : 'var(--line)') + ';background:' + (d.fait ? 'rgba(52,211,153,.07)' : 'var(--surface)') + ';padding:15px 17px;display:flex;flex-direction:column;gap:11px;">' +
        '<div style="display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap;">' +
          '<button class="seg" data-dfait="' + d._i + '" aria-pressed="' + (d.fait ? 'true' : 'false') + '" aria-label="' + (d.fait ? 'Marquer comme non fait' : 'Marquer comme fait') + '" style="width:44px;height:44px;flex:none;border-radius:13px;display:flex;align-items:center;justify-content:center;' +
            (d.fait ? 'background:linear-gradient(135deg,#34D399,#22B4C4);color:#fff;' : 'background:var(--soft);color:var(--ink2);') + '"><span class="ic" style="font-size:22px;">' + (d.fait ? 'check' : 'radio_button_unchecked') + '</span></button>' +
          '<span style="flex:1;min-width:200px;display:flex;flex-direction:column;gap:4px;">' +
            '<b style="font-size:15px;line-height:1.4;' + (d.fait ? 'text-decoration:line-through;text-decoration-color:rgba(122,106,140,.5);' : '') + '">' + d.t + '</b>' +
            '<span style="font-size:11.5px;color:var(--ink2);">' + (d.src || '') + ' · relevé le ' + PDEtat.jour(d.pris) + (d.fait && d.faitLe ? ' · fait le ' + PDEtat.jour(d.faitLe) : '') + '</span>' +
          '</span>' +
          '<button class="seg" data-dnote="' + d._i + '" aria-expanded="' + ouv + '" style="min-height:44px;display:inline-flex;align-items:center;gap:6px;padding:8px 13px;border-radius:12px;background:var(--soft);color:var(--ink2);font-size:12.5px;font-weight:600;"><span class="ic" style="font-size:16px;">' + (d.note ? 'sticky_note_2' : 'edit_note') + '</span>' + (ouv ? 'Fermer' : (d.note ? 'Ma note' : 'Noter')) + '</button>' +
        '</div>' +
        (ouv
          ? '<textarea id="dnote-' + d._i + '" aria-label="Ma note sur ce défi" placeholder="Ce que ça a donné, ce que tu as appris, ce qui a coincé…" style="width:100%;min-height:82px;padding:12px 14px;border-radius:13px;border:1.5px solid var(--line);background:var(--field);color:var(--ink);font-family:Fredoka,sans-serif;font-size:13.5px;line-height:1.55;resize:vertical;">' + (d.note || '') + '</textarea>'
          : (d.note ? '<span style="font-size:13px;color:var(--ink2);line-height:1.55;padding-left:56px;">«&nbsp;' + d.note + '&nbsp;»</span>' : '')) +
        (d.fait ? '<button class="seg" data-darch="' + d._i + '" style="align-self:flex-start;min-height:38px;display:inline-flex;align-items:center;gap:7px;padding:9px 14px;border-radius:12px;background:var(--soft);color:var(--ink2);font-size:12.5px;font-weight:600;"><span class="ic" style="font-size:16px;">inventory_2</span>Archiver</button>' : '') +
      '</div>';
    };

    db.innerHTML =
      (actifs.length
        ? '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;justify-content:space-between;">' +
            '<span style="font-size:13px;color:var(--ink2);">' + actifs.length + ' défi' + (actifs.length > 1 ? 's' : '') + ' en cours' + (faits ? ' · ' + faits + ' fait' + (faits > 1 ? 's' : '') : '') + '</span>' +
            '<a class="bande-lien" href="' + LIEN_MUR + '" style="display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:600;text-decoration:none;"><span class="ic" style="font-size:16px;">grid_view</span>En relever un autre</a>' +
          '</div>' +
          '<div style="display:flex;flex-direction:column;gap:10px;">' + actifs.map(carte).join('') + '</div>'
        : '<div style="padding:26px 20px;border:2px dashed var(--line);border-radius:18px;text-align:center;display:flex;flex-direction:column;gap:12px;align-items:center;">' +
            '<span class="ic" style="font-size:26px;color:var(--ink2);">bolt</span>' +
            '<span style="font-size:14px;color:var(--ink2);max-width:420px;line-height:1.55;">Aucun défi en cours. Chaque repère du mur propose une action de cinq minutes — tu la relèves, elle atterrit ici.</span>' +
            '<a href="' + LIEN_MUR + '" style="min-height:44px;display:inline-flex;align-items:center;gap:9px;padding:12px 18px;border-radius:14px;background:linear-gradient(135deg,#FBBF24,#FF7A45);color:#fff;font-size:14px;font-weight:600;text-decoration:none;"><span class="ic" style="font-size:19px;">grid_view</span>Ouvrir Le mur</a>' +
          '</div>') +
      (hist.length
        ? '<div style="display:flex;flex-direction:column;gap:10px;">' +
            '<button class="seg" id="dhistT" aria-expanded="' + (st.defiHist ? 'true' : 'false') + '" style="align-self:flex-start;min-height:44px;display:inline-flex;align-items:center;gap:8px;padding:10px 15px;border-radius:12px;background:var(--soft);color:var(--ink2);font-size:13px;font-weight:600;"><span class="ic" style="font-size:17px;">history</span>Historique<span class="mono" style="font-size:11.5px;">' + hist.length + '</span><span class="ic" style="font-size:17px;">' + (st.defiHist ? 'expand_less' : 'expand_more') + '</span></button>' +
            (st.defiHist
              ? '<div style="display:flex;flex-direction:column;gap:8px;">' + hist.map(d =>
                  '<div style="display:flex;align-items:flex-start;gap:11px;padding:12px 14px;border-radius:14px;background:var(--soft);">' +
                    '<span aria-hidden="true" style="width:32px;height:32px;flex:none;border-radius:10px;background:var(--line);color:var(--ink2);opacity:.55;display:flex;align-items:center;justify-content:center;"><span class="ic" style="font-size:18px;">check</span></span>' +
                    '<span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;">' +
                      '<b style="font-size:13.5px;line-height:1.4;">' + d.t + '</b>' +
                      '<span style="font-size:11.5px;color:var(--ink2);">' + (d.src || '') + ' · fait le ' + PDEtat.jour(d.faitLe || d.pris) + '</span>' +
                      (d.note ? '<span style="font-size:12.5px;color:var(--ink2);line-height:1.5;margin-top:3px;">«&nbsp;' + d.note + '&nbsp;»</span>' : '') +
                    '</span>' +
                    '<button class="seg" data-dreprise="' + d._i + '" style="min-height:38px;padding:9px 13px;border-radius:11px;background:var(--surface);color:var(--ink2);font-size:12px;font-weight:600;">Reprendre</button>' +
                  '</div>').join('') + '</div>'
              : '') +
          '</div>'
        : '');

    db.querySelectorAll('[data-dfait]').forEach(b => b.addEventListener('click', () => {
      const i = +b.getAttribute('data-dfait');
      const d = (st.defis || [])[i]; if (!d) return;
      maj(i, { fait: !d.fait, faitLe: !d.fait ? PDEtat.aujourdhui() : null });
      renderPdDefis(); majEcrans();
    }));
    db.querySelectorAll('[data-dnote]').forEach(b => b.addEventListener('click', () => {
      const i = +b.getAttribute('data-dnote');
      st.defiOpen = st.defiOpen === i ? null : i; renderPdDefis();
    }));
    db.querySelectorAll('[data-darch]').forEach(b => b.addEventListener('click', () => {
      maj(+b.getAttribute('data-darch'), { arch: true });
      st.defiOpen = null; st.defiHist = true; renderPdDefis(); majEcrans();
    }));
    db.querySelectorAll('[data-dreprise]').forEach(b => b.addEventListener('click', () => {
      maj(+b.getAttribute('data-dreprise'), { arch: false, fait: false, faitLe: null });
      renderPdDefis(); majEcrans();
    }));
    const ta = (st.defiOpen !== null && st.defiOpen !== undefined) ? $('dnote-' + st.defiOpen) : null;
    if (ta) ta.addEventListener('input', () => { maj(+st.defiOpen, { note: ta.value }); });
    const ht = $('dhistT');
    if (ht) ht.addEventListener('click', () => { st.defiHist = !st.defiHist; renderPdDefis(); });
  };

  /* ══════════════════════════════════════════════════════════
     ⑤ CE QUE MON ARGENT FAIT VRAIMENT

     Deux lignes sur le même axe : ce que tu dis vouloir (②) et ce
     que ton argent finance (l'allocation saisie dans « Où placer »).

     Posture, non négociable :
       — aucun score, aucun pourcentage de cohérence, aucune barre ;
       — aucun rouge/vert : violet plein = déclaré, rose creux = réel ;
       — trois sorties de largeur STRICTEMENT égale, aucune n'est LE
         bouton principal. Le succès, c'est « j'assume l'écart ».

     Ce bloc LIT ② et l'allocation. Il n'écrit que tes phrases à toi.
     ══════════════════════════════════════════════════════════ */

  const DECL_G = 'linear-gradient(135deg,#A78BE8,#8CC7F0)';   /* déclaré : marqueur plein */
  const REEL_C = '#EC4899';                                    /* réel : marqueur creux */

  const valById = (k) => PD_VALEURS.filter(v => v.k === k)[0];
  const SIG = () => (typeof PD_SIGNATURES !== 'undefined') ? PD_SIGNATURES : [];
  const HYP = () => (typeof PD_HYP !== 'undefined') ? PD_HYP : { rdt:.04, voyage:2500, heure:25, retrait:.04 };

  const totalDe = (rep) => SIG().reduce((s, p) => s + ((rep || {})[p.k] || 0), 0);
  const allocTotal = () => totalDe(st.alloc);
  const objTotal = () => totalDe(st.allocObj);
  const allocLignes = () => SIG().filter(p => (st.alloc[p.k] || 0) > 0).length;

  /* Score réel d'une valeur = ce qui la sert − ce qui la coûte,
     pondéré, sur les montants déclarés. */
  const scoreDe = (vk, rep) => SIG().reduce((s, p) => {
    const m = (rep || {})[p.k] || 0; if (!m) return s;
    const sert = p.sert.filter(x => x.v === vk).reduce((a, x) => a + m * (x.w == null ? 1 : x.w), 0);
    const cout = p.coute.filter(x => x.v === vk).reduce((a, x) => a + m * (x.w == null ? .5 : x.w * .5), 0);
    return s + sert - cout;
  }, 0);
  const scoreReel = (vk) => scoreDe(vk, st.alloc);
  const scoreObj  = (vk) => scoreDe(vk, st.allocObj);

  /* La conversion d'un montant dans l'unité d'une valeur est partie
     avec le convertisseur : brouillons/convertisseur.html. */

  /* ── Les montants, sous la confrontation ──────────────────
     Un seul cadre, deux colonnes : ce que ton argent fait aujourd'hui,
     et là où tu voudrais qu'il aille. Côte à côte sur la même ligne,
     parce que c'est l'écart entre les deux qui se lit — pas chaque
     colonne prise à part.

     Toutes ces lignes ne sont pas des placements, et c'est voulu :
     dépenser et ne rien faire sont aussi des destinations. Elles sont
     rangées en trois familles déclarées dans signatures-contenu.js. */
  const GROUPES = () => (typeof PD_GROUPES_ALLOC !== 'undefined' && PD_GROUPES_ALLOC.length)
    ? PD_GROUPES_ALLOC
    : [{ k:'placer', n:'Où va ton argent', s:'' }];

  /* Remettre une colonne à zéro efface dix champs d'un clic. Plutôt
     qu'une modale de confirmation — l'onglet n'en veut nulle part — on
     garde ce qui vient d'être effacé et on offre « Annuler » : on
     n'empêche pas le geste, on le rattrape. */
  let razMemo = null;

  const renderAlloc = () => {
    const box = $('allocBox'); if (!box) return;
    const auj = st.alloc || {}, cib = st.allocObj || {};
    const nAuj = SIG().filter(p => (auj[p.k] || 0) > 0).length;

    const champ = (pre, p, rep, lab) =>
      '<span style="display:flex;flex-direction:column;gap:3px;flex:none;">' +
        '<span class="al-lab mono" style="font-size:9.5px;letter-spacing:.6px;color:var(--ink2);">' + lab + '</span>' +
        '<input id="' + pre + '-' + p.k + '" class="fld" inputmode="numeric" value="' + Math.round(rep[p.k] || 0) + '" aria-label="' + p.n + ' — ' + lab + ', en euros" style="width:88px;">' +
      '</span>';

    const rang = (p) =>
      '<div style="display:flex;align-items:center;gap:11px;flex-wrap:wrap;padding:10px 14px;border-radius:15px;background:var(--soft);">' +
        '<span class="ic" aria-hidden="true" style="font-size:21px;color:var(--ink2);flex:none;">' + p.ic + '</span>' +
        '<span style="flex:1 1 170px;min-width:0;display:flex;flex-direction:column;gap:2px;">' +
          '<b style="font-size:13.5px;line-height:1.3;">' + p.n + '</b>' +
          '<span style="font-size:11.5px;color:var(--ink2);">' + p.s + '</span>' +
        '</span>' +
        '<span style="display:flex;gap:10px;flex:none;">' +
          champ('al', p, auj, 'aujourd\'hui') + champ('ob', p, cib, 'ma cible') +
        '</span>' +
      '</div>';

    box.innerHTML =
      '<div style="display:flex;flex-direction:column;gap:17px;padding:20px 21px;border-radius:20px;border:1.5px solid var(--line);">' +
        '<div style="display:flex;align-items:center;gap:11px;">' +
          '<span class="mono" style="font-size:11px;font-weight:700;letter-spacing:1.2px;color:var(--acc-teal);">OÙ VA MON ARGENT</span>' +
          '<div aria-hidden="true" style="flex:1;height:2px;border-radius:2px;background:linear-gradient(90deg,rgba(14,124,140,.3),transparent);"></div>' +
        '</div>' +
        '<p style="margin:0;font-size:14px;color:var(--ink2);line-height:1.55;max-width:720px;">Des montants approximatifs suffisent. Toutes ces lignes ne sont pas des placements&nbsp;: dépenser et ne rien faire sont aussi des destinations, et elles comptent autant que les autres. La colonne <b>ma cible</b> est facultative — remplie, elle ajoute un troisième repère sur la réglette.</p>' +

        /* en-têtes de colonnes : sur grand écran seulement, les champs
           portent leur propre étiquette dès que la ligne se replie */
        '<div class="al-entete" style="display:flex;align-items:center;gap:11px;padding:0 14px;">' +
          '<span style="flex:1 1 170px;min-width:0;"></span>' +
          '<span style="display:flex;gap:10px;flex:none;">' +
            '<span class="mono" style="width:88px;text-align:center;font-size:10px;font-weight:700;letter-spacing:1px;color:var(--acc-teal);">AUJOURD\'HUI</span>' +
            '<span class="mono" style="width:88px;text-align:center;font-size:10px;font-weight:700;letter-spacing:1px;color:var(--acc-violet);">MA CIBLE</span>' +
          '</span>' +
        '</div>' +

        GROUPES().map(g => {
          const l = SIG().filter(x => (x.grp || 'placer') === g.k);
          if (!l.length) return '';
          return '<div style="display:flex;flex-direction:column;gap:9px;">' +
            '<span style="display:flex;align-items:baseline;gap:9px;flex-wrap:wrap;">' +
              '<span class="mono" style="font-size:10.5px;font-weight:700;letter-spacing:1px;color:var(--ink2);">' + g.n.toUpperCase() + '</span>' +
              '<span style="font-size:11.5px;color:var(--ink2);">' + g.s + '</span>' +
            '</span>' +
            l.map(rang).join('') +
          '</div>';
        }).join('') +

        (() => {
          const raz = (cle, lab) => totalDe(st[cle] || {})
            ? '<button class="seg bande-lien" data-raz="' + cle + '" aria-label="Remettre à zéro la colonne ' + lab + '" style="min-height:34px;padding:6px 11px;border-radius:10px;background:var(--soft);color:var(--ink2);font-size:11.5px;font-weight:600;">remettre à zéro</button>'
            : '';
          const total = (cle, lab, coul) =>
            '<span style="display:inline-flex;align-items:baseline;gap:8px;flex-wrap:wrap;">' +
              '<span class="mono" style="font-size:10px;letter-spacing:1px;color:' + coul + ';">' + lab.toUpperCase() + '</span>' +
              '<span class="num" style="font-size:20px;">' + eur(totalDe(st[cle] || {})) + '</span>' + raz(cle, lab) + '</span>';
          return '<div style="display:flex;flex-direction:column;gap:10px;padding-top:12px;border-top:1px solid var(--line);">' +
            '<div style="display:flex;align-items:baseline;gap:16px;flex-wrap:wrap;font-size:14px;">' +
              total('alloc', 'aujourd\'hui', 'var(--acc-teal)') +
              total('allocObj', 'ma cible', 'var(--acc-violet)') +
              (nAuj ? '<span style="color:var(--ink2);font-size:13px;">sur ' + nAuj + ' ligne' + (nAuj > 1 ? 's' : '') + ' aujourd\'hui.</span>' : '') +
              (totalDe(auj) ? '<button class="seg bande-lien" data-copie="1" style="min-height:38px;padding:9px 14px;border-radius:12px;background:var(--soft);color:var(--ink);font-size:12.5px;font-weight:600;">Copier aujourd\'hui dans ma cible</button>' : '') +
            '</div>' +
            (razMemo
              ? '<div style="display:flex;align-items:center;gap:11px;flex-wrap:wrap;font-size:13px;color:var(--ink2);">' +
                  '<span class="ic" aria-hidden="true" style="font-size:17px;">history</span>' +
                  '<span>Colonne <b>' + razMemo.lab + '</b> remise à zéro.</span>' +
                  '<button class="seg" data-annuler="1" style="min-height:34px;padding:6px 13px;border-radius:10px;background:var(--surface);color:var(--ink);font-size:12.5px;font-weight:600;box-shadow:0 10px 20px -16px rgba(90,60,120,.6);">Annuler</button>' +
                '</div>'
              : '') +
          '</div>';
        })() +
      '</div>';

    [['al', 'alloc'], ['ob', 'allocObj']].forEach(([pre, cle]) => SIG().forEach(p => {
      const el = $(pre + '-' + p.k);
      if (!el) return;
      el.addEventListener('input', () => {
        const rep = Object.assign({}, st[cle]);
        rep[p.k] = Math.max(0, parseFloat(el.value) || 0);
        st[cle] = rep;
        razMemo = null;
        pdSauver();
        keepFocus(() => { renderPdReel(); renderPdSynthese(); });
      });
    }));
    const c = box.querySelector('[data-copie]');
    if (c) c.addEventListener('click', () => {
      st.allocObj = Object.assign({}, st.alloc);
      razMemo = null;
      pdSauver(); renderPdReel(); renderPdSynthese();
    });
    box.querySelectorAll('[data-raz]').forEach(b => b.addEventListener('click', () => {
      const cle = b.getAttribute('data-raz');
      razMemo = { cle: cle, avant: Object.assign({}, st[cle]), lab: cle === 'alloc' ? 'aujourd\'hui' : 'ma cible' };
      st[cle] = {};
      pdSauver(); renderPdReel(); renderPdSynthese();
    }));
    const an = box.querySelector('[data-annuler]');
    if (an) an.addEventListener('click', () => {
      if (!razMemo) return;
      st[razMemo.cle] = razMemo.avant;
      razMemo = null;
      pdSauver(); renderPdReel(); renderPdSynthese();
    });
  };

  /* ── L'écran de confrontation ────────────────────────────── */
  const renderPdReel = () => {
    const box = $('sec-reel'); if (!box) return;
    const sel = st.pdValeurs || [];
    const tot = allocTotal();
    const totObj = objTotal();
    const aObj = totObj > 0;
    const rangs = [3, 2, 1];
    const scores = PD_VALEURS.map(v => {
      const r = sel.indexOf(v.k);
      return { v: v, decl: r > -1 ? rangs[r] : 0, reel: scoreReel(v.k), obj: aObj ? scoreObj(v.k) : 0 };
    });
    /* les deux répartitions partagent la même échelle, sinon les repères
       ne seraient pas comparables d'une ligne à l'autre */
    const toutes = scores.map(s => s.reel).concat(aObj ? scores.map(s => s.obj) : []);
    const lo = Math.min(0, Math.min.apply(null, toutes));
    const hi = Math.max(1, Math.max.apply(null, toutes));
    const pos = (x) => 4 + 92 * ((x - lo) / (hi - lo));
    /* Le triangle ne dit qu'une chose : le rang dans ②. Il n'a donc que
       quatre positions possibles, et AUCUNE pour les cinq valeurs que tu
       n'as pas classées — on ne le dessine pas plutôt que de le coller à
       gauche, ce qui se lirait « je n'en veux pas » au lieu de « je n'ai
       rien dit ». Sans déclaré, pas d'écart : ces lignes passent après,
       rangées par ce que ton argent leur donne. */
    const lignes = scores.map(s => {
      const dit = s.decl > 0;
      const pd = 4 + 92 * (s.decl / 3), pr = pos(s.reel), po = pos(s.obj);
      return { k: s.v.k, v: s.v, decl: s.decl, dit: dit, reel: s.reel, obj: s.obj,
               pd: pd, pr: pr, po: po, ec: dit ? Math.abs(pr - pd) : -1 };
    }).sort((a, b) => (b.ec - a.ec) || (b.reel - a.reel));
    const topReel = scores.slice().sort((a, b) => b.reel - a.reel).filter(s => s.reel > 0).slice(0, 3);
    const ecMax = lignes.length ? lignes[0].ec : 0;
    const assumeFor = (k) => (st.assume || []).filter(a => a.v === k);

    /* Pas de barre de titre ici : l'en-tête de l'étape ⑤ de l'accordéon
       donne déjà le nom du bloc — l'afficher deux fois était un doublon. */
    const entete =
      '<p style="margin:0;font-size:14.5px;color:var(--ink2);max-width:700px;line-height:1.55;">Deux lignes, sur le même axe : ce que tu dis vouloir en <b>②</b>, et ce que ton argent finance d\'après les montants que tu déclares juste en dessous. L\'écart n\'est ni une faute ni une réussite — il se regarde, c\'est tout.</p>';

    /* ni valeurs, ni allocation : deux portes, aucune imposée */
    if (!sel.length && !tot) {
      box.innerHTML = '<div class="card" style="display:flex;flex-direction:column;gap:18px;">' + entete +
        '<div style="display:flex;align-items:center;gap:22px;flex-wrap:wrap;padding:26px 24px;border-radius:22px;background:var(--soft);">' +
          '<span aria-hidden="true" style="position:relative;width:180px;height:74px;flex:none;">' +
            '<span style="position:absolute;left:0;right:0;top:22px;height:2px;background:repeating-linear-gradient(90deg,var(--line) 0 3px,transparent 3px 7px);"></span>' +
            '<span style="position:absolute;left:0;right:0;top:52px;height:2px;background:repeating-linear-gradient(90deg,var(--line) 0 3px,transparent 3px 7px);"></span>' +
          '</span>' +
          '<span style="flex:1 1 210px;min-width:0;font-size:14.5px;line-height:1.6;">Il manque les deux bouts : ce que tu veux, et où va ton argent. Aucun ordre imposé.' +
            '<span style="display:flex;margin-top:14px;gap:11px;flex-wrap:wrap;">' +
              '<button class="acc" data-goto="sec-valeurs" style="min-height:44px;padding:12px 18px;border-radius:14px;background:var(--surface);font-size:13.5px;font-weight:600;box-shadow:0 12px 24px -16px rgba(90,60,120,.5);">Classer mes valeurs</button>' +
              '<button class="seg" data-alloc="al" style="min-height:44px;padding:12px 18px;border-radius:14px;background:var(--surface);color:var(--ink);font-size:13.5px;font-weight:600;box-shadow:0 12px 24px -16px rgba(90,60,120,.5);">Dire où va mon argent</button>' +
            '</span></span>' +
        '</div>' +
        '<div aria-hidden="true" style="height:1px;background:var(--line);"></div>' +
        '<div id="allocBox" style="display:flex;flex-direction:column;gap:16px;scroll-margin-top:20px;"></div>' +
        '<div style="font-size:12.5px;color:var(--ink2);font-style:italic;">Pédagogie générale, <a href="' + BASE + 'a-propos/index.html">pas du conseil financier</a>.</div>' +
      '</div>';
      renderAlloc(); brancherReel(box); return;
    }

    const marqueur = (p, type) =>
      type === 'decl'
      ? '<span title="ce que je dis vouloir" style="position:absolute;left:' + p + '%;top:19px;width:15px;height:12px;margin-left:-7.5px;background:' + DECL_G + ';clip-path:polygon(50% 0,100% 100%,0 100%);"></span>'
      : type === 'obj'
      ? '<span title="où je veux l\'emmener" style="position:absolute;left:' + p + '%;top:8px;width:9px;height:9px;margin-left:-4.5px;border-radius:50%;background:' + REEL_C + ';opacity:.5;"></span>'
      : '<span title="ce que mon argent fait" style="position:absolute;left:' + p + '%;top:5px;width:14px;height:14px;margin-left:-7px;border-radius:50%;border:2.5px solid ' + REEL_C + ';background:var(--surface);box-sizing:border-box;"></span>';

    /* le chemin entre l'actuel et la cible : un trait, pas une flèche —
       on montre un déplacement, on ne dit pas qu'il faut le faire */
    const chemin = (a, b) => {
      const g = Math.min(a, b), d = Math.max(a, b);
      if (d - g < .5) return '';
      return '<span aria-hidden="true" style="position:absolute;left:' + g + '%;width:' + (d - g) + '%;top:11px;height:2px;background:' + REEL_C + ';opacity:.28;"></span>';
    };

    const detail = (k) => {
      const rows = SIG().filter(p => (st.alloc[p.k] || 0) > 0)
        .map(p => ({ p: p, sert: p.sert.filter(x => x.v === k), coute: p.coute.filter(x => x.v === k) }))
        .filter(r => r.sert.length || r.coute.length);
      if (!rows.length) return '<div style="padding:4px 0 14px;font-size:13px;color:var(--ink2);">Aucun de tes placements ne touche cette valeur, ni dans un sens ni dans l\'autre.</div>';
      const pill = (t, creux) => '<span class="mono" style="flex:none;font-size:10px;font-weight:700;letter-spacing:.8px;padding:4px 8px;border-radius:999px;' + (creux ? 'color:' + REEL_C + ';border:1.5px solid ' + REEL_C + ';' : 'color:#fff;background:linear-gradient(135deg,#FF7A45,#EC4899);') + '">' + t + '</span>';
      return '<div style="padding:2px 0 16px;display:flex;flex-direction:column;gap:10px;">' +
        rows.map(r => '<div style="display:flex;gap:12px;align-items:flex-start;padding:13px 15px;border-radius:16px;background:var(--soft);">' +
          '<span class="ic" aria-hidden="true" style="font-size:20px;color:var(--ink2);flex:none;">' + r.p.ic + '</span>' +
          '<span style="flex:1;min-width:200px;">' +
            '<b style="font-size:13.5px;">' + r.p.n + '</b> <span class="mono" style="font-size:11px;color:var(--ink2);">' + eur(st.alloc[r.p.k]) + '</span>' +
            r.sert.map(x => '<span style="display:flex;gap:9px;align-items:baseline;margin-top:8px;">' + pill('SERT') + '<span style="font-size:13px;color:var(--ink2);line-height:1.5;">' + x.why + '</span></span>').join('') +
            r.coute.map(x => '<span style="display:flex;gap:9px;align-items:baseline;margin-top:8px;">' + pill('COÛTE', true) + '<span style="font-size:13px;color:var(--ink2);line-height:1.5;">' + x.why + '</span></span>').join('') +
          '</span></div>').join('') +
        '<div class="mono" style="font-size:11px;color:var(--ink2);">les placements que tu ne finances pas n\'apparaissent pas ici</div>' +
      '</div>';
    };

    const reglette = '<div style="display:flex;flex-direction:column;">' +
      '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--ink2);padding-bottom:6px;"><span>← peu</span><span>beaucoup →</span></div>' +
      lignes.map(l => {
        const open = st.reelDetail === l.k;
        const asm = assumeFor(l.k);
        return '<div style="border-top:1px solid var(--line);">' +
          '<button class="acc" data-reel="' + l.k + '" aria-expanded="' + (open ? 'true' : 'false') + '" style="width:100%;text-align:left;padding:8px 0;min-height:44px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;">' +
            '<span style="width:118px;flex:none;font-size:13.5px;font-weight:600;display:flex;align-items:center;gap:6px;">' + l.v.n +
              (l.decl === 3 ? '<span class="mono" style="font-size:10px;color:var(--acc-violet);">n°1</span>' : '') + '</span>' +
            '<span style="position:relative;flex:1;min-width:180px;height:30px;">' +
              '<span style="position:absolute;left:0;right:0;top:14px;height:2px;border-radius:2px;background:repeating-linear-gradient(90deg,var(--line) 0 3px,transparent 3px 7px);"></span>' +
              (tot && aObj ? chemin(l.pr, l.po) : '') +
              (aObj ? marqueur(l.po.toFixed(1), 'obj') : '') +
              (tot ? marqueur(l.pr.toFixed(1), 'reel') : '') +
              (l.dit ? marqueur(l.pd.toFixed(1), 'decl') : '') +
            '</span>' +
            '<span class="ic" aria-hidden="true" style="font-size:18px;color:var(--ink2);flex:none;' + (open ? 'transform:rotate(180deg);' : '') + '">expand_more</span>' +
          '</button>' +
          asm.map(a => '<div class="mono" style="padding-bottom:10px;font-size:11.5px;color:var(--ink2);">assumé le ' + a.date + ' — ' + a.txt + '</div>').join('') +
          (open ? detail(l.k) : '') +
        '</div>';
      }).join('') +
      '<div style="border-top:1px solid var(--line);display:flex;gap:20px;flex-wrap:wrap;padding-top:12px;margin-top:2px;font-size:12.5px;color:var(--ink2);">' +
        '<span style="display:inline-flex;align-items:center;gap:7px;"><span aria-hidden="true" style="width:13px;height:10px;background:' + DECL_G + ';clip-path:polygon(50% 0,100% 100%,0 100%);"></span>ce que je dis vouloir</span>' +
        '<span style="display:inline-flex;align-items:center;gap:7px;"><span aria-hidden="true" style="width:12px;height:12px;border-radius:50%;border:2.5px solid ' + REEL_C + ';box-sizing:border-box;"></span>ce que mon argent fait</span>' +
        (aObj ? '<span style="display:inline-flex;align-items:center;gap:7px;"><span aria-hidden="true" style="width:9px;height:9px;border-radius:50%;background:' + REEL_C + ';opacity:.5;"></span>où je veux l\'emmener</span>' : '') +
        '<span class="mono" style="font-size:11px;">le triangle ne marque que tes trois valeurs · lignes triées par écart · clique une ligne pour voir pourquoi</span>' +
      '</div></div>';

    const phrase = (!sel.length
      ? '<div style="display:flex;align-items:flex-start;gap:13px;padding:17px 20px;border-radius:18px;background:var(--soft);flex-wrap:wrap;">' +
          '<span class="ic" style="font-size:22px;color:var(--acc-teal);flex:none;">flag</span>' +
          '<span style="flex:1 1 200px;min-width:0;font-size:14.5px;">Ton argent sert d\'abord&nbsp;: <b>' + topReel.map(s => s.v.n).join(', ') + '</b>.' +
            '<span style="display:block;font-size:13px;color:var(--ink2);margin-top:5px;">Il n\'y a rien à comparer tant que tu n\'as pas dit ce que tu veux.</span></span>' +
          '<button class="acc" data-goto="sec-valeurs" style="min-height:44px;padding:11px 17px;border-radius:13px;background:var(--surface);font-size:13.5px;font-weight:600;white-space:nowrap;box-shadow:0 12px 24px -16px rgba(90,60,120,.5);">Classer mes valeurs</button></div>'
      : !tot
      ? '<div style="display:flex;align-items:flex-start;gap:13px;padding:17px 20px;border-radius:18px;background:var(--soft);flex-wrap:wrap;">' +
          '<span class="ic" style="font-size:22px;color:var(--acc-rose);flex:none;">savings</span>' +
          '<span style="flex:1 1 200px;min-width:0;font-size:14.5px;">Tu dis&nbsp;: <b>' + sel.map(k => valById(k).n).join(' → ') + '</b>.' +
            '<span style="display:block;font-size:13px;color:var(--ink2);margin-top:5px;">Dis-moi où va ton argent et la deuxième ligne apparaîtra.</span></span>' +
          '<button class="seg" data-alloc="al" style="min-height:44px;padding:11px 17px;border-radius:13px;background:var(--surface);color:var(--ink);font-size:13.5px;font-weight:600;white-space:nowrap;box-shadow:0 12px 24px -16px rgba(90,60,120,.5);">Descendre à mes montants</button></div>'
      : ecMax < 9
      ? '<div style="font-size:20px;line-height:1.5;max-width:620px;">Ce que tu dis et ce que tu fais racontent la même chose.</div>'
      : '<div style="font-size:20px;line-height:1.55;max-width:640px;">Tu dis&nbsp;: <b>' + sel.map(k => valById(k).n).join(' → ') + '</b>.' +
          '<span style="display:block;margin-top:6px;">Ton argent sert d\'abord&nbsp;: <b>' + topReel.map(s => s.v.n).join(', ') + '</b>.</span></div>');

    /* Le convertisseur « Le même argent. Deux vies. » a déménagé :
       brouillons/convertisseur.html. C'est un exercice de projection,
       pas de confrontation — et il n'avait pas sa place ici. */

    /* Trois sorties, largeurs strictement égales. Aucune n'est LE bouton. */
    const S = [
      { k:'alloc',  t:'Je change mon allocation', s:'La valeur gagne.', ic:'swap_horiz' },
      { k:'valeur', t:'Je change ma valeur',      s:'Je pensais aimer ça. En fait non.', ic:'flag' },
      { k:'assume', t:'J\'assume l\'écart',        s:'Je sais pourquoi je le fais.', ic:'anchor' }
    ];
    /* La pastille affichée par défaut doit AUSSI être celle qu'on
       enregistre : sans ça, « Enregistrer » ne faisait rien tant qu'on
       n'avait pas cliqué une valeur à la main. */
    if (!st.assumeDraft.v && lignes[0]) st.assumeDraft.v = lignes[0].k;
    const cible = st.assumeDraft.v;
    const sorties = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(215px,100%),1fr));gap:13px;">' +
      S.map(s => '<button class="seg" data-sortie="' + s.k + '" aria-pressed="' + (st.sortie === s.k ? 'true' : 'false') + '" style="display:flex;flex-direction:column;gap:8px;padding:19px 20px;border-radius:19px;min-height:44px;text-align:left;background:' + (st.sortie === s.k ? 'linear-gradient(135deg,rgba(167,139,232,.2),rgba(140,199,240,.2))' : 'var(--soft)') + ';color:var(--ink);border:1.5px solid ' + (st.sortie === s.k ? 'rgba(167,139,232,.55)' : 'transparent') + ';">' +
        '<span class="ic" aria-hidden="true" style="font-size:21px;color:var(--ink2);">' + s.ic + '</span>' +
        '<b style="font-size:14.5px;">' + s.t + '</b>' +
        '<span style="font-size:12.5px;color:var(--ink2);line-height:1.5;">' + s.s + '</span>' +
      '</button>').join('') + '</div>' +
      (st.sortie === 'alloc'
        ? '<div style="display:flex;align-items:center;gap:13px;flex-wrap:wrap;padding:17px 20px;border-radius:18px;background:var(--soft);font-size:14px;">' +
            '<span style="flex:1 1 200px;min-width:0;">Rien ne bouge tout seul. Remplis la colonne <b>ma cible</b>, juste en dessous : un troisième repère apparaît sur chaque ligne, et tu vois le chemin avant de toucher à quoi que ce soit.</span>' +
            '<button class="seg" data-alloc="ob" style="min-height:44px;padding:12px 18px;border-radius:14px;background:var(--surface);color:var(--ink);font-size:13.5px;font-weight:600;">Descendre à ma cible</button></div>'
        : st.sortie === 'valeur'
        ? '<div style="display:flex;align-items:center;gap:13px;flex-wrap:wrap;padding:17px 20px;border-radius:18px;background:var(--soft);font-size:14px;">' +
            '<span style="flex:1 1 200px;min-width:0;">Les cartes de <b>②</b> restent ouvertes : clique une valeur choisie pour la retirer, puis reclasse dans l\'ordre que tu veux. Rien d\'autre n\'est effacé.</span>' +
            '<button class="acc" data-goto="sec-valeurs" style="min-height:44px;padding:12px 18px;border-radius:14px;background:var(--surface);font-size:13.5px;font-weight:600;box-shadow:0 12px 24px -16px rgba(90,60,120,.5);">Remonter à ②</button></div>'
        : st.sortie === 'assume'
        ? '<div style="display:flex;flex-direction:column;gap:12px;padding:19px 21px;border-radius:18px;background:var(--soft);">' +
            '<span style="font-size:14px;">Sur quelle valeur&nbsp;?</span>' +
            '<span style="display:flex;gap:8px;flex-wrap:wrap;">' + lignes.slice(0, 4).map(l =>
              '<button class="seg" data-asv="' + l.k + '" aria-pressed="' + (cible === l.k ? 'true' : 'false') + '" style="min-height:44px;padding:10px 15px;border-radius:999px;font-size:13px;font-weight:600;background:' + (cible === l.k ? 'linear-gradient(135deg,#FF7A45,#EC4899);color:#fff;' : 'var(--surface);color:var(--ink);') + '">' + l.v.n + '</button>').join('') + '</span>' +
            '<textarea id="asTxt" rows="2" aria-label="Pourquoi je le fais quand même" placeholder="Pourquoi je le fais quand même…" style="width:100%;resize:vertical;padding:13px 15px;border-radius:15px;border:1.5px solid var(--line);background:var(--field);color:var(--ink);font-family:Fredoka,sans-serif;font-size:14.5px;line-height:1.55;">' + (st.assumeDraft.txt || '') + '</textarea>' +
            '<span style="font-size:12.5px;color:var(--ink2);line-height:1.55;">Ta phrase sera datée et réapparaîtra sous la ligne concernée, la prochaine fois que l\'écart s\'affiche. Un écart choisi vaut mieux qu\'un écart subi.</span>' +
            '<button class="acc" data-assave="1" style="align-self:flex-start;min-height:44px;padding:12px 18px;border-radius:14px;background:var(--surface);font-size:13.5px;font-weight:600;box-shadow:0 12px 24px -16px rgba(90,60,120,.5);">Enregistrer, daté d\'aujourd\'hui</button>' +
          '</div>'
        : '');

    box.innerHTML = '<div class="card" style="display:flex;flex-direction:column;gap:20px;">' + entete +
      reglette + phrase + sorties +
      '<div aria-hidden="true" style="height:1px;background:var(--line);"></div>' +
      '<div id="allocBox" style="display:flex;flex-direction:column;gap:16px;scroll-margin-top:20px;"></div>' +
      '<div style="font-size:12.5px;color:var(--ink2);font-style:italic;">Pédagogie générale, <a href="' + BASE + 'a-propos/index.html">pas du conseil financier</a>. Rien de tout ceci ne quitte ton navigateur.</div>' +
    '</div>';
    renderAlloc(); brancherReel(box);
  };

  const brancherReel = (box) => {
    box.querySelectorAll('[data-alloc]').forEach(b => b.addEventListener('click', () => {
      const el = $('allocBox');
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 20, behavior:'smooth' });
      const pre = b.getAttribute('data-alloc') || 'al';
      const champ = SIG().map(x => $(pre + '-' + x.k)).filter(Boolean)[0];
      if (champ) setTimeout(() => champ.focus(), 420);
    }));
    box.querySelectorAll('[data-goto]').forEach(b => b.addEventListener('click', () => allerA(b.getAttribute('data-goto'))));
    box.querySelectorAll('[data-reel]').forEach(b => b.addEventListener('click', () => {
      const k = b.getAttribute('data-reel');
      st.reelDetail = st.reelDetail === k ? null : k; renderPdReel();
    }));
    box.querySelectorAll('[data-sortie]').forEach(b => b.addEventListener('click', () => {
      const k = b.getAttribute('data-sortie');
      st.sortie = st.sortie === k ? null : k; renderPdReel();
    }));
    box.querySelectorAll('[data-asv]').forEach(b => b.addEventListener('click', () => {
      st.assumeDraft = { v: b.getAttribute('data-asv'), txt: st.assumeDraft.txt }; renderPdReel();
    }));
    const dateFr = () => new Date().toLocaleDateString('fr-FR');
    const at = $('asTxt');
    if (at) at.addEventListener('input', () => { st.assumeDraft.txt = at.value; });
    const sv = box.querySelector('[data-assave]');
    if (sv) sv.addEventListener('click', () => {
      const d = st.assumeDraft;
      if (!d.v || !(d.txt || '').trim()) return;
      st.assume = (st.assume || []).filter(a => a.v !== d.v).concat([{ v: d.v, txt: d.txt.trim(), date: dateFr() }]);
      st.assumeDraft = { v: null, txt: '' }; st.sortie = null;
      pdSauver(); renderPdReel();
    });
  };

  /* ══════════════════════════════════════════════════════════
     LA CARTE D'ORIENTATION — « Cinq étapes, cinq choses différentes »

     Ce n'est pas un sommaire : c'est le meuble. Les cinq blocs
     ①②③④⑤ sont DÉPLACÉS dans les panneaux de cet accordéon, dépouillés
     de leur habillage de carte. Un seul panneau ouvert à la fois.

     Jamais « 3/5 terminées » : « n/5 ENTAMÉES ». Rien à finir, on picore.
     ③bis « Mes défis » n'est pas une étape : elle reste une carte à part.
     ══════════════════════════════════════════════════════════ */

  let syMonte = false;

  const syEtapes = () => {
    const d = pdDominants();
    const fini = st.pdMq.every(r => r !== null && r !== undefined);
    const dom = d.dom ? PD_SCRIPTS[d.dom] : null;
    const sel = st.pdValeurs || [];
    const rep = st.pdRepSel || [];
    const P = profil();
    const tot = allocTotal();
    const nom = (k) => PD_VALEURS.filter(v => v.k === k)[0].n;

    return [
      { id:'sec-rapport', num:'①', ic:'psychology', col:'var(--acc-rose)', g:'linear-gradient(135deg,#F472B6,#A855F7)',
        t:'Ce que l\'argent déclenche', s:'Tes réflexes',
        e: fini ? 'Plutôt ' + dom.n : (d.dom ? 'En cours — plutôt ' + dom.n : '8 phrases à situer'),
        r: d.dom ? 'Réflexe dominant : ' + dom.n : 'Huit phrases à situer, aucune bonne réponse',
        ok: fini },
      { id:'sec-valeurs', num:'②', ic:'explore', col:'var(--acc-teal)', g:'linear-gradient(135deg,#34D399,#22B4C4)',
        t:'Ce qui compte pour moi', s:'Ton cap',
        e: sel.length === 3 ? nom(sel[0]) + ' en premier' : (sel.length ? sel.length + ' sur 3 choisies' : '3 priorités à classer'),
        r: sel.length === 3 ? 'Cap : ' + sel.map(nom).join(' · ')
          : (sel.length ? sel.length + ' valeur' + (sel.length > 1 ? 's' : '') + ' sur 3 — à compléter' : 'Trois priorités à classer'),
        ok: sel.length === 3 },
      { id:'sec-reperes', num:'③', ic:'signpost', col:'var(--acc-amber)', g:'linear-gradient(135deg,#FBBF24,#FF7A45)',
        t:'Des repères, pas des règles', s:'Tes arbitrages',
        e: rep.length ? rep.length + ' retenu' + (rep.length > 1 ? 's' : '') : 'À picorer',
        r: rep.length ? rep.length + ' repère' + (rep.length > 1 ? 's' : '') + ' dans ta sélection' : 'Aucun repère retenu pour l\'instant',
        ok: rep.length > 1 },
      { id:'sec-profil', num:'④', ic:'tune', col:'var(--acc-violet)', g:'linear-gradient(135deg,#A78BE8,#8CC7F0)',
        t:'Quel investisseur je suis', s:'Ton dosage du risque',
        e:'Actuellement ' + P.n,
        r:'Profil ' + P.n + ' — il fixe les cibles d\'Épargne',
        ok:true },
      { id:'sec-reel', num:'⑤', ic:'compare_arrows', col:'var(--acc-rose)', g:'linear-gradient(135deg,#FF7A45,#EC4899)',
        t:'Ce que mon argent fait vraiment', s:'Déclaré / réel, côte à côte',
        e: (sel.length && tot) ? 'Deux lignes à comparer' : (tot ? 'Il manque tes valeurs' : 'Il manque ton allocation'),
        r: (sel.length && tot) ? 'Déclaré et réel prêts à comparer' : (tot ? 'Il manque tes trois valeurs' : 'Il manque ta répartition réelle'),
        ok: !!(sel.length && tot) }
    ];
  };

  const syPan = (id) => $('syPan-' + id);

  /* Ouverture/fermeture en hauteur animée. On mesure, on fige, on anime,
     puis on repasse en `auto` — sinon un panneau ouvert ne suit pas son
     contenu quand il change (une réponse ajoutée, un détail déplié). */
  const syAnim = (id, ouvert, direct) => {
    const p = syPan(id); if (!p) return;
    const dedans = p.firstElementChild;
    if (direct) {
      if (p._anim) return;
      p.style.transition = 'none';
      p.style.height = ouvert ? 'auto' : '0px';
      p.style.opacity = ouvert ? '1' : '0';
      p.style.overflow = ouvert ? 'visible' : 'hidden';
      void p.offsetHeight;
      p.style.transition = 'height .42s cubic-bezier(.22,.61,.36,1), opacity .3s ease';
      return;
    }
    clearTimeout(p._t);
    p._anim = true;
    p.style.overflow = 'hidden';
    p.style.height = p.getBoundingClientRect().height + 'px';
    void p.offsetHeight;
    p.style.opacity = ouvert ? '1' : '0';
    p.style.height = (ouvert ? dedans.getBoundingClientRect().height : 0) + 'px';
    p._t = setTimeout(() => {
      p._anim = false;
      if (ouvert) { p.style.height = 'auto'; p.style.overflow = 'visible'; }
    }, 460);
  };

  const syHead = (e) => {
    const ouv = st.syOpen === e.id;
    return '<span class="sy-gauche" style="flex:1;min-width:180px;display:flex;flex-direction:column;gap:4px;">' +
        '<span style="display:flex;align-items:center;gap:9px;">' +
          '<span class="mono" style="font-size:15px;color:' + e.col + ';opacity:.8;">' + e.num + '</span>' +
          '<b style="font-size:19px;font-weight:600;letter-spacing:-.3px;line-height:1.25;">' + e.t + '</b></span>' +
        '<span style="font-size:14px;color:var(--ink2);line-height:1.4;">' + (ouv ? e.s : e.r) + '</span>' +
      '</span>' +
      '<span class="sy-droite" style="display:inline-flex;align-items:center;gap:9px;flex:none;">' +
        '<span style="display:inline-flex;align-items:center;gap:7px;padding:7px 13px;border-radius:999px;background:' +
          (e.ok ? 'rgba(52,211,153,.16)' : 'var(--field)') + ';border:1.5px solid ' + (e.ok ? 'transparent' : 'var(--line)') +
          ';font-size:13.5px;font-weight:600;color:' + (e.ok ? 'var(--acc-green)' : 'var(--ink2)') + ';white-space:nowrap;" class="sy-chip">' +
          '<span class="ic" aria-hidden="true" style="font-size:17px;">' + (e.ok ? 'check_circle' : 'radio_button_unchecked') + '</span>' + e.e + '</span>' +
        '<span class="ic" aria-hidden="true" style="font-size:24px;color:var(--ink2);transition:transform .3s ease;transform:rotate(' + (ouv ? '180deg' : '0deg') + ');">expand_more</span>' +
      '</span>';
  };

  const syPeindre = (e, direct) => {
    const h = $('syHead-' + e.id);
    const ouv = st.syOpen === e.id;
    if (h) {
      h.innerHTML = syHead(e);
      h.setAttribute('aria-expanded', ouv ? 'true' : 'false');
      h.style.borderRadius = ouv ? '20px 20px 0 0' : '20px';
      h.style.borderColor = ouv ? 'var(--line)' : 'transparent';
      h.style.borderBottomColor = 'transparent';
      h.style.background = ouv ? 'var(--surface)' : 'var(--soft)';
    }
    const p = syPan(e.id);
    if (p) {
      p.style.border = ouv ? '1.5px solid var(--line)' : '1.5px solid transparent';
      p.style.borderTop = '0';
      p.style.borderRadius = '0 0 20px 20px';
      p.style.background = ouv ? 'var(--surface)' : 'transparent';
    }
    const ln = $('syLine-' + e.id);
    if (ln) { ln.style.background = e.ok ? e.col : 'var(--line)'; ln.style.opacity = e.ok ? '.5' : '1'; }
    if (direct) syAnim(e.id, ouv, true);
  };

  const syBasculer = (id) => {
    const avant = st.syOpen;
    st.syOpen = avant === id ? null : id;
    if (avant) syAnim(avant, false);
    if (st.syOpen) syAnim(st.syOpen, true);
    syEtapes().forEach(e => syPeindre(e, false));
  };

  /* Ouvrir l'étape qui contient une section, puis y aller.
     (Remplace le défilement simple : la section peut être repliée.) */
  const ouvrirEtape = (id, alors) => {
    if (st.syOpen !== id && $('syPan-' + id)) {
      syBasculer(id);
      setTimeout(() => { if (alors) alors(); }, 480);
    } else if (alors) alors();
  };

  const renderPdSynthese = () => {
    const sy = $('synthese'); if (!sy) return;
    const etapes = syEtapes();
    const nOk = etapes.filter(e => e.ok).length;

    if (!syMonte) {
      syMonte = true;
      sy.innerHTML = '<div class="card" style="display:flex;flex-direction:column;gap:18px;">' +
        '<div style="display:flex;align-items:flex-end;gap:16px;flex-wrap:wrap;justify-content:space-between;">' +
          '<span style="display:flex;flex-direction:column;gap:5px;min-width:260px;">' +
            '<h3>Cinq étapes, cinq choses différentes</h3>' +
            '<span style="font-size:13.5px;color:var(--ink2);">Chacune éclaire un angle. On picore, rien à finir.</span>' +
          '</span>' +
          '<span style="display:inline-flex;align-items:center;gap:9px;flex:none;white-space:nowrap;">' +
            '<span id="syMeter" aria-hidden="true" style="display:inline-flex;gap:4px;flex:none;"></span>' +
            '<span id="syMeterLabel" class="mono" style="font-size:11.5px;letter-spacing:.5px;color:var(--ink2);"></span>' +
          '</span>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;">' +
          etapes.map((e, i) => {
            const dernier = i === etapes.length - 1;
            return '<div id="syRow-' + e.id + '" class="sy-row" style="display:flex;gap:17px;align-items:stretch;padding-bottom:' + (dernier ? '0' : '10px') + ';">' +
              '<div class="sy-rail" style="width:48px;flex:none;display:flex;flex-direction:column;align-items:center;">' +
                '<div aria-hidden="true" class="sy-icone" style="width:48px;height:48px;flex:none;border-radius:16px;background:' + e.g + ';display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:0 10px 20px -12px rgba(90,60,120,.75);"><span class="ic" style="font-size:27px;">' + e.ic + '</span></div>' +
                (dernier ? '' : '<div id="syLine-' + e.id + '" aria-hidden="true" style="flex:1;width:2.5px;min-height:18px;margin:8px 0;border-radius:2px;background:var(--line);"></div>') +
              '</div>' +
              '<div style="flex:1;min-width:0;display:flex;flex-direction:column;">' +
                '<button class="seg sy-tete" id="syHead-' + e.id + '" data-sy="' + e.id + '" aria-controls="syPan-' + e.id + '" style="width:100%;text-align:left;display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:15px 18px;border-radius:20px;border:1.5px solid transparent;background:var(--soft);color:var(--ink);min-height:44px;"></button>' +
                '<div id="syPan-' + e.id + '" style="height:0;opacity:0;overflow:hidden;">' +
                  '<div style="padding:17px 19px 19px;"><div id="syBody-' + e.id + '"></div></div>' +
                '</div>' +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>' +
        '<div style="display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap;padding:15px 18px;border-radius:17px;background:linear-gradient(135deg,rgba(167,139,232,.15),rgba(140,199,240,.15));">' +
          '<span class="ic" aria-hidden="true" style="font-size:21px;color:var(--acc-purple);flex:none;">lightbulb</span>' +
          '<span style="flex:1;min-width:240px;font-size:14px;line-height:1.55;">Le tempérament n\'est pas le dosage : un profil <b>Vigilance</b> peut très bien choisir d\'investir <b>Dynamique</b>. Comprendre son réflexe, c\'est justement pouvoir décider autre chose.</span>' +
        '</div>' +
        '<div style="font-size:12.5px;color:var(--ink2);font-style:italic;">Pédagogie générale, pas du conseil financier.</div>' +
      '</div>';

      /* On DÉPLACE les cinq sections dans les panneaux et on leur retire
         leur habillage de carte : c'est le même DOM, pas une copie. */
      etapes.forEach(e => {
        const hote = $('syBody-' + e.id);
        const sec = $(e.id);
        if (!hote || !sec || hote.contains(sec)) return;
        sec.classList.remove('card');
        sec.style.boxShadow = 'none';
        sec.style.padding = '0';
        sec.style.background = 'transparent';
        sec.style.borderRadius = '0';
        /* la barre de titre « ① CE QUE… » fait doublon avec l'en-tête */
        const t0 = sec.firstElementChild;
        if (t0 && !t0.classList.contains('card') && t0.querySelector && t0.querySelector('.mono')) t0.style.display = 'none';
        hote.appendChild(sec);
      });

      sy.querySelectorAll('[data-sy]').forEach(b =>
        b.addEventListener('click', () => syBasculer(b.getAttribute('data-sy'))));
    }

    const m = $('syMeter');
    if (m) m.innerHTML = etapes.map(e => '<span style="width:22px;height:5px;border-radius:3px;background:' + (e.ok ? e.g : 'var(--line)') + ';"></span>').join('');
    const l = $('syMeterLabel');
    if (l) l.textContent = nOk + '/5 ENTAMÉES';
    etapes.forEach(e => syPeindre(e, true));
  };

  /* Un seul point d'entrée : tout se redessine à partir de l'état. */
  const majEcrans = () => { renderPdSynthese(); renderPdReel(); };

  const renderPointDepart = () => {
    renderPdPhrases(); renderPdScripts();
    renderPdValeurs(); renderPdValeursSynth();
    renderPdReperes(); renderPdDefis();
    renderPdProfil();
    renderPdSynthese(); renderPdReel();
  };

  /* Un autre onglet (Le mur, ou une deuxième fenêtre) a écrit :
     on relit et on redessine, sans écraser au passage. */
  PDEtat.surChangement((cles, source) => {
    if (source === 'point-depart') return;   /* c'est nous : déjà à l'écran */
    pdCharger(); renderPointDepart(); majFinances();
  });

  const demarrer = () => {
    pdCharger();
    renderPointDepart();
    /* si on arrive avec #sec-defis ou #sec-reel dans l'adresse (depuis Le mur) */
    const h = (location.hash || '').replace('#', '');
    if (h && $(h)) setTimeout(() => allerA(h), 120);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer);
  else demarrer();
})();
