import * as S from "../store.js";
import {icon, avatar, belt, emptyState, pill, modal, toast, haptic} from "../ui.js";
import {esc, norm, age, csv, download, today, h} from "../util.js";
import {studentForm, quickPay} from "../forms.js";
import {STATUS, planById} from "../catalog.js";
import {pillTxt, estadoPago, vence, ultimasAsistencias, diasSinVenir, estadoEf} from "../cobros.js";
import {t, tn, locale} from "../i18n.js";

/* filtros que se recuerdan mientras la app está abierta */
const st = {q: "", disc: "", estado: "activo", pago: "", aus: false, vista: null, orden: "nombre"};
const AUS = 14; /* días sin venir para el filtro de retención */

export function render(el, params, ctx, query){
  /* vista: la elegida, o lista en el celular y tarjetas en el computador */
  if(!st.vista) st.vista = S.pref("vistaAlumnos", null) || (matchMedia("(max-width:760px)").matches ? "list" : "grid");
  /* #/alumnos?new=1&volver=asistencia: abre el formulario una vez y quita la consulta del hash */
  const qy = query || ctx?.query;
  if(qy?.get?.("new")){
    const volver = qy.get("volver");
    try{ history.replaceState(null, "", "#/alumnos"); }catch(e){}
    setTimeout(() => studentForm(null, {onSaved: a => { location.hash = volver ? `#/${volver}${volver.includes("?") ? "&" : "?"}nuevo=${a.id}` : "#/alumno/" + a.id; }}), 0);
  }
  const acad = S.academy();
  const discs = S.discsOfSede(S.curSede());
  const all = S.alumnos({todos: true});
  const ult = ultimasAsistencias();
  const q = norm(st.q);
  let list = all.filter(a =>
    (!q || norm(a.nombre).includes(q) || norm(a.documento).includes(q) || norm(a.telefono).includes(q)) &&
    (!st.disc || (a.disciplinaIds || []).includes(st.disc)) &&
    (!st.estado || estadoEf(a) === st.estado));
  const withPay = list.map(a => ({a, e: estadoPago(a, acad.avisoDias ?? 5), sv: diasSinVenir(a, ult)}));
  const aus = x => estadoEf(x.a) === "activo" && x.sv >= AUS;
  const nAus = withPay.filter(aus).length;
  const filtered = withPay.filter(x => (!st.pago || x.e.k === st.pago || (st.pago === "pend" && (x.e.k === "vencido" || x.e.k === "pronto"))) && (!st.aus || aus(x)));
  const ord = {
    nombre: (x, y) => x.a.nombre.localeCompare(y.a.nombre, locale()),
    ingreso: (x, y) => (y.a.fechaInicio || "").localeCompare(x.a.fechaInicio || ""),
    pago: (x, y) => (x.e.dias ?? 999) - (y.e.dias ?? 999),
    asist: (x, y) => (y.sv ?? -1) - (x.sv ?? -1),
  }[st.orden] || ((x, y) => x.a.nombre.localeCompare(y.a.nombre, locale()));
  filtered.sort(ord);
  const counts = {activo: 0, congelado: 0, inactivo: 0};
  for(const a of all){ const k = estadoEf(a); counts[k] = (counts[k] || 0) + 1; }

  const belts = a => (a.disciplinaIds || []).map(id => {
    const d = S.get("disciplinas", id); if(!d) return "";
    const g = S.rangoActual(a.id, id);
    return `<span class="mini-belt" title="${esc(t(d.nombre))}: ${esc(g ? t(S.rankDef(d, g.rank).n) : t("sin grado"))}">${dtag(d)}${g ? belt(d, g.rank, g.grado, {w: 56, h: 11}) : `<span class="muted small">${t("sin grado")}</span>`}</span>`;
  }).join("");
  const sede = id => t(S.get("sedes", id)?.nombre || "");
  const tags = a => (a.disciplinaIds || []).map(id => S.get("disciplinas", id)).filter(Boolean).map(dtag).join("");
  const blood = a => a.sangre ? `<span class="blood">${icon("drop")}${esc(a.sangre)}</span>` : "";
  const svTxt = x => estadoEf(x.a) !== "activo" ? "" : !ult.has(x.a.id) ? t("Sin asistencias") : x.sv === 0 ? t("Vino hoy") : tn(x.sv, "Última clase hace 1 día", "Última clase hace {n} días");
  const payBtn = ({a, e}, cls = "") => ["vencido", "pronto"].includes(e.k) ? `<button type="button" class="icon-btn ok ${cls}" data-pay="${a.id}" title="${t("Marcar pagado")}" aria-label="${esc(t("Marcar pagado") + ": " + a.nombre)}">${icon("cash")}</button>` : "";
  /* tarjeta: el enlace es el nombre (estirado sobre toda la tarjeta); el botón de pago queda fuera del <a> */
  const card = x => { const {a, e} = x; return `<div class="st-card st-card2">
      ${avatar(a, 72)}
      <a class="st-name st-a" href="#/alumno/${a.id}">${esc(a.nombre)}</a>
      <span class="muted small st-line">${[a.nacimiento ? esc(tn(age(a.nacimiento), "1 año", "{n} años")) : "", blood(a), S.sedes().length > 1 ? esc(sede(a.sedeId)) : ""].filter(Boolean).join(" · ") || "&nbsp;"}</span>
      <div class="st-belts">${belts(a)}</div>
      <div class="st-foot2">${pill(e.k, pillTxt(a, e))}${svTxt(x) ? `<span class="muted small ${aus(x) ? "warn-t" : ""}">${esc(svTxt(x))}</span>` : ""}</div>
      ${payBtn(x, "st-pay")}
    </div>`; };
  const rowH = x => { const {a, e} = x; return `<div class="li st-row"><a class="li-link" href="#/alumno/${a.id}">${avatar(a, 40)}
      <div class="li-main"><span class="st-nm"><b>${esc(a.nombre)}</b></span>
        <span class="st-sub"><span title="${esc(pillTxt(a, e))}">${pill(e.k, e.txt)}</span><span class="st-tags">${tags(a)}</span><span class="muted small ${aus(x) ? "warn-t" : ""}">${[esc(svTxt(x)), S.sedes().length > 1 ? esc(sede(a.sedeId)) : ""].filter(Boolean).join(" · ")}</span></span></div></a>
      <div class="li-belts hide-s">${belts(a)}</div>
      <span class="hide-s st-blood">${blood(a)}</span>
      ${payBtn(x) || `<span class="icon-btn ghost-sp"></span>`}
    </div>`; };
  const discN = id => t(S.get("disciplinas", id)?.nombre || "");
  const pagoN = {pend: t("Pendientes"), vencido: t("Vencidos"), aldia: t("Al día"), beca: t("Becados")};
  const activos = [st.disc && {k: "disc", txt: discN(st.disc)}, st.pago && {k: "pago", txt: pagoN[st.pago]}, st.aus && {k: "aus", txt: t("Sin venir +14 días")}].filter(Boolean);
  const selDisc = (id = "fDisc") => `<select id="${id}" aria-label="${t("Disciplina")}"><option value="">${t("Todas las disciplinas")}</option>${discs.map(d => `<option value="${d.id}" ${st.disc === d.id ? "selected" : ""}>${esc(t(d.nombre))}</option>`).join("")}</select>`;
  const selPago = (id = "fPago") => `<select id="${id}" aria-label="${t("Pago")}"><option value="">${t("Cualquier pago")}</option>${Object.entries(pagoN).map(([k, n]) => `<option value="${k}" ${st.pago === k ? "selected" : ""}>${n}</option>`).join("")}</select>`;
  const selOrden = (id = "fOrden") => `<select id="${id}" aria-label="${t("Orden")}">${[["nombre", t("Orden: nombre")], ["pago", t("Orden: vencimiento")], ["ingreso", t("Orden: más recientes")], ["asist", t("Orden: más días sin venir")]].map(([k, n]) => `<option value="${k}" ${st.orden === k ? "selected" : ""}>${n}</option>`).join("")}</select>`;

  /* lista por nombre: secciones por inicial, como Contactos (con índice A-Z en el celular) */
  const inicial = a => { const c = norm(a.nombre).trim().charAt(0).toUpperCase(); return /[A-Z]/.test(c) ? c : "#"; };
  const porLetra = st.vista === "list" && st.orden === "nombre" && filtered.length > 6;
  let listHtml = "", letras = [];
  if(st.vista === "grid") listHtml = `<div class="st-grid">${filtered.map(card).join("")}</div>`;
  else if(porLetra){
    const grupos = new Map();
    for(const x of filtered){ const k = inicial(x.a); if(!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(x); }
    letras = [...grupos.keys()];
    listHtml = `<div class="card flush st-list">${[...grupos].map(([k, xs]) => `<section class="st-sec" data-letter="${k}" aria-label="${esc(k)}"><h3 class="st-letter" aria-hidden="true">${k}</h3><div class="list">${xs.map(rowH).join("")}</div></section>`).join("")}</div>`;
  }
  else listHtml = `<div class="card flush st-list"><div class="list">${filtered.map(rowH).join("")}</div></div>`;

  el.innerHTML = `
  <div class="st-sticky" data-sticky>
    <div class="toolbar st-tools">
      <label class="search st-search">${icon("search")}<input id="q" type="search" placeholder="${t("Buscar por nombre, documento o teléfono")}" value="${esc(st.q)}" aria-label="${t("Buscar")}" autocomplete="off" enterkeyhint="search"></label>
      <button class="btn ghost st-bulk hide-s" data-bulk title="${t("Mensaje masivo por WhatsApp")}" aria-label="${t("Mensaje masivo por WhatsApp")}">${icon("whatsapp")}<span>${t("Mensaje masivo")}</span></button>
      <button class="btn primary hide-s" data-new>${icon("plus")}<span>${t("Nuevo alumno")}</span></button>
    </div>
  </div>
  <div class="filters st-filters">
    <div class="seg small st-status">${Object.entries(STATUS).map(([k, n]) => `<label><input type="radio" name="estado" value="${k}" ${st.estado === k ? "checked" : ""}><span>${t(n)} <i>${counts[k] || 0}</i></span></label>`).join("")}<label><input type="radio" name="estado" value="" ${!st.estado ? "checked" : ""}><span>${t("Todos")} <i>${all.length}</i></span></label></div>
    <span class="hide-s f-desk">${selDisc()}${selPago()}${selOrden()}
      <label class="chip ${st.aus ? "on" : ""}" style="--dc:var(--warn)"><input type="checkbox" id="fAus" ${st.aus ? "checked" : ""}><span>${t("Sin venir +14 días")} <i>${nAus}</i></span></label></span>
  </div>
  <div class="st-meta">
    <p class="count st-count" aria-live="polite">${tn(filtered.length, "1 alumno", "{n} alumnos")}</p>
    <div class="st-acts">
      <button class="icon-btn gray only-m f-btn ${activos.length ? "on" : ""}" data-filtros aria-haspopup="dialog" title="${t("Filtros")}" aria-label="${esc(t("Filtros") + (activos.length ? ` (${activos.length})` : ""))}">${icon("filter")}${activos.length ? `<i class="f-n" aria-hidden="true">${activos.length}</i>` : ""}</button>
      <button class="icon-btn gray only-m st-bulk-m" data-bulk title="${t("Mensaje masivo por WhatsApp")}" aria-label="${t("Mensaje masivo por WhatsApp")}">${icon("whatsapp")}</button>
      <div class="seg small icons st-view"><label title="${t("Tarjetas")}"><input type="radio" name="vista" value="grid" ${st.vista === "grid" ? "checked" : ""} aria-label="${t("Tarjetas")}"><span>${icon("grid")}</span></label><label title="${t("Lista")}"><input type="radio" name="vista" value="list" ${st.vista === "list" ? "checked" : ""} aria-label="${t("Lista")}"><span>${icon("list")}</span></label></div>
      <button class="btn ghost small st-csv" data-csv title="${t("Exportar a Excel (CSV)")}" aria-label="${t("Exportar a Excel (CSV)")}">${icon("download")}<span class="hide-s">CSV</span></button>
    </div>
  </div>
  ${activos.length ? `<div class="f-active">${activos.map(f => `<button type="button" class="f-chip" data-rmf="${f.k}" aria-label="${esc(t("Quitar filtro {f}", {f: f.txt}))}">${esc(f.txt)}${icon("x")}</button>`).join("")}</div>` : ""}
  ${filtered.length ? listHtml
    : all.length ? emptyState({icon: "search", title: t("Sin resultados"), text: t("Prueba con otro nombre o quita filtros."), cta: st.q || activos.length || st.estado !== "activo" ? {label: t("Quitar filtros"), kind: "tinted", attr: "data-clearall"} : "", cls: "st-empty"})
    : emptyState({icon: "users", title: t("Aún no hay alumnos"), text: t("Agrega el primero con el botón «Nuevo alumno»."), cta: {label: t("Nuevo alumno"), icon: "plus", attr: "data-new"}, cls: "st-empty"})}
  ${letras.length > 5 ? `<nav class="az only-m" aria-label="${t("Índice alfabético")}">${letras.map(k => `<button type="button" data-az="${k}" aria-label="${esc(t("Ir a la letra {l}", {l: k}))}">${k}</button>`).join("")}</nav>` : ""}
  <button class="fab only-m" data-new aria-label="${t("Nuevo alumno")}">${icon("plus")}</button>`;

  el.querySelector("#q").oninput = e => { st.q = e.target.value; st.f = true; render(el); };
  el.querySelector("#fDisc").onchange = e => { st.disc = e.target.value; render(el); };
  el.querySelector("#fPago").onchange = e => { st.pago = e.target.value; render(el); };
  el.querySelector("#fOrden").onchange = e => { st.orden = e.target.value; render(el); };
  el.querySelector("#fAus").onchange = e => { st.aus = e.target.checked; render(el); };
  el.onchange = e => {
    if(e.target.name === "estado"){ st.estado = e.target.value; render(el); }
    if(e.target.name === "vista"){ st.vista = e.target.value; S.setPref("vistaAlumnos", st.vista); render(el); }
  };
  el.onclick = e => {
    if(e.target.closest("[data-new]")) return studentForm(null, {onSaved: a => { location.hash = "#/alumno/" + a.id; }});
    const p = e.target.closest("[data-pay]"); if(p){ e.preventDefault(); quickPay(S.get("alumnos", p.dataset.pay)); return; }
    if(e.target.closest("[data-bulk]")){ import("../difusion.js").then(m => m.openDifusion({})).catch(() => toast(t("El mensaje masivo no está disponible ahora"), "warn")); return; }
    if(e.target.closest("[data-clearall]")){ Object.assign(st, {q: "", disc: "", pago: "", aus: false, estado: "activo"}); render(el); return; }
    const rf = e.target.closest("[data-rmf]"); if(rf){ st[rf.dataset.rmf] = rf.dataset.rmf === "aus" ? false : ""; render(el); return; }
    if(e.target.closest("[data-filtros]")) return filtersSheet(el, {selDisc, selPago, selOrden, nAus});
    if(e.target.closest("[data-csv]")) exportCsv(filtered.map(x => x.a));
  };
  const qi = el.querySelector("#q");
  if(st.f){ st.f = false; qi.focus(); qi.setSelectionRange(st.q.length, st.q.length); }
  wireAz(el);
  stickyWatch();
}

/* buscador fijo bajo la barra: al quedar pegado toma el mismo vidrio que la barra y se ven como una sola */
let stickyBound = false;
function stickyPaint(){
  const s = document.querySelector("#main .st-sticky"); if(!s) return;
  const bar = document.querySelector("#topBar")?.getBoundingClientRect().bottom || 0;
  const stuck = window.scrollY > 4 && s.getBoundingClientRect().top <= bar + 1;
  s.classList.toggle("stuck", stuck);
  /* pegado, el vidrio ocupa todo el ancho de la barra de navegación (no solo la columna del contenido) */
  if(stuck){
    const mw = document.querySelector(".main-wrap")?.getBoundingClientRect();
    if(mw){ s.style.setProperty("--mw-l", mw.left + "px"); s.style.setProperty("--mw-r", Math.max(0, innerWidth - mw.right) + "px"); s.style.setProperty("--stk-h", s.offsetHeight + "px"); }
  }
}
function stickyWatch(){
  if(!stickyBound){
    stickyBound = true;
    let raf = 0;
    addEventListener("scroll", () => { if(raf) return; raf = requestAnimationFrame(() => { raf = 0; stickyPaint(); }); }, {passive: true});
  }
  stickyPaint();
}

/* índice A-Z (celular): tocar o arrastrar salta a la letra, con un toque háptico por letra */
function wireAz(el){
  const nav = el.querySelector(".az"); if(!nav) return;
  let last = "", down = false;
  const go = k => {
    if(!k || k === last) return;
    last = k;
    const sec = el.querySelector(`.st-sec[data-letter="${k}"]`); if(!sec) return;
    const off = (document.querySelector("#topBar")?.getBoundingClientRect().bottom || 0) + (el.querySelector(".st-sticky")?.offsetHeight || 0) + 2;
    window.scrollTo({top: Math.max(0, sec.getBoundingClientRect().top + window.scrollY - off), behavior: "auto"});
    haptic("selection");
  };
  const at = e => { const r = nav.getBoundingClientRect(); return document.elementFromPoint(r.left + r.width / 2, e.clientY)?.closest?.("[data-az]")?.dataset.az; };
  nav.addEventListener("pointerdown", e => { down = true; last = ""; try{ nav.setPointerCapture(e.pointerId); }catch(x){} nav.classList.add("on"); go(at(e)); e.preventDefault(); });
  nav.addEventListener("pointermove", e => { if(down) go(at(e)); });
  const end = () => { down = false; nav.classList.remove("on"); };
  nav.addEventListener("pointerup", end);
  nav.addEventListener("pointercancel", end);
  /* teclado: Enter o Espacio en una letra */
  nav.addEventListener("click", e => { const b = e.target.closest("[data-az]"); if(b && e.detail === 0){ last = ""; go(b.dataset.az); } });
}

/* etiqueta corta de disciplina (BJJ, MT, MMA) con su color: no depende solo del color */
const dtag = d => `<span class="dtag" style="--dc:${esc(d.color || "#888")}" title="${esc(t(d.nombre))}">${esc(S.discCorto(d))}</span>`;

/* hoja de filtros (móvil): disciplina, pago, orden y ausentes */
function filtersSheet(el, {selDisc, selPago, selOrden, nAus}){
  const body = h(`<form class="form st-fsheet" novalidate>
    <div class="field"><label class="lbl" for="sDisc">${t("Disciplina")}</label>${selDisc("sDisc")}</div>
    <div class="field"><label class="lbl" for="sPago">${t("Pago")}</label>${selPago("sPago")}</div>
    <div class="field"><label class="lbl" for="sOrden">${t("Orden")}</label>${selOrden("sOrden")}</div>
    <label class="check toggle st-aus"><input type="checkbox" class="switch" name="aus" ${st.aus ? "checked" : ""}><span>${t("Sin venir +14 días")} <span class="muted">(${nAus})</span></span></label>
  </form>`);
  const m = modal({title: t("Filtros"), body, cls: "sheet",
    foot: `<button class="btn ghost left" data-clear>${t("Quitar filtros")}</button><button class="btn primary" data-apply>${t("Aplicar")}</button>`});
  m.foot.querySelector("[data-clear]").onclick = () => { Object.assign(st, {disc: "", pago: "", aus: false, orden: "nombre"}); m.close(); render(el); };
  m.foot.querySelector("[data-apply]").onclick = () => {
    const q = s => body.querySelector(s);
    Object.assign(st, {disc: q("#sDisc").value, pago: q("#sPago").value, orden: q("#sOrden").value, aus: q("[name=aus]").checked});
    m.close(); render(el);
  };
}

function exportCsv(list){
  const ds = S.disciplinas();
  const rows = [[t("Nombre"), t("Documento"), t("Nacimiento"), t("Edad"), t("Teléfono"), t("Correo"), t("Sede"), t("Estado"), t("Tipo de sangre"), t("EPS"), t("Alergias"), t("Lesiones"), t("Emergencia"), t("Tel. emergencia"), t("Plan"), t("Valor"), t("Próximo pago"), t("Gi"), t("Bucal"), ...ds.map(d => t(d.nombre))]];
  for(const a of list){
    rows.push([a.nombre, a.documento, a.nacimiento, age(a.nacimiento) ?? "", a.telefono, a.email, t(S.get("sedes", a.sedeId)?.nombre || ""), t(STATUS[a.estado]), a.sangre, a.eps, a.alergias, a.lesiones, a.emergencia, a.emergenciaTel,
      t(planById(a.plan).nombre), S.valorPlan(a), vence(a), a.equipo?.gi?.tiene ? t("Sí") : t("No"), a.equipo?.bucal?.tiene ? t("Sí") : t("No"),
      ...ds.map(d => { const g = S.rangoActual(a.id, d.id); return g ? t(S.rankDef(d, g.rank).n) + (g.grado ? ` ${g.grado}°` : "") : ""; })]);
  }
  download(`alumnos-${today()}.csv`, csv(rows), "text/csv;charset=utf-8");
}
