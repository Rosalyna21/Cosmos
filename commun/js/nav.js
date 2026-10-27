/* ============================================================
   COSMOS — barre de navigation partagée, avec menus déroulants.
   Tout est dérivé de CHEMIN (commun/js/projects.js).

   Utilisation dans une page :
     <body data-nav="Finances">              ← onglet à marquer actif
     ...
     <div class="nav-pills"></div>           ← sera rempli par ce script
     <script src="../commun/js/projects.js"></script>
     <script src="../commun/js/nav.js"></script>

   data-nav accepte le nom d'une section de CHEMIN, "Accueil", ou rien
   (pages annexes comme « Mes données » : aucun onglet n'est actif).
   Les chemins sont calculés tout seuls à partir de l'adresse de ce script,
   la page peut donc se trouver à n'importe quelle profondeur.
   ============================================================ */

(function () {
  if (typeof CHEMIN === "undefined") return;

  /* Racine du site, déduite de l'adresse de ce script */
  const BASE = document.currentScript.src.replace(/commun\/js\/nav\.js.*$/, "");
  const actif = document.body.dataset.nav || "";

  const pills = document.querySelector(".nav-pills");
  if (!pills) return;
  pills.innerHTML = "";

  const nav = pills.closest(".nav");
  if (nav) nav.classList.add("nav-menus");

  /* --- Onglet Accueil (sans panneau) --- */
  const accueil = document.createElement("a");
  accueil.href = BASE + "index.html";
  accueil.textContent = "Accueil";
  if (actif === "Accueil") accueil.className = "actif";
  pills.appendChild(accueil);

  /* --- Un onglet par section, avec son panneau --- */
  CHEMIN.forEach(section => {
    const faits = section.gares.filter(g => g.etat === "fait");
    const encours = section.gares.filter(g => g.etat === "encours").map(g => g.long || g.label);
    const avenir = section.gares.filter(g => g.etat === "avenir").length;
    const suite = encours.length
      ? "En chantier : " + encours.join(" · ")
      : avenir
      ? avenir + " chose" + (avenir > 1 ? "s" : "") + " en préparation"
      : "Rien en chantier pour le moment";

    const item = document.createElement("span");
    item.className = "navitem";
    item.innerHTML = `
      <a href="${BASE}${section.lien}"${section.nom === actif ? ' class="actif"' : ""}>${section.nom}</a>
      <span class="navpanel">
        <span class="titre">${section.nom.toUpperCase()}</span>
        ${faits.map(g => `
          <a class="mline" href="${BASE}${g.lien || section.lien}">
            <b>${g.label}</b>
            ${g.quoi ? `<span>${g.quoi}</span>` : ""}
          </a>`).join("")}
        <span class="suite">
          <span class="material-symbols-rounded dayonly" aria-hidden="true">potted_plant</span>
          <span class="material-symbols-rounded nightonly" aria-hidden="true">blur_on</span>${suite}
        </span>
      </span>`;
    pills.appendChild(item);
  });

  /* --- Équivalent tactile : 1er appui = ouvrir, 2e = suivre le lien --- */
  if (window.matchMedia("(hover: none)").matches) {
    pills.querySelectorAll(".navitem > a").forEach(lien => {
      lien.addEventListener("click", e => {
        const item = lien.parentElement;
        if (!item.classList.contains("ouvert")) {
          e.preventDefault();
          pills.querySelectorAll(".navitem.ouvert").forEach(x => x.classList.remove("ouvert"));
          item.classList.add("ouvert");
        }
      });
    });
    document.addEventListener("click", e => {
      if (!e.target.closest(".navitem")) {
        pills.querySelectorAll(".navitem.ouvert").forEach(x => x.classList.remove("ouvert"));
      }
    });
  }

  /* --- Fond de la barre au défilement (si elle est collante) --- */
  if (nav && nav.classList.contains("nav-sticky")) {
    const maj = () => nav.classList.toggle("collee", window.scrollY > 16);
    maj();
    window.addEventListener("scroll", maj, { passive: true });
  }
})();
