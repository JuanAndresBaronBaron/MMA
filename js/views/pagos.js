import * as S from "../store.js";
import {icon, avatar, empty, pill} from "../ui.js";
import {esc, money, today, fmtDate, MESES, addMonths, waLink, norm, csv, download} from "../util.js";
import {paymentModal, quickPay} from "../forms.js";
import {planById} from "../catalog.js";
import {t, tn} from "../i18n.js";

const st = {tab: "cobrar", mes: today().slice(0, 7), q: "", f: false};

export function render(el){
  const acad = S.academy(), cur = acad.moneda || "COP";
  const sede = S.curSede();
  const pagos = S.inAcad("pagos").filter(p => !sede || p.sedeId === sede);
  const delMes = pagos.filter(p => (p.fecha || "").startsWith(st.mes)).sort((a, b) => (b.fecha || "").localeCompare(a.fecha || "") || b._c - a._c);
  const total = delMes.reduce((s, p) => s + (Number(p.monto) || 0), 0);
  const porMetodo = {};
  for(const p of delMes) porMetodo[p.metodo || "Otro"] = (porMetodo[p.metodo || "Otro"] || 0) + (Number(p.monto) || 0);
  const activos = S.alumnos().filter(a => a.estado === "activo");
  const q = norm(st.q);
  const est = activos.map(a => ({a, e: S.estadoPago(a, acad.avisoDias ?? 5)})).filter(x => !["beca"].includes(x.e.k) && (!q || norm(x.a.nombre).includes(q)));
  est.sort((x, y) => (x.e.dias ?? 9999) - (y.e.dias ?? 9999));
  const venc = est.filter(x => x.e.k === "vencido"), pronto = est.filter(x => x.e.k === "pronto"), ok = est.filter(x => x.e.k === "aldia" || x.e.k === "clase");
  const deuda = venc.reduce((s, x) => s + S.valorPlan(x.a), 0);
  const [y, m] = st.mes.split("-").map(Number);

  const row = x => {
    const mv = {nombre: x.a.nombre.split(" ")[0], academia: acad.nombre, fecha: fmtDate(x.e.vence), valor: money(S.valorPlan(x.a), cur)};
    const msg = x.e.dias < 0 ? t("Hola {nombre}, te recordamos que tu mensualidad en {academia} venció el {fecha}. Valor: {valor}. ¡Gracias!", mv) : t("Hola {nombre}, te recordamos que tu mensualidad en {academia} vence el {fecha}. Valor: {valor}. ¡Gracias!", mv);
    const wa = waLink(x.a.telefono || x.a.acudienteTel, msg);
    return `<div class="li pay-li">
      <a href="#/alumno/${x.a.id}" class="li-link">${avatar(x.a, 40)}<div class="li-main"><b>${esc(x.a.nombre)}</b><span class="muted small">${esc(t(planById(x.a.plan).nombre))} · ${money(S.valorPlan(x.a), cur)}${x.e.vence ? " · " + fmtDate(x.e.vence) : ""}</span></div></a>
      ${pill(x.e.k, x.e.txt)}
      <span class="li-act">${wa && x.e.k !== "aldia" ? `<a class="icon-btn wa" href="${esc(wa)}" target="_blank" rel="noopener" title="${t("Recordar por WhatsApp")}">${icon("whatsapp")}</a>` : ""}
      <button class="icon-btn" data-more="${x.a.id}" title="${t("Registrar otro pago")}">${icon("plus")}</button>
      <button class="paycheck ${x.e.k === "aldia" ? "on" : ""}" data-pay="${x.a.id}" title="${x.e.k === "aldia" ? t("Al día (toca para registrar el siguiente pago)") : t("Marcar como pagado")}">${icon("check")}</button></span>
    </div>`;
  };
  const group = (tt, arr, k) => arr.length ? `<h4 class="grp ${k}">${tt} <span>${arr.length}</span></h4><div class="list">${arr.map(row).join("")}</div>` : "";

  el.innerHTML = `
  <div class="kpis">
    <div class="kpi"><span class="kpi-ic c2">${icon("cash")}</span><div><b>${money(total, cur)}</b><span>${t("Recaudado en {mes}", {mes: MESES[m - 1]})}</span></div></div>
    <div class="kpi"><span class="kpi-ic c3">${icon("alert")}</span><div><b>${venc.length}</b><span>${t("Vencidos")} · ${money(deuda, cur)}</span></div></div>
    <div class="kpi"><span class="kpi-ic c4">${icon("clock")}</span><div><b>${pronto.length}</b><span>${tn(acad.avisoDias ?? 5, "Vencen en 1 día", "Vencen en {n} días")}</span></div></div>
    <div class="kpi"><span class="kpi-ic c1">${icon("check")}</span><div><b>${ok.length}</b><span>${t("Al día")}</span></div></div>
  </div>
  <div class="tabs">
    <button class="tab ${st.tab === "cobrar" ? "on" : ""}" data-tab="cobrar">${icon("check")} ${t("Control de pagos")}</button>
    <button class="tab ${st.tab === "hist" ? "on" : ""}" data-tab="hist">${icon("list")} ${t("Historial del mes")}</button>
  </div>
  ${st.tab === "cobrar" ? `<section class="card">
      <div class="toolbar"><label class="search">${icon("search")}<input id="pq" type="search" placeholder="${t("Buscar alumno")}" value="${esc(st.q)}"></label></div>
      <p class="muted small">${t("Toca {check} para marcar que el alumno pagó su plan: se registra el pago y se corre la fecha del próximo cobro. Usa {plus} para un valor o período distinto.", {check: icon("check", "inline"), plus: icon("plus", "inline")})}</p>
      ${est.length ? group(t("Vencidos"), venc, "err") + group(t("Por vencer"), pronto, "warn") + group(t("Al día"), ok, "ok") : empty("users", t("Sin alumnos activos"), t("Los alumnos activos con plan de pago aparecen aquí."))}
    </section>`
  : `<section class="card">
      <div class="month-nav"><button class="icon-btn" data-m="-1">${icon("back")}</button><b>${MESES[m - 1]} ${y}</b><button class="icon-btn" data-m="1">${icon("chevron")}</button>
        <span class="grow"></span><button class="btn ghost small" data-csv>${icon("download")} CSV</button></div>
      ${Object.keys(porMetodo).length ? `<div class="methods">${Object.entries(porMetodo).map(([k, v]) => `<span class="tag">${esc(t(k))}: <b>${money(v, cur)}</b></span>`).join("")}</div>` : ""}
      ${delMes.length ? `<div class="list">${delMes.map(p => { const a = S.get("alumnos", p.alumnoId); return `<div class="li" data-editp="${p.id}">${a ? avatar(a, 36) : `<span class="li-ic">${icon("cash")}</span>`}<div class="li-main"><b>${esc(a?.nombre || t("Alumno eliminado"))}</b><span class="muted small">${fmtDate(p.fecha)} · ${esc(t(p.concepto || ""))} · ${esc(t(p.metodo || ""))}${p.hasta ? " · " + t("hasta {fecha}", {fecha: fmtDate(p.hasta)}) : ""}</span></div><b class="amount">${money(p.monto, cur)}</b></div>`; }).join("")}</div>`
        : empty("cash", t("Sin pagos este mes"), t("Los pagos registrados aparecen aquí."))}
    </section>`}`;

  el.onclick = e => {
    const tg = e.target;
    const tb = tg.closest("[data-tab]"); if(tb){ st.tab = tb.dataset.tab; render(el); return; }
    const mm = tg.closest("[data-m]"); if(mm){ st.mes = addMonths(st.mes + "-01", +mm.dataset.m).slice(0, 7); render(el); return; }
    const p = tg.closest("[data-pay]"); if(p){ const a = S.get("alumnos", p.dataset.pay); p.classList.contains("on") ? paymentModal(a) : quickPay(a); return; }
    const mo = tg.closest("[data-more]"); if(mo){ paymentModal(S.get("alumnos", mo.dataset.more)); return; }
    const ep = tg.closest("[data-editp]"); if(ep){ const pg = S.get("pagos", ep.dataset.editp); const a = S.get("alumnos", pg.alumnoId); if(a) paymentModal(a, pg); return; }
    if(tg.closest("[data-csv]")){
      const rows = [[t("Fecha"), t("Alumno"), t("Concepto"), t("Método"), t("Valor"), t("Desde"), t("Hasta"), t("Nota")]];
      for(const p of delMes) rows.push([p.fecha, S.get("alumnos", p.alumnoId)?.nombre || "", p.concepto, p.metodo, p.monto, p.desde || "", p.hasta || "", p.nota || ""]);
      download(`pagos-${st.mes}.csv`, csv(rows), "text/csv;charset=utf-8");
    }
  };
  const pq = el.querySelector("#pq");
  if(pq){ pq.oninput = e => { st.q = e.target.value; st.f = true; render(el); }; if(st.f){ st.f = false; pq.focus(); pq.setSelectionRange(st.q.length, st.q.length); } }
}
