// « Répartir mon revenu » — règles de budget avec pourcentages ajustables.
// On choisit une règle (50/30/20, 6 comptes, …), on ajuste chaque catégorie,
// et si on saisit son revenu, on voit les montants. Mémorisé localement.
(function () {
  const bloc = document.querySelector('[data-budget]');
  if (!bloc) return;
  const CLE = 'cosmos-budget';
  const COULEURS = [['#34D399','#22B4C4'],['#FBBF24','#FF7A45'],['#A78BE8','#8CC7F0'],['#F472B6','#A855F7'],['#FF7A45','#EC4899'],['#38BDF8','#8CC7F0']];
  const PRESETS = {
    '50/30/20': [['Besoins',50],['Envies',30],['Épargne',20]],
    'jars':     [['Nécessités',55],['Liberté financière',10],['Épargne long terme',10],['Éducation',10],['Plaisirs',10],['Dons',5]],
    '70/20/10': [['Dépenses courantes',70],['Épargne',20],['Dettes / dons',10]],
    '80/20':    [['Reste à vivre',80],['Épargne',20]],
  };
  const eur = n => Math.round(n).toLocaleString('fr-FR') + ' €';

  let etat = { preset:'50/30/20', valeurs:null, revenu:0 };
  try { const s = JSON.parse(localStorage.getItem(CLE)||'null'); if (s && PRESETS[s.preset]) etat = s; } catch(e){}
  if (!Array.isArray(etat.valeurs) || etat.valeurs.length !== PRESETS[etat.preset].length)
    etat.valeurs = PRESETS[etat.preset].map(c => c[1]);

  const presetsEl = bloc.querySelector('.bg-presets');
  const revenuEl  = bloc.querySelector('[data-revenu]');
  const barEl     = bloc.querySelector('.bg-bar');
  const lignesEl  = bloc.querySelector('.bg-lignes');
  const totalEl   = bloc.querySelector('.bg-total');
  if (etat.revenu) revenuEl.value = etat.revenu;

  const cats = () => PRESETS[etat.preset];
  const sauver = () => { try { localStorage.setItem(CLE, JSON.stringify(etat)); } catch(e){} };

  function calc() {
    const c = cats();
    const total = etat.valeurs.reduce((a,b)=>a+(Number(b)||0),0);
    const rev = Math.max(0, Number(revenuEl.value)||0);
    etat.revenu = rev;
    barEl.innerHTML = '';
    c.forEach((cat,i)=>{
      const p = Number(etat.valeurs[i])||0;
      if (p<=0) return;
      const seg = document.createElement('div'); seg.className='seg';
      const col = COULEURS[i%COULEURS.length];
      seg.style.width = p+'%';
      seg.style.background = 'linear-gradient(135deg,'+col[0]+','+col[1]+')';
      seg.title = cat[0]+' '+Math.round(p)+' %';
      barEl.appendChild(seg);
    });
    lignesEl.querySelectorAll('.bg-euro').forEach((el,i)=>{
      el.textContent = rev>0 ? eur(rev*(Number(etat.valeurs[i])||0)/100) : '';
    });
    totalEl.querySelector('.tv').textContent = Math.round(total)+' %' + (rev>0 ? ' · '+eur(rev) : '');
    totalEl.classList.toggle('ok', Math.round(total)===100);
    sauver();
  }

  function rendre() {
    presetsEl.querySelectorAll('.bg-preset').forEach(b=>b.classList.toggle('on', b.dataset.preset===etat.preset));
    const c = cats();
    lignesEl.innerHTML = '';
    c.forEach((cat,i)=>{
      const col = COULEURS[i%COULEURS.length];
      const row = document.createElement('div'); row.className='bg-ligne';
      row.innerHTML = '<span class="pt" style="background:linear-gradient(135deg,'+col[0]+','+col[1]+')"></span>'
        + '<span class="lab"></span>'
        + '<span class="ctrl"><input type="number" min="0" max="100" step="1"> %</span>'
        + '<span class="bg-euro"></span>';
      row.querySelector('.lab').textContent = cat[0];
      const inp = row.querySelector('input');
      inp.value = etat.valeurs[i];
      inp.addEventListener('input', ()=>{ etat.valeurs[i] = Math.max(0, Number(inp.value)||0); calc(); });
      lignesEl.appendChild(row);
    });
    calc();
  }

  presetsEl.querySelectorAll('.bg-preset').forEach(b=>{
    b.addEventListener('click', ()=>{
      etat.preset = b.dataset.preset;
      etat.valeurs = PRESETS[etat.preset].map(x=>x[1]);
      rendre();
    });
  });
  revenuEl.addEventListener('input', calc);
  rendre();
})();
