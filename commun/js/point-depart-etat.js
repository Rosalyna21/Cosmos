/* ============================================================
   COSMOS — L'ÉTAT PARTAGÉ DE « POINT DE DÉPART »

   Un seul objet JSON dans le navigateur, sous la clé 'cosmos-point-depart'.
   Deux écrans y touchent : l'onglet Point de départ (/budget/) et
   la page Le mur (/budget/mur/). D'où la règle de ce fichier :

     ON N'ÉCRIT JAMAIS L'OBJET ENTIER.

   On relit ce qu'il y a, on pose SES clés dessus, on réenregistre.
   Sinon un écran efface ce que l'autre vient d'écrire.

   Utilisation :
     const o = PDEtat.lire();                   // l'objet complet
     PDEtat.ecrire({ defis: d }, 'le-mur');     // ne touche QUE 'defis'
     PDEtat.surChangement((cles, source) => …); // rappelé quand ça bouge

   Le deuxième argument d'ecrire() dit qui écrit. Un écran qui se
   redessine déjà tout seul ignore ses propres écritures : sinon il se
   reconstruit sous les doigts de l'utilisatrice pendant qu'elle tape.

   Rien ne part sur un serveur : tout reste dans ce navigateur, et
   « Mes données » sait exporter cette clé comme les autres.
   ============================================================ */

const PDEtat = (function () {
  const CLE = 'cosmos-point-depart';
  const ECOUTEURS = [];

  const lire = () => {
    try { return JSON.parse(localStorage.getItem(CLE)) || {}; }
    catch (e) { return {}; }
  };

  const ecrire = (patch, source) => {
    const o = lire();
    Object.keys(patch || {}).forEach(k => { o[k] = patch[k]; });
    try { localStorage.setItem(CLE, JSON.stringify(o)); } catch (e) {}
    /* prévenir les autres modules de CETTE page (l'événement 'storage'
       du navigateur ne se déclenche que dans les AUTRES onglets) */
    try {
      window.dispatchEvent(new CustomEvent('cosmos-pd', { detail: { cles: Object.keys(patch || {}), source: source || null } }));
    } catch (e) {}
    return o;
  };

  const prevenir = (cles, source) => ECOUTEURS.forEach(f => { try { f(cles, source || null); } catch (e) {} });

  window.addEventListener('storage', (e) => {
    if (e.key && e.key !== CLE) return;   // une autre clé du site : pas notre affaire
    prevenir(null, null);                  // on ne sait pas quoi a changé : tout relire
  });
  window.addEventListener('cosmos-pd', (e) => prevenir((e.detail || {}).cles, (e.detail || {}).source));

  const surChangement = (fn) => { if (typeof fn === 'function') ECOUTEURS.push(fn); };

  /* Petit utilitaire de date, partagé : 'AAAA-MM-JJ' → 'JJ/MM/AAAA' */
  const jour = (s) => {
    if (!s) return '';
    const p = String(s).split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : s;
  };
  const aujourdhui = () => new Date().toISOString().slice(0, 10);

  return { CLE, lire, ecrire, surChangement, jour, aujourdhui };
})();
