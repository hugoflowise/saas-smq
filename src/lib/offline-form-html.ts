/**
 * Générateur du fichier de formulaire « hors-ligne » : une page HTML autonome
 * (CSS + JS inline, aucune dépendance réseau) que le manager télécharge une fois
 * puis ouvre chez le client sans connexion. La définition du formulaire y est
 * embarquée avec son numéro de version ; les réponses saisies sont stockées en
 * local (localStorage), puis synchronisées au retour du réseau (étape B).
 *
 * `buildOfflineFormHtml` est volontairement une fonction pure (aucun accès
 * serveur) pour rester testable.
 */

import type { SectionConfig } from "@/lib/suivi-consultant";

export type OfflineFormConfig = {
  type: "suivi_consultant" | "suivi_prestation";
  titre: string;
  sections: SectionConfig[];
  /** Version du modèle personnalisé, ou null si modèle par défaut. */
  version: number | null;
  token: string;
  nomSociete: string;
  logoUrl: string | null;
  /** Date de génération au format ISO (AAAA-MM-JJ), injectée par l'appelant. */
  genereLe: string;
  /** URL absolue de l'endpoint de synchronisation (étape B). */
  syncEndpoint: string;
};

/** Échappe une chaîne pour une insertion sûre dans du HTML. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Sérialise un objet en JSON insérable dans une balise <script> sans risque de
 * fermeture prématurée (`</script>`) ni d'injection.
 */
function safeJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function buildOfflineFormHtml(config: OfflineFormConfig): string {
  const { type, titre, sections, version, token, nomSociete, logoUrl, genereLe, syncEndpoint } =
    config;

  // Config embarquée, lue par le script client.
  const embedded = safeJson({ type, titre, sections, version, token, nomSociete, syncEndpoint });
  const versionLabel = version != null ? `modèle v${version}` : "modèle standard";

  const logoTag = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(nomSociete)}" class="logo" />`
    : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(titre)} (hors-ligne) · ${escapeHtml(nomSociete)}</title>
