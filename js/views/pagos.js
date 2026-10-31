import * as S from "../store.js";
import {icon, avatar, empty, pill, modal, toast} from "../ui.js";
import {esc, money, today, fmtDate, MESES, addMonths, waLink, norm, csv, download, h} from "../util.js";
import {paymentModal, quickPay} from "../forms.js";
import {planById} from "../catalog.js";
import {deuda, estadoPago, pillTxt, txtCuotas, tplCobro, msgCobro, diasRecordado} from "../cobros.js";
import {t, tn} from "../i18n.js";

/* mes: null = el mes actual al pintar (no se congela si la app queda abierta) */
const st = {tab: "cobrar", mes: null, q: "", f: false};

const recTxt = a => { const n = diasRecordado(a); return n === null ? "" : n === 0 ? t("Recordado hoy") : tn(n, "Recordado hace 1 día", "Recordado hace {n} días"); };

export function render(el){
  const acad = S.academy(), cur = acad.moneda || "COP";
  const sede = S.curSede();
  const mes = st.mes || today().slice(0, 7);
  const q = norm(st.q);
  const pagos = S.inAcad("pagos").filter(p => !sede || p.sedeId === sede);
  const delMes = pagos.filter(p => (p.fecha || "").startsWith(mes)).sort((a, b) => (b.fecha || "").localeCompare(a.fecha || "") || b._c - a._c);
  const total = delMes.reduce((s, p) => s + (Number(p.monto) || 0), 0);
  const porMetodo = {};
  for(const p of delMes) porMetodo[p.metodo || "Otro"] = (porMetodo[p.metodo || "Otro"] || 0) + (Number(p.monto) || 0);
  const histList = q ? delMes.filter(p => norm(S.get("alumnos", p.alumnoId)?.nombre).includes(q) || norm(p.nota).includes(q) || norm(t(p.concepto || "")).includes(q)) : delMes;
  const activos = S.alumnos().filter(a => a.estado === "activo");
  const est = activos.map(a => ({a, e: estadoPago(a, acad.avisoDias ?? 5), d: deuda(a)})).filter(x => !["beca"].includes(x.e.k) && (!q || norm(x.a.nombre).includes(q)));
  est.sort((x, y) => (x.e.dias ?? 9999) - (y.e.dias ?? 9999));
  const venc = est.filter(x => x.e.k === "vencido"), pronto = est.filter(x => x.e.k === "pronto"), ok = est.filter(x => x.e.k === "aldia" || x.e.k === "clase");
  const owed = x => x.d.monto || S.valorPlan(x.a);
  const totalDeuda = venc.reduce((s, x) => s + owed(x), 0);
  const [y, m] = mes.split("-").map(Number);

  const wa = x => {
    const mv = {nombre: x.a.nombre.split(" ")[0], academia: acad.nombre, fecha: fmtDate(x.e.vence), valor: money(x.e.k === "vencido" ? owed(x) : S.valorPlan(x.a), cur)};
    const msg = x.e.dias < 0 ? t("Hola {nombre}, te recordamos que tu mensualidad en {academia} venció el {fecha}. Valor: {valor}. ¡Gracias!", mv) : t("Hola {nombre}, te recordamos que tu mensualidad en {academia} vence el {fecha}. Valor: {valor}. ¡Gracias!", mv);
    return x.e.k !== "aldia" ? waLink(x.a.telefono || x.a.acudienteTel, msg) : null;
  };
  /* fila en 2 líneas: avatar · nombre + valor / píldora + fecha · ✓ */
  const row = x => {
    const w = wa(x), many = x.e.k === "vencido" && x.d.cuotas > 1, rt = x.e.k !== "aldia" ? recTxt(x.a) : "";
    const meta = [t(planById(x.a.plan).nombre), x.e.vence ? fmtDate(x.e.vence) : ""].filter(Boolean).join(" · ");
    return `<div class="li pay-row">
      <a href="#/alumno/${x.a.id}" class="pr-link">${avatar(x.a, 40)}
        <b class="pr-name">${esc(x.a.nombre)}</b>
        <b class="pr-amt amount ${many ? "err" : ""}" title="${many ? esc(t("Debe {cuotas}", {cuotas: txtCuotas(x.a, x.d.cuotas)})) : ""}">${money(x.e.k === "vencido" ? owed(x) : S.valorPlan(x.a), cur)}</b>
        <span class="pr-meta">${pill(x.e.k, pillTxt(x.a, x.e, x.d))}<span class="muted small">${esc(meta)}${rt ? ` · <span class="pr-rec">${icon("whatsapp", "inline")}${esc(rt)}</span>` : ""}</span></span>
      </a>
      <span class="li-act">${w ? `<a class="icon-btn wa hide-s" href="${esc(w)}" target="_blank" rel="noopener" data-wa="${x.a.id}" title="${t("Recordar por WhatsApp")}" aria-label="${t("Recordar por WhatsApp")}">${icon("whatsapp")}</a>` : ""}
      <button class="icon-btn hide-s" data-more="${x.a.id}" title="${t("Registrar otro pago")}" aria-label="${t("Registrar otro pago")}">${icon("plus")}</button>
      <button class="icon-btn only-m pr-dots" data-menu="${x.a.id}" aria-label="${esc(t("Más acciones para {nombre}", {nombre: x.a.nombre}))}"><span aria-hidden="true">⋯</span></button>
      <button class="paycheck ${x.e.k === "aldia" ? "on" : ""}" data-pay="${x.a.id}" title="${x.e.k === "aldia" ? t("Al día (toca para registrar el siguiente pago)") : t("Marcar como pagado")}" aria-label="${esc((x.e.k === "aldia" ? t("Al día (toca para registrar el siguiente pago)") : t("Marcar como pagado")) + ": " + x.a.nombre)}">${icon("check")}</button></span>
    </div>`;
  };
  const group = (tt, arr, k) => arr.length ? `<h4 class="grp ${k}">${tt} <span>${arr.length}</span></h4><div class="list">${arr.map(row).join("")}</div>` : "";
  const conTel = venc.filter(x => x.a.telefono || x.a.acudienteTel);
  const search = `<label class="search">${icon("search")}<input id="pq" type="search" placeholder="${st.tab === "hist" ? t("Buscar alumno o nota") : t("Buscar alumno")}" value="${esc(st.q)}" aria-label="${t("Buscar alumno")}"></label>`;

  el.innerHTML = `
  <div class="kpis">
    <div class="kpi"><span class="kpi-ic c2">${icon("cash")}</span><div><b>${money(total, cur)}</b><span>${t("Recaudado en {mes}", {mes: MESES[m - 1]})}</span></div></div>
    <div class="kpi"><span class="kpi-ic c3">${icon("alert")}</span><div><b>${venc.length}</b><span>${t("Vencidos")} · ${t("deben {monto}", {monto: money(totalDeuda, cur)})}</span></div></div>
    <div class="kpi"><span class="kpi-ic c4">${icon("clock")}</span><div><b>${pronto.length}</b><span>${tn(acad.avisoDias ?? 5, "Vencen en 1 día", "Vencen en {n} días")}</span></div></div>
    <div class="kpi"><span class="kpi-ic c1">${icon("check")}</span><div><b>${ok.length}</b><span>${t("Al día")}</span></div></div>
  </div>
  <div class="tabs">
    <button class="tab ${st.tab === "cobrar" ? "on" : ""}" data-tab="cobrar">${icon("check")} ${t("Control de pagos")}</button>
    <button class="tab ${st.tab === "hist" ? "on" : ""}" data-tab="hist">${icon("list")} ${t("Historial del mes")}</button>
  </div>
  ${st.tab === "cobrar" ? `<section class="card">
      <div class="toolbar pay-tools">${search}${conTel.length ? `<button class="btn ghost small" data-remind>${icon("whatsapp")}<span>${t("Recordar a todos los vencidos ({n})", {n: conTel.length})}</span></button>` : ""}</div>
      ${S.pref("qpUsado") ? "" : `<p class="muted small">${t("Toca {check} para marcar que el alumno pagó su plan: se registra el pago y se corre la fecha del próximo cobro. Usa {plus} para un valor o período distinto.", {check: icon("check", "inline"), plus: icon("plus", "inline")})}</p>`}
      ${est.length ? group(t("Vencidos"), venc, "err") + group(t("Por vencer"), pronto, "warn") + group(t("Al día"), ok, "ok") : empty("users", q ? t("Sin resultados") : t("Sin alumnos activos"), q ? t("Prueba con otro nombre.") : t("Los alumnos activos con plan de pago aparecen aquí."))}
    </section>`
  : `<section class="card">
      <div class="month-nav"><button class="icon-btn" data-m="-1" aria-label="${t("Mes anterior")}">${icon("back")}</button><b>${MESES[m - 1]} ${y}</b><button class="icon-btn" data-m="1" aria-label="${t("Mes siguiente")}">${icon("chevron")}</button>
        <span class="grow"></span><button class="btn ghost small" data-csv>${icon("download")} CSV</button></div>
      <div class="toolbar">${search}</div>
      ${Object.keys(porMetodo).length ? `<div class="methods">${Object.entries(porMetodo).map(([k, v]) => `<span class="tag">${esc(t(k))}: <b>${money(v, cur)}</b></span>`).join("")}</div>` : ""}
      ${histList.length ? `<div class="list">${histList.map(p => { const a = S.get("alumnos", p.alumnoId); return `<div class="li" data-editp="${p.id}" role="button" tabindex="0">${a ? avatar(a, 36) : `<span class="li-ic">${icon("cash")}</span>`}<div class="li-main"><b>${esc(a?.nombre || t("Alumno eliminado"))}</b><span class="muted small">${fmtDate(p.fecha)} · ${esc(t(p.concepto || ""))} · ${esc(t(p.metodo || ""))}${p.hasta ? " · " + t("hasta {fecha}", {fecha: fmtDate(p.hasta)}) : ""}${p.nota ? " · " + esc(p.nota) : ""}</span></div><b class="amount">${money(p.monto, cur)}</b></div>`; }).join("")}</div>`
        : delMes.length ? empty("search", t("Sin resultados"), t("Prueba con otro nombre.")) : empty("cash", t("Sin pagos este mes"), t("Los pagos registrados aparecen aquí."))}
    </section>`}`;

  el.onclick = e => {
    const tg = e.target;
    const tb = tg.closest("[data-tab]"); if(tb){ st.tab = tb.dataset.tab; render(el); return; }
    const mm = tg.closest("[data-m]"); if(mm){ st.mes = addMonths(mes + "-01", +mm.dataset.m).slice(0, 7); if(st.mes === today().slice(0, 7)) st.mes = null; render(el); return; }
    const p = tg.closest("[data-pay]"); if(p){ const a = S.get("alumnos", p.dataset.pay); p.classList.contains("on") ? paymentModal(a) : quickPay(a); return; }
    const mo = tg.closest("[data-more]"); if(mo){ paymentModal(S.get("alumnos", mo.dataset.more)); return; }
    const w = tg.closest("[data-wa]"); if(w){ S.put("alumnos", {id: w.dataset.wa, recordado: today()}); return; }
    const mn = tg.closest("[data-menu]"); if(mn){ const x = est.find(x => x.a.id === mn.dataset.menu); if(x) rowMenu(x, wa(x)); return; }
    if(tg.closest("[data-remind]")){ remindAll(conTel.map(x => x.a)); return; }
    const ep = tg.closest("[data-editp]"); if(ep){ const pg = S.get("pagos", ep.dataset.editp); const a = pg && S.get("alumnos", pg.alumnoId); if(a) paymentModal(a, pg); return; }
    if(tg.closest("[data-csv]")){
      const rows = [[t("Fecha"), t("Alumno"), t("Concepto"), t("Método"), t("Valor"), t("Desde"), t("Hasta"), t("Nota")]];
      for(const p of delMes) rows.push([p.fecha, S.get("alumnos", p.alumnoId)?.nombre || "", p.concepto, p.metodo, p.monto, p.desde || "", p.hasta || "", p.nota || ""]);
      download(`pagos-${mes}.csv`, csv(rows), "text/csv;charset=utf-8");
    }
  };
  el.onkeydown = e => { if((e.key === "Enter" || e.key === " ") && e.target.matches("[data-editp]")){ e.preventDefault(); e.target.click(); } };
  const pq = el.querySelector("#pq");
  if(pq){ pq.oninput = e => { st.q = e.target.value; st.f = true; render(el); }; if(st.f){ st.f = false; pq.focus(); pq.setSelectionRange(st.q.length, st.q.length); } }
}

