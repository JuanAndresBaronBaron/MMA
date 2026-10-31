/* Arranque, barra lateral, rutas y bienvenida. */
import * as S from "./store.js";
import * as Sync from "./sync.js";
import {icon, beltDefs, toast, dismissToasts, sheet} from "./ui.js";
import {esc, $, $$, debounce, today} from "./util.js";
import {t, tn, lang, setLang, LANGS} from "./i18n.js";
import {applyTheme, watchSystemTheme, logo, gIcon, createAcademy, setRenderer} from "./shell.js";
import {estadoPago, estadoEf} from "./cobros.js";
/* las vistas importan esto de shell.js; se reexporta por compatibilidad */
export {toggleTheme, gIcon, logo, createAcademy} from "./shell.js";

/* t: título en español (se traduce al pintar); grp: grupo de la barra lateral; load: la vista se carga al entrar.
   hidden: no sale en menús; parent: qué entrada se marca; bare: pantalla completa sin menús (kiosco). */
const ROUTES = {
  inicio: {load: () => import("./views/dashboard.js"), t: "Inicio", ic: "home", grp: "dia"},
  asistencia: {load: () => import("./views/asistencia.js"), t: "Asistencia", ic: "calendar", grp: "dia"},
  horario: {load: () => import("./views/horario.js"), t: "Horario", ic: "clock", grp: "dia"},
  alumnos: {load: () => import("./views/alumnos.js"), t: "Alumnos", ic: "users", grp: "dia"},
  alumno: {load: () => import("./views/alumno.js"), t: "Alumno", ic: "users", hidden: true, parent: "alumnos", grp: "dia"},
  pagos: {load: () => import("./views/pagos.js"), t: "Pagos", ic: "cash", grp: "dia"},
  recibo: {load: () => import("./views/recibo.js"), t: "Recibo", ic: "receipt", hidden: true, parent: "pagos", grp: "dia"},
  grados: {load: () => import("./views/grados.js"), t: "Grados", ic: "belt", grp: "progreso"},
  certificado: {load: () => import("./views/certificado.js"), t: "Certificado", ic: "award", hidden: true, parent: "grados", grp: "progreso"},
  ranking: {load: () => import("./views/ranking.js"), t: "Ranking", ic: "trophy", grp: "progreso"},
  entreno: {load: () => import("./views/entreno.js"), t: "Entrenamiento", ic: "fist", grp: "progreso"},
  frases: {load: () => import("./views/frases.js"), t: "Frases", ic: "flame", grp: "progreso"},
  leads: {load: () => import("./views/leads.js"), t: "Prospectos", ic: "userPlus", grp: "negocio"},
  reportes: {load: () => import("./views/reportes.js"), t: "Reportes", ic: "chart", grp: "negocio"},
  tienda: {load: () => import("./views/tienda.js"), t: "Tienda", ic: "bag", grp: "negocio"},
  academia: {load: () => import("./views/academia.js"), t: "Academia", ic: "building", grp: "negocio"},
  ajustes: {load: () => import("./views/ajustes.js"), t: "Ajustes", ic: "settings", grp: "pie"},
  kiosko: {load: () => import("./views/kiosko.js"), t: "Modo kiosco", ic: "tablet", hidden: true, bare: true, grp: "dia"},
};
const GROUPS = [["dia", "Día a día"], ["progreso", "Progreso"], ["negocio", "Negocio"]];
const BOTTOM = ["inicio", "asistencia", "alumnos", "pagos"];
export const routes = () => ROUTES;

