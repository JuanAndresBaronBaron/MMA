import * as S from "../store.js";
import {icon, avatar, belt, empty, pill, rankLabel, confirmDlg, toast} from "../ui.js";
import {esc, age, fmtDate, fmtDuration, money, waLink, today, monthsBetween, clamp} from "../util.js";
import {studentForm, paymentModal, promotionModal, quickPay} from "../forms.js";
import {STATUS, planById, GEAR} from "../catalog.js";

let tab = "grados";

export function render(el, [id]){
  const a = S.get("alumnos", id);
  if(!a){ el.innerHTML = empty("users", "Alumno no encontrado", "Puede que se haya eliminado.", `<a class="btn primary" href="#/alumnos">Ver alumnos</a>`); return; }
  const acad = S.academy(), cur = acad.moneda || "COP";
  const e = S.estadoPago(a, acad.avisoDias ?? 5);
  const sede = S.get("sedes", a.sedeId);
  const discs = (a.disciplinaIds || []).map(i => S.get("disciplinas", i)).filter(Boolean);
  const tel = a.telefono || a.acudienteTel;
  const wa = waLink(tel, `Hola ${a.nombre.split(" ")[0]}, te escribimos de ${acad.nombre}.`);
  const info = (k, v, ic) => v ? `<div class="kv">${ic ? icon(ic) : ""}<span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></div>` : "";

  const gradosHtml = discs.length ? discs.map(d => {
    const h = S.gradosDe(a.id, d.id);
    const g = h[h.length - 1];
    const ini = g ? S.inicioCinturon(h) : null;
    const n = S.siguiente(a.id, d);
    const clases = g ? S.asistenciasDe(a.id, g.fecha) : 0;
    const pct = n && n.min ? clamp(n.meses / n.min * 100, 0, 100) : 100;
    const rapid = new Set(S.promocionesRapidas(a.id, d).map(r => r.g.id));
    return `<div class="disc-block">
      <div class="disc-h"><span class="dot" style="background:${d.color}"></span><b>${esc(d.nombre)}</b>
        <button class="btn small primary" data-promo="${d.id}">${icon("plus")} Promoción</button></div>
      ${g ? `<div class="cur-rank">
          <div class="cur-belt">${belt(d, g.rank, g.grado, {w: 240, h: 36})}</div>
          <div class="cur-txt"><b>${esc(rankLabel(d, g))}</b>
            <span class="muted small">Desde ${fmtDate(g.fecha)} · hace ${fmtDuration(g.fecha)}</span>
            ${ini && ini.id !== g.id ? `<span class="muted small">En ${esc(S.rankDef(d, g.rank).n)} desde ${fmtDate(ini.fecha)} (${fmtDuration(ini.fecha)})</span>` : ""}
            <span class="muted small">${clases} ${clases === 1 ? "clase registrada" : "clases registradas"} desde la última promoción</span></div>
        </div>
        ${n ? `<div class="next ${n.listo ? "ready" : ""}"><div class="next-h"><span>${n.tipo === "grado" ? "Siguiente grado" : "Siguiente cinturón"}: <b>${esc(n.txt)}</b></span><span class="small">${n.listo ? `${icon("check")} Cumple el tiempo mínimo` : `Recomendado desde ${fmtDate(n.fecha)}`}</span></div>
          <div class="progress"><span style="width:${pct}%"></span></div><span class="muted small">${S.fmtMeses(n.meses)} de ${n.min ? S.fmtMeses(n.min) : "sin mínimo"}</span></div>` : ""}
        <ol class="timeline">${h.slice().reverse().map(x => `<li class="${rapid.has(x.id) ? "fast" : ""}">
          <span class="tl-belt">${belt(d, x.rank, x.grado, {w: 64, h: 12})}</span>
          <div><b>${esc(rankLabel(d, x))}</b> <span class="muted small">${fmtDate(x.fecha)}${x.profesor ? " · " + esc(x.profesor) : ""}${x.inicial ? " · al ingresar" : ""}</span>
          ${x.nota && !x.inicial ? `<span class="small muted block">${esc(x.nota)}</span>` : ""}
          ${rapid.has(x.id) ? `<span class="small warn-t block">${icon("alert")} Se dio antes del tiempo recomendado</span>` : ""}</div>
          <button class="icon-btn" data-editg="${x.id}" title="Editar">${icon("edit")}</button></li>`).join("")}</ol>`
      : `<p class="muted">Sin grado registrado. Registra su cinturón actual.</p>`}
    </div>`;
  }).join("") : empty("belt", "Sin disciplinas", "Edita al alumno y elige qué disciplinas entrena.");

  const pagos = S.pagosDe(a.id);
  const pagosHtml = `<div class="pay-status ${e.k}"><div>${pill(e.k, e.txt)}<span class="muted small">${e.vence ? (e.dias < 0 ? "Venció el " : "Próximo pago: ") + fmtDate(e.vence) : ""}</span></div>
      <div class="row gap">${["vencido", "pronto"].includes(e.k) ? `<button class="btn ok" data-quick>${icon("check")} Pagó ${money(S.valorPlan(a), cur)}</button>` : ""}<button class="btn ghost" data-pay>${icon("plus")} Otro pago</button></div></div>
    <p class="muted small">Plan ${esc(planById(a.plan).nombre.toLowerCase())} · ${money(S.valorPlan(a), cur)}</p>
    ${pagos.length ? `<div class="list">${pagos.map(p => `<div class="li" data-editp="${p.id}"><span class="li-ic">${icon("cash")}</span><div class="li-main"><b>${money(p.monto, cur)} · ${esc(p.concepto || "Pago")}</b><span class="muted small">${fmtDate(p.fecha)} · ${esc(p.metodo || "")}${p.hasta ? ` · cubre hasta ${fmtDate(p.hasta)}` : ""}${p.nota ? " · " + esc(p.nota) : ""}</span></div>${icon("edit", "muted")}</div>`).join("")}</div>`
      : `<p class="muted">Sin pagos registrados.</p>`}`;

  const equipoHtml = `<div class="gear-grid">${GEAR.map(g => { const x = a.equipo?.[g.k]; return `<div class="gear-it ${x?.tiene ? "has" : "no"}">${icon(x?.tiene ? "check" : "x")}<b>${esc(g.n)}</b><span class="muted small">${x?.tiene ? (x.talla ? "Talla " + esc(x.talla) : "Tiene") : "No tiene"}</span></div>`; }).join("")}</div>
    ${a.talla ? `<p class="muted small">Talla de ropa: ${esc(a.talla)}</p>` : ""}`;

  const infoHtml = `<div class="info-grid">
    <div class="card-in"><h4>${icon("users")} Datos personales</h4>${info("Documento", a.documento)}${info("Nacimiento", a.nacimiento ? `${fmtDate(a.nacimiento)} (${age(a.nacimiento)} años)` : "")}${info("Género", {M: "Masculino", F: "Femenino", O: "Otro"}[a.genero])}${info("Peso", a.peso ? a.peso + " kg" : "")}${info("Estatura", a.estatura ? a.estatura + " cm" : "")}${info("Ingreso", a.fechaInicio ? `${fmtDate(a.fechaInicio)} (${fmtDuration(a.fechaInicio)})` : "")}</div>
    <div class="card-in"><h4>${icon("phone")} Contacto</h4>${info("Teléfono", a.telefono)}${info("Correo", a.email)}${info("Dirección", a.direccion)}${info("Acudiente", a.acudiente)}${info("Tel. acudiente", a.acudienteTel)}</div>
    <div class="card-in health"><h4>${icon("heart")} Salud</h4>
      <div class="blood-big">${icon("drop")}<span>${esc(a.sangre || "—")}</span><small>Tipo de sangre</small></div>
      ${info("EPS / seguro", a.eps)}${info("Alergias", a.alergias)}${info("Lesiones", a.lesiones)}</div>
    <div class="card-in emerg"><h4>${icon("alert")} Emergencia</h4>${info("Contacto", a.emergencia)}${a.emergenciaTel ? `<a class="btn ghost small" href="tel:${esc(a.emergenciaTel)}">${icon("phone")} ${esc(a.emergenciaTel)}</a>` : `<p class="muted small">Sin contacto de emergencia.</p>`}</div>
    ${a.notas ? `<div class="card-in wide"><h4>${icon("edit")} Notas</h4><p class="pre">${esc(a.notas)}</p></div>` : ""}
  </div>`;

  el.innerHTML = `
  <a class="back" href="#/alumnos">${icon("back")} Alumnos</a>
  <section class="profile card">
    <div class="pf-photo">${avatar(a, 120)}</div>
    <div class="pf-main">
      <h2>${esc(a.nombre)}</h2>
      <div class="pf-tags">${pill(a.estado === "activo" ? "aldia" : a.estado, STATUS[a.estado] || "")}${pill(e.k, e.txt)}${sede ? `<span class="tag">${icon("map")}${esc(sede.nombre)}</span>` : ""}${a.nacimiento ? `<span class="tag">${age(a.nacimiento)} años</span>` : ""}${a.sangre ? `<span class="tag blood">${icon("drop")}${esc(a.sangre)}</span>` : ""}</div>
      <div class="pf-belts">${discs.map(d => { const g = S.rangoActual(a.id, d.id); return g ? `<span class="pf-belt" title="${esc(d.nombre)}">${belt(d, g.rank, g.grado, {w: 90, h: 16})}<small>${esc(d.nombre)}</small></span>` : ""; }).join("")}</div>
    </div>
    <div class="pf-act">
      <button class="btn primary" data-edit>${icon("edit")} Editar</button>
      ${wa ? `<a class="btn ghost" href="${esc(wa)}" target="_blank" rel="noopener">${icon("whatsapp")} WhatsApp</a>` : ""}
      ${tel ? `<a class="btn ghost" href="tel:${esc(tel)}">${icon("phone")} Llamar</a>` : ""}
    </div>
  </section>
  <div class="tabs">${[["grados", "Grados", "belt"], ["pagos", "Pagos", "cash"], ["info", "Ficha", "users"], ["equipo", "Equipo", "bag"]].map(([k, n, ic]) => `<button class="tab ${tab === k ? "on" : ""}" data-tab="${k}">${icon(ic)}${n}</button>`).join("")}</div>
  <section class="card">${{grados: gradosHtml, pagos: pagosHtml, info: infoHtml, equipo: equipoHtml}[tab]}</section>`;

  el.onclick = ev => {
    const t = ev.target;
    const tb = t.closest("[data-tab]"); if(tb){ tab = tb.dataset.tab; render(el, [id]); return; }
    if(t.closest("[data-edit]")) return studentForm(a, {onDeleted: () => { location.hash = "#/alumnos"; }});
    const pr = t.closest("[data-promo]"); if(pr) return promotionModal(a, pr.dataset.promo);
    const eg = t.closest("[data-editg]"); if(eg){ const g = S.get("grados", eg.dataset.editg); return promotionModal(a, g.disciplinaId, g); }
    if(t.closest("[data-quick]")) return quickPay(a);
    if(t.closest("[data-pay]")) return paymentModal(a);
    const ep = t.closest("[data-editp]"); if(ep) return paymentModal(a, S.get("pagos", ep.dataset.editp));
  };
}
