/* Prospectos: personas interesadas, clase de prueba, seguimiento por WhatsApp y conversión a alumno.
   Registro leads: {id, academiaId, sedeId?, nombre, telefono, email?, edad?, fuente, disciplinaId?, etapa, fecha (alta),
   prueba?, claseId?, asistioPrueba?, motivoPerdido?, nota?, alumnoId?, seguimientos: [{fecha, tipo, nota, msg?}]} */
import * as S from "../store.js";
import {icon, toast, modal, sheet, formModal, emptyState, confirmDlg, field} from "../ui.js";
import {esc, today, addDays, daysBetween, parseISO, toISO, norm, waUrl, fmtDate, b64urlEncode, h} from "../util.js";
import {t, tn, locale, EN} from "../i18n.js";

export const ETAPAS = [["nuevo", "Nuevo"], ["contactado", "Contactado"], ["prueba", "Clase de prueba"], ["inscrito", "Inscrito"], ["perdido", "Perdido"]];
/* misma lista y textos que js/pages/inscripcion.js (el mensaje trae el texto, no la clave) */
export const FUENTES = [["instagram", "Instagram"], ["facebook", "Facebook"], ["tiktok", "TikTok"], ["referido", "Me lo recomendaron"], ["volante", "Volante o afiche"], ["pasaba", "Pasaba por ahí"], ["web", "Página web o Google"], ["otro", "Otro"]];
const MOTIVOS = ["Precio", "Horario", "Distancia", "No respondió", "Se inscribió en otra academia", "Otro"];
const etapaTxt = k => t((ETAPAS.find(e => e[0] === k) || ETAPAS[0])[1]);
const fuenteTxt = k => t((FUENTES.find(f => f[0] === k) || FUENTES[7])[1]);
export const fechaLead = l => l.fecha || toISO(new Date(l._c || Date.now()));
const nom1 = n => String(n || "").trim().split(/\s+/)[0] || "";

/* ---------- plantillas de WhatsApp (editables, prefs msg_lead_*) ---------- */
export const PLANTILLAS = [
  ["contacto", "Primer contacto", "Hola {nombre}, gracias por tu interés en {academia}. ¿Qué día te queda bien para venir a una clase de prueba gratis?"],
  ["bienvenida", "Bienvenida con la prueba", "Hola {nombre}, ¡bienvenido a {academia}! Te esperamos en tu clase de prueba: {clase}, {fecha}. Trae ropa cómoda, agua y llega 10 minutos antes."],
  ["recordatorio", "Recordatorio (día antes)", "Hola {nombre}, te recordamos tu clase de prueba en {academia}: {clase}, {fecha}. ¡Te esperamos!"],
  ["dia1", "Seguimiento día 1", "Hola {nombre}, ¿cómo te sentiste en la clase de ayer en {academia}? Nos encantaría verte de nuevo. ¿Te reservamos un cupo para la próxima?"],
  ["dia3", "Seguimiento día 3", "Hola {nombre}, te escribimos de {academia}. Esta semana tenemos promoción de inscripción. ¿Te ayudamos a empezar?"],
];
const tplDe = k => S.pref("msg_lead_" + k, null) || t((PLANTILLAS.find(p => p[0] === k) || PLANTILLAS[0])[2]);
const tplNombre = k => t((PLANTILLAS.find(p => p[0] === k) || PLANTILLAS[0])[1]);
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
function fechaLarga(iso){
  const d = parseISO(iso); if(!d) return "";
  try{ return new Intl.DateTimeFormat(locale(), {weekday: "long", day: "numeric", month: "long"}).format(d); }catch(e){ return fmtDate(iso); }
}
function fechaCorta(iso){
  const d = parseISO(iso); if(!d) return "";
  try{ return new Intl.DateTimeFormat(locale(), {weekday: "short", day: "numeric", month: "short"}).format(d).replace(/\./g, ""); }catch(e){ return fmtDate(iso); }
}
const claseDe = l => l.claseId ? S.get("clases", l.claseId) : null;
function claseTxt(c){
  if(!c) return "";
  const d = S.get("disciplinas", c.disciplinaId);
  return `${(c.nombre || "").trim() || (d ? t(d.nombre) : t("Clase"))} ${c.hora || ""}`.trim();
}
export function mensaje(k, l){
  const c = claseDe(l), d = S.get("disciplinas", l.disciplinaId);
  const v = {nombre: nom1(l.nombre), academia: S.academy()?.nombre || "", clase: claseTxt(c) || (d ? t(d.nombre) : t("la clase")), fecha: l.prueba ? fechaLarga(l.prueba) : t("el día que elijas")};
  return tplDe(k).replace(/\{(nombre|academia|clase|fecha)\}/g, (_, x) => v[x]);
}

