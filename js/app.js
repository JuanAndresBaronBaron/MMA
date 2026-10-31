/* Arranque, barra lateral, rutas y bienvenida. */
import * as S from "./store.js";
import * as Sync from "./sync.js";
import {icon, beltDefs, toast, dismissToasts, sheet, haptic} from "./ui.js";
import {esc, $, $$, debounce, today} from "./util.js";
import {t, tn, lang, setLang, LANGS} from "./i18n.js";
import {applyTheme, watchSystemTheme, logo, gIcon, createAcademy, setRenderer} from "./shell.js";
import {estadoPago, estadoEf} from "./cobros.js";
import * as R from "./roles.js";
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
export const routes = () => ROUTES;

/* ---------- menús según el modo de uso (roles.js) ----------
   Cada entrada: k (lo que se marca, "ruta" o "entreno/sub"), href, ic, t. El estudiante tiene las sub-pantallas de
   Entrenamiento como secciones propias; dueño y profesor, las rutas visibles que su modo permite. */
const STUDENT_GROUPS = R.NAV_ESTUDIANTE;
const BOTTOMS = {dueno: ["inicio", "asistencia", "alumnos", "pagos"], profesor: ["inicio", "asistencia", "alumnos", "horario"], estudiante: ["entreno", "entreno/stats", "frases", "ajustes"]};
let NAV = null;
function buildNav(role){
  const it = (k, ic, tt) => ({k, href: "#/" + k, ic, t: tt});
  const groups = role === "estudiante"
    ? STUDENT_GROUPS.map(([g, n, xs]) => [g, n, xs.map(x => it(...x))])
    : GROUPS.map(([g, n]) => [g, n, Object.entries(ROUTES).filter(([k, r]) => !r.hidden && r.grp === g && R.allowed(k, role)).map(([k, r]) => it(k, r.ic, r.t))]).filter(x => x[2].length);
  const foot = it("ajustes", ROUTES.ajustes.ic, ROUTES.ajustes.t);
  const all = [...groups.flatMap(x => x[2]), foot];
  const by = new Map(all.map(x => [x.k, x]));
  return {role, groups, foot, all, by, bottom: (BOTTOMS[role] || BOTTOMS.dueno).map(k => by.get(k)).filter(Boolean)};
}
/* qué entrada del menú corresponde a la pantalla actual */
function navKey(r, params, route){
  const sub = r + "/" + (params[0] || "");
  if(params.length && NAV && NAV.by.has(sub)) return sub;
  return route.parent || r;
}

