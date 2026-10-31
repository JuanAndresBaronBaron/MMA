/* Arranque, barra lateral, rutas y bienvenida. */
import * as S from "./store.js";
import * as Sync from "./sync.js";
import {icon, beltDefs, toast} from "./ui.js";
import {esc, $, $$, debounce, today} from "./util.js";
import {t, tn, lang, setLang, LANGS} from "./i18n.js";
import {applyTheme, watchSystemTheme, logo, gIcon, createAcademy, setRenderer} from "./shell.js";
import {estadoPago} from "./cobros.js";
/* las vistas importan esto de shell.js; se reexporta por compatibilidad */
export {toggleTheme, gIcon, logo, createAcademy} from "./shell.js";

import * as Dash from "./views/dashboard.js";
import * as Alumnos from "./views/alumnos.js";
import * as Alumno from "./views/alumno.js";
import * as Pagos from "./views/pagos.js";
import * as Grados from "./views/grados.js";
import * as Ranking from "./views/ranking.js";
import * as Asistencia from "./views/asistencia.js";
import * as Tienda from "./views/tienda.js";
import * as Academia from "./views/academia.js";
import * as Ajustes from "./views/ajustes.js";
import * as Entreno from "./views/entreno.js";

/* t: título en español; se traduce con t() al pintar */
const ROUTES = {
  inicio: {v: Dash, t: "Inicio", ic: "home"},
  alumnos: {v: Alumnos, t: "Alumnos", ic: "users"},
  alumno: {v: Alumno, t: "Alumno", ic: "users", hidden: true, parent: "alumnos"},
  pagos: {v: Pagos, t: "Pagos", ic: "cash"},
  grados: {v: Grados, t: "Grados", ic: "belt"},
  ranking: {v: Ranking, t: "Ranking", ic: "trophy"},
  entreno: {v: Entreno, t: "Entrenamiento", ic: "fist"},
  asistencia: {v: Asistencia, t: "Asistencia", ic: "calendar"},
  tienda: {v: Tienda, t: "Tienda", ic: "bag"},
  academia: {v: Academia, t: "Academia", ic: "building"},
  ajustes: {v: Ajustes, t: "Ajustes", ic: "settings"},
};
const BOTTOM = ["inicio", "asistencia", "alumnos", "pagos"];

/* ---------- estructura ---------- */
function shell(){
  document.body.innerHTML = `${beltDefs}
  <div class="app">
    <aside class="side" id="side">
      <div class="brand">${logo()}<div><b data-acad-name></b><span class="muted small">${t("Gestión de academia")}</span></div></div>
      <nav class="nav" aria-label="${t("Secciones")}">${Object.entries(ROUTES).filter(([, r]) => !r.hidden).map(([k, r]) => `<a href="#/${k}" data-r="${k}">${icon(r.ic)}<span>${t(r.t)}</span>${k === "pagos" ? `<i class="nav-badge" data-venc hidden></i>` : ""}</a>`).join("")}</nav>
      <div class="side-foot"><div id="syncBox"></div>${langSwitch()}</div>
    </aside>
    <div class="scrim" id="scrim"></div>
    <div class="main-wrap">
      <header class="top">
        <button class="icon-btn only-m" id="menuBtn" aria-label="${t("Menú")}">${icon("menu")}</button>
        <h1 id="title"></h1>
        <div class="top-r">
          <label class="sede-pick">${icon("map")}<select id="sedeSel" aria-label="${t("Sede")}"></select></label>
          <button class="sync-chip" id="syncChip"></button>
        </div>
      </header>
      <main id="main" tabindex="-1"></main>
    </div>
    <nav class="bottom" aria-label="${t("Navegación principal")}">${BOTTOM.map(k => `<a href="#/${k}" data-r="${k}">${icon(ROUTES[k].ic)}<span>${t(ROUTES[k].t)}</span>${k === "pagos" ? `<i class="nav-badge" data-venc hidden></i>` : ""}</a>`).join("")}<a href="#" id="moreBtn" aria-haspopup="true">${icon("grid")}<span>${t("Más")}</span></a></nav>
  </div>
  <div id="toasts" class="toasts" role="status" aria-live="polite"></div>`;
  $("#menuBtn").onclick = () => document.body.classList.add("drawer");
  $("#moreBtn").onclick = e => { e.preventDefault(); document.body.classList.add("drawer"); };
  $("#scrim").onclick = () => document.body.classList.remove("drawer");
  $("#side").addEventListener("click", e => { if(e.target.closest("a")) document.body.classList.remove("drawer"); });
  $("#sedeSel").onchange = e => { S.setPref("sede", e.target.value); render(); };
  Sync.onStatus(paintSync);
  bindLang();
}
/* selector de idioma (barra lateral y bienvenida) */
const langSwitch = () => `<div class="lang-sw seg small" role="group" aria-label="${t("Idioma")}">${LANGS.map(([k, n]) => `<button type="button" data-lang="${k}" class="${k === lang() ? "on" : ""}" aria-pressed="${k === lang()}" title="${n}">${k.toUpperCase()}</button>`).join("")}</div>`;
function bindLang(){ for(const b of $$("[data-lang]")) b.onclick = () => { if(b.dataset.lang !== lang()) setLang(b.dataset.lang); }; }

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
  const n = S.alumnos().filter(a => a.estado === "activo" && estadoPago(a, aviso).k === "vencido").length;
  for(const el of els){
    el.hidden = !n; el.textContent = n > 99 ? "99+" : n;
    el.parentElement.setAttribute("aria-label", n ? `${t("Pagos")} · ${tn(n, "1 vencido", "{n} vencidos")}` : t("Pagos"));
  }
}
function paintSync(st){
  const chip = $("#syncChip"), box = $("#syncBox"); if(!chip) return;
  const map = {
    off: ["cloudOff", t("Sin sincronizar"), "off"], pending: ["sync", t("Conectando…"), "busy"], syncing: ["sync", t("Sincronizando…"), "busy"],
    ok: ["cloud", st.dirty ? t("Guardando…") : t("Sincronizado"), "ok"], reconnect: ["alert", t("Reconectar"), "warn"],
    offline: ["cloudOff", t("Sin conexión"), "warn"], error: ["alert", t("Error de sync"), "err"],
  };
  const [ic, txt, k] = map[st.phase] || map.off;
  chip.className = "sync-chip " + k;
  chip.innerHTML = `${icon(ic, st.phase === "syncing" || st.phase === "pending" ? "spin" : "")}<span>${txt}</span>`;
  chip.title = st.msg || (st.email ? `Google Drive: ${st.email}` : t("Los datos están solo en este aparato"));
  chip.onclick = () => { if(st.phase === "reconnect") Sync.reconnect(); else location.hash = "#/ajustes"; };
  box.innerHTML = st.email ? `<div class="acct">${st.photo ? `<img src="${esc(st.photo)}" alt="" referrerpolicy="no-referrer">` : icon("cloud")}<div><b>${esc(st.name || "Google")}</b><span class="muted small">${esc(st.email)}</span></div></div>`
    : `<a class="btn ghost small block" href="#/ajustes">${icon("cloud")} ${t("Conectar Google")}</a>`;
}

