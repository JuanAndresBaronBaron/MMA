/* Arranque, barra lateral, rutas y bienvenida. */
import * as S from "./store.js";
import * as Sync from "./sync.js";
import {icon, beltDefs, toast, modal, field, formValues} from "./ui.js";
import {esc, h, $, $$, debounce, today, uid} from "./util.js";
import {DISCIPLINE_PRESETS, cloneRanks, DISC_COLORS, CURRENCIES} from "./catalog.js";
import {t, lang, setLang, LANGS} from "./i18n.js";

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
const BOTTOM = ["inicio", "alumnos", "pagos", "ranking"];

function theme(){
  const th = S.pref("theme", "dark");
  document.documentElement.dataset.theme = th;
  document.querySelector("meta[name=theme-color]")?.setAttribute("content", th === "dark" ? "#0b0d12" : "#f5f6f8");
}
export function toggleTheme(){ S.setPref("theme", S.pref("theme", "dark") === "dark" ? "light" : "dark"); theme(); }

/* ---------- estructura ---------- */
function shell(){
  document.body.innerHTML = `${beltDefs}
  <div class="app">
    <aside class="side" id="side">
      <div class="brand">${logo()}<div><b data-acad-name></b><span class="muted small">${t("Gestión de academia")}</span></div></div>
      <nav class="nav">${Object.entries(ROUTES).filter(([, r]) => !r.hidden).map(([k, r]) => `<a href="#/${k}" data-r="${k}">${icon(r.ic)}<span>${t(r.t)}</span></a>`).join("")}</nav>
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
    <nav class="bottom">${BOTTOM.map(k => `<a href="#/${k}" data-r="${k}">${icon(ROUTES[k].ic)}<span>${t(ROUTES[k].t)}</span></a>`).join("")}<a href="#" id="moreBtn">${icon("grid")}<span>${t("Más")}</span></a></nav>
  </div>
  <div id="toasts" class="toasts"></div>`;
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
export const logo = (s = 38) => `<svg class="logo" width="${s}" height="${s}" viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff3b3b"/><stop offset="1" stop-color="#b3001b"/></linearGradient></defs><path d="M24 3 42 10v13c0 11-7.6 19-18 22C13.6 42 6 34 6 23V10z" fill="url(#lg)"/><path d="M14 22h20v5H14z" fill="#111"/><path d="M21 20.5h6v8h-6z" fill="#111" stroke="#fff" stroke-width="1.2"/><path d="m22.5 28.5-2 7M25.5 28.5l2 7" stroke="#111" stroke-width="2.6" stroke-linecap="round"/><path d="M30 22.5h3v4h-3z" fill="#fff"/></svg>`;

function paintSedes(){
  const sel = $("#sedeSel"); if(!sel) return;
  const ss = S.sedes(), cur = S.curSede();
  sel.innerHTML = `<option value="">${t("Todas las sedes")}</option>` + ss.map(s => `<option value="${s.id}" ${s.id === cur ? "selected" : ""}>${esc(s.nombre)}</option>`).join("");
  sel.parentElement.hidden = ss.length < 2;
  for(const el of $$("[data-acad-name]")) el.textContent = S.academy()?.nombre || t("Mi academia");
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
let cur = null, cleanup = null;
function parse(){
  const [r, ...rest] = (location.hash.replace(/^#\/?/, "") || "inicio").split("/");
  return {r: ROUTES[r] ? r : "inicio", params: rest.map(decodeURIComponent)};
}
export function render(keepScroll){
  if(!S.academy()) return welcome();
  if(!$(".app")) shell();
  paintSedes();
  const {r, params} = parse();
  const route = ROUTES[r];
  const main = $("#main");
  const sameRoute = cur === location.hash;
  const y = keepScroll && sameRoute ? window.scrollY : 0;
  if(cleanup) try{ cleanup(); }catch(e){}
  cleanup = null;
  $("#title").textContent = t(route.t);
  for(const a of $$("[data-r]")) a.classList.toggle("on", a.dataset.r === r || a.dataset.r === route.parent);
  const active = document.activeElement, activeName = active && active.closest("#main") && (active.id || active.name);
  const selStart = active && active.selectionStart;
  main.onclick = main.oninput = main.onchange = null;
  try{ cleanup = route.v.render(main, params, {render}) || null; }
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
    </div>
    <div id="toasts" class="toasts"></div></div>`;
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
export const gIcon = () => `<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>`;

export function createAcademy(onDone){
  const body = h(`<form class="form" novalidate>
    ${field({k: "nombre", label: t("Nombre de la academia"), req: true, ph: t("Ej: Team Bravo MMA")})}
    ${field({k: "ciudad", label: t("Ciudad"), half: true})}
    ${field({k: "moneda", label: t("Moneda"), type: "select", opts: CURRENCIES, half: true}, "COP")}
    ${field({k: "sede", label: t("Primera sede"), half: true, def: t("Sede principal")})}
    ${field({k: "valorMensual", label: t("Mensualidad por defecto"), type: "number", half: true, ph: t("Ej: 150000")})}
    ${field({k: "discs", label: t("¿Qué enseñan? (luego puedes cambiarlo)"), type: "chips", opts: DISCIPLINE_PRESETS.map(p => [p.nombre, t(p.nombre)])}, ["Brazilian Jiu-Jitsu", "MMA", "Muay Thai"])}
  </form>`);
  const m = modal({title: t("Crea tu academia"), body, foot: `<button class="btn ghost" data-close>${t("Cancelar")}</button><button class="btn primary" data-save>${t("Crear academia")}</button>`});
  m.foot.querySelector("[data-save]").onclick = () => {
    const v = formValues(body);
    if(!v.nombre){ toast(t("Escribe el nombre de la academia"), "warn"); return; }
    const a = S.put("academias", {nombre: v.nombre, ciudad: v.ciudad, moneda: v.moneda || "COP", valorMensual: v.valorMensual || 0, avisoDias: 5});
    S.setPref("academia", a.id);
    const s = S.put("sedes", {academiaId: a.id, nombre: v.sede || t("Sede principal"), ciudad: v.ciudad});
    (v.discs || []).forEach((n, i) => {
      const p = DISCIPLINE_PRESETS.find(x => x.nombre === n);
      S.put("disciplinas", {academiaId: a.id, nombre: p.nombre, sistema: p.sistema, ranks: cloneRanks(p.sistema), sedeIds: [s.id], color: DISC_COLORS[i % DISC_COLORS.length], orden: i});
    });
    m.close();
    toast(t("¡Academia creada! Ahora agrega tus alumnos."));
    location.hash = "#/inicio";
    document.body.innerHTML = "";
    render();
    onDone && onDone(a);
  };
}

/* ---------- arranque ---------- */
async function boot(){
  theme();
  document.title = t("AcademiaPro · Gestión de academias de artes marciales");
  S.load();
  await S.loadFotos();
  S.subscribe(() => { if(document.querySelector(".app")) rerender(); else if(S.academy() && !document.querySelector(".modal-back")) render(); });
  window.addEventListener("hashchange", () => render());
  window.addEventListener("beforeunload", S.flush);
  document.addEventListener("visibilitychange", () => { if(document.visibilityState === "hidden") S.flush(); });
  window.addEventListener("mma:quota", () => toast(t("El almacenamiento de este aparato está lleno"), "error"));
  Sync.init();
  render();
  if("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
}
boot();
