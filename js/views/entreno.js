/* Entrenamiento: rutina personal, sesión del día y caminos de aprendizaje por arte.
   Sub-rutas: #/entreno/glosario, repaso, stats, logros, diario y curriculo/<sistema> (no son artes). */
import * as E from "../entreno/index.js";
import * as T from "../entreno/timer.js";
import * as S from "../store.js";
import {icon, toast, modal, confirmDlg, haptic} from "../ui.js";
import {esc, today, fmtDate, addDays, h, norm, parseISO} from "../util.js";
import {t, tn, lang} from "../i18n.js";

const PLAT = {youtube: ["YouTube", "#ff0033"], tiktok: ["TikTok", "#25f4ee"], udemy: ["Udemy", "#a435f0"], instagram: ["Instagram", "#e1306c"], articulo: [t("Artículo"), "#d4a73c"], web: ["Web", "#8a8a8a"]};
const st = {dia: today(), hoy: today(), filtro: "todas", gq: "", ga: "", cr: {}};
/* las sub-vistas que viven en su propio archivo */
const SUBS = {repaso: () => import("../entreno/repaso.js"), stats: () => import("../entreno/stats.js"), logros: () => import("../entreno/logros.js"), diario: () => import("../entreno/diario.js")};
const IDS = () => E.ARTES.map(a => a.id);
/* títulos de las sub-vistas (el título grande de la barra lo pinta el shell) */
const SUB_T = {repaso: "Repaso", stats: "Estadísticas", logros: "Logros", diario: "Diario"};
/* tono de cada arte (texto, anillos, puntos) y su degradado oscuro (tarjetas): ver css/entreno.css */
export const tono = a => a ? `var(--art-${a.id || a})` : "var(--accent2)";
const artVars = a => `--c:var(--art-${a.id});--g:var(--g-${a.id})`;

export function render(el, params = [], ctx = {}, query){
  const [artId, modId] = params, q = query || ctx.query || new URLSearchParams();
  const titulo = s => { try{ ctx.setTitle?.(s); }catch(e){} };
  /* pasó la medianoche: si estaba en "hoy", sigue en el día nuevo */
  if(st.hoy !== today()){ if(st.dia === st.hoy) st.dia = today(); st.hoy = today(); }
  if(artId === "glosario"){ titulo(t("Glosario")); return vistaGlosario(el, q); }
  if(artId === "curriculo"){ titulo(modId && CUR_NOM[modId] ? t(CUR_NOM[modId]) : t("Mi cinturón")); return vistaCurriculo(el, modId); }
  if(SUBS[artId]){ titulo(t(SUB_T[artId])); return conCarga(el, IDS(), () => SUBS[artId]().then(m => { if(el.isConnected) m.render(el, {params, query: q}); })
    .catch(e => { console.error(e); el.innerHTML = sinCargar(); }), volver()); }
  if(artId && E.arte(artId)){
    const a = E.arte(artId);
    titulo(t(a.nombre));
    const atras = modId ? volver(`#/entreno/${artId}`, t(a.nombre)) : volver();
    return conCarga(el, [artId], () => !E.cargado(artId) ? (el.innerHTML = sinCargar())
      : modId ? vistaModulo(el, artId, modId, titulo) : vistaArte(el, artId), atras);
  }
  if(artId && !E.arte(artId)){ location.replace("#/entreno"); return; }
  const r = E.rutina();
  return conCarga(el, IDS(), () => vistaHub(el, r));
}
const sinCargar = () => `${volver()}<div class="card"><div class="empty-st warn"><span class="empty-ic">${icon("alert")}</span><h3>${t("Sin conexión")}</h3><p>${t("No se pudo cargar el contenido. Revisa tu conexión.")}</p></div></div>`;
/* esqueleto mientras carga el contenido (sin texto que salte) */
const cargando = (atras = "") => `${atras}<div class="en-skel" aria-busy="true"><span class="en-sr">${t("Cargando…")}</span>
  <div class="sk en-skel-hero"></div><div class="card"><div class="sk sk-line" style="width:40%"></div><div class="sk sk-line"></div><div class="sk sk-line" style="width:72%"></div></div></div>`;

/* carga el contenido que haga falta y luego pinta (un arte que no carga queda escondido) */
function conCarga(el, ids, pintar, atras = ""){
  const falta = ids.filter(id => !E.intentado(id));
  if(!falta.length) return pintar();
  const hash = location.hash;
  el.innerHTML = cargando(atras);
  Promise.all(falta.map(E.cargar)).then(() => { if(location.hash === hash && el.isConnected) pintar(); })
    .catch(e => { console.error(e); el.innerHTML = sinCargar(); });
}
/* cabecera común de las sub-vistas */
/* la barra de navegación adopta este enlace en el celular («‹ Entrenamiento») y lo oculta en la vista */
export const volver = (href = "#/entreno", txt = t("Entrenamiento")) => `<a class="back en-back" href="${href}">${icon("back")} ${esc(txt)}</a>`;

/* anillo de progreso al estilo de Actividad: trazo grueso con punta redonda; el tamaño define el grosor */
export const ring = (p, s = 52, color = "var(--accent)", txt = p + "%") => { const w = Math.max(4, Math.round(s / 9)), r = s / 2 - w / 2 - .5, c = 2 * Math.PI * r;
  return `<svg class="en-ring" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" style="--rw:${w}px" role="img" aria-label="${esc(txt === p + "%" ? p + "%" : txt)}"><circle cx="${s / 2}" cy="${s / 2}" r="${r}" class="bg"/><circle cx="${s / 2}" cy="${s / 2}" r="${r}" class="fg ${p ? "" : "zero"}" style="stroke:${color}" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p / 100)}"/><text x="50%" y="50%" dy=".35em" text-anchor="middle" style="font-size:${Math.max(10, Math.round(s / 4.6))}px">${esc(txt)}</text></svg>`; };
export const chk = (k, label = "", cls = "", off = false) => `<label class="en-chk ${cls}"><input type="checkbox" data-k="${esc(k)}" ${E.hecho(k) ? "checked" : ""} ${off ? "disabled" : ""}><span class="box" aria-hidden="true"></span>${label}</label>`;
const nivelT = n => t((E.NIVELES.find(x => x[0] === n) || [, n])[1]);
export const esNota = () => lang() === "en" ? `<p class="muted small en-note">${icon("info", "inline")} ${t("El contenido de los caminos está en español.")}</p>` : "";

/* ---------- inicio de Entrenamiento ---------- */
const PLAY = `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>`;
export const TIPOS = [["rutina", "Rutina"], ["clase", "Clase"], ["sparring", "Sparring"], ["openmat", "Open mat"], ["cardio", "Cardio"], ["app", "App"]];
const tipoT = k => t((TIPOS.find(x => x[0] === k) || TIPOS[0])[1]);
const ZONAS = [["", "Ninguna"], ["cuello", "Cuello"], ["hombro", "Hombro"], ["codo", "Codo"], ["mano", "Muñeca o mano"], ["espalda", "Espalda"], ["cadera", "Cadera"], ["rodilla", "Rodilla"], ["tobillo", "Tobillo o pie"], ["otra", "Otra"]];
const zonaT = k => t((ZONAS.find(x => x[0] === k) || [, k])[1]);
const ENERGIA = [[1, "Agotado", "M8 16.5c2.2-2 5.8-2 8 0"], [2, "Normal", "M8 15.5h8"], [3, "Con energía", "M8 14.5c2.2 2.2 5.8 2.2 8 0"]];
const cara = n => { const e = ENERGIA.find(x => x[0] === +n); return e ? `<svg class="en-face e${n}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><circle cx="9" cy="10" r=".6" fill="currentColor"/><circle cx="15" cy="10" r=".6" fill="currentColor"/><path d="${e[2]}"/></svg>` : ""; };
const artesT = s => (s.artes || []).map(a => esc(t(E.arte(a)?.corto || a))).join(", ");

/* detalle de una sesión registrada: minutos, tipo, RPE, energía, molestia y nota */
function meta(s, full){
  const ps = [tn(s.min || 0, "1 min", "{n} min")];
  /* en los registrados a mano el tipo y el arte ya van en el título */
  if(s.plan || !s.tipo || full){ if(s.tipo && s.tipo !== "rutina") ps.push(esc(tipoT(s.tipo))); if(s.artes?.length) ps.push(artesT(s)); }
  if(s.rpe) ps.push(t("RPE {n}", {n: s.rpe}));
  return `<span class="muted small en-meta">${ps.join(" · ")}${s.energia ? ` <span class="en-en" title="${esc(t(ENERGIA[s.energia - 1]?.[1] || ""))}">${cara(s.energia)}</span>` : ""}${s.molestia ? ` <span class="pill vencido">${esc(t("Molestia: {z}", {z: zonaT(s.molestia)}))}</span>` : ""}</span>
    ${s.nota ? `<span class="en-nota">${esc(s.nota)}</span>` : ""}`;
}
function resumen(s){
  const titulo = s.plan ? t("Sesión completada") : s.tipo ? `${tipoT(s.tipo)}${s.artes?.length ? " · " + artesT(s) : ""}` : t("Sesión completada");
  return `<div class="en-done"><span class="en-done-ic">${icon("check")}</span><div><b>${esc(titulo)}</b>${meta(s)}${!s.plan && !s.tipo ? `<span class="muted small">${tn(s.hechos?.length || 0, "1 bloque marcado", "{n} bloques marcados")}</span>` : ""}</div>
    <span class="en-done-b"><button class="icon-btn gray" data-editar="${esc(s.id)}" aria-label="${t("Editar diario")}" title="${t("Editar diario")}">${icon("edit")}</button><button class="btn small ${s.plan ? "gray" : "danger ghost"}" data-deshacer="${esc(s.id)}">${s.plan ? t("Deshacer") : t("Borrar")}</button></span></div>`;
}

