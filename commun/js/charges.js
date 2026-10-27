/* Cosmos — Évaluer mes charges fixes (Finances / Mon budget type)
   Outil 100 % local. Reporte le total mensuel dans localStorage['cosmos-charges'].
   Le thème jour/nuit est géré par theme.js (bouton #themeToggle partagé). */
(function () {
  var box = document.getElementById('cats');
  if (!box) return; /* pas sur cette page */

  var CATS = [
    { n:'Logement', ic:'home', g:'linear-gradient(135deg,#34D399,#22B4C4)', items:[
      { l:'Loyer ou mensualité de crédit', on:true, a:780, p:1 },
      { l:'Charges de copropriété', on:false, a:0, p:1 },
      { l:'Assurance habitation', on:true, a:180, p:12 },
      { l:'Taxe foncière', on:false, a:0, p:12 }
    ]},
    { n:'Énergie & eau', ic:'bolt', g:'linear-gradient(135deg,#FBBF24,#FF7A45)', items:[
      { l:'Électricité', on:true, a:65, p:1 },
      { l:'Gaz ou fioul', on:false, a:0, p:1 },
      { l:'Eau', on:true, a:90, p:3 }
    ]},
    { n:'Télécom & numérique', ic:'wifi', g:'linear-gradient(135deg,#8CC7F0,#4DA8FF)', items:[
      { l:'Internet', on:true, a:32, p:1 },
      { l:'Forfait mobile', on:true, a:15, p:1 },
      { l:'Stockage cloud, logiciels', on:false, a:0, p:1 }
    ]},
    { n:'Transport', ic:'directions_car', g:'linear-gradient(135deg,#A78BE8,#8CC7F0)', items:[
      { l:'Crédit auto ou leasing', on:false, a:0, p:1 },
      { l:'Assurance véhicule', on:true, a:420, p:12 },
      { l:'Abonnement transports', on:true, a:75, p:1 },
      { l:'Stationnement, péage', on:false, a:0, p:1 }
    ]},
    { n:'Santé & prévoyance', ic:'health_and_safety', g:'linear-gradient(135deg,#F472B6,#A855F7)', items:[
      { l:'Mutuelle santé', on:true, a:48, p:1 },
      { l:'Prévoyance', on:false, a:0, p:1 },
      { l:'Assurance emprunteur', on:false, a:0, p:1 }
    ]},
    { n:'Crédits & engagements', ic:'account_balance', g:'linear-gradient(135deg,#FF7A45,#EC4899)', items:[
      { l:'Crédit consommation', on:false, a:0, p:1 },
      { l:'Prêt étudiant', on:false, a:0, p:1 },
      { l:'Pension alimentaire', on:false, a:0, p:1 }
    ]},
    { n:'Engagements du quotidien', ic:'family_restroom', g:'linear-gradient(135deg,#22B4C4,#7C5CFF)', items:[
      { l:'Garde d\'enfants, crèche', on:false, a:0, p:1 },
      { l:'Frais de scolarité', on:false, a:0, p:1 },
      { l:'Salle de sport, activités', on:true, a:29, p:1 },
      { l:'Streaming, presse', on:true, a:22, p:1 }
    ]},
    { n:'Impôts mensualisés', ic:'receipt_long', g:'linear-gradient(135deg,#FBBF24,#F472B6)', items:[
      { l:'Impôt sur le revenu', on:false, a:0, p:1 },
      { l:'Autres taxes', on:false, a:0, p:1 }
    ]}
  ];
  var PER = [ { v:1, l:'par mois' }, { v:3, l:'par trimestre' }, { v:12, l:'par an' } ];
  var open = {};
  var eur = function (n) { return Math.round(n).toLocaleString('fr-FR') + ' €'; };
  var $ = function (id) { return document.getElementById(id); };
  var monthly = function (it) { return it.on ? (it.a || 0) / it.p : 0; };
  var catTotal = function (c) { return c.items.reduce(function (s,i) { return s + monthly(i); }, 0); };

  function render() {
    box.innerHTML = '';
    CATS.forEach(function (c, ci) {
      var sub = catTotal(c);
      var count = c.items.filter(function (i) { return i.on && i.a > 0; }).length;
      var card = document.createElement('div');
      card.className = 'chg-card';
      card.style.cssText = 'padding:0;overflow:hidden;';

      var head = document.createElement('button');
      head.type = 'button';
      head.setAttribute('aria-expanded', open[ci] ? 'true' : 'false');
      head.style.cssText = 'width:100%;display:flex;align-items:center;gap:15px;padding:18px 24px;background:none;text-align:left;color:var(--ink);';
      head.innerHTML =
        '<span style="width:44px;height:44px;flex:none;border-radius:15px;background:' + c.g + ';display:flex;align-items:center;justify-content:center;color:#fff;"><span class="ic" style="font-size:23px;">' + c.ic + '</span></span>' +
        '<span style="flex:1;min-width:120px;"><b style="font-size:16.5px;">' + c.n + '</b>' +
          '<span style="display:block;font-size:12.5px;color:var(--ink2);margin-top:2px;">' + (count ? count + ' ligne' + (count>1?'s':'') + ' renseignée' + (count>1?'s':'') : 'rien de renseigné') + '</span></span>' +
        '<b class="mono" style="font-size:15px;">' + eur(sub) + '</b>' +
        '<span class="mono" style="font-size:12px;color:var(--ink2);">/mois</span>' +
        '<span class="ic" style="font-size:25px;color:var(--ink2);flex:none;">' + (open[ci] ? 'expand_less' : 'expand_more') + '</span>';
      head.addEventListener('click', function () { open[ci] = !open[ci]; render(); });
      card.appendChild(head);

      if (open[ci]) {
        var body = document.createElement('div');
        body.style.cssText = 'padding:0 24px 20px;display:flex;flex-direction:column;gap:9px;';
        c.items.forEach(function (it) {
          var row = document.createElement('div');
          row.style.cssText = 'display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:10px 13px;border-radius:14px;background:var(--soft);' + (it.on ? '' : 'opacity:.55;');

          var chk = document.createElement('button');
          chk.type = 'button';
          chk.setAttribute('role','checkbox');
          chk.setAttribute('aria-checked', it.on ? 'true' : 'false');
          chk.setAttribute('aria-label', it.l);
          chk.style.cssText = 'width:26px;height:26px;flex:none;border-radius:8px;display:flex;align-items:center;justify-content:center;' +
            (it.on ? 'background:linear-gradient(135deg,#34D399,#22B4C4);color:#fff;' : 'background:var(--field);border:1.5px solid var(--line);color:transparent;');
          chk.innerHTML = '<span class="ic" style="font-size:17px;">check</span>';
          chk.addEventListener('click', function () { it.on = !it.on; render(); });
          row.appendChild(chk);

          var lab = document.createElement('span');
          lab.style.cssText = 'flex:1;min-width:160px;font-size:14.5px;';
          lab.textContent = it.l;
          row.appendChild(lab);

          var inp = document.createElement('input');
          inp.className = 'fld'; inp.value = it.a; inp.setAttribute('inputmode','decimal');
          inp.setAttribute('aria-label', 'Montant — ' + it.l);
          inp.disabled = !it.on;
          inp.addEventListener('input', function () { it.a = parseFloat(inp.value) || 0; refresh(); });
          row.appendChild(inp);

          var e = document.createElement('span'); e.className = 'mono'; e.textContent = '€';
          e.style.cssText = 'font-size:13px;color:var(--ink2);';
          row.appendChild(e);

          var sel = document.createElement('select');
          sel.className = 'sel';
          sel.setAttribute('aria-label', 'Fréquence — ' + it.l);
          sel.disabled = !it.on;
          PER.forEach(function (p) {
            var o = document.createElement('option');
            o.value = p.v; o.textContent = p.l; if (p.v === it.p) o.selected = true;
            sel.appendChild(o);
          });
          sel.addEventListener('change', function () { it.p = parseInt(sel.value, 10); render(); });
          row.appendChild(sel);

          var per = document.createElement('span');
          per.className = 'mono';
          per.style.cssText = 'min-width:86px;text-align:right;font-size:12.5px;color:var(--ink2);';
          per.textContent = it.p === 1 ? '' : '= ' + eur(monthly(it)) + '/m';
          row.appendChild(per);

          body.appendChild(row);
        });

        var add = document.createElement('button');
        add.type = 'button';
        add.style.cssText = 'align-self:flex-start;margin-top:4px;display:inline-flex;align-items:center;gap:7px;padding:10px 16px;min-height:44px;border-radius:12px;background:var(--surface);color:var(--ink);font-size:13.5px;font-weight:600;box-shadow:0 10px 22px -14px rgba(90,60,120,.5);';
        add.innerHTML = '<span class="ic" style="font-size:18px;color:#C77F13;">add</span>Ajouter une ligne';
        add.addEventListener('click', function () { c.items.push({ l:'Nouvelle charge', on:true, a:0, p:1 }); render(); });
        body.appendChild(add);

        card.appendChild(body);
      }
      box.appendChild(card);
    });
    refresh();
  }

  function refresh() {
    var total = CATS.reduce(function (s,c) { return s + catTotal(c); }, 0);
    var n = CATS.reduce(function (s,c) { return s + c.items.filter(function (i) { return i.on && i.a > 0; }).length; }, 0);
    if ($('grandTotal')) $('grandTotal').textContent = eur(total);
    if ($('totalHint')) $('totalHint').textContent = 'soit ' + eur(total * 12) + ' par an · ' + n + ' ligne' + (n > 1 ? 's' : '') + ' comptée' + (n > 1 ? 's' : '');
  }

  open[0] = true;
  render();

  var mq = window.matchMedia('(max-width: 720px)');
  var respond = function () { var g = $('defGrid'); if (g) g.style.gridTemplateColumns = mq.matches ? '1fr' : '1fr 1fr'; };
  if (mq.addEventListener) { mq.addEventListener('change', respond); } else { mq.addListener(respond); }
  respond();

  var rep = $('reportBtn');
  if (rep) rep.addEventListener('click', function () {
    var total = CATS.reduce(function (s,c) { return s + catTotal(c); }, 0);
    try {
      var t = String(Math.round(total));
      localStorage.setItem('cosmos-charges', t);
      /* on garde le total calculé à part : si Mon budget type est ensuite saisi à la
         main, on pourra toujours proposer d'y revenir. */
      localStorage.setItem('cosmos-charges-calcule', t);
      localStorage.setItem('cosmos-charges-source', 'calcule');
    } catch (e) {}
    rep.innerHTML = '<span class="ic" style="font-size:19px;">check</span>Reporté (' + eur(total) + ')';
    setTimeout(function () { rep.innerHTML = '<span class="ic" style="font-size:19px;">north</span>Reporter dans Mon budget type'; }, 2200);
  });
})();
