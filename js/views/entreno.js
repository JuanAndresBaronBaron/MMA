/* Entrenamiento: rutina personal, sesión del día y caminos de aprendizaje por arte. */
import * as E from "../entreno/index.js";
import * as T from "../entreno/timer.js";
import * as S from "../store.js";
import {icon, toast, modal, confirmDlg} from "../ui.js";
import {esc, today, fmtDate, addDays, h} from "../util.js";
import {t, tn, lang} from "../i18n.js";

const PLAT = {youtube: ["YouTube", "#ff0033"], tiktok: ["TikTok", "#25f4ee"], udemy: ["Udemy", "#a435f0"], instagram: ["Instagram", "#e1306c"], articulo: [t("Artículo"), "#d4a73c"], web: ["Web", "#8a8a8a"]};
const st = {dia: today(), hoy: today(), filtro: "todas"};

export function render(el, [artId, modId]){
  /* pasó la medianoche: si estaba en "hoy", sigue en el día nuevo */
  if(st.hoy !== today()){ if(st.dia === st.hoy) st.dia = today(); st.hoy = today(); }
  if(artId && E.arte(artId)) return conCarga(el, [artId], () => modId ? vistaModulo(el, artId, modId) : vistaArte(el, artId));
  const r = E.rutina();
  const ids = E.ARTES.map(a => a.id);
  return conCarga(el, ids, () => vistaHub(el, r));
}

/* carga el contenido que haga falta y luego pinta */
function conCarga(el, ids, pintar){
  const falta = ids.filter(id => !E.cargado(id));
  if(!falta.length) return pintar();
  const hash = location.hash;
  el.innerHTML = `<div class="card"><p class="muted">${icon("sync", "spin")} ${t("Cargando…")}</p></div>`;
  Promise.all(falta.map(E.cargar)).then(() => { if(location.hash === hash) pintar(); })
    .catch(e => { console.error(e); el.innerHTML = `<div class="card"><p>${t("No se pudo cargar el contenido. Revisa tu conexión.")}</p></div>`; });
}

const ring = (p, s = 52, color = "var(--accent)") => { const r = s / 2 - 4.5, c = 2 * Math.PI * r;
  return `<svg class="en-ring" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"><circle cx="${s / 2}" cy="${s / 2}" r="${r}" class="bg"/><circle cx="${s / 2}" cy="${s / 2}" r="${r}" class="fg" style="stroke:${color}" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p / 100)}"/><text x="50%" y="50%" dy=".35em" text-anchor="middle">${p}%</text></svg>`; };