/* ---------- estructura ---------- */
const navLink = (k, r) => `<a href="#/${k}" data-r="${k}">${icon(r.ic)}<span>${t(r.t)}</span>${k === "pagos" ? `<i class="nav-badge" data-venc hidden></i>` : ""}</a>`;
function shell(){
  const vis = Object.entries(ROUTES).filter(([, r]) => !r.hidden);
  document.body.innerHTML = `${beltDefs}
  <div class="app">
    <aside class="side" id="side">
      <div class="brand">${logo()}<div><b data-acad-name></b><span class="muted small">${t("Gestión de academia")}</span></div></div>
      <nav class="nav" aria-label="${t("Secciones")}">${GROUPS.map(([g, n]) => `<div class="nav-grp" role="group" aria-label="${t(n)}"><span class="nav-lbl">${t(n)}</span>${vis.filter(([, r]) => r.grp === g).map(([k, r]) => navLink(k, r)).join("")}</div>`).join("")}</nav>
      <div class="side-foot">${navLink("ajustes", ROUTES.ajustes)}<div id="syncBox"></div>${langSwitch()}</div>
    </aside>
    <div class="scrim" id="scrim"></div>
    <div class="main-wrap">
      <div class="offline-strip" id="offStrip" role="status" hidden>${icon("cloudOff")}<span>${t("Sin conexión · tus cambios se guardan aquí")}</span></div>
      <header class="top">
        <button class="icon-btn only-m" id="menuBtn" aria-label="${t("Menú")}">${icon("menu")}</button>
        <h1 id="title"></h1>
        <div class="top-r">
          <button type="button" class="top-search" id="searchBtn" aria-label="${t("Buscar")}" aria-keyshortcuts="Control+K Meta+K /">${icon("search")}<span>${t("Buscar")}</span><kbd class="kbd">${/Mac|iP/.test(navigator.platform) ? "⌘" : "Ctrl"} K</kbd></button>
          <label class="sede-pick">${icon("map")}<select id="sedeSel" aria-label="${t("Sede")}"></select></label>
          <button class="sync-chip" id="syncChip"></button>
        </div>
      </header>
      <main id="main" tabindex="-1"></main>
    </div>
    <nav class="bottom" aria-label="${t("Navegación principal")}">${BOTTOM.map(k => navLink(k, ROUTES[k])).join("")}<a href="#" id="moreBtn" aria-haspopup="dialog">${icon("grid")}<span>${t("Más")}</span></a></nav>
  </div>
  <div id="toasts" class="toasts" role="status" aria-live="polite"></div>`;
  $("#menuBtn").onclick = () => document.body.classList.add("drawer");
  $("#moreBtn").onclick = e => { e.preventDefault(); moreSheet(); };
  $("#scrim").onclick = () => document.body.classList.remove("drawer");
  $("#side").addEventListener("click", e => { if(e.target.closest("a")) document.body.classList.remove("drawer"); });
  $("#sedeSel").onchange = e => { S.setPref("sede", e.target.value); render(); };
  $("#searchBtn").onclick = () => import("./palette.js").then(m => m.openPalette()).catch(() => {});
  Sync.onStatus(paintSync);
  bindLang();
  paintOnline();
}
/* selector de idioma (barra lateral, «Más» y bienvenida) */
const langSwitch = () => `<div class="lang-sw seg small" role="group" aria-label="${t("Idioma")}">${LANGS.map(([k, n]) => `<button type="button" data-lang="${k}" class="${k === lang() ? "on" : ""}" aria-pressed="${k === lang()}" title="${n}">${k.toUpperCase()}</button>`).join("")}</div>`;
function bindLang(root = document){ for(const b of $$("[data-lang]", root)) b.onclick = () => { if(b.dataset.lang !== lang()) setLang(b.dataset.lang); }; }

/* «Más» en el celular: todas las secciones que no están en la barra de abajo */
function moreSheet(){
  const ks = Object.keys(ROUTES).filter(k => !ROUTES[k].hidden && !BOTTOM.includes(k));
  const r = parse().r;
  const body = `<div class="more-grid">${ks.map(k => `<a href="#/${k}" class="more-it ${k === r ? "on" : ""}">${icon(ROUTES[k].ic)}<span>${t(ROUTES[k].t)}</span></a>`).join("")}
    <button type="button" class="more-it" data-pal>${icon("search")}<span>${t("Buscar")}</span></button></div>
    <div class="more-foot"><div class="more-sync"></div>${langSwitch()}</div>`;
  const sh = sheet({title: t("Más"), body});
  const st = Sync.status(), [ic, txt, k] = syncLook(st);
  sh.el.querySelector(".more-sync").innerHTML = `<button type="button" class="sync-chip ${k}" data-sync-open>${ic === "dot" ? `<i class="sync-dot"></i>` : icon(ic)}<span>${txt}</span></button>`;
  sh.el.addEventListener("click", e => {
    if(e.target.closest(".more-it[href]")) sh.close();
    if(e.target.closest("[data-pal]")){ sh.close(); import("./palette.js").then(m => m.openPalette()).catch(() => {}); }
    if(e.target.closest("[data-sync-open]")){ sh.close(); syncTap(Sync.status()); }
  });
  bindLang(sh.el);
}