/* menú ⋯ de una fila (móvil): WhatsApp y otro monto */
function rowMenu(x, w){
  const body = h(`<div class="act-sheet">
    ${w ? `<a class="act-it" href="${esc(w)}" target="_blank" rel="noopener" data-a="wa">${icon("whatsapp")}<span>${t("Recordar por WhatsApp")}</span></a>` : ""}
    <button type="button" class="act-it" data-a="more">${icon("plus")}<span>${t("Registrar otro pago")}</span></button>
    <a class="act-it" href="#/alumno/${x.a.id}" data-a="ver">${icon("users")}<span>${t("Ver perfil")}</span></a>
  </div>`);
  const m = modal({title: x.a.nombre, body, foot: false, cls: "sheet"});
  body.onclick = e => {
    const b = e.target.closest("[data-a]"); if(!b) return;
    if(b.dataset.a === "wa") S.put("alumnos", {id: x.a.id, recordado: today()});
    m.close();
    if(b.dataset.a === "more") paymentModal(x.a);
  };
}

/* recordatorio en lote: plantilla editable y «Siguiente» abre el WhatsApp del próximo */
function remindAll(list){
  const enviados = new Set();
  const body = h(`<div class="form remind">
    <div class="field"><label class="lbl" for="rtpl">${t("Mensaje")}</label><textarea id="rtpl" rows="4">${esc(tplCobro())}</textarea>
    <small class="hint">${t("Variables: {nombre} {valor} {dias} {academia}. Se guarda para la próxima vez.")}</small></div>
    <div class="field"><span class="lbl">${tn(list.length, "1 alumno vencido con teléfono", "{n} alumnos vencidos con teléfono")}</span><div class="list remind-list">${list.map(a => { const rt = recTxt(a); return `<label class="li remind-it" data-id="${a.id}"><input type="checkbox" value="${a.id}" ${diasRecordado(a) === 0 ? "" : "checked"}>${avatar(a, 32)}<span class="li-main"><b>${esc(a.nombre)}</b><span class="muted small">${esc(rt || t("Sin recordatorio previo"))}</span></span><span class="remind-ok" hidden>${icon("check")}</span></label>`; }).join("")}</div></div>
  </div>`);
  const m = modal({title: t("Recordar a los vencidos"), body,
    foot: `<button class="btn ghost" data-close>${t("Cerrar")}</button><button class="btn primary" data-next>${icon("whatsapp")} <span></span></button>`});
  const ta = body.querySelector("#rtpl"), nb = m.foot.querySelector("[data-next]");
  const cola = () => [...body.querySelectorAll(".remind-it input:checked")].map(i => i.value).filter(id => !enviados.has(id));
  const upd = () => { const n = cola().length; nb.querySelector("span").textContent = n ? t("Siguiente ({n} pendientes)", {n}) : t("Listo"); };
  body.addEventListener("change", upd);
  ta.onchange = () => S.setPref("msg_cobro", ta.value);
  nb.onclick = () => {
    const id = cola()[0];
    if(!id){ m.close(); if(enviados.size) toast(tn(enviados.size, "1 recordatorio enviado", "{n} recordatorios enviados")); return; }
    S.setPref("msg_cobro", ta.value);
    const a = S.get("alumnos", id), url = a && waLink(a.telefono || a.acudienteTel, msgCobro(ta.value, a));
    if(url) window.open(url, "_blank", "noopener");
    S.put("alumnos", {id, recordado: today()});
    enviados.add(id);
    const it = body.querySelector(`.remind-it[data-id="${id}"]`);
    it.classList.add("sent"); it.querySelector(".remind-ok").hidden = false; it.querySelector(".muted").textContent = t("Recordado hoy");
    upd();
  };
  upd();
}