/* ---------- estructura ---------- */
const navLink = x => `<a href="${x.href}" data-r="${x.k}">${icon(x.ic)}<span>${t(x.t)}</span>${x.k === "pagos" ? `<i class="nav-badge" data-venc hidden></i>` : ""}</a>`;
const BRAND_SUB = {dueno: "Gestión de academia", profesor: "Modo profesor", estudiante: "Entrenamiento personal"};
let shellRol = null;
function shell(){
  const role = R.rol();
  NAV = buildNav(role); shellRol = role;
  document.body.innerHTML = `${beltDefs}
  <div class="app" data-rol="${role}">
    <aside class="side" id="side">
      <div class="brand">${logo()}<div><b data-acad-name></b><span class="muted small brand-sub">${role === "profesor" ? icon("lock", "inline") : ""}${t(BRAND_SUB[role])}</span></div></div>
      <nav class="nav" aria-label="${t("Secciones")}">${NAV.groups.map(([, n, xs]) => `<div class="nav-grp" role="group" aria-label="${t(n)}"><span class="nav-lbl">${t(n)}</span>${xs.map(navLink).join("")}</div>`).join("")}</nav>
      <div class="side-foot">${navLink(NAV.foot)}<div id="syncBox"></div>${langSwitch()}</div>
    </aside>
    <div class="scrim" id="scrim"></div>
    <div class="main-wrap">
      <div class="offline-strip" id="offStrip" role="status" hidden>${icon("cloudOff")}<span>${t("Sin conexión · tus cambios se guardan aquí")}</span></div>
      <header class="top" id="topBar">
        <div class="top-l"><button class="icon-btn only-m" id="menuBtn" aria-label="${t("Menú")}">${icon("menu")}</button><a class="nav-back" id="navBack" href="#/inicio" hidden>${icon("back")}<span></span></a></div>
        <div class="nav-title" id="navTitle" aria-hidden="true"></div>
        <div class="top-r">
          <div class="nav-act" id="navAct"></div>
          <button type="button" class="top-search" id="searchBtn" aria-label="${t("Buscar")}" aria-keyshortcuts="Control+K Meta+K /">${icon("search")}<span>${t("Buscar")}</span><kbd class="kbd">${/Mac|iP/.test(navigator.platform) ? "⌘" : "Ctrl"} K</kbd></button>
          ${role !== "estudiante" ? `<label class="sede-pick">${icon("map")}<select id="sedeSel" aria-label="${t("Sede")}"></select></label>` : ""}
          <button class="sync-chip" id="syncChip"></button>
        </div>
      </header>
      <div class="lt-wrap"><h1 id="title" class="large-title"></h1></div>
      <main id="main" tabindex="-1" aria-labelledby="title"></main>
    </div>
    <nav class="bottom" aria-label="${t("Navegación principal")}">${NAV.bottom.map(navLink).join("")}<a href="#" id="moreBtn" aria-haspopup="dialog">${icon("grid")}<span>${t("Más")}</span></a></nav>
  </div>
  <div id="toasts" class="toasts" role="status" aria-live="polite"></div>`;
  $("#menuBtn").onclick = () => document.body.classList.add("drawer");
  $("#moreBtn").onclick = e => { e.preventDefault(); moreSheet(); };
  $("#scrim").onclick = () => document.body.classList.remove("drawer");
  $("#side").addEventListener("click", e => { if(e.target.closest("a")){ document.body.classList.remove("drawer"); if(e.target.closest("a[data-r]")) navIntent = "tab"; } });
  if($("#sedeSel")) $("#sedeSel").onchange = e => { S.setPref("sede", e.target.value); render(); };
  $("#searchBtn").onclick = () => import("./palette.js").then(m => m.openPalette()).catch(() => {});
  /* tocar una pestaña: respuesta háptica; tocar la pestaña activa sube al inicio (como en iOS) */
  $(".bottom").addEventListener("click", e => {
    const a = e.target.closest("a"); if(!a) return;
    haptic("selection");
    if(a.dataset.r) navIntent = "tab";
    if(a.classList.contains("on") && a.dataset.r && location.hash.replace(/\?.*/, "") === a.getAttribute("href")){ e.preventDefault(); window.scrollTo({top: 0, behavior: reduced() ? "auto" : "smooth"}); }
  });
  $("#navBack").addEventListener("click", e => {
    /* volver con el historial si la pantalla anterior es la de arriba; si no, ir a ella */
    if(navStack.length > 1 && navStack[navStack.length - 2] === $("#navBack").getAttribute("href")){ e.preventDefault(); history.back(); }
  });
  bindScrollChrome();
  Sync.onStatus(paintSync);
  bindLang();
  paintOnline();
}
/* selector de idioma (barra lateral, «Más» y bienvenida) */
const langSwitch = () => `<div class="lang-sw seg small" role="group" aria-label="${t("Idioma")}">${LANGS.map(([k, n]) => `<button type="button" data-lang="${k}" class="${k === lang() ? "on" : ""}" aria-pressed="${k === lang()}" title="${n}">${k.toUpperCase()}</button>`).join("")}</div>`;
function bindLang(root = document){ for(const b of $$("[data-lang]", root)) b.onclick = () => { if(b.dataset.lang !== lang()) setLang(b.dataset.lang); }; }