/* próximo seguimiento que toca hoy o ya pasó: {k, fecha, tarde} o null */
export function pendiente(l, hoy = today()){
  if(!l || ["inscrito", "perdido"].includes(l.etapa)) return null;
  /* solo cuentan los mensajes enviados desde que se agendó la prueba actual (si se reagendó, los de la anterior no) */
  const todos = l.seguimientos || [], segs = l.prueba && Number.isInteger(l.segIni) ? todos.slice(l.segIni) : todos, has = k => segs.some(s => s.msg === k);
  const due = (k, fecha) => fecha <= hoy ? {k, fecha, tarde: fecha < hoy} : null;
  if(l.prueba){
    if(l.prueba >= hoy){
      if(!segs.length && !l.segIni) return due("bienvenida", fechaLead(l));
      /* el recordatorio toca desde el día antes; el mismo día de la prueba todavía sirve (no se marca atrasado) */
      if(!has("recordatorio") && daysBetween(hoy, l.prueba) <= 1) return {k: "recordatorio", fecha: hoy, tarde: false};
      return null;
    }
    if(!has("dia1")) return due("dia1", addDays(l.prueba, 1));
    if(!has("dia3")) return due("dia3", addDays(l.prueba, 3));
    return null;
  }
  if(!segs.length) return due("contacto", fechaLead(l));
  const ult = segs.map(s => s.fecha).sort().pop();
  return l.etapa === "contactado" ? due("dia3", addDays(ult, 3)) : null;
}

/* ---------- mensaje de la página de inscripción (js/pages/inscripcion.js) ---------- */
const CAMPOS = {nombre: ["nombre", "name"], telefono: ["telefono", "phone", "celular", "whatsapp"], edad: ["edad", "age"], disciplina: ["disciplina", "discipline"],
  sede: ["sede", "location"], fuente: ["como nos conocio", "how did you hear about us", "fuente", "source"], mensaje: ["mensaje", "message"], email: ["email", "correo", "e-mail"]};
export function parseInscripcion(txt){
  const out = {};
  for(const line of String(txt || "").split(/\r?\n/)){
    const m = /^\s*[*_]*([^:*_]{2,40}?)[*_]*\s*:\s*(.*)$/.exec(line); if(!m) continue;
    const k = norm(m[1]).trim(), v = m[2].trim();
    for(const [key, al] of Object.entries(CAMPOS)) if(al.includes(k) && !(key in out)) out[key] = v === "-" ? "" : v;
  }
  return out.nombre || out.telefono ? out : null;
}
const iguala = (txt, es) => { const n = norm(txt).trim(); return !!n && (n === norm(es) || n === norm(EN[es] || "")); };
/* texto del mensaje → valores del formulario de prospecto */
export function leadDeInscripcion(o){
  const disc = S.disciplinas().find(d => iguala(o.disciplina, d.nombre) || norm(t(d.nombre)) === norm(o.disciplina));
  const sede = S.sedes().find(s => norm(s.nombre) === norm(o.sede));
  const f = FUENTES.find(([k, n]) => iguala(o.fuente, n) || norm(o.fuente) === k);
  return Object.assign(sede ? {sedeId: sede.id} : {}, {nombre: o.nombre || "", telefono: o.telefono || "", email: o.email || "", edad: o.edad ? parseInt(o.edad, 10) || null : null,
    disciplinaId: disc?.id || "", fuente: f ? f[0] : "web", nota: [o.mensaje, !f && o.fuente ? `${t("Cómo nos conoció")}: ${o.fuente}` : ""].filter(Boolean).join("\n")});
}
/* enlace a inscripcion.html con los datos de la academia en ?a= (base64url de JSON) */
export function linkInscripcion(acad = S.academy()){
  const o = {n: acad?.nombre || "", w: acad?.whatsapp || acad?.telefono || "", d: S.disciplinas().map(d => d.nombre), s: S.sedes().length > 1 ? S.sedes().map(s => s.nombre) : []};
  if(acad?.color) o.c = acad.color;
  return location.href.split("#")[0].split("?")[0].replace(/[^/]*$/, "") + "inscripcion.html?a=" + b64urlEncode(JSON.stringify(o));
}

/* ---------- vista ---------- */
const st = {etapa: null, q: ""};