function paintSedes(){
  const sel = $("#sedeSel"); if(!sel) return;
  const ss = S.sedes(), cur = S.curSede();
  sel.innerHTML = `<option value="">${t("Todas las sedes")}</option>` + ss.map(s => `<option value="${s.id}" ${s.id === cur ? "selected" : ""}>${esc(s.nombre)}</option>`).join("");
  sel.parentElement.hidden = ss.length < 2;
  for(const el of $$("[data-acad-name]")) el.textContent = S.academy()?.nombre || t("Mi academia");
}
/* globo rojo en Pagos: alumnos activos con pago vencido */
function paintBadge(){
  const els = $$("[data-venc]"); if(!els.length) return;
  const aviso = S.academy()?.avisoDias ?? 5;
  const n = S.alumnos().filter(a => estadoEf(a) === "activo" && estadoPago(a, aviso).k === "vencido").length;
  for(const el of els){
    el.hidden = !n; el.textContent = n > 99 ? "99+" : n;
    el.parentElement.setAttribute("aria-label", n ? `${t("Pagos")} · ${tn(n, "1 vencido", "{n} vencidos")}` : t("Pagos"));
  }
}
/* sin cuenta de Google: punto neutro «Solo en este aparato»; el aviso queda para sin conexión o error */
function syncLook(st){
  const map = {
    off: ["dot", t("Solo en este aparato"), "local"], pending: ["sync", t("Conectando…"), "busy"], syncing: ["sync", t("Sincronizando…"), "busy"],
    ok: ["cloud", st.dirty ? t("Guardando…") : t("Sincronizado"), "ok"], reconnect: ["alert", t("Reconectar"), "warn"],
    offline: ["cloudOff", t("Sin conexión"), "warn"], error: ["alert", t("Error de sync"), "err"],
  };
  return map[st.phase] || map.off;
}
function syncTap(st){
  if(st.phase === "reconnect") return Sync.reconnect();
  if(st.phase !== "off") return void (location.hash = "#/ajustes");
  const sh = sheet({title: t("Solo en este aparato"), body: `<div class="sync-sheet"><span class="empty-ic">${icon("cloud")}</span>
    <p>${t("Tus datos están guardados solo en este aparato. Conecta Google para tener copia en tu Drive y usar la app en el celular y el computador.")}</p>
    <button type="button" class="btn primary big block" data-g>${gIcon()} ${t("Conectar Google")}</button>
    <a class="btn-link" href="#/ajustes">${t("Ver ajustes de sincronización")}</a></div>`});
  sh.el.querySelector("[data-g]").onclick = async () => {
    sh.close();
    try{ await Sync.connect(); toast(t("Conectado con Google Drive")); }catch(e){ toast(Sync.errText(e.code), "error"); }
  };
  sh.el.querySelector("a").onclick = () => sh.close();
}
function paintSync(st){
  const chip = $("#syncChip"), box = $("#syncBox"); if(!chip) return;
  const [ic, txt, k] = syncLook(st);
  chip.className = "sync-chip " + k;
  chip.innerHTML = `${ic === "dot" ? `<i class="sync-dot"></i>` : icon(ic, st.phase === "syncing" || st.phase === "pending" ? "spin" : "")}<span>${txt}</span>`;
  chip.title = st.msg || (st.email ? `Google Drive: ${st.email}` : t("Los datos están solo en este aparato"));
  chip.setAttribute("aria-label", txt);
  chip.onclick = () => syncTap(st);
  box.innerHTML = st.email ? `<div class="acct">${st.photo ? `<img src="${esc(st.photo)}" alt="" referrerpolicy="no-referrer">` : icon("cloud")}<div><b>${esc(st.name || "Google")}</b><span class="muted small">${esc(st.email)}</span></div></div>`
    : `<button type="button" class="btn ghost small block" data-sync-cta>${icon("cloud")} ${t("Conectar Google")}</button>`;
  const cta = box.querySelector("[data-sync-cta]"); if(cta) cta.onclick = () => { document.body.classList.remove("drawer"); syncTap(Sync.status()); };
}
function paintOnline(){ const el = $("#offStrip"); if(el) el.hidden = navigator.onLine !== false; }