const chk = (k, label = "", cls = "", off = false) => `<label class="en-chk ${cls}"><input type="checkbox" data-k="${esc(k)}" ${E.hecho(k) ? "checked" : ""} ${off ? "disabled" : ""}><span class="box"></span>${label}</label>`;
const nivelT = n => t((E.NIVELES.find(x => x[0] === n) || [, n])[1]);
const esNota = () => lang() === "en" ? `<p class="muted small en-note">${icon("info", "inline")} ${t("El contenido de los caminos está en español.")}</p>` : "";

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
  return `<div class="en-done">${icon("check")}<div><b>${esc(titulo)}</b>${meta(s)}${!s.plan && !s.tipo ? `<span class="muted small">${tn(s.hechos?.length || 0, "1 bloque marcado", "{n} bloques marcados")}</span>` : ""}</div>
    <button class="btn small ghost" data-deshacer="${esc(s.id)}">${s.plan ? t("Deshacer") : t("Borrar")}</button></div>`;
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
  const diasSem = E.semana(hoy).filter(d => conSes.has(d)).length;
  const mes = hoy.slice(0, 7), minMes = hs.filter(s => s.fecha.startsWith(mes)).reduce((a, s) => a + (+s.min || 0), 0);
  const rc = E.rachas(r), desde = r?._c ? E.toISO(new Date(r._c)) : "";
  const cab = main || prev;
  const tocaba = r && E.artesDelDia(r, st.dia).length;
  const princ = (bloques || []).filter(b => b.tipo !== "tarea"), tareas = (bloques || []).filter(b => b.tipo === "tarea");
  const nb = princ.filter(b => b.tipo !== "video").length, nh = princ.filter(b => hechos.has(b.b)).length;

  el.innerHTML = `
  ${esNota()}
  ${r || hs.length ? `<div class="kpis">
    <div class="kpi"><span class="kpi-ic c2">${icon("check")}</span><div><b>${r ? `${diasSem}/${r.dias.length}` : diasSem}</b><span>${t("Días entrenados esta semana")}</span></div></div>
    <div class="kpi"><span class="kpi-ic c1">${icon("clock")}</span><div><b>${tn(minMes, "1 min", "{n} min")}</b><span>${t("Entrenados este mes")}</span></div></div>
    <div class="kpi"><span class="kpi-ic c4">${icon("star")}</span><div><b>${tn(rc.actual, "1 día", "{n} días")}</b><span>${t("Racha · récord {n}", {n: rc.record})}</span></div></div>
    <div class="kpi"><span class="kpi-ic c3">${icon("fist")}</span><div><b>${tn(hs.length, "1 sesión", "{n} sesiones")}</b><span>${t("En total")}</span></div></div>
  </div>` : ""}
  ${!r ? `<section class="card en-cta">
    <div><h2>${t("Arma tu rutina de entrenamiento")}</h2><p class="muted">${t("Elige los días, cuánto tiempo tienes cada día y qué artes quieres entrenar: una, varias o todas. La app te arma cada sesión con los drills del nivel en el que vas y guarda tu progreso.")}</p></div>
    <div class="en-cta-b"><button class="btn primary big" data-rutina>${icon("calendar")} ${t("Crear mi rutina")}</button><button class="btn ghost" data-registrar>${icon("plus")} ${t("Registrar entreno")}</button></div></section>` : ""}

  ${r ? `<section class="card">
    <header class="card-h"><h3>${icon("calendar")} ${t("Tu semana")}</h3><div class="row gap"><span class="muted small hide-s">${esc(rutinaTxt(r))}</span><button class="btn small ghost" data-rutina>${icon("edit")} ${t("Rutina")}</button></div></header>
    <div class="en-week">${sem.map(d => { const a = E.artesDelDia(r, d), s = conSes.has(d);
      return `<button class="en-day ${d === st.dia ? "on" : ""} ${d === hoy ? "hoy" : ""} ${s ? "done" : a.length ? (d < hoy && d >= desde ? "miss" : "plan") : "rest"}" data-dia="${d}">
        <span class="en-dn">${t(E.DIAS_C[E.diaSemana(d) - 1])}</span><b>${+d.slice(8)}</b>
        <span class="en-dots">${s ? icon("check") : a.map(x => `<i style="background:${E.arte(x).color}"></i>`).join("")}</span></button>`; }).join("")}</div>
    <div class="en-weeknav"><button class="btn small ghost" data-sem="-7" aria-label="${t("Semana anterior")}">${icon("back")}</button><button class="btn small ghost" data-hoy>${t("Hoy")}</button><button class="btn small ghost" data-sem="7" aria-label="${t("Semana siguiente")}">${icon("chevron")}</button></div>
  </section>

  <section class="card en-today">
    <header class="card-h"><h3>${icon("fist")} ${st.dia === hoy ? t("Sesión de hoy") : t("Sesión del {fecha}", {fecha: fmtDate(st.dia)})}</h3>
      <div class="row gap">${cab ? `<span class="muted small">${tn(cab.min, "1 min", "{n} min")} · ${(cab.artes || []).map(a => `<span class="en-tag" style="--c:${E.arte(a).color}">${esc(t(E.arte(a).corto))}</span>`).join(" ")}</span>` : ""}
      <button class="btn small ghost" data-crono aria-label="${t("Temporizador")}">${icon("clock")}<span class="hide-s"> ${t("Temporizador")}</span></button></div></header>
    ${main && modo === "hecha" ? resumen(main) : ""}
    ${bloques ? `${modo === "curso" ? `<div class="en-prog"><span style="width:${nb ? Math.round(nh / nb * 100) : 0}%"></span></div>` : ""}
      ${modo === "futuro" ? `<p class="muted small en-prev">${icon("info", "inline")} ${t("Vista previa: la sesión se arma ese día según tu progreso.")}</p>` : ""}
      <ol class="en-blocks">${princ.map(b => bloque(b, modo, hechos)).join("")}</ol>
      ${tareas.length ? `<h4 class="en-sub">${t("Tarea opcional para casa")}</h4><ol class="en-blocks">${tareas.map(b => bloque(b, modo, hechos)).join("")}</ol>` : ""}
      ${modo === "preview" ? `<div class="en-actions"><button class="btn primary" data-empezar>${PLAY} ${t("Empezar sesión")}</button><span class="muted small">${t("Marca los bloques que hiciste: los drills cuentan para tu progreso.")}</span></div>` : ""}
      ${modo === "curso" ? `<div class="en-actions"><button class="btn primary" data-terminar>${icon("check")} ${t("Terminé la sesión")}</button><span class="muted small">${t("{a} de {b} bloques hechos", {a: nh, b: nb})}</span></div>` : ""}`
      : !otras.length ? (tocaba && st.dia < hoy
        ? `<div class="empty">${icon("calendar", "big")}<h3>${t("Sin registro")}</h3><p>${t("No registraste un entreno este día. Si entrenaste, regístralo para no perder la racha.")}</p></div>`
        : `<div class="empty">${icon("heart", "big")}<h3>${t("Día de descanso")}</h3><p>${t("Recuperarse también es entrenar: camina, estira o mira uno de los videos pendientes.")}</p></div>`) : ""}
    ${otras.length ? `<div class="en-otras">${otras.map(resumen).join("")}</div>` : ""}
    ${!futuro ? `<div class="en-reg"><button class="btn ghost small" data-registrar>${icon("plus")} ${t("Registrar entreno")}</button><span class="muted small">${t("Clase, sparring, open mat, cardio o app")}</span></div>` : ""}
  </section>` : ""}

  <section class="card">
    <header class="card-h"><h3>${icon("belt")} ${t("Caminos de aprendizaje")}</h3><span class="muted small">${t("De lo más básico a lo más avanzado")}</span></header>
    <div class="en-arts">${E.ARTES.map(a => { const d = E.cargado(a.id), p = E.pctArte(d), m = E.moduloActual(d), enRut = r?.artes?.includes(a.id);
      const nv = d.modulos.reduce((s, x) => s + x.recursos.length, 0);
      return `<article class="en-art" style="--c:${a.color}">
        <div class="en-art-h">${p ? ring(p, 54, a.color) : `<span class="en-new">${t("Nuevo")}</span>`}<div><a class="en-art-lnk" href="#/entreno/${a.id}"><b>${esc(t(a.nombre))}</b></a>
          <span class="en-chips"><span>${tn(d.modulos.length, "1 módulo", "{n} módulos")}</span><span>${tn(nv, "1 video", "{n} videos")}</span>${enRut ? `<span class="en-in">${icon("calendar")} ${t("En tu rutina")}</span>` : ""}</span></div></div>
        <span class="en-art-now"><span class="muted small">${p ? t("Vas en") : t("Empiezas con")}</span> ${esc(m.titulo)} <span class="lvl ${m.nivel}">${nivelT(m.nivel)}</span></span>
        <a class="en-go" href="#/entreno/${a.id}/${m.id}">${p ? t("Continuar módulo {n}", {n: m.n}) : t("Empezar")} →</a></article>`; }).join("")}</div>
  </section>

  ${hs.length ? `<section class="card"><header class="card-h"><h3>${icon("list")} ${t("Historial")}</h3></header><div class="list">${hs.slice(0, 10).map(s => `<button class="li en-hist" data-dia="${s.fecha}"><span class="li-ic">${icon(s.plan ? "check" : "fist")}</span><div class="li-main"><b>${fmtDate(s.fecha, true)}</b>${meta(s, true)}</div></button>`).join("")}</div></section>` : ""}`;

  /* busca la sesión guardada del día o la congela a partir de la vista previa (solo hoy) */
  const asegurar = () => E.planDe(st.dia) || (modo === "preview" ? E.iniciar(prev) : null);
  el.onclick = async e => {
    const tg = e.target;
    if(tg.closest(".en-b p")){ tg.closest(".en-b").classList.toggle("open"); return; }
    if(tg.closest("[data-rutina]")) return editarRutina();
    if(tg.closest("[data-registrar]")) return registrarModal();
    if(tg.closest("[data-crono]")) return T.abrir({});
    const d = tg.closest("[data-dia]"); if(d){
      st.dia = d.dataset.dia; vistaHub(el, r);
      if(d.classList.contains("en-hist")) { const c = el.querySelector(".en-today"); if(c) window.scrollTo({top: c.getBoundingClientRect().top + window.scrollY - (document.querySelector(".top")?.offsetHeight || 0) - 10, behavior: "smooth"}); }
      return;
    }
    const sm = tg.closest("[data-sem]"); if(sm){ st.dia = addDays(st.dia, +sm.dataset.sem); return vistaHub(el, r); }
    if(tg.closest("[data-hoy]")){ st.dia = today(); return vistaHub(el, r); }
    if(tg.closest("[data-empezar]")){ asegurar(); toast(t("Sesión empezada: marca cada bloque al terminarlo")); return; }
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
    if(x.dataset.b !== undefined){ const s = asegurar(); if(s) E.marcarBloque(s.id, x.dataset.b, x.checked); return; }
    if(x.dataset.k){ if(x.closest(".en-blocks")) asegurar(); E.marcar(x.dataset.k, x.checked); }
  };
}

