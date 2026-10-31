import * as S from "../store.js";
import {icon, avatar, belt, empty, toast} from "../ui.js";
import {esc, today, fmtDate, addDays, norm} from "../util.js";
import {t, tn, locale} from "../i18n.js";
import {estadoPago} from "../cobros.js";

/* fecha "" = hoy, resuelta al pintar (la app puede quedar abierta pasada la medianoche). dia/pint = el día y la hora del último pintado */
const st = {fecha: "", sede: "", disc: "", q: "", dia: "", pint: 0};

export function render(el){
  const ss = S.sedes();
  st.sede = S.curSede() || (ss.find(s => s.id === st.sede) ? st.sede : ss[0]?.id || "");
  const discs = S.discsOfSede(st.sede);
  if(!discs.find(d => d.id === st.disc)){ const p = S.pref("asisDisc", ""); st.disc = discs.find(d => d.id === p) ? p : discs[0]?.id || ""; }
  if(!st.sede || !st.disc){ el.innerHTML = empty("calendar", t("Falta configurar"), t("Necesitas al menos una sede con una disciplina."), `<a class="btn primary" href="#/academia">${t("Ir a Academia")}</a>`); return; }
  /* pasó la medianoche con la vista abierta y una clase a medio pasar: se queda en ese día (sale «Volver a hoy») */
  if(!st.fecha && st.dia && st.dia !== today() && Date.now() - st.pint < 3 * 36e5 && S.asistenciaDe(st.dia, st.sede, st.disc)?.presentes?.length) st.fecha = st.dia;
  const fecha = st.fecha || today();
  st.dia = fecha; st.pint = Date.now();
  const acad = S.academy();
  const d = S.get("disciplinas", st.disc);
  const clase = {fecha, sedeId: st.sede, disciplinaId: st.disc};
  const rec = S.asistenciaDe(fecha, st.sede, st.disc);
  const pres = new Set(rec?.presentes || []);
  const q = norm(st.q);
  const lista = S.pref("asisLista", false);
  const als = S.alumnos({sede: st.sede}).filter(a => a.estado === "activo" && (a.disciplinaIds || []).includes(st.disc) && (!q || norm(a.nombre).includes(q)))
    .sort((x, y) => x.nombre.localeCompare(y.nombre, locale()));
  const nPres = als.filter(a => pres.has(a.id)).length;
  /* últimas clases registradas */
  const hist = S.all("asistencias").filter(a => a.sedeId === st.sede && a.disciplinaId === st.disc).sort((x, y) => y.fecha.localeCompare(x.fecha)).slice(0, 8);
  const card = a => {
    const g = S.rangoActual(a.id, d.id), on = pres.has(a.id);
    const debe = estadoPago(a, acad.avisoDias ?? 5).k === "vencido";
    return `<button class="att ${on ? "on" : ""}" data-a="${a.id}" aria-pressed="${on}">
      ${avatar(a, lista ? 36 : 52)}<b>${esc(a.nombre)}</b>${g ? belt(d, g.rank, g.grado, {w: 64, h: 12}) : ""}
      ${debe ? `<span class="att-debe" title="${t("Pago vencido")}" aria-label="${t("Pago vencido")}">$</span>` : ""}<span class="att-check">${icon("check")}</span></button>`;
  };

  el.innerHTML = `
  <section class="card">
    <div class="att-bar">
      <div class="month-nav"><button class="icon-btn" data-day="-1" aria-label="${t("Día anterior")}">${icon("back")}</button><input type="date" id="aFecha" value="${fecha}" aria-label="${t("Fecha")}"><button class="icon-btn" data-day="1" aria-label="${t("Día siguiente")}">${icon("chevron")}</button></div>
      ${!S.curSede() && ss.length > 1 ? `<select id="aSede" aria-label="${t("Sede")}">${ss.map(s => `<option value="${s.id}" ${s.id === st.sede ? "selected" : ""}>${esc(s.nombre)}</option>`).join("")}</select>` : ""}
      <select id="aDisc" aria-label="${t("Disciplina")}">${discs.map(x => `<option value="${x.id}" ${x.id === st.disc ? "selected" : ""}>${esc(t(x.nombre))}</option>`).join("")}</select>
      <div class="att-count" aria-live="polite"><b>${pres.size}</b><span>${tn(pres.size, "presente", "presentes")}</span></div>
    </div>
    ${fecha !== today() ? `<p class="att-otro small">${icon("calendar")} ${t("Registrando el {fecha}", {fecha: fmtDate(fecha, true)})} · <button class="btn-link" data-hoy>${t("Volver a hoy")}</button></p>` : ""}
    <div class="toolbar att-tools"><label class="search">${icon("search")}<input id="aq" type="search" placeholder="${t("Buscar")}" value="${esc(st.q)}" aria-label="${t("Buscar")}"></label>
      ${als.length && nPres < als.length ? `<button class="btn ghost small" data-all>${icon("check")}<span>${t("Marcar todos")}</span></button>` : ""}
      ${nPres ? `<button class="btn ghost small" data-none>${icon("x")}<span>${t("Desmarcar todos")}</span></button>` : ""}
      <button class="icon-btn" data-lista aria-pressed="${lista}" aria-label="${lista ? t("Ver como cuadrícula") : t("Ver como lista")}" title="${lista ? t("Ver como cuadrícula") : t("Ver como lista")}">${icon(lista ? "grid" : "list")}</button></div>
    ${als.length ? `<div class="att-grid ${lista ? "att-list" : ""}">${als.map(card).join("")}</div>`
    : empty("users", t("Sin alumnos"), t("No hay alumnos activos de esta disciplina en la sede."))}
  </section>
  ${hist.length ? `<section class="card"><header class="card-h"><h3>${icon("calendar")} ${t("Últimas clases")}</h3></header><div class="list">${hist.map(h => `<button class="li ${h.fecha === fecha ? "on" : ""}" data-go="${h.fecha}">${icon("calendar")}<div class="li-main"><b>${fmtDate(h.fecha, true)}</b></div><span class="tag">${tn((h.presentes || []).length, "{n} presente", "{n} presentes")}</span></button>`).join("")}</div></section>` : ""}`;

  /* lo que se guarde sigue en el día que se ve, aunque sea ya mañana */
  const fijarDia = () => { if(!st.fecha && clase.fecha !== today()) st.fecha = clase.fecha; };
  /* varios a la vez, con deshacer: solo se revierten los que cambió este botón (no lo marcado después) */
  const masivo = (ids, on) => {
    const antes = new Set(S.asistenciaDe(clase.fecha, clase.sedeId, clase.disciplinaId)?.presentes || []);
    const cambiados = ids.filter(id => on ? !antes.has(id) : antes.has(id));
    fijarDia();
    S.marcarAsistencia(clase, ids, on);
    toast(on ? tn(ids.length, "{n} marcado", "{n} marcados") : tn(ids.length, "{n} desmarcado", "{n} desmarcados"), "ok", {label: t("Deshacer"), fn: () => S.marcarAsistencia(clase, cambiados, !on)});
  };
  el.onclick = e => {
    const tg = e.target;
    const b = tg.closest("[data-a]");
    if(b){
      const id = b.dataset.a, on = !b.classList.contains("on");
      b.classList.toggle("on", on); b.setAttribute("aria-pressed", on);
      fijarDia();
      const n = S.marcarAsistencia(clase, id, on).presentes.length;
      const c = el.querySelector(".att-count"); if(c) c.innerHTML = `<b>${n}</b><span>${tn(n, "presente", "presentes")}</span>`;
      navigator.vibrate?.(10);
      return;
    }
    const dd = tg.closest("[data-day]"); if(dd){ setFecha(addDays(fecha, +dd.dataset.day)); render(el); return; }
    const go = tg.closest("[data-go]"); if(go){ setFecha(go.dataset.go); window.scrollTo(0, 0); render(el); return; }
    if(tg.closest("[data-hoy]")){ setFecha(""); render(el); return; }
    if(tg.closest("[data-all]")) return masivo(als.filter(a => !pres.has(a.id)).map(a => a.id), true);
    if(tg.closest("[data-none]")) return masivo(als.filter(a => pres.has(a.id)).map(a => a.id), false);
    if(tg.closest("[data-lista]")){ S.setPref("asisLista", !lista); render(el); }
  };
  el.querySelector("#aFecha").onchange = e => { setFecha(e.target.value); render(el); };
  el.querySelector("#aDisc").onchange = e => { st.disc = e.target.value; st.dia = ""; S.setPref("asisDisc", st.disc); render(el); };
  const sedeSel = el.querySelector("#aSede"); if(sedeSel) sedeSel.onchange = e => { st.sede = e.target.value; st.dia = ""; render(el); };
  const aq = el.querySelector("#aq"); aq.oninput = e => { st.q = e.target.value; st.f = true; render(el); };
  if(st.f){ st.f = false; aq.focus(); aq.setSelectionRange(st.q.length, st.q.length); }
}
/* hoy se guarda como "" para que siga siendo "hoy" mañana */
const setFecha = v => { st.fecha = !v || v === today() ? "" : v; st.dia = ""; };