/* «Más» en el celular: todas las secciones que no están en la barra de abajo */
function moreSheet(){
  const inBar = new Set(NAV.bottom.map(x => x.k));
  const ks = NAV.all.filter(x => !inBar.has(x.k));
  const {r, params} = parse(), key = navKey(r, params, ROUTES[r]);
  const body = `<div class="more-grid">${ks.map(x => `<a href="${x.href}" class="more-it ${x.k === key ? "on" : ""}">${icon(x.ic)}<span>${t(x.t)}</span></a>`).join("")}
    <button type="button" class="more-it" data-pal>${icon("search")}<span>${t("Buscar")}</span></button></div>
    <div class="more-foot"><div class="more-sync"></div>${langSwitch()}</div>`;
  const sh = sheet({title: t("Más"), body});
  const st = Sync.status(), [ic, txt, k] = syncLook(st);
  sh.el.querySelector(".more-sync").innerHTML = `<button type="button" class="sync-chip ${k}" data-sync-open>${ic === "dot" ? `<i class="sync-dot"></i>${icon("cloudOff", "sync-off")}` : icon(ic)}<span>${txt}</span></button>`;
  sh.el.addEventListener("click", e => {
    if(e.target.closest(".more-it[href]")){ navIntent = "tab"; sh.close(); }
    if(e.target.closest("[data-pal]")){ sh.close(); import("./palette.js").then(m => m.openPalette()).catch(() => {}); }
    if(e.target.closest("[data-sync-open]")){ sh.close(); syncTap(Sync.status()); }
  });
  bindLang(sh.el);
}

function paintSedes(){
  /* estudiante: su nombre o «Mi entrenamiento» (la academia, si la hay, queda oculta) */
  const nombre = shellRol === "estudiante" ? (R.perfil()?.nombre || t("Mi entrenamiento")) : S.academy()?.nombre || t("Mi academia");
  for(const el of $$("[data-acad-name]")) el.textContent = nombre;
  const sel = $("#sedeSel"); if(!sel) return;
  const ss = S.sedes(), cur = S.curSede();
  sel.innerHTML = `<option value="">${t("Todas las sedes")}</option>` + ss.map(s => `<option value="${s.id}" ${s.id === cur ? "selected" : ""}>${esc(s.nombre)}</option>`).join("");
  sel.parentElement.hidden = ss.length < 2;
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
  /* modo profesor: conectar o reconectar Google (quizá con otra cuenta) lo hace el dueño, tras salir con su PIN */
  if(R.rol() === "profesor" && (st.phase === "off" || st.phase === "reconnect")) return void (location.hash = "#/ajustes");
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
  chip.innerHTML = `${ic === "dot" ? `<i class="sync-dot"></i>${icon("cloudOff", "sync-off")}` : icon(ic, st.phase === "syncing" || st.phase === "pending" ? "spin" : "")}<span>${txt}</span>`;
  chip.title = st.msg || (st.email ? `Google Drive: ${st.email}` : t("Los datos están solo en este aparato"));
  chip.setAttribute("aria-label", txt);
  chip.onclick = () => syncTap(st);
  box.innerHTML = st.email ? `<div class="acct">${st.photo ? `<img src="${esc(st.photo)}" alt="" referrerpolicy="no-referrer">` : icon("cloud")}<div><b>${esc(st.name || "Google")}</b><span class="muted small">${esc(st.email)}</span></div></div>`
    : R.rol() === "profesor" ? "" : `<button type="button" class="btn ghost small block" data-sync-cta>${icon("cloud")} ${t("Conectar Google")}</button>`;
  const cta = box.querySelector("[data-sync-cta]"); if(cta) cta.onclick = () => { document.body.classList.remove("drawer"); syncTap(Sync.status()); };
}
function paintOnline(){ const el = $("#offStrip"); if(el) el.hidden = navigator.onLine !== false; }

