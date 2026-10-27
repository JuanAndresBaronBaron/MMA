import * as S from "../store.js";
import {icon, avatar, empty, pill} from "../ui.js";
import {esc, money, today, fmtDate, MESES, addMonths, waLink, norm, csv, download} from "../util.js";
import {paymentModal, quickPay} from "../forms.js";
import {planById} from "../catalog.js";

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
    const msg = `Hola ${x.a.nombre.split(" ")[0]}, te recordamos que tu mensualidad en ${acad.nombre} ${x.e.dias < 0 ? "venció el " + fmtDate(x.e.vence) : "vence el " + fmtDate(x.e.vence)}. Valor: ${money(S.valorPlan(x.a), cur)}. ¡Gracias!`;
    const wa = waLink(x.a.telefono || x.a.acudienteTel, msg);
    return `<div class="li pay-li">
      <a href="#/alumno/${x.a.id}" class="li-link">${avatar(x.a, 40)}<div class="li-main"><b>${esc(x.a.nombre)}</b><span class="muted small">${esc(planById(x.a.plan).nombre)} · ${money(S.valorPlan(x.a), cur)}${x.e.vence ? " · " + fmtDate(x.e.vence) : ""}</span></div></a>
      ${pill(x.e.k, x.e.txt)}
      <span class="li-act">${wa && x.e.k !== "aldia" ? `<a class="icon-btn wa" href="${esc(wa)}" target="_blank" rel="noopener" title="Recordar por WhatsApp">${icon("whatsapp")}</a>` : ""}
      <button class="icon-btn" data-more="${x.a.id}" title="Registrar otro pago">${icon("plus")}</button>
      <button class="paycheck ${x.e.k === "aldia" ? "on" : ""}" data-pay="${x.a.id}" title="${x.e.k === "aldia" ? "Al día (toca para registrar el siguiente pago)" : "Marcar como pagado"}">${icon("check")}</button></span>
    </div>`;
  };
  const group = (t, arr, k) => arr.length ? `<h4 class="grp ${k}">${t} <span>${arr.length}</span></h4><div class="list">${arr.map(row).join("")}</div>` : "";

  el.innerHTML = `
  <div class="kpis">
    <div class="kpi"><span class="kpi-ic c2">${icon("cash")}</span><div><b>${money(total, cur)}</b><span>Recaudado en ${MESES[m - 1]}</span></div></div>
    <div class="kpi"><span class="kpi-ic c3">${icon("alert")}</span><div><b>${venc.length}</b><span>Vencidos · ${money(deuda, cur)}</span></div></div>
    <div class="kpi"><span class="kpi-ic c4">${icon("clock")}</span><div><b>${pronto.length}</b><span>Vencen en ${acad.avisoDias ?? 5} días</span></div></div>
    <div class="kpi"><span class="kpi-ic c1">${icon("check")}</span><div><b>${ok.length}</b><span>Al día</span></div></div>
  </div>
  <div class="tabs">
    <button class="tab ${st.tab === "cobrar" ? "on" : ""}" data-tab="cobrar">${icon("check")} Control de pagos</button>
    <button class="tab ${st.tab === "hist" ? "on" : ""}" data-tab="hist">${icon("list")} Historial del mes</button>
  </div>
  ${st.tab === "cobrar" ? `<section class="card">
      <div class="toolbar"><label class="search">${icon("search")}<input id="pq" type="search" placeholder="Buscar alumno" value="${esc(st.q)}"></label></div>
      <p class="muted small">Toca ${icon("check", "inline")} para marcar que el alumno pagó su plan: se registra el pago y se corre la fecha del próximo cobro. Usa ${icon("plus", "inline")} para un valor o período distinto.</p>
      ${est.length ? group("Vencidos", venc, "err") + group("Por vencer", pronto, "warn") + group("Al día", ok, "ok") : empty("users", "Sin alumnos activos", "Los alumnos activos con plan de pago aparecen aquí.")}
    </section>`
  : `<section class="card">
      <div class="month-nav"><button class="icon-btn" data-m="-1">${icon("back")}</button><b>${MESES[m - 1]} ${y}</b><button class="icon-btn" data-m="1">${icon("chevron")}</button>
        <span class="grow"></span><button class="btn ghost small" data-csv>${icon("download")} CSV</button></div>
      ${Object.keys(porMetodo).length ? `<div class="methods">${Object.entries(porMetodo).map(([k, v]) => `<span class="tag">${esc(k)}: <b>${money(v, cur)}</b></span>`).join("")}</div>` : ""}
      ${delMes.length ? `<div class="list">${delMes.map(p => { const a = S.get("alumnos", p.alumnoId); return `<div class="li" data-editp="${p.id}">${a ? avatar(a, 36) : `<span class="li-ic">${icon("cash")}</span>`}<div class="li-main"><b>${esc(a?.nombre || "Alumno eliminado")}</b><span class="muted small">${fmtDate(p.fecha)} · ${esc(p.concepto || "")} · ${esc(p.metodo || "")}${p.hasta ? " · hasta " + fmtDate(p.hasta) : ""}</span></div><b class="amount">${money(p.monto, cur)}</b></div>`; }).join("")}</div>`
        : empty("cash", "Sin pagos este mes", "Los pagos registrados aparecen aquí.")}
    </section>`}`;

  el.onclick = e => {
    const t = e.target;
    const tb = t.closest("[data-tab]"); if(tb){ st.tab = tb.dataset.tab; render(el); return; }
    const mm = t.closest("[data-m]"); if(mm){ st.mes = addMonths(st.mes + "-01", +mm.dataset.m).slice(0, 7); render(el); return; }
    const p = t.closest("[data-pay]"); if(p){ const a = S.get("alumnos", p.dataset.pay); p.classList.contains("on") ? paymentModal(a) : quickPay(a); return; }
    const mo = t.closest("[data-more]"); if(mo){ paymentModal(S.get("alumnos", mo.dataset.more)); return; }
    const ep = t.closest("[data-editp]"); if(ep){ const pg = S.get("pagos", ep.dataset.editp); const a = S.get("alumnos", pg.alumnoId); if(a) paymentModal(a, pg); return; }
    if(t.closest("[data-csv]")){
      const rows = [["Fecha", "Alumno", "Concepto", "Método", "Valor", "Desde", "Hasta", "Nota"]];
      for(const p of delMes) rows.push([p.fecha, S.get("alumnos", p.alumnoId)?.nombre || "", p.concepto, p.metodo, p.monto, p.desde || "", p.hasta || "", p.nota || ""]);
      download(`pagos-${st.mes}.csv`, csv(rows), "text/csv;charset=utf-8");
    }
  };
  const pq = el.querySelector("#pq");
  if(pq){ pq.oninput = e => { st.q = e.target.value; st.f = true; render(el); }; if(st.f){ st.f = false; pq.focus(); pq.setSelectionRange(st.q.length, st.q.length); } }
}
