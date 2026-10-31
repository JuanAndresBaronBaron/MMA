/* Frases de guerreros: una frase del día (la misma para todos ese día, recorre todas antes de repetir), un mazo
   de tarjetas que se pasan como en Tinder (derecha = guardar, izquierda = siguiente, arriba = compartir), las
   favoritas y una imagen 1080×1350 lista para historias o publicaciones. */
import * as S from "../store.js";
import {icon, toast, sheet} from "../ui.js";
import {esc} from "../util.js";
import {t, lang} from "../i18n.js";
import {FRASES, CATEGORIAS} from "../frases/data.js";

/* ---------- categorías ---------- */
const CAT = {
  disciplina: {n: "Disciplina", ic: "clock", g: ["#1f2937", "#ef3340"]},
  entrenamiento: {n: "Entrenamiento", ic: "fist", g: ["#7c2d12", "#f97316"]},
  mente: {n: "Mente", ic: "zap", g: ["#1e1b4b", "#6366f1"]},
  miedo: {n: "Miedo y valor", ic: "flame", g: ["#450a0a", "#dc2626"]},
  dolor: {n: "Dolor", ic: "drop", g: ["#3b0764", "#c026d3"]},
  constancia: {n: "Constancia", ic: "repeat", g: ["#022c22", "#10b981"]},
  derrota: {n: "Levantarse", ic: "sync", g: ["#172554", "#0ea5e9"]},
  combate: {n: "Combate", ic: "target", g: ["#0b0d12", "#b91c1c"]},
  humildad: {n: "Humildad", ic: "book", g: ["#1c1917", "#78716c"]},
  victoria: {n: "Victoria", ic: "trophy", g: ["#451a03", "#d97706"]},
};
/* en inglés se muestra la cita original cuando está en inglés; si no, la versión en español */
const EN_RE = /\b(the|you|and|is|to|of|it|your|be|not|are|i|we|we.re|he|she|can|like|no|why|before|work|equals)\b/i;
const txt = q => (lang() === "en" && q.original && /^[\x00-\x7F‘’“”—–…]+$/.test(q.original) && EN_RE.test(q.original) ? q.original : q.texto);
const catOf = q => CAT[q.categoria] || CAT.disciplina;
const byId = new Map(FRASES.map(q => [q.id, q]));

/* ---------- azar con semilla (mismo orden en todos los aparatos) ---------- */
function rng(seed){
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let x = a; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
}
function shuffle(arr, seed){
  const r = rng(seed), a = arr.slice();
  for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
/* orden fijo del calendario: la frase de cada día sale de recorrer esta permutación, así no se repite ninguna
   hasta haber mostrado todas */
const DAILY = shuffle([...FRASES].sort((a, b) => a.id.localeCompare(b.id)), 20251031);
const dayNum = (d = new Date()) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5);
export function dailyQuote(d = new Date()){ return DAILY[((dayNum(d) % DAILY.length) + DAILY.length) % DAILY.length]; }

/* ---------- almacenamiento (inyectable) ----------
   Favoritas: colección "favoritos" del store ({id: idFrase}); si la colección aún no existe, localStorage.
   Vistas: solo en este aparato (localStorage), no hace falta sincronizarlas. */
const LS_FAV = "mma:frasesFav", LS_SEEN = "mma:frasesVistas";
const lsGet = k => { try{ const v = JSON.parse(localStorage.getItem(k) || "[]"); return Array.isArray(v) ? v : []; }catch(e){ return []; } };
const lsSet = (k, v) => { try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} };
const storeOk = () => { try{ return Array.isArray(S.all("favoritos")); }catch(e){ return false; } };
/* favoritas guardadas antes de existir la colección: pasan al store una sola vez */
function migrateLocal(){
  const a = lsGet(LS_FAV);
  if(!a.length) return;
  try{ for(const id of a) if(byId.has(id) && !S.get("favoritos", id) && !S.isDeleted("favoritos", id)) S.put("favoritos", {id}); localStorage.removeItem(LS_FAV); }catch(e){}
}
const defaultStorage = {
  favs(){ if(storeOk()){ migrateLocal(); return S.all("favoritos").map(r => r.id).filter(id => byId.has(id)); } return lsGet(LS_FAV).filter(id => byId.has(id)); },
  addFav(id){ if(storeOk()){ try{ S.put("favoritos", {id}); return; }catch(e){} } const a = lsGet(LS_FAV); if(!a.includes(id)){ a.push(id); lsSet(LS_FAV, a); } },
  delFav(id){ if(storeOk()){ try{ S.del("favoritos", id); return; }catch(e){} } lsSet(LS_FAV, lsGet(LS_FAV).filter(x => x !== id)); },
  seen(){ return lsGet(LS_SEEN); },
  setSeen(ids){ lsSet(LS_SEEN, ids); },
};
let store = defaultStorage;
/* para pruebas o para otro destino: setStorage({favs, addFav, delFav, seen, setSeen}) */
export function setStorage(s){ store = Object.assign({}, defaultStorage, s || {}); }
const isFav = id => store.favs().includes(id);

