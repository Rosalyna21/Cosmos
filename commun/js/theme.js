/* Cosmos — bascule jour/nuit + icônes d'état + slicers */
(function () {
  var saved = localStorage.getItem('cosmos-theme');
  if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('pre-dark');
  }

  function estNuit() { return document.body.classList.contains('dark'); }

  function syncTheme() {
    var nuit = estNuit();
    document.querySelectorAll('.state-ico').forEach(function (el) {
      el.textContent = nuit ? el.dataset.night : el.dataset.day;
    });
    var lbl = document.getElementById('themeLabel');
    var ic = document.getElementById('themeIcon');
    if (lbl) lbl.textContent = nuit ? 'Mode jour' : 'Mode nuit';
    if (ic) ic.textContent = nuit ? 'wb_sunny' : 'dark_mode';
  }

  function initSlicer(sl) {
    var ind = sl.querySelector('.ind');
    var boutons = Array.prototype.slice.call(sl.querySelectorAll('button'));
    var portee = sl.dataset.slicer; /* sélecteur des sections filtrables */

    function caler() {
      var actif = sl.querySelector('button.on');
      if (!actif || !ind) return;
      ind.style.left = actif.offsetLeft + 'px';
      ind.style.width = actif.offsetWidth + 'px';
    }

    function filtrer(cible) {
      if (!portee) return;
      document.querySelectorAll(portee).forEach(function (sec) {
        var visible = cible === 'all' || sec.dataset.group === cible;
        if (visible) {
          sec.classList.remove('masque');
          requestAnimationFrame(function () { sec.style.opacity = '1'; });
        } else {
          sec.style.opacity = '0';
          setTimeout(function () { sec.classList.add('masque'); }, 260);
        }
      });
    }

    boutons.forEach(function (b) {
      b.addEventListener('click', function () {
        boutons.forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        caler();
        filtrer(b.dataset.target);
      });
    });

    caler();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(caler);
    if (window.ResizeObserver) new ResizeObserver(caler).observe(sl);
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (document.documentElement.classList.contains('pre-dark')) document.body.classList.add('dark');
    syncTheme();
    var btn = document.getElementById('themeToggle');
    if (btn) btn.addEventListener('click', function () {
      document.body.classList.toggle('dark');
      localStorage.setItem('cosmos-theme', estNuit() ? 'dark' : 'light');
      syncTheme();
    });
    document.querySelectorAll('[data-slicer]').forEach(initSlicer);
  });
})();
