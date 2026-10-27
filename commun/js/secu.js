// « Combien pour ton épargne de sécurité ? » — interactif.
// 3 mois de base + les points de la réponse choisie à chaque question = nb de
// mois. Si on saisit les dépenses mensuelles, on affiche le montant cible en €.
(function () {
  const bloc = document.querySelector('.secu');
  if (!bloc) return;
  const CLE = 'cosmos-secu';
  const champDep = bloc.querySelector('[data-depenses]');

  const fmt = n => Math.round(n).toLocaleString('fr-FR');

  function calc() {
    let mois = 3;
    bloc.querySelectorAll('.secu-critere').forEach(c => {
      const sel = c.querySelector('.secu-opt.on');
      if (sel) mois += Number(sel.dataset.pts) || 0;
    });
    bloc.querySelector('.secu-mois').textContent = mois;
    const dep = Math.max(0, Number(champDep.value) || 0);
    bloc.querySelector('.secu-euro').textContent =
      dep > 0 ? ' de dépenses courantes, soit environ ' + fmt(mois * dep) + ' €' : ' de dépenses courantes';
    try {
      const choix = [].map.call(bloc.querySelectorAll('.secu-critere'), c => {
        const opts = [].slice.call(c.querySelectorAll('.secu-opt'));
        return opts.findIndex(o => o.classList.contains('on'));
      });
      localStorage.setItem(CLE, JSON.stringify({ dep: dep, choix: choix }));
    } catch (e) {}
  }

  bloc.querySelectorAll('.secu-critere').forEach(c => {
    c.querySelectorAll('.secu-opt').forEach(o => {
      o.addEventListener('click', () => {
        c.querySelectorAll('.secu-opt').forEach(x => x.classList.remove('on'));
        o.classList.add('on');
        calc();
      });
    });
  });
  champDep.addEventListener('input', calc);

  // restauration des choix précédents
  try {
    const s = JSON.parse(localStorage.getItem(CLE) || 'null');
    if (s) {
      if (s.dep) champDep.value = s.dep;
      if (Array.isArray(s.choix)) bloc.querySelectorAll('.secu-critere').forEach((c, i) => {
        const opts = [].slice.call(c.querySelectorAll('.secu-opt'));
        const idx = s.choix[i];
        if (idx != null && opts[idx]) {
          opts.forEach(x => x.classList.remove('on'));
          opts[idx].classList.add('on');
        }
      });
    }
  } catch (e) {}
  calc();
})();