/* ---------- rutas ---------- */
let cur = null, cleanup = null, rendDay = "", token = 0;
const mods = {};
/* ctx para las vistas: render, título y la consulta del hash (#/alumnos?new=1) */
const ctx = {render, setTitle: s => { const el = $("#title"); if(el) el.textContent = s; }, query: new URLSearchParams()};
function parse(){
  const raw = location.hash.replace(/^#\/?/, "");
  const qi = raw.indexOf("?");
  const path = qi < 0 ? raw : raw.slice(0, qi), qs = qi < 0 ? "" : raw.slice(qi + 1);
  const [r, ...rest] = (path || "inicio").split("/");
  return {r: ROUTES[r] ? r : "inicio", params: rest.filter(x => x !== "").map(x => { try{ return decodeURIComponent(x); }catch(e){ return x; } }), query: new URLSearchParams(qs)};
}
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
async function loadMod(k){
  if(mods[k]) return mods[k];
  const r = ROUTES[k];
  return (mods[k] = r.v || await r.load());
}
const unavailable = () => `<div class="card">${`<div class="empty-st warn"><span class="empty-ic">${icon("alert")}</span><h3>${t("Esta sección no está disponible")}</h3><p>${t("Revisa tu conexión y vuelve a intentarlo.")}</p><div class="empty-cta"><button type="button" class="btn ghost" data-retry>${icon("sync")}<span>${t("Reintentar")}</span></button><a class="btn primary" href="#/inicio">${t("Ir a Inicio")}</a></div></div>`}</div>`;
export function render(keepScroll){
  if(!S.academy()) return welcome();
  if(!$(".app")) shell();
  paintSedes();
  paintBadge();
  const {r, params, query} = parse();
  /* kiosco activo en este aparato: «atrás» o un enlace no sacan de él; solo el PIN del profesor */
  if(S.pref("kioskOn") && S.pref("kioskPin") && r !== "kiosko"){ location.replace("#/kiosko"); return; }
  const route = ROUTES[r];
  const main = $("#main");
  const sameRoute = cur === location.hash;
  const my = ++token;
  document.body.classList.toggle("bare", !!route.bare);
  $("#title").textContent = t(route.t);
  rendDay = today();
  for(const a of $$("[data-r]")){ const on = a.dataset.r === r || a.dataset.r === route.parent; a.classList.toggle("on", on); on ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"); }
  const paint = mod => {
    if(my !== token) return;
    if(cleanup) try{ cleanup(); }catch(e){}
    cleanup = null;
    const active = document.activeElement, activeName = sameRoute && active && active.closest("#main") && (active.id || active.name);
    const selStart = active && active.selectionStart;
    main.onclick = main.oninput = main.onchange = null;
    ctx.query = query;
    if(!mod){ main.innerHTML = unavailable(); main.querySelector("[data-retry]").onclick = () => { delete mods[r]; render(); }; }
    else try{ cleanup = mod.render(main, params, ctx, query) || null; }
    catch(e){ console.error(e); main.innerHTML = `<div class="card"><h3>${t("Algo falló al mostrar esta pantalla")}</h3><pre class="small">${esc(e.stack || e)}</pre></div>`; }
    if(typeof cleanup !== "function") cleanup = null;   // una vista async devuelve una promesa
    if(activeName){ const el = main.querySelector(`#${CSS.escape(activeName)}`) || main.querySelector(`[name="${CSS.escape(activeName)}"]`); if(el){ el.focus(); try{ el.setSelectionRange(selStart, selStart); }catch(e){} } }
    if(!sameRoute) window.scrollTo(0, 0);
    else window.scrollTo(0, y);
    cur = location.hash;
  };
  const y = keepScroll && sameRoute ? window.scrollY : 0;
  /* transición suave solo al cambiar de pantalla (no al repintar la misma) */
  const go = mod => {
    if(sameRoute || !cur || !document.startViewTransition || reduced() || document.hidden) return paint(mod);
    const vt = document.startViewTransition(() => paint(mod));
    /* si otra navegación la interrumpe, el navegador la salta: no es un error */
    for(const k of ["ready", "finished", "updateCallbackDone"]) vt[k]?.catch?.(() => {});
  };
  if(mods[r]) return go(mods[r]);
  if(!sameRoute) main.innerHTML = `<div class="view-load" aria-busy="true"><div class="boot-spin"></div></div>`;
  loadMod(r).then(go, e => { console.warn("[ruta]", r, e); go(null); });
}
const rerender = debounce(() => { if(!document.querySelector(".modal-back")) render(true); else pendingRender = true; }, 80);
let pendingRender = false;
window.addEventListener("mma:modal", () => { if(pendingRender && !document.querySelector(".modal-back")){ pendingRender = false; render(true); } });

/* ---------- bienvenida: crear la academia ---------- */
function welcome(){
  document.body.classList.remove("bare", "drawer");
  document.body.innerHTML = `${beltDefs}<div class="welcome">
    <div class="w-card">
      <div class="w-brand">${logo(64)}<h1>Academia<span>Pro</span></h1></div>
      <p class="lead">${t("Alumnos, pagos, cinturones y ranking de tu academia de artes marciales, sincronizados con tu Google Drive. Gratis y sin servidores.")}</p>
      <ul class="w-feats">
        <li>${icon("users")} ${t("Fichas completas: foto, tipo de sangre, contactos de emergencia, equipo")}</li>
        <li>${icon("cash")} ${t("Control de pagos con vencimientos y recordatorios por WhatsApp")}</li>
        <li>${icon("clock")} ${t("Horario de clases, asistencia por clase y modo kiosco")}</li>
        <li>${icon("belt")} ${t("Historial de grados con alertas de promociones muy seguidas")}</li>
        <li>${icon("trophy")} ${t("Ranking por disciplina según cinturón y grado")}</li>
      </ul>
      <div class="w-actions">
        <button class="btn primary big" id="wGoogle">${gIcon()}<span>${t("Entrar con Google")}</span></button>
        <button class="btn ghost big" id="wLocal">${t("Empezar sin cuenta")}</button>
      </div>
      <p class="small muted">${t("Con Google tus datos se guardan en una carpeta privada de tu propio Drive y puedes usar la app en el celular y el computador. Si ya tienes datos, se recuperan solos.")}</p>
      <div class="w-lang">${langSwitch()}</div>
    </div></div>
  <div id="toasts" class="toasts" role="status" aria-live="polite"></div>`;
  bindLang();
  $("#wGoogle").onclick = async () => {
    try{
      await Sync.connect();
      if(S.academy()){ toast(t("Datos recuperados de Google Drive")); render(); }
      else createAcademy();
    }catch(e){ toast(Sync.errText(e.code), "error"); }
  };
  $("#wLocal").onclick = () => createAcademy();
}

/* ---------- arranque ---------- */
async function boot(){
  if(window.__mmaBooted) return;
  window.__mmaBooted = true;
  setRenderer(render);
  applyTheme(); watchSystemTheme();
  document.title = t("AcademiaPro · Gestión de academias de artes marciales");
  S.load();
  await S.loadFotos();
  S.subscribe(() => { if(document.querySelector(".app")) rerender(); else if(S.academy() && !document.querySelector(".modal-back")) render(); });
  window.addEventListener("hashchange", () => { document.body.classList.remove("drawer"); dismissToasts(); render(); });
  window.addEventListener("beforeunload", S.flush);
  window.addEventListener("online", paintOnline);
  window.addEventListener("offline", paintOnline);
  document.addEventListener("visibilitychange", () => {
    if(document.visibilityState === "hidden") S.flush();
    /* pasó la medianoche con la app abierta: volver a pintar con la fecha nueva */
    else if(rendDay && rendDay !== today() && S.academy() && !document.querySelector(".modal-back")) render(true);
  });
  window.addEventListener("mma:quota", () => toast(t("El almacenamiento de este aparato está lleno"), "error"));
  Sync.init();
  render();
  /* buscador (Ctrl+K) y atajos; instalación. Si faltan, la app sigue igual. */
  import("./palette.js").then(m => m.initPalette({routes: ROUTES})).catch(() => {});
  import("./install.js").then(m => m.initInstall()).catch(() => {});
  if("serviceWorker" in navigator && location.protocol === "https:"){
    /* versión nueva instalada con la app abierta: recargar (sin perder nada a medio escribir) para no seguir
       sincronizando con el código viejo durante horas */
    const habia = !!navigator.serviceWorker.controller;
    let recargando = false;
    const recargar = () => {
      if(recargando) return;
      if(document.querySelector(".modal-back") || (document.visibilityState === "visible" && document.activeElement?.matches?.("input,textarea,select"))){
        document.addEventListener("visibilitychange", recargar, {once: true}); window.addEventListener("mma:modal", recargar, {once: true}); return;
      }
      recargando = true; S.flush(); location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", () => { if(habia) recargar(); });
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}
boot();