function bloque(b, modo, hechos){
  const a = b.arte && E.arte(b.arte);
  const tag = a ? `<span class="en-tag" style="--c:${a.color}">${esc(t(a.corto))}</span>` : "";
  const off = modo === "futuro" || modo === "hecha";
  if(b.tipo === "video" || b.tipo === "tarea") return `<li class="en-b ${b.tipo}"><span class="en-bmin">${icon(b.tipo === "video" ? "star" : "edit")}</span><div><div class="en-bt">${tag}<span class="muted small">${b.tipo === "video" ? t("Video del día") : t("Opcional")}</span></div>
    ${b.url ? `<a href="${esc(b.url)}" target="_blank" rel="noopener"><b>${esc(b.t)}</b></a>` : `<b>${esc(b.t)}</b>`}${b.dosis ? ` <span class="en-dose">${esc(b.dosis)}</span>` : ""}<p>${esc(b.d || "")}</p>${chk(b.k, b.tipo === "video" ? t("Visto") : t("Hecho"), "", modo === "futuro")}</div></li>`;
  const d = b.tipo === "calor" ? (b.artes || []).map(x => t(E.arte(x)?.calor || "")).join(" ")
    : b.tipo === "cierre" ? t("Estiramientos suaves, respiración y anota en una línea qué mejoraste hoy.")
    : b.tipo === "libre" ? t("Repite el drill que más te costó hoy o haz rounds de sombra aplicando {tema}.", {tema: (b.modT || "").toLowerCase()})
    : b.d || "";
  const on = hechos.has(b.b), rd = b.dosis && !off && E.rondas(b.dosis);
  return `<li class="en-b ${b.tipo} ${on ? "hecho" : ""}"><label class="en-bchk"><input type="checkbox" data-b="${esc(b.b)}" aria-label="${t("Hecho")}" ${on ? "checked" : ""} ${off ? "disabled" : ""}><span class="box"></span></label><span class="en-bmin">${b.min}'</span><div>
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

function registrarModal(){
  const hoy = today(), r = E.rutina(), f = st.dia <= hoy ? st.dia : hoy;
  const def = E.artesDelDia(r, f)[0] || r?.artes?.[0] || E.ARTES[0].id;
  const body = h(`<form class="form" novalidate>
    <label class="field"><span class="lbl">${t("Fecha")}</span><input name="fecha" type="date" max="${hoy}" value="${f}" required></label>
    <label class="field"><span class="lbl">${t("Arte")}</span><select name="arte">${E.ARTES.map(a => `<option value="${a.id}" ${a.id === def ? "selected" : ""}>${esc(t(a.nombre))}</option>`).join("")}</select></label>
    <div class="field"><span class="lbl">${t("Tipo")}</span><div class="seg">${TIPOS.slice(1).map(([k, l], i) => `<label><input type="radio" name="tipo" value="${k}" ${i === 0 ? "checked" : ""}><span>${t(l)}</span></label>`).join("")}</div></div>
    ${minF(60)}${rpeChips()}${notaF({})}</form>`);
  const m = modal({title: t("Registrar entreno"), body, foot: `<button class="btn ghost" data-close>${t("Cancelar")}</button><button class="btn primary" data-save>${icon("check")} ${t("Guardar")}</button>`});
  m.foot.querySelector("[data-save]").onclick = () => {
    const v = leer(body), fecha = body.querySelector("[name=fecha]").value;
    if(!fecha || fecha > hoy) return toast(t("Elige una fecha de hoy o anterior"), "warn");
    if(!(v.min > 0)) return toast(t("Escribe los minutos que entrenaste"), "warn");
    E.registrar({fecha, tipo: body.querySelector("[name=tipo]:checked")?.value || "clase", artes: [body.querySelector("[name=arte]").value], min: v.min, rpe: v.rpe, nota: v.nota});
    st.dia = fecha; m.close(); toast(t("Entreno registrado"));
  };
  body.onsubmit = e => { e.preventDefault(); m.foot.querySelector("[data-save]").click(); };
}

const rutinaTxt = r => `${r.dias.map(d => t(E.DIAS_C[d - 1])).join(", ")} · ${tn(r.min, "1 min", "{n} min")} · ${r.artes.map(a => t(E.arte(a)?.corto)).join(", ")}`;

function editarRutina(){
  const r = E.rutina() || {dias: [1, 3, 5], min: 60, artes: [], modo: "pareja"};
  const body = h(`<form class="form" novalidate>
    <div class="field"><span class="lbl">${t("¿Qué días entrenas?")}</span><div class="chips en-dias">${E.DIAS.map((d, i) => `<label class="chip"><input type="checkbox" name="dias" value="${i + 1}" ${r.dias.includes(i + 1) ? "checked" : ""}><span>${t(E.DIAS_C[i])}</span></label>`).join("")}</div></div>
    <div class="field"><span class="lbl">${t("¿Cuánto tiempo por día?")}</span><div class="seg">${[30, 45, 60, 75, 90, 120].map(m => `<label><input type="radio" name="min" value="${m}" ${r.min === m ? "checked" : ""}><span>${m} min</span></label>`).join("")}</div></div>
    <div class="field"><span class="lbl">${t("¿Qué quieres entrenar?")}</span><div class="en-pick">${E.ARTES.map(a => `<label class="en-pk" style="--c:${a.color}"><input type="checkbox" name="artes" value="${a.id}" ${r.artes.includes(a.id) ? "checked" : ""}><span><b>${esc(t(a.nombre))}</b></span></label>`).join("")}</div>
      <small class="hint">${t("Con varias artes, se turnan entre tus días. Con sesiones de 90 minutos o más, se combinan dos por día.")}</small></div>
    <div class="field"><span class="lbl">${t("¿Con quién entrenas?")}</span><div class="seg"><label><input type="radio" name="modo" value="pareja" ${r.modo !== "solo" ? "checked" : ""}><span>${t("En academia o con compañero")}</span></label><label><input type="radio" name="modo" value="solo" ${r.modo === "solo" ? "checked" : ""}><span>${t("Solo")}</span></label></div>
      <small class="hint">${t("Si entrenas solo, la rutina usa solo drills que no necesitan compañero.")}</small></div>
  </form>`);
  const m = modal({title: t("Tu rutina"), body, foot: `${E.rutina() ? `<button class="btn danger ghost left" data-del>${icon("trash")} ${t("Borrar rutina")}</button>` : ""}<button class="btn ghost" data-close>${t("Cancelar")}</button><button class="btn primary" data-save>${t("Guardar rutina")}</button>`});
  m.foot.querySelector("[data-save]").onclick = () => {
    const v = {dias: [...body.querySelectorAll("[name=dias]:checked")].map(x => +x.value), min: +(body.querySelector("[name=min]:checked")?.value || 60),
      artes: [...body.querySelectorAll("[name=artes]:checked")].map(x => x.value), modo: body.querySelector("[name=modo]:checked")?.value || "pareja"};
    if(!v.dias.length) return toast(t("Elige al menos un día"), "warn");
    if(!v.artes.length) return toast(t("Elige al menos un arte"), "warn");
    E.guardarRutina(v); st.dia = today(); m.close(); toast(t("Rutina guardada"));
  };
  m.foot.querySelector("[data-del]")?.addEventListener("click", async () => { if(await confirmDlg(t("Se borra la rutina. Tu progreso y tu historial se conservan."))){ S.del("rutinas", "mia"); m.close(); } });
}

/* ---------- camino de un arte ---------- */
function vistaArte(el, id){
  const a = E.arte(id), d = E.cargado(id), p = E.pctArte(d), act = E.moduloActual(d);
  el.innerHTML = `
  <a class="btn ghost small en-back" href="#/entreno">${icon("back")} ${t("Entrenamiento")}</a>
  ${esNota()}
  <section class="en-hero" style="--c:${a.color}">
    <div><span class="en-eye">${t("Camino de aprendizaje")}</span><h2>${esc(d.intro.titulo || a.nombre)}</h2><p>${esc(d.intro.sub || "")}</p></div>
    ${ring(p, 84, a.color)}
  </section>
  ${d.intro.reglas?.length ? `<div class="en-rules">${d.intro.reglas.map(x => `<div><b>${esc(x.t)}</b><p>${esc(x.d)}</p></div>`).join("")}</div>` : ""}
  ${E.NIVELES.map(([k, n]) => { const ms = d.modulos.filter(m => m.nivel === k); if(!ms.length) return "";
    return `<h3 class="en-lvl"><span class="lvl ${k}">${t(n)}</span><span class="muted small">${tn(ms.length, "1 módulo", "{n} módulos")}</span></h3>
    <div class="en-mods">${ms.map(m => { const pm = E.pctMod(id, m);
      return `<a class="en-mod ${m === act ? "now" : ""} ${pm === 100 ? "full" : ""}" href="#/entreno/${id}/${m.id}" style="--c:${a.color}">
        <span class="en-mn">${String(m.n).padStart(2, "0")}</span><div class="en-mt"><b>${esc(m.titulo)}</b><span class="muted small">${esc(m.sub || "")}</span>
        <span class="small en-mc">${tn(m.conceptos.length, "1 concepto", "{n} conceptos")} · ${tn(m.drills.length, "1 drill", "{n} drills")} · ${tn(m.recursos.length, "1 video", "{n} videos")}</span></div>
        ${ring(pm, 44, a.color)}${m === act ? `<span class="en-now">${t("Vas aquí")}</span>` : ""}</a>`; }).join("")}</div>`; }).join("")}
  ${d.plan.length ? `<h3 class="en-lvl">${icon("calendar")} ${t("Plan sugerido")}</h3>
    <div class="en-phases">${d.plan.map(f => `<div class="en-ph" style="--c:${a.color}"><span class="en-eye">${esc(f.semanas)}</span><b>${esc(f.fase)}</b><p class="muted small">${esc(f.foco)}</p><ul>${f.puntos.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>`).join("")}</div>` : ""}
  ${d.semana.length ? `<h3 class="en-lvl">${icon("clock")} ${t("Clase tipo")}</h3><div class="card flush"><div class="list">${d.semana.map(b => `<div class="li"><span class="en-bmin wide">${esc(b.min)}</span><div class="li-main"><b>${esc(b.t)}</b><span class="muted small en-wrap">${esc(b.d)}</span></div></div>`).join("")}</div></div>` : ""}`;
  el.onclick = null; el.onchange = null;
}

/* ---------- un módulo ---------- */
function vistaModulo(el, id, modId){
  const a = E.arte(id), d = E.cargado(id), m = d.modulos.find(x => x.id === modId);
  if(!m){ location.hash = `#/entreno/${id}`; return; }
  const i = d.modulos.indexOf(m), prev = d.modulos[i - 1], next = d.modulos[i + 1];
  const plats = ["todas", ...Object.keys(PLAT).filter(k => m.recursos.some(r => r.plataforma === k))];
  if(!plats.includes(st.filtro)) st.filtro = "todas";
  const recs = m.recursos.filter(r => st.filtro === "todas" || r.plataforma === st.filtro);
  const yt = u => (u.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/) || [])[1];
  el.innerHTML = `
  <a class="btn ghost small en-back" href="#/entreno/${id}">${icon("back")} ${esc(t(a.nombre))}</a>
  ${esNota()}
  <section class="en-hero sm" style="--c:${a.color}">
    <div><span class="en-eye">${t("Módulo {n}", {n: m.n})} · <span class="lvl ${m.nivel}">${nivelT(m.nivel)}</span></span><h2>${esc(m.titulo)}</h2><p class="en-clamp ${st.mas === m.id ? "open" : ""}">${esc(m.resumen || m.sub || "")}</p><button class="btn-link en-more" data-mas hidden>${st.mas === m.id ? t("Leer menos") : t("Leer más")}</button></div>
    <span data-ring>${ring(E.pctMod(id, m), 76, a.color)}</span>
  </section>
  <nav class="en-anchors" aria-label="${t("Secciones")}">${[["conceptos", "Conceptos", m.conceptos.length], ["drills", "Drills", m.drills.length], ["videos", "Videos", m.recursos.length], ["hitos", "Hitos", m.hitos.length]]
    .filter(x => x[2]).map(([k, l, n]) => `<button data-go="${k}">${t(l)} <i>${n}</i></button>`).join("")}</nav>

  <h3 class="en-sec" id="en-s-conceptos">${t("Conceptos")}</h3>
  <div class="en-concepts">${m.conceptos.map((c, j) => `<details class="en-c" ${j === 0 ? "open" : ""}><summary><span class="en-ci" style="--c:${a.color}">${j + 1}</span><b>${esc(c.titulo)}</b>${icon("chevron", "chev")}</summary>
    <div class="en-cb"><p>${esc(c.explicacion)}</p><div class="en-cols">
      ${(c.puntos || c.puntos_clave)?.length ? `<div class="ok"><h4>${t("Claves")}</h4><ul>${(c.puntos || c.puntos_clave).map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}
      ${(c.errores || c.errores_comunes)?.length ? `<div class="bad"><h4>${t("Errores comunes")}</h4><ul>${(c.errores || c.errores_comunes).map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}</div></div></details>`).join("")}</div>

  <h3 class="en-sec" id="en-s-drills">${t("Drills")}</h3>
  <div class="en-drills">${m.drills.map((x, j) => { const k = E.kDrill(id, m.id, j); return `<div class="en-drill ${E.hecho(k) ? "done" : ""}">
    <div class="en-dh">${chk(k)}<b>${esc(x.nombre)}</b><span class="lvl ${x.nivel}">${nivelT(x.nivel)}</span></div>
    <p>${esc(x.como)}</p><div class="en-dm"><span class="en-dose">${icon("clock", "inline")} ${esc(x.dosis)}</span>${x.solo ? `<span class="muted small">${t("Se puede solo")}</span>` : `<span class="muted small">${t("Con compañero")}</span>`}</div></div>`; }).join("")}</div>

  ${m.recursos.length ? `<h3 class="en-sec" id="en-s-videos">${t("Videos y cursos")} <span class="count-b">${m.recursos.length}</span></h3>
  ${plats.length > 2 ? `<div class="en-filter">${plats.map(k => `<button class="chip-btn ${st.filtro === k ? "on" : ""}" data-f="${k}">${k === "todas" ? t("Todas") : PLAT[k][0]}</button>`).join("")}</div>` : ""}
  <div class="en-res">${recs.map(r => { const k = E.kRec(id, r.url), v = r.plataforma === "youtube" && yt(r.url), [pn, pc] = PLAT[r.plataforma] || PLAT.web;
    return `<article class="en-r ${E.hecho(k) ? "done" : ""}"><a class="en-rm ${v ? "" : "noimg"}" href="${esc(r.url)}" target="_blank" rel="noopener" style="--pc:${pc}">
      ${v ? `<img loading="lazy" src="https://i.ytimg.com/vi/${v}/mqdefault.jpg" alt="" onerror="this.parentNode.classList.add('noimg');this.remove()">` : ""}<span class="en-rp">${esc(pn)}</span></a>
      <div class="en-rb"><a class="en-rt" href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.titulo)}</a>
      <span class="muted small">${esc(r.autor || "")}${r.idioma ? ` · ${r.idioma === "es" ? t("Español") : t("Inglés")}` : ""} · ${nivelT(r.nivel)}${r.pago ? ` <span class="pill pronto">${t("De pago")}</span>` : ""}</span>
      <p>${esc(r.por_que || "")}</p>${chk(k, t("Visto"))}</div></article>`; }).join("")}</div>` : ""}

  ${m.hitos.length ? `<h3 class="en-sec" id="en-s-hitos">${t("Lo domino cuando…")}</h3><div class="en-hitos">${m.hitos.map((x, j) => chk(E.kHito(id, m.id, j), `<span>${esc(x)}</span>`, "row")).join("")}</div>` : ""}

  <div class="en-pager">${prev ? `<a class="btn ghost" href="#/entreno/${id}/${prev.id}">${icon("back")} ${esc(prev.titulo)}</a>` : "<span></span>"}${next ? `<a class="btn primary" href="#/entreno/${id}/${next.id}">${esc(next.titulo)} ${icon("chevron")}</a>` : ""}</div>`;

  /* "Leer más" solo si el resumen no cabe en 3 líneas; la barra de secciones queda pegada bajo la barra superior */
  const cl = el.querySelector(".en-clamp"), mas = el.querySelector("[data-mas]");
  if(cl && mas) requestAnimationFrame(() => { if(cl.classList.contains("open") || cl.scrollHeight > cl.clientHeight + 2) mas.hidden = false; });
  const topH = () => document.querySelector(".top")?.offsetHeight || 0;
  el.querySelector(".en-anchors")?.style.setProperty("--top", topH() + "px");
  el.onclick = e => {
    const f = e.target.closest("[data-f]"); if(f){ st.filtro = f.dataset.f; vistaModulo(el, id, modId); return; }
    if(e.target.closest("[data-mas]")){ st.mas = st.mas === m.id ? null : m.id; cl.classList.toggle("open", st.mas === m.id); mas.textContent = st.mas === m.id ? t("Leer menos") : t("Leer más"); return; }
    const g = e.target.closest("[data-go]"), sec = g && el.querySelector("#en-s-" + g.dataset.go);
    if(sec) window.scrollTo({top: sec.getBoundingClientRect().top + window.scrollY - topH() - (el.querySelector(".en-anchors")?.offsetHeight || 0) - 8, behavior: "smooth"});
  };
  el.onchange = e => {
    const k = e.target.dataset.k; if(!k) return;
    E.marcar(k, e.target.checked);
    e.target.closest(".en-drill,.en-r")?.classList.toggle("done", e.target.checked);
  };
}