/* ---------- estado de la vista (sobrevive a los repintados de la app) ---------- */
/* view: la vista montada ahora (los avisos con "Deshacer" llaman a esta, no a una vista ya desmontada) */
const st = {cat: "", deck: null, deckCat: null, i: 0, hist: [], busy: false, view: null};
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const buzz = () => { try{ navigator.vibrate && navigator.vibrate(10); }catch(e){} };

function buildDeck(){
  const seen = new Set(store.seen());
  const pool = FRASES.filter(q => !st.cat || q.categoria === st.cat);
  const seed = (Math.random() * 1e9) | 0;
  const fresh = shuffle(pool.filter(q => !seen.has(q.id)), seed), old = shuffle(pool.filter(q => seen.has(q.id)), seed + 1);
  st.deck = [...fresh, ...old].map(q => q.id);
  st.deckCat = st.cat; st.i = 0; st.hist = [];
}
function markSeen(id){
  const s = store.seen();
  if(!s.includes(id)){ s.push(id); if(s.length >= FRASES.length) s.splice(0, s.length - 1); store.setSeen(s); }
}

/* ---------- textos ---------- */
const plain = q => `“${txt(q)}”\n${q.autor}`;
const shareText = q => `${plain(q)}\n\n${t("Frases de guerreros")} · AcademiaPro`;
function fmtToday(){
  try{ return new Intl.DateTimeFormat(lang() === "en" ? "en-US" : "es-CO", {weekday: "long", day: "numeric", month: "long"}).format(new Date()); }
  catch(e){ return new Date().toDateString(); }
}
const gradVars = q => { const g = catOf(q).g; return `--fr-g1:${g[0]};--fr-g2:${g[1]}`; };
const sizeCls = q => (txt(q).length > 150 ? "xl" : txt(q).length > 95 ? "l" : txt(q).length > 45 ? "m" : "s");

function cardInner(q, {meta = true} = {}){
  const c = catOf(q);
  return `<div class="fr-card-top"><span class="fr-cat">${icon(c.ic)}<span>${esc(t(c.n))}</span></span>${isFav(q.id) ? `<span class="fr-fav-dot" role="img" aria-label="${t("En favoritas")}">${icon("heart")}</span>` : ""}</div>
    <blockquote class="fr-quote ${sizeCls(q)}"><p>${esc(txt(q))}</p></blockquote>
    ${meta ? `<footer class="fr-by"><b>${esc(q.autor)}</b>${q.quien ? `<span>${esc(q.quien)}</span>` : ""}</footer>` : ""}`;
}

/* ---------- tarjeta compacta para el tablero ---------- */
export function dailyCard(){
  const q = dailyQuote();
  return `<a class="fr-mini" href="#/frases" style="${gradVars(q)}" aria-label="${t("Frase del día")}: ${esc(txt(q))} (${esc(q.autor)})">
    <span class="fr-mini-k">${icon("flame")}<span>${t("Frase del día")}</span></span>
    <span class="fr-mini-q">“${esc(txt(q))}”</span>
    <span class="fr-mini-a">${esc(q.autor)}</span>
    <span class="fr-mini-go">${t("Más frases")} ${icon("chevron")}</span>
  </a>`;
}