function vistaHub(el, r){
  const hoy = today(), futuro = st.dia > hoy;
  const sem = E.semana(st.dia);
  /* la sesión vieja de rutina (sin plan ni tipo) cuenta como la del día */
  const regs = E.sesionDe(st.dia), main = regs.find(x => x.plan) || regs.find(x => !x.plan && !x.tipo && E.fin(x)), otras = regs.filter(x => x !== main && E.fin(x));
  const prev = !main && r && st.dia >= hoy ? E.sesion(r, st.dia) : null;
  const bloques = main ? E.bloquesDe(main) : prev ? prev.bloques : null;
  const modo = main ? (E.fin(main) ? "hecha" : "curso") : prev ? (futuro ? "futuro" : "preview") : null;
  const hechos = new Set(main?.hechos || []);
  const hs = E.hechas(), conSes = new Set(hs.map(s => s.fecha));
  const mes = hoy.slice(0, 7), minMes = hs.filter(s => s.fecha.startsWith(mes)).reduce((a, s) => a + (+s.min || 0), 0);
  const rc = E.rachas(r), desde = r?._c ? E.toISO(new Date(r._c)) : "";
  const cab = main || prev;
  const tocaba = r && E.artesDelDia(r, st.dia).length;
  const princ = (bloques || []).filter(b => b.tipo !== "tarea"), tareas = (bloques || []).filter(b => b.tipo === "tarea");
  const nb = princ.filter(b => b.tipo !== "video").length, nh = princ.filter(b => hechos.has(b.b)).length;
  const ms = E.metaSemana(r), nRep = E.pendientesRepaso().length, ayer = E.faltoAyer(r);
  const disp = E.disponibles(), artes = disp.filter(a => !E.esComplemento(a)), comps = disp.filter(E.esComplemento);
  const metaTxt = m => m.tipo === "min" ? `${m.hecho}/${m.valor} min` : `${m.hecho}/${m.valor}`;

  const semN = E.semana(hoy).filter(d => conSes.has(d)).length;
  const TOOLS = [["glosario", "book", "Glosario", "steel"], ["repaso", "repeat", "Repaso", "crimson"], ["stats", "chart", "Estadísticas", "olive"],
    ["logros", "award", "Logros", "brass"], ["diario", "edit", "Diario", "burnt"], ["curriculo", "belt", "Mi cinturón", "gunmetal"]];

  el.innerHTML = `
  ${esNota()}
  ${!r ? `<section class="en-cta1">
    <span class="en-cta1-ic">${icon("calendar")}</span>
    <div class="en-cta1-t"><span class="en-eye">${t("Rutina")}</span><b>${t("Arma tu rutina de entrenamiento")}</b><span>${t("La app te arma cada sesión con los drills de tu nivel.")}</span></div>
    <div class="en-cta1-b"><button class="btn big primary" data-rutina>${t("Crear mi rutina")}</button><button class="btn-link" data-registrar>${icon("plus")} ${t("Registrar entreno")}</button></div></section>` : ""}
  ${r || hs.length || nRep ? `<div class="en-tiles en-sum">
    ${ms ? `<div class="en-tile en-tile-ring" title="${esc(t("Meta semanal"))}">${ring(ms.pct, 52, ms.ok ? "var(--art-mma)" : "var(--tint)", ms.ok ? "✓" : ms.pct + "%")}<div><b class="tnum">${metaTxt(ms)}</b><span>${ms.tipo === "min" ? t("Minutos esta semana") : t("Días esta semana")}</span></div></div>`
      : `<div class="en-tile"><span class="kpi-ic c2">${icon("check")}</span><div><b class="tnum">${semN}</b><span>${t("Días entrenados esta semana")}</span></div></div>`}
    <a class="en-tile lnk press" href="#/entreno/repaso"><span class="kpi-ic c1">${icon("repeat")}</span><div><b class="tnum">${nRep}</b><span>${t("Repaso de hoy")}</span></div></a>
    <div class="en-tile"><span class="kpi-ic c4">${icon("flame")}</span><div><b class="tnum">${tn(rc.actual, "1 día", "{n} días")}</b><span>${t("Racha · récord {n}", {n: rc.record})}</span></div></div>
    <a class="en-tile lnk press" href="#/entreno/stats"><span class="kpi-ic c3">${icon("clock")}</span><div><b class="tnum">${tn(minMes, "1 min", "{n} min")}</b><span>${t("Entrenados este mes")}</span></div></a>
  </div>` : ""}
  ${ayer ? `<div class="en-ayer"><span class="en-ayer-ic">${icon("alert")}</span><span>${t("Ayer tocaba entrenar y no hay registro. Si entrenaste, regístralo y no pierdes la racha.")}</span><button class="btn small tinted" data-ayer="${ayer}">${t("Recuperar ayer")}</button></div>` : ""}

  ${r ? `<div class="en-h"><h2>${t("Tu semana")}</h2><div class="en-h-act"><button class="icon-btn gray" data-ics aria-label="${t("Agregar a mi calendario")}" title="${t("Agregar a mi calendario")}">${icon("download")}</button><button class="btn small tinted" data-rutina>${icon("edit")} ${t("Rutina")}</button></div></div>
  <section class="card en-weekc">
    <div class="en-weekbar"><span class="muted small en-1l">${esc(rutinaTxt(r))}</span>
      <div class="en-weeknav"><button class="icon-btn gray" data-sem="-7" aria-label="${t("Semana anterior")}">${icon("back")}</button><button class="btn small gray" data-hoy>${t("Hoy")}</button><button class="icon-btn gray" data-sem="7" aria-label="${t("Semana siguiente")}">${icon("chevron")}</button></div></div>
    <div class="en-week">${sem.map(d => { const a = E.artesDelDia(r, d).filter(E.cargado), s = conSes.has(d);
      return `<button class="en-day ${d === st.dia ? "on" : ""} ${d === hoy ? "hoy" : ""} ${s ? "done" : a.length ? (d < hoy && d >= desde ? "miss" : "plan") : "rest"}" data-dia="${d}" aria-pressed="${d === st.dia}" aria-label="${esc(fmtDate(d, true))}">
        <span class="en-dn">${t(E.DIAS_C[E.diaSemana(d) - 1])}</span><b>${+d.slice(8)}</b>
        <span class="en-dots">${s ? icon("check") : a.map(x => `<i style="background:${tono(x)}"></i>`).join("")}</span></button>`; }).join("")}</div>
  </section>

  <div class="en-h"><h2>${st.dia === hoy ? t("Sesión de hoy") : t("Sesión del {fecha}", {fecha: fmtDate(st.dia)})}</h2><div class="en-h-act"><button class="btn small tinted" data-crono aria-label="${t("Temporizador")}">${icon("clock")}<span class="hide-s"> ${t("Temporizador")}</span></button></div></div>
  <section class="card en-today">
    ${cab ? `<div class="en-today-m"><span class="tnum">${tn(cab.min, "1 min", "{n} min")}</span>${(cab.artes || []).filter(E.arte).map(a => `<span class="en-tag" style="--c:${tono(a)}">${esc(t(E.arte(a).corto))}</span>`).join("")}${modo === "curso" ? `<span class="muted small en-today-n tnum">${t("{a} de {b} bloques hechos", {a: nh, b: nb})}</span>` : ""}</div>` : ""}
    ${main && modo === "hecha" ? resumen(main) : ""}
    ${bloques ? `${modo === "curso" ? `<div class="en-prog" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${nb ? Math.round(nh / nb * 100) : 0}" aria-label="${esc(t("{a} de {b} bloques hechos", {a: nh, b: nb}))}"><span style="width:${nb ? Math.round(nh / nb * 100) : 0}%"></span></div>` : ""}
      ${modo === "futuro" ? `<p class="muted small en-prev">${icon("info", "inline")} ${t("Vista previa: la sesión se arma ese día según tu progreso.")}</p>` : ""}
      <ol class="en-blocks">${princ.map(b => bloque(b, modo, hechos)).join("")}</ol>
      ${tareas.length ? `<h4 class="en-sub">${t("Tarea opcional para casa")}</h4><ol class="en-blocks">${tareas.map(b => bloque(b, modo, hechos)).join("")}</ol>` : ""}
      ${modo === "preview" ? `<div class="en-actions"><button class="btn big primary" data-empezar>${PLAY} ${t("Empezar sesión")}</button><span class="muted small">${t("Marca los bloques que hiciste: los drills cuentan para tu progreso.")}</span></div>` : ""}
      ${modo === "curso" ? `<div class="en-actions"><button class="btn big primary" data-terminar>${icon("check")} ${t("Terminé la sesión")}</button></div>` : ""}`
      : !otras.length ? (tocaba && st.dia < hoy
        ? `<div class="empty-st warn"><span class="empty-ic">${icon("calendar")}</span><h3>${t("Sin registro")}</h3><p>${t("No registraste un entreno este día. Si entrenaste, regístralo para no perder la racha.")}</p></div>`
        : `<div class="empty-st ok"><span class="empty-ic">${icon("heart")}</span><h3>${t("Día de descanso")}</h3><p>${t("Recuperarse también es entrenar: camina, estira o mira uno de los videos pendientes.")}</p></div>`) : ""}
    ${otras.length ? `<div class="en-otras">${otras.map(resumen).join("")}</div>` : ""}
    ${!futuro ? `<div class="en-reg"><button class="btn small tinted" data-registrar>${icon("plus")} ${t("Registrar entreno")}</button><span class="muted small">${t("Clase, sparring, open mat, cardio o app")}</span></div>` : ""}
  </section>` : ""}

  <div data-tds></div>

  <div class="en-h"><h2>${t("Caminos de aprendizaje")}</h2><span class="muted small hide-s">${t("De lo más básico a lo más avanzado")}</span></div>
  <div class="en-arts stagger">${artes.map(a => artCard(a, r)).join("")}</div>

  ${comps.length ? `<div class="en-h"><h2>${t("Complementos")}</h2><span class="muted small hide-s">${t("Salud, físico, niños y defensa personal")}</span></div>
  <section class="card flush en-comps">${comps.map(a => { const d = E.cargado(a.id), p = E.pctArte(d);
      return `<a class="en-comp chev" href="#/entreno/${a.id}" style="${artVars(a)}">${ring(p, 40, tono(a))}<span class="en-comp-t"><b>${esc(t(a.nombre))}</b><span class="muted small">${tn(d.modulos.length, "1 módulo", "{n} módulos")}</span></span></a>`; }).join("")}
  </section>` : ""}

  <div class="en-h"><h2>${t("Herramientas")}</h2></div>
  <nav class="card flush en-tools" aria-label="${t("Herramientas")}">${TOOLS
    .map(([k, ic, l, c]) => `<a class="chev" href="#/entreno/${k}"><span class="row-ic" style="--rc:var(--chip-${c})">${icon(ic)}</span><span class="en-tools-l">${t(l)}</span>${k === "repaso" && nRep ? `<i class="en-badge" aria-label="${esc(tn(nRep, "1 pendiente", "{n} pendientes"))}">${nRep}</i>` : ""}</a>`).join("")}</nav>

  ${hs.length ? `<div class="en-h"><h2>${t("Historial")}</h2><a class="btn-link" href="#/entreno/diario">${t("Ver diario")}</a></div>
  <section class="card flush"><div class="list">${hs.slice(0, 8).map(s => `<button class="li en-hist" data-dia="${s.fecha}"><span class="li-ic ${s.plan ? "ok" : ""}">${icon(s.plan ? "check" : "fist")}</span><div class="li-main"><b>${fmtDate(s.fecha, true)}</b>${meta(s, true)}</div></button>`).join("")}</div></section>` : ""}`;

  tdsCard(el.querySelector("[data-tds]"), r);
  import("../entreno/logros.js").then(m => m.revisar?.()).catch(() => {});

  /* busca la sesión guardada del día o la congela a partir de la vista previa (solo hoy) */
  const asegurar = () => E.planDe(st.dia) || (modo === "preview" ? E.iniciar(prev) : null);
  el.onclick = async e => {
    const tg = e.target;
    if(tg.closest(".en-b p")){ tg.closest(".en-b").classList.toggle("open"); return; }
    if(tg.closest("[data-rutina]")) return editarRutina();
    if(tg.closest("[data-registrar]")) return registrarModal();
    const ay = tg.closest("[data-ayer]"); if(ay) return registrarModal({fecha: ay.dataset.ayer});
    if(tg.closest("[data-ics]")) return rutinaIcs();
    const ed = tg.closest("[data-editar]"); if(ed){ const s = S.get("sesiones", ed.dataset.editar); if(s) registrarModal({ses: s}); return; }
    if(tg.closest("[data-crono]")) return T.abrir({});
    const d = tg.closest("[data-dia]"); if(d){
      haptic("selection"); st.dia = d.dataset.dia; vistaHub(el, r);
      if(d.classList.contains("en-hist")) { const c = el.querySelector(".en-today"); if(c) window.scrollTo({top: c.getBoundingClientRect().top + window.scrollY - (document.querySelector(".top")?.offsetHeight || 0) - 10, behavior: "smooth"}); }
      return;
    }
    const sm = tg.closest("[data-sem]"); if(sm){ st.dia = addDays(st.dia, +sm.dataset.sem); return vistaHub(el, r); }
    if(tg.closest("[data-hoy]")){ st.dia = today(); return vistaHub(el, r); }
    if(tg.closest("[data-empezar]")){ haptic("medium"); asegurar(); toast(t("Sesión empezada: marca cada bloque al terminarlo")); return; }
    const tm = tg.closest("[data-timer]"); if(tm){
      const s = asegurar(), b = (bloques || []).find(x => x.b === tm.dataset.timer), cfg = b && E.rondas(b.dosis);
      if(!s || !cfg) return;
      T.abrir({titulo: b.t, cfg, onDone: () => E.marcarBloque(s.id, b.b, true)});
      return;
    }
    if(tg.closest("[data-terminar]")){
      const s = E.planDe(st.dia); if(!s) return;
      if(!(s.hechos || []).length && !await confirmDlg(t("No marcaste ningún bloque. ¿Registrar la sesión igual?"), {ok: t("Registrar"), danger: false, title: t("Terminar sesión")})) return;
      return finModal(s);
    }
    const u = tg.closest("[data-deshacer]"); if(u){
      const s = S.get("sesiones", u.dataset.deshacer); if(!s) return;
      const msg = s.plan ? (s.marcados?.length ? tn(s.marcados.length, "La sesión vuelve a quedar en curso y se desmarca 1 drill de tu progreso.", "La sesión vuelve a quedar en curso y se desmarcan {n} drills de tu progreso.") : t("La sesión vuelve a quedar en curso.")) : t("Se borra este entreno del historial.");
      if(!await confirmDlg(msg, {ok: s.plan ? t("Deshacer") : t("Borrar"), danger: !s.plan, title: s.plan ? t("Deshacer sesión") : t("Borrar entreno")})) return;
      E.deshacer(s); toast(s.plan ? t("Sesión reabierta") : t("Entreno borrado"));
    }
  };
  el.onchange = e => {
    const x = e.target;
    if(x.dataset.b !== undefined){ haptic(x.checked ? "light" : "selection"); const s = asegurar(); if(s) E.marcarBloque(s.id, x.dataset.b, x.checked); return; }
    if(x.dataset.k){ haptic(x.checked ? "light" : "selection"); if(x.closest(".en-blocks")) asegurar(); E.marcar(x.dataset.k, x.checked); }
  };
}

/* tarjeta de un arte en el hub: mosaico con degradado oscuro (estilo Fitness+), anillo blanco y botón en cápsula */
function artCard(a, r){
  const d = E.cargado(a.id), p = E.pctArte(d), m = E.moduloActual(d), enRut = r?.artes?.includes(a.id);
  const nv = d.modulos.reduce((s, x) => s + x.recursos.length, 0);
  return `<article class="en-art press" style="${artVars(a)}">
    <div class="en-art-h"><div class="en-art-ht"><span class="en-eye">${tn(d.modulos.length, "1 módulo", "{n} módulos")} · ${tn(nv, "1 video", "{n} videos")}</span>
      <a class="en-art-lnk" href="#/entreno/${a.id}"><h3>${esc(t(a.nombre))}</h3></a></div>
      ${p ? ring(p, 56, "#fff") : `<span class="en-new">${t("Nuevo")}</span>`}</div>
    <p class="en-art-now"><span>${p ? t("Vas en") : t("Empiezas con")}</span> ${esc(m.titulo)}</p>
    <div class="en-art-f"><a class="en-go" href="#/entreno/${a.id}/${m.id}">${p ? t("Continuar módulo {n}", {n: m.n}) : t("Empezar")}</a>
      <span class="lvl ${m.nivel}">${nivelT(m.nivel)}</span>${enRut ? `<span class="en-in">${icon("calendar")} ${t("En tu rutina")}</span>` : ""}</div></article>`;
}

/* técnica de la semana (contenido de semana.js); la academia puede fijar una para todos */
const tdsKey = x => x && (x.drill != null ? E.kDrill(x.arte, x.mod, x.drill) : x.hito != null ? E.kHito(x.arte, x.mod, x.hito) : null);
function tdsCard(box, r){
  if(!box) return;
  import("../entreno/semana.js").then(M => {
    if(!box.isConnected || !M.tdsActual) return;
    const ac = S.academy();
    const x = M.tdsActual({fecha: new Date(), artes: M.artesTds(r, E.disponibles().map(a => a.id)), pin: ac?.tds || null});
    if(!x || !E.arte(x.arte)) return;
    const a = E.arte(x.arte), m = E.cargado(x.arte)?.modulos.find(y => y.id === x.mod), k = tdsKey(x);
    const fija = ac?.tds?.semana === M.isoWeek(new Date()) && ac.tds.id === x.id;
    box.innerHTML = `<div class="en-h"><h2>${t("Técnica de la semana")}</h2><div class="en-h-act">${fija ? `<span class="pill info">${t("Fijada por la academia")}</span>` : ""}<button class="btn-link" data-tds-pin>${t("Cambiar")}</button></div></div>
      <section class="card en-tds" style="${artVars(a)}">
      <div class="en-tds-b"><div class="en-bt"><span class="en-tag" style="--c:${tono(a)}">${esc(t(a.corto))}</span>${m ? `<a class="muted small en-1l" href="#/entreno/${a.id}/${m.id}">${esc(m.titulo)}</a>` : ""}</div>
        <h4>${esc(x.foco)}</h4>
        ${x.claves?.length ? `<ol class="en-claves">${x.claves.map(c => `<li>${esc(c)}</li>`).join("")}</ol>` : ""}
        ${x.reto ? `<p class="en-reto"><b>${t("Reto")}:</b> ${esc(x.reto)}</p>` : ""}
        ${x.pregunta ? `<p class="muted small"><b>${t("Pregunta para pensar")}:</b> ${esc(x.pregunta)}</p>` : ""}
        ${k && E.itemDe(k) ? chk(k, t("La practiqué")) : ""}</div></section>`;
    box.querySelector("[data-tds-pin]").onclick = () => pinTds(M, x);
    box.onchange = e => { const kk = e.target.dataset.k; if(kk){ e.stopPropagation(); haptic(e.target.checked ? "light" : "selection"); E.marcar(kk, e.target.checked); } };
  }).catch(() => {});
}
/* elegir la técnica de esta semana para toda la academia (o volver a la automática) */
function pinTds(M, cur){
  const ac = S.academy(); if(!ac) return;
  const semana = M.isoWeek(new Date()), disp = new Set(E.disponibles().map(a => a.id));
  const lista = M.TDS.filter(x => disp.has(x.arte));
  const body = h(`<div><p class="muted small">${t("La técnica fijada se muestra a todos los que usen la app de esta academia durante esta semana.")}</p>
    <div class="list en-tds-list">${lista.map(x => `<button class="li ${x.id === cur.id ? "on" : ""}" data-id="${esc(x.id)}" aria-pressed="${x.id === cur.id}"><span class="en-tag" style="--c:${tono(x.arte)}">${esc(t(E.arte(x.arte).corto))}</span><div class="li-main"><b>${esc(x.foco)}</b></div>${x.id === cur.id ? icon("check") : ""}</button>`).join("")}</div></div>`);
  const m = modal({title: t("Técnica de la semana"), body, foot: `${ac.tds ? `<button class="btn ghost left" data-auto>${t("Usar la automática")}</button>` : ""}<button class="btn ghost" data-close>${t("Cerrar")}</button>`});
  body.onclick = e => { const b = e.target.closest("[data-id]"); if(!b) return; S.put("academias", {id: ac.id, tds: {semana, id: b.dataset.id}}); m.close(); toast(t("Técnica fijada para esta semana")); };
  m.foot.querySelector("[data-auto]")?.addEventListener("click", () => { S.put("academias", {id: ac.id, tds: null}); m.close(); });
}

/* la rutina al calendario del teléfono: un evento semanal por día de entreno */
function rutinaIcs(){
  const r = E.rutina(); if(!r) return;
  const body = h(`<form class="form" novalidate>
    <label class="field"><span class="lbl">${t("¿A qué hora entrenas?")}</span><input name="hora" type="time" value="${esc(r.hora || "18:00")}" required></label>
    <label class="field"><span class="lbl">${t("Aviso antes")}</span><select name="alarma">${[0, 15, 30, 60].map(n => `<option value="${n}" ${n === (r.alarma ?? 30) ? "selected" : ""}>${n ? tn(n, "1 min", "{n} min") : t("Sin aviso")}</option>`).join("")}</select></label>
    <p class="muted small">${t("Se crea un evento que se repite cada semana en tus días de entreno. Ábrelo con tu app de calendario.")}</p></form>`);
  const m = modal({title: t("Agregar a mi calendario"), body, foot: `<button class="btn ghost" data-close>${t("Cancelar")}</button><button class="btn primary" data-save>${icon("download")} ${t("Descargar calendario")}</button>`});
  m.foot.querySelector("[data-save]").onclick = async () => {
    const hora = body.querySelector("[name=hora]").value || "18:00", alarma = +body.querySelector("[name=alarma]").value;
    E.guardarRutina({hora, alarma});
    const I = await import("../ics.js"), [hh, mm] = hora.split(":").map(Number), hoy = today();
    const nom = r.artes.map(a => t(E.arte(a)?.corto || a)).join(", ");
    const evs = r.dias.map(d => { const f = addDays(hoy, (d - E.diaSemana(hoy) + 7) % 7), ini = parseISO(f); ini.setHours(hh, mm, 0, 0);
      return I.icsEvento({uid: `rutina-${d}`, titulo: t("Entreno: {a}", {a: nom}), inicio: ini, durMin: r.min || 60, rrule: `FREQ=WEEKLY;BYDAY=${I.byDay(d)}`, alarmaMin: alarma || null, desc: t("Rutina de AcademiaPro")}); });
    m.close();
    I.descargarIcs("rutina-entreno.ics", I.icsCalendario(evs, t("Mi rutina de entreno")));
  };
}

function bloque(b, modo, hechos){
  const a = b.arte && E.arte(b.arte);
  const tag = a ? `<span class="en-tag" style="--c:${tono(a)}">${esc(t(a.corto))}</span>` : "";
  const off = modo === "futuro" || modo === "hecha";
  if(b.tipo === "video" || b.tipo === "tarea") return `<li class="en-b ${b.tipo}"><span class="en-bmin">${icon(b.tipo === "video" ? "star" : "edit")}</span><div><div class="en-bt">${tag}<span class="muted small">${b.tipo === "video" ? t("Video del día") : t("Opcional")}</span></div>
    ${b.url ? `<a href="${esc(b.url)}" target="_blank" rel="noopener"><b>${esc(b.t)}</b></a>` : `<b>${esc(b.t)}</b>`}${b.dosis ? ` <span class="en-dose">${esc(b.dosis)}</span>` : ""}<p>${esc(b.d || "")}</p>${chk(b.k, b.tipo === "video" ? t("Visto") : t("Hecho"), "", modo === "futuro")}</div></li>`;
  const d = b.tipo === "calor" ? (b.artes || []).map(x => t(E.arte(x)?.calor || "")).join(" ")
    : b.tipo === "cierre" ? t("Estiramientos suaves, respiración y anota en una línea qué mejoraste hoy.")
    : b.tipo === "libre" ? t("Repite el drill que más te costó hoy o haz rounds de sombra aplicando {tema}.", {tema: (b.modT || "").toLowerCase()})
    : b.d || "";
  const on = hechos.has(b.b), rd = b.dosis && !off && E.rondas(b.dosis);
  return `<li class="en-b ${b.tipo} ${on ? "hecho" : ""}"><label class="en-bchk"><input type="checkbox" data-b="${esc(b.b)}" aria-label="${t("Hecho")}" ${on ? "checked" : ""} ${off ? "disabled" : ""}><span class="box"></span></label><span class="en-bmin tnum">${b.min}<small>min</small></span><div>
    <div class="en-bt">${tag}${b.modT && b.tipo === "drill" ? `<a class="muted small" href="#/entreno/${b.arte}/${b.mod}">${esc(b.modT)}</a>` : ""}${b.repaso ? `<span class="pill info">${t("Repaso")}</span>` : ""}</div>
    <b>${b.tipo === "drill" ? esc(b.t) : esc(t(b.t))}</b>${b.dosis ? ` <span class="en-dose">${esc(b.dosis)}</span>` : ""}<p>${esc(d)}</p></div>
    ${rd ? `<button class="en-play" data-timer="${esc(b.b)}" aria-label="${esc(t("Temporizador: {r}", {r: T.fmtRondas(rd)}))}" title="${esc(T.fmtRondas(rd))}">${PLAY}</button>` : ""}</li>`;
}

/* campos de RPE, energía, nota y molestia (al terminar y al registrar a mano) */
const rpeChips = v => `<div class="field"><span class="lbl">${t("Esfuerzo percibido (RPE)")}</span><div class="en-rpe">${Array.from({length: 10}, (_, i) => `<label><input type="radio" name="rpe" value="${i + 1}" ${+v === i + 1 ? "checked" : ""}><span>${i + 1}</span></label>`).join("")}</div><small class="hint">${t("1 muy suave · 10 al máximo")}</small></div>`;
const camposFin = v => `
  <div class="field"><span class="lbl">${t("¿Cómo terminaste?")}</span><div class="en-faces">${ENERGIA.map(([n, l]) => `<label><input type="radio" name="energia" value="${n}" ${+v.energia === n ? "checked" : ""}><span>${cara(n)}<i>${t(l)}</i></span></label>`).join("")}</div></div>
  <label class="field"><span class="lbl">${t("¿Alguna molestia?")}</span><select name="molestia">${ZONAS.map(([k, l]) => `<option value="${k}" ${(v.molestia || "") === k ? "selected" : ""}>${t(l)}</option>`).join("")}</select></label>`;
const notaF = v => `<label class="field"><span class="lbl">${t("Nota")}</span><input name="nota" maxlength="140" value="${esc(v.nota || "")}" placeholder="${esc(t("Qué mejoraste o qué te costó"))}"></label>`;
const minF = v => `<label class="field"><span class="lbl">${t("Minutos reales")}</span><input name="min" type="number" inputmode="numeric" min="1" max="600" value="${esc(v)}" required></label>`;
const leer = body => { const q = n => body.querySelector(`[name=${n}]`), qc = n => body.querySelector(`[name=${n}]:checked`);
  return {min: Math.round(+q("min")?.value || 0), rpe: +(qc("rpe")?.value || 0) || null, energia: +(qc("energia")?.value || 0) || null,
    nota: (q("nota")?.value || "").trim(), molestia: q("molestia")?.value || ""}; };

function finModal(s){
  const hs = new Set(s.hechos || []), bs = E.bloquesDe(s), real = bs.filter(b => hs.has(b.b)).reduce((a, b) => a + (b.min || 0), 0);
  const body = h(`<form class="form" novalidate>${minF(real || s.min || 60)}${rpeChips(s.rpe)}${camposFin(s)}${notaF(s)}</form>`);
  const m = modal({title: t("Terminar sesión"), body, foot: `<button class="btn ghost" data-close>${t("Cancelar")}</button><button class="btn primary" data-save>${icon("check")} ${t("Guardar sesión")}</button>`});
  m.foot.querySelector("[data-save]").onclick = () => {
    const v = leer(body);
    if(!(v.min > 0)) return toast(t("Escribe los minutos que entrenaste"), "warn");
    const cur = S.get("sesiones", s.id); if(!cur) return m.close();
    E.terminar(cur, v); m.close(); toast(t("¡Sesión registrada! Buen trabajo."));
  };
  body.onsubmit = e => { e.preventDefault(); m.foot.querySelector("[data-save]").click(); };
}

/* resultados de un rollo (sparring o lucha en el suelo) */
export const RESULTADOS = [["gane_sub", "Gané por sumisión"], ["perdi_sub", "Me sometieron"], ["pase", "Pasé la guardia"], ["raspe", "Barrí"], ["me_pasaron", "Me pasaron la guardia"], ["empate", "Parejo"]];
export const resT = k => t((RESULTADOS.find(x => x[0] === k) || [, k])[1]);
const CINTAS = ["", "Blanco", "Azul", "Morado", "Marrón", "Negro", "Otro"];
const rolloRow = (x = {}) => `<div class="en-rollo">
  <input name="r_pareja" maxlength="40" placeholder="${esc(t("Compañero"))}" value="${esc(x.pareja || "")}" aria-label="${esc(t("Compañero"))}">
  <select name="r_cinturon" aria-label="${esc(t("Cinturón"))}">${CINTAS.map(c => `<option value="${c}" ${c === (x.cinturon || "") ? "selected" : ""}>${c ? t(c) : t("Cinturón")}</option>`).join("")}</select>
  <select name="r_resultado" aria-label="${esc(t("Resultado"))}">${RESULTADOS.map(([k, l]) => `<option value="${k}" ${k === (x.resultado || "empate") ? "selected" : ""}>${t(l)}</option>`).join("")}</select>
  <input name="r_tecnica" maxlength="60" placeholder="${esc(t("Técnica"))}" value="${esc(x.tecnica || "")}" aria-label="${esc(t("Técnica"))}">
  <button type="button" class="icon-btn" data-rdel aria-label="${esc(t("Quitar"))}">${icon("x")}</button></div>`;
/* sugerencias de etiquetas: los drills del módulo actual y del anterior de esa arte */
function sugTags(arteId){
  const d = E.cargado(arteId); if(!d) return [];
  const m = E.moduloActual(d), i = d.modulos.indexOf(m);
  return [...new Set([...(d.modulos[i - 1]?.drills || []), ...m.drills].filter(x => x.tipo !== "fisico").map(x => x.nombre))].slice(-10);
}

/* registrar un entreno a mano o editar el diario de una sesión: fecha, arte, tipo, minutos, RPE, nota,
   y en "Diario": etiquetas, rollos, qué salió bien y qué mejorar */
export function registrarModal({fecha, ses} = {}){
  const hoy = today(), r = E.rutina(), f = ses?.fecha || fecha || (st.dia <= hoy ? st.dia : hoy);
  const soloDiario = !!ses?.plan;   // de la rutina: lo demás viene del plan
  const disp = E.disponibles(), def = ses?.artes?.[0] || E.artesDelDia(r, f).find(E.cargado) || r?.artes?.find(E.cargado) || disp[0]?.id;
  const v = ses || {};
  const tags = new Set(v.tags || []);
  const body = h(`<form class="form" novalidate>
    ${soloDiario ? `<p class="muted small">${fmtDate(f, true)} · ${artesT(v)}</p>` : `
    <label class="field"><span class="lbl">${t("Fecha")}</span><input name="fecha" type="date" max="${hoy}" value="${f}" required></label>
    <label class="field"><span class="lbl">${t("Arte")}</span><select name="arte">${disp.map(a => `<option value="${a.id}" ${a.id === def ? "selected" : ""}>${esc(t(a.nombre))}</option>`).join("")}</select></label>
    <div class="field"><span class="lbl">${t("Tipo")}</span><div class="seg en-seg">${TIPOS.slice(1).map(([k, l], i) => `<label><input type="radio" name="tipo" value="${k}" ${(v.tipo ? v.tipo === k : i === 0) ? "checked" : ""}><span>${t(l)}</span></label>`).join("")}</div></div>
    ${minF(v.min || 60)}`}
    ${rpeChips(v.rpe)}${notaF(v)}
    <details class="en-more-d" ${v.tags?.length || v.rollos?.length || v.bien || v.mal ? "open" : ""}><summary>${icon("edit")} ${t("Diario: etiquetas, rollos y aprendizajes")}</summary>
      <div class="field"><span class="lbl">${t("Etiquetas")}</span><div class="chip-row en-tags" data-tags></div>
        <input name="tagnew" maxlength="40" placeholder="${esc(t("Otra etiqueta y Enter"))}" aria-label="${esc(t("Agregar etiqueta"))}"></div>
      <div class="field"><span class="lbl">${t("Rollos o sparring")}</span><div class="en-rollos" data-rollos>${(v.rollos || []).map(rolloRow).join("")}</div>
        <button type="button" class="btn small ghost" data-radd>${icon("plus")} ${t("Agregar rollo")}</button></div>
      <label class="field"><span class="lbl">${t("Qué salió bien")}</span><textarea name="bien" rows="2" maxlength="400">${esc(v.bien || "")}</textarea></label>
      <label class="field"><span class="lbl">${t("Qué debo mejorar")}</span><textarea name="mal" rows="2" maxlength="400">${esc(v.mal || "")}</textarea></label>
    </details></form>`);
  const pintarTags = () => {
    const a = body.querySelector("[name=arte]")?.value || def;
    const sug = [...new Set([...tags, ...sugTags(a)])];
    body.querySelector("[data-tags]").innerHTML = sug.map(x => `<button type="button" class="chip-btn ${tags.has(x) ? "on" : ""}" data-tag="${esc(x)}" aria-pressed="${tags.has(x)}">${esc(x)}</button>`).join("");
  };
  pintarTags();
  body.querySelector("[name=arte]")?.addEventListener("change", pintarTags);
  body.addEventListener("click", e => {
    const tg = e.target.closest("[data-tag]"); if(tg){ const x = tg.dataset.tag; tags.has(x) ? tags.delete(x) : tags.add(x); pintarTags(); return; }
    if(e.target.closest("[data-radd]")){ body.querySelector("[data-rollos]").insertAdjacentHTML("beforeend", rolloRow()); body.querySelector(".en-rollo:last-child input")?.focus(); return; }
    e.target.closest("[data-rdel]")?.closest(".en-rollo").remove();
  });
  body.querySelector("[name=tagnew]").addEventListener("keydown", e => {
    if(e.key !== "Enter" && e.key !== ",") return;
    e.preventDefault(); const x = e.target.value.trim().replace(/,$/, ""); if(x){ tags.add(x); e.target.value = ""; pintarTags(); }
  });
  const m = modal({title: ses ? t("Editar entreno") : t("Registrar entreno"), body, foot: `<button class="btn ghost" data-close>${t("Cancelar")}</button><button class="btn primary" data-save>${icon("check")} ${t("Guardar")}</button>`});
  m.foot.querySelector("[data-save]").onclick = () => {
    const x = leer(body), q = n => body.querySelector(`[name=${n}]`);
    const extra = q("tagnew").value.trim(); if(extra) tags.add(extra);
    const rollos = [...body.querySelectorAll(".en-rollo")].map(rw => ({pareja: rw.querySelector("[name=r_pareja]").value.trim(), cinturon: rw.querySelector("[name=r_cinturon]").value,
      resultado: rw.querySelector("[name=r_resultado]").value, tecnica: rw.querySelector("[name=r_tecnica]").value.trim()})).filter(y => y.pareja || y.tecnica || y.resultado !== "empate");
    const diario = {rpe: x.rpe, nota: x.nota, tags: [...tags], rollos, bien: q("bien").value.trim(), mal: q("mal").value.trim()};
    if(soloDiario){ S.put("sesiones", {id: ses.id, ...diario}); m.close(); toast(t("Diario guardado")); return; }
    const fecha = q("fecha").value;
    if(!fecha || fecha > hoy) return toast(t("Elige una fecha de hoy o anterior"), "warn");
    if(!(x.min > 0)) return toast(t("Escribe los minutos que entrenaste"), "warn");
    const datos = {fecha, tipo: body.querySelector("[name=tipo]:checked")?.value || "clase", artes: [q("arte").value], min: x.min, ...diario};
    if(ses) S.put("sesiones", {id: ses.id, ...datos}); else E.registrar(datos);
    st.dia = fecha; m.close(); toast(ses ? t("Entreno actualizado") : t("Entreno registrado"));
  };
  body.onsubmit = e => { e.preventDefault(); m.foot.querySelector("[data-save]").click(); };
}

const rutinaTxt = r => `${r.dias.map(d => t(E.DIAS_C[d - 1])).join(", ")} · ${tn(r.min, "1 min", "{n} min")} · ${r.artes.map(a => t(E.arte(a)?.corto)).join(", ")}`;

function editarRutina(){
  const r = E.rutina() || {dias: [1, 3, 5], min: 60, artes: [], modo: "pareja"}, mt = r.meta || {};
  const body = h(`<form class="form" novalidate>
    <div class="field"><span class="lbl">${t("¿Qué días entrenas?")}</span><div class="chips en-dias">${E.DIAS.map((d, i) => `<label class="chip"><input type="checkbox" name="dias" value="${i + 1}" ${r.dias.includes(i + 1) ? "checked" : ""}><span>${t(E.DIAS_C[i])}</span></label>`).join("")}</div></div>
    <div class="field"><span class="lbl">${t("¿Cuánto tiempo por día?")}</span><div class="seg en-mins">${[30, 45, 60, 75, 90, 120].map(m => `<label><input type="radio" name="min" value="${m}" ${r.min === m ? "checked" : ""}><span>${m} min</span></label>`).join("")}</div></div>
    <div class="field"><span class="lbl">${t("¿Qué quieres entrenar?")}</span><div class="en-pick">${E.disponibles().map(a => `<label class="en-pk ${E.esComplemento(a) ? "comp" : ""}" style="${artVars(a)}"><input type="checkbox" name="artes" value="${a.id}" ${r.artes.includes(a.id) ? "checked" : ""}><span><i class="en-pk-dot" aria-hidden="true"></i><b>${esc(t(a.nombre))}</b><i class="en-pk-ok" aria-hidden="true">${icon("check")}</i></span></label>`).join("")}</div>
      <small class="hint">${t("Con varias artes, se turnan entre tus días. Con sesiones de 90 minutos o más, se combinan dos por día.")}</small></div>
    <div class="field"><span class="lbl">${t("¿Con quién entrenas?")}</span><div class="seg"><label><input type="radio" name="modo" value="pareja" ${r.modo !== "solo" ? "checked" : ""}><span>${t("En academia o con compañero")}</span></label><label><input type="radio" name="modo" value="solo" ${r.modo === "solo" ? "checked" : ""}><span>${t("Solo")}</span></label></div>
      <small class="hint">${t("Si entrenas solo, la rutina usa solo drills que no necesitan compañero.")}</small></div>
    <div class="field"><span class="lbl">${t("Meta semanal")}</span><div class="en-meta-f"><div class="seg"><label><input type="radio" name="mtipo" value="dias" ${mt.tipo !== "min" ? "checked" : ""}><span>${t("Días")}</span></label><label><input type="radio" name="mtipo" value="min" ${mt.tipo === "min" ? "checked" : ""}><span>${t("Minutos")}</span></label></div>
      <input name="mvalor" type="number" inputmode="numeric" min="1" max="3000" value="${esc(mt.valor || "")}" placeholder="${esc(t("Según tus días"))}" aria-label="${esc(t("Meta semanal"))}"></div>
      <small class="hint">${t("Vacío: la meta son los días de tu rutina.")}</small></div>
  </form>`);
  const m = modal({title: t("Tu rutina"), body, foot: `${E.rutina() ? `<button class="btn danger ghost left" data-del>${icon("trash")} ${t("Borrar rutina")}</button>` : ""}<button class="btn ghost" data-close>${t("Cancelar")}</button><button class="btn primary" data-save>${t("Guardar rutina")}</button>`});
  m.foot.querySelector("[data-save]").onclick = () => {
    const v = {dias: [...body.querySelectorAll("[name=dias]:checked")].map(x => +x.value), min: +(body.querySelector("[name=min]:checked")?.value || 60),
      artes: [...body.querySelectorAll("[name=artes]:checked")].map(x => x.value), modo: body.querySelector("[name=modo]:checked")?.value || "pareja"};
    const mv = Math.round(+body.querySelector("[name=mvalor]").value || 0);
    v.meta = mv > 0 ? {tipo: body.querySelector("[name=mtipo]:checked")?.value || "dias", valor: mv} : null;
    if(v.meta?.tipo === "dias" && mv > 7) return toast(t("La meta en días va de 1 a 7"), "warn");
    if(!v.dias.length) return toast(t("Elige al menos un día"), "warn");
    if(!v.artes.length) return toast(t("Elige al menos un arte"), "warn");
    E.guardarRutina(v); st.dia = today(); m.close(); toast(t("Rutina guardada"));
  };
  m.foot.querySelector("[data-del]")?.addEventListener("click", async () => { if(await confirmDlg(t("Se borra la rutina. Tu progreso y tu historial se conservan."))){ S.del("rutinas", "mia"); m.close(); } });
}

/* mapa del arte: pilar × nivel con el % de cada celda y dónde vas */
function matriz(id, d, act){
  const ps = E.pilares(d), a = E.arte(id);
  if(ps.length < 2) return "";
  return `<div class="en-h"><h2>${t("Mapa del camino")}</h2><span class="muted small hide-s">${t("Pilar por nivel")}</span></div>
  <section class="card en-mx" style="${artVars(a)}" aria-label="${esc(t("Mapa del camino"))}">
    <div class="en-mx-g" style="--n:${E.NIVELES.length}"><span></span>${E.NIVELES.map(([k, n]) => `<span class="en-mx-c lvl ${k}">${t(n)}</span>`).join("")}
    ${ps.map(p => `<b class="en-mx-p">${esc(t(p.t))}</b>${E.NIVELES.map(([k]) => { const ms = p.mods.filter(m => m.nivel === k);
      if(!ms.length) return `<span class="en-mx-x" aria-hidden="true">·</span>`;
      const pc = E.pctMods(id, ms), aqui = ms.includes(act);
      return `<a class="en-mx-x ${aqui ? "aqui" : ""} ${pc === 100 ? "full" : ""}" href="#/entreno/${id}/${(ms.find(m => m === act) || ms[0]).id}" style="--p:${pc}%" title="${esc(ms.map(m => m.titulo).join(" · "))}">
        <i>${pc}%</i>${aqui ? `<em>${t("Vas aquí")}</em>` : ""}</a>`; }).join("")}`).join("")}</div></section>`;
}

/* ---------- glosario ---------- */
let cacheGlo = null, cacheCur = null;
function vistaGlosario(el, q){
  if(q.has("q")) st.gq = q.get("q") || "";
  if(cacheGlo) return glosario(el, cacheGlo);
  el.innerHTML = cargando(volver());
  import("../entreno/glosario.js").then(M => { cacheGlo = M.GLOSARIO || []; if(el.isConnected) glosario(el, cacheGlo); })
    .catch(() => { el.innerHTML = `${volver()}<div class="card"><p>${t("El glosario no está disponible todavía.")}</p></div>`; });
}
function glosario(el, G){
  const en = lang() === "en", artes = E.ARTES.filter(a => G.some(x => x.arte === a.id));
  const nom = x => (en && x.en) || x.t;
  el.innerHTML = `${volver()}
  <div class="en-glo-top">
    <label class="en-search">${icon("search")}<input id="glq" type="search" value="${esc(st.gq)}" placeholder="${esc(t("Buscar un término"))}" aria-label="${esc(t("Buscar un término"))}" autocomplete="off"></label>
    <div class="chip-row en-glo-a"><button class="chip-btn ${!st.ga ? "on" : ""}" data-ga="" aria-pressed="${!st.ga}">${t("Todas")}</button>${artes.map(a => `<button class="chip-btn ${st.ga === a.id ? "on" : ""}" data-ga="${a.id}" aria-pressed="${st.ga === a.id}" style="--c:${tono(a)}">${esc(t(a.corto))}</button>`).join("")}</div>
    <nav class="en-az" aria-label="${esc(t("Índice alfabético"))}"></nav>
  </div>
  <section class="card flush en-glo"><div class="en-glo-l" aria-live="polite"></div></section>
  <p class="section-footer en-glo-n">${tn(G.length, "1 término", "{n} términos")}</p>${esNota()}`;
  const lista = el.querySelector(".en-glo-l"), az = el.querySelector(".en-az");
  const pintar = () => {
    const nq = norm(st.gq.trim());
    const xs = G.filter(x => (!st.ga || x.arte === st.ga) && (!nq || norm([x.t, x.en, x.orig, x.d].join(" ")).includes(nq)))
      .sort((a, b) => norm(nom(a)).localeCompare(norm(nom(b))));
    const letra = x => (norm(nom(x))[0] || "#").toUpperCase().replace(/[^A-Z]/, "#");
    const ls = [...new Set(xs.map(letra))];
    az.innerHTML = ls.map(l => `<a href="#" data-az="${l}">${l}</a>`).join("");
    lista.innerHTML = xs.length ? ls.map(l => `<h4 class="en-glo-h" id="glo-${l}">${l}</h4>${xs.filter(x => letra(x) === l).map(x => { const a = E.arte(x.arte);
      return `<article class="en-term"><div class="en-term-h"><b>${esc(nom(x))}</b>${en && x.en && x.en !== x.t ? `<span class="muted small">${esc(x.t)}</span>` : !en && x.en && norm(x.en) !== norm(x.t) ? `<span class="muted small">${esc(x.en)}</span>` : ""}${x.orig ? `<span class="muted small">· ${esc(x.orig)}</span>` : ""}
        ${a ? `<span class="en-tag" style="--c:${tono(a)}">${esc(t(a.corto))}</span>` : ""}</div><p>${esc(x.d)}</p>
        ${x.mod && a ? `<a class="en-term-go" href="#/entreno/${x.arte}/${esc(x.mod)}">${t("Ver en el camino")} →</a>` : ""}</article>`; }).join("")}`).join("")
      : `<div class="empty-st info"><span class="empty-ic">${icon("search")}</span><h3>${t("Sin resultados")}</h3><p>${t("Prueba con otra palabra o quita el filtro de arte.")}</p></div>`;
  };
  pintar();
  el.querySelector("#glq").oninput = e => { st.gq = e.target.value; pintar(); };
  el.onclick = e => {
    const g = e.target.closest("[data-ga]"); if(g){ haptic("selection"); st.ga = g.dataset.ga; for(const b of el.querySelectorAll("[data-ga]")){ b.classList.toggle("on", b === g); b.setAttribute("aria-pressed", b === g); } pintar(); return; }
    const l = e.target.closest("[data-az]"); if(l){ e.preventDefault(); const h4 = el.querySelector("#glo-" + l.dataset.az);
      if(h4) window.scrollTo({top: h4.getBoundingClientRect().top + window.scrollY - (document.querySelector(".top")?.offsetHeight || 0) - (el.querySelector(".en-az")?.offsetHeight || 0) - 8, behavior: "smooth"}); }
  };
  el.onchange = null;
}

/* ---------- Mi cinturón: currículo de un sistema (solo lectura, con autochequeo) ---------- */
const CUR_ARTE = {bjj: "bjj", bjjkids: "bjj", muaythai: "muaythai", lucha: "lucha", boxeo: "boxeo", mma: "mma"};
const CUR_NOM = {bjj: "Jiu-Jitsu Brasileño", bjjkids: "Jiu-Jitsu niños", muaythai: "Muay Thai", lucha: "Lucha", boxeo: "Boxeo", mma: "MMA"};
const CATS = {fundamentos: "Fundamentos", guardia: "Guardia", pase: "Pases", sumision: "Sumisiones", derribo: "Derribos", escape: "Escapes", vivo: "En vivo", golpeo: "Golpeo", defensa: "Defensa", clinch: "Clinch", conocimiento: "Conocimiento", actitud: "Actitud", fisico: "Físico"};
const kCur = id => "cur:" + id;
function vistaCurriculo(el, key){
  if(cacheCur && (!CUR_ARTE[key] || E.intentado(CUR_ARTE[key]))) return curriculo(el, cacheCur, key);
  el.innerHTML = cargando(key ? volver("#/entreno/curriculo", t("Mi cinturón")) : volver());
  const arteK = CUR_ARTE[key];
  Promise.all([import("../entreno/curriculos.js"), arteK ? E.cargar(arteK) : null]).then(([M]) => { cacheCur = M.CURRICULOS || {}; if(el.isConnected) curriculo(el, cacheCur, key); })
    .catch(() => { el.innerHTML = `${volver()}<div class="card"><p>${t("Los currículos no están disponibles todavía.")}</p></div>`; });
}
function curriculo(el, C, key){
  const ks = Object.keys(C).filter(k => C[k]?.rangos?.length);
  const reqs = r => r.grados.flatMap(g => g.req);
  const pctR = r => { const xs = reqs(r); return xs.length ? Math.round(xs.filter(x => E.hecho(kCur(x.id))).length / xs.length * 100) : 0; };
  if(!key || !C[key]){
    el.innerHTML = `${volver()}<p class="en-lead">${t("Elige tu arte para ver qué te piden en cada cinturón y marcar lo que ya dominas.")}</p>
      <section class="card flush en-comps">${ks.map(k => { const a = E.arte(CUR_ARTE[k]), rs = C[k].rangos, i = Math.max(0, rs.findIndex(r => pctR(r) < 100));
        return `<a class="en-comp chev" href="#/entreno/curriculo/${k}" style="--c:${tono(a)}">${ring(pctR(rs[i]), 40, tono(a))}<span class="en-comp-t"><b>${esc(t(CUR_NOM[k] || k))}</b><span class="muted small">${tn(rs.length, "1 rango", "{n} rangos")} · ${esc(t(rs[i].rank))}</span></span></a>`; }).join("")}</section>`;
    el.onclick = el.onchange = null; return;
  }
  const cu = C[key], a = E.arte(CUR_ARTE[key]), arteId = CUR_ARTE[key], d = arteId && E.cargado(arteId);
  if(st.cr[key] == null) st.cr[key] = Math.max(0, cu.rangos.findIndex(r => pctR(r) < 100));
  const ri = Math.min(st.cr[key], cu.rangos.length - 1), r = cu.rangos[ri];
  const modT = id => d?.modulos.find(m => m.id === id)?.titulo;
  el.innerHTML = `${volver("#/entreno/curriculo", t("Mi cinturón"))}
  <section class="en-hero sm" style="${a ? artVars(a) : ""}"><div><span class="en-eye">${t("Mi cinturón")} · ${esc(t(CUR_NOM[key] || key))}</span><h2>${esc(t(r.rank))}</h2>
    <p>${[r.tiempo ? t("Tiempo mínimo: {x}", {x: r.m ? tn(r.m, "1 mes", "{n} meses") : r.tiempo}) : "", r.edadMin ? t("Edad mínima: {n} años", {n: r.edadMin}) : ""].filter(Boolean).map(esc).join(" · ")}</p></div><span data-ring>${ring(pctR(r), 76, "#fff")}</span></section>
  <div class="chip-row en-ranks no-print">${cu.rangos.map((x, i) => `<button class="chip-btn ${i === ri ? "on" : ""}" data-ri="${i}" aria-pressed="${i === ri}">${esc(t(x.rank))} <i>${pctR(x)}%</i></button>`).join("")}</div>
  <div class="row gap no-print en-cur-act"><span class="muted small">${t("Marca lo que ya haces bien en vivo. Es tu autoevaluación: el grado lo decide tu profesor.")}</span><button class="btn small gray" data-print>${icon("print")} ${t("Imprimir")}</button></div>
  ${r.grados.map(g => `<div class="en-h en-h-sm"><h2>${esc(g.titulo || t("Grado {n}", {n: g.g}))}</h2><span class="muted small tnum">${g.req.filter(x => E.hecho(kCur(x.id))).length}/${g.req.length}</span></div><section class="card en-grado">
    ${Object.entries(g.req.reduce((o, x) => ((o[x.cat] ||= []).push(x), o), {})).map(([c, xs]) => `<h4 class="en-sub">${esc(t(CATS[c] || c))}</h4>
      <div class="en-reqs">${xs.map(x => `<div class="en-req">${chk(kCur(x.id), `<span>${esc(x.txt)}${x.critico ? ` <span class="pill vencido" title="${esc(t("Requisito crítico"))}">${t("Crítico")}</span>` : ""}</span>`, "row")}
        ${x.mod && modT(x.mod) ? `<a class="en-req-go no-print" href="#/entreno/${arteId}/${esc(x.mod)}">${esc(modT(x.mod))} →</a>` : ""}</div>`).join("")}</div>`).join("")}</section>`).join("")}
  ${r.conducta?.length ? `<div class="en-h en-h-sm"><h2>${t("Conducta y actitud")}</h2></div><section class="card"><ul class="en-cond">${r.conducta.map(x => `<li>${esc(x.txt)}</li>`).join("")}</ul></section>` : ""}`;
  el.onclick = e => {
    const b = e.target.closest("[data-ri]"); if(b){ haptic("selection"); st.cr[key] = +b.dataset.ri; curriculo(el, C, key); window.scrollTo(0, 0); return; }
    if(e.target.closest("[data-print]")) window.print();
  };
  el.onchange = e => { const k = e.target.dataset.k; if(k){ haptic(e.target.checked ? "light" : "selection"); E.marcar(k, e.target.checked); } };
}

/* ---------- camino de un arte ---------- */
function vistaArte(el, id){
  const a = E.arte(id), d = E.cargado(id), p = E.pctArte(d), act = E.moduloActual(d);
  el.innerHTML = `
  ${volver()}
  ${esNota()}
  <section class="en-hero" style="${artVars(a)}">
    <div><span class="en-eye">${t("Camino de aprendizaje")}</span><h2>${esc(d.intro.titulo || a.nombre)}</h2><p>${esc(d.intro.sub || "")}</p>
      <a class="en-go" href="#/entreno/${id}/${act.id}">${p ? t("Continuar módulo {n}", {n: act.n}) : t("Empezar")}</a></div>
    ${ring(p, 92, "#fff")}
  </section>
  ${matriz(id, d, act)}
  ${d.intro.reglas?.length ? `<div class="en-h"><h2>${t("Cómo avanzar")}</h2></div><section class="card en-rules" style="${artVars(a)}">${d.intro.reglas.map((x, j) => `<div><span class="en-rule-n" aria-hidden="true">${j + 1}</span><span><b>${esc(x.t)}</b><p>${esc(x.d)}</p></span></div>`).join("")}</section>` : ""}
  ${E.NIVELES.map(([k, n]) => { const ms = d.modulos.filter(m => m.nivel === k); if(!ms.length) return "";
    return `<h3 class="en-lvl"><span class="lvl ${k}">${t(n)}</span><span class="muted small">${tn(ms.length, "1 módulo", "{n} módulos")}</span></h3>
    <div class="card flush en-mods">${ms.map(m => { const pm = E.pctMod(id, m);
      return `<a class="en-mod chev ${m === act ? "now" : ""} ${pm === 100 ? "full" : ""}" href="#/entreno/${id}/${m.id}" style="${artVars(a)}">
        <span class="en-mn tnum">${String(m.n).padStart(2, "0")}</span><div class="en-mt">${m === act ? `<span class="en-now">${t("Vas aquí")}</span>` : ""}<b>${esc(m.titulo)}</b><span class="muted small">${esc(m.sub || "")}</span>
        <span class="small en-mc">${tn(m.conceptos.length, "1 concepto", "{n} conceptos")} · ${tn(m.drills.length, "1 drill", "{n} drills")} · ${tn(m.recursos.length, "1 video", "{n} videos")}</span></div>
        ${ring(pm, 40, tono(a))}</a>`; }).join("")}</div>`; }).join("")}
  ${d.plan.length ? `<div class="en-h"><h2>${t("Plan sugerido")}</h2></div>
    <div class="en-phases">${d.plan.map((f, j) => `<div class="en-ph" style="${artVars(a)}"><span class="en-ph-n" aria-hidden="true">${j + 1}</span><span class="en-eye">${esc(f.semanas)}</span><b>${esc(f.fase)}</b><p class="muted small">${esc(f.foco)}</p><ul>${f.puntos.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>`).join("")}</div>` : ""}
  ${d.semana.length ? `<div class="en-h"><h2>${t("Clase tipo")}</h2></div><div class="card flush"><div class="list en-clase">${d.semana.map(b => `<div class="li"><span class="en-bmin wide tnum">${esc(b.min)}</span><div class="li-main"><b>${esc(b.t)}</b><span class="muted small en-wrap">${esc(b.d)}</span></div></div>`).join("")}</div></div>` : ""}`;
  el.onclick = null; el.onchange = null;
}

/* ---------- un módulo ---------- */
function vistaModulo(el, id, modId, titulo = () => {}){
  const a = E.arte(id), d = E.cargado(id), m = d.modulos.find(x => x.id === modId);
  if(!m){ location.hash = `#/entreno/${id}`; return; }
  titulo(t("Módulo {n}", {n: m.n}));
  const i = d.modulos.indexOf(m), prev = d.modulos[i - 1], next = d.modulos[i + 1];
  const plats = ["todas", ...Object.keys(PLAT).filter(k => m.recursos.some(r => r.plataforma === k))];
  if(!plats.includes(st.filtro)) st.filtro = "todas";
  const recs = m.recursos.filter(r => st.filtro === "todas" || r.plataforma === st.filtro);
  const yt = u => (u.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/) || [])[1];
  el.innerHTML = `
  ${volver(`#/entreno/${id}`, t(a.nombre))}
  ${esNota()}
  <section class="en-hero sm" style="${artVars(a)}">
    <div><span class="en-eye">${esc(t(a.corto))} · <span class="lvl ${m.nivel}">${nivelT(m.nivel)}</span></span><h2>${esc(m.titulo)}</h2><p class="en-clamp ${st.mas === m.id ? "open" : ""}">${esc(m.resumen || m.sub || "")}</p><button class="btn-link en-more" data-mas hidden>${st.mas === m.id ? t("Leer menos") : t("Leer más")}</button></div>
    <span data-ring>${ring(E.pctMod(id, m), 80, "#fff")}</span>
  </section>
  <nav class="en-anchors" aria-label="${t("Secciones")}">${[["conceptos", "Conceptos", m.conceptos.length], ["drills", "Drills", m.drills.length], ["videos", "Videos", m.recursos.length], ["hitos", "Hitos", m.hitos.length]]
    .filter(x => x[2]).map(([k, l, n]) => `<button data-go="${k}">${t(l)} <i>${n}</i></button>`).join("")}</nav>

  <h3 class="en-sec" id="en-s-conceptos">${t("Conceptos")}</h3>
  <div class="card flush en-concepts">${m.conceptos.map((c, j) => `<details class="en-c" ${j === 0 ? "open" : ""}><summary><span class="en-ci" style="${artVars(a)}">${j + 1}</span><b>${esc(c.titulo)}</b>${icon("chevron", "chev-i")}</summary>
    <div class="en-cb"><p>${esc(c.explicacion)}</p><div class="en-cols">
      ${(c.puntos || c.puntos_clave)?.length ? `<div class="ok"><h4>${icon("check", "inline")} ${t("Claves")}</h4><ul>${(c.puntos || c.puntos_clave).map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}
      ${(c.errores || c.errores_comunes)?.length ? `<div class="bad"><h4>${icon("x", "inline")} ${t("Errores comunes")}</h4><ul>${(c.errores || c.errores_comunes).map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}</div></div></details>`).join("")}</div>

  <h3 class="en-sec" id="en-s-drills">${t("Drills")}</h3>
  <div class="en-drills">${m.drills.map((x, j) => { const k = E.kDrill(id, m.id, j); return `<div class="en-drill ${E.hecho(k) ? "done" : ""}">
    <div class="en-dh">${chk(k)}<b>${esc(x.nombre)}</b><span class="lvl ${x.nivel}">${nivelT(x.nivel)}</span></div>
    <p>${esc(x.como)}</p><div class="en-dm"><span class="en-dose">${icon("clock", "inline")} ${esc(x.dosis)}</span>${x.solo ? `<span class="muted small">${t("Se puede solo")}</span>` : `<span class="muted small">${t("Con compañero")}</span>`}</div></div>`; }).join("")}</div>

  ${m.recursos.length ? `<h3 class="en-sec" id="en-s-videos">${t("Videos y cursos")} <span class="count-b">${m.recursos.length}</span></h3>
  ${plats.length > 2 ? `<div class="en-filter chip-row">${plats.map(k => `<button class="chip-btn ${st.filtro === k ? "on" : ""}" data-f="${k}" aria-pressed="${st.filtro === k}">${k === "todas" ? t("Todas") : PLAT[k][0]}</button>`).join("")}</div>` : ""}
  <div class="en-res">${recs.map(r => { const k = E.kRec(id, r.url), v = r.plataforma === "youtube" && yt(r.url), [pn, pc] = PLAT[r.plataforma] || PLAT.web;
    return `<article class="en-r ${E.hecho(k) ? "done" : ""}"><a class="en-rm ${v ? "" : "noimg"}" href="${esc(r.url)}" target="_blank" rel="noopener" style="--pc:${pc};--g:var(--g-${id})" aria-label="${esc(r.titulo)}">
      ${v ? `<img loading="lazy" src="https://i.ytimg.com/vi/${v}/mqdefault.jpg" alt="" onerror="this.parentNode.classList.add('noimg');this.remove()">` : ""}<span class="en-rp">${esc(pn)}</span><span class="en-rplay" aria-hidden="true">${PLAY}</span></a>
      <div class="en-rb"><a class="en-rt" href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.titulo)}</a>
      <span class="muted small">${esc(r.autor || "")}${r.idioma ? ` · ${r.idioma === "es" ? t("Español") : t("Inglés")}` : ""} · ${nivelT(r.nivel)}${r.pago ? ` <span class="pill pronto">${t("De pago")}</span>` : ""}</span>
      <p>${esc(r.por_que || "")}</p>${chk(k, t("Visto"))}</div></article>`; }).join("")}</div>` : ""}

  ${m.hitos.length ? `<h3 class="en-sec" id="en-s-hitos">${t("Lo domino cuando…")}</h3><div class="card flush en-hitos">${m.hitos.map((x, j) => chk(E.kHito(id, m.id, j), `<span>${esc(x)}</span>`, "row")).join("")}</div>` : ""}

  <div class="en-pager">${prev ? `<a class="en-pg prev press" href="#/entreno/${id}/${prev.id}"><span class="en-pg-l">${icon("back")} ${t("Anterior")}</span><b>${esc(prev.titulo)}</b></a>` : "<span></span>"}${next ? `<a class="en-pg next press" href="#/entreno/${id}/${next.id}" style="${artVars(a)}"><span class="en-pg-l">${t("Siguiente")} ${icon("chevron")}</span><b>${esc(next.titulo)}</b></a>` : ""}</div>`;

  /* "Leer más" solo si el resumen no cabe en 3 líneas; la barra de secciones queda pegada bajo la barra superior */
  const cl = el.querySelector(".en-clamp"), mas = el.querySelector("[data-mas]");
  if(cl && mas) requestAnimationFrame(() => { if(cl.classList.contains("open") || cl.scrollHeight > cl.clientHeight + 2) mas.hidden = false; });
  const topH = () => document.querySelector(".top")?.offsetHeight || 0;
  el.querySelector(".en-anchors")?.style.setProperty("--top", topH() + "px");
  el.onclick = e => {
    const f = e.target.closest("[data-f]"); if(f){ haptic("selection"); st.filtro = f.dataset.f; vistaModulo(el, id, modId, titulo); return; }
    if(e.target.closest("[data-mas]")){ st.mas = st.mas === m.id ? null : m.id; cl.classList.toggle("open", st.mas === m.id); mas.textContent = st.mas === m.id ? t("Leer menos") : t("Leer más"); return; }
    const g = e.target.closest("[data-go]"), sec = g && el.querySelector("#en-s-" + g.dataset.go);
    if(sec) window.scrollTo({top: sec.getBoundingClientRect().top + window.scrollY - topH() - (el.querySelector(".en-anchors")?.offsetHeight || 0) - 8, behavior: "smooth"});
  };
  el.onchange = e => {
    const k = e.target.dataset.k; if(!k) return;
    haptic(e.target.checked ? "light" : "selection");
    E.marcar(k, e.target.checked);
    e.target.closest(".en-drill,.en-r")?.classList.toggle("done", e.target.checked);
  };
}

export {meta as metaSesion, tipoT, artesT};