export function render(el, params, ctx, q){
  const query = q || ctx?.query || new URLSearchParams();
  const acad = S.academy(), hoy = today();
  const all = S.inAcad("leads");
  const sede = S.curSede();
  const leads = all.filter(l => !sede || !l.sedeId || l.sedeId === sede);
  if(!st.etapa) st.etapa = S.pref("leadsEtapa", "nuevo");

  /* KPI */
  const d30 = addDays(hoy, -29), d90 = addDays(hoy, -89);
  const n30 = leads.filter(l => fechaLead(l) >= d30).length;
  const pruebas = leads.filter(l => l.prueba && l.prueba >= d30);
  const asistio = pruebas.filter(l => l.asistioPrueba).length;
  const l90 = leads.filter(l => fechaLead(l) >= d90);
  const conv = l90.length ? Math.round(l90.filter(l => l.etapa === "inscrito").length / l90.length * 100) : null;
  const cuenta = {};
  for(const l of l90) cuenta[l.fuente || "otro"] = (cuenta[l.fuente || "otro"] || 0) + 1;
  const top = Object.entries(cuenta).sort((a, b) => b[1] - a[1])[0];

  const qn = norm(st.q);
  const vis = leads.filter(l => !qn || norm(l.nombre).includes(qn) || String(l.telefono || "").includes(st.q.trim()));
  const orden = (a, b) => { const pa = pendiente(a), pb = pendiente(b); return (pb ? (pb.tarde ? 2 : 1) : 0) - (pa ? (pa.tarde ? 2 : 1) : 0) || fechaLead(b).localeCompare(fechaLead(a)) || (b._c - a._c); };
  const porEtapa = k => vis.filter(l => (l.etapa || "nuevo") === k).sort(k === "prueba" ? (a, b) => (a.prueba || "").localeCompare(b.prueba || "") : orden);
  const atrasados = leads.filter(l => pendiente(l)?.tarde).length;

  const card = l => {
    const p = pendiente(l), dias = daysBetween(fechaLead(l), hoy), c = claseDe(l);
    const dd = l.prueba ? daysBetween(hoy, l.prueba) : null;
    return `<button type="button" class="ld-card ${p ? (p.tarde ? "late" : "due") : ""}" data-lead="${l.id}">
      <b class="ld-n">${esc(l.nombre)}</b>
      <span class="ld-meta"><span class="tag">${esc(fuenteTxt(l.fuente))}</span><span>${dias <= 0 ? t("hoy") : tn(dias, "hace 1 día", "hace {n} días")}</span></span>
      ${l.prueba ? `<span class="ld-trial ${dd === 0 ? "hoy" : ""}">${icon("calendar")}${dd === 0 ? t("Prueba hoy") : esc(cap(fechaCorta(l.prueba)))}${c ? ` · ${esc(c.hora || "")}` : ""}${l.etapa === "prueba" && dd < 0 ? ` · ${l.asistioPrueba ? t("asistió") : t("¿asistió?")}` : ""}</span>` : ""}
      ${l.etapa === "perdido" && l.motivoPerdido ? `<span class="muted small">${esc(t(l.motivoPerdido))}</span>` : ""}
      ${p ? `<span class="ld-due">${icon("whatsapp")}${esc(tplNombre(p.k))}${p.tarde ? ` · ${t("atrasado")}` : ""}</span>` : ""}
    </button>`;
  };

  el.innerHTML = `
  <div class="ld-head">
    <div><h2>${t("Prospectos")}</h2><span class="muted small">${t("Personas interesadas, clases de prueba y seguimiento")}</span></div>
    <div class="ld-act">
      <button type="button" class="btn ghost small" data-link>${icon("link")}<span>${t("Link de inscripción")}</span></button>
      <button type="button" class="btn ghost small" data-paste>${icon("whatsapp")}<span>${t("Pegar desde WhatsApp")}</span></button>
      <button type="button" class="btn ghost small" data-tpls>${icon("edit")}<span>${t("Mensajes")}</span></button>
      ${leads.length ? `<button type="button" class="btn ghost small" data-dif>${icon("users")}<span>${t("Mensaje masivo")}</span></button>` : ""}
      <button type="button" class="btn primary small" data-nuevo>${icon("plus")}<span>${t("Nuevo prospecto")}</span></button>
    </div>
  </div>
  ${!all.length ? `<section class="card">${emptyState({icon: "userPlus", title: t("Aún no tienes prospectos"), text: t("Anota a cada persona que pregunta por clases. La app te recuerda cuándo escribirle y te dice cuántos se inscriben."),
    cta: [{label: t("Agregar prospecto"), attr: "data-nuevo", icon: "plus"}, {label: t("Link de inscripción"), attr: "data-link", icon: "link", kind: "ghost"}]})}</section>` : `
  <div class="kpis ld-kpis">
    <div class="kpi"><span class="kpi-ic c1">${icon("userPlus")}</span><div><b>${n30}</b><span>${t("Prospectos (30 días)")}</span></div></div>
    <div class="kpi"><span class="kpi-ic c4">${icon("calendar")}</span><div><b>${pruebas.length}<small class="ld-of"> / ${asistio}</small></b><span>${t("Pruebas agendadas / asistieron")}</span></div></div>
    <div class="kpi"><span class="kpi-ic c2">${icon("check")}</span><div><b>${conv === null ? "—" : conv + "%"}</b><span>${t("Conversión (90 días)")}</span></div></div>
    <div class="kpi"><span class="kpi-ic c3">${icon("star")}</span><div><b title="${top ? esc(fuenteTxt(top[0])) : ""}">${top ? esc(fuenteTxt(top[0])) : "—"}</b><span>${t("Mejor fuente")}</span></div></div>
  </div>
  <div class="toolbar ld-tools"><label class="search">${icon("search")}<input id="ldq" type="search" placeholder="${t("Buscar por nombre o teléfono")}" value="${esc(st.q)}" aria-label="${t("Buscar")}"></label>
    ${atrasados ? `<span class="ld-late-b" role="status">${icon("alert")} ${tn(atrasados, "1 seguimiento atrasado", "{n} seguimientos atrasados")}</span>` : ""}</div>
  <div class="chip-row ld-stages" role="tablist" aria-label="${t("Etapa")}">${ETAPAS.map(([k]) => `<button type="button" role="tab" class="ld-st ${k === st.etapa ? "on" : ""}" aria-selected="${k === st.etapa}" data-etapa="${k}">${esc(etapaTxt(k))}<i>${porEtapa(k).length}</i></button>`).join("")}</div>
  <div class="ld-board">${ETAPAS.map(([k]) => { const ls = porEtapa(k); return `<section class="ld-col ${k === st.etapa ? "on" : ""}" data-col="${k}" aria-label="${esc(etapaTxt(k))}">
    <h3 class="ld-col-h"><span class="ld-dot ${k}"></span>${esc(etapaTxt(k))}<span class="count-b">${ls.length}</span></h3>
    <div class="ld-cards">${ls.map(card).join("") || `<p class="ld-nada muted small">${k === "nuevo" ? t("Nadie nuevo. Agrega a quien pregunte por clases.") : t("Nadie en esta etapa")}</p>`}</div></section>`; }).join("")}</div>`}
  <button type="button" class="fab only-m" data-nuevo aria-label="${t("Nuevo prospecto")}">${icon("plus")}</button>`;

  el.onclick = e => {
    const tg = e.target;
    const c = tg.closest("[data-lead]"); if(c) return detalle(c.dataset.lead);
    const et = tg.closest("[data-etapa]"); if(et){ st.etapa = et.dataset.etapa; S.setPref("leadsEtapa", st.etapa); for(const b of el.querySelectorAll("[data-etapa]")){ const on = b === et; b.classList.toggle("on", on); b.setAttribute("aria-selected", on); } for(const col of el.querySelectorAll("[data-col]")) col.classList.toggle("on", col.dataset.col === st.etapa); return; }
    if(tg.closest("[data-nuevo]")) return leadForm(null);
    if(tg.closest("[data-link]")) return linkSheet();
    if(tg.closest("[data-paste]")) return pegar();
    if(tg.closest("[data-tpls]")) return plantillasSheet();
    if(tg.closest("[data-dif]")) import("../difusion.js").then(m => m.openDifusion({segmento: "leads"})).catch(() => toast(t("Esta sección no está disponible"), "warn"));
  };
  const qi = el.querySelector("#ldq");
  if(qi) qi.oninput = () => { st.q = qi.value; render(el, params, ctx, q); const n = el.querySelector("#ldq"); n.focus(); n.setSelectionRange(n.value.length, n.value.length); };

  /* #/leads?nuevo=1 abre el formulario; #/leads?lead=<id> abre la ficha. Se limpia el hash para no repetirlo al repintar */
  const nuevo = query.get("nuevo"), abrir = query.get("lead");
  if(nuevo || abrir){
    history.replaceState(null, "", "#/leads");
    setTimeout(() => nuevo ? leadForm(null) : S.get("leads", abrir) && detalle(abrir), 0);
  }
}

