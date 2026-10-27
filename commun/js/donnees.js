// Sauvegarde / restauration des données Cosmos (100 % local).
// Exporte tout ce qui est stocké sous la clé « cosmos… » du localStorage,
// en JSON (sauvegarde complète ré-importable) ou en CSV (lisible tableur).
(function () {
  const root = document.querySelector("[data-donnees]");
  if (!root) return;
  const statut = root.querySelector("[data-statut]");
  const PREFIXE = "cosmos";
  const NOMS = {
    "cosmos-secu": "Épargne de sécurité",
    "cosmos-repartition-situation": "Répartition — Ma situation",
    "cosmos-repartition-objectif": "Répartition — Mon objectif",
    "cosmos-projets-situation": "Mes projets",
    "cosmos-budget": "Répartir mon revenu",
    "cosmos-point-depart": "Point de départ (valeurs, repères, défis…)",
    "cosmos-charges": "Charges fixes — montant mensuel",
  };

  function collecte() {
    const o = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.indexOf(PREFIXE) === 0) o[k] = localStorage.getItem(k);
    }
    return o;
  }
  function horodatage() {
    const d = new Date(), p = n => String(n).padStart(2, "0");
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }
  function telecharger(nom, contenu, type) {
    const blob = new Blob([contenu], { type: type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = nom;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }
  function dire(msg, err) { statut.textContent = msg; statut.classList.toggle("err", !!err); }

  function champCSV(s) {
    s = String(s);
    return /[";\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function aplatir(rubrique, chemin, val, out) {
    if (val && typeof val === "object") {
      Object.keys(val).forEach(k => aplatir(rubrique, chemin ? chemin + " › " + k : k, val[k], out));
    } else {
      out.push([rubrique, chemin, val === null ? "" : String(val)]);
    }
  }

  /* ------------------------------------------------------------
     L'inventaire : une ligne par rubrique, avec son volume.
     « Point de départ » est détaillé sous-clé par sous-clé, sinon on
     ne voit pas que les repères retenus et les défis sont là-dedans.
     ------------------------------------------------------------ */
  const DETAIL_PD = [
    ["valeurs",   "Mes valeurs, dans l'ordre",     v => v.length + " sur 3"],
    ["repSel",    "Repères retenus",               v => v.length + (v.length > 1 ? " retenus" : " retenu")],
    ["repCustom", "Mes propres repères",           v => v.length],
    ["defis",     "Défis relevés sur Le mur",      v => v.filter(d => !d.arch).length + " en cours · " + v.filter(d => d.arch).length + " archivés"],
    ["mq",        "Réponses sur mon rapport à l'argent", v => v.filter(x => x !== null).length + " sur " + v.length],
    ["alloc",     "Où va mon argent aujourd'hui",    v => Object.keys(v).filter(k => v[k] > 0).length + " ligne(s)"],
    ["allocObj",  "Où je voudrais qu'il aille",   v => Object.keys(v).filter(k => v[k] > 0).length + " ligne(s)"],
    ["assume",    "Écarts assumés",                v => v.length],
  ];

  function volume(cle, brut) {
    let v; try { v = JSON.parse(brut); } catch (e) { return String(brut).slice(0, 40); }
    if (Array.isArray(v)) return v.length + " élément(s)";
    if (v && typeof v === "object") return Object.keys(v).length + " champ(s)";
    return String(v);
  }

  function renderInventaire() {
    const zone = document.querySelector("[data-inventaire]");
    if (!zone) return;
    const data = collecte();
    const cles = Object.keys(data).sort();
    if (!cles.length) {
      zone.innerHTML = '<p class="dn-statut">Rien d\'enregistré pour l\'instant : Cosmos n\'écrit que ce que tu saisis.</p>';
      return;
    }
    const ligne = (nom, vol, petit) =>
      '<div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;padding:' + (petit ? '5px 0 5px 22px' : '10px 0') + ';' +
        (petit ? '' : 'border-top:1px solid var(--line);') + '">' +
        '<span style="flex:1;min-width:180px;font-size:' + (petit ? '13px' : '14.5px') + ';' + (petit ? 'color:var(--ink2);' : '') + '">' + nom + '</span>' +
        '<span class="mono" style="font-size:12.5px;color:var(--ink2);">' + vol + '</span></div>';

    zone.innerHTML = cles.map(k => {
      let bloc = ligne(NOMS[k] || k, volume(k, data[k]));
      if (k === "cosmos-point-depart") {
        let o; try { o = JSON.parse(data[k]) || {}; } catch (e) { o = {}; }
        bloc += DETAIL_PD.map(([sous, nom, fmt]) => {
          const v = o[sous];
          if (v === undefined || v === null) return "";
          try { return ligne(nom, fmt(v), true); } catch (e) { return ""; }
        }).join("");
      }
      return bloc;
    }).join("") +
      '<p class="dn-note" style="margin-top:16px;">Tout ceci vit dans ce navigateur, et nulle part ailleurs. La sauvegarde ci-dessous emporte l\'ensemble.</p>';
  }
  renderInventaire();

  root.querySelector("[data-export-json]").addEventListener("click", () => {
    const data = collecte();
    if (!Object.keys(data).length) return dire("Rien à sauvegarder pour l'instant.", true);
    const paquet = { appli: "Cosmos", type: "sauvegarde", version: 1, date: new Date().toISOString(), donnees: data };
    telecharger("cosmos-sauvegarde-" + horodatage() + ".json", JSON.stringify(paquet, null, 2), "application/json");
    dire(Object.keys(data).length + " rubrique(s) exportée(s) en JSON.");
  });

  root.querySelector("[data-export-csv]").addEventListener("click", () => {
    const data = collecte();
    if (!Object.keys(data).length) return dire("Rien à exporter pour l'instant.", true);
    const lignes = [["Rubrique", "Champ", "Valeur"]];
    Object.keys(data).forEach(k => {
      let val; try { val = JSON.parse(data[k]); } catch (e) { val = data[k]; }
      aplatir(NOMS[k] || k, "", val, lignes);
    });
    const csv = "﻿" + lignes.map(r => r.map(champCSV).join(";")).join("\r\n");
    telecharger("cosmos-donnees-" + horodatage() + ".csv", csv, "text/csv;charset=utf-8");
    dire("Données exportées en CSV (séparateur point-virgule, pour Excel).");
  });

  root.querySelector("[data-import]").addEventListener("change", e => {
    const f = e.target.files[0];
    if (!f) return;
    const lecteur = new FileReader();
    lecteur.onload = () => {
      try {
        const p = JSON.parse(lecteur.result);
        const d = p && p.donnees ? p.donnees : p;
        if (!d || typeof d !== "object") throw new Error("format");
        const cles = Object.keys(d).filter(k => k.indexOf(PREFIXE) === 0);
        if (!cles.length) throw new Error("vide");
        if (!confirm("Importer cette sauvegarde remplacera tes données actuelles. Continuer ?")) { e.target.value = ""; return; }
        cles.forEach(k => localStorage.setItem(k, typeof d[k] === "string" ? d[k] : JSON.stringify(d[k])));
        dire("Sauvegarde importée ✓ — rechargement…");
        setTimeout(() => location.reload(), 800);
      } catch (err) {
        dire("Fichier invalide : ce fichier ne ressemble pas à une sauvegarde Cosmos.", true);
      }
      e.target.value = "";
    };
    lecteur.readAsText(f);
  });

  root.querySelector("[data-effacer]").addEventListener("click", () => {
    const data = collecte();
    if (!Object.keys(data).length) return dire("Il n'y a aucune donnée à effacer.", true);
    if (!confirm("Effacer TOUTES tes données Cosmos de ce navigateur ? Cette action est définitive.")) return;
    Object.keys(data).forEach(k => localStorage.removeItem(k));
    renderInventaire();
    dire("Toutes tes données ont été effacées de ce navigateur.");
  });
})();
