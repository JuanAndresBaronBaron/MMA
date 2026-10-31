import * as S from "../store.js";
import {icon, avatar, pill, modal, toast, emptyState, haptic} from "../ui.js";
import {esc, money, today, fmtDate, MESES, addMonths, addDays, waLink, norm, csv, download, h} from "../util.js";
import {paymentModal, quickPay} from "../forms.js";
import {planById} from "../catalog.js";
import {deuda, estadoPago, pillTxt, txtCuotas, tplCobro, msgCobro, diasRecordado, estadoEf, fmtNumRecibo} from "../cobros.js";
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
  const activos = S.alumnos().filter(a => estadoEf(a) === "activo");
  const est = activos.map(a => ({a, e: estadoPago(a, acad.avisoDias ?? 5), d: deuda(a), ult: S.pagosDe(a.id)[0]})).filter(x => !["beca"].includes(x.e.k) && (!q || norm(x.a.nombre).includes(q)));
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
  /* fila tipo Wallet: avatar · nombre + valor / estado + plan y fecha · acciones · ✓ */
  const row = x => {
    const w = wa(x), many = x.e.k === "vencido" && x.d.cuotas > 1, rt = x.e.k !== "aldia" ? recTxt(x.a) : "";
    const meta = [t(planById(x.a.plan).nombre), x.e.vence ? fmtDate(x.e.vence) : ""].filter(Boolean).join(" · ");
    return `<div class="li pv-row">
      <a href="#/alumno/${x.a.id}" class="pv-link">${avatar(x.a, 40)}
        <b class="pv-name">${esc(x.a.nombre)}</b>
        <b class="pv-amt amount ${many ? "err" : ""}" title="${many ? esc(t("Debe {cuotas}", {cuotas: txtCuotas(x.a, x.d.cuotas)})) : ""}">${money(x.e.k === "vencido" ? owed(x) : S.valorPlan(x.a), cur)}</b>
        <span class="pv-meta">${pill(x.e.k, pillTxt(x.a, x.e, x.d))}<span class="pr-tiq" data-tiq="${x.a.id}" hidden></span></span>
        <span class="pv-sub">${esc(meta)}${rt ? ` · <span class="pv-rec">${icon("whatsapp", "inline")}${esc(rt)}</span>` : ""}</span>
      </a>
      <span class="li-act pv-act">${w ? `<a class="icon-btn wa hide-s" href="${esc(w)}" target="_blank" rel="noopener" data-wa="${x.a.id}" title="${t("Recordar por WhatsApp")}" aria-label="${t("Recordar por WhatsApp")}">${icon("whatsapp")}</a>` : `<span class="icon-btn ghost-sp hide-s" aria-hidden="true"></span>`}
      ${x.ult ? `<a class="icon-btn hide-s" href="#/recibo/${x.ult.id}" title="${esc(t("Ver último recibo"))}" aria-label="${esc(t("Ver último recibo"))}">${icon("receipt")}</a>` : `<span class="icon-btn ghost-sp hide-s" aria-hidden="true"></span>`}
      <button class="icon-btn hide-s" data-more="${x.a.id}" title="${t("Registrar otro pago")}" aria-label="${t("Registrar otro pago")}">${icon("plus")}</button>
      <button class="icon-btn only-m pv-dots" data-menu="${x.a.id}" aria-label="${esc(t("Más acciones para {nombre}", {nombre: x.a.nombre}))}"><span aria-hidden="true">•••</span></button>
      <button class="paycheck ${x.e.k === "aldia" ? "on" : ""}" data-pay="${x.a.id}" title="${x.e.k === "aldia" ? t("Al día (toca para registrar el siguiente pago)") : t("Marcar como pagado")}" aria-label="${esc((x.e.k === "aldia" ? t("Al día (toca para registrar el siguiente pago)") : t("Marcar como pagado")) + ": " + x.a.nombre)}">${icon("check")}</button></span>
    </div>`;
  };
  const group = (tt, arr, k) => arr.length ? `<h3 class="section-header pv-h ${k}"><span><i class="pv-dot" aria-hidden="true"></i>${tt}</span><span class="pv-n">${arr.length}</span></h3><div class="card flush pv-list"><div class="list">${arr.map(row).join("")}</div></div>` : "";
  const conTel = venc.filter(x => x.a.telefono || x.a.acudienteTel);
  const search = `<label class="search pv-search">${icon("search")}<input id="pq" type="search" placeholder="${st.tab === "hist" ? t("Buscar alumno o nota") : t("Buscar alumno")}" value="${esc(st.q)}" aria-label="${t("Buscar alumno")}"></label>`;

  /* historial: agrupado por día, como las transacciones de Wallet */
  const hoy = today(), ayer = addDays(hoy, -1);
  const diaTxt = f => f === hoy ? t("Hoy") : f === ayer ? t("Ayer") : fmtDate(f, true);
  const dias = [];
  for(const p of histList){ const last = dias[dias.length - 1]; if(last && last.f === p.fecha) last.ps.push(p); else dias.push({f: p.fecha, ps: [p]}); }
  const txRow = p => { const a = S.get("alumnos", p.alumnoId); const sub = [t(p.concepto || ""), t(p.metodo || ""), p.hasta ? t("hasta {fecha}", {fecha: fmtDate(p.hasta)}) : "", p.nota || ""].filter(Boolean).join(" · ");
    return `<div class="li pv-tx"><button type="button" class="li-link" data-editp="${p.id}">${a ? avatar(a, 40) : `<span class="li-ic">${icon("cash")}</span>`}<div class="li-main"><b>${esc(a?.nombre || t("Alumno eliminado"))}</b><span class="muted small">${esc(sub)}</span></div><b class="amount pv-tx-amt">${money(p.monto, cur)}</b></button><a class="icon-btn pv-rc" href="#/recibo/${p.id}" title="${esc(t("Ver recibo"))}" aria-label="${esc(t("Ver recibo") + (p.num ? " N.º " + fmtNumRecibo(p.num) : ""))}">${icon("receipt")}</a></div>`; };
  const metodos = Object.entries(porMetodo).sort((a, b) => b[1] - a[1]);
  const MC = ["--crimson", "--steel", "--olive", "--brass", "--burnt", "--gunmetal"];
  const nEst = venc.length + pronto.length + ok.length;
  const seg = (k, n) => n ? `<i class="pv-mseg ${k}" style="flex:${n}"></i>` : "";

  const tip = !S.pref("tipPagos") && !S.pref("qpUsado");
  el.innerHTML = `
  <section class="card pv-sum">
    <div class="pv-sum-h">
      <span class="pv-eyebrow">${t("Recaudado en {mes}", {mes: MESES[m - 1]})}</span>
      <b class="pv-big amount">${money(total, cur)}</b>
      <span class="pv-sum-s">${tn(delMes.length, "1 pago", "{n} pagos")}</span>
    </div>
    ${nEst ? `<div class="pv-meter" role="img" aria-label="${esc(`${t("Vencidos")}: ${venc.length}, ${t("Por vencer")}: ${pronto.length}, ${t("Al día")}: ${ok.length}`)}">${seg("err", venc.length)}${seg("warn", pronto.length)}${seg("ok", ok.length)}</div>` : ""}
    <div class="pv-stats">
      <div class="pv-st err"><span class="pv-st-l"><i class="pv-dot" aria-hidden="true"></i>${t("Vencidos")}</span><b class="amount">${venc.length}</b><small class="${totalDeuda ? "" : "z"}">${t("deben {monto}", {monto: money(totalDeuda, cur)})}</small></div>
      <div class="pv-st warn"><span class="pv-st-l"><i class="pv-dot" aria-hidden="true"></i>${t("Por vencer")}</span><b class="amount">${pronto.length}</b><small>${tn(acad.avisoDias ?? 5, "Vencen en 1 día", "Vencen en {n} días")}</small></div>
      <div class="pv-st ok"><span class="pv-st-l"><i class="pv-dot" aria-hidden="true"></i>${t("Al día")}</span><b class="amount">${ok.length}</b><small>${t("Sin deuda")}</small></div>
    </div>
  </section>
  <div class="pv-tabs">
    <div class="seg pv-seg" role="tablist" aria-label="${t("Pagos")}">
      <button type="button" role="tab" aria-selected="${st.tab === "cobrar"}" class="${st.tab === "cobrar" ? "on" : ""}" data-tab="cobrar">${t("Control de pagos")}</button>
      <button type="button" role="tab" aria-selected="${st.tab === "hist"}" class="${st.tab === "hist" ? "on" : ""}" data-tab="hist">${t("Historial del mes")}</button>
    </div>
    <a class="btn gray small pv-rep" href="#/reportes" aria-label="${t("Reportes")}">${icon("chart")}<span>${t("Reportes")}</span></a>
  </div>
  ${st.tab === "cobrar" ? `
    <div class="pv-tools">${search}${conTel.length ? `<button class="btn tinted pv-remind" data-remind>${icon("whatsapp")}<span>${t("Recordar a todos los vencidos ({n})", {n: conTel.length})}</span></button>` : ""}</div>
    ${tip ? `<div class="pay-tip pv-tip" role="note"><span class="pv-tip-ic">${icon("info")}</span><p>${t("Toca {check} para marcar que el alumno pagó su plan: se registra el pago y se corre la fecha del próximo cobro. Usa {plus} para un valor o período distinto.", {check: icon("check", "inline"), plus: icon("plus", "inline")})}</p><button type="button" class="icon-btn gray" data-tipx aria-label="${t("Entendido, ocultar")}">${icon("x")}</button></div>` : ""}
    ${est.length ? group(t("Vencidos"), venc, "err") + group(t("Por vencer"), pronto, "warn") + group(t("Al día"), ok, "ok")
      : `<div class="card">${emptyState({icon: q ? "search" : "users", title: q ? t("Sin resultados") : t("Sin alumnos activos"), text: q ? t("Prueba con otro nombre.") : t("Los alumnos activos con plan de pago aparecen aquí."), tone: q ? "info" : "accent", cta: q ? "" : {label: t("Ir a Alumnos"), href: "#/alumnos"}})}</div>`}`
  : `
    <div class="pv-month">
      <div class="pv-mnav" role="group" aria-label="${t("Mes")}"><button class="icon-btn" data-m="-1" aria-label="${t("Mes anterior")}">${icon("back")}</button><b aria-live="polite">${MESES[m - 1]} ${y}</b><button class="icon-btn" data-m="1" aria-label="${t("Mes siguiente")}">${icon("chevron")}</button></div>
      <button class="btn gray small" data-csv aria-label="${esc(t("Descargar CSV"))}">${icon("download")}<span>CSV</span></button>
    </div>
    ${metodos.length ? `<section class="card pv-mix">
      <div class="pv-mix-h"><span class="pv-eyebrow">${t("Por método de pago")}</span><b class="amount">${money(total, cur)}</b></div>
      <div class="pv-mbar" aria-hidden="true">${metodos.map(([k, v], i) => `<i style="flex:${v};background:var(${MC[i % MC.length]})"></i>`).join("")}</div>
      <ul class="pv-legend">${metodos.map(([k, v], i) => `<li><i style="background:var(${MC[i % MC.length]})" aria-hidden="true"></i><span>${esc(t(k))}</span><b class="amount">${money(v, cur)}</b><em>${total ? Math.round(v / total * 100) : 0} %</em></li>`).join("")}</ul>
    </section>` : ""}
    ${delMes.length ? `<div class="pv-tools">${search}</div>` : ""}
    ${histList.length ? dias.map(d => `<h3 class="section-header pv-day"><span>${esc(diaTxt(d.f))}</span><span class="amount">${money(d.ps.reduce((s, p) => s + (Number(p.monto) || 0), 0), cur)}</span></h3><div class="card flush pv-list"><div class="list">${d.ps.map(txRow).join("")}</div></div>`).join("")
      : `<div class="card">${delMes.length ? emptyState({icon: "search", title: t("Sin resultados"), text: t("Prueba con otro nombre."), tone: "info"}) : emptyState({icon: "cash", title: t("Sin pagos este mes"), text: t("Los pagos registrados aparecen aquí."), tone: "ok"})}</div>`}`}`;

  el.onclick = e => {
    const tg = e.target;
    const tb = tg.closest("[data-tab]");
    if(tb){
      if(tb.dataset.tab === st.tab) return;
      const from = el.querySelector(".pv-seg > button.on")?.getBoundingClientRect();
      st.tab = tb.dataset.tab; haptic("selection"); render(el);
      const on = el.querySelector(".pv-seg > button.on");
      if(on && from && !matchMedia("(prefers-reduced-motion: reduce)").matches){
        const to = on.getBoundingClientRect();
        on.style.setProperty("--seg-dx", (from.left - to.left) + "px");
        on.style.setProperty("--seg-sx", (from.width / to.width).toFixed(3));
        on.classList.add("seg-slide");
        on.addEventListener("animationend", () => on.classList.remove("seg-slide"), {once: true});
      }
      on?.focus({preventScroll: true});
      return;
    }
    if(tg.closest("[data-tipx]")){ S.setPref("tipPagos", true); tg.closest(".pay-tip").remove(); return; }
    if(tg.closest("a[href^='#/recibo/']")) return;
    const mm = tg.closest("[data-m]"); if(mm){ st.mes = addMonths(mes + "-01", +mm.dataset.m).slice(0, 7); if(st.mes === today().slice(0, 7)) st.mes = null; haptic("selection"); render(el); el.querySelector(`[data-m="${mm.dataset.m}"]`)?.focus({preventScroll: true}); return; }
    const p = tg.closest("[data-pay]"); if(p){ const a = S.get("alumnos", p.dataset.pay); haptic("light"); p.classList.contains("on") ? paymentModal(a) : quickPay(a); return; }
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
  el.onkeydown = e => {
    /* flechas en el control segmentado, como en iOS/macOS */
    const tb = e.target.closest?.(".pv-seg > [data-tab]");
    if(tb && (e.key === "ArrowLeft" || e.key === "ArrowRight")){ e.preventDefault(); const k = st.tab === "cobrar" ? "hist" : "cobrar"; el.querySelector(`[data-tab="${k}"]`)?.click(); }
  };
  /* saldo de tiquetera (si el módulo de clases está) */
  const tiqs = el.querySelectorAll("[data-tiq]");
  if(tiqs.length) import("../clases.js").then(C => {
    for(const sp of tiqs){
      const s = C.saldoTiquetera(S.get("alumnos", sp.dataset.tiq)); if(!s || !sp.isConnected) continue;
      const k = s.vencida || s.saldo === 0 ? "vencido" : s.saldo <= 2 ? "pronto" : "aldia";
      sp.outerHTML = pill(k, s.vencida ? t("Tiquetera vencida") : tn(s.saldo, "Tiquetera: 1 clase", "Tiquetera: {n} clases"));
    }
  }).catch(() => {});
  const pq = el.querySelector("#pq");
  if(pq){ pq.oninput = e => { st.q = e.target.value; st.f = true; render(el); }; if(st.f){ st.f = false; pq.focus(); pq.setSelectionRange(st.q.length, st.q.length); } }
}

/* menú ⋯ de una fila (móvil): WhatsApp y otro monto */
function rowMenu(x, w){
  const ult = S.pagosDe(x.a.id)[0];
  const body = h(`<div class="act-sheet">
    ${w ? `<a class="act-it" href="${esc(w)}" target="_blank" rel="noopener" data-a="wa">${icon("whatsapp")}<span>${t("Recordar por WhatsApp")}</span></a>` : ""}
    <button type="button" class="act-it" data-a="more">${icon("plus")}<span>${t("Registrar otro pago")}</span></button>
    ${ult ? `<a class="act-it" href="#/recibo/${ult.id}" data-a="rec">${icon("receipt")}<span>${t("Ver último recibo")}</span></a>
    <a class="act-it" href="#/recibo/${ult.id}?print=1" data-a="rec">${icon("print")}<span>${t("Imprimir último recibo")}</span></a>` : ""}
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