<style>
  :root { --primary:#2563eb; --border:#e2e8f0; --muted:#64748b; --bg:#f8fafc; --card:#fff; --danger:#dc2626; --ok:#16a34a; }
  * { box-sizing:border-box; }
  body { margin:0; font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; background:var(--bg); color:#0f172a; line-height:1.5; }
  .wrap { max-width:720px; margin:0 auto; padding:24px 16px 80px; }
  .card { background:var(--card); border:1px solid var(--border); border-radius:20px; padding:28px; box-shadow:0 1px 3px rgba(0,0,0,.05); }
  .head { text-align:center; margin-bottom:24px; }
  .logo { height:40px; width:auto; margin-bottom:12px; }
  h1 { font-size:20px; margin:0 0 4px; }
  .sub { color:var(--muted); font-size:14px; margin:0; }
  .badges { display:flex; gap:8px; justify-content:center; flex-wrap:wrap; margin-top:10px; }
  .badge { font-size:12px; background:var(--bg); border:1px solid var(--border); border-radius:999px; padding:3px 10px; color:var(--muted); }
  .offline { display:none; background:#fef3c7; border:1px solid #fde68a; color:#92400e; border-radius:12px; padding:10px 14px; font-size:13px; margin-bottom:16px; text-align:center; }
  body.is-offline .offline { display:block; }
  section { border-top:1px solid var(--border); padding-top:24px; margin-top:24px; }
  section:first-of-type { border-top:0; padding-top:0; margin-top:0; }
  h2 { font-size:16px; margin:0 0 16px; }
  h2 .n { color:var(--muted); }
  .field { margin-bottom:18px; }
  label.q { display:block; font-weight:500; font-size:14px; margin-bottom:6px; }
  .req { color:var(--danger); }
  input[type=text], input[type=email], input[type=date], textarea {
    width:100%; border:1px solid var(--border); border-radius:10px; padding:9px 11px; font:inherit; background:#fff;
  }
  textarea { resize:vertical; min-height:70px; }
  input:focus, textarea:focus { outline:2px solid var(--primary); outline-offset:0; border-color:var(--primary); }
  .opts { display:flex; flex-wrap:wrap; gap:8px 16px; font-size:14px; }
  .opts.grid { display:grid; grid-template-columns:1fr 1fr; }
  .opt { display:flex; align-items:center; gap:8px; }
  .scale { display:flex; flex-wrap:wrap; gap:6px; }
  .scale button { width:38px; height:38px; border:1px solid var(--border); background:#fff; border-radius:10px; font:inherit; font-weight:500; cursor:pointer; }
  .scale button.on { background:var(--primary); border-color:var(--primary); color:#fff; }
  .matrice { display:flex; flex-direction:column; gap:10px; }
  .matrice .row { display:flex; flex-direction:column; gap:6px; border:1px solid var(--border); border-radius:10px; padding:10px; }
  .matrice .row > span { font-size:13px; }
  .btn { width:100%; border:0; background:var(--primary); color:#fff; font:inherit; font-weight:600; padding:12px; border-radius:12px; cursor:pointer; margin-top:8px; }
  .btn:disabled { opacity:.6; cursor:default; }
  .btn.sec { background:#fff; color:#0f172a; border:1px solid var(--border); font-weight:500; }
  .err { color:var(--danger); font-size:14px; margin-top:12px; }
  .foot { text-align:center; color:var(--muted); font-size:12px; margin-top:16px; }
  .queue { margin-top:20px; }
  .queue h3 { font-size:14px; margin:0 0 8px; }
  .qitem { display:flex; justify-content:space-between; align-items:center; gap:10px; border:1px solid var(--border); border-radius:10px; padding:8px 12px; font-size:13px; margin-bottom:8px; background:#fff; }
  .qitem .st { color:var(--muted); font-size:12px; }
  .qitem .st.pending { color:#92400e; }
  .qitem .st.sending { color:var(--primary); }
  .qitem .st.sent { color:var(--ok); }
  .done { text-align:center; padding:32px 0; }
  .done .check { width:48px; height:48px; border-radius:999px; background:rgba(22,163,74,.15); color:var(--ok); font-size:24px; display:flex; align-items:center; justify-content:center; margin:0 auto 12px; }
  .link { background:none; border:0; color:var(--primary); cursor:pointer; font:inherit; text-decoration:underline; padding:0; }
  @media(max-width:480px){ .opts.grid{ grid-template-columns:1fr; } }
</style>
</head>
<body>
<div class="wrap">
  <div class="card">
    <div class="offline">Vous êtes hors-ligne. Vos réponses sont enregistrées sur cet ordinateur et seront envoyées au retour d'Internet.</div>
    <div class="head">
      ${logoTag}
      <h1>${escapeHtml(titre)}</h1>
      <p class="sub">${escapeHtml(nomSociete)}</p>
      <div class="badges">
        <span class="badge">Formulaire hors-ligne</span>
        <span class="badge">${escapeHtml(versionLabel)}</span>
        <span class="badge">téléchargé le ${escapeHtml(genereLe)}</span>
      </div>
    </div>
    <div id="app"></div>
  </div>
  <p class="foot">Ce fichier fonctionne sans connexion. Conservez-le sur votre ordinateur.</p>
</div>
<script id="cfg" type="application/json">${embedded}</script>
<script>
${OFFLINE_RUNTIME}
</script>
</body>
</html>`;
}

/**
 * Runtime JavaScript embarqué dans le fichier (vanilla, aucune dépendance).
 * Rendu du formulaire, logique showIf/multi/notes/matrice, validation, stockage
 * local et file d'attente de synchronisation.
 */
const OFFLINE_RUNTIME = String.raw`
(function () {
  var CFG = JSON.parse(document.getElementById("cfg").textContent);
  var QUEUE_KEY = "flowise_offline_queue_v1";
  var app = document.getElementById("app");

  // --- état de saisie (choix uniques + notes, pour showIf et validation) ---
  var singles = {};
  var notes = {};

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0, v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === "class") e.className = attrs[k];
      else if (k === "text") e.textContent = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    (children || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }

  function visible(c) { return !c.showIf || singles[c.showIf.key] === c.showIf.equals; }

  // --- rendu d'un champ ---
  function renderField(c) {
    var wrap = el("div", { class: "field", "data-key": c.key });
    var lab = el("label", { class: "q" });
    lab.innerHTML = escapeText(c.label) + (c.required ? ' <span class="req">*</span>' : "");
    wrap.appendChild(lab);

    if (c.type === "text" || c.type === "email") {
      wrap.appendChild(el("input", { type: c.type === "email" ? "email" : "text", name: c.key }));
    } else if (c.type === "date") {
      wrap.appendChild(el("input", { type: "date", name: c.key }));
    } else if (c.type === "textarea") {
      wrap.appendChild(el("textarea", { name: c.key, rows: "3" }));
    } else if (c.type === "single") {
      var box = el("div", { class: "opts" });
      (c.options || []).forEach(function (o) {
        var input = el("input", { type: "radio", name: c.key, value: o });
        input.addEventListener("change", function () { singles[c.key] = o; refreshVisibility(); });
        box.appendChild(el("label", { class: "opt" }, [input, document.createTextNode(o)]));
      });
      wrap.appendChild(box);
    } else if (c.type === "multi") {
      var grid = el("div", { class: "opts grid" });
      (c.options || []).forEach(function (o) {
        var cb = el("input", { type: "checkbox", name: c.key, value: o });
        grid.appendChild(el("label", { class: "opt" }, [cb, document.createTextNode(o)]));
      });
      wrap.appendChild(grid);
      if (c.allowAutre) wrap.appendChild(el("input", { type: "text", name: c.key + "_autre", placeholder: "Autre (préciser)" }));
    } else if (c.type === "note5" || c.type === "nps") {
      var min = c.type === "nps" ? 0 : 1, max = c.type === "nps" ? 10 : 5;
      wrap.appendChild(scale(c.key, min, max));
    } else if (c.type === "matrice" && c.lignes) {
      var mat = el("div", { class: "matrice" });
      var ech = c.echelle || { min: 1, max: 5 };
      c.lignes.forEach(function (ligne) {
        var row = el("div", { class: "row" }, [el("span", { text: ligne.label })]);
        row.appendChild(scale(c.key + "." + ligne.key, ech.min, ech.max));
        mat.appendChild(row);
      });
      wrap.appendChild(mat);
    }
    return wrap;
  }

  function scale(key, min, max) {
    var box = el("div", { class: "scale" });
    for (var n = min; n <= max; n++) {
      (function (val) {
        var b = el("button", { type: "button", text: String(val) });
        b.addEventListener("click", function () {
          notes[key] = val;
          Array.prototype.forEach.call(box.children, function (child) { child.classList.remove("on"); });
          b.classList.add("on");
        });
        box.appendChild(b);
      })(n);
    }
    return box;
  }

  function escapeText(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  // masque/affiche les champs conditionnels (showIf)
  function refreshVisibility() {
    CFG.sections.forEach(function (sec) {
      sec.champs.forEach(function (c) {
        var node = app.querySelector('.field[data-key="' + cssEscape(c.key) + '"]');
        if (node) node.style.display = visible(c) ? "" : "none";
      });
    });
  }
  function cssEscape(s) { return s.replace(/"/g, '\\"'); }

  // --- collecte des réponses ---
  function collect(form) {
    var r = {};
    CFG.sections.forEach(function (sec) {
      sec.champs.forEach(function (c) {
        if (!visible(c)) return;
        if (c.type === "single") {
          r[c.key] = singles[c.key] || "";
        } else if (c.type === "note5" || c.type === "nps") {
          r[c.key] = c.key in notes ? notes[c.key] : null;
        } else if (c.type === "matrice" && c.lignes) {
          var obj = {};
          c.lignes.forEach(function (l) { var k = c.key + "." + l.key; obj[l.key] = k in notes ? notes[k] : null; });
          r[c.key] = obj;
        } else if (c.type === "multi") {
          var vals = [];
          form.querySelectorAll('input[name="' + cssEscape(c.key) + '"]:checked').forEach(function (i) { vals.push(i.value); });
          r[c.key] = vals;
          if (c.allowAutre) { var a = form.querySelector('input[name="' + cssEscape(c.key + "_autre") + '"]'); r[c.key + "_autre"] = a ? a.value : ""; }
        } else {
          var f = form.querySelector('[name="' + cssEscape(c.key) + '"]');
          r[c.key] = f ? f.value : "";
        }
      });
    });
    return r;
  }

  function validate(r) {
    for (var i = 0; i < CFG.sections.length; i++) {
      var sec = CFG.sections[i];
      for (var j = 0; j < sec.champs.length; j++) {
        var c = sec.champs[j];
        if (!c.required || !visible(c)) continue;
        var v = r[c.key];
        var empty =
          (c.type === "multi" && (!v || v.length === 0)) ||
          ((c.type === "note5" || c.type === "nps") && v == null) ||
          (c.type !== "multi" && c.type !== "note5" && c.type !== "nps" && (v == null || v === ""));
        if (empty) return 'Merci de répondre : « ' + c.label + ' » (section ' + sec.n + ").";
      }
    }
    return null;
  }

  // --- file d'attente locale ---
  function readQueue() {
    try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]"); } catch (e) { return []; }
  }
  function writeQueue(q) { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); }

  function enqueue(reponses) {
    var q = readQueue();
    q.push({
      id: uuid(),
      type: CFG.type,
      token: CFG.token,
      modeleVersion: CFG.version,
      reponses: reponses,
      createdAt: new Date().toISOString(),
      status: "pending",
    });
    writeQueue(q);
    sync();
  }

  // --- synchronisation vers le serveur (au retour du réseau) ---
  var syncing = false;
  function sync() {
    if (syncing || !navigator.onLine) return;
    var q = readQueue();
    var pending = q.filter(function (i) { return i.status !== "sent"; });
    if (!pending.length) return;
    syncing = true;

    var i = 0;
    function next() {
      if (i >= pending.length) { syncing = false; renderQueue(); return; }
      var item = pending[i++];
      item.status = "sending";
      writeQueue(q);
      renderQueue();
      fetch(CFG.syncEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: item.token,
          reponses: item.reponses,
          modeleVersion: item.modeleVersion,
          idempotencyKey: item.id,
        }),
      })
        .then(function (res) { return res.ok ? res.json() : Promise.reject(new Error("HTTP " + res.status)); })
        .then(function (data) { item.status = data && data.ok ? "sent" : "pending"; })
        .catch(function () { item.status = "pending"; })
        .then(function () { writeQueue(q); renderQueue(); next(); });
    }
    next();
  }

  // --- vues ---
  function renderForm() {
    var form = el("form");
    CFG.sections.forEach(function (sec) {
      var s = el("section");
      var h = el("h2");
      h.innerHTML = '<span class="n">' + sec.n + ".</span> " + escapeText(sec.title);
      s.appendChild(h);
      sec.champs.forEach(function (c) { s.appendChild(renderField(c)); });
      form.appendChild(s);
    });
    var errBox = el("div");
    var submit = el("button", { class: "btn", type: "submit", text: "Enregistrer le suivi" });
    form.appendChild(errBox);
    form.appendChild(submit);
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      errBox.textContent = "";
      var r = collect(form);
      var msg = validate(r);
      if (msg) { errBox.className = "err"; errBox.textContent = msg; errBox.scrollIntoView({ block: "center" }); return; }
      enqueue(r);
      singles = {}; notes = {};
      renderDone();
    });
    app.innerHTML = "";
    app.appendChild(form);
    refreshVisibility();
    renderQueue();
  }

  function renderDone() {
    app.innerHTML = "";
    var d = el("div", { class: "done" });
    d.appendChild(el("div", { class: "check", text: "✓" }));
    d.appendChild(el("h2", { text: "Suivi enregistré sur cet ordinateur" }));
    var p = el("p", { class: "sub" });
    p.textContent = navigator.onLine
      ? "Transmission en cours…"
      : "Il sera transmis dès le retour d'Internet.";
    d.appendChild(p);
    var again = el("button", { class: "btn sec", type: "button", text: "Saisir un autre suivi" });
    again.addEventListener("click", renderForm);
    d.appendChild(again);
    app.appendChild(d);
    renderQueue();
  }

  function renderQueue() {
    var old = document.getElementById("queue");
    if (old) old.remove();
    var q = readQueue();
    if (!q.length) return;
    var nbPending = q.filter(function (i) { return i.status !== "sent"; }).length;
    var box = el("div", { class: "queue", id: "queue" });
    var titre = nbPending
      ? "Suivis enregistrés (" + q.length + ") · " + nbPending + " à transmettre"
      : "Suivis enregistrés (" + q.length + ") · tout est transmis";
    box.appendChild(el("h3", { text: titre }));
    var labels = { sent: "envoyé", sending: "envoi…", pending: navigator.onLine ? "à transmettre" : "en attente (hors-ligne)" };
    q.slice().reverse().forEach(function (item) {
      var when = new Date(item.createdAt).toLocaleString("fr-FR");
      var nom = (item.reponses && (item.reponses.nom || item.reponses.client)) || "Suivi";
      var st = item.status === "sent" ? "sent" : item.status === "sending" ? "sending" : "pending";
      var line = el("div", { class: "qitem" });
      line.appendChild(el("span", { text: nom + " · " + when }));
      line.appendChild(el("span", { class: "st " + st, text: labels[st] }));
      box.appendChild(line);
    });
    if (nbPending && navigator.onLine) {
      var retry = el("button", { class: "btn sec", type: "button", text: "Réessayer l'envoi maintenant" });
      retry.addEventListener("click", sync);
      box.appendChild(retry);
    }
    var exp = el("button", { class: "link", type: "button", text: "Exporter les réponses (fichier de secours)" });
    exp.addEventListener("click", exportQueue);
    box.appendChild(exp);
    app.appendChild(box);
  }

  function exportQueue() {
    var blob = new Blob([JSON.stringify(readQueue(), null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = CFG.type + "-reponses.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function setOfflineFlag() { document.body.classList.toggle("is-offline", !navigator.onLine); }
  window.addEventListener("online", function () { setOfflineFlag(); sync(); });
  window.addEventListener("offline", setOfflineFlag);
  setOfflineFlag();

  renderForm();
  sync();
})();
`;
