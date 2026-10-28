import * as S from "../store.js";
import {icon, avatar, belt, empty, pill, rankLabel, confirmDlg, toast} from "../ui.js";
import {esc, age, fmtDate, fmtDuration, money, waLink, today, monthsBetween, clamp} from "../util.js";
import {studentForm, paymentModal, promotionModal, quickPay} from "../forms.js";
import {STATUS, planById, GEAR} from "../catalog.js";
import {t, tn} from "../i18n.js";

let tab = "grados";

export function render(el, [id]){
  const a = S.get("alumnos", id);
  if(!a){ el.innerHTML = empty("users", t("Alumno no encontrado"), t("Puede que se haya eliminado."), `<a class="btn primary" href="#/alumnos">${t("Ver alumnos")}</a>`); return; }
  const acad = S.academy(), cur = acad.moneda || "COP";
  const e = S.estadoPago(a, acad.avisoDias ?? 5);
  const sede = S.get("sedes", a.sedeId);
  const discs = (a.disciplinaIds || []).map(i => S.get("disciplinas", i)).filter(Boolean);
  const tel = a.telefono || a.acudienteTel;
  const wa = waLink(tel, t("Hola {nombre}, te escribimos de {academia}.", {nombre: a.nombre.split(" ")[0], academia: acad.nombre}));
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
      <div class="disc-h"><span class="dot" style="background:${d.color}"></span><b>${esc(t(d.nombre))}</b>
        <button class="btn small primary" data-promo="${d.id}">${icon("plus")} ${t("Promoción")}</button></div>
      ${g ? `<div class="cur-rank">
          <div class="cur-belt">${belt(d, g.rank, g.grado, {w: 240, h: 36})}</div>
          <div class="cur-txt"><b>${esc(rankLabel(d, g))}</b>
            <span class="muted small">${t("Desde {fecha} · hace {tiempo}", {fecha: fmtDate(g.fecha), tiempo: fmtDuration(g.fecha)})}</span>
            ${ini && ini.id !== g.id ? `<span class="muted small">${t("En {cinturon} desde {fecha} ({tiempo})", {cinturon: esc(t(S.rankDef(d, g.rank).n)), fecha: fmtDate(ini.fecha), tiempo: fmtDuration(ini.fecha)})}</span>` : ""}
            <span class="muted small">${tn(clases, "1 clase registrada desde la última promoción", "{n} clases registradas desde la última promoción")}</span></div>
        </div>
        ${n ? `<div class="next ${n.listo ? "ready" : ""}"><div class="next-h"><span>${n.tipo === "grado" ? t("Siguiente grado") : t("Siguiente cinturón")}: <b>${esc(n.txt)}</b></span><span class="small">${n.listo ? `${icon("check")} ${t("Cumple el tiempo mínimo")}` : t("Recomendado desde {fecha}", {fecha: fmtDate(n.fecha)})}</span></div>
          <div class="progress"><span style="width:${pct}%"></span></div><span class="muted small">${t("{actual} de {minimo}", {actual: S.fmtMeses(n.meses), minimo: n.min ? S.fmtMeses(n.min) : t("sin mínimo")})}</span></div>` : ""}
        <ol class="timeline">${h.slice().reverse().map(x => `<li class="${rapid.has(x.id) ? "fast" : ""}">
          <span class="tl-belt">${belt(d, x.rank, x.grado, {w: 64, h: 12})}</span>
          <div><b>${esc(rankLabel(d, x))}</b> <span class="muted small">${fmtDate(x.fecha)}${x.profesor ? " · " + esc(x.profesor) : ""}${x.inicial ? " · " + t("al ingresar") : ""}</span>
          ${x.nota && !x.inicial ? `<span class="small muted block">${esc(x.nota)}</span>` : ""}
          ${rapid.has(x.id) ? `<span class="small warn-t block">${icon("alert")} ${t("Se dio antes del tiempo recomendado")}</span>` : ""}</div>
          <button class="icon-btn" data-editg="${x.id}" title="${t("Editar")}">${icon("edit")}</button></li>`).join("")}</ol>`
      : `<p class="muted">${t("Sin grado registrado. Registra su cinturón actual.")}</p>`}
    </div>`;
  }).join("") : empty("belt", t("Sin disciplinas"), t("Edita al alumno y elige qué disciplinas entrena."));

  const pagos = S.pagosDe(a.id);
  const pagosHtml = `<div class="pay-status ${e.k}"><div>${pill(e.k, e.txt)}<span class="muted small">${e.vence ? (e.dias < 0 ? t("Venció el {fecha}", {fecha: fmtDate(e.vence)}) : t("Próximo pago: {fecha}", {fecha: fmtDate(e.vence)})) : ""}</span></div>
      <div class="row gap">${["vencido", "pronto"].includes(e.k) ? `<button class="btn ok" data-quick>${icon("check")} ${t("Pagó {valor}", {valor: money(S.valorPlan(a), cur)})}</button>` : ""}<button class="btn ghost" data-pay>${icon("plus")} ${t("Otro pago")}</button></div></div>
    <p class="muted small">${t("Plan {plan}", {plan: esc(t(planById(a.plan).nombre).toLowerCase())})} · ${money(S.valorPlan(a), cur)}</p>
    ${pagos.length ? `<div class="list">${pagos.map(p => `<div class="li" data-editp="${p.id}"><span class="li-ic">${icon("cash")}</span><div class="li-main"><b>${money(p.monto, cur)} · ${esc(t(p.concepto || "Pago"))}</b><span class="muted small">${fmtDate(p.fecha)} · ${esc(t(p.metodo || ""))}${p.hasta ? " · " + t("cubre hasta {fecha}", {fecha: fmtDate(p.hasta)}) : ""}${p.nota ? " · " + esc(p.nota) : ""}</span></div>${icon("edit", "muted")}</div>`).join("")}</div>`
      : `<p class="muted">${t("Sin pagos registrados.")}</p>`}`;

  const equipoHtml = `<div class="gear-grid">${GEAR.map(g => { const x = a.equipo?.[g.k]; return `<div class="gear-it ${x?.tiene ? "has" : "no"}">${icon(x?.tiene ? "check" : "x")}<b>${esc(t(g.n))}</b><span class="muted small">${x?.tiene ? (x.talla ? t("Talla {talla}", {talla: esc(x.talla)}) : t("Tiene")) : t("No tiene")}</span></div>`; }).join("")}</div>
    ${a.talla ? `<p class="muted small">${t("Talla de ropa: {talla}", {talla: esc(a.talla)})}</p>` : ""}`;

  const infoHtml = `<div class="info-grid">
    <div class="card-in"><h4>${icon("users")} ${t("Datos personales")}</h4>${info(t("Documento"), a.documento)}${info(t("Nacimiento"), a.nacimiento ? `${fmtDate(a.nacimiento)} (${tn(age(a.nacimiento), "1 año", "{n} años")})` : "")}${info(t("Género"), {M: t("Masculino"), F: t("Femenino"), O: t("Otro")}[a.genero])}${info(t("Peso"), a.peso ? a.peso + " kg" : "")}${info(t("Estatura"), a.estatura ? a.estatura + " cm" : "")}${info(t("Ingreso"), a.fechaInicio ? `${fmtDate(a.fechaInicio)} (${fmtDuration(a.fechaInicio)})` : "")}</div>
    <div class="card-in"><h4>${icon("phone")} ${t("Contacto")}</h4>${info(t("Teléfono"), a.telefono)}${info(t("Correo"), a.email)}${info(t("Dirección"), a.direccion)}${info(t("Acudiente"), a.acudiente)}${info(t("Tel. acudiente"), a.acudienteTel)}</div>
    <div class="card-in health"><h4>${icon("heart")} ${t("Salud")}</h4>
      <div class="blood-big">${icon("drop")}<span>${esc(a.sangre || "—")}</span><small>${t("Tipo de sangre")}</small></div>
      ${info(t("EPS / seguro"), a.eps)}${info(t("Alergias"), a.alergias)}${info(t("Lesiones"), a.lesiones)}</div>
    <div class="card-in emerg"><h4>${icon("alert")} ${t("Emergencia")}</h4>${info(t("Contacto"), a.emergencia)}${a.emergenciaTel ? `<a class="btn ghost small" href="tel:${esc(a.emergenciaTel)}">${icon("phone")} ${esc(a.emergenciaTel)}</a>` : `<p class="muted small">${t("Sin contacto de emergencia.")}</p>`}</div>
    ${a.notas ? `<div class="card-in wide"><h4>${icon("edit")} ${t("Notas")}</h4><p class="pre">${esc(a.notas)}</p></div>` : ""}
  </div>`;

  el.innerHTML = `
  <a class="back" href="#/alumnos">${icon("back")} ${t("Alumnos")}</a>
  <section class="profile card">
    <div class="pf-photo">${avatar(a, 120)}</div>
    <div class="pf-main">
      <h2>${esc(a.nombre)}</h2>
      <div class="pf-tags">${pill(a.estado === "activo" ? "aldia" : a.estado, t(STATUS[a.estado] || ""))}${pill(e.k, e.txt)}${sede ? `<span class="tag">${icon("map")}${esc(sede.nombre)}</span>` : ""}${a.nacimiento ? `<span class="tag">${tn(age(a.nacimiento), "1 año", "{n} años")}</span>` : ""}${a.sangre ? `<span class="tag blood">${icon("drop")}${esc(a.sangre)}</span>` : ""}</div>
      <div class="pf-belts">${discs.map(d => { const g = S.rangoActual(a.id, d.id); return g ? `<span class="pf-belt" title="${esc(t(d.nombre))}">${belt(d, g.rank, g.grado, {w: 90, h: 16})}<small>${esc(t(d.nombre))}</small></span>` : ""; }).join("")}</div>
    </div>
    <div class="pf-act">
      <button class="btn primary" data-edit>${icon("edit")} ${t("Editar")}</button>
      ${wa ? `<a class="btn ghost" href="${esc(wa)}" target="_blank" rel="noopener">${icon("whatsapp")} WhatsApp</a>` : ""}
      ${tel ? `<a class="btn ghost" href="tel:${esc(tel)}">${icon("phone")} ${t("Llamar")}</a>` : ""}
    </div>
  </section>
  <div class="tabs">${[["grados", t("Grados"), "belt"], ["pagos", t("Pagos"), "cash"], ["info", t("Ficha"), "users"], ["equipo", t("Equipo"), "bag"]].map(([k, n, ic]) => `<button class="tab ${tab === k ? "on" : ""}" data-tab="${k}">${icon(ic)}${n}</button>`).join("")}</div>
  <section class="card">${{grados: gradosHtml, pagos: pagosHtml, info: infoHtml, equipo: equipoHtml}[tab]}</section>`;

  el.onclick = ev => {
    const tg = ev.target;
    const tb = tg.closest("[data-tab]"); if(tb){ tab = tb.dataset.tab; render(el, [id]); return; }
    if(tg.closest("[data-edit]")) return studentForm(a, {onDeleted: () => { location.hash = "#/alumnos"; }});
    const pr = tg.closest("[data-promo]"); if(pr) return promotionModal(a, pr.dataset.promo);
    const eg = tg.closest("[data-editg]"); if(eg){ const g = S.get("grados", eg.dataset.editg); return promotionModal(a, g.disciplinaId, g); }
    if(tg.closest("[data-quick]")) return quickPay(a);
    if(tg.closest("[data-pay]")) return paymentModal(a);
    const ep = tg.closest("[data-editp]"); if(ep) return paymentModal(a, S.get("pagos", ep.dataset.editp));
  };
}
