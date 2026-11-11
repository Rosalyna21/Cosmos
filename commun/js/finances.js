/* Cosmos — Finances (flux + épargne + pratique)
   Porté depuis cosmos_handoff/reference-finances.html.
   Le thème jour/nuit est géré par theme.js (bouton #themeToggle partagé). */
(function () {
  if (!document.getElementById('tabs')) return;
    const M = {
      '503020': [
        { k:'besoins', label:'Besoins', hint:'loyer, courses, factures', pct:50, g:'linear-gradient(135deg,#8CC7F0,#4DA8FF)' },
        { k:'envies',  label:'Envies',  hint:'sorties, plaisirs, extras', pct:30, g:'linear-gradient(135deg,#FBBF24,#FF7A45)' },
        { k:'epargne', label:'Épargne', hint:'ou remboursement de dettes', pct:20, g:'linear-gradient(135deg,#34D399,#22B4C4)' }
      ],
      'pots': [
        { k:'indispensable', label:'Indispensable', hint:'le socle du quotidien', pct:55, g:'linear-gradient(135deg,#8CC7F0,#4DA8FF)' },
        { k:'liberte',  label:'Liberté financière', hint:'investi, jamais dépensé', pct:10, g:'linear-gradient(135deg,#34D399,#22B4C4)' },
        { k:'epargne',  label:'Épargne long terme', hint:'projets et avenir',      pct:10, g:'linear-gradient(135deg,#22B4C4,#5FE0B0)' },
        { k:'dev',      label:'Développement',      hint:'formation, livres',      pct:10, g:'linear-gradient(135deg,#A78BE8,#8CC7F0)' },
        { k:'loisir',   label:'Loisir',             hint:'à dépenser sans culpabilité', pct:10, g:'linear-gradient(135deg,#FBBF24,#FF7A45)' },
        { k:'dons',     label:'Dons',               hint:'donner, transmettre',    pct:5,  g:'linear-gradient(135deg,#F472B6,#A855F7)' }
      ]
    };
    const SAVE_KEYS = { '503020':['epargne'], 'pots':['liberte','epargne'], 'custom':['epargne'] };
    const RULE_INTRO = {
      '503020': 'La règle d\'Elizabeth Warren : la moitié pour ce dont tu as <b>besoin</b>, un tiers pour ce dont tu as <b>envie</b>, le reste mis de côté. Le meilleur point de départ quand les charges restent sous la moitié du revenu.',
      'pots': 'La méthode JARS de T. Harv Eker : six enveloppes, dont deux dédiées à faire grandir ton argent (liberté financière et long terme) et une à te former. Utile quand le revenu laisse de la marge.',
      'sansratio': 'Ici, pas de pourcentages : ces méthodes partent de <b>tes dépenses réelles</b>, pas d\'un modèle. Ce sont souvent les seules qui tiennent quand les charges pèsent lourd — ou quand les revenus varient d\'un mois à l\'autre.',
      'custom': 'Tes catégories, tes montants. Renomme, ajoute, supprime — l\'important est que la ligne <b>Épargne</b> existe, c\'est elle qui alimente ta pyramide.'
    };
    const METHODES = [
      { n:'Budget base zéro', ic:'exposure_zero', g:'linear-gradient(135deg,#A78BE8,#8CC7F0)', d:'Chaque euro reçoit une mission avant d\'être dépensé. En fin d\'exercice, revenus moins affectations = zéro. Rien ne traîne sans intention.', p:'Popularisé par YNAB.' },
      { n:'Les enveloppes', ic:'mail', g:'linear-gradient(135deg,#FBBF24,#FF7A45)', d:'Une enveloppe par poste, physique ou virtuelle. Quand elle est vide, on attend le mois suivant. La contrainte est visible, donc tenable.', p:'La plus concrète pour reprendre la main.' },
      { n:'Kakebo', ic:'menu_book', g:'linear-gradient(135deg,#F472B6,#A855F7)', d:'Carnet japonais : on note chaque dépense à la main et on répond à quatre questions en fin de mois. L\'écriture crée la prise de conscience.', p:'Lent, mais durable.' }
    ];
    const POTS = [
      { k:'securite',  label:'Sécurité',   target:45, g:'linear-gradient(135deg,#34D399,#22B4C4)', gs:'#2ECFA8', risk:0 },
      { k:'projets',   label:'Projets',    target:25, g:'linear-gradient(135deg,#FBBF24,#FF7A45)', gs:'#FB9B2E', risk:1 },
      { k:'longterme', label:'Long terme', target:20, g:'linear-gradient(135deg,#A78BE8,#8CC7F0)', gs:'#9AA9EE', risk:2 },
      { k:'pari',      label:'Le pari',    target:10, g:'linear-gradient(135deg,#F472B6,#A855F7)', gs:'#D45FD2', risk:2 }
    ];
    const QS = [
      { q:'Tes revenus sont-ils stables ?', a:[{t:'Stables — CDI, fonctionnaire',p:0},{t:'Variables ou précaires',p:2}] },
      { q:'Des personnes dépendent-elles de toi ?', a:[{t:'Non',p:0},{t:'Oui — enfants, proches',p:1}] },
      { q:'Un seul revenu fait-il vivre le foyer ?', a:[{t:'Non — deux revenus',p:0},{t:'Oui — un seul',p:1}] },
      { q:'Tes charges fixes sont-elles lourdes ?', a:[{t:'Non',p:0},{t:'Oui — gros loyer ou crédit',p:1}] }
    ];

    const STRATS = [
      { k:'securite',  name:'Sécuriser d\'abord', ic:'shield',       g:'linear-gradient(135deg,#34D399,#22B4C4)', hint:'Tant que le matelas n\'est pas plein, tout y va.', mix:{securite:100,projets:0,longterme:0,pari:0}, why:'Le choix le plus prudent : on ne construit rien tant que la base n\'est pas solide. Idéal si ton matelas est incomplet.' },
      { k:'equilibre', name:'Équilibré',          ic:'balance',      g:'linear-gradient(135deg,#A78BE8,#8CC7F0)', hint:'On suit les proportions recommandées.',           mix:{securite:45,projets:25,longterme:20,pari:10}, why:'Chaque étage avance en même temps. Le rythme de croisière une fois la sécurité atteinte.' },
      { k:'projets',   name:'Projets d\'abord',   ic:'flag',         g:'linear-gradient(135deg,#FBBF24,#FF7A45)', hint:'Priorité aux échéances datées.',                  mix:{securite:20,projets:60,longterme:20,pari:0},  why:'Quand un achat est prévu dans 1 à 3 ans, il passe avant le long terme — l\'argent doit être disponible à date.' },
      { k:'longterme', name:'Long terme',         ic:'trending_up',  g:'linear-gradient(135deg,#F472B6,#A855F7)', hint:'Matelas plein, on fait travailler.',              mix:{securite:5,projets:15,longterme:65,pari:15},  why:'À réserver au cas où la sécurité est déjà à la cible : c\'est le temps qui fait le rendement.' }
    ];

    const st = {
      model:'503020', income:2400, charges:1080, flux:{}, saveMonthly:480, unit:'eur',
      custom:[
        { k:'indispensable', label:'Indispensable',       hint:'le socle du quotidien',  pct:55, g:'linear-gradient(135deg,#8CC7F0,#4DA8FF)' },
        { k:'liberte',       label:'Liberté financière',  hint:'investi, jamais dépensé', pct:10, g:'linear-gradient(135deg,#34D399,#22B4C4)' },
        { k:'epargne',       label:'Épargne long terme',  hint:'projets et avenir',       pct:10, g:'linear-gradient(135deg,#22B4C4,#5FE0B0)' },
        { k:'dev',           label:'Développement',       hint:'formation, livres',       pct:10, g:'linear-gradient(135deg,#A78BE8,#8CC7F0)' },
        { k:'loisir',        label:'Loisir',              hint:'sans culpabilité',        pct:10, g:'linear-gradient(135deg,#FBBF24,#FF7A45)' },
        { k:'dons',          label:'Dons',                hint:'donner, transmettre',     pct:5,  g:'linear-gradient(135deg,#F472B6,#A855F7)' }
      ],
      depenses:[
        { d:'2026-08-05', label:'Courses de la semaine', cat:'alimentation', a:82 },
        { d:'2026-08-04', label:'Restaurant entre amis', cat:'loisirs',      a:38 },
        { d:'2026-08-02', label:'Plein d\'essence',      cat:'transport',    a:64 },
        { d:'2026-08-01', label:'Cinéma',                cat:'loisirs',      a:12 },
        { d:'2026-07-28', label:'Courses',               cat:'alimentation', a:96 },
        { d:'2026-07-20', label:'Pharmacie',             cat:'sante',        a:24 },
        { d:'2026-07-12', label:'Nouveau manteau',       cat:'achats',       a:110 }
      ],
      view:'situation',
      vals:{ situation:{securite:7000,projets:2000,longterme:1000,pari:0}, objectif:{securite:5000,projets:2500,longterme:2000,pari:500} },
      quiz:[0,0,0,0], spend:1400,
      projects:[
        { name:'Voyage au Japon', target:3000, saved:1200, due:'2027-06' },
        { name:'Changer de vélo', target:1200, saved:800,  due:'2026-12' }
      ],
      projOpen:true, strat:'securite', horizon:24, pratTool:'calc', profil:'equilibre', age:35,
      chargesSrc:'defaut',
      /* Point de départ (onglet « principes ») — persisté sous 'cosmos-point-depart' */
      pdMq:[null,null,null,null,null,null,null,null], pdValeurs:[], pdRepSel:[], pdRepCustom:[],
      pdPq:[null,null,null,null], pdPqOuvert:false,
      taux:{ cap:5000, vers:200, tx:3, an:10, pmt:180000, ptx:3.5, pan:20, obj:15000, oan:3 },
      startDay:1, periode:'mois', moisActif:'2026-08', chargeScope:'toujours',
      postes:[
        { k:'alimentation', n:'Alimentation',       env:'indispensable' },
        { k:'logement',     n:'Logement & charges', env:'indispensable' },
        { k:'transport',    n:'Transport',          env:'indispensable' },
        { k:'sante',        n:'Santé',              env:'indispensable' },
        { k:'abonnements',  n:'Abonnements',        env:'indispensable' },
        { k:'loisirs',      n:'Loisirs & sorties',  env:'loisir' },
        { k:'achats',       n:'Achats & vêtements', env:'loisir' },
        { k:'voyages',      n:'Voyages',            env:'loisir' }
      ],
      chargesAttendues:[
        { label:'Loyer',            a:780, poste:'logement',    paid:{ '2026-07':true, '2026-08':true } },
        { label:'Assurance habitation', a:15, poste:'logement', paid:{ '2026-07':true, '2026-08':true } },
        { label:'Électricité',      a:65,  poste:'logement',    paid:{ '2026-07':true } },
        { label:'Internet',         a:32,  poste:'abonnements', paid:{ '2026-07':true } },
        { label:'Forfait mobile',   a:15,  poste:'abonnements', paid:{} },
        { label:'Assurance voiture', a:35, poste:'transport',   paid:{} },
        { label:'Mutuelle',         a:48,  poste:'sante',       paid:{} }
      ],
      mouvements:[
        { d:'2027-01', label:'Prime annuelle', a:1500, type:'depot' },
        { d:'2028-06', label:'Travaux', a:3000, type:'retrait' }
      ],
      scenarios:[ { tx:1.5, on:true }, { tx:3, on:true }, { tx:5, on:true } ],
      /* Simulateur d'épargne multi-comptes : plusieurs comptes, chacun son taux ; les mouvements visent un compte */
      epargneMulti:{
        an:10,
        comptes:[
          { nom:'Livret A',            tx:1.7, cap:3000, vers:100 },
          { nom:'Assurance-vie (fonds €)', tx:2.5, cap:5000, vers:150 },
          { nom:'Actions (PEA)',       tx:7,   cap:2000, vers:50 }
        ],
        mouvements:[
          { d:'2027-06', label:'Prime',           a:2000, type:'depot',   c:0 },
          { d:'2029-01', label:'Apport logement', a:6000, type:'retrait', c:1 }
        ]
      }
    };
    const eur = (n) => Math.round(n).toLocaleString('fr-FR') + ' €';
    const $ = (id) => document.getElementById(id);
    // Re-render en conservant le focus et le caret du champ en cours de frappe
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

    /* Source unique des profils : le contenu éditorial de Point de départ.
       (La liste de secours ne sert que si point-depart-contenu.js n'est pas chargé.) */
    const PROFILS = (typeof PD_PROFILS !== 'undefined') ? PD_PROFILS : [
      { k:'prudent',   n:'Prudent',   ic:'shield',      g:'linear-gradient(135deg,#34D399,#22B4C4)', d:'Préserver le capital avant tout. Horizon court ou tolérance faible à la baisse.', mix:{ securite:60, projets:25, longterme:13, pari:2 } },
      { k:'equilibre', n:'Équilibré', ic:'balance',     g:'linear-gradient(135deg,#A78BE8,#8CC7F0)', d:'Moitié stabilité, moitié croissance. Le réglage par défaut, qui convient au plus grand nombre.', mix:{ securite:45, projets:25, longterme:25, pari:5 } },
      { k:'dynamique', n:'Dynamique', ic:'trending_up', g:'linear-gradient(135deg,#F472B6,#A855F7)', d:'Accepter la volatilité pour viser plus de rendement. Suppose un horizon long et de quoi encaisser une baisse.', mix:{ securite:30, projets:20, longterme:40, pari:10 } }
    ];
    const profil = () => PROFILS.filter(p => p.k === st.profil)[0] || PROFILS[1];
    const tgt = (p) => profil().mix[p.k];

    const PQ = [
      { q:'Dans combien de temps auras-tu besoin de cet argent ?', a:['Moins de 3 ans','Entre 3 et 8 ans','Plus de 8 ans'] },
      { q:'Ton épargne perd 20 % en un mois. Tu…', a:['Vends pour arrêter les pertes','T\'inquiètes, mais tu attends','En profites pour investir plus'] },
      { q:'Si tu perdais 30 % de cette somme, ton quotidien serait…', a:['Bouleversé','Gêné quelque temps','Inchangé'] },
      { q:'Les placements financiers, tu…', a:['N\'y connais rien','Comprends les bases','Es à l\'aise avec'] }
    ];

    const quizProfilHTML = () => {
      const rep = st.pq || [null,null,null,null];
      const done = rep.every(r => r !== null);
      const score = rep.reduce((s,r) => s + (r || 0), 0);
      const sugg = !done ? null : (score <= 2 ? 'prudent' : score <= 5 ? 'equilibre' : 'dynamique');
      const S = sugg ? PROFILS.filter(p => p.k === sugg)[0] : null;
      return '<div style="margin-top:14px;border-radius:19px;background:var(--soft);overflow:hidden;">' +
        '<button id="accProfil" class="acc" aria-expanded="' + (st.pqOpen ? 'true' : 'false') + '" style="width:100%;display:flex;align-items:center;gap:13px;padding:16px 20px;text-align:left;">' +
          '<span style="width:38px;height:38px;flex:none;border-radius:13px;background:linear-gradient(135deg,#A78BE8,#8CC7F0);display:flex;align-items:center;justify-content:center;color:#fff;"><span class="ic" style="font-size:20px;">quiz</span></span>' +
          '<span style="flex:1;"><b style="font-size:15px;">Je ne sais pas quel est mon profil</b>' +
            '<span style="display:block;font-size:12.5px;color:var(--ink2);margin-top:2px;">4 questions pour t\'en faire une idée</span></span>' +
          (done ? '<span class="mono" style="font-size:12px;color:var(--acc-green);">' + S.n + '</span>' : '') +
          '<span class="ic" style="font-size:24px;color:var(--ink2);">' + (st.pqOpen ? 'expand_less' : 'expand_more') + '</span>' +
        '</button>' +
        (st.pqOpen ? '<div style="padding:0 20px 20px;display:flex;flex-direction:column;gap:0;">' +
          PQ.map((it,qi) =>
            '<div style="padding:13px 0;display:flex;align-items:center;gap:13px;flex-wrap:wrap;' + (qi < PQ.length-1 ? 'border-bottom:1px solid var(--line);' : '') + '">' +
              '<span style="flex:1;min-width:230px;font-size:14px;font-weight:600;">' + it.q + '</span>' +
              '<span style="display:flex;gap:6px;flex-wrap:wrap;">' +
                it.a.map((t,ai) => '<button class="seg" data-pq="' + qi + '|' + ai + '" aria-pressed="' + (rep[qi]===ai?'true':'false') + '" style="min-height:40px;padding:8px 14px;border-radius:999px;font-size:13px;font-weight:600;' +
                  (rep[qi]===ai ? 'background:linear-gradient(135deg,#A78BE8,#8CC7F0);color:#fff;' : 'background:var(--surface);color:var(--ink);border:1.5px solid var(--line);') + '">' + t + '</button>').join('') +
              '</span>' +
            '</div>').join('') +
          (done
            ? '<div style="margin-top:16px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:16px 19px;border-radius:17px;background:var(--surface);">' +
                '<span style="width:42px;height:42px;flex:none;border-radius:14px;background:' + S.g + ';display:flex;align-items:center;justify-content:center;color:#fff;"><span class="ic" style="font-size:22px;">' + S.ic + '</span></span>' +
                '<span style="flex:1;min-width:220px;font-size:14.5px;">Tes réponses penchent vers un profil <b>' + S.n + '</b>.' +
                  '<span style="display:block;font-size:12.5px;color:var(--ink2);margin-top:3px;">' + S.d + '</span></span>' +
                (st.profil === sugg
                  ? '<span style="display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:var(--acc-green);"><span class="ic" style="font-size:17px;">check_circle</span>Déjà adopté</span>'
                  : '<button id="pqAdopt" data-k="' + sugg + '" class="seg" style="min-height:44px;padding:11px 18px;border-radius:13px;background:' + S.g + ';color:#fff;font-size:13.5px;font-weight:600;">Adopter ce profil</button>') +
              '</div>'
            : '<div style="margin-top:14px;font-size:13px;color:var(--ink2);">Réponds aux ' + PQ.length + ' questions pour voir une suggestion.</div>') +
        '</div>' : '') +
      '</div>';
    };

    const renderProfil = () => {
      const box = $('profilSel');
      if (!box) return;
      const P = profil();
      const age = st.age || 35;
      box.innerHTML =
        '<div style="display:flex;flex-direction:column;gap:14px;padding:18px 20px;border-radius:19px;background:var(--soft);">' +
          '<div style="display:flex;align-items:center;gap:13px;flex-wrap:wrap;justify-content:space-between;">' +
            '<span class="mono" style="font-size:11px;letter-spacing:1px;color:var(--ink2);">MON PROFIL D\'INVESTISSEUR — il fixe les cibles</span>' +
            '<div style="display:inline-flex;gap:3px;background:var(--surface);border-radius:999px;padding:4px;">' +
              PROFILS.map(p => '<button class="seg" data-prof="' + p.k + '" style="min-height:38px;display:inline-flex;align-items:center;gap:6px;padding:8px 15px;border-radius:999px;font-size:13px;font-weight:600;' +
                (st.profil === p.k ? 'background:' + p.g + ';color:#fff;' : 'background:transparent;color:var(--ink2);') + '"><span class="ic" style="font-size:16px;">' + p.ic + '</span>' + p.n + '</button>').join('') +
            '</div>' +
          '</div>' +
          '<div style="font-size:13.5px;color:var(--ink2);line-height:1.5;">' + P.d + '</div>' +
          '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">' +
            '<span class="mono" style="font-size:11px;letter-spacing:1px;color:var(--ink2);">CIBLES</span>' +
            '<div style="flex:1;min-width:190px;display:flex;height:13px;border-radius:7px;overflow:hidden;">' +
              POTS.map(p => '<div title="' + p.label + ' ' + tgt(p) + ' %" style="flex:' + tgt(p) + ';background:' + p.g + ';"></div>').join('') +
            '</div>' +
            '<span class="mono" style="font-size:12px;color:var(--ink2);">' + POTS.map(p => tgt(p)).join(' · ') + '</span>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding-top:12px;border-top:1px solid var(--line);font-size:13px;color:var(--ink2);">' +
            '<span class="ic" style="font-size:17px;color:var(--acc-violet);">cake</span>' +
            '<label for="ageInput">J\'ai</label><input id="ageInput" class="fld" inputmode="numeric" value="' + age + '" style="width:62px;height:34px;">' +
            '<span style="flex:1;min-width:210px;">ans — une règle de pouce répandue place environ <b>' + Math.max(0, 100 - age) + ' %</b> en long terme (100 − ton âge). L\'horizon prime toujours sur le tempérament : ce dont tu as besoin dans 6 mois ne va jamais sur un support risqué.</span>' +
          '</div>' +
          '<div style="font-size:12px;color:var(--ink2);font-style:italic;">Repères indicatifs — pédagogie générale, pas une recommandation personnalisée.</div>' +
        '</div>' + quizProfilHTML();

      box.querySelectorAll('[data-prof]').forEach(b => b.addEventListener('click', () => { st.profil = b.getAttribute('data-prof'); renderAll(); }));
      const accP = $('accProfil');
      if (accP) accP.addEventListener('click', () => { st.pqOpen = !st.pqOpen; renderProfil(); });
      box.querySelectorAll('[data-pq]').forEach(b => b.addEventListener('click', () => {
        const [q,a] = b.getAttribute('data-pq').split('|').map(Number);
        st.pq = st.pq || [null,null,null,null];
        st.pq[q] = a; renderProfil();
      }));
      const adopt = $('pqAdopt');
      if (adopt) adopt.addEventListener('click', () => { st.profil = adopt.getAttribute('data-k'); renderAll(); });
      const ai = $('ageInput');
      if (ai) ai.addEventListener('input', () => { st.age = parseInt(ai.value, 10) || 0; keepFocus(renderProfil); });
    };

    // Menu « Outils » (colonne de gauche) : la calculatrice + les trois simulateurs,
    // chacun affiché seul à droite.
    const PRAT = [
      { k:'calc',     n:'Calculatrice',       ic:'calculate' },
      { k:'interets', n:'Intérêts composés',  ic:'trending_up' },
      { k:'pret',     n:'Mensualité de prêt', ic:'account_balance' },
      { k:'objectif', n:'Objectif d\'épargne', ic:'flag' },
      { k:'epargne-multi', n:'Épargne multi-comptes', ic:'account_balance_wallet' }
    ];

    const renderPratique = () => {
      const nav = $('pratNav');
      // une valeur persistée d'avant le découpage (ex. 'taux') retombe sur la calculatrice
      if (PRAT.every(p => p.k !== st.pratTool)) st.pratTool = 'calc';
      if (nav) {
        nav.innerHTML = PRAT.map(p => {
          const on = st.pratTool === p.k;
          return '<button class="seg" data-prat="' + p.k + '" aria-pressed="' + (on ? 'true' : 'false') + '" style="width:100%;min-height:48px;display:flex;align-items:center;gap:11px;padding:12px 16px;border-radius:14px;font-weight:600;font-size:14.5px;text-align:left;' +
            (on ? 'background:linear-gradient(135deg,#FBBF24,#FF7A45);color:#fff;box-shadow:0 12px 24px -14px rgba(255,140,60,.75);' : 'background:var(--soft);color:var(--ink2);') +
            '"><span class="ic" style="font-size:20px;flex:none;">' + p.ic + '</span>' + p.n + '</button>';
        }).join('');
        nav.querySelectorAll('[data-prat]').forEach(b => b.addEventListener('click', () => {
          st.pratTool = b.getAttribute('data-prat'); renderPratique();
        }));
      }
      if (st.pratTool === 'calc') renderCalc();
      else if (st.pratTool === 'epargne-multi') renderEpargneMulti();
      else renderTaux();
    };

    // ── calculatrice financière ──
    const renderCalc = () => {
      const box = $('pratTool');
      if (!box) return;
      const KEYS = [
        ['7','8','9','⌫','C'],
        ['4','5','6','×','÷'],
        ['1','2','3','+','−'],
        ['0','.','(',')','='],
        ['xʸ','ⁿ√x','√','x²','Ans'],
        ['ln','eˣ','±','π','1/x']
      ];
      box.innerHTML =
        '<div class="card" style="display:flex;flex-direction:column;gap:18px;max-width:520px;margin:0 auto;width:100%;">' +
          '<div style="padding:18px 20px;border-radius:18px;background:var(--soft);text-align:right;">' +
            '<div id="calcExpr" class="mono" style="font-size:13px;color:var(--ink2);min-height:18px;word-break:break-all;"></div>' +
            '<div id="calcOut" class="num" style="font-size:34px;margin-top:4px;word-break:break-all;">0</div>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:9px;">' +
            KEYS.flat().map(k => {
              const isOp = ['×','÷','+','−','='].indexOf(k) > -1;
              const isFn = ['xʸ','ⁿ√x','√','x²','1/x','ln','eˣ','±','π','⌫','C','(',')'].indexOf(k) > -1;
              return '<button class="seg" data-k="' + k + '" style="min-height:52px;border-radius:14px;font-size:16px;font-weight:600;' +
                (k === '=' ? 'background:linear-gradient(135deg,#FBBF24,#FF7A45);color:#fff;'
                  : k === 'Ans' ? 'background:var(--soft);color:var(--acc-violet);font-size:14px;'
                  : isOp ? 'background:var(--soft);color:var(--acc-amber);'
                  : isFn ? 'background:var(--soft);color:var(--ink2);font-size:14px;'
                  : 'background:var(--surface);color:var(--ink);box-shadow:0 8px 18px -12px rgba(90,60,120,.5);') + '">' + k + '</button>';
            }).join('') +
          '</div>' +
          '<div style="font-size:12.5px;color:var(--ink2);"><b class="mono">ⁿ√x</b> : tape la valeur, puis <span class="mono">ⁿ√x</span>, puis l\'indice. Ex. <span class="mono">1,45 ⁿ√x 5 =</span> donne le coefficient annuel d\'un capital multiplié par 1,45 en 5 ans : <b class="mono">1,077</b>, soit <b>+7,7 % par an</b>.</div>' +
          '<div style="font-size:12.5px;color:var(--ink2);"><b class="mono">Ans</b> réinsère le dernier résultat obtenu. Ex. <span class="mono">200 × 1,05 =</span> puis <span class="mono">12 − Ans</span></div>' +
        '</div>';

      let expr = '';
      let last = 0;     // résultat de l'évaluation courante
      let ans = 0;      // dernier résultat validé par « = » (la touche Ans)
      let justEq = false; // vrai juste après « = » : la frappe suivante repart à neuf, sauf un opérateur
      const out = $('calcOut'), ex = $('calcExpr');
      const show = () => {
        ex.textContent = expr || '';
        try {
          const js = expr.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-').replace(/,/g,'.');
          if (/^[0-9+\-*/(). ]*(Math\.(pow|sqrt|log)\([^)]*\))?[0-9+\-*/(). ]*$/.test(js) || /Math\./.test(js)) {
            const r = Function('"use strict";return (' + (js || '0') + ')')();
            if (isFinite(r)) { last = r; out.textContent = (Math.round(r * 1e6) / 1e6).toLocaleString('fr-FR'); }
          }
        } catch (e) {}
      };
      box.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => {
        const k = b.getAttribute('data-k');
        if (k === 'C') { expr = ''; out.textContent = '0'; ex.textContent = ''; justEq = false; return; }
        if (k === '⌫') { justEq = false; expr = expr.slice(0, -1); show(); return; }
        if (k === '=') { show(); ans = last; expr = out.textContent.replace(/\s/g,'').replace(',','.'); justEq = true; return; }
        // après « = » : un opérateur enchaîne sur le résultat, tout le reste repart d'une page blanche
        if (justEq) { if (['×','÷','+','−','xʸ','ⁿ√x','x²','1/x','±'].indexOf(k) < 0) expr = ''; justEq = false; }
        if (k === 'Ans') { expr += String(ans); show(); return; }   // rappelle le dernier résultat (comme Casio)
        if (k === '±') { expr = (expr.slice(0,2) === '-(' && expr.slice(-1) === ')') ? expr.slice(2,-1) : '-(' + (expr || '0') + ')'; show(); return; } // change le signe
        if (k === '√') expr += 'Math.sqrt(';
        else if (k === 'ln') expr += 'Math.log(';
        else if (k === 'eˣ') expr += 'Math.exp(';
        else if (k === 'xʸ') expr += '**';
        else if (k === 'ⁿ√x') expr += '**(1/';
        else if (k === 'x²') expr += '**2';
        else if (k === '1/x') expr += '**(-1)';
        else if (k === 'π') expr += 'Math.PI';
        else expr += k;
        show();
      }));
    };

    const SCOL = ['#8CC7F0','#34D399','#F472B6','#FBBF24'];
    const PLACEMENTS = [
      { n:'Livret A',  tx:1.7, s:'sans risque · plafonné' },
      { n:'LDDS',      tx:1.7, s:'sans risque · plafonné' },
      { n:'LEP',       tx:2.5, s:'sous conditions de revenus' },
      { n:'PEL',       tx:2,   s:'bloqué · imposable' },
      { n:'Fonds €',   tx:2.5, s:'assurance-vie · capital garanti' },
      { n:'Actions',   tx:7,   s:'long terme · capital non garanti' },
      { n:'?',         tx:'?', s:'à comparer avec les scénarios' }
    ];

    const placementsHTML = (cur) => '<div style="width:100%;display:flex;align-items:center;gap:9px;flex-wrap:wrap;">' +
      '<span class="mono" style="font-size:11px;letter-spacing:1px;color:var(--ink2);">OU UN PLACEMENT CONNU</span>' +
      PLACEMENTS.map(p => {
        const on = String(cur) === String(p.tx);
        const isQ = p.tx === '?';
        return '<button class="seg" data-plc="' + p.tx + '" title="' + p.s + '" style="min-height:36px;display:inline-flex;align-items:center;gap:7px;padding:7px 14px;border-radius:999px;font-size:13px;font-weight:600;' +
          (on ? 'background:linear-gradient(135deg,#34D399,#22B4C4);color:#fff;' : 'background:var(--soft);color:var(--ink2);border:1.5px solid ' + (isQ ? 'var(--acc-amber)' : 'transparent') + ';') + '">' +
          p.n + (isQ ? '' : ' <span class="mono" style="font-size:12px;opacity:.85;">' + String(p.tx).replace('.',',') + ' %</span>') + '</button>';
      }).join('') +
    '</div>';

    // graphique d'évolution — réutilisé par Intérêts composés et Épargne multi-comptes.
    // o : { marks, showVerse, labelOf, verseFrom } ; les défauts reproduisent le comportement d'origine.
    const graphHTML = (series, f, o) => {
      if (!series.length) return '';
      o = o || {};
      const srcMarks = o.marks || st.mouvements;
      const showVerse = o.showVerse !== false;
      const labelOf = o.labelOf || (s => s.tx + ' %');
      const versePts = o.verseFrom || series[0].pts;
      const colOf = (s, i) => s.col || SCOL[i % 4];
      const W = 620, H = 190, PL = 52, PB = 24, PT = 12;
      const N = Math.max(1, Math.round(f.an * 12));
      const maxV = Math.max.apply(null, series.map(s => Math.max.apply(null, s.pts.map(p => p.v))).concat([1]));
      const x = (m) => PL + (m / N) * (W - PL - 12);
      const y = (v) => H - PB - (v / maxV) * (H - PB - PT);
      const verseLine = versePts.map(p => x(p.m).toFixed(1) + ',' + y(p.verse).toFixed(1)).join(' ');
      const lines = series.map((s,i) =>
        '<polyline fill="none" stroke="' + colOf(s,i) + '" stroke-width="' + (s.w || 2.5) + '" stroke-linejoin="round" points="' +
        s.pts.map(p => x(p.m).toFixed(1) + ',' + y(p.v).toFixed(1)).join(' ') + '"/>').join('');
      const marksSvg = srcMarks.map(mv => {
        const [yy,mm] = mv.d.split('-').map(Number);
        const idx = (yy - 2026) * 12 + (mm - 1) - 7;
        if (idx < 0 || idx > N) return '';
        return '<line x1="' + x(idx).toFixed(1) + '" y1="' + PT + '" x2="' + x(idx).toFixed(1) + '" y2="' + (H-PB) + '" stroke="' + (mv.type === 'retrait' ? 'var(--acc-red)' : 'var(--acc-green)') + '" stroke-width="1.5" stroke-dasharray="3 3" opacity=".75"/>';
      }).join('');
      const gy = [0, .5, 1].map(t => {
        const v = maxV * t;
        return '<line x1="' + PL + '" y1="' + y(v).toFixed(1) + '" x2="' + (W-12) + '" y2="' + y(v).toFixed(1) + '" stroke="currentColor" stroke-width="1" opacity=".14"/>' +
          '<text x="' + (PL-7) + '" y="' + (y(v)+3.5).toFixed(1) + '" text-anchor="end" font-family="Space Mono, monospace" font-size="9.5" fill="currentColor" opacity=".55">' + Math.round(v/1000) + 'k</text>';
      }).join('');
      const gx = [0, Math.round(N/2), N].map(m =>
        '<text x="' + x(m).toFixed(1) + '" y="' + (H-7) + '" text-anchor="middle" font-family="Space Mono, monospace" font-size="9.5" fill="currentColor" opacity=".55">' + (m === 0 ? 'auj.' : Math.round(m/12) + ' an' + (m/12 >= 2 ? 's' : '')) + '</text>').join('');
      return '<div id="icGraphWrap" style="position:relative;width:100%;padding:14px 12px;border-radius:18px;background:var(--soft);">' +
        '<svg id="icGraph" viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:190px;color:var(--ink);" role="img" aria-label="Évolution du capital">' +
          gy + marksSvg +
          (showVerse ? '<polyline fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 4" opacity=".4" points="' + verseLine + '"/>' : '') +
          lines + gx +
          '<line id="icCross" x1="0" y1="' + PT + '" x2="0" y2="' + (H - PB) + '" stroke="currentColor" stroke-width="1" opacity="0" style="pointer-events:none;"/>' +
          series.map((s,i) => '<circle class="icDot" data-s="' + i + '" r="3.8" fill="' + colOf(s,i) + '" stroke="var(--surface)" stroke-width="1.5" opacity="0" style="pointer-events:none;"/>').join('') +
          '<rect id="icHit" x="' + PL + '" y="' + PT + '" width="' + (W - PL - 12) + '" height="' + (H - PB - PT) + '" fill="transparent" style="pointer-events:all;cursor:crosshair;"/>' +
        '</svg>' +
        '<div id="icTip" style="position:absolute;top:10px;pointer-events:none;display:none;background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:8px 11px;font-size:12px;box-shadow:0 12px 24px -12px rgba(90,60,120,.5);z-index:3;"></div>' +
        '<div style="display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--ink2);padding:6px 4px 0;">' +
          series.map((s,i) => '<span style="display:inline-flex;align-items:center;gap:6px;"><span style="width:14px;height:3px;border-radius:2px;background:' + colOf(s,i) + ';"></span>' + labelOf(s) + '</span>').join('') +
          (showVerse ? '<span style="display:inline-flex;align-items:center;gap:6px;"><span style="width:14px;height:0;border-top:2px dashed currentColor;opacity:.5;"></span>versé, sans intérêts</span>' : '') +
        '</div></div>';
    };

    // survol du graphique (partagé) : ligne repère, un point par courbe, infobulle des valeurs
    const bindGraphHover = (drawn, f, labelOf, colOf) => {
      const gEl = $('icGraph'), hit = $('icHit'), cross = $('icCross'), tip = $('icTip'), wrap = $('icGraphWrap');
      if (!(gEl && hit && drawn.length)) return;
      const nf = (n) => Math.round(n).toLocaleString('fr-FR');
      const GW = 620, GH = 190, GPL = 52, GPB = 24, GPT = 12;
      const GN = Math.max(1, Math.round(f.an * 12));
      const maxV = Math.max.apply(null, drawn.map(s => Math.max.apply(null, s.pts.map(p => p.v))).concat([1]));
      const yOf = (v) => GH - GPB - (v / maxV) * (GH - GPB - GPT);
      const dots = gEl.querySelectorAll('.icDot');
      const place = (clientX) => {
        const rect = gEl.getBoundingClientRect();
        if (!rect.width) return;
        let m = Math.round(((clientX - rect.left) / rect.width * GW - GPL) / (GW - GPL - 12) * GN);
        m = Math.max(0, Math.min(GN, m));
        const px = GPL + (m / GN) * (GW - GPL - 12);
        cross.setAttribute('x1', px); cross.setAttribute('x2', px); cross.style.opacity = '.4';
        dots.forEach(d => {
          const s = drawn[+d.getAttribute('data-s')];
          if (!s) return;
          const pt = s.pts[Math.min(m, s.pts.length - 1)];
          d.setAttribute('cx', px); d.setAttribute('cy', yOf(pt.v).toFixed(1)); d.style.opacity = '1';
        });
        const an = m / 12;
        const lab = m === 0 ? 'Aujourd\'hui' : (m % 12 === 0 ? an + ' an' + (an >= 2 ? 's' : '') : an.toFixed(1).replace('.', ',') + ' an' + (an >= 2 ? 's' : ''));
        tip.innerHTML = '<div style="font-weight:600;margin-bottom:4px;">' + lab + '</div>' +
          drawn.map((s, i) => { const pt = s.pts[Math.min(m, s.pts.length - 1)]; return '<div style="display:flex;align-items:center;gap:7px;"><span style="width:9px;height:9px;border-radius:2px;flex:none;background:' + colOf(s, i) + ';"></span><span class="mono">' + labelOf(s) + '&nbsp;·&nbsp;' + nf(pt.v) + ' €</span></div>'; }).join('');
        tip.style.display = 'block';
        const wrapW = wrap ? wrap.clientWidth : rect.width;
        tip.style.left = Math.max(8, Math.min(px / GW * rect.width + 14, wrapW - tip.offsetWidth - 8)) + 'px';
      };
      hit.addEventListener('mousemove', (e) => place(e.clientX));
      hit.addEventListener('mouseleave', () => {
        cross.style.opacity = '0'; tip.style.display = 'none';
        dots.forEach(d => { d.style.opacity = '0'; });
      });
    };

    // tableau de valeurs — une ligne par année, une colonne par scénario tracé
    const tableHTML = (series, f, o) => {
      if (!series.length) return '';
      o = o || {};
      const labelOf = o.labelOf || (s => s.tx + ' %');
      const versePts = o.versePts || series[0].pts;
      const colOf = (s, i) => s.col || SCOL[i % 4];
      const nf = (n) => Math.round(n).toLocaleString('fr-FR');
      const ans = Math.max(1, Math.round(f.an));
      let rows = '';
      for (let yv = 0; yv <= ans; yv++) {
        const vi = Math.min(yv * 12, versePts.length - 1);
        rows += '<tr style="border-top:1px solid var(--line);">' +
          '<td style="padding:7px 11px;font-weight:600;">' + (yv === 0 ? 'auj.' : yv + ' an' + (yv >= 2 ? 's' : '')) + '</td>' +
          '<td class="mono" style="padding:7px 11px;text-align:right;color:var(--ink2);">' + nf(versePts[vi].verse) + ' €</td>' +
          series.map((s, i) => '<td class="num" style="padding:7px 11px;text-align:right;color:' + colOf(s, i) + ';">' + nf(s.pts[Math.min(yv * 12, s.pts.length - 1)].v) + ' €</td>').join('') +
          '</tr>';
      }
      return '<details style="width:100%;" open><summary style="cursor:pointer;font-size:13px;font-weight:600;color:var(--ink2);padding:2px 4px;">Tableau des valeurs, année par année</summary>' +
        '<div style="width:100%;overflow-x:auto;border-radius:16px;background:var(--soft);padding:4px 6px;margin-top:9px;">' +
          '<table style="width:100%;border-collapse:collapse;font-size:13px;">' +
            '<thead><tr style="color:var(--ink2);font-size:12px;">' +
              '<th style="padding:9px 11px;text-align:left;">Année</th>' +
              '<th style="padding:9px 11px;text-align:right;">Versé</th>' +
              series.map((s, i) => '<th style="padding:9px 11px;text-align:right;color:' + colOf(s, i) + ';">' + labelOf(s) + '</th>').join('') +
            '</tr></thead>' +
            '<tbody>' + rows + '</tbody>' +
          '</table></div></details>';
    };

    // scénarios de taux
    const scenarHTML = () => '<div style="width:100%;display:flex;align-items:center;gap:11px;flex-wrap:wrap;">' +
      '<span class="mono" style="font-size:11px;letter-spacing:1px;color:var(--ink2);">COMPARER DES TAUX</span>' +
      st.scenarios.map((s,i) =>
        '<span style="display:inline-flex;align-items:center;gap:6px;padding:5px 8px 5px 11px;border-radius:999px;background:' + (s.on ? 'var(--surface)' : 'transparent') + ';border:1.5px solid ' + (s.on ? SCOL[i % 4] : 'var(--line)') + ';">' +
          '<button class="seg" data-sc="' + i + '" aria-pressed="' + (s.on?'true':'false') + '" style="width:16px;height:16px;border-radius:5px;background:' + (s.on ? SCOL[i % 4] : 'var(--line)') + ';"></button>' +
          '<input data-sctx="' + i + '" id="sctx' + i + '" class="fld" inputmode="decimal" value="' + s.tx + '" style="width:56px;height:32px;padding:5px 8px;font-size:13px;">' +
          '<span class="mono" style="font-size:12px;color:var(--ink2);padding-right:5px;">%</span>' +
        '</span>').join('') +
    '</div>';

    // versements ponctuels et retraits
    const mouvHTML = () => '<div style="width:100%;display:flex;flex-direction:column;gap:10px;">' +
      '<div style="display:flex;align-items:center;gap:11px;flex-wrap:wrap;">' +
        '<span class="mono" style="font-size:11px;letter-spacing:1px;color:var(--ink2);">MOUVEMENTS PONCTUELS</span>' +
        '<span style="font-size:12.5px;color:var(--ink2);">primes, héritage, gros achat — repérés en pointillés sur le graphique. Un <b>dépôt</b> s\'ajoute au capital, un <b>retrait</b> en est prélevé, puis le tout grandit au taux de chaque scénario.</span>' +
      '</div>' +
      st.mouvements.map((mv,i) =>
        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 13px;border-radius:14px;background:var(--soft);">' +
          '<button class="seg" data-mvtype="' + i + '" style="min-height:34px;display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;font-size:12.5px;font-weight:600;background:' + (mv.type === 'retrait' ? 'rgba(196,69,59,.16)' : 'rgba(52,211,153,.18)') + ';color:' + (mv.type === 'retrait' ? 'var(--acc-red)' : 'var(--acc-green)') + ';">' +
            '<span class="ic" style="font-size:15px;">' + (mv.type === 'retrait' ? 'arrow_downward' : 'arrow_upward') + '</span>' + (mv.type === 'retrait' ? 'Retrait' : 'Dépôt') + '</button>' +
          '<input data-mvf="' + i + '|label" id="mvl' + i + '" value="' + mv.label + '" aria-label="Libellé du mouvement" style="flex:1;min-width:130px;height:36px;padding:8px 11px;border-radius:10px;border:1.5px solid var(--line);background:var(--field);color:var(--ink);font-family:Fredoka,sans-serif;font-size:13.5px;">' +
          '<input data-mvf="' + i + '|d" id="mvd' + i + '" type="month" value="' + mv.d + '" aria-label="Date du mouvement" class="sel" style="height:36px;">' +
          '<input data-mvf="' + i + '|a" id="mva' + i + '" class="fld" inputmode="decimal" value="' + mv.a + '" aria-label="Montant du mouvement" style="width:92px;height:36px;">' +
          '<span class="mono" style="font-size:12.5px;color:var(--ink2);">€</span>' +
          '<button class="acc" data-mvdel="' + i + '" aria-label="Supprimer ' + mv.label + '" style="width:34px;height:34px;flex:none;border-radius:10px;display:flex;align-items:center;justify-content:center;color:var(--ink2);"><span class="ic" style="font-size:17px;">delete</span></button>' +
        '</div>').join('') +
      '<button id="mvAdd" class="acc" style="align-self:flex-start;display:inline-flex;align-items:center;gap:7px;padding:10px 16px;min-height:44px;border-radius:12px;background:var(--surface);font-size:13.5px;font-weight:600;box-shadow:0 10px 22px -14px rgba(90,60,120,.5);"><span class="ic" style="font-size:18px;color:var(--acc-amber);">add</span>Ajouter un mouvement</button>' +
    '</div>';

    // ── calculateurs de taux ──
    const renderTaux = () => {
      const box = $('pratTool');
      if (!box) return;
      const f = st.taux;
      const nf = (n) => Math.round(n).toLocaleString('fr-FR');
      // simulation mois par mois, avec mouvements ponctuels
      // chaque mouvement peut avoir son propre support : il grandit alors à son taux
      const simule = (tx) => {
        const r = tx / 100 / 12, N = Math.round(f.an * 12), out = [];
        let v = f.cap, verse = f.cap;
        out.push({ m:0, v, verse });
        for (let m = 1; m <= N; m++) {
          v = v * (1 + r) + f.vers;
          verse += f.vers;
          const dt = new Date(2026, 7 + m, 1);
          const ym = dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2,'0');
          // un dépôt s'ajoute au capital, un retrait en est prélevé ; le tout grandit ensuite au taux du scénario
          st.mouvements.forEach(mv => {
            if (mv.d !== ym) return;
            const signe = mv.type === 'retrait' ? -1 : 1;
            v += signe * mv.a;
            verse += signe * mv.a;
          });
          out.push({ m, v, verse });
        }
        return out;
      };
      const actifs = st.scenarios.filter(s => s.on);
      // « ? » = taux variable : ce sont les scénarios qui fournissent les valeurs à comparer
      const isVar = String(f.tx).trim() === '?' || f.tx === '' || isNaN(parseFloat(f.tx));
      const refTx = isVar ? null : parseFloat(f.tx);
      // le résultat de référence vient TOUJOURS du taux de référence, jamais d'un scénario coché
      const base = isVar ? null : { tx:refTx, pts:simule(refTx) };
      const series = actifs.map(s => ({ tx:s.tx, pts:simule(s.tx) }));
      const drawn = isVar ? series : (series.some(s => s.tx === refTx) ? series : [base].concat(series));
      const last = base ? (base.pts[base.pts.length - 1] || { v:0, verse:0 }) : { v:0, verse:0 };
      const vf = last.v, verses = last.verse;
      // prêt
      const i = f.ptx / 100 / 12, n = f.pan * 12;
      const mens = i ? (f.pmt * i) / (1 - Math.pow(1 + i, -n)) : (n ? f.pmt / n : 0);
      const cout = mens * n - f.pmt;
      // objectif
      const parMois = f.oan ? f.obj / (f.oan * 12) : 0;

      const fld = (id, val, w) => '<input id="' + id + '" class="fld" inputmode="decimal" value="' + val + '" style="width:' + (w||96) + 'px;">';
      const card = (titre, ic, g, corps, resu) =>
        '<div class="card" style="display:flex;flex-direction:column;gap:16px;">' +
          '<div style="display:flex;align-items:center;gap:13px;">' +
            '<span style="width:44px;height:44px;flex:none;border-radius:15px;background:' + g + ';display:flex;align-items:center;justify-content:center;color:#fff;"><span class="ic" style="font-size:23px;">' + ic + '</span></span>' +
            '<h3>' + titre + '</h3></div>' +
          '<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-end;">' + corps + '</div>' +
          resu +
        '</div>';
      const res = (txt, col) => '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:15px 18px;border-radius:17px;background:' + col + ';font-size:14.5px;"><span class="ic" style="font-size:22px;flex:none;">insights</span><span style="flex:1;min-width:230px;">' + txt + '</span></div>';
      const lbl = (t, inner, suff) => '<div style="display:flex;flex-direction:column;gap:6px;"><span style="font-size:13px;font-weight:600;">' + t + '</span><span style="display:flex;align-items:center;gap:7px;">' + inner + (suff ? '<span class="mono" style="color:var(--ink2);">' + suff + '</span>' : '') + '</span></div>';

      const cardInterets =
        card('Intérêts composés', 'trending_up', 'linear-gradient(135deg,#34D399,#22B4C4)',
          lbl('Capital de départ', fld('tCap', f.cap, 110), '€') +
          lbl('Versement / mois', fld('tVers', f.vers), '€') +
          lbl('Taux de référence', '<input id="tTx" class="fld" value="' + f.tx + '" style="width:76px;">', '%') +
          lbl('Durée', fld('tAn', f.an, 70), 'ans') +
          placementsHTML(f.tx),
          graphHTML(drawn, f) + tableHTML(drawn, f) + scenarHTML() + mouvHTML() +
          (isVar
            ? (series.length
                ? '<div style="padding:18px 20px;border-radius:17px;background:linear-gradient(135deg,rgba(52,211,153,.16),rgba(34,180,196,.16));display:flex;flex-direction:column;gap:11px;">' +
                    '<div style="font-size:14.5px;">Taux laissé en <b class="mono">?</b> — voici ce que donnerait chaque scénario au bout de <b>' + f.an + ' ans</b> :</div>' +
                    series.map((s,i) => {
                      const L = s.pts[s.pts.length - 1];
                      return '<div style="display:flex;align-items:center;gap:11px;flex-wrap:wrap;padding:10px 14px;border-radius:13px;background:var(--surface);font-size:14px;">' +
                        '<span style="width:14px;height:3.5px;flex:none;border-radius:2px;background:' + SCOL[i % 4] + ';"></span>' +
                        '<span style="flex:1;min-width:70px;"><b class="mono">' + s.tx + ' %</b></span>' +
                        '<b class="num" style="min-width:96px;text-align:right;">' + nf(L.v) + ' €</b>' +
                        '<span class="mono" style="min-width:104px;text-align:right;font-size:12.5px;color:var(--acc-green);">+' + nf(L.v - L.verse) + ' d\'intérêts</span>' +
                      '</div>';
                    }).join('') +
                  '</div>'
                : res('Coche au moins un scénario de taux ci-dessous pour voir les résultats à comparer.', 'var(--soft)'))
            : res('Au bout de <b>' + f.an + ' ans</b> à <b>' + String(refTx).replace('.',',') + ' %</b>, tu aurais <b class="num" style="font-size:20px;">' + nf(vf) + ' €</b> — dont <b class="mono">' + nf(verses) + ' €</b> versés et <b class="mono">' + nf(vf - verses) + ' €</b> d\'intérêts.', 'linear-gradient(135deg,rgba(52,211,153,.16),rgba(34,180,196,.16))')));

      const cardPret =
        card('Mensualité d\'un prêt', 'account_balance', 'linear-gradient(135deg,#A78BE8,#8CC7F0)',
          lbl('Montant emprunté', fld('pMt', f.pmt, 118), '€') +
          lbl('Taux annuel', fld('pTx', f.ptx, 76), '%') +
          lbl('Durée', fld('pAn', f.pan, 70), 'ans'),
          res('Tu rembourserais <b class="num" style="font-size:20px;">' + nf(mens) + ' € / mois</b> pendant ' + f.pan + ' ans — le crédit te coûterait <b class="mono">' + nf(cout) + ' €</b> d\'intérêts au total.', 'linear-gradient(135deg,rgba(167,139,232,.18),rgba(140,199,240,.18))'));

      const cardObjectif =
        card('Objectif d\'épargne', 'flag', 'linear-gradient(135deg,#FBBF24,#FF7A45)',
          lbl('Montant visé', fld('oObj', f.obj, 118), '€') +
          lbl('Dans', fld('oAn', f.oan, 70), 'ans'),
          res('Il te faudrait mettre <b class="num" style="font-size:20px;">' + nf(parMois) + ' € de côté chaque mois</b>' + (st.saveMonthly ? ' — tu épargnes actuellement ' + nf(st.saveMonthly) + ' €/mois, soit ' + (parMois > st.saveMonthly ? '<b style="color:var(--acc-red);">' + nf(parMois - st.saveMonthly) + ' € de moins que nécessaire</b>' : '<b style="color:var(--acc-green);">de quoi y arriver</b>') : '') + '.', 'linear-gradient(135deg,rgba(251,191,36,.18),rgba(255,122,69,.18))'));

      box.innerHTML = st.pratTool === 'pret' ? cardPret
        : st.pratTool === 'objectif' ? cardObjectif
        : cardInterets;

      const bind = (id, key) => { const el = $(id); if (el) el.addEventListener('input', () => { st.taux[key] = parseFloat(el.value) || 0; keepFocus(renderTaux); }); };
      bind('tCap','cap'); bind('tVers','vers'); bind('tAn','an');
      const txEl = $('tTx');
      if (txEl) txEl.addEventListener('input', () => { st.taux.tx = txEl.value.trim(); keepFocus(renderTaux); });
      box.querySelectorAll('[data-plc]').forEach(b => b.addEventListener('click', () => {
        const v = b.getAttribute('data-plc');
        st.taux.tx = v === '?' ? '?' : parseFloat(v);
        renderTaux();
      }));
      box.querySelectorAll('[data-sc]').forEach(b => b.addEventListener('click', () => {
        const i = parseInt(b.getAttribute('data-sc'), 10);
        st.scenarios[i].on = !st.scenarios[i].on; renderTaux();
      }));
      box.querySelectorAll('[data-sctx]').forEach(el => el.addEventListener('input', () => {
        st.scenarios[parseInt(el.getAttribute('data-sctx'), 10)].tx = parseFloat(el.value) || 0;
        keepFocus(renderTaux);
      }));
      box.querySelectorAll('[data-mvdel]').forEach(b => b.addEventListener('click', () => {
        st.mouvements.splice(parseInt(b.getAttribute('data-mvdel'), 10), 1); renderTaux();
      }));
      box.querySelectorAll('input[data-mvf]').forEach(el => el.addEventListener('input', () => {
        const [i, k] = el.getAttribute('data-mvf').split('|');
        st.mouvements[+i][k] = k === 'a' ? (parseFloat(el.value) || 0) : el.value;
        keepFocus(renderTaux);
      }));
      box.querySelectorAll('[data-mvtype]').forEach(b => b.addEventListener('click', () => {
        const i = parseInt(b.getAttribute('data-mvtype'), 10);
        st.mouvements[i].type = st.mouvements[i].type === 'depot' ? 'retrait' : 'depot';
        renderTaux();
      }));
      const mvAdd = $('mvAdd');
      if (mvAdd) mvAdd.addEventListener('click', () => {
        st.mouvements.push({ d:'2027-01', label:'Nouveau mouvement', a:1000, type:'depot' });
        renderTaux();
      });
      bind('pMt','pmt'); bind('pTx','ptx'); bind('pAn','pan');
      bind('oObj','obj'); bind('oAn','oan');

      // survol du graphique (fonction partagée)
      bindGraphHover(drawn, f, (s) => s.tx + ' %', (s, i) => SCOL[i % 4]);
    };

    // ── simulateur d'épargne multi-comptes ──
    const renderEpargneMulti = () => {
      const box = $('pratTool');
      if (!box) return;
      const em = st.epargneMulti;
      const nf = (n) => Math.round(n).toLocaleString('fr-FR');
      const N = Math.max(1, Math.round(em.an * 12));

      // une projection mois par mois par compte (son taux + son versement), mouvements ciblés
      const series = em.comptes.map((c, ci) => {
        const r = (parseFloat(c.tx) || 0) / 100 / 12;
        let v = c.cap || 0, verse = c.cap || 0;
        const pts = [{ m:0, v, verse }];
        for (let m = 1; m <= N; m++) {
          v = v * (1 + r) + (c.vers || 0);
          verse += (c.vers || 0);
          const dt = new Date(2026, 7 + m, 1);
          const ym = dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2,'0');
          em.mouvements.forEach(mv => {
            if (mv.d !== ym || +mv.c !== ci) return;
            const signe = mv.type === 'retrait' ? -1 : 1;
            v = Math.max(0, v + signe * mv.a);
            verse += signe * mv.a;
          });
          pts.push({ m, v, verse });
        }
        return { nom: c.nom || ('Compte ' + (ci + 1)), col: SCOL[ci % 4], pts };
      });
      // courbe « Total » = somme des comptes
      const totalPts = [];
      for (let m = 0; m <= N; m++) {
        totalPts.push({
          m,
          v: series.reduce((a, s) => a + s.pts[m].v, 0),
          verse: series.reduce((a, s) => a + s.pts[m].verse, 0)
        });
      }
      const totalSerie = { nom:'Total', col:'var(--ink)', w:3.4, pts: totalPts };
      const drawn = series.concat([totalSerie]);
      const last = totalPts[totalPts.length - 1] || { v:0, verse:0 };

      const fld = (id, val, w) => '<input id="' + id + '" class="fld" inputmode="decimal" value="' + val + '" style="width:' + (w || 96) + 'px;">';
      const card = (titre, ic, g, corps, resu) =>
        '<div class="card" style="display:flex;flex-direction:column;gap:16px;">' +
          '<div style="display:flex;align-items:center;gap:13px;">' +
            '<span style="width:44px;height:44px;flex:none;border-radius:15px;background:' + g + ';display:flex;align-items:center;justify-content:center;color:#fff;"><span class="ic" style="font-size:23px;">' + ic + '</span></span>' +
            '<h3>' + titre + '</h3></div>' +
          '<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-end;">' + corps + '</div>' +
          resu +
        '</div>';
      const res = (txt, col) => '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:15px 18px;border-radius:17px;background:' + col + ';font-size:14.5px;"><span class="ic" style="font-size:22px;flex:none;">insights</span><span style="flex:1;min-width:230px;">' + txt + '</span></div>';
      const lbl = (t, inner, suff) => '<div style="display:flex;flex-direction:column;gap:6px;"><span style="font-size:13px;font-weight:600;">' + t + '</span><span style="display:flex;align-items:center;gap:7px;">' + inner + (suff ? '<span class="mono" style="color:var(--ink2);">' + suff + '</span>' : '') + '</span></div>';

      const GRAD = 'linear-gradient(135deg,#34D399,#8CC7F0)';
      const SOFT = 'linear-gradient(135deg,rgba(52,211,153,.16),rgba(140,199,240,.16))';

      // éditeur de comptes
      const comptesHTML =
        '<div style="width:100%;display:flex;flex-direction:column;gap:10px;">' +
          '<span class="mono" style="font-size:11px;letter-spacing:1px;color:var(--ink2);">MES COMPTES</span>' +
          em.comptes.map((c, ci) =>
            '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 13px;border-radius:14px;background:var(--soft);">' +
              '<span style="width:12px;height:12px;flex:none;border-radius:4px;background:' + SCOL[ci % 4] + ';"></span>' +
              '<input data-cf="' + ci + '|nom" value="' + c.nom + '" aria-label="Nom du compte" style="flex:1;min-width:130px;height:36px;padding:8px 11px;border-radius:10px;border:1.5px solid var(--line);background:var(--field);color:var(--ink);font-family:Fredoka,sans-serif;font-size:13.5px;">' +
              '<select data-ctx="' + ci + '" class="sel" aria-label="Support du compte" style="height:36px;font-size:12.5px;">' +
                PLACEMENTS.filter(p => p.tx !== '?').map(p =>
                  '<option value="' + p.tx + '"' + (String(c.tx) === String(p.tx) ? ' selected' : '') + '>' + p.n + ' · ' + String(p.tx).replace('.',',') + ' %</option>').join('') +
                '<option value="' + c.tx + '"' + (PLACEMENTS.some(p => String(p.tx) === String(c.tx)) ? '' : ' selected') + '>Autre · ' + String(c.tx).replace('.',',') + ' %</option>' +
              '</select>' +
              '<input data-cf="' + ci + '|cap" class="fld" inputmode="decimal" value="' + c.cap + '" aria-label="Solde de départ" style="width:92px;height:36px;"><span class="mono" style="font-size:12.5px;color:var(--ink2);">€ départ</span>' +
              '<input data-cf="' + ci + '|vers" class="fld" inputmode="decimal" value="' + c.vers + '" aria-label="Versement mensuel" style="width:78px;height:36px;"><span class="mono" style="font-size:12.5px;color:var(--ink2);">€/mois</span>' +
              '<button class="acc" data-cdel="' + ci + '" aria-label="Supprimer ' + c.nom + '" style="width:34px;height:34px;flex:none;border-radius:10px;display:flex;align-items:center;justify-content:center;color:var(--ink2);"><span class="ic" style="font-size:17px;">delete</span></button>' +
            '</div>').join('') +
          '<button id="cAdd" class="acc" style="align-self:flex-start;display:inline-flex;align-items:center;gap:7px;padding:10px 16px;min-height:44px;border-radius:12px;background:var(--surface);font-size:13.5px;font-weight:600;box-shadow:0 10px 22px -14px rgba(90,60,120,.5);"><span class="ic" style="font-size:18px;color:var(--acc-teal);">add</span>Ajouter un compte</button>' +
        '</div>';

      // mouvements ponctuels avec compte visé
      const mouvHTML =
        '<div style="width:100%;display:flex;flex-direction:column;gap:10px;">' +
          '<div style="display:flex;align-items:center;gap:11px;flex-wrap:wrap;">' +
            '<span class="mono" style="font-size:11px;letter-spacing:1px;color:var(--ink2);">MOUVEMENTS PONCTUELS</span>' +
            '<span style="font-size:12.5px;color:var(--ink2);">primes, héritage, gros achat — repérés en pointillés. Chaque mouvement vise un <b>compte</b> : le dépôt l\'alimente, le retrait y est prélevé.</span>' +
          '</div>' +
          em.mouvements.map((mv, i) =>
            '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 13px;border-radius:14px;background:var(--soft);">' +
              '<button class="seg" data-emtype="' + i + '" style="min-height:34px;display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;font-size:12.5px;font-weight:600;background:' + (mv.type === 'retrait' ? 'rgba(196,69,59,.16)' : 'rgba(52,211,153,.18)') + ';color:' + (mv.type === 'retrait' ? 'var(--acc-red)' : 'var(--acc-green)') + ';">' +
                '<span class="ic" style="font-size:15px;">' + (mv.type === 'retrait' ? 'arrow_downward' : 'arrow_upward') + '</span>' + (mv.type === 'retrait' ? 'Retrait' : 'Dépôt') + '</button>' +
              '<input data-emf="' + i + '|label" value="' + mv.label + '" aria-label="Libellé du mouvement" style="flex:1;min-width:120px;height:36px;padding:8px 11px;border-radius:10px;border:1.5px solid var(--line);background:var(--field);color:var(--ink);font-family:Fredoka,sans-serif;font-size:13.5px;">' +
              '<input data-emf="' + i + '|d" type="month" value="' + mv.d + '" aria-label="Date du mouvement" class="sel" style="height:36px;">' +
              '<input data-emf="' + i + '|a" class="fld" inputmode="decimal" value="' + mv.a + '" aria-label="Montant du mouvement" style="width:88px;height:36px;"><span class="mono" style="font-size:12.5px;color:var(--ink2);">€</span>' +
              '<select data-emc="' + i + '" class="sel" aria-label="Compte visé" style="height:36px;font-size:12.5px;">' +
                em.comptes.map((c, ci) => '<option value="' + ci + '"' + (+mv.c === ci ? ' selected' : '') + '>' + (mv.type === 'retrait' ? 'Depuis ' : 'Vers ') + (c.nom || ('Compte ' + (ci + 1))) + '</option>').join('') +
              '</select>' +
              '<button class="acc" data-emdel="' + i + '" aria-label="Supprimer ' + mv.label + '" style="width:34px;height:34px;flex:none;border-radius:10px;display:flex;align-items:center;justify-content:center;color:var(--ink2);"><span class="ic" style="font-size:17px;">delete</span></button>' +
            '</div>').join('') +
          '<button id="emAdd" class="acc" style="align-self:flex-start;display:inline-flex;align-items:center;gap:7px;padding:10px 16px;min-height:44px;border-radius:12px;background:var(--surface);font-size:13.5px;font-weight:600;box-shadow:0 10px 22px -14px rgba(90,60,120,.5);"><span class="ic" style="font-size:18px;color:var(--acc-amber);">add</span>Ajouter un mouvement</button>' +
        '</div>';

      const graphOpts = { marks: em.mouvements, showVerse: true, labelOf: s => s.nom, verseFrom: totalPts };
      const tableOpts = { labelOf: s => s.nom, versePts: totalPts };

      box.innerHTML = card('Épargne multi-comptes', 'account_balance_wallet', GRAD,
        lbl('Durée', fld('emAn', em.an, 70), 'ans'),
        comptesHTML +
        (series.length
          ? graphHTML(drawn, { an: em.an }, graphOpts) + tableHTML(drawn, { an: em.an }, tableOpts)
          : res('Ajoute au moins un compte pour voir la projection.', 'var(--soft)')) +
        mouvHTML +
        (series.length
          ? res('Au bout de <b>' + em.an + ' ans</b>, ton épargne totale serait de <b class="num" style="font-size:20px;">' + nf(last.v) + ' €</b> sur <b>' + em.comptes.length + '</b> compte' + (em.comptes.length > 1 ? 's' : '') + ' — dont <b class="mono">' + nf(last.v - last.verse) + ' €</b> d\'intérêts.', SOFT)
          : ''));

      // ── événements ──
      const anEl = $('emAn');
      if (anEl) anEl.addEventListener('input', () => { em.an = parseFloat(anEl.value) || 0; keepFocus(renderEpargneMulti); });

      box.querySelectorAll('input[data-cf]').forEach(el => el.addEventListener('input', () => {
        const [ci, k] = el.getAttribute('data-cf').split('|');
        em.comptes[+ci][k] = k === 'nom' ? el.value : (parseFloat(el.value) || 0);
        keepFocus(renderEpargneMulti);
      }));
      box.querySelectorAll('select[data-ctx]').forEach(el => el.addEventListener('change', () => {
        em.comptes[+el.getAttribute('data-ctx')].tx = parseFloat(el.value) || 0;
        renderEpargneMulti();
      }));
      box.querySelectorAll('[data-cdel]').forEach(b => b.addEventListener('click', () => {
        const ci = parseInt(b.getAttribute('data-cdel'), 10);
        em.comptes.splice(ci, 1);
        // réaligner les mouvements qui visaient un compte supprimé ou décalé
        em.mouvements.forEach(mv => { if (+mv.c === ci) mv.c = 0; else if (+mv.c > ci) mv.c = +mv.c - 1; });
        renderEpargneMulti();
      }));
      const cAdd = $('cAdd');
      if (cAdd) cAdd.addEventListener('click', () => {
        em.comptes.push({ nom:'Nouveau compte', tx:2, cap:1000, vers:50 });
        renderEpargneMulti();
      });

      box.querySelectorAll('input[data-emf]').forEach(el => el.addEventListener('input', () => {
        const [i, k] = el.getAttribute('data-emf').split('|');
        em.mouvements[+i][k] = k === 'a' ? (parseFloat(el.value) || 0) : el.value;
        keepFocus(renderEpargneMulti);
      }));
      box.querySelectorAll('select[data-emc]').forEach(el => el.addEventListener('change', () => {
        em.mouvements[+el.getAttribute('data-emc')].c = parseInt(el.value, 10) || 0;
        renderEpargneMulti();
      }));
      box.querySelectorAll('[data-emtype]').forEach(b => b.addEventListener('click', () => {
        const i = parseInt(b.getAttribute('data-emtype'), 10);
        em.mouvements[i].type = em.mouvements[i].type === 'depot' ? 'retrait' : 'depot';
        renderEpargneMulti();
      }));
      box.querySelectorAll('[data-emdel]').forEach(b => b.addEventListener('click', () => {
        em.mouvements.splice(parseInt(b.getAttribute('data-emdel'), 10), 1);
        renderEpargneMulti();
      }));
      const emAdd = $('emAdd');
      if (emAdd) emAdd.addEventListener('click', () => {
        em.mouvements.push({ d:'2027-01', label:'Nouveau mouvement', a:1000, type:'depot', c:0 });
        renderEpargneMulti();
      });

      bindGraphHover(drawn, { an: em.an }, (s) => s.nom, (s, i) => s.col || SCOL[i % 4]);
    };

    const cats = () => st.model === 'custom' ? st.custom : (M[st.model] || M['503020']);
    const spendCats = () => cats().filter(c => (SAVE_KEYS[st.model] || ['epargne']).indexOf(c.k) === -1);

    // ── Pratique : suivi des dépenses réelles ──
    // période comptable : le mois démarre au jour choisi
    const moisDe = (iso) => {
      const [y,m,d] = iso.split('-').map(Number);
      const dt = new Date(y, m - 1, d || 1);
      if ((d || 1) < st.startDay) dt.setMonth(dt.getMonth() - 1);
      return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2,'0');
    };
    const moisLabel = (ym) => {
      const N = ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
      const [y,m] = ym.split('-').map(Number);
      return N[m-1] + ' ' + String(y).slice(2);
    };
    const deMois = (lbl) => (/^[aeiouâàéèêîôûAEIOU]/.test(lbl) ? "d'" : 'de ') + lbl;
    const moisDispo = () => {
      const s = {};
      st.depenses.forEach(d => { s[moisDe(d.d)] = 1; });
      const l = Object.keys(s).sort();
      return l.length ? l : [moisDe('2026-08-06')];
    };

    const renderDepenses = () => {
      const box = $('pratTool');
      if (!box) return;
      const list = spendCats();                       // les enveloppes de la règle
      const keys = list.map(c => c.k);
      const postes = st.postes;                       // les postes de dépense
      const posteOf = (k) => postes.filter(p => p.k === k)[0];
      const envOf = (k) => { const p = posteOf(k); return p && keys.indexOf(p.env) > -1 ? p.env : null; };
      const colOf = (k) => { const e = envOf(k); const c = list.filter(x => x.k === e)[0]; return c ? c.g : 'var(--line)'; };
      const mois = moisDispo();
      if (mois.indexOf(st.moisActif) === -1) st.moisActif = mois[mois.length - 1];
      const vue = st.periode === 'mois' ? st.depenses.filter(d => moisDe(d.d) === st.moisActif) : st.depenses;
      const reel = list.map(c => vue.filter(d => envOf(d.cat) === c.k).reduce((s,d) => s + d.a, 0));
      const orphans = vue.filter(d => !envOf(d.cat));
      const orphanSum = orphans.reduce((s,d) => s + d.a, 0);
      const totalReel = reel.reduce((a,b) => a + b, 0) + orphanSum;
      const totalPrevu = list.reduce((s,c) => s + (st.flux[c.k]||0), 0);

      const compare = list.map((c,i) => {
        const prevu = st.flux[c.k] || 0, r = reel[i];
        if (!prevu && !r) return '';
        const detail = postes.filter(p => p.env === c.k).map(p => {
          const v = vue.filter(d => d.cat === p.k).reduce((s,d) => s + d.a, 0);
          return v ? '<span class="mono" style="font-size:11.5px;color:var(--ink2);">' + p.n + ' ' + eur(v) + '</span>' : '';
        }).filter(Boolean).join('<span style="color:var(--ink2);opacity:.5;">·</span>');
        const pctR = prevu ? Math.min(140, Math.round(r / prevu * 100)) : 0;
        const over = prevu && r > prevu;
        return '<div style="display:flex;align-items:center;gap:13px;flex-wrap:wrap;">' +
          '<span style="width:150px;flex:none;font-size:14px;font-weight:600;display:flex;align-items:center;gap:7px;">' +
            '<span style="width:11px;height:11px;flex:none;border-radius:4px;background:' + c.g + ';"></span>' +
            '<span style="display:flex;flex-direction:column;line-height:1.25;"><span>' + c.label + '</span>' +
            '<span class="mono" style="font-size:11.5px;font-weight:400;color:var(--ink2);">' + eur(r) + ' / ' + eur(prevu) + '</span></span></span>' +
          '<div style="flex:1;min-width:150px;height:28px;border-radius:10px;background:var(--line);position:relative;overflow:hidden;">' +
            '<div style="width:' + Math.min(100, pctR) + '%;height:100%;background:' + (over ? 'linear-gradient(135deg,#FF7A45,#EC4899)' : c.g) + ';transition:width .35s;"></div>' +
            '<div style="position:absolute;left:100%;top:0;bottom:0;width:3px;transform:translateX(-3px);background:var(--ink);opacity:.45;"></div>' +
          '</div>' +
          '<span class="mono" style="width:78px;flex:none;text-align:right;font-size:12.5px;color:' + (over ? 'var(--acc-red)' : 'var(--acc-green)') + ';font-weight:700;">' +
            (prevu ? (over ? '+' + eur(r - prevu) : eur(prevu - r) + ' restants') : '—') + '</span>' +
          (detail ? '<div style="width:100%;display:flex;gap:9px;flex-wrap:wrap;padding-left:150px;">' + detail + '</div>' : '') +
        '</div>';
      }).filter(Boolean).join('');

      const orphanRow = orphans.length ? '<div style="display:flex;align-items:center;gap:13px;flex-wrap:wrap;padding:12px 15px;border-radius:14px;background:rgba(251,191,36,.14);border:1.5px solid rgba(251,191,36,.35);">' +
        '<span class="ic" style="font-size:19px;color:var(--acc-amber);flex:none;">help</span>' +
        '<span style="flex:1;min-width:220px;font-size:13.5px;"><b>' + orphans.length + ' dépense' + (orphans.length>1?'s':'') + '</b> (' + eur(orphanSum) + ') ne correspond' + (orphans.length>1?'ent':'') + ' à aucune catégorie de ta règle actuelle — reclasse-les ci-dessous.</span></div>' : '';
      const opts = list.map(c =>
        '<optgroup label="' + c.label + '">' +
        postes.filter(p => p.env === c.k).map(p => '<option value="' + p.k + '">' + p.n + '</option>').join('') +
        '</optgroup>').join('');

      // vue multi-mois : barres empilées par catégorie
      const totMois = mois.map(ym => {
        const dm = st.depenses.filter(d => moisDe(d.d) === ym);
        return { ym, parts: list.map(c => dm.filter(d => envOf(d.cat) === c.k).reduce((s,d) => s + d.a, 0)) };
      });
      const maxMois = Math.max.apply(null, totMois.map(m => m.parts.reduce((a,b)=>a+b,0)).concat([1]));
      const multi =
        '<div class="card" style="display:flex;flex-direction:column;gap:18px;">' +
          '<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;justify-content:space-between;">' +
            '<span class="mono" style="font-size:11px;font-weight:700;letter-spacing:1.2px;color:var(--acc-violet);">MES MOIS</span>' +
            '<div style="display:inline-flex;gap:3px;background:var(--soft);border-radius:999px;padding:4px;">' +
              '<button class="seg" data-per="mois" style="min-height:36px;padding:7px 15px;border-radius:999px;font-size:13px;font-weight:600;' + (st.periode==='mois'?'background:linear-gradient(135deg,#FBBF24,#FF7A45);color:#fff;':'background:transparent;color:var(--ink2);') + '">Un mois</button>' +
              '<button class="seg" data-per="tout" style="min-height:36px;padding:7px 15px;border-radius:999px;font-size:13px;font-weight:600;' + (st.periode==='tout'?'background:linear-gradient(135deg,#FBBF24,#FF7A45);color:#fff;':'background:transparent;color:var(--ink2);') + '">Tout</button>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;align-items:flex-end;gap:14px;height:178px;overflow-x:auto;padding-bottom:4px;">' +
            totMois.map(m => {
              const tot = m.parts.reduce((a,b)=>a+b,0);
              const h = Math.round(tot / maxMois * 110);
              const actif = st.periode === 'mois' && m.ym === st.moisActif;
              const detailTip = moisLabel(m.ym) + ' — ' + eur(tot) + '\n' +
                m.parts.map((v,i) => v ? '· ' + list[i].label + ' : ' + eur(v) : '').filter(Boolean).join('\n');
              return '<button class="seg" data-mois="' + m.ym + '" title="' + detailTip.replace(/"/g,'&quot;') + '" style="flex:none;width:64px;display:flex;flex-direction:column;align-items:center;gap:6px;background:none;padding:4px;border-radius:12px;' + (actif ? 'box-shadow:0 0 0 2.5px var(--acc-amber);' : '') + '">' +
                '<span class="mono" style="font-size:11px;color:var(--ink2);">' + (tot ? Math.round(tot) : '') + '</span>' +
                '<span style="width:100%;height:' + Math.max(h,3) + 'px;display:flex;flex-direction:column-reverse;border-radius:8px;overflow:hidden;background:var(--line);">' +
                  m.parts.map((v,i) => v ? '<span title="' + list[i].label + ' : ' + eur(v) + '" style="height:' + (v/tot*100) + '%;background:' + list[i].g + ';"></span>' : '').join('') +
                '</span>' +
                '<span class="mono" style="font-size:11px;' + (actif ? 'color:var(--ink);font-weight:700;' : 'color:var(--ink2);') + '">' + moisLabel(m.ym) + '</span>' +
              '</button>';
            }).join('') +
          '</div>' +
          '<div style="display:flex;gap:12px;flex-wrap:wrap;font-size:12.5px;color:var(--ink2);">' +
            list.map(c => '<span style="display:inline-flex;align-items:center;gap:6px;"><span style="width:10px;height:10px;border-radius:3px;background:' + c.g + ';"></span>' + c.label + '</span>').join('') +
          '</div>' +
        '</div>';

      const params =
        '<div class="card" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:16px 24px;">' +
          '<span style="width:38px;height:38px;flex:none;border-radius:13px;background:var(--soft);display:flex;align-items:center;justify-content:center;color:var(--ink2);"><span class="ic" style="font-size:20px;">tune</span></span>' +
          '<span class="mono" style="font-size:11px;letter-spacing:1px;color:var(--ink2);">RÉGLAGES</span>' +
          '<label for="startDay" style="font-size:13.5px;color:var(--ink2);">Mon mois budgétaire commence le</label>' +
          '<input id="startDay" class="fld" inputmode="numeric" value="' + st.startDay + '" style="width:64px;">' +
          '<span style="font-size:13.5px;color:var(--ink2);">du mois</span>' +
          '<span style="flex:1;min-width:180px;font-size:12.5px;color:var(--ink2);">Si tu es payée le 25, indique 25 : tes dépenses se regrouperont sur ta vraie période.</span>' +
        '</div>';

      const mtCharge = (c) => (c.over && c.over[st.moisActif] !== undefined) ? c.over[st.moisActif] : c.a;
      const estPaye = (c) => !!(c.paid && c.paid[st.moisActif]);
      const nbPaye = st.chargesAttendues.filter(estPaye).length;
      const chAttendues = st.chargesAttendues.reduce((s,c) => s + mtCharge(c), 0);
      const chPayees = st.chargesAttendues.filter(estPaye).reduce((s,c) => s + mtCharge(c), 0);
      const charges =
        '<div class="card" style="display:flex;flex-direction:column;gap:16px;">' +
          '<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;justify-content:space-between;">' +
            '<span class="mono" style="font-size:11px;font-weight:700;letter-spacing:1.2px;color:var(--acc-teal);">MES CHARGES FIXES — ' + moisLabel(st.moisActif).toUpperCase() + '</span>' +
            '<span class="mono" style="font-size:12.5px;color:var(--ink2);">' + nbPaye + '/' + st.chargesAttendues.length + ' validées · ' + eur(chPayees) + ' / ' + eur(chAttendues) + '</span>' +
          '</div>' +
          '<p style="margin:0;font-size:13.5px;color:var(--ink2);">La liste est pré-remplie et revient chaque mois, mais les <b>cases se valident mois par mois</b> — coche-les quand elles passent sur ton compte. Les montants sont modifiables : électricité, eau et assurances varient.</p>' +
          (nbPaye < st.chargesAttendues.length
            ? '<button id="chgAll" class="seg" style="align-self:flex-start;min-height:40px;display:inline-flex;align-items:center;gap:7px;padding:9px 16px;border-radius:12px;background:var(--surface);color:var(--ink);font-size:13px;font-weight:600;box-shadow:0 10px 22px -14px rgba(90,60,120,.5);"><span class="ic" style="font-size:17px;color:var(--acc-teal);">done_all</span>Tout valider pour ' + moisLabel(st.moisActif) + '</button>'
            : '<div style="display:flex;align-items:center;gap:9px;font-size:13px;color:var(--acc-green);"><span class="ic" style="font-size:18px;">check_circle</span>Toutes tes charges de ' + moisLabel(st.moisActif) + ' sont validées.</div>') +
          '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:10px;">' +
            st.chargesAttendues.map((c,i) => {
              const p = posteOf(c.poste);
              const exceptionnel = c.over && c.over[st.moisActif] !== undefined;
              const paye = estPaye(c);
              return '<div style="display:flex;flex-direction:column;gap:8px;padding:10px 14px;border-radius:14px;background:var(--soft);' + (paye ? '' : 'opacity:.7;') + '">' +
                '<div style="display:flex;align-items:center;gap:11px;">' +
                  '<button class="seg" data-chg="' + i + '" role="checkbox" aria-checked="' + (paye?'true':'false') + '" aria-label="' + c.label + ' débité" style="width:26px;height:26px;flex:none;border-radius:8px;display:flex;align-items:center;justify-content:center;' + (paye ? 'background:' + colOf(c.poste) + ';color:#fff;' : 'background:var(--field);border:1.5px solid var(--line);color:transparent;') + '"><span class="ic" style="font-size:16px;">check</span></button>' +
                  '<span style="flex:1;min-width:76px;font-size:14px;font-weight:600;color:var(--ink);">' + c.label +
                    '<span style="display:block;font-size:11.5px;font-weight:400;color:var(--ink2);">' + (p ? p.n : '') + '</span></span>' +
                  '<input data-chga="' + i + '" id="chga' + i + '" class="fld" inputmode="decimal" value="' + Math.round(mtCharge(c)) + '" aria-label="Montant de ' + c.label + '" style="width:82px;height:34px;font-size:13px;' + (exceptionnel ? 'border-color:var(--acc-amber);' : '') + '">' +
                  '<span class="mono" style="font-size:12.5px;color:var(--ink2);">€</span>' +
                '</div>' +
                (exceptionnel
                  ? '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:12px;color:var(--acc-amber);">' +
                      '<span class="ic" style="font-size:15px;">event_repeat</span>' +
                      '<span style="flex:1;min-width:110px;">Modifié pour ce mois — d\'habitude ' + eur(c.a) + '</span>' +
                      '<button class="seg" data-chgall="' + i + '" style="min-height:30px;padding:5px 11px;border-radius:999px;font-size:11.5px;font-weight:600;background:var(--surface);color:var(--ink);">Appliquer à tous les mois</button>' +
                      '<button class="seg" data-chgundo="' + i + '" aria-label="Annuler la modification" style="min-height:30px;width:30px;border-radius:999px;background:var(--surface);color:var(--ink2);"><span class="ic" style="font-size:15px;">undo</span></button>' +
                    '</div>'
                  : '') +
              '</div>';
            }).join('') +
          '</div>' +
        '</div>';

      box.innerHTML = params + multi + charges +
        '<div class="card" style="display:flex;flex-direction:column;gap:18px;">' +
          '<div style="display:flex;align-items:center;gap:11px;">' +
            '<span class="mono" style="font-size:11px;font-weight:700;letter-spacing:1.2px;color:var(--acc-amber);">AJOUTER UNE DÉPENSE</span>' +
            '<div style="flex:1;height:2px;border-radius:2px;background:linear-gradient(90deg,rgba(199,127,19,.3),transparent);"></div>' +
          '</div>' +
          '<div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;">' +
            '<div style="display:flex;flex-direction:column;gap:6px;flex:1;min-width:180px;"><label for="depLabel" style="font-size:13px;font-weight:600;">Libellé</label>' +
              '<input id="depLabel" placeholder="Courses, essence…" style="height:40px;width:100%;padding:10px 13px;border-radius:12px;border:1.5px solid var(--line);background:var(--field);color:var(--ink);font-family:Fredoka,sans-serif;font-size:14px;"></div>' +
            '<div style="display:flex;flex-direction:column;gap:6px;"><label for="depCat" style="font-size:13px;font-weight:600;">Catégorie</label>' +
              '<select id="depCat" class="sel">' + opts + '</select></div>' +
            '<div style="display:flex;flex-direction:column;gap:6px;"><label for="depDate" style="font-size:13px;font-weight:600;">Date</label>' +
              '<input id="depDate" type="date" value="2026-08-06" class="sel"></div>' +
            '<div style="display:flex;flex-direction:column;gap:6px;"><label for="depAmt" style="font-size:13px;font-weight:600;">Montant</label>' +
              '<span style="display:flex;align-items:center;gap:7px;"><input id="depAmt" class="fld" inputmode="decimal" placeholder="0"><span class="mono" style="color:var(--ink2);">€</span></span></div>' +
            '<button id="depAdd" style="min-height:44px;display:inline-flex;align-items:center;gap:7px;padding:12px 18px;border-radius:13px;background:linear-gradient(135deg,#FBBF24,#FF7A45);color:#fff;font-weight:600;font-size:14px;box-shadow:0 13px 26px -14px rgba(255,140,60,.8);"><span class="ic" style="font-size:18px;">add</span>Ajouter</button>' +
          '</div>' +
        '</div>' +

        '<div class="card" style="display:flex;flex-direction:column;gap:18px;">' +
          '<div style="display:flex;align-items:center;gap:11px;">' +
            '<span class="mono" style="font-size:11px;font-weight:700;letter-spacing:1.2px;color:var(--acc-violet);">RÉEL FACE AU PLAN</span>' +
            '<div style="flex:1;height:2px;border-radius:2px;background:linear-gradient(90deg,rgba(91,63,224,.3),transparent);"></div>' +
          '</div>' +
          '<p style="margin:0;font-size:14px;color:var(--ink2);">Ce que tu as réellement dépensé ce mois-ci, comparé à ce que <b>Mon budget type</b> prévoyait. Le trait vertical marque ton budget ; au-delà, la barre passe en orange.</p>' +
          compare + orphanRow +
          '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:15px 18px;border-radius:17px;background:' + (totalReel > totalPrevu ? 'rgba(196,69,59,.13)' : 'linear-gradient(135deg,rgba(52,211,153,.16),rgba(34,180,196,.16))') + ';font-size:14px;">' +
            '<span class="ic" style="font-size:22px;color:' + (totalReel > totalPrevu ? 'var(--acc-red)' : 'var(--acc-green)') + ';flex:none;">' + (totalReel > totalPrevu ? 'warning' : 'check_circle') + '</span>' +
            '<span style="flex:1;min-width:230px;">Tu as dépensé <b class="mono">' + eur(totalReel) + '</b> sur <b class="mono">' + eur(totalPrevu) + '</b> prévus' +
              (totalReel > totalPrevu ? ' — <b>' + eur(totalReel - totalPrevu) + ' de trop</b>, ton épargne du mois est menacée.' : '. Ton épargne du mois est préservée.') +
              (orphanSum ? '<span style="display:block;font-size:12.5px;color:var(--ink2);margin-top:4px;">Total toutes dépenses confondues : ' + eur(totalReel - orphanSum) + ' classées + <b>' + eur(orphanSum) + ' non classées</b>.</span>' : '') + '</span>' +
          '</div>' +
        '</div>' +

        '<div class="card" style="display:flex;flex-direction:column;gap:14px;">' +
          '<h3>' + (st.periode === 'mois' ? 'Dépenses ' + deMois(moisLabel(st.moisActif)) : 'Toutes mes dépenses') + '</h3>' +
          (vue.length ? '<div style="display:flex;flex-direction:column;gap:9px;">' +
            vue.map((d) => {
              const i = st.depenses.indexOf(d);
              const p = posteOf(d.cat);
              const c = envOf(d.cat) ? { label:p.n, g:colOf(d.cat) } : null;
              return '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:11px 15px;border-radius:14px;background:var(--soft);">' +
                '<span style="width:11px;height:11px;flex:none;border-radius:4px;background:' + (c ? c.g : 'var(--line)') + ';"></span>' +
                '<span style="flex:1;min-width:150px;font-size:14.5px;">' + d.label + '</span>' +
                (c
                  ? '<span class="mono" style="font-size:12.5px;color:var(--ink2);">' + c.label + '</span>'
                  : '<select data-recat="' + i + '" aria-label="Classer ' + d.label + '" class="sel" style="height:34px;font-size:12.5px;border-color:var(--acc-amber);color:var(--acc-amber);"><option value="">à classer…</option>' +
                    opts + '</select>') +
                '<span class="mono" style="font-size:12.5px;color:var(--ink2);">' + d.d.split('-').reverse().slice(0,2).join('/') + '</span>' +
                '<b class="mono" style="min-width:74px;text-align:right;">' + eur(d.a) + '</b>' +
                '<button class="acc" data-del="' + i + '" aria-label="Supprimer ' + d.label + '" style="width:36px;height:36px;flex:none;border-radius:10px;display:flex;align-items:center;justify-content:center;color:var(--ink2);"><span class="ic" style="font-size:18px;">delete</span></button>' +
              '</div>';
            }).join('') + '</div>'
            : '<div style="padding:30px;border:2px dashed var(--line);border-radius:18px;text-align:center;color:var(--ink2);"><span class="ic" style="font-size:32px;">receipt_long</span><div style="margin-top:8px;font-weight:600;">Aucune dépense enregistrée</div><div style="font-size:13px;">Ajoute-en une ci-dessus pour commencer.</div></div>') +
        '</div>';

      box.querySelectorAll('[data-chg]').forEach(b => b.addEventListener('click', () => {
        const i = parseInt(b.getAttribute('data-chg'), 10), c = st.chargesAttendues[i];
        c.paid = c.paid || {};
        const ym = st.moisActif, tag = 'charge:' + i + ':' + ym;
        c.paid[ym] = !c.paid[ym];
        if (c.paid[ym]) st.depenses.unshift({ d: ym + '-' + String(Math.min(28, st.startDay)).padStart(2,'0'), label:c.label, cat:c.poste, a:mtCharge(c), src:tag });
        else st.depenses = st.depenses.filter(d => d.src !== tag);
        renderDepenses();
      }));
      const chgAll = $('chgAll');
      if (chgAll) chgAll.addEventListener('click', () => {
        const ym = st.moisActif;
        st.chargesAttendues.forEach((c,i) => {
          c.paid = c.paid || {};
          if (!c.paid[ym]) {
            c.paid[ym] = true;
            st.depenses.unshift({ d: ym + '-' + String(Math.min(28, st.startDay)).padStart(2,'0'), label:c.label, cat:c.poste, a:mtCharge(c), src:'charge:' + i + ':' + ym });
          }
        });
        renderDepenses();
      });
      box.querySelectorAll('[data-scope]').forEach(b => b.addEventListener('click', () => {
        st.chargeScope = b.getAttribute('data-scope'); renderDepenses();
      }));
      box.querySelectorAll('[data-chga]').forEach(el => el.addEventListener('input', () => {
        const i = parseInt(el.getAttribute('data-chga'), 10), c = st.chargesAttendues[i];
        const v = parseFloat(el.value) || 0;
        if (st.chargeScope === 'mois') { c.over = c.over || {}; c.over[st.moisActif] = v; }
        else { c.a = v; if (c.over) delete c.over[st.moisActif]; }
        const dep = st.depenses.filter(x => x.src === 'charge:' + i + ':' + st.moisActif)[0];
        if (dep) dep.a = v;
        keepFocus(renderDepenses);
      }));
      box.querySelectorAll('[data-per]').forEach(b => b.addEventListener('click', () => {
        st.periode = b.getAttribute('data-per'); renderDepenses();
      }));
      box.querySelectorAll('[data-mois]').forEach(b => b.addEventListener('click', () => {
        st.moisActif = b.getAttribute('data-mois'); st.periode = 'mois'; renderDepenses();
      }));
      const sd = $('startDay');
      if (sd) sd.addEventListener('input', () => {
        st.startDay = Math.min(28, Math.max(1, parseInt(sd.value, 10) || 1));
        keepFocus(renderDepenses);
      });
      const add = $('depAdd');
      if (add) add.addEventListener('click', () => {
        const a = parseFloat(($('depAmt')||{}).value) || 0;
        if (!a) return;
        st.depenses.unshift({
          d: ($('depDate')||{}).value || '2026-08-06',
          label: (($('depLabel')||{}).value || '').trim() || 'Dépense',
          cat: ($('depCat')||{}).value || (postes[0] && postes[0].k),
          a
        });
        renderPratique();
      });
      box.querySelectorAll('[data-recat]').forEach(sel => sel.addEventListener('change', () => {
        if (!sel.value) return;
        st.depenses[parseInt(sel.getAttribute('data-recat'), 10)].cat = sel.value;
        renderDepenses();
      }));
      box.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => {
        st.depenses.splice(parseInt(b.getAttribute('data-del'), 10), 1);
        renderPratique();
      }));
    };
    const seedFlux = () => { st.flux = {}; cats().forEach(c => { st.flux[c.k] = Math.round(st.income * c.pct / 100); }); };

    // ── recommandation selon revenus & charges ──
    const renderReco = () => {
      const box = $('reco');
      const reste = Math.max(0, st.income - st.charges);
      const ratio = st.income ? Math.round(st.charges / st.income * 100) : 0;
      const chgEl = $('charges');
      if (chgEl && document.activeElement !== chgEl) chgEl.value = Math.round(st.charges);
      if ($('resteVivre')) $('resteVivre').textContent = eur(reste);
      if ($('chargesPct')) $('chargesPct').textContent = 'tes charges pèsent ' + ratio + ' % de tes revenus';
      if (!box) return;

      let key, titre, txt, col;
      if (ratio > 60) {
        key = 'sansratio'; col = 'var(--acc-red)';
        titre = 'Les ratios fixes ne tiendront pas';
        txt = 'Avec ' + ratio + ' % de charges, aucune règle en pourcentage n\'est réaliste. Pars de tes dépenses réelles avec une méthode <b>sans ratios</b>, et mets de côté ce que tu peux — même 5 %, c\'est une victoire.';
      } else if (ratio > 45) {
        key = '503020'; col = 'var(--acc-amber)';
        titre = 'Le 50/30/20, en version resserrée';
        txt = 'Tes charges à ' + ratio + ' % dépassent un peu la moitié : garde la structure, mais attends-toi à rogner sur les envies plutôt que sur l\'épargne. Vise 10 à 15 % de côté pour commencer.';
      } else if (ratio > 32) {
        key = '503020'; col = 'var(--acc-green)';
        titre = 'Le 50/30/20 te va bien';
        txt = 'Avec ' + ratio + ' % de charges, tu es dans la zone où cette règle fonctionne telle quelle. C\'est le meilleur point de départ.';
      } else {
        key = 'pots'; col = 'var(--acc-violet)';
        titre = 'Tu peux viser plus haut que 20 %';
        txt = 'Tes charges ne pèsent que ' + ratio + ' % : le coût des besoins de base plafonne, pas tes revenus. La méthode des <b>6 comptes</b> t\'aide à placer 30 à 40 % au lieu de laisser le train de vie absorber la marge.';
      }
      const already = st.model === key;
      box.innerHTML = '<div style="display:flex;align-items:flex-start;gap:14px;flex-wrap:wrap;padding:17px 20px;border-radius:19px;background:var(--soft);border-left:5px solid ' + col + ';">' +
        '<span class="ic" style="font-size:24px;color:' + col + ';flex:none;">tips_and_updates</span>' +
        '<div style="flex:1;min-width:250px;"><b style="font-size:15px;">' + titre + '</b>' +
        '<div style="font-size:13.5px;color:var(--ink2);margin-top:5px;line-height:1.55;">' + txt + '</div></div>' +
        (already ? '<span style="align-self:center;font-size:13px;font-weight:600;color:' + col + ';display:inline-flex;align-items:center;gap:6px;"><span class="ic" style="font-size:17px;">check_circle</span>Règle active</span>'
                 : '<button id="applyReco" class="seg" style="align-self:center;min-height:44px;padding:11px 18px;border-radius:13px;background:var(--surface);color:var(--ink);font-weight:600;font-size:13.5px;box-shadow:0 12px 24px -14px rgba(90,60,120,.5);">Appliquer</button>') +
        '</div>';
      const ap = $('applyReco');
      if (ap) ap.addEventListener('click', () => { setModel(key); });
    };

    const setModel = (m) => {
      st.model = m;
      document.querySelectorAll('#modelSeg .seg').forEach(o => {
        const on = o.getAttribute('data-model') === m;
        o.style.background = on ? 'linear-gradient(135deg,#FBBF24,#FF7A45)' : 'transparent';
        o.style.color = on ? '#fff' : 'var(--ink2)';
      });
      seedFlux(); renderFlux();
    };

    const renderMethodes = () => {
      const box = $('methodView');
      if (!box) return;
      box.innerHTML = METHODES.map(m =>
        '<div style="display:flex;align-items:flex-start;gap:15px;padding:18px 20px;border-radius:19px;background:var(--soft);">' +
          '<span style="width:46px;height:46px;flex:none;border-radius:15px;background:' + m.g + ';display:flex;align-items:center;justify-content:center;color:#fff;"><span class="ic" style="font-size:25px;">' + m.ic + '</span></span>' +
          '<div style="flex:1;min-width:220px;"><b style="font-size:16px;">' + m.n + '</b>' +
            '<div style="font-size:13.5px;color:var(--ink2);margin-top:5px;line-height:1.55;">' + m.d + '</div>' +
            '<div class="mono" style="font-size:12px;color:var(--ink2);margin-top:7px;">' + m.p + '</div></div>' +
        '</div>').join('') +
        '<label style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:16px 20px;border-radius:19px;background:linear-gradient(135deg,rgba(52,211,153,.16),rgba(34,180,196,.16));border:1.5px solid rgba(52,211,153,.32);font-size:14.5px;font-weight:600;">' +
          '<span class="ic" style="font-size:24px;color:var(--acc-green);">savings</span>' +
          '<span style="flex:1;min-width:200px;">Ce que je peux mettre de côté ce mois-ci</span>' +
          '<input id="freeSave" class="fld" inputmode="decimal" value="' + Math.round(st.saveMonthly) + '" style="width:110px;"><span class="mono">€</span>' +
        '</label>';
      const fs = $('freeSave');
      if (fs) fs.addEventListener('input', () => {
        st.saveMonthly = parseFloat(fs.value) || 0;
        if ($('saveAmount')) $('saveAmount').textContent = eur(st.saveMonthly);
        if ($('saveYear')) $('saveYear').textContent = eur(st.saveMonthly * 12);
        if ($('echoSave')) $('echoSave').textContent = eur(st.saveMonthly);
        if ($('stratSave')) $('stratSave').textContent = eur(st.saveMonthly);
        renderStrats();
      });
    };

    const renderFlux = () => {
      const bar = $('fluxBar'), rows = $('fluxRows');
      if (!bar || !rows) return;
      const ratioMode = st.model !== 'sansratio';
      const rv = $('ratioView'), mv = $('methodView'), ri = $('ruleIntro');
      if (rv) rv.style.display = ratioMode ? 'flex' : 'none';
      if (mv) mv.style.display = ratioMode ? 'none' : 'flex';
      if (ri) ri.innerHTML = RULE_INTRO[st.model] || '';
      renderReco();
      if (!ratioMode) { renderMethodes(); renderStrats(); return; }

      const list = cats();
      const total = list.reduce((s,c) => s + (st.flux[c.k]||0), 0) || 1;
      bar.innerHTML = '';
      rows.innerHTML = '';
      list.forEach((c,ci) => {
        const v = st.flux[c.k] || 0;
        const pct = st.income ? Math.round(v / st.income * 100) : 0;
        const seg = document.createElement('div');
        const wPct = st.income ? Math.min(100, (v / st.income) * 100) : 0;
        // sous ~13 % de largeur, le libellé ne tient pas : on ne garde que le %, le nom passe en légende
        const etroit = wPct < 13;
        seg.title = c.label + ' — ' + eur(v) + ' · ' + pct + ' %';
        seg.style.cssText = 'width:' + wPct + '%;flex:none;background:' + c.g + ';display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;overflow:hidden;text-shadow:0 1px 3px rgba(40,20,60,.4);transition:width .35s cubic-bezier(.34,1.3,.5,1);';
        seg.innerHTML = (etroit ? '' : '<span style="font-size:13.5px;font-weight:600;white-space:nowrap;">' + c.label + '</span>') +
          '<span style="font-family:\'Space Mono\',monospace;font-size:12px;">' + pct + ' %</span>';
        bar.appendChild(seg);

        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:14px;flex-wrap:wrap;';
        const isCustom = st.model === 'custom';
        row.innerHTML = '<span style="width:16px;height:16px;flex:none;border-radius:5px;background:' + c.g + ';"></span>';
        const nameCell = document.createElement('span');
        nameCell.style.cssText = 'flex:1;min-width:150px;';
        if (isCustom) {
          const ni = document.createElement('input');
          ni.value = c.label; ni.setAttribute('aria-label','Nom de la catégorie');
          ni.style.cssText = 'width:100%;max-width:210px;padding:8px 11px;border-radius:10px;border:1.5px solid var(--line);background:var(--field);color:var(--ink);font-family:Fredoka,sans-serif;font-size:14.5px;font-weight:600;';
          ni.addEventListener('input', () => { st.custom[ci].label = ni.value; });
          nameCell.appendChild(ni);
        } else {
          nameCell.innerHTML = '<b style="font-size:15px;">' + c.label + '</b> <span style="font-size:13px;color:var(--ink2);">' + c.hint + '</span>';
        }
        row.appendChild(nameCell);
        const pctMode = st.unit === 'pct';
        const other = document.createElement('span');
        other.className = 'mono';
        other.style.cssText = 'font-size:13px;color:var(--ink2);width:76px;text-align:right;';
        other.textContent = pctMode ? eur(v) : pct + ' %';
        row.appendChild(other);
        const inp = document.createElement('input');
        inp.className = 'fld';
        inp.value = pctMode ? pct : Math.round(v);
        inp.setAttribute('inputmode','decimal');
        inp.setAttribute('aria-label', c.label + (pctMode ? ' en pourcentage' : ' en euros'));
        inp.id = 'flux-' + c.k;
        inp.addEventListener('input', () => {
          const n = parseFloat(inp.value) || 0;
          st.flux[c.k] = pctMode ? Math.round(st.income * n / 100) : n;
          keepFocus(renderFlux);
        });
        row.appendChild(inp);
        const e = document.createElement('span'); e.className='mono'; e.textContent = pctMode ? '%' : '€'; e.style.cssText='font-size:13px;color:var(--ink2);width:14px;';
        row.appendChild(e);
        if (isCustom && list.length > 1) {
          const del = document.createElement('button');
          del.className = 'acc';
          del.setAttribute('aria-label','Supprimer ' + c.label);
          del.style.cssText = 'width:38px;height:38px;flex:none;border-radius:11px;display:flex;align-items:center;justify-content:center;color:var(--ink2);';
          del.innerHTML = '<span class="ic" style="font-size:18px;">delete</span>';
          del.addEventListener('click', () => { delete st.flux[c.k]; st.custom.splice(ci,1); renderFlux(); });
          row.appendChild(del);
        }
        rows.appendChild(row);
      });

      const ca = $('customAdd');
      if (ca) {
        if (st.model === 'custom') {
          ca.innerHTML = '';
          const add = document.createElement('button');
          add.className = 'acc';
          add.style.cssText = 'display:inline-flex;align-items:center;gap:7px;padding:11px 17px;min-height:44px;border-radius:13px;background:var(--surface);font-size:13.5px;font-weight:600;box-shadow:0 10px 22px -14px rgba(90,60,120,.5);';
          add.innerHTML = '<span class="ic" style="font-size:18px;color:var(--acc-amber);">add</span>Ajouter une catégorie';
          add.addEventListener('click', () => {
            const k = 'cat' + Date.now();
            st.custom.push({ k, label:'Nouvelle catégorie', hint:'', pct:0, g:'linear-gradient(135deg,#A78BE8,#8CC7F0)' });
            st.flux[k] = 0; renderFlux();
          });
          ca.appendChild(add);
        } else ca.innerHTML = '';
      }
      const lg = $('fluxLegend');
      if (lg) lg.innerHTML = list.map(c =>
        '<span style="display:inline-flex;align-items:center;gap:6px;font-size:12.5px;color:var(--ink2);">' +
        '<span style="width:11px;height:11px;border-radius:4px;background:' + c.g + ';"></span>' + c.label + '</span>').join('');

      const affecte = list.reduce((s,c) => s + (st.flux[c.k]||0), 0);
      const libre = st.income - affecte;
      if (libre > 0.5 && st.income) {
        const rest = document.createElement('div');
        rest.style.cssText = 'width:' + Math.min(100, (libre / st.income) * 100) + '%;flex:none;background:repeating-linear-gradient(45deg,var(--line),var(--line) 7px,transparent 7px,transparent 14px);display:flex;align-items:center;justify-content:center;color:var(--ink2);overflow:hidden;';
        rest.innerHTML = '<span style="font-size:12px;font-weight:600;white-space:nowrap;">non affecté</span>';
        bar.appendChild(rest);
      }
      const alerte = $('fluxAlerte');
      if (alerte) {
        if (libre < -0.5) {
          alerte.innerHTML = '<div style="display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:15px;background:rgba(196,69,59,.14);border:1.5px solid rgba(196,69,59,.35);font-size:13.5px;"><span class="ic" style="font-size:19px;color:var(--acc-red);flex:none;">warning</span><span style="flex:1;min-width:200px;">Tu as affecté <b>' + Math.round(affecte / st.income * 100) + ' %</b> de tes revenus — soit <b class="mono">' + eur(-libre) + '</b> de trop.</span></div>';
        } else if (libre > 0.5) {
          alerte.innerHTML = '<div style="display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:15px;background:var(--soft);font-size:13.5px;"><span class="ic" style="font-size:19px;color:var(--acc-amber);flex:none;">info</span><span style="flex:1;min-width:200px;">Il te reste <b class="mono">' + eur(libre) + '</b> non affectés — la zone hachurée dans la barre.</span></div>';
        } else alerte.innerHTML = '';
      }

      const keys = SAVE_KEYS[st.model] || ['epargne'];
      const save = keys.reduce((s,k) => s + (st.flux[k]||0), 0);
      renderPratique();
      st.saveMonthly = save;
      if ($('saveAmount')) $('saveAmount').textContent = eur(save);
      if ($('saveYear')) $('saveYear').textContent = eur(save * 12);
      if ($('echoSave')) $('echoSave').textContent = eur(save);
      if ($('stratSave')) $('stratSave').textContent = eur(save);
      renderStrats();
    };

    // ── pyramide vivante ──
    const renderPyr = (view) => {
      const box = $('livePyr-' + view);
      if (!box) return;
      const v = st.vals[view];
      const total = POTS.reduce((s,p) => s + (v[p.k]||0), 0) || 1;
      const order = ['pari','longterme','projets','securite'];
      const shares = {}; let maxShare = 0;
      order.forEach(k => { const s = (v[k]||0) / total; shares[k] = s; if (s > maxShare) maxShare = s; });
      box.innerHTML = '';
      order.forEach(k => {
        const p = POTS.find(x => x.k === k);
        const s = shares[k];
        const el = document.createElement('div');
        if (s <= 0) {
          el.style.cssText = 'width:100%;display:flex;justify-content:center;';
          el.innerHTML = '<span style="width:34%;padding:7px;border-radius:10px;border:2px dashed var(--line);color:var(--ink2);text-align:center;font-size:11.5px;white-space:nowrap;overflow:hidden;">' + p.label + ' — vide</span>';
        } else {
          const w = Math.max(16, Math.round(96 * s / (maxShare || 1)));
          const narrow = w < 42;
          el.style.cssText = 'position:relative;width:100%;display:flex;justify-content:center;align-items:center;';
          const seg = '<div style="width:' + w + '%;flex:none;padding:9px 6px;border-radius:11px;background:' + p.g + ';color:#fff;text-align:center;text-shadow:0 1px 3px rgba(40,20,60,.4);overflow:hidden;transition:width .4s cubic-bezier(.34,1.3,.5,1);">' +
            (narrow ? '<div style="font-family:\'Space Mono\',monospace;font-size:11px;">' + Math.round(s*100) + ' %</div>'
                    : '<div style="font-size:12.5px;font-weight:600;white-space:nowrap;">' + p.label + '</div><div style="font-family:\'Space Mono\',monospace;font-size:11px;">' + Math.round(s*100) + ' %</div>') +
            '</div>';
          el.innerHTML = narrow
            ? seg + '<span style="position:absolute;left:calc(50% + ' + (w/2) + '% + 9px);top:50%;transform:translateY(-50%);font-size:12px;font-weight:600;color:var(--ink2);white-space:nowrap;">' + p.label + '</span>'
            : seg;
        }
        box.appendChild(el);
      });
      const warn = $('pyrWarn-' + view);
      if (warn) {
        const inverted = shares.securite < shares.longterme + shares.pari;
        warn.innerHTML = inverted
          ? '<div style="display:flex;align-items:flex-start;gap:8px;padding:11px 13px;border-radius:13px;background:rgba(255,122,69,.14);border:1.5px solid rgba(255,122,69,.35);font-size:12.5px;"><span class="ic" style="font-size:17px;color:var(--acc-red);flex:none;">warning</span><span>Pyramide fragile — le sommet pèse plus lourd que la base.</span></div>'
          : '<div style="display:flex;align-items:flex-start;gap:8px;padding:11px 13px;border-radius:13px;background:rgba(52,211,153,.14);border:1.5px solid rgba(52,211,153,.32);font-size:12.5px;"><span class="ic" style="font-size:17px;color:var(--acc-green);flex:none;">check_circle</span><span>Base solide — la sécurité porte bien l\'ensemble.</span></div>';
      }
    };

    // ── stratégies ──
    const renderStrats = () => {
      const box = $('strats');
      if (!box) return;
      box.innerHTML = '';
      STRATS.forEach(s => {
        const on = st.strat === s.k;
        const b = document.createElement('button');
        b.className = 'seg';
        b.style.cssText = 'text-align:left;padding:16px;border-radius:18px;display:flex;flex-direction:column;gap:8px;min-height:44px;' +
          (on ? 'background:' + s.g + ';color:#fff;box-shadow:0 16px 30px -18px rgba(90,60,120,.7);' : 'background:var(--soft);color:var(--ink);border:1.5px solid var(--line);');
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.innerHTML = '<span class="ic" style="font-size:23px;' + (on ? '' : 'color:var(--ink2);') + '">' + s.ic + '</span>' +
          '<span style="font-size:14.5px;font-weight:600;">' + s.name + '</span>' +
          '<span style="font-size:12px;' + (on ? 'opacity:.92;' : 'color:var(--ink2);') + 'line-height:1.4;">' + s.hint + '</span>';
        b.addEventListener('click', () => { st.strat = s.k; renderStrats(); });
        box.appendChild(b);
      });

      const det = $('stratDetail');
      if (!det) return;
      const s = STRATS.find(x => x.k === st.strat);
      const save = st.saveMonthly || 0;
      const v = st.vals.situation;
      const total = POTS.reduce((a,p) => a + (v[p.k]||0), 0) || 0;
      const targetSec = st._target || Math.round(total * 0.45);
      const gap = Math.max(0, targetSec - (v.securite || 0));

      let rows = POTS.map(p => {
        const pctv = s.mix[p.k] || 0;
        return { p, pctv, amt: Math.round(save * pctv / 100) };
      }).filter(r => r.pctv > 0);

      const toSec = rows.find(r => r.p.k === 'securite');
      const monthsToFill = (gap > 0 && toSec && toSec.amt > 0) ? Math.ceil(gap / toSec.amt) : 0;

      det.innerHTML =
        '<div style="padding:20px 22px;border-radius:20px;background:var(--soft);border:1.5px solid var(--line);display:flex;flex-direction:column;gap:16px;">' +
          '<div style="font-size:14px;color:var(--ink2);line-height:1.55;">' + s.why + '</div>' +
          '<div style="display:flex;height:44px;border-radius:13px;overflow:hidden;">' +
            rows.map(r => '<div style="flex:' + r.pctv + ';background:' + r.p.g + ';display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;text-shadow:0 1px 3px rgba(40,20,60,.4);overflow:hidden;"><span style="font-size:12px;font-weight:600;white-space:nowrap;">' + r.p.label + '</span><span style="font-family:\'Space Mono\',monospace;font-size:11px;">' + r.pctv + ' %</span></div>').join('') +
          '</div>' +
          '<div style="display:flex;flex-direction:column;gap:8px;">' +
            rows.map(r => '<div style="display:flex;align-items:center;gap:11px;padding:10px 14px;border-radius:13px;background:var(--surface);font-size:14px;">' +
              '<span style="width:12px;height:12px;flex:none;border-radius:4px;background:' + r.p.g + ';"></span>' +
              '<span style="flex:1;">' + r.p.label + '</span>' +
              '<span class="mono" style="font-size:12.5px;color:var(--ink2);">' + r.pctv + ' %</span>' +
              '<b class="mono" style="min-width:88px;text-align:right;">' + eur(r.amt) + '</b>' +
              '<span style="font-size:12.5px;color:var(--ink2);">/mois</span></div>').join('') +
          '</div>' +
          (monthsToFill
            ? '<div style="display:flex;align-items:center;gap:11px;padding:14px 17px;border-radius:16px;background:linear-gradient(135deg,rgba(52,211,153,.16),rgba(34,180,196,.16));font-size:14px;"><span class="ic" style="font-size:21px;color:var(--acc-green);flex:none;">schedule</span><span style="flex:1;min-width:200px;">À ce rythme, ton matelas de sécurité est complet dans <b>' + monthsToFill + ' mois</b> — il te manque ' + eur(gap) + '.</span></div>'
            : '<div style="display:flex;align-items:center;gap:11px;padding:14px 17px;border-radius:16px;background:linear-gradient(135deg,rgba(52,211,153,.16),rgba(34,180,196,.16));font-size:14px;"><span class="ic" style="font-size:21px;color:var(--acc-green);flex:none;">check_circle</span><span style="flex:1;min-width:200px;">Ton matelas de sécurité a atteint sa cible — tu peux faire travailler la suite.</span></div>') +
        '</div>' +
        projectionHTML(s, save, v);

      document.querySelectorAll('#stratDetail [data-h]').forEach(b => b.addEventListener('click', () => {
        st.horizon = parseInt(b.getAttribute('data-h'), 10);
        renderStrats();
      }));
    };

    // ── projection dans le temps ──
    const projectionHTML = (s, save, cur) => {
      const H = st.horizon;
      const W = 620, HT = 150, PAD = 26;
      const alloc = {}; POTS.forEach(p => { alloc[p.k] = save * ((s.mix[p.k]||0) / 100); });
      const at = (m) => { const o = {}; POTS.forEach(p => { o[p.k] = (cur[p.k]||0) + alloc[p.k] * m; }); return o; };
      const totalAt = (m) => POTS.reduce((a,p) => a + at(m)[p.k], 0);
      const maxT = totalAt(H) || 1;
      const x = (m) => PAD + (m / H) * (W - PAD * 2);
      const y = (val) => HT - 18 - (val / maxT) * (HT - 34);

      const stack = [];
      let below = POTS.map(() => 0);
      const pts = [];
      for (let m = 0; m <= H; m++) {
        const v = at(m); let acc = 0;
        pts.push(POTS.map(p => { acc += v[p.k]; return acc; }));
      }
      POTS.forEach((p, i) => {
        const top = pts.map((row, m) => x(m).toFixed(1) + ',' + y(row[i]).toFixed(1)).join(' ');
        const bot = pts.map((row, m) => ({ m, v: i === 0 ? 0 : row[i-1] })).reverse()
          .map(o => x(o.m).toFixed(1) + ',' + y(o.v).toFixed(1)).join(' ');
        stack.push('<polygon points="' + top + ' ' + bot + '" fill="' + p.gs + '" opacity=".92"/>');
      });

      const end = at(H);
      const endTotal = totalAt(H);
      const ticks = [0, Math.round(H/2), H].map(m =>
        '<text x="' + x(m).toFixed(1) + '" y="' + (HT - 3) + '" text-anchor="middle" font-family="Space Mono, monospace" font-size="10" fill="currentColor" opacity=".55">' + (m === 0 ? 'auj.' : m + ' m') + '</text>');

      const chips = [6,12,24,36].map(h =>
        '<button class="seg" data-h="' + h + '" style="min-height:36px;padding:7px 15px;border-radius:999px;font-size:13px;font-weight:600;' +
        (st.horizon === h ? 'background:linear-gradient(135deg,#A78BE8,#8CC7F0);color:#fff;' : 'background:var(--surface);color:var(--ink2);border:1.5px solid var(--line);') +
        '">' + h + ' mois</button>').join('');

      const maxShare = Math.max.apply(null, POTS.map(p => end[p.k] / (endTotal||1)));
      const pyr = ['pari','longterme','projets','securite'].map(k => {
        const p = POTS.find(o => o.k === k);
        const sh = end[k] / (endTotal || 1);
        if (sh <= 0) return '';
        const w = Math.max(18, Math.round(94 * sh / (maxShare||1)));
        return '<div style="width:' + w + '%;padding:6px 4px;border-radius:9px;background:' + p.g + ';color:#fff;text-align:center;font-size:11px;font-weight:600;text-shadow:0 1px 2px rgba(40,20,60,.4);overflow:hidden;white-space:nowrap;">' + Math.round(sh*100) + ' %</div>';
      }).join('');

      return '<div style="margin-top:16px;padding:20px 22px;border-radius:20px;background:var(--soft);border:1.5px solid var(--line);display:flex;flex-direction:column;gap:16px;">' +
        '<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;justify-content:space-between;">' +
          '<div class="mono" style="font-size:11px;letter-spacing:1px;color:var(--ink2);">SI J\'APPLIQUE CETTE STRATÉGIE…</div>' +
          '<div style="display:flex;gap:6px;flex-wrap:wrap;">' + chips + '</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 150px;gap:22px;align-items:center;" class="projGrid">' +
          '<svg viewBox="0 0 ' + W + ' ' + HT + '" style="width:100%;height:150px;color:var(--ink);" role="img" aria-label="Évolution de l\'épargne sur ' + H + ' mois">' +
            stack.join('') +
            '<line x1="' + PAD + '" y1="' + (HT-18) + '" x2="' + (W-PAD) + '" y2="' + (HT-18) + '" stroke="currentColor" stroke-width="1" opacity=".25"/>' +
            ticks.join('') +
          '</svg>' +
          '<div style="display:flex;flex-direction:column;align-items:center;gap:5px;">' +
            '<div class="mono" style="font-size:10.5px;letter-spacing:.8px;color:var(--ink2);">DANS ' + H + ' MOIS</div>' + pyr +
          '</div>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:8px;">' +
          POTS.map(p => {
            const from = cur[p.k] || 0, to = end[p.k], delta = to - from;
            return '<div style="display:flex;align-items:center;gap:11px;padding:10px 14px;border-radius:13px;background:var(--surface);font-size:14px;flex-wrap:wrap;">' +
              '<span style="width:12px;height:12px;flex:none;border-radius:4px;background:' + p.g + ';"></span>' +
              '<span style="flex:1;min-width:90px;">' + p.label + '</span>' +
              '<span class="mono" style="font-size:12.5px;color:var(--ink2);">' + eur(from) + '</span>' +
              '<span class="ic" style="font-size:16px;color:var(--ink2);">arrow_forward</span>' +
              '<b class="mono" style="min-width:88px;text-align:right;">' + eur(to) + '</b>' +
              '<span class="mono" style="min-width:74px;text-align:right;font-size:12.5px;color:' + (delta > 0 ? 'var(--acc-green)' : 'var(--ink2)') + ';">' + (delta > 0 ? '+' + eur(delta) : '—') + '</span>' +
            '</div>';
          }).join('') +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:14px 17px;border-radius:16px;background:var(--surface);font-size:14px;">' +
          '<span class="ic" style="font-size:22px;color:#7C5CFF;flex:none;">auto_graph</span>' +
          '<span style="flex:1;min-width:220px;">Ton épargne passerait de <b class="mono">' + eur(POTS.reduce((a,p)=>a+(cur[p.k]||0),0)) + '</b> à <b class="num" style="font-size:19px;">' + eur(endTotal) + '</b> en ' + H + ' mois — dont <b class="mono">' + eur(save * H) + '</b> de versements.</span>' +
        '</div>' +
      '</div>';
    };

    const renderQuiz = () => {
      const box = $('quiz');
      if (!box) return;
      box.innerHTML = '';
      QS.forEach((q,i) => {
        const row = document.createElement('div');
        row.style.cssText = 'padding:13px 0;display:flex;align-items:center;gap:14px;flex-wrap:wrap;' + (i < QS.length-1 ? 'border-bottom:1px solid var(--line);' : '');
        const lab = document.createElement('span');
        lab.style.cssText = 'flex:1;min-width:210px;font-size:14.5px;font-weight:600;';
        lab.textContent = q.q;
        row.appendChild(lab);
        const grp = document.createElement('div');
        grp.style.cssText = 'display:flex;gap:7px;flex-wrap:wrap;';
        q.a.forEach((a,j) => {
          const b = document.createElement('button');
          const on = st.quiz[i] === j;
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
          b.className = 'seg';
          b.style.cssText = 'min-height:44px;padding:9px 15px;border-radius:999px;font-size:13.5px;font-weight:600;' +
            (on ? 'background:linear-gradient(135deg,#34D399,#22B4C4);color:#fff;' : 'background:transparent;border:1.5px solid var(--line);color:var(--ink);');
          b.innerHTML = a.t + (a.p ? ' <span style="font-family:\'Space Mono\',monospace;font-size:12px;opacity:.85;">+' + a.p + '</span>' : '');
          b.addEventListener('click', () => { st.quiz[i] = j; renderQuiz(); });
          grp.appendChild(b);
        });
        row.appendChild(grp);
        box.appendChild(row);
      });
      const months = 3 + QS.reduce((s,q,i) => s + q.a[st.quiz[i]].p, 0);
      if ($('qMonths')) $('qMonths').textContent = months + ' mois';
      if ($('qAmount')) $('qAmount').textContent = eur(months * st.spend);
      if ($('qSpendEcho')) $('qSpendEcho').textContent = eur(st.spend);
      st._target = months * st.spend;
    };

    const renderPots = (view) => {
      const box = $('pots-' + view);
      if (!box) return;
      const v = st.vals[view];
      const projSum = st.projects.reduce((s,p) => s + (view === 'objectif' ? (p.target||0) : (p.saved||0)), 0);
      if (st.projects.length) v.projets = projSum;
      const total = POTS.reduce((s,p) => s + (v[p.k]||0), 0) || 1;
      const monthsLeft = (due) => {
        if (!due) return null;
        const [y,m] = due.split('-').map(Number);
        const now = new Date();
        const n = (y - now.getFullYear()) * 12 + (m - 1 - now.getMonth());
        return n;
      };
      const stratProj = (() => {
        const s = STRATS.find(x => x.k === st.strat);
        return Math.round((st.saveMonthly || 0) * ((s && s.mix.projets) || 0) / 100);
      })();
      box.innerHTML = '';
      POTS.forEach(p => {
        const locked = p.k === 'projets' && st.projects.length > 0;
        const amt = locked ? projSum : (v[p.k] || 0);
        const pct = Math.round(amt / total * 100);
        const gapPts = pct - tgt(p);

        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:13px;flex-wrap:wrap;';

        const gapCol0 = Math.abs(gapPts) <= 5 ? 'var(--acc-green)' : (gapPts < 0 ? 'var(--acc-amber)' : 'var(--acc-purple)');
        const lab = document.createElement('span');
        lab.style.cssText = 'width:150px;flex:none;font-size:14.5px;font-weight:600;display:flex;align-items:center;gap:7px;';
        lab.innerHTML = '<span style="width:11px;height:11px;flex:none;border-radius:4px;background:' + p.g + ';"></span>' +
          '<span style="display:flex;flex-direction:column;line-height:1.25;"><span>' + p.label + '</span>' +
          '<span class="mono" style="font-size:11.5px;font-weight:400;color:var(--ink2);">' + pct + ' % / ' + tgt(p) + ' % · <b style="color:' + gapCol0 + ';">' + (gapPts > 0 ? '+' : '') + gapPts + '</b></span></span>';
        row.appendChild(lab);

        // barre centrée sur la cible : centre = cible, échelle 0 → 2× cible
        const track = document.createElement('div');
        track.style.cssText = 'flex:1;min-width:150px;height:34px;border-radius:11px;background:var(--line);position:relative;overflow:hidden;';
        track.innerHTML =
          '<div style="position:absolute;left:0;top:0;bottom:0;width:' + Math.min(100, pct) + '%;background:' + p.g + ';transition:width .35s cubic-bezier(.34,1.3,.5,1);"></div>' +
          '<div title="cible ' + tgt(p) + ' %" style="position:absolute;left:' + tgt(p) + '%;top:0;bottom:0;width:3px;transform:translateX(-1.5px);background:var(--ink);opacity:.6;"></div>';
        row.appendChild(track);

        const inp = document.createElement('input');
        inp.className = 'fld'; inp.value = Math.round(amt); inp.setAttribute('inputmode','decimal');
        inp.setAttribute('aria-label', p.label + ' en euros');
        inp.id = 'pot-' + view + '-' + p.k;
        if (locked) { inp.disabled = true; inp.title = 'Somme de tes projets'; inp.style.opacity = '.6'; }
        inp.addEventListener('input', () => { st.vals[view][p.k] = parseFloat(inp.value) || 0; keepFocus(renderAll); });
        row.appendChild(inp);

        box.appendChild(row);

        // projets : dépliable sous sa poche
        if (p.k === 'projets' && view === 'situation') {
          const toggle = document.createElement('button');
          toggle.className = 'acc';
          toggle.setAttribute('aria-expanded', st.projOpen ? 'true' : 'false');
          toggle.style.cssText = 'align-self:flex-start;margin-left:18px;display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:600;color:var(--ink2);padding:6px 4px;min-height:34px;';
          toggle.innerHTML = '<span class="ic" style="font-size:19px;">' + (st.projOpen ? 'expand_less' : 'expand_more') + '</span>' +
            (st.projects.length ? st.projects.length + ' projet' + (st.projects.length > 1 ? 's' : '') + ' détaillé' + (st.projects.length > 1 ? 's' : '') : 'Détailler mes projets');
          toggle.addEventListener('click', () => { st.projOpen = !st.projOpen; renderAll(); });
          box.appendChild(toggle);

          if (st.projOpen) {
            const panel = document.createElement('div');
            panel.style.cssText = 'margin-left:18px;display:flex;flex-direction:column;gap:12px;';

            st.projects.forEach((pr,i) => {
              const target = pr.target || 0, saved = pr.saved || 0;
              const pct = target ? Math.min(100, Math.round(saved / target * 100)) : 0;
              const rest = Math.max(0, target - saved);
              const ml = monthsLeft(pr.due);
              const perMonth = (ml && ml > 0 && rest > 0) ? Math.ceil(rest / ml) : 0;
              const done = rest === 0 && target > 0;
              const late = ml !== null && ml <= 0 && rest > 0;
              const onTrack = !done && !late && perMonth > 0 && perMonth <= Math.max(stratProj, 1);

              const c = document.createElement('div');
              c.style.cssText = 'padding:16px 18px;border-radius:18px;background:var(--soft);border:1.5px solid ' +
                (done ? 'rgba(52,211,153,.45)' : late ? 'rgba(196,69,59,.4)' : 'var(--line)') + ';display:flex;flex-direction:column;gap:12px;';

              // ligne 1 : nom + échéance + suppression
              const r1 = document.createElement('div');
              r1.style.cssText = 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;';
              const n = document.createElement('input');
              n.value = pr.name; n.setAttribute('aria-label','Nom de l\'objectif');
              n.style.cssText = 'flex:1;min-width:160px;padding:9px 12px;border-radius:11px;border:1.5px solid var(--line);background:var(--field);color:var(--ink);font-family:Fredoka,sans-serif;font-size:15px;font-weight:600;';
              n.addEventListener('input', () => { st.projects[i].name = n.value; });
              const d = document.createElement('input');
              d.type = 'month'; d.value = pr.due || ''; d.setAttribute('aria-label','Échéance de ' + pr.name);
              d.style.cssText = 'padding:9px 12px;border-radius:11px;border:1.5px solid var(--line);background:var(--field);color:var(--ink);font-family:\'Space Mono\',monospace;font-size:13px;';
              d.addEventListener('input', () => { st.projects[i].due = d.value; renderAll(); });
              const del = document.createElement('button');
              del.className = 'acc';
              del.setAttribute('aria-label','Supprimer ' + pr.name);
              del.style.cssText = 'width:40px;height:40px;flex:none;border-radius:11px;display:flex;align-items:center;justify-content:center;color:var(--ink2);';
              del.innerHTML = '<span class="ic" style="font-size:19px;">delete</span>';
              del.addEventListener('click', () => { st.projects.splice(i,1); renderAll(); });
              r1.appendChild(n); r1.appendChild(d); r1.appendChild(del);
              c.appendChild(r1);

              // ligne 2 : progression
              const bar = document.createElement('div');
              bar.style.cssText = 'display:flex;align-items:center;gap:12px;flex-wrap:wrap;';
              bar.innerHTML =
                '<div style="flex:1;min-width:170px;height:22px;border-radius:8px;background:var(--line);overflow:hidden;">' +
                  '<div style="width:' + pct + '%;height:100%;background:linear-gradient(135deg,#FBBF24,#FF7A45);transition:width .4s cubic-bezier(.34,1.3,.5,1);"></div>' +
                '</div>' +
                '<span class="mono" style="font-size:13px;font-weight:700;min-width:44px;text-align:right;">' + pct + ' %</span>';
              c.appendChild(bar);

              // ligne 3 : montants
              const r3 = document.createElement('div');
              r3.style.cssText = 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:13px;color:var(--ink2);';
              const mk = (lbl, val, key) => {
                const w = document.createElement('label');
                w.style.cssText = 'display:flex;align-items:center;gap:8px;';
                w.appendChild(document.createTextNode(lbl));
                const inp = document.createElement('input');
                inp.className = 'fld'; inp.value = val; inp.setAttribute('inputmode','decimal');
                inp.setAttribute('aria-label', lbl + ' — ' + pr.name);
                inp.style.width = '92px';
                inp.id = 'proj-' + i + '-' + key;
                inp.addEventListener('input', () => { st.projects[i][key] = parseFloat(inp.value) || 0; keepFocus(renderAll); });
                w.appendChild(inp);
                const e = document.createElement('span'); e.className='mono'; e.textContent='€';
                w.appendChild(e);
                return w;
              };
              r3.appendChild(mk('Déjà mis de côté', saved, 'saved'));
              r3.appendChild(mk('Objectif', target, 'target'));
              c.appendChild(r3);

              // ligne 4 : suivi
              const st4 = document.createElement('div');
              st4.style.cssText = 'display:flex;align-items:center;gap:9px;flex-wrap:wrap;font-size:13px;padding-top:10px;border-top:1px solid var(--line);';
              let chip, txt;
              if (done) {
                chip = '<span style="display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:999px;background:rgba(52,211,153,.2);color:var(--acc-green);font-weight:600;"><span class="ic" style="font-size:15px;">check_circle</span>Atteint</span>';
                txt = 'Objectif bouclé — tu peux le clôturer ou viser plus haut.';
              } else if (late) {
                chip = '<span style="display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:999px;background:rgba(196,69,59,.16);color:var(--acc-red);font-weight:600;"><span class="ic" style="font-size:15px;">event_busy</span>Échéance passée</span>';
                txt = 'Il manque <b class="mono">' + eur(rest) + '</b> — repousse la date ou ajuste l\'objectif.';
              } else if (perMonth) {
                chip = onTrack
                  ? '<span style="display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:999px;background:rgba(52,211,153,.2);color:var(--acc-green);font-weight:600;"><span class="ic" style="font-size:15px;">trending_up</span>Dans les temps</span>'
                  : '<span style="display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:999px;background:rgba(251,191,36,.22);color:var(--acc-amber);font-weight:600;"><span class="ic" style="font-size:15px;">bolt</span>À accélérer</span>';
                txt = 'Il reste <b class="mono">' + eur(rest) + '</b> sur <b>' + ml + ' mois</b> — soit <b class="mono">' + eur(perMonth) + '</b>/mois' +
                  (stratProj ? ' <span style="color:var(--ink2);">(ta stratégie alloue ' + eur(stratProj) + '/mois aux projets)</span>' : '') + '.';
              } else {
                chip = '<span style="display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:999px;background:var(--surface);color:var(--ink2);font-weight:600;"><span class="ic" style="font-size:15px;">event</span>Sans échéance</span>';
                txt = 'Ajoute une date pour savoir combien mettre de côté chaque mois.';
              }
              st4.innerHTML = chip + '<span style="flex:1;min-width:200px;">' + txt + '</span>';
              c.appendChild(st4);

              panel.appendChild(c);
            });

            const add = document.createElement('button');
            add.className = 'acc';
            add.style.cssText = 'align-self:flex-start;display:inline-flex;align-items:center;gap:7px;padding:11px 17px;min-height:44px;border-radius:13px;background:var(--surface);font-size:13.5px;font-weight:600;box-shadow:0 10px 22px -14px rgba(90,60,120,.5);';
            add.innerHTML = '<span class="ic" style="font-size:18px;color:var(--acc-amber);">add</span>Ajouter un objectif';
            add.addEventListener('click', () => {
              const d = new Date(); d.setMonth(d.getMonth() + 12);
              st.projects.push({ name:'Nouvel objectif', target:1000, saved:0, due: d.toISOString().slice(0,7) });
              renderAll();
            });
            panel.appendChild(add);

            if (st.projects.length) {
              const tot = st.projects.reduce((s,p) => s + (p.target||0), 0);
              const sum = document.createElement('div');
              sum.style.cssText = 'font-size:13px;color:var(--ink2);padding-top:4px;';
              sum.innerHTML = 'Déjà mis de côté <b class="mono">' + eur(projSum) + '</b> sur <b class="mono">' + eur(tot) + '</b> visés — c\'est le montant épargné qui alimente la poche <b>Projets</b> de ta pyramide.';
              panel.appendChild(sum);
            }
            box.appendChild(panel);
          }
        }
      });
      if ($('potTotal-' + view)) $('potTotal-' + view).textContent = eur(total);
      renderPyr(view);

      const sums = [0,0,0];
      POTS.forEach(p => { sums[p.risk] += (v[p.k]||0); });
      const rb = $('riskBar-' + view);
      if (rb) {
        const names = ['Sans risque','Peu risqué','Risqué'];
        const gs = ['linear-gradient(135deg,#34D399,#22B4C4)','linear-gradient(135deg,#FBBF24,#FF7A45)','linear-gradient(135deg,#F472B6,#A855F7)'];
        rb.innerHTML = sums.map((s,i) => '<div title="' + names[i] + ' ' + Math.round(s/total*100) + ' %" style="flex:' + Math.max(s,0.01) + ';background:' + gs[i] + ';transition:flex .35s;"></div>').join('');
      }
      const safe = Math.round(sums[0] / total * 100);
      const rt = $('riskText-' + view);
      if (rt) {
        let phrase = safe >= 65 ? 'Ton épargne est <b>très prudente</b> — solide, mais peu de moteur pour le long terme.'
          : safe >= 40 ? 'Ton épargne est <b>équilibrée</b> — la base est là et une part travaille.'
          : 'Ton épargne est <b>offensive</b> — vérifie que ton matelas de sécurité tient le coup.';
        rt.innerHTML = phrase + '<div class="mono" style="font-size:12.5px;color:var(--ink2);margin-top:5px;">Sans risque ' + safe + ' % · Peu risqué ' + Math.round(sums[1]/total*100) + ' % · Risqué ' + Math.round(sums[2]/total*100) + ' %</div>';
      }
      if (view === 'situation') renderAnalyse(total);
      if (view === 'objectif') renderEcart();
    };

    const renderAll = () => { renderProfil(); renderPots('situation'); renderPots('objectif'); renderStrats(); };

    // ── écart situation → objectif ──
    const renderEcart = () => {
      const box = $('ecart');
      if (!box) return;
      const a = st.vals.situation, b = st.vals.objectif;
      const ta = POTS.reduce((s,p) => s + (a[p.k]||0), 0);
      const tb = POTS.reduce((s,p) => s + (b[p.k]||0), 0);
      const diff = tb - ta;
      const save = st.saveMonthly || 0;
      const months = (diff > 0 && save > 0) ? Math.ceil(diff / save) : 0;
      box.innerHTML = '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:15px 18px;border-radius:17px;background:linear-gradient(135deg,rgba(34,180,196,.16),rgba(167,139,232,.16));border:1.5px solid rgba(34,180,196,.3);font-size:14px;">' +
        '<span class="ic" style="font-size:22px;color:var(--acc-teal);flex:none;">' + (months ? 'schedule' : 'check_circle') + '</span><span>' +
        (months
          ? 'Il te manque <b class="mono">' + eur(diff) + '</b> pour atteindre cet objectif. À <b class="mono">' + eur(save) + '</b>/mois, tu y es dans <b>' + months + ' mois</b>.'
          : (diff <= 0 ? 'Ton épargne actuelle couvre déjà cet objectif — tu peux viser plus haut.' : 'Renseigne ton budget type pour estimer le délai.')) +
        '</span></div>';
    };

    // ── petite analyse ──
    const renderAnalyse = (total) => {
      const box = $('analyse');
      if (!box) return;
      const v = st.vals.situation;
      const pts = [];
      const line = (ic, col, txt) => '<div style="display:flex;align-items:flex-start;gap:9px;font-size:13px;line-height:1.5;"><span class="ic" style="font-size:17px;color:' + col + ';flex:none;">' + ic + '</span><span>' + txt + '</span></div>';

      // 1 · le matelas
      const targetSec = st._target || Math.round(total * 0.45);
      const sec = v.securite || 0;
      if (sec >= targetSec) pts.push(line('verified','var(--acc-green)','Ton <b>matelas de sécurité</b> est atteint (' + eur(sec) + '). Le reste peut travailler.'));
      else pts.push(line('shield','var(--acc-amber)','Il manque <b>' + eur(targetSec - sec) + '</b> pour compléter ton matelas de sécurité.'));

      // 2 · l'écart le plus marqué
      let worst = null;
      POTS.forEach(p => {
        const pct = Math.round((v[p.k]||0) / total * 100);
        const d = pct - tgt(p);
        if (!worst || Math.abs(d) > Math.abs(worst.d)) worst = { p, d, pct };
      });
      if (worst && Math.abs(worst.d) > 5) {
        pts.push(line(worst.d < 0 ? 'trending_down' : 'trending_up', worst.d < 0 ? 'var(--acc-amber)' : 'var(--acc-purple)',
          'C\'est <b>' + worst.p.label + '</b> qui s\'écarte le plus du modèle : ' + worst.pct + ' % au lieu de ' + tgt(worst.p) + ' % (' + (worst.d > 0 ? '+' : '') + worst.d + ' pts).'));
      } else {
        pts.push(line('check_circle','var(--acc-green)','Toutes tes poches sont à moins de 5 points de leur cible — répartition très proche du modèle.'));
      }

      // 3 · les objectifs
      if (st.projects.length) {
        const late = st.projects.filter(p => { const m = (() => { if (!p.due) return null; const [y,mo]=p.due.split('-').map(Number); const n=new Date(); return (y-n.getFullYear())*12+(mo-1-n.getMonth()); })(); return m !== null && m <= 0 && (tgt(p)||0) > (p.saved||0); }).length;
        if (late) pts.push(line('event_busy','var(--acc-red)','<b>' + late + ' objectif' + (late>1?'s ont':' a') + '</b> dépassé son échéance — à revoir plus bas.'));
        else pts.push(line('flag','#7C5CFF','<b>' + st.projects.length + ' objectif' + (st.projects.length>1?'s':'') + '</b> en cours, financé' + (st.projects.length>1?'s':'') + ' par la poche Projets.'));
      }

      box.innerHTML = '<div style="padding:15px 17px;border-radius:16px;background:var(--soft);display:flex;flex-direction:column;gap:11px;">' +
        '<div class="mono" style="font-size:11px;letter-spacing:1px;color:var(--ink2);">PETITE ANALYSE</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px 20px;">' + pts.join('') + '</div></div>';
    };

    /* ── Le profil d'investisseur vient de « Point de départ » ──
       C'est la seule chose qui traverse : il fixe les cibles de la pyramide. */
    const lireProfil = () => {
      if (typeof PDEtat === 'undefined') return false;
      const o = PDEtat.lire();
      const avant = st.profil + '|' + st.age;
      if (o.profil) st.profil = o.profil;
      if (o.age) st.age = o.age;
      return avant !== st.profil + '|' + st.age;
    };
    lireProfil();
    if (typeof PDEtat !== 'undefined') PDEtat.surChangement(() => { if (lireProfil()) renderAll(); });

    const ONGLETS = ['principes','flux','epargne','placer','pratique'];
    const ongletDeLAdresse = () => {
      const h = (location.hash || '').replace('#','');
      if (ONGLETS.indexOf(h) > -1) return h;
      /* une ancre de section (#sec-defis, #sec-reel…) ramène à Point de départ */
      if (h && h.indexOf('sec-') === 0) return 'pratique';
      return 'pratique';
    };

    const showTab = (name) => {
      ['principes','flux','epargne','placer','pratique'].forEach(n => {
        const p = $('pane-' + n);
        if (p) p.style.display = (n === name) ? 'flex' : 'none';
      });
      document.querySelectorAll('#tabs .tab').forEach(t => {
        const on = t.getAttribute('data-tab') === name;
        t.style.background = on ? (name === 'flux' ? 'linear-gradient(135deg,#FBBF24,#FF7A45)' : 'linear-gradient(135deg,#A78BE8,#8CC7F0)') : 'transparent';
        t.style.color = on ? '#fff' : 'var(--ink2)';
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        /* barre défilante (téléphone) : ne jamais laisser l'onglet actif hors écran */
        if (on && t.scrollIntoView) t.scrollIntoView({ block:'nearest', inline:'nearest' });
      });
    };

    const wire = () => {
      if (!$('tabs') || !$('fluxBar')) { requestAnimationFrame(wire); return; }

      document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => showTab(b.getAttribute('data-tab'))));

      /* Le contenu de « Point de départ » vit dans commun/js/point-depart.js :
         il se dessine tout seul et nous prévient quand le profil change. */

      document.querySelectorAll('#modelSeg .seg').forEach(b =>
        b.addEventListener('click', () => setModel(b.getAttribute('data-model'))));
      setModel('pots');

      document.querySelectorAll('#unitSeg .seg').forEach(b => b.addEventListener('click', () => {
        st.unit = b.getAttribute('data-unit');
        document.querySelectorAll('#unitSeg .seg').forEach(o => {
          const on = o === b;
          o.style.background = on ? 'linear-gradient(135deg,#A78BE8,#8CC7F0)' : 'transparent';
          o.style.color = on ? '#fff' : 'var(--ink2)';
        });
        const h = $('unitHint');
        if (h) h.textContent = st.unit === 'pct' ? 'les montants en € se calculent sur tes revenus' : 'les pourcentages se calculent tout seuls';
        renderFlux();
      }));

      const inc = $('income');
      if (inc) inc.addEventListener('input', () => { st.income = parseFloat(inc.value) || 0; seedFlux(); renderFlux(); });
      /* ── Les charges fixes : deux portes, une seule valeur ──────────
         On peut taper le montant ici (on le connaît déjà) ou le faire
         calculer par la page « Charges fixes ». Les deux sont légitimes.
         Ce qui ne l'est pas, c'est de ne plus savoir laquelle est active :
         la valeur porte donc sa provenance, et l'écran l'affiche. */
      const CH = 'cosmos-charges', CH_SRC = 'cosmos-charges-source', CH_CALC = 'cosmos-charges-calcule';
      const lire = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
      const ecrire = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
      const totalCalcule = () => { const v = parseFloat(lire(CH_CALC)); return isFinite(v) && v > 0 ? v : null; };

      const chg = $('charges');
      const saved = lire(CH);
      if (saved) {
        st.charges = parseFloat(saved) || st.charges;
        st.chargesSrc = lire(CH_SRC) || 'calcule';   /* valeur d'avant la provenance : elle venait du report */
        if (chg) chg.value = Math.round(st.charges);
      }

      const renderChargesSrc = () => {
        const el = $('chargesSource'); if (!el) return;
        const calc = totalCalcule();
        const lien = '<a href="../charges-fixes/index.html" style="display:inline-flex;align-items:center;gap:5px;font-weight:600;text-decoration:none;">';
        if (st.chargesSrc === 'calcule') {
          el.innerHTML = '<span class="ic" aria-hidden="true" style="font-size:15px;color:var(--acc-teal);">calculate</span>' +
            'calculé depuis tes charges fixes · ' + lien + 'voir le détail</a>';
        } else if (st.chargesSrc === 'saisi' && calc) {
          el.innerHTML = '<span class="ic" aria-hidden="true" style="font-size:15px;color:var(--acc-amber);">edit</span>' +
            'saisi à la main · <button class="seg" data-reprendre="1" style="min-height:30px;padding:5px 10px;border-radius:9px;background:var(--soft);color:var(--ink);font-size:12px;font-weight:600;">reprendre le total calculé (' + eur(calc) + ')</button>';
        } else if (st.chargesSrc === 'saisi') {
          el.innerHTML = '<span class="ic" aria-hidden="true" style="font-size:15px;color:var(--acc-amber);">edit</span>' +
            'saisi à la main · ' + lien + 'm\'aider à les évaluer</a>';
        } else {
          el.innerHTML = lien + '<span class="ic" aria-hidden="true" style="font-size:16px;">calculate</span>M\'aider à les évaluer</a>';
        }
        const rep = el.querySelector('[data-reprendre]');
        if (rep) rep.addEventListener('click', () => {
          const c = totalCalcule(); if (!c) return;
          st.charges = c; st.chargesSrc = 'calcule';
          ecrire(CH, String(Math.round(c))); ecrire(CH_SRC, 'calcule');
          if (chg) chg.value = Math.round(c);
          renderReco(); renderChargesSrc();
        });
      };

      if (chg) chg.addEventListener('input', () => {
        st.charges = parseFloat(chg.value) || 0;
        st.chargesSrc = 'saisi';                    /* taper par-dessus est un choix, pas un accident */
        ecrire(CH, String(Math.round(st.charges))); /* et il survit au rechargement */
        ecrire(CH_SRC, 'saisi');
        renderReco(); renderChargesSrc();
      });
      renderChargesSrc();



      const acc = $('accMatelas');
      if (acc) acc.addEventListener('click', () => {
        const body = $('bodyMatelas'), open = body.style.display !== 'none';
        body.style.display = open ? 'none' : 'block';
        acc.setAttribute('aria-expanded', open ? 'false' : 'true');
        $('accMatelasIc').textContent = open ? 'expand_more' : 'expand_less';
      });

      const sp = $('spend');
      if (sp) sp.addEventListener('input', () => { st.spend = parseFloat(sp.value) || 0; renderQuiz(); });

      const rep = $('reportBtn');
      if (rep) rep.addEventListener('click', () => {
        st.vals.situation.securite = st._target || 0;
        renderAll();
        rep.innerHTML = '<span class="ic" style="font-size:17px;color:#12A085;">check</span>Reporté';
        setTimeout(() => { rep.innerHTML = '<span class="ic" style="font-size:17px;">south</span>Reporter dans ma répartition'; }, 1800);
      });

      const mq = window.matchMedia('(max-width: 900px)');
      const respond = () => { ['repGrid','repGrid2'].forEach(id => { const g = $(id); if (g) g.style.gridTemplateColumns = mq.matches ? '1fr' : '290px 1fr'; }); };
      mq.addEventListener ? mq.addEventListener('change', respond) : mq.addListener(respond);
      respond();

      seedFlux(); renderFlux(); renderQuiz(); renderAll(); renderPratique();
      showTab(ongletDeLAdresse());
      window.addEventListener('hashchange', () => showTab(ongletDeLAdresse()));
      requestAnimationFrame(() => renderReco());
    };
    /* Passerelle pour point-depart.js : changer d'onglet, et redessiner
       la pyramide quand le profil d'investisseur change. */
    window.cosmosFinances = { onglet: showTab, rafraichir: renderAll };

    wire();
})();