/* ---------- rutas ---------- */
let cur = null, cleanup = null, rendDay = "", token = 0;
const mods = {};
/* ctx para las vistas: render, título y la consulta del hash (#/alumnos?new=1) */
function setTitle(s){
  const el = $("#title"), nt = $("#navTitle");
  if(el) el.textContent = s;
  if(nt) nt.textContent = s;
}
const ctx = {render, setTitle, query: new URLSearchParams()};
function parse(){
  const raw = location.hash.replace(/^#\/?/, "");
  const qi = raw.indexOf("?");
  const path = qi < 0 ? raw : raw.slice(0, qi), qs = qi < 0 ? "" : raw.slice(qi + 1);
  const [r, ...rest] = (path || R.home()).split("/");
  return {r: ROUTES[r] ? r : R.home(), params: rest.filter(x => x !== "").map(x => { try{ return decodeURIComponent(x); }catch(e){ return x; } }), query: new URLSearchParams(qs)};
}
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
async function loadMod(k){
  if(mods[k]) return mods[k];
  const r = ROUTES[k];
  return (mods[k] = r.v || await r.load());
}
const unavailable = () => `<div class="card">${`<div class="empty-st warn"><span class="empty-ic">${icon("alert")}</span><h3>${t("Esta sección no está disponible")}</h3><p>${t("Revisa tu conexión y vuelve a intentarlo.")}</p><div class="empty-cta"><button type="button" class="btn ghost" data-retry>${icon("sync")}<span>${t("Reintentar")}</span></button><a class="btn primary" href="#/${R.home()}">${t("Ir a Inicio")}</a></div></div>`}</div>`;
/* el foco vuelve al mismo control después de repintar la misma pantalla: por id, por name o por sus data-* */
function focusKey(el){
  if(!el || el === document.body || !el.closest?.("#main")) return null;
  if(el.id) return "#" + CSS.escape(el.id);
  if(el.name) return `${el.tagName.toLowerCase()}[name="${CSS.escape(el.name)}"]`;
  const d = [...el.attributes].filter(x => x.name.startsWith("data-") && x.value);
  return d.length ? el.tagName.toLowerCase() + d.map(x => `[${x.name}="${CSS.escape(x.value)}"]`).join("") : null;
}
/* barra de pestañas y lateral: marcar la sección; las de «Más» marcan «Más» */
function paintTabs(r, route, params){
  const key = navKey(r, params, route);
  for(const a of $$(".side [data-r], .bottom [data-r]")){ const on = a.dataset.r === key; a.classList.toggle("on", on); on ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"); }
  const more = $("#moreBtn");
  if(more){ const inBar = NAV.bottom.some(x => x.k === key); more.classList.toggle("on", !inBar); inBar ? more.removeAttribute("aria-current") : more.setAttribute("aria-current", "page"); }
}
const scrollMem = new Map();
let spinT = 0;
export function render(keepScroll){
  const role = R.rol();
  if(!role) return welcome();
  /* otro modo de uso: se arma de nuevo la estructura (menús, pestañas, marca) */
  if(!$(".app") || shellRol !== role){ shell(); cur = null; }
  paintSedes();
  paintBadge();
  const {r, params, query} = parse();
  /* una ruta que este modo no muestra (escrita a mano, un atajo, un enlace viejo) lleva al inicio del modo */
  if(!R.allowed(r, role)){ location.replace("#/" + R.home(role)); return; }
  /* kiosco activo en este aparato: «atrás» o un enlace no sacan de él; solo el PIN del profesor */
  if(role !== "estudiante" && S.pref("kioskOn") && S.pref("kioskPin") && r !== "kiosko"){ location.replace("#/kiosko"); return; }
  const route = ROUTES[r];
  const main = $("#main");
  const sameRoute = cur === location.hash;
  const my = ++token;
  /* recordar dónde quedó la pantalla que se va, para devolverla al volver (como en iOS) */
  if(!sameRoute && cur) scrollMem.set(cur, window.scrollY);
  rendDay = today();
  /* título, «atrás» y pestaña activa cambian DENTRO de la transición: la captura vieja conserva los suyos */
  const chrome = () => {
    document.body.classList.toggle("bare", !!route.bare);
    setTitle(t(route.t));
    paintBack(r, route, params);
    paintTabs(r, route, params);
  };
  let dir = "";
  const paint = mod => {
    if(my !== token) return;
    clearTimeout(spinT);
    if(cleanup) try{ cleanup(); }catch(e){}
    cleanup = null;
    const active = document.activeElement, key = sameRoute ? focusKey(active) : null;
    const selStart = active && active.selectionStart;
    const fromChrome = !sameRoute && cur && active && (active === document.body || active.closest?.("#side, .bottom, #navBack, .top"));
    chrome();
    main.onclick = main.oninput = main.onchange = null;
    ctx.query = query;
    if(!mod){ main.innerHTML = unavailable(); main.querySelector("[data-retry]").onclick = () => { delete mods[r]; render(); }; }
    else try{ cleanup = mod.render(main, params, ctx, query) || null; }
    catch(e){ console.error(e); main.innerHTML = `<div class="card"><h3>${t("Algo falló al mostrar esta pantalla")}</h3><pre class="small">${esc(e.stack || e)}</pre></div>`; }
    if(typeof cleanup !== "function") cleanup = null;   // una vista async devuelve una promesa
    if(key){ let el = null; try{ el = main.querySelector(key); }catch(e){} if(el){ el.focus({preventScroll: true}); try{ el.setSelectionRange(selStart, selStart); }catch(e){} } }
    if(!sameRoute) window.scrollTo(0, dir === "pop" ? (scrollMem.get(location.hash) || 0) : 0);
    else window.scrollTo(0, y);
    /* al cambiar de pantalla con el teclado desde la barra lateral o de pestañas, el foco pasa al contenido */
    if(fromChrome) try{ main.focus({preventScroll: true}); }catch(e){}
    if(!cur) enter("first");
    cur = location.hash;
    adoptBack();
    adoptActions();
    paintChrome();
  };
  const y = keepScroll && sameRoute ? window.scrollY : 0;
  dir = sameRoute ? "" : navDirection(r, params, location.hash);
  /* transición solo al cambiar de pantalla (no al repintar la misma): empujar, volver o fundido entre pestañas */
  const go = mod => {
    if(my !== token) return;
    const first = !cur;
    if(sameRoute || first || reduced() || document.hidden || dir === "none" || !document.startViewTransition){
      paint(mod);
      if(!sameRoute && !first && dir !== "none" && !reduced()) enter("plain");
      return;
    }
    document.documentElement.dataset.nav = dir;
    const vt = document.startViewTransition(() => paint(mod));
    const done = () => { if(document.documentElement.dataset.nav === dir) delete document.documentElement.dataset.nav; };
    vt.finished.then(done, done);
    /* si otra navegación la interrumpe, el navegador la salta: no es un error */
    for(const k of ["ready", "finished", "updateCallbackDone"]) vt[k]?.catch?.(() => {});
  };
  if(mods[r]) return go(mods[r]);
  /* la pantalla vieja sigue a la vista mientras carga el módulo (así la transición sale de ella);
     la ruedita solo aparece si la carga tarda */
  clearTimeout(spinT);
  if(!sameRoute) spinT = setTimeout(() => {
    if(my !== token) return;
    chrome();
    main.innerHTML = `<div class="view-load" aria-busy="true"><div class="boot-spin"></div></div>`;
    window.scrollTo(0, 0); paintChrome();
  }, cur ? 350 : 0);
  loadMod(r).then(go, e => { console.warn("[ruta]", r, e); go(null); });
}
/* dirección de la transición: «push» al entrar más adentro (detalle de una lista, subpantalla), «pop» al volver
   (atrás del navegador o a la pantalla de arriba) y «fade» entre secciones hermanas.
   Tocar una pestaña (barra de abajo, lateral o «Más») nunca es «atrás»: empieza una pila nueva. */
const navStack = [];
let prevNav = null, navIntent = "";
function navDirection(r, params, hash){
  const prev = prevNav; prevNav = {r, n: params.length};
  const tab = navIntent === "tab"; navIntent = "";
  let back = false;
  if(tab){ navStack.length = 0; navStack.push(hash); }
  else if(navStack.length > 1 && navStack[navStack.length - 2] === hash){ navStack.pop(); back = true; }
  else if(navStack[navStack.length - 1] !== hash){ navStack.push(hash); if(navStack.length > 60) navStack.shift(); }
  if(!prev) return "fade";
  const pr = ROUTES[prev.r] || {}, nr = ROUTES[r] || {};
  if(r === prev.r && params.length === prev.n && params.length === 0) return "none";
  if(tab) return "fade";
  if(back) return "pop";
  if(nr.parent === prev.r || (r === prev.r && params.length > prev.n)) return "push";
  if(pr.parent === r || (r === prev.r && params.length < prev.n)) return "pop";
  return "fade";
}
/* animación de entrada: «first» al abrir la app, «plain» sin View Transitions, «vt» con ellas (solo marca la entrada) */
let enterT = 0;
function enter(kind){
  const m = $("#main"); if(!m || !kind) return;
  m.dataset.enter = kind;
  clearTimeout(enterT);
  enterT = setTimeout(() => { delete m.dataset.enter; }, 900);
}
/* botón «atrás» de la barra de navegación: en pantallas con «parent» (alumno, recibo, certificado) o en subpantallas */
function setBack(b, href, label){
  b.hidden = false; document.body.classList.add("has-back");
  b.setAttribute("href", href);
  b.dataset.full = label;
  b.querySelector("span").textContent = label;
  b.setAttribute("aria-label", t("Volver a {x}", {x: label}));
}
function paintBack(r, route, params){
  const b = $("#navBack"); if(!b) return;
  /* estudiante: sus secciones (Progreso, Repaso, Glosario...) son raíces de pestaña o del menú, sin «atrás» (como en iOS) */
  const tabRoot = shellRol === "estudiante" && params.length === 1 && !!NAV?.by.has(r + "/" + params[0]);
  document.body.classList.toggle("tab-root", tabRoot);
  const up = tabRoot ? "" : route.parent || (params.length ? r : "");
  b.hidden = !up;
  document.body.classList.toggle("has-back", !!up);
  if(up) setBack(b, "#/" + up, t(ROUTES[up].t));
}
/* si la vista trae su propio enlace «atrás» (p. ej. certificado → alumno), la barra lo usa y se oculta el de la vista */
function adoptBack(){
  const b = $("#navBack"), v = document.body.classList.contains("tab-root") ? null : $("#main > .back"); if(!b) return;
  document.body.classList.toggle("view-back", !!v);
  if(v) setBack(b, v.getAttribute("href"), v.textContent.trim());
}
/* acciones de la vista que en iOS van a la derecha de la barra: «Editar» ([data-nav-act]) y «+» (.fab) */
function adoptActions(){
  const box = $("#navAct"); if(!box) return;
  const src = $$("#main [data-nav-act], #main .fab");
  box.innerHTML = "";
  for(const el of src){
    const isFab = el.classList.contains("fab");
    const lbl = el.getAttribute("aria-label") || el.textContent.trim();
    const b = document.createElement("button");
    b.type = "button";
    b.className = isFab ? "icon-btn nav-add" : "btn plain nav-txt";
    b.setAttribute("aria-label", lbl);
    b.innerHTML = isFab ? icon("plus") : esc(el.textContent.trim());
    b.onclick = () => { haptic("light"); el.click(); };
    box.appendChild(b);
  }
  document.body.classList.toggle("has-nav-act", !!src.length);
}
/* barra de navegación: línea fina al desplazar y título pequeño cuando el grande queda debajo de la barra.
   Si el título pequeño no deja sitio, el botón «atrás» dice solo «Atrás», como en iOS. */
let chromeRaf = 0;
function paintChrome(){
  const top = $("#topBar"), lt = $("#title"); if(!top || !lt) return;
  const y = window.scrollY, r = lt.getBoundingClientRect(), barH = top.getBoundingClientRect().bottom;
  top.classList.toggle("scrolled", y > 2);
  const was = top.classList.contains("collapsed");
  const col = !lt.textContent || r.bottom - 6 < barH;
  top.classList.toggle("collapsed", col);
  const b = $("#navBack");
  if(b && !b.hidden && b.dataset.full){
    const sp = b.querySelector("span");
    if(col !== was || sp.textContent !== b.dataset.full && !col){
      sp.textContent = b.dataset.full;
      if(col && sp.scrollWidth > sp.clientWidth + 1) sp.textContent = t("Atrás");
    }else if(col && sp.textContent === b.dataset.full && sp.scrollWidth > sp.clientWidth + 1) sp.textContent = t("Atrás");
  }
}
function bindScrollChrome(){
  window.addEventListener("scroll", () => { if(chromeRaf) return; chromeRaf = requestAnimationFrame(() => { chromeRaf = 0; paintChrome(); }); }, {passive: true});
  window.addEventListener("resize", paintChrome, {passive: true});
}
const rerender = debounce(() => { if(!document.querySelector(".modal-back")) render(true); else pendingRender = true; }, 80);
let pendingRender = false;
window.addEventListener("mma:modal", () => { if(pendingRender && !document.querySelector(".modal-back")){ pendingRender = false; render(true); } });

/* ---------- bienvenida: primero, cómo se va a usar (entrenar o manejar una academia) ---------- */
const W_ARTES = [["bjj", "BJJ"], ["muaythai", "Muay Thai"], ["lucha", "Lucha"], ["boxeo", "Boxeo"], ["mma", "MMA"]];
let wStep = "rol";
function welcome(step = wStep){
  wStep = step;
  document.body.classList.remove("bare", "drawer");
  const back = `<button type="button" class="btn plain w-back" id="wBack">${icon("back")}<span>${t("Atrás")}</span></button>`;
  const brand = `<div class="w-brand">${logo(64)}<h1>Academia<span>Pro</span></h1></div>`;
  const legal = `<p class="small muted w-legal">${t("Con Google tus datos se guardan en una carpeta privada de tu propio Drive y puedes usar la app en el celular y el computador. Si ya tienes datos, se recuperan solos.")}</p>`;
  const card = {
    rol: `${brand}
      <h2 class="w-q">${t("¿Cómo vas a usar AcademiaPro?")}</h2>
      <div class="w-roles">
        <button type="button" class="w-role press" id="wTrain"><span class="w-role-ic tr">${icon("fist")}</span><span class="w-role-t"><b>${t("Quiero entrenar")}</b><span>${t("Soy estudiante o practico por mi cuenta: rutas de BJJ, Muay Thai, Lucha, Boxeo y MMA, rutina, progreso y frases.")}</span></span>${icon("chevron", "w-role-go")}</button>
        <button type="button" class="w-role press" id="wOwner"><span class="w-role-ic ac">${icon("building")}</span><span class="w-role-t"><b>${t("Tengo una academia")}</b><span>${t("Soy dueño de una academia: alumnos, pagos, asistencia, cinturones y ranking.")}</span></span>${icon("chevron", "w-role-go")}</button>
      </div>
      <p class="small muted w-note">${t("¿Eres profesor de una academia que ya usa AcademiaPro? No crees otra: pide al dueño que active el modo profesor en Ajustes, en el aparato de la academia.")}</p>
      <div class="w-or"><span>${t("¿Ya usas AcademiaPro?")}</span></div>
      <div class="w-actions"><button class="btn ghost big" id="wGoogle">${gIcon()}<span>${t("Entrar con Google")}</span></button></div>
      ${legal}`,
    dueno: `${back}${brand}
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
      ${legal}`,
    estudiante: `${back}${brand}
      <p class="lead">${t("Caminos de aprendizaje de lo básico a lo avanzado, una rutina que se arma sola y tu progreso. Gratis, sin academia y sin cuenta.")}</p>
      <form class="form w-form" id="wForm" novalidate>
        <div class="field"><label class="lbl" for="wName">${t("¿Cómo te llamas? (opcional)")}</label><input id="wName" name="nombre" autocomplete="given-name" maxlength="60" enterkeyhint="go" placeholder="${t("Tu nombre")}"></div>
        <div class="field"><span class="lbl">${t("¿Qué quieres entrenar? (opcional)")}</span><div class="chips">${W_ARTES.map(([k, n]) => `<label class="chip"><input type="checkbox" name="artes" value="${k}"><span>${esc(t(n))}</span></label>`).join("")}</div></div>
      </form>
      <div class="w-actions">
        <button class="btn primary big" id="wStudent">${icon("fist")}<span>${t("Empezar a entrenar")}</span></button>
        <button class="btn ghost big" id="wGoogle">${gIcon()}<span>${t("Entrar con Google")}</span></button>
      </div>
      <p class="small muted w-legal">${t("Tu progreso se guarda en este aparato. Con Google también queda en tu Drive y lo ves en el celular y el computador.")}</p>`,
  }[step] || "";
  document.body.innerHTML = `${beltDefs}<div class="welcome">
    <div class="w-card w-${step}" role="main">${card}<div class="w-lang">${langSwitch()}</div></div></div>
  <div id="toasts" class="toasts" role="status" aria-live="polite"></div>`;
  bindLang();
  const on = (id, fn) => { const b = $("#" + id); if(b) b.onclick = fn; };
  on("wBack", () => welcome("rol"));
  on("wTrain", () => { welcome("estudiante"); setTimeout(() => $("#wName")?.focus({preventScroll: true}), 60); });
  on("wOwner", () => welcome("dueno"));
  on("wLocal", () => createAcademy());
  /* cuenta: el modo también se guarda en la cuenta (perfil). No se hace si Google no pudo bajar los datos: el perfil
     de la cuenta podría ser otro y este, más nuevo, le ganaría */
  const empezar = (cuenta = true) => {
    const f = $("#wForm"), nombre = (f?.nombre?.value || "").trim().slice(0, 60);
    const artes = [...(f?.querySelectorAll("[name=artes]:checked") || [])].map(x => x.value);
    /* solo lo que se escribió: un campo vacío no borra el nombre o las artes que la cuenta ya tenía */
    const datos = {};
    if(nombre) datos.nombre = nombre;
    if(artes.length) datos.artes = artes;
    if(Object.keys(datos).length) R.guardarPerfil(datos);
    if(cuenta) R.setRol("estudiante"); else S.setPref("rol", "estudiante");
    wStep = "rol";
    location.hash = "#/entreno";
    render();
    const quien = nombre || R.perfil()?.nombre || "";
    toast(quien ? t("¡Listo, {nombre}! Arma tu rutina o elige un camino.", {nombre: quien}) : t("¡Listo! Arma tu rutina o elige un camino."));
  };
  on("wStudent", () => empezar());
  $("#wForm")?.addEventListener("submit", e => { e.preventDefault(); empezar(); });
  on("wGoogle", async () => {
    try{
      await Sync.connect();
      /* connect() no falla si la bajada falla: se mira si de verdad quedó sincronizado */
      const bajo = Sync.status().phase === "ok";
      /* eligió entrenar: manda su elección en este aparato (la academia de la cuenta, si la hay, queda oculta) */
      if(step === "estudiante") return empezar(bajo && !S.academy());
      /* la cuenta ya tenía datos: se entra en el modo guardado (estudiante o dueño) */
      if(R.adoptarSincronizado(step === "dueno" ? "dueno" : null)){ toast(t("Datos recuperados de Google Drive")); wStep = "rol"; if(!location.hash || location.hash === "#/") location.hash = "#/" + R.home(); render(); return; }
      if(!bajo){ toast(Sync.status().msg || t("No se pudieron bajar tus datos de Google Drive. Inténtalo de nuevo."), "warn"); return; }
      if(step === "dueno") createAcademy();
      else toast(t("Conectado con Google Drive. Ahora elige cómo vas a usar la app."));
    }catch(e){ toast(Sync.errText(e.code), "error"); }
  });
}

/* ---------- arranque ---------- */
async function boot(){
  if(window.__mmaBooted) return;
  window.__mmaBooted = true;
  setRenderer(render);
  applyTheme(); watchSystemTheme();
  document.title = t("AcademiaPro · Gestión de academias de artes marciales");
  S.load();
  /* quien ya tenía academia antes de los modos de uso sigue como dueño, aunque otro aparato de la cuenta sea de estudiante */
  if(!S.pref("rol") && S.academy()) S.setPref("rol", "dueno");
  await S.loadFotos();
  S.subscribe(() => { if(document.querySelector(".app")) rerender(); else if(R.rol() && !document.querySelector(".modal-back")) render(); });
  window.addEventListener("hashchange", () => { document.body.classList.remove("drawer"); dismissToasts(); render(); });
  window.addEventListener("beforeunload", S.flush);
  window.addEventListener("online", paintOnline);
  window.addEventListener("offline", paintOnline);
  document.addEventListener("visibilitychange", () => {
    if(document.visibilityState === "hidden") S.flush();
    /* pasó la medianoche con la app abierta: volver a pintar con la fecha nueva */
    else if(rendDay && rendDay !== today() && R.rol() && !document.querySelector(".modal-back")) render(true);
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