/* ---------- formulario ---------- */
export function leadForm(l, pre = {}){
  const isNew = !l;
  const v = Object.assign({fuente: "instagram", sedeId: S.curSede() || S.sedes()[0]?.id || ""}, l || {}, pre);
  const discs = S.disciplinas(), sedes = S.sedes();
  const fields = [
    {k: "nombre", label: t("Nombre"), req: true, ph: t("Ej: Laura Gómez")},
    {k: "telefono", label: t("WhatsApp"), type: "tel", req: true, half: true, ph: "300 123 4567"},
    {k: "edad", label: t("Edad"), type: "number", min: 2, max: 99, half: true},
    {k: "fuente", label: t("¿Cómo nos conoció?"), type: "select", opts: FUENTES.map(([k, n]) => [k, t(n)]), half: true},
    {k: "disciplinaId", label: t("Le interesa"), type: "select", opts: [["", t("Sin definir")], ...discs.map(d => [d.id, t(d.nombre)])], half: true},
    sedes.length > 1 ? {k: "sedeId", label: t("Sede"), type: "select", opts: sedes.map(s => [s.id, s.nombre]), half: true} : `<input type="hidden" name="sedeId" value="${esc(v.sedeId || "")}">`,
    {k: "email", label: t("Correo"), type: "email", half: sedes.length > 1},
    {k: "nota", label: t("Nota"), type: "textarea", rows: 2, ph: t("Ej: quiere clases para su hijo de 8 años")},
  ];
  const m = formModal({title: isNew ? t("Nuevo prospecto") : t("Editar prospecto"), fields, values: v, save: isNew ? t("Agregar") : t("Guardar"),
    onSave: f => {
      const rec = {nombre: f.nombre, telefono: f.telefono, edad: f.edad || null, fuente: f.fuente || "otro", disciplinaId: f.disciplinaId || "", sedeId: f.sedeId || "", email: f.email || "", nota: f.nota || ""};
      const r = isNew ? S.put("leads", Object.assign({academiaId: S.academy().id, etapa: "nuevo", fecha: today(), seguimientos: []}, rec)) : S.put("leads", Object.assign({id: l.id}, rec));
      toast(isNew ? t("Prospecto agregado") : t("Cambios guardados"), "ok", isNew ? {label: t("Escribirle"), fn: () => detalle(r.id)} : undefined);
    }});
  /* teclado numérico para el teléfono */
  const tel = m.body.querySelector("[name=telefono]"); if(tel) tel.setAttribute("inputmode", "tel");
  return m;
}