/* ---------- rutas ---------- */
let cur = null, cleanup = null, rendDay = "";
/* ctx para las vistas: render y título de la barra superior */
const ctx = {render, setTitle: s => { const el = $("#title"); if(el) el.textContent = s; }};
function parse(){
  const [r, ...rest] = (location.hash.replace(/^#\/?/, "") || "inicio").split("/");
  return {r: ROUTES[r] ? r : "inicio", params: rest.map(decodeURIComponent)};
}
export function render(keepScroll){
  if(!S.academy()) return welcome();
  if(!$(".app")) shell();
  paintSedes();
  paintBadge();
  const {r, params} = parse();
  const route = ROUTES[r];
  const main = $("#main");
  const sameRoute = cur === location.hash;
  const y = keepScroll && sameRoute ? window.scrollY : 0;
  if(cleanup) try{ cleanup(); }catch(e){}
  cleanup = null;
  $("#title").textContent = t(route.t);
  rendDay = today();
  for(const a of $$("[data-r]")){ const on = a.dataset.r === r || a.dataset.r === route.parent; a.classList.toggle("on", on); on ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"); }
  const active = document.activeElement, activeName = active && active.closest("#main") && (active.id || active.name);
  const selStart = active && active.selectionStart;
  main.onclick = main.oninput = main.onchange = null;
  try{ cleanup = route.v.render(main, params, ctx) || null; }
  catch(e){ console.error(e); main.innerHTML = `<div class="card"><h3>${t("Algo falló al mostrar esta pantalla")}</h3><pre class="small">${esc(e.stack || e)}</pre></div>`; }
  if(activeName){ const el = main.querySelector(`#${CSS.escape(activeName)}`) || main.querySelector(`[name="${CSS.escape(activeName)}"]`); if(el){ el.focus(); try{ el.setSelectionRange(selStart, selStart); }catch(e){} } }
  if(!sameRoute){ window.scrollTo(0, 0); }
  else window.scrollTo(0, y);
  cur = location.hash;
}
const rerender = debounce(() => { if(!document.querySelector(".modal-back")) render(true); else pendingRender = true; }, 80);
let pendingRender = false;
window.addEventListener("mma:modal", () => { if(pendingRender && !document.querySelector(".modal-back")){ pendingRender = false; render(true); } });

/* ---------- bienvenida: crear la academia ---------- */
function welcome(){
  document.body.innerHTML = `${beltDefs}<div class="welcome">
    <div class="w-card">
      <div class="w-brand">${logo(64)}<h1>Academia<span>Pro</span></h1></div>
      <p class="lead">${t("Alumnos, pagos, cinturones y ranking de tu academia de artes marciales, sincronizados con tu Google Drive. Gratis y sin servidores.")}</p>
      <ul class="w-feats">
        <li>${icon("users")} ${t("Fichas completas: foto, tipo de sangre, contactos de emergencia, equipo")}</li>
        <li>${icon("cash")} ${t("Control de pagos con vencimientos y recordatorios por WhatsApp")}</li>
        <li>${icon("belt")} ${t("Historial de grados con alertas de promociones muy seguidas")}</li>
        <li>${icon("trophy")} ${t("Ranking por disciplina según cinturón y grado")}</li>
      </ul>
      <div class="w-actions">
        <button class="btn primary big" id="wGoogle">${gIcon()} ${t("Entrar con Google")}</button>
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
  window.addEventListener("hashchange", () => render());
  window.addEventListener("beforeunload", S.flush);
  document.addEventListener("visibilitychange", () => {
    if(document.visibilityState === "hidden") S.flush();
    /* pasó la medianoche con la app abierta: volver a pintar con la fecha nueva */
    else if(rendDay && rendDay !== today() && S.academy() && !document.querySelector(".modal-back")) render(true);
  });
  window.addEventListener("mma:quota", () => toast(t("El almacenamiento de este aparato está lleno"), "error"));
  Sync.init();
  render();
  if("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
}
boot();