/* ---------- imagen para redes (1080×1350) ---------- */
function wrap(ctx, text, maxW){
  const words = text.split(/\s+/), lines = [];
  let line = "";
  for(const w of words){
    const tryL = line ? line + " " + w : w;
    if(ctx.measureText(tryL).width > maxW && line){ lines.push(line); line = w; } else line = tryL;
  }
  if(line) lines.push(line);
  return lines;
}
export async function quoteImage(q){
  const W = 1080, H = 1350, P = 96;
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const c = cv.getContext("2d");
  try{ await document.fonts.load("800 64px Inter"); await document.fonts.load("600 32px Inter"); }catch(e){}
  const FONT = `Inter, -apple-system, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
  const [g1, g2] = catOf(q).g;
  const bg = c.createLinearGradient(0, 0, W, H); bg.addColorStop(0, g1); bg.addColorStop(1, g2);
  c.fillStyle = bg; c.fillRect(0, 0, W, H);
  /* brillo y viñeta suaves */
  let rg = c.createRadialGradient(W * .85, H * .1, 0, W * .85, H * .1, W * .9);
  rg.addColorStop(0, "rgba(255,255,255,.22)"); rg.addColorStop(1, "rgba(255,255,255,0)");
  c.fillStyle = rg; c.fillRect(0, 0, W, H);
  const vg = c.createLinearGradient(0, H * .45, 0, H); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.45)");
  c.fillStyle = vg; c.fillRect(0, 0, W, H);
  /* comilla grande */
  c.fillStyle = "rgba(255,255,255,.16)"; c.font = `800 420px Georgia, serif`; c.textBaseline = "top";
  c.textAlign = "right"; c.fillText("“", W - P + 30, 30); c.textAlign = "left";
  /* categoría */
  c.font = `700 30px ${FONT}`; c.fillStyle = "rgba(255,255,255,.85)"; c.textBaseline = "alphabetic";
  c.fillText(t(catOf(q).n).toUpperCase(), P, 150);
  /* frase: el tamaño baja hasta que quepa */
  const maxW = W - P * 2, boxTop = 260, boxBottom = H - 330;
  let size = 84, lines, lh;
  for(; size >= 40; size -= 2){
    c.font = `800 ${size}px ${FONT}`; lines = wrap(c, txt(q), maxW); lh = size * 1.22;
    if(lines.length * lh <= boxBottom - boxTop) break;
  }
  c.fillStyle = "#fff"; c.shadowColor = "rgba(0,0,0,.25)"; c.shadowBlur = 18; c.shadowOffsetY = 4;
  const y0 = boxTop + ((boxBottom - boxTop) - lines.length * lh) / 2 + size;
  lines.forEach((l, i) => c.fillText(l, P, y0 + i * lh));
  c.shadowColor = "transparent";
  /* autor */
  let y = H - 250;
  c.fillStyle = "rgba(255,255,255,.9)"; c.fillRect(P, y - 34, 64, 6);
  c.font = `800 44px ${FONT}`; c.fillStyle = "#fff"; c.fillText(q.autor, P, y + 30);
  if(q.quien){ c.font = `500 30px ${FONT}`; c.fillStyle = "rgba(255,255,255,.78)"; wrap(c, q.quien, maxW).slice(0, 2).forEach((l, i) => c.fillText(l, P, y + 80 + i * 40)); }
  /* marca */
  c.font = `700 28px ${FONT}`; c.fillStyle = "rgba(255,255,255,.7)";
  let acad = ""; try{ acad = S.academy()?.nombre || ""; }catch(e){}
  c.fillText(acad ? `${acad} · AcademiaPro` : "AcademiaPro", P, H - 70);
  c.textAlign = "right"; c.fillText(t("Frases de guerreros"), W - P, H - 70); c.textAlign = "left";
  return new Promise(res => cv.toBlob(b => res(b), "image/png"));
}
async function downloadImage(q){
  const b = await quoteImage(q);
  if(!b){ toast(t("No se pudo crear la imagen"), "error"); return; }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(b); a.download = `frase-${q.id}.png`;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  toast(t("Imagen descargada"));
}
async function shareImage(q){
  const b = await quoteImage(q);
  const f = b && new File([b], `frase-${q.id}.png`, {type: "image/png"});
  try{
    if(f && navigator.canShare && navigator.canShare({files: [f]})){ await navigator.share({files: [f], text: shareText(q)}); return; }
  }catch(e){ if(e && e.name === "AbortError") return; }
  downloadImage(q);
}
async function shareNative(q){
  try{ await navigator.share({title: t("Frases de guerreros"), text: shareText(q)}); return true; }
  catch(e){ return e && e.name === "AbortError"; }
}
function openShare(q){
  const canNative = !!navigator.share;
  const canFiles = (() => { try{ return !!(navigator.canShare && navigator.canShare({files: [new File([""], "x.png", {type: "image/png"})]})); }catch(e){ return false; } })();
  const sh = sheet({title: t("Compartir frase"), cls: "fr-share-sheet", body: `
    <div class="fr-share-prev" style="${gradVars(q)}"><p>“${esc(txt(q))}”</p><b>${esc(q.autor)}</b></div>
    <div class="fr-share-grid">
      ${canNative ? `<button type="button" class="fr-share-op" data-op="native">${icon("share")}<span>${t("Compartir…")}</span></button>` : ""}
      <a class="fr-share-op wa" data-op="wa" href="https://wa.me/?text=${encodeURIComponent(shareText(q))}" target="_blank" rel="noopener">${icon("whatsapp")}<span>WhatsApp</span></a>
      ${canFiles ? `<button type="button" class="fr-share-op" data-op="img">${icon("camera")}<span>${t("Compartir imagen")}</span></button>` : ""}
      <button type="button" class="fr-share-op" data-op="dl">${icon("download")}<span>${t("Descargar imagen")}</span></button>
      <button type="button" class="fr-share-op" data-op="copy">${icon("copy")}<span>${t("Copiar texto")}</span></button>
    </div>
    <p class="muted small fr-share-tip">${t("La imagen mide 1080 × 1350: sirve para historias y publicaciones de Instagram.")}</p>`});
  sh.body.onclick = async e => {
    const b = e.target.closest("[data-op]"); if(!b) return;
    const op = b.dataset.op;
    if(op === "wa"){ sh.close(); return; }
    e.preventDefault();
    if(op === "native"){ if(await shareNative(q)) sh.close(); }
    else if(op === "img"){ await shareImage(q); sh.close(); }
    else if(op === "dl"){ await downloadImage(q); sh.close(); }
    else if(op === "copy"){
      try{ await navigator.clipboard.writeText(shareText(q)); toast(t("Frase copiada")); }catch(err){ toast(t("No se pudo copiar"), "warn"); }
      sh.close();
    }
  };
}

/* ---------- favoritas ---------- */
function toggleFav(id, on = !isFav(id)){
  on ? store.addFav(id) : store.delFav(id);
  return on;
}

/* ---------- vista ---------- */
export function render(el){
  if(!st.deck || st.deckCat !== st.cat) buildDeck();
  const again = !!el.querySelector(".fr-page");   // repintado de la app (p. ej. tras guardar): sin animación de entrada
  const dq = dailyQuote();
  const counts = Object.fromEntries(CATEGORIAS.map(c => [c, FRASES.filter(q => q.categoria === c).length]));
  el.innerHTML = `<div class="fr-page">
    <section class="fr-day" style="${gradVars(dq)}" aria-labelledby="frDayH">
      <div class="fr-day-glow" aria-hidden="true"></div>
      <header class="fr-day-h"><span class="fr-day-k" id="frDayH">${icon("flame")}${t("Frase del día")}</span><span class="fr-day-date">${esc(fmtToday())}</span></header>
      <blockquote class="fr-quote fr-day-q ${sizeCls(dq)}"><p>${esc(txt(dq))}</p></blockquote>
      <footer class="fr-by"><b>${esc(dq.autor)}</b>${dq.quien ? `<span>${esc(dq.quien)}</span>` : ""}</footer>
      <div class="fr-day-act">
        <button type="button" class="fr-pill ${isFav(dq.id) ? "on" : ""}" data-dayfav aria-pressed="${isFav(dq.id)}">${icon("heart")}<span>${isFav(dq.id) ? t("Guardada") : t("Guardar")}</span></button>
        <button type="button" class="fr-pill" data-dayshare>${icon("share")}<span>${t("Compartir")}</span></button>
        <button type="button" class="fr-pill" data-dayimg>${icon("download")}<span>${t("Imagen")}</span></button>
      </div>
    </section>

    <div class="fr-grid">
      <section class="fr-deck-wrap" aria-labelledby="frDeckH">
        <div class="fr-sec-h"><h2 id="frDeckH">${t("Frases de guerreros")}</h2><span class="muted small" id="frCount"></span></div>
        <div class="fr-chips" role="radiogroup" aria-label="${t("Categoría")}">
          <label class="fr-chip"><input type="radio" name="frcat" value="" ${!st.cat ? "checked" : ""}><span>${t("Todas")} <i>${FRASES.length}</i></span></label>
          ${CATEGORIAS.filter(c => counts[c]).map(c => `<label class="fr-chip" style="--fr-c:${CAT[c].g[1]}"><input type="radio" name="frcat" value="${c}" ${st.cat === c ? "checked" : ""}><span>${icon(CAT[c].ic)}${esc(t(CAT[c].n))} <i>${counts[c]}</i></span></label>`).join("")}
        </div>
        <div class="fr-deck" id="frDeck" tabindex="0" role="group" aria-roledescription="${t("mazo de tarjetas")}" aria-label="${t("Desliza a la derecha para guardar, a la izquierda para pasar y hacia arriba para compartir")}"></div>
        <div class="fr-ctrl" role="toolbar" aria-label="${t("Acciones de la tarjeta")}">
          <button type="button" class="fr-btn sm" data-act="undo" aria-label="${t("Volver a la anterior")}" title="${t("Volver a la anterior")}">${icon("back")}</button>
          <button type="button" class="fr-btn nope" data-act="left" aria-label="${t("Siguiente")}" title="${t("Siguiente")} (←)">${icon("x")}</button>
          <button type="button" class="fr-btn share" data-act="up" aria-label="${t("Compartir")}" title="${t("Compartir")} (↑)">${icon("share")}</button>
          <button type="button" class="fr-btn like" data-act="right" aria-label="${t("Guardar en favoritas")}" title="${t("Guardar en favoritas")} (→)">${icon("heart")}</button>
          <button type="button" class="fr-btn sm" data-act="img" aria-label="${t("Descargar imagen")}" title="${t("Descargar imagen")}">${icon("download")}</button>
        </div>
        <p class="fr-hint muted small">${t("Desliza: → guardar · ← siguiente · ↑ compartir")}</p>
      </section>

      <section class="fr-favs" aria-labelledby="frFavH">
        <div class="fr-sec-h"><h2 id="frFavH">${icon("heart")} ${t("Favoritas")}</h2><span class="muted small" id="frFavN"></span></div>
        <div id="frFavList"></div>
      </section>
    </div>
    <div class="fr-sr" aria-live="polite" id="frLive"></div>
  </div>`;

  const deckEl = el.querySelector("#frDeck"), live = el.querySelector("#frLive");
  const say = m => { live.textContent = m; };

  const paintFavs = () => {
    const ids = store.favs();
    el.querySelector("#frFavN").textContent = ids.length ? String(ids.length) : "";
    const list = el.querySelector("#frFavList");
    if(!ids.length){
      list.innerHTML = `<div class="fr-empty">${icon("heart")}<b>${t("Aún no tienes favoritas")}</b><span>${t("Desliza una tarjeta a la derecha o toca ♥ para guardarla aquí.")}</span></div>`;
      return;
    }
    list.innerHTML = `<ul class="fr-fav-list">${ids.slice().reverse().map(id => byId.get(id)).filter(Boolean).map(q => `
      <li class="fr-fav" style="${gradVars(q)}">
        <span class="fr-fav-bar" aria-hidden="true"></span>
        <div class="fr-fav-main"><p>“${esc(txt(q))}”</p><span>${esc(q.autor)}</span></div>
        <div class="fr-fav-act">
          <button type="button" class="icon-btn" data-fshare="${q.id}" aria-label="${t("Compartir")}">${icon("share")}</button>
          <button type="button" class="icon-btn" data-fdel="${q.id}" aria-label="${t("Quitar de favoritas")}">${icon("trash")}</button>
        </div>
      </li>`).join("")}</ul>`;
  };

  const top = () => deckEl.querySelector(".fr-card.is-top");
  const paintDeck = () => {
    const left = st.deck.length - st.i;
    el.querySelector("#frCount").textContent = left > 0 ? t("{n} de {total}", {n: st.i + 1, total: st.deck.length}) : "";
    for(const b of el.querySelectorAll(".fr-ctrl [data-act]")) b.disabled = b.dataset.act === "undo" ? !st.hist.length : left <= 0;
    if(left <= 0){
      deckEl.innerHTML = `<div class="fr-done"><span class="fr-done-ic">${icon("trophy")}</span><b>${t("¡Las viste todas!")}</b><span>${t("Vuelve mañana por tu frase del día o empieza otra ronda.")}</span><button type="button" class="btn primary" data-act="again">${icon("repeat")}<span>${t("Barajar de nuevo")}</span></button></div>`;
      return;
    }
    const ids = st.deck.slice(st.i, st.i + 3);
    deckEl.innerHTML = ids.map((id, k) => {
      const q = byId.get(id);
      return `<article class="fr-card ${k === 0 ? "is-top" : ""}" data-id="${id}" data-depth="${k}" style="${gradVars(q)};z-index:${3 - k}" ${k ? `aria-hidden="true"` : `aria-label="${esc(txt(q))} (${esc(q.autor)})"`}>
        <div class="fr-card-in">${cardInner(q)}</div>
        ${k === 0 ? `<span class="fr-stamp like" aria-hidden="true">${icon("heart")}${t("Guardar")}</span><span class="fr-stamp nope" aria-hidden="true">${icon("x")}${t("Siguiente")}</span><span class="fr-stamp up" aria-hidden="true">${icon("share")}${t("Compartir")}</span>` : ""}
      </article>`;
    }).reverse().join("");
    bindDrag(top());
  };

  /* decisión: anima la salida y luego guarda. Si la vista se desmonta (cambio de ruta o repintado de la app)
     durante la animación, la limpieza confirma el cambio de estado al momento, sin tocar el DOM viejo. */
  let alive = true, pending = null;
  const focusDeckIfLost = () => {
    const a = document.activeElement;
    if(!a || a === document.body || !el.contains(a) || a.disabled) deckEl.focus({preventScroll: true});
  };
  const commit = (id, dir) => {
    st.hist.push({i: st.i, id, dir, fav: dir === "right" && !isFav(id)});
    st.i++;
    markSeen(id);
    if(dir === "right" && !isFav(id)) toggleFav(id, true);
    st.busy = false;
  };
  const decide = (dir, fromDrag) => {
    const card = top();
    if(!card || st.busy || (!fromDrag && card.classList.contains("dragging"))) return;
    st.busy = true;
    const id = card.dataset.id, q = byId.get(id);
    const hadFocus = el.contains(document.activeElement);
    buzz();
    const W = deckEl.clientWidth || 360;
    const cur = card._pos || {x: 0, y: 0};
    const to = dir === "right" ? {x: W * 1.6, y: cur.y + 40, r: 28} : dir === "left" ? {x: -W * 1.6, y: cur.y + 40, r: -28} : {x: cur.x * .5, y: -(deckEl.clientHeight || 500) * 1.4, r: cur.x / 30};
    card.classList.add("flying", "go-" + dir);
    if(reduced()){ card.style.transition = "opacity .15s"; card.style.opacity = "0"; }
    else{
      card.style.transition = `transform ${fromDrag ? ".38s" : ".48s"} cubic-bezier(.2,.8,.2,1), opacity .38s ease`;
      card.style.transform = `translate(${to.x}px, ${to.y}px) rotate(${to.r}deg)`;
      card.style.opacity = "0";
    }
    for(const c of deckEl.querySelectorAll(".fr-card:not(.is-top)")){ c.style.transition = ""; c.style.transform = ""; }
    deckEl.classList.add("advance");
    pending = {id, dir, timer: setTimeout(() => {
      pending = null;
      if(!alive) return;
      deckEl.classList.remove("advance");
      commit(id, dir);
      paintDeck();
      if(dir === "right"){ say(t("Guardada en favoritas")); toast(t("Guardada en favoritas"), "ok", {label: t("Deshacer"), fn: () => st.view && st.view.undo()}, {key: "frfav", ms: 2400}); paintFavs(); syncDayFav(); }
      else if(dir === "up"){ openShare(q); }
      else say(t("Siguiente frase"));
      if(hadFocus && dir !== "up") focusDeckIfLost();
    }, reduced() ? 160 : (fromDrag ? 300 : 380))};
  };
  const undo = () => {
    if(st.busy || !st.hist.length) return;
    const last = st.hist.pop();
    st.i = last.i;
    if(last.fav) toggleFav(last.id, false);
    paintDeck(); paintFavs(); syncDayFav();
    const c = top();
    if(c && !reduced()){ c.style.transition = "none"; c.style.transform = `translate(${last.dir === "right" ? 420 : last.dir === "left" ? -420 : 0}px, ${last.dir === "up" ? -500 : 0}px) rotate(${last.dir === "right" ? 20 : last.dir === "left" ? -20 : 0}deg)`; c.offsetWidth; c.style.transition = "transform .5s cubic-bezier(.2,.8,.2,1)"; c.style.transform = ""; }
    say(t("Frase anterior"));
    focusDeckIfLost();
  };

  /* arrastre con pointer events (mouse, dedo y lápiz). Solo un puntero a la vez: un segundo dedo se ignora.
     touch-action:none va solo en la tarjeta, así la página sigue desplazándose fuera de ella. */
  function bindDrag(card){
    if(!card) return;
    let x0 = 0, y0 = 0, t0 = 0, dx = 0, dy = 0, drag = false, pid = null;
    const like = card.querySelector(".fr-stamp.like"), nope = card.querySelector(".fr-stamp.nope"), up = card.querySelector(".fr-stamp.up");
    const next = deckEl.querySelector('.fr-card[data-depth="1"]');
    const thrX = () => Math.min(140, (deckEl.clientWidth || 360) * .28), thrY = () => Math.min(150, (deckEl.clientHeight || 480) * .24);
    card.addEventListener("pointerdown", e => {
      if(drag || st.busy || !e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
      if(e.pointerType === "mouse") e.preventDefault();   // sin selección de texto al arrastrar
      drag = true; pid = e.pointerId; x0 = e.clientX; y0 = e.clientY; t0 = performance.now(); dx = dy = 0;
      try{ card.setPointerCapture(pid); }catch(err){}
      card.style.transition = "none"; card.classList.add("dragging");
      if(next) next.style.transition = "none";
    });
    card.addEventListener("pointermove", e => {
      if(!drag || e.pointerId !== pid) return;
      dx = e.clientX - x0; dy = e.clientY - y0;
      const rot = reduced() ? 0 : Math.max(-22, Math.min(22, dx * .07));
      card._pos = {x: dx, y: dy};
      card.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg)`;
      const px = Math.min(1, Math.abs(dx) / thrX()), py = Math.min(1, Math.max(0, -dy) / thrY());
      const vert = -dy > Math.abs(dx);
      like.style.opacity = !vert && dx > 0 ? px : 0;
      nope.style.opacity = !vert && dx < 0 ? px : 0;
      up.style.opacity = vert ? py : 0;
      if(next){ const p = Math.max(px, py); next.style.transform = `translateY(${14 - 14 * p}px) scale(${.94 + .06 * p})`; }
    });
    const snapBack = () => {
      card.style.transition = reduced() ? "transform .1s" : "transform .55s cubic-bezier(.34,1.56,.64,1)";
      card.style.transform = ""; card._pos = null;
      for(const s of [like, nope, up]){ s.style.transition = "opacity .25s"; s.style.opacity = 0; }
      if(next){ next.style.transition = "transform .45s cubic-bezier(.2,.8,.2,1)"; next.style.transform = ""; }
    };
    const end = e => {
      if(!drag || e.pointerId !== pid) return;
      drag = false; pid = null; card.classList.remove("dragging");
      try{ if(card.hasPointerCapture(e.pointerId)) card.releasePointerCapture(e.pointerId); }catch(err){}
      /* cancelado por el sistema (llamada, gesto del navegador) o captura perdida: nunca decide, solo vuelve */
      if(e.type !== "pointerup"){ snapBack(); return; }
      const dt = Math.max(1, performance.now() - t0), vx = dx / dt, vy = dy / dt;
      const vert = -dy > Math.abs(dx);
      let dir = null;
      if(vert && (-dy > thrY() || (vy < -.6 && -dy > 40))) dir = "up";
      else if(!vert && (dx > thrX() || (vx > .6 && dx > 40))) dir = "right";
      else if(!vert && (dx < -thrX() || (vx < -.6 && dx < -40))) dir = "left";
      if(dir){ decide(dir, true); return; }
      snapBack();   // un toque sin arrastrar no hace nada (evita decisiones accidentales)
    };
    card.addEventListener("pointerup", end);
    card.addEventListener("pointercancel", end);
    card.addEventListener("lostpointercapture", end);
  }

  const syncDayFav = () => {
    const b = el.querySelector("[data-dayfav]"); if(!b) return;
    const on = isFav(dq.id);
    b.classList.toggle("on", on); b.setAttribute("aria-pressed", on);
    b.querySelector("span").textContent = on ? t("Guardada") : t("Guardar");
  };

  el.onclick = e => {
    const a = e.target.closest("[data-act]");
    if(a){
      const act = a.dataset.act;
      if(act === "left" || act === "right" || act === "up") decide(act);
      else if(act === "undo") undo();
      else if(act === "img"){ const c = top(); if(c) downloadImage(byId.get(c.dataset.id)); }
      else if(act === "again"){ store.setSeen([]); buildDeck(); paintDeck(); deckEl.focus({preventScroll: true}); }
      return;
    }
    if(e.target.closest("[data-dayfav]")){ const on = toggleFav(dq.id); buzz(); syncDayFav(); paintFavs(); toast(on ? t("Guardada en favoritas") : t("Quitada de favoritas"), "ok", null, {key: "frfav"}); return; }
    if(e.target.closest("[data-dayshare]")) return openShare(dq);
    if(e.target.closest("[data-dayimg]")) return downloadImage(dq);
    const fs = e.target.closest("[data-fshare]"); if(fs) return openShare(byId.get(fs.dataset.fshare));
    const fd = e.target.closest("[data-fdel]");
    if(fd){
      const id = fd.dataset.fdel;
      const li = fd.closest(".fr-fav");
      const doIt = () => {
        toggleFav(id, false);
        if(!alive) return;
        refresh();
        toast(t("Quitada de favoritas"), "ok", {label: t("Deshacer"), fn: () => { toggleFav(id, true); if(st.view) st.view.refresh(); }}, {key: "frfav"});
        /* el botón borrado tenía el foco: pasa a la lista para no perderlo */
        if(!el.contains(document.activeElement)){ const n = el.querySelector("#frFavList [data-fdel]") || el.querySelector("#frDeck"); if(n) n.focus({preventScroll: true}); }
      };
      if(li && !reduced()){ li.classList.add("out"); setTimeout(doIt, 220); } else doIt();
    }
  };
  el.onchange = e => {
    if(e.target.name === "frcat"){ st.cat = e.target.value; buildDeck(); deckEl.classList.add("enter"); paintDeck(); setTimeout(() => deckEl.classList.remove("enter"), 600); }
  };

  /* atajos: solo con el foco en el mazo o en sus botones, para no robarle a la página las flechas de desplazamiento */
  const onKey = e => {
    if(e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if(document.querySelector(".modal-back")) return;
    const tg = e.target;
    if(!tg || !tg.closest || !tg.closest("#frDeck, .fr-ctrl")) return;
    const k = {ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up"}[e.key];
    if(k){ e.preventDefault(); decide(k); }
    else if(e.key === "Backspace" || e.key === "z"){ e.preventDefault(); undo(); }
  };
  document.addEventListener("keydown", onKey);

  const refresh = () => { if(alive){ paintFavs(); syncDayFav(); if(!st.busy) paintDeck(); } };
  st.view = {undo, refresh};

  if(!again){ deckEl.classList.add("enter"); setTimeout(() => deckEl.classList.remove("enter"), 600); }
  else el.querySelector(".fr-day").style.animation = "none";
  paintDeck();
  paintFavs();
  return () => {
    alive = false;
    document.removeEventListener("keydown", onKey);
    if(pending){ clearTimeout(pending.timer); commit(pending.id, pending.dir); pending = null; }
    st.busy = false;
    if(st.view && st.view.undo === undo) st.view = null;
  };
}