/* ---------- ficha del prospecto ---------- */
function detalle(id){
  let l = S.get("leads", id); if(!l) return;
  const sh = sheet({title: l.nombre, body: `<div class="ld-det"></div>`, cls: "ld-sheet"});
  const box = sh.body.querySelector(".ld-det");
  const seguir = (tipo, nota, msg) => {
    const segs = [...(l.seguimientos || []), Object.assign({fecha: today(), tipo, nota: nota || ""}, msg ? {msg} : {})];
    const etapa = l.etapa === "nuevo" ? "contactado" : l.etapa;
    l = S.put("leads", {id: l.id, seguimientos: segs, etapa});
    paint();
  };
  function paint(){
    l = S.get("leads", id); if(!l){ sh.close(); return; }
    const hoy = today(), p = pendiente(l), c = claseDe(l), d = S.get("disciplinas", l.disciplinaId), s = S.get("sedes", l.sedeId);
    const segs = [...(l.seguimientos || [])].reverse();
    const dd = l.prueba ? daysBetween(hoy, l.prueba) : null;
    const tipoTxt = {whatsapp: t("WhatsApp"), llamada: t("Llamada"), visita: t("Visita")};
    const wa = k => `<a class="btn ${p && p.k === k ? "primary" : "ghost"} small" target="_blank" rel="noopener" data-wa="${k}" href="${esc(waUrl(l.telefono, mensaje(k, l)))}">${icon("whatsapp")}<span>${esc(tplNombre(k))}</span></a>`;
    const opciones = l.prueba ? ["bienvenida", "recordatorio", "dia1", "dia3"] : ["contacto", "dia3"];
    box.innerHTML = `
      <div class="ld-det-h"><div class="ld-tags">
        <span class="tag">${esc(fuenteTxt(l.fuente))}</span>${d ? `<span class="tag"><span class="dot" style="background:${esc(d.color || "#888")}"></span>${esc(t(d.nombre))}</span>` : ""}${s && S.sedes().length > 1 ? `<span class="tag">${icon("map")}${esc(s.nombre)}</span>` : ""}${l.edad ? `<span class="tag">${tn(l.edad, "1 año", "{n} años")}</span>` : ""}
      </div>
      <p class="muted small">${l.telefono ? `<a href="tel:${esc(l.telefono)}">${icon("phone", "inline")} ${esc(l.telefono)}</a> · ` : ""}${t("Llegó el {fecha}", {fecha: esc(fmtDate(fechaLead(l)))})}${l.email ? ` · ${esc(l.email)}` : ""}</p>
      ${l.nota ? `<p class="ld-nota">${esc(l.nota)}</p>` : ""}</div>
      <div class="seg ld-seg" role="radiogroup" aria-label="${t("Etapa")}">${ETAPAS.map(([k]) => `<label><input type="radio" name="ldEt" value="${k}" ${k === l.etapa ? "checked" : ""}><span>${esc(etapaTxt(k))}</span></label>`).join("")}</div>
      ${p ? `<div class="ld-next ${p.tarde ? "late" : ""}">${icon(p.tarde ? "alert" : "clock")}<div><b>${t("Toca: {paso}", {paso: esc(tplNombre(p.k))})}</b><span class="muted small">${p.tarde ? t("Atrasado desde el {fecha}", {fecha: esc(fmtDate(p.fecha))}) : t("Para hoy")}</span></div></div>` : ""}
      <section class="ld-blk"><h4>${icon("calendar")} ${t("Clase de prueba")}</h4>
        ${l.prueba ? `<p><b>${esc(cap(fechaLarga(l.prueba)))}</b>${c ? ` · ${esc(claseTxt(c))}` : ""} <span class="muted small">(${esc(dd === 0 ? t("hoy") : dd === 1 ? t("mañana") : dd > 0 ? t("en {n} días", {n: dd}) : t("hace {n} días", {n: -dd}))})</span></p>
          <div class="row gap wrap">${dd <= 0 ? `<label class="check"><input type="checkbox" data-asistio ${l.asistioPrueba ? "checked" : ""}><span>${t("Asistió a la prueba")}</span></label>` : ""}<button type="button" class="btn-link" data-agendar>${t("Cambiar fecha")}</button></div>`
        : `<button type="button" class="btn ghost small" data-agendar>${icon("plus")} ${t("Agendar clase de prueba")}</button>`}
      </section>
      <section class="ld-blk"><h4>${icon("whatsapp")} ${t("Escribirle")}</h4><div class="ld-wa">${opciones.map(wa).join("")}</div>
        <div class="row gap wrap ld-log"><button type="button" class="btn-link" data-log="llamada">${icon("phone", "inline")} ${t("Registrar llamada")}</button><button type="button" class="btn-link" data-log="visita">${icon("map", "inline")} ${t("Registrar visita")}</button></div></section>
      ${l.etapa === "inscrito" && l.alumnoId && S.get("alumnos", l.alumnoId) ? `<a class="btn ok block" href="#/alumno/${l.alumnoId}" data-ir>${icon("users")} ${t("Ver alumno")}</a>`
        : l.etapa !== "inscrito" ? `<div class="ld-conv"><button type="button" class="btn primary" data-convertir>${icon("userPlus")} ${t("Convertir a alumno")}</button>${l.etapa !== "perdido" ? `<button type="button" class="btn ghost" data-perdido>${t("Marcar como perdido")}</button>` : ""}</div>` : ""}
      ${segs.length ? `<section class="ld-blk"><h4>${icon("list")} ${t("Historial")}</h4><ol class="ld-tl">${segs.map(x => `<li><span class="ld-tl-d">${esc(fmtDate(x.fecha))}</span><b>${esc(tipoTxt[x.tipo] || x.tipo)}${x.msg ? ` · ${esc(tplNombre(x.msg))}` : ""}</b>${x.nota ? `<span class="muted small">${esc(x.nota)}</span>` : ""}</li>`).join("")}</ol></section>` : ""}
      <div class="ld-det-f"><button type="button" class="btn ghost small" data-editar>${icon("edit")} ${t("Editar")}</button><button type="button" class="btn danger ghost small" data-borrar>${icon("trash")} ${t("Eliminar")}</button></div>`;
  }
  box.addEventListener("click", async e => {
    const tg = e.target;
    const w = tg.closest("[data-wa]"); if(w){ if(!l.telefono){ e.preventDefault(); toast(t("Este prospecto no tiene teléfono"), "warn"); return; } setTimeout(() => seguir("whatsapp", "", w.dataset.wa), 50); return; }
    const lg = tg.closest("[data-log]"); if(lg){
      const tipo = lg.dataset.log;
      formModal({title: tipo === "llamada" ? t("Registrar llamada") : t("Registrar visita"), fields: [{k: "nota", label: t("¿Qué pasó?"), type: "textarea", rows: 2}], save: t("Guardar"), onSave: f => seguir(tipo, f.nota)});
      return;
    }
    if(tg.closest("[data-agendar]")) return agendar(l, paint);
    if(tg.closest("[data-convertir]")) return convertir(l, sh);
    if(tg.closest("[data-perdido]")){
      formModal({title: t("Marcar como perdido"), fields: [{k: "motivo", label: t("Motivo"), type: "select", opts: MOTIVOS.map(x => [x, t(x)])}], save: t("Guardar"),
        onSave: f => { S.put("leads", {id: l.id, etapa: "perdido", motivoPerdido: f.motivo}); paint(); }});
      return;
    }
    if(tg.closest("[data-editar]")){ leadForm(l); return; }
    if(tg.closest("[data-borrar]")){
      if(!await confirmDlg(t("Se borra el prospecto {nombre} y su historial.", {nombre: l.nombre}), {title: t("¿Eliminar prospecto?")})) return;
      const copia = Object.assign({}, l);
      S.del("leads", l.id); sh.close();
      toast(t("Prospecto eliminado"), "ok", {label: t("Deshacer"), fn: () => S.put("leads", copia)});
      return;
    }
    if(tg.closest("[data-ir]")) sh.close();
  });
  box.addEventListener("change", e => {
    if(e.target.name === "ldEt"){ const et = e.target.value; if(et === "inscrito" && !l.alumnoId){ paint(); convertir(l, sh); return; } S.put("leads", {id: l.id, etapa: et}); paint(); }
    if(e.target.matches("[data-asistio]")) { S.put("leads", {id: l.id, asistioPrueba: e.target.checked}); paint(); }
  });
  /* al editar desde el formulario, la ficha se repinta */
  const off = S.subscribe(() => { if(box.isConnected) paint(); else off(); });
  paint();
}

/* ---------- agendar prueba ---------- */
function clasesDelDia(fecha, l){
  const d = parseISO(fecha); if(!d) return [];
  return S.clases().filter(c => c.dia === d.getDay() && (!l.sedeId || !c.sedeId || c.sedeId === l.sedeId) && (!l.disciplinaId || c.disciplinaId === l.disciplinaId));
}
function proximaFecha(l){
  const hoy = today();
  for(let i = 1; i <= 7; i++){ const f = addDays(hoy, i); if(clasesDelDia(f, l).length) return f; }
  return addDays(hoy, 1);
}
function agendar(l, done){
  const fecha = l.prueba && l.prueba >= today() ? l.prueba : proximaFecha(l);
  const opts = f => [["", t("Sin clase específica")], ...clasesDelDia(f, l).map(c => [c.id, claseTxt(c)])];
  const m = formModal({title: t("Clase de prueba"), save: t("Agendar"),
    fields: [{k: "prueba", label: t("Fecha"), type: "date", req: true, min: today()}, {k: "claseId", label: t("Clase"), type: "select", opts: opts(fecha), hint: S.clases().length ? "" : t("Crea tu horario en Horario para elegir la clase.")}],
    values: {prueba: fecha, claseId: l.claseId || clasesDelDia(fecha, l)[0]?.id || ""},
    onSave: f => {
      const cambia = f.prueba !== l.prueba;
      const r = S.put("leads", {id: l.id, prueba: f.prueba, claseId: f.claseId || "", ...(cambia ? {segIni: (l.seguimientos || []).length} : {}), etapa: ["inscrito", "perdido"].includes(l.etapa) ? l.etapa : "prueba", asistioPrueba: false});
      done && done();
      toast(t("Prueba agendada"), "ok", r.telefono ? {label: t("Enviar confirmación"), fn: () => {
        window.open(waUrl(r.telefono, mensaje("bienvenida", r)), "_blank", "noopener");
        S.put("leads", {id: r.id, seguimientos: [...(r.seguimientos || []), {fecha: today(), tipo: "whatsapp", nota: "", msg: "bienvenida"}]});
      }} : undefined);
    }});
  const di = m.body.querySelector("[name=prueba]"), sel = m.body.querySelector("[name=claseId]");
  di.onchange = () => { sel.innerHTML = opts(di.value).map(([v, n]) => `<option value="${esc(v)}">${esc(n)}</option>`).join(""); if(sel.options[1]) sel.value = sel.options[1].value; };
}

/* ---------- convertir en alumno (studentForm de forms.js) ---------- */
async function convertir(l, sh){
  let F;
  try{ F = await import("../forms.js"); }catch(e){ toast(t("Esta sección no está disponible"), "warn"); return; }
  const discs = l.disciplinaId ? [l.disciplinaId] : [];
  const m = F.studentForm(null, {prefill: {nombre: l.nombre, telefono: l.telefono, email: l.email, sedeId: l.sedeId, discs, disciplinaIds: discs}, sedeId: l.sedeId || undefined,
    onSaved: al => {
      S.put("leads", {id: l.id, etapa: "inscrito", alumnoId: al.id, inscrito: today()});
      toast(t("¡{nombre} ahora es alumno!", {nombre: nom1(al.nombre)}), "ok", {label: t("Ver alumno"), fn: () => { location.hash = "#/alumno/" + al.id; }});
    }});
  /* si el formulario no trae prefill todavía, se llenan los campos a mano */
  const b = m && (m.body || m.el);
  if(!b) return;
  const set = (n, v) => { const i = b.querySelector(`[name="${n}"]`); if(i && !i.value && v) i.value = v; };
  set("nombre", l.nombre); set("telefono", l.telefono); set("email", l.email);
  setTimeout(() => { for(const id of discs){ const c = b.querySelector(`input[type=checkbox][value="${CSS.escape(id)}"]`); if(c && !c.checked) c.click(); } }, 80);
}

/* ---------- pegar mensaje de la página de inscripción ---------- */
function pegar(){
  const m = formModal({title: t("Pegar desde WhatsApp"), save: t("Continuar"),
    fields: [`<p class="muted small">${t("Copia el mensaje que llegó desde tu link de inscripción y pégalo aquí. La app llena los datos del prospecto.")}</p>`,
      {k: "txt", label: t("Mensaje"), type: "textarea", rows: 8, ph: "#inscripcion AcademiaPro\nNombre: …\nTeléfono: …"}],
    onSave: f => {
      const o = parseInscripcion(f.txt);
      if(!o){ toast(t("No encontramos nombre ni teléfono en el mensaje"), "warn"); return false; }
      setTimeout(() => leadForm(null, leadDeInscripcion(o)), 220);
    }});
  /* pegar del portapapeles con un toque, si el navegador deja */
  if(navigator.clipboard?.readText){
    const ta = m.body.querySelector("[name=txt]");
    const b = h(`<button type="button" class="btn ghost small ld-pastebtn">${icon("copy")} ${t("Pegar")}</button>`);
    b.onclick = async () => { try{ ta.value = await navigator.clipboard.readText(); ta.dispatchEvent(new Event("input", {bubbles: true})); }catch(e){ toast(t("Mantén presionado el cuadro y elige Pegar"), "warn"); } };
    ta.parentElement.appendChild(b);
  }
}

/* ---------- link de inscripción + afiche con QR ---------- */
async function linkSheet(){
  const acad = S.academy();
  const sh = sheet({title: t("Link de inscripción"), body: `<div class="ld-link"></div>`});
  const box = sh.body.querySelector(".ld-link");
  let qr = null;
  try{ qr = (await import("../qr.js")).qrSvg; }catch(e){}
  function paint(){
    const a = S.academy(), w = a.whatsapp || a.telefono || "", url = linkInscripcion(a);
    box.innerHTML = `<p class="muted">${t("Comparte este link en Instagram, Facebook o en un afiche. Quien lo llene te escribe por WhatsApp con sus datos y tú los pegas aquí.")}</p>
      ${field({k: "ldWa", label: t("WhatsApp de la academia"), type: "tel", req: true, ph: "300 123 4567", hint: w ? "" : t("Escribe el número donde quieres recibir las inscripciones.")}, w)}
      ${w ? `<div class="ld-url"><input readonly value="${esc(url)}" aria-label="${t("Link de inscripción")}"><button type="button" class="btn primary small" data-copy>${icon("copy")} ${t("Copiar")}</button></div>
      <div class="row gap wrap"><button type="button" class="btn ghost small" data-share>${icon("share")} ${t("Compartir")}</button><a class="btn ghost small" href="${esc(url)}" target="_blank" rel="noopener">${icon("link")} ${t("Abrir")}</a>${qr ? `<button type="button" class="btn ghost small" data-poster>${icon("print")} ${t("Imprimir afiche con QR")}</button>` : ""}</div>
      ${qr ? `<div class="ld-qr">${qr(url, {size: 180, margin: 2})}</div>` : ""}` : ""}`;
    const wi = box.querySelector("[name=ldWa]");
    wi.setAttribute("inputmode", "tel");
    wi.onchange = () => { S.put("academias", {id: a.id, whatsapp: wi.value.trim()}); paint(); };
  }
  box.addEventListener("click", async e => {
    const url = linkInscripcion(S.academy());
    if(e.target.closest("[data-copy]")){ try{ await navigator.clipboard.writeText(url); toast(t("Link copiado")); }catch(err){ box.querySelector(".ld-url input").select(); toast(t("Selecciona el link y cópialo"), "warn"); } }
    if(e.target.closest("[data-share]")){
      const UI = await import("../ui.js");
      UI.shareOrDownload({title: t("Inscríbete en {academia}", {academia: S.academy().nombre}), text: t("Inscríbete en {academia} y agenda tu clase de prueba:", {academia: S.academy().nombre}), url});
    }
    if(e.target.closest("[data-poster]")) poster(url, qr);
  });
  paint();
}
function poster(url, qr){
  const a = S.academy();
  const box = document.createElement("div");
  box.className = "ld-poster";
  box.innerHTML = `<h1>${esc(a.nombre)}</h1><p class="ld-p-big">${t("¡Tu primera clase es gratis!")}</p>
    <p>${esc(S.disciplinas().map(d => t(d.nombre)).join(" · "))}</p>
    <div class="ld-p-qr">${qr(url, {size: 360, margin: 2})}</div>
    <p class="ld-p-big">${t("Escanea y escríbenos por WhatsApp")}</p><small>${esc(url.length > 70 ? url.slice(0, 67) + "…" : url)}</small>`;
  document.body.appendChild(box); document.body.classList.add("print-poster");
  const fin = () => { box.remove(); document.body.classList.remove("print-poster"); window.removeEventListener("afterprint", fin); };
  window.addEventListener("afterprint", fin);
  setTimeout(() => { window.print(); setTimeout(fin, 1500); }, 60);
}

/* ---------- editor de plantillas ---------- */
function plantillasSheet(){
  const sh = sheet({title: t("Mensajes para prospectos"), body: `<form class="form ld-tpls">
    <p class="muted small">${t("Variables: {nombre}, {academia}, {clase} y {fecha} (de la clase de prueba).")}</p>
    ${PLANTILLAS.map(([k, n]) => `<label class="field"><span class="lbl">${esc(t(n))}</span><textarea class="tpl" rows="3" name="${k}">${esc(tplDe(k))}</textarea></label>`).join("")}
    <div class="row gap"><button type="button" class="btn ghost" data-reset>${t("Restaurar textos")}</button><button type="submit" class="btn primary">${t("Guardar")}</button></div></form>`});
  const f = sh.body.querySelector("form");
  f.onsubmit = e => {
    e.preventDefault();
    for(const [k, , def] of PLANTILLAS){ const v = f.elements[k].value.trim(); S.setPref("msg_lead_" + k, v && v !== t(def) ? v : null); }
    toast(t("Mensajes guardados")); sh.close();
  };
  f.querySelector("[data-reset]").onclick = () => { for(const [k, , def] of PLANTILLAS) f.elements[k].value = t(def); };
}
