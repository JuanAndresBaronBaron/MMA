import * as S from "../store.js";
import {icon, avatar, belt, empty, pill} from "../ui.js";
import {esc, norm, age, csv, download, today, fmtDate} from "../util.js";
import {studentForm, quickPay} from "../forms.js";
import {STATUS, planById} from "../catalog.js";
import {t, tn, locale} from "../i18n.js";

/* filtros que se recuerdan mientras la app está abierta */
const st = {q: "", disc: "", estado: "activo", pago: "", vista: S.pref("vistaAlumnos", "grid"), orden: "nombre"};

export function render(el){
  const acad = S.academy();
  const discs = S.discsOfSede(S.curSede());
  const all = S.alumnos({todos: true});
  const q = norm(st.q);
  let list = all.filter(a =>
    (!q || norm(a.nombre).includes(q) || norm(a.documento).includes(q) || norm(a.telefono).includes(q)) &&
    (!st.disc || (a.disciplinaIds || []).includes(st.disc)) &&
    (!st.estado || a.estado === st.estado));
  const withPay = list.map(a => ({a, e: S.estadoPago(a, acad.avisoDias ?? 5)}));
  const filtered = withPay.filter(x => !st.pago || x.e.k === st.pago || (st.pago === "pend" && (x.e.k === "vencido" || x.e.k === "pronto")));
  const ord = {
    nombre: (x, y) => x.a.nombre.localeCompare(y.a.nombre, locale()),
    ingreso: (x, y) => (y.a.fechaInicio || "").localeCompare(x.a.fechaInicio || ""),
    pago: (x, y) => (x.e.dias ?? 999) - (y.e.dias ?? 999),
  }[st.orden];
  filtered.sort(ord);
  const counts = {activo: 0, congelado: 0, inactivo: 0};
  for(const a of all) counts[a.estado] = (counts[a.estado] || 0) + 1;

  const belts = a => (a.disciplinaIds || []).map(id => {
    const d = S.get("disciplinas", id); if(!d) return "";
    const g = S.rangoActual(a.id, id);
    return `<span class="mini-belt" title="${esc(t(d.nombre))}: ${esc(g ? t(S.rankDef(d, g.rank).n) : t("sin grado"))}"><span class="dot" style="background:${d.color}"></span>${g ? belt(d, g.rank, g.grado, {w: 56, h: 11}) : `<span class="muted small">—</span>`}</span>`;
  }).join("");
  const sede = id => t(S.get("sedes", id)?.nombre || "");
  const card = ({a, e}) => `<a class="st-card" href="#/alumno/${a.id}">
      ${avatar(a, 72)}
      <b class="st-name">${esc(a.nombre)}</b>
      <span class="muted small">${[a.nacimiento ? tn(age(a.nacimiento), "1 año", "{n} años") : "", S.sedes().length > 1 ? esc(sede(a.sedeId)) : ""].filter(Boolean).join(" · ") || "&nbsp;"}</span>
      <div class="st-belts">${belts(a)}</div>
      <div class="st-foot">${pill(e.k, e.txt)}${a.sangre ? `<span class="blood">${icon("drop")}${esc(a.sangre)}</span>` : ""}</div>
      ${["vencido", "pronto"].includes(e.k) ? `<span class="icon-btn ok st-pay" data-pay="${a.id}" title="${t("Marcar pagado")}">${icon("check")}</span>` : ""}
    </a>`;
  const rowH = ({a, e}) => `<a class="li" href="#/alumno/${a.id}">${avatar(a, 40)}
      <div class="li-main"><b>${esc(a.nombre)}</b><span class="muted small">${esc(sede(a.sedeId))}${a.telefono ? " · " + esc(a.telefono) : ""}</span></div>
      <div class="li-belts hide-s">${belts(a)}</div>
      <span class="hide-s">${a.sangre ? `<span class="blood">${icon("drop")}${esc(a.sangre)}</span>` : ""}</span>
      ${pill(e.k, e.txt)}
      ${["vencido", "pronto"].includes(e.k) ? `<span class="icon-btn ok" data-pay="${a.id}" title="${t("Marcar pagado")}">${icon("check")}</span>` : `<span class="icon-btn ghost-sp"></span>`}
    </a>`;

  el.innerHTML = `
  <div class="toolbar">
    <label class="search">${icon("search")}<input id="q" type="search" placeholder="${t("Buscar por nombre, documento o teléfono")}" value="${esc(st.q)}"></label>
    <button class="btn primary" data-new>${icon("plus")}<span class="hide-s">${t("Nuevo alumno")}</span></button>
  </div>
  <div class="filters">
    <div class="seg small">${Object.entries(STATUS).map(([k, n]) => `<label><input type="radio" name="estado" value="${k}" ${st.estado === k ? "checked" : ""}><span>${t(n)} <i>${counts[k] || 0}</i></span></label>`).join("")}<label><input type="radio" name="estado" value="" ${!st.estado ? "checked" : ""}><span>${t("Todos")} <i>${all.length}</i></span></label></div>
    <select id="fDisc"><option value="">${t("Todas las disciplinas")}</option>${discs.map(d => `<option value="${d.id}" ${st.disc === d.id ? "selected" : ""}>${esc(t(d.nombre))}</option>`).join("")}</select>
    <select id="fPago"><option value="">${t("Cualquier pago")}</option><option value="pend" ${st.pago === "pend" ? "selected" : ""}>${t("Pendientes")}</option><option value="vencido" ${st.pago === "vencido" ? "selected" : ""}>${t("Vencidos")}</option><option value="aldia" ${st.pago === "aldia" ? "selected" : ""}>${t("Al día")}</option><option value="beca" ${st.pago === "beca" ? "selected" : ""}>${t("Becados")}</option></select>
    <select id="fOrden"><option value="nombre">${t("Orden: nombre")}</option><option value="pago" ${st.orden === "pago" ? "selected" : ""}>${t("Orden: vencimiento")}</option><option value="ingreso" ${st.orden === "ingreso" ? "selected" : ""}>${t("Orden: más recientes")}</option></select>
    <div class="seg small icons"><label title="${t("Tarjetas")}"><input type="radio" name="vista" value="grid" ${st.vista === "grid" ? "checked" : ""}><span>${icon("grid")}</span></label><label title="${t("Lista")}"><input type="radio" name="vista" value="list" ${st.vista === "list" ? "checked" : ""}><span>${icon("list")}</span></label></div>
    <button class="btn ghost small" data-csv title="${t("Exportar a Excel (CSV)")}">${icon("download")}<span class="hide-s">CSV</span></button>
  </div>
  <p class="muted small count">${tn(filtered.length, "1 alumno", "{n} alumnos")}</p>
  ${filtered.length ? (st.vista === "grid" ? `<div class="st-grid">${filtered.map(card).join("")}</div>` : `<div class="card flush"><div class="list">${filtered.map(rowH).join("")}</div></div>`)
    : all.length ? empty("search", t("Sin resultados"), t("Prueba con otro nombre o quita filtros.")) : empty("users", t("Aún no hay alumnos"), t("Agrega el primero con el botón «Nuevo alumno»."), `<button class="btn primary" data-new>${icon("plus")} ${t("Nuevo alumno")}</button>`)}
  <button class="fab only-m" data-new aria-label="${t("Nuevo alumno")}">${icon("plus")}</button>`;

  el.querySelector("#q").oninput = e => { st.q = e.target.value; st.f = true; render(el); };
  el.querySelector("#fDisc").onchange = e => { st.disc = e.target.value; render(el); };
  el.querySelector("#fPago").onchange = e => { st.pago = e.target.value; render(el); };
  el.querySelector("#fOrden").onchange = e => { st.orden = e.target.value; render(el); };
  el.onchange = e => {
    if(e.target.name === "estado"){ st.estado = e.target.value; render(el); }
    if(e.target.name === "vista"){ st.vista = e.target.value; S.setPref("vistaAlumnos", st.vista); render(el); }
  };
  el.onclick = e => {
    if(e.target.closest("[data-new]")) return studentForm(null, {onSaved: a => { location.hash = "#/alumno/" + a.id; }});
    const p = e.target.closest("[data-pay]"); if(p){ e.preventDefault(); quickPay(S.get("alumnos", p.dataset.pay)); return; }
    if(e.target.closest("[data-csv]")) exportCsv(filtered.map(x => x.a));
  };
  const qi = el.querySelector("#q");
  if(st.f){ st.f = false; qi.focus(); qi.setSelectionRange(st.q.length, st.q.length); }
}

function exportCsv(list){
  const ds = S.disciplinas();
  const rows = [[t("Nombre"), t("Documento"), t("Nacimiento"), t("Edad"), t("Teléfono"), t("Correo"), t("Sede"), t("Estado"), t("Tipo de sangre"), t("EPS"), t("Alergias"), t("Lesiones"), t("Emergencia"), t("Tel. emergencia"), t("Plan"), t("Valor"), t("Próximo pago"), t("Gi"), t("Bucal"), ...ds.map(d => t(d.nombre))]];
  for(const a of list){
    rows.push([a.nombre, a.documento, a.nacimiento, age(a.nacimiento) ?? "", a.telefono, a.email, t(S.get("sedes", a.sedeId)?.nombre || ""), t(STATUS[a.estado]), a.sangre, a.eps, a.alergias, a.lesiones, a.emergencia, a.emergenciaTel,
      t(planById(a.plan).nombre), S.valorPlan(a), S.vence(a), a.equipo?.gi?.tiene ? t("Sí") : t("No"), a.equipo?.bucal?.tiene ? t("Sí") : t("No"),
      ...ds.map(d => { const g = S.rangoActual(a.id, d.id); return g ? t(S.rankDef(d, g.rank).n) + (g.grado ? ` ${g.grado}°` : "") : ""; })]);
  }
  download(`alumnos-${today()}.csv`, csv(rows), "text/csv;charset=utf-8");
}
