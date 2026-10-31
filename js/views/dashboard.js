import * as S from "../store.js";
import * as Sync from "../sync.js";
import * as UI from "../ui.js";
import {icon, avatar, belt, pill, rankLabel, toast, confirmDlg} from "../ui.js";
import {esc, money, today, fmtDate, MESES, parseISO, waLink, addMonths, fmtMonth, relDays, daysBetween} from "../util.js";
import {studentForm, quickPay} from "../forms.js";
import {GEAR} from "../catalog.js";
import {loadDemo, removeDemo, hasDemo} from "../demo.js";
import {deuda, pillTxt, estadoPago} from "../cobros.js";
import {t, tn, locale} from "../i18n.js";

const AUS = 14; /* días sin venir para la tarjeta de retención */

/* dinero compacto: $1,5 M */
function moneyC(v, cur = "COP"){
  try{ return new Intl.NumberFormat(locale(), {style: "currency", currency: cur, currencyDisplay: "narrowSymbol", notation: "compact", maximumFractionDigits: 1}).format(Number(v) || 0); }
  catch(e){ return money(v, cur); }
}
/* emptyState de ui.js (W1) con respaldo local */
const emptyS = o => UI.emptyState ? UI.emptyState(o)
  : `<div class="empty dash-empty"><span class="dash-empty-ic">${icon(o.icon || "info")}</span><h3>${esc(o.title)}</h3><p>${esc(o.text || "")}</p>${o.cta || ""}</div>`;
const pct = (a, b) => Math.round((a - b) / b * 100);

export function render(el, params, ctx){
  const acad = S.academy(), cur = acad.moneda || "COP";
  const als = S.alumnos();
  const activos = als.filter(a => a.estado === "activo");
  const hoy = today(), ym = hoy.slice(0, 7), mesN = parseISO(hoy).getMonth();
  const sede = S.curSede();
  const pagos = S.inAcad("pagos").filter(p => !sede || p.sedeId === sede);
  const sum = ps => ps.reduce((s, p) => s + (Number(p.monto) || 0), 0);
  const demo = hasDemo();
  const rerender = () => ctx && ctx.render ? ctx.render(true) : render(el, params, ctx);

  /* ---------- primeros pasos (solo datos reales, sin los de ejemplo) ---------- */
  const todos = S.alumnos({todos: true, sede: ""});
  const real = c => S.inAcad(c).some(r => !r.demo);
  const asisAcad = S.all("asistencias").filter(a => !a.academiaId || a.academiaId === acad.id);
  const steps = [
    {ok: S.disciplinas().length > 0, txt: t("Revisa tus disciplinas y tiempos de cinturón"), sub: t("Cinturones, grados y meses mínimos para cada uno."), href: "#/academia"},
    {ok: todos.some(a => !a.demo), txt: t("Agrega tu primer alumno"), sub: t("Foto, cinturón actual y plan de pago."), act: "data-new"},
    {ok: real("pagos"), txt: t("Registra un pago"), sub: t("Así sabrás quién está al día y quién debe."), href: "#/pagos"},
    {ok: asisAcad.some(a => !a.demo), txt: t("Toma asistencia de una clase"), sub: t("Un toque por alumno; sirve para ver quién dejó de venir."), href: "#/asistencia"},
    {ok: Sync.connected(), txt: t("Conecta Google Drive"), sub: t("Copia automática y uso en varios aparatos."), href: "#/ajustes"},
  ];
  const nOk = steps.filter(s => s.ok).length;
  const hideKey = "setupHide:" + acad.id;
  const showSetup = nOk < steps.length && !S.pref(hideKey, false);
  const demoBtn = !demo ? `<button type="button" class="btn ghost" data-demo>${icon("users")} ${t("Probar con datos de ejemplo")}</button>` : "";
  const setup = !showSetup ? "" : `<section class="card setup" aria-labelledby="setupH">
    <header class="card-h"><h3 id="setupH">${icon("star")} ${t("Primeros pasos")}</h3><button type="button" class="icon-btn" data-setup-hide aria-label="${t("Ocultar primeros pasos")}" title="${t("Ocultar")}">${icon("x")}</button></header>
    <div class="setup-prog"><div class="setup-bar"><span style="width:${Math.round(nOk / steps.length * 100)}%"></span></div><span class="muted small">${t("{a} de {b} listos", {a: nOk, b: steps.length})}</span></div>
    <ol class="setup-list">${steps.map((s, i) => {
      const inner = `<span class="setup-ck" aria-hidden="true">${s.ok ? icon("check") : i + 1}</span><span class="setup-tx"><b>${esc(s.txt)}</b><span class="muted small">${esc(s.sub)}</span></span>${s.ok ? `<span class="dash-sr">${t("Hecho")}</span>` : icon("chevron", "setup-go")}`;
      return `<li class="${s.ok ? "done" : ""}">${s.act ? `<button type="button" class="setup-i" ${s.act}>${inner}</button>` : `<a class="setup-i" href="${s.href}">${inner}</a>`}</li>`;
    }).join("")}</ol>
    ${demoBtn ? `<div class="setup-demo"><p class="muted small">${t("¿Quieres ver cómo se ve con una academia llena? Carga alumnos ficticios y quítalos cuando quieras.")}</p>${demoBtn}</div>` : ""}
  </section>`;
  const demoBar = demo ? `<div class="demo-bar" role="status">${icon("info")}<span>${t("Estás viendo datos de ejemplo")}</span><button type="button" class="btn-link" data-undemo>${t("Quitar")}</button></div>` : "";

  /* ---------- cobros ---------- */
  const est = activos.map(a => ({a, e: estadoPago(a, acad.avisoDias ?? 5)}));
  const venc = est.filter(x => x.e.k === "vencido").sort((x, y) => x.e.dias - y.e.dias);
  const pronto = est.filter(x => x.e.k === "pronto").sort((x, y) => x.e.dias - y.e.dias);
  const hoyN = pronto.filter(x => x.e.dias === 0).length;
  venc.forEach(x => x.d = deuda(x.a));
  const porCobrar = venc.reduce((s, x) => s + (x.d.monto || S.valorPlan(x.a)), 0);

  /* ---------- encabezado ---------- */
  let fecha = hoy;
  try{ fecha = new Date().toLocaleDateString(locale(), {weekday: "long", day: "numeric", month: "long"}); }catch(e){}
  const head = `<header class="dash-h">
    <div class="dash-hi"><h2>${t("Hola, {academia}", {academia: esc(acad.nombre)})}</h2>
      <p class="muted"><span class="dash-date">${esc(fecha)}</span>${todos.length ? ` · ${hoyN ? `<a href="#/pagos" class="warn-t">${tn(hoyN, "1 cobro vence hoy", "{n} cobros vencen hoy")}</a>` : t("Ningún cobro vence hoy")}` : ""}</p></div>
    ${todos.length ? `<div class="dash-h-act"><a class="btn primary" href="#/asistencia">${icon("calendar")} ${t("Pasar lista")}</a><button type="button" class="btn ghost dash-new" data-new>${icon("plus")} ${t("Nuevo alumno")}</button></div>` : ""}
  </header>`;

  if(!todos.length){
    el.innerHTML = head + (setup || `<section class="card">${emptyS({icon: "users", title: t("Bienvenido a {academia}", {academia: acad.nombre}), text: t("Empieza agregando a tus alumnos. Puedes subir su foto, registrar su cinturón actual y su plan de pago."),
      cta: `<div class="row gap wrap dash-empty-cta"><button type="button" class="btn primary" data-new>${icon("plus")} ${t("Agregar primer alumno")}</button>${demoBtn}</div>`})}</section>`);
    bind();
    return watchSync();
  }

  /* ---------- promociones ---------- */
  const discs = S.discsOfSede(sede);
  const listos = [];
  for(const a of activos) for(const did of a.disciplinaIds || []){
    const d = S.get("disciplinas", did); if(!d) continue;
    const n = S.siguiente(a.id, d);
    if(n && n.listo) listos.push({a, d, n});
  }
  listos.sort((x, y) => (y.n.meses - y.n.min) - (x.n.meses - x.n.min));
  /* promociones con poco tiempo, último año */
  const rapidas = [];
  const desde = addMonths(hoy, -12);
  for(const a of als) for(const did of a.disciplinaIds || []){
    const d = S.get("disciplinas", did); if(!d) continue;
    for(const r of S.promocionesRapidas(a.id, d)) if(r.g.fecha >= desde) rapidas.push({a, d, ...r});
  }
  rapidas.sort((x, y) => y.g.fecha.localeCompare(x.g.fecha));

  /* ---------- retención: activos sin venir hace 14+ días ---------- */
  const ult = new Map();
  let primera = null;
  for(const r of asisAcad){
    if(!primera || r.fecha < primera) primera = r.fecha;
    for(const id of r.presentes || []) if(!ult.has(id) || r.fecha > ult.get(id)) ult.set(id, r.fecha);
  }
  const ausentes = !asisAcad.length ? [] : activos.map(a => {
    const u = ult.get(a.id);
    const ref = u || [a.fechaInicio, primera].filter(Boolean).sort().pop() || primera;
    return {a, u, d: daysBetween(ref, hoy)};
  }).filter(x => x.d >= AUS).sort((x, y) => y.d - x.d);

  /* ---------- cumpleaños: próximos 30 días ---------- */
  const cumple = activos.map(a => {
    const b = parseISO(a.nacimiento); if(!b) return null;
    const y = +hoy.slice(0, 4), md = a.nacimiento.slice(4, 10);
    let next = `${y}${md}`;
    if(!parseISO(next) || next < hoy) next = `${y + 1}${md}`;
    if(md === "-02-29" && new Date(+next.slice(0, 4), 1, 29).getMonth() !== 1) next = `${next.slice(0, 4)}-02-28`;
    return {a, b, dd: daysBetween(hoy, next), edad: +next.slice(0, 4) - b.getFullYear()};
  }).filter(x => x && x.dd >= 0 && x.dd <= 30).sort((x, y) => x.dd - y.dd);

  const sinGi = activos.filter(a => !a.equipo?.gi?.tiene && (a.disciplinaIds || []).some(id => /jiu|bjj|judo|kids/i.test(S.get("disciplinas", id)?.nombre || ""))).length;
  const sinBucal = activos.filter(a => !a.equipo?.bucal?.tiene).length;

  /* ---------- KPI: mes actual frente a los mismos días del mes anterior ---------- */
  const mes = sum(pagos.filter(p => (p.fecha || "").startsWith(ym)));
  const prevYm = addMonths(ym + "-01", -1).slice(0, 7), mesP = new Date(+prevYm.slice(0, 4), +prevYm.slice(5) - 1, 1).getMonth();
  const prevCorte = addMonths(hoy, -1);
  const prev = sum(pagos.filter(p => (p.fecha || "").startsWith(prevYm) && p.fecha <= prevCorte));
  const altas = activos.filter(a => (a.fechaInicio || "").startsWith(ym)).length;
  const delta = (v, txt, title) => `<small class="kpi-sub delta ${v > 0 ? "up" : v < 0 ? "down" : ""}" title="${esc(title || "")}">${v > 0 ? "▲" : v < 0 ? "▼" : "="} ${txt}</small>`;
  const recSub = prev ? delta(pct(mes, prev), t("{p}% vs. {mes}", {p: Math.abs(pct(mes, prev)), mes: MESES[mesP].slice(0, 3)}), t("Comparado con los mismos días de {mes}", {mes: MESES[mesP]})) : `<small class="kpi-sub">${esc(money(mes, cur))}</small>`;

  /* ---------- ingresos 6 meses ---------- */
  const months = Array.from({length: 6}, (_, i) => addMonths(ym + "-01", i - 5).slice(0, 7));
  const inc = months.map(m => sum(pagos.filter(p => (p.fecha || "").startsWith(m))));
  const maxInc = Math.max(1, ...inc);
  const cerrados = inc.slice(0, 5).filter(v => v > 0);
  const prom = cerrados.length ? cerrados.reduce((s, v) => s + v, 0) / cerrados.length : 0;

  const waA = (href, label) => href ? `<a class="icon-btn wa" href="${esc(href)}" target="_blank" rel="noopener" aria-label="${esc(label)}" title="${esc(label)}">${icon("whatsapp")}</a>` : "";
  const nom1 = a => a.nombre.split(" ")[0];
  const payRow = x => {
    const monto = (x.d && x.d.monto) || S.valorPlan(x.a);
    const vars = {nombre: nom1(x.a), academia: acad.nombre, fecha: fmtDate(x.e.vence), valor: money(monto, cur)};
    const msg = x.e.dias < 0 ? t("Hola {nombre}, te recordamos que tu mensualidad en {academia} venció el {fecha}. Valor: {valor}. ¡Gracias!", vars) : t("Hola {nombre}, te recordamos que tu mensualidad en {academia} vence el {fecha}. Valor: {valor}. ¡Gracias!", vars);
    return `<div class="li dash-row"><a class="li-link" href="#/alumno/${x.a.id}">${avatar(x.a, 38)}<div class="li-main"><b>${esc(x.a.nombre)}</b><span class="small">${pill(x.e.k, x.d ? pillTxt(x.a, x.e, x.d) : x.e.txt)}</span><span class="muted small dash-amt">${esc(money(monto, cur))}</span></div></a>
      <div class="li-act">${waA(waLink(x.a.telefono || x.a.acudienteTel, msg), t("Recordar a {nombre} por WhatsApp", {nombre: x.a.nombre}))}<button type="button" class="icon-btn ok" data-pay="${x.a.id}" aria-label="${esc(t("Marcar pago de {nombre}", {nombre: x.a.nombre}))}" title="${t("Marcar como pagado")}">${icon("check")}</button></div></div>`;
  };

  const kpi = (ic, c, val, label, sub, attrs = "", tag = "div") => `<${tag} class="kpi" ${attrs}><span class="kpi-ic ${c}">${icon(ic)}</span><div><b title="${esc(String(val).replace(/<[^>]+>/g, ""))}">${val}</b><span>${label}</span>${sub || ""}</div></${tag}>`;

  const cCobros = `<section class="card">
      <header class="card-h"><h3>${icon("cash")} ${t("Cobros pendientes")}</h3><a class="btn-link" href="#/pagos">${t("Ver todos")}</a></header>
      ${venc.length + pronto.length ? `<div class="list">${[...venc, ...pronto].slice(0, 8).map(payRow).join("")}</div>` : emptyS({icon: "check", tone: "ok", title: t("Todo al día"), text: t("No hay pagos vencidos ni por vencer esta semana.")})}
    </section>`;
  const cIngresos = `<section class="card">
      <header class="card-h"><h3>${icon("cash")} ${t("Ingresos últimos 6 meses")}</h3>${prom ? `<span class="muted small">${t("Promedio {v}", {v: esc(moneyC(prom, cur))})}</span>` : ""}</header>
      <div class="dchart" role="img" aria-label="${esc(months.map((m, i) => `${fmtMonth(m)}: ${money(inc[i], cur)}`).join(", "))}">
        <div class="dc-plot"><div class="dc-area">
          ${prom ? `<div class="dc-avg" style="bottom:${(prom / maxInc * 100).toFixed(1)}%"></div>` : ""}
          ${months.map((m, i) => { const hp = Math.round(inc[i] / maxInc * 100); return `<div class="dc-col ${i === 5 ? "cur" : ""}"><span class="dc-v" style="bottom:calc(${hp}% + 4px)">${inc[i] ? esc(moneyC(inc[i], cur)) : ""}</span><div class="dc-bar" style="height:${hp}%"></div></div>`; }).join("")}
        </div></div>
        <div class="dc-x">${months.map((m, i) => `<span>${fmtMonth(m)}${i === 5 ? `<small>${t("en curso")}</small>` : ""}</span>`).join("")}</div>
      </div>
    </section>`;
  const cOpps = `<section class="card">
      <header class="card-h"><h3>${icon("bag")} ${t("Oportunidades de venta")}</h3><a class="btn-link" href="#/tienda">${t("Tienda")}</a></header>
      <div class="opps">
        <a href="#/tienda/gi" class="opp"><b>${sinGi}</b><span>${t("sin gi (BJJ / Judo)")}</span></a>
        <a href="#/tienda/bucal" class="opp"><b>${sinBucal}</b><span>${t("sin protector bucal")}</span></a>
        ${GEAR.filter(g => !["gi", "bucal"].includes(g.k)).slice(0, 2).map(g => `<a href="#/tienda/${g.k}" class="opp"><b>${activos.filter(a => !a.equipo?.[g.k]?.tiene).length}</b><span>${t("sin {equipo}", {equipo: esc(t(g.n).toLowerCase())})}</span></a>`).join("")}
      </div>
    </section>`;
  const cAus = !ausentes.length ? "" : `<section class="card warn-card" id="dashRet">
      <header class="card-h"><h3>${icon("clock")} ${t("Hace tiempo no vienen")}</h3><span class="count-b">${ausentes.length}</span></header>
      <div class="list">${ausentes.slice(0, 8).map(x => {
        const msg = t("Hola {nombre}, te extrañamos en {academia}. ¿Todo bien? Te esperamos en la próxima clase.", {nombre: nom1(x.a), academia: acad.nombre});
        return `<div class="li"><a class="li-link" href="#/alumno/${x.a.id}">${avatar(x.a, 38)}<div class="li-main"><b>${esc(x.a.nombre)}</b><span class="muted small">${x.u ? tn(x.d, "Última clase hace 1 día", "Última clase hace {n} días") : t("Sin asistencias registradas")}</span></div></a>
          <div class="li-act"><span class="dash-days" aria-hidden="true">${x.d}d</span>${waA(waLink(x.a.telefono || x.a.acudienteTel, msg), t("Escribir a {nombre} por WhatsApp", {nombre: x.a.nombre}))}</div></div>`;
      }).join("")}</div>
      ${ausentes.length > 8 ? `<p class="muted small dash-more">${tn(ausentes.length - 8, "y 1 más", "y {n} más")}</p>` : ""}
    </section>`;
  const cListos = !listos.length ? "" : `<section class="card">
      <header class="card-h"><h3>${icon("belt")} ${t("Listos para promoción")}</h3><a class="btn-link" href="#/grados">${t("Ver grados")}</a></header>
      <div class="list">${listos.slice(0, 8).map(x => {
        const g = S.rangoActual(x.a.id, x.d.id);
        return `<a class="li" href="#/alumno/${x.a.id}">${avatar(x.a, 38)}<div class="li-main"><b>${esc(x.a.nombre)}</b><span class="muted small"><span class="dot" style="background:${x.d.color}"></span>${esc(t(x.d.nombre))}</span><span class="small dash-next">${x.n.tipo === "grado" ? t("Siguiente: {grado}", {grado: esc(x.n.txt)}) : t("Próximo cinturón: {cinturon}", {cinturon: esc(x.n.txt)})}</span></div><span class="li-belt">${belt(x.d, g.rank, g.grado, {w: 74, h: 14})}</span></a>`;
      }).join("")}</div>
    </section>`;
  const cRapidas = !rapidas.length ? "" : `<section class="card warn-card">
      <header class="card-h"><h3>${icon("alert")} ${t("Promociones muy seguidas (último año)")}</h3></header>
      <div class="list">${rapidas.slice(0, 6).map(x => `<a class="li" href="#/alumno/${x.a.id}">${avatar(x.a, 38)}<div class="li-main"><b>${esc(x.a.nombre)} · ${esc(rankLabel(x.d, x.g))}</b><span class="muted small">${esc(x.avisos[0].txt)}</span></div><span class="muted small">${fmtDate(x.g.fecha)}</span></a>`).join("")}</div>
    </section>`;
  const cCumple = !cumple.length ? "" : `<section class="card">
      <header class="card-h"><h3>${icon("cake")} ${t("Próximos cumpleaños")}</h3><span class="muted small">${t("30 días")}</span></header>
      <div class="list">${cumple.slice(0, 8).map(x => {
        const msg = t("¡Feliz cumpleaños, {nombre}! Todo el equipo de {academia} te desea un gran año.", {nombre: nom1(x.a), academia: acad.nombre});
        return `<div class="li ${x.dd === 0 ? "bday-hoy" : ""}"><a class="li-link" href="#/alumno/${x.a.id}">${avatar(x.a, 38)}<div class="li-main"><b>${esc(x.a.nombre)}</b><span class="muted small">${t("{dia} de {mes}", {dia: x.b.getDate(), mes: MESES[x.b.getMonth()]})} · ${t("cumple {edad}", {edad: x.edad})}</span></div></a>
          <div class="li-act">${x.dd === 0 ? pill("aldia", t("¡Hoy!")) : `<span class="muted small">${relDays(x.dd)}</span>`}${waA(waLink(x.a.telefono || x.a.acudienteTel, msg), t("Felicitar a {nombre} por WhatsApp", {nombre: x.a.nombre}))}</div></div>`;
      }).join("")}</div>
    </section>`;
  const cDist = !discs.length ? "" : `<section class="card">
      <header class="card-h"><h3>${icon("trophy")} ${t("Alumnos por cinturón")}</h3><a class="btn-link" href="#/ranking">${t("Ranking")}</a></header>
      ${discs.map(d => {
        const counts = d.ranks.map(() => 0);
        for(const a of activos) if((a.disciplinaIds || []).includes(d.id)){ const g = S.rangoActual(a.id, d.id); if(g) counts[g.rank]++; }
        const tot = counts.reduce((s, c) => s + c, 0);
        return `<div class="dist"><div class="dist-h"><span><span class="dot" style="background:${d.color}"></span>${esc(t(d.nombre))}</span><span class="muted small">${tn(tot, "1 alumno", "{n} alumnos")}</span></div>
          <div class="dist-bar">${tot ? counts.map((c, i) => c ? `<span style="flex:${c};background:${d.ranks[i].c}" title="${esc(t(d.ranks[i].n))}: ${c}"></span>` : "").join("") : `<span class="none"></span>`}</div></div>`;
      }).join("")}
    </section>`;

  el.innerHTML = `${head}${demoBar}${setup}
  <div class="kpis dash-kpis">
    ${kpi("users", "c1", activos.length, t("Alumnos activos"), altas ? delta(altas, t("{n} este mes", {n: altas})) : `<small class="kpi-sub">${t("Sin altas este mes")}</small>`)}
    ${kpi("cash", "c2", esc(moneyC(mes, cur)), t("Recaudado en {mes}", {mes: MESES[mesN]}), recSub)}
    ${kpi("alert", "c3", venc.length, t("Pagos vencidos"), porCobrar ? `<small class="kpi-sub err-t">${t("{v} por cobrar", {v: esc(moneyC(porCobrar, cur))})}</small>` : "", `href="#/pagos"`, "a")}
    ${kpi("belt", "c4", listos.length, t("Listos para promoción"), "", `href="#/grados"`, "a")}
    ${kpi("clock", "c5", asisAcad.length ? ausentes.length : "—", t("Sin venir +{n} días", {n: AUS}), asisAcad.length ? "" : `<small class="kpi-sub">${t("Aún no tomas asistencia")}</small>`, ausentes.length ? `type="button" data-goto="dashRet"` : `href="#/asistencia"`, ausentes.length ? "button" : "a")}
  </div>
  <div class="dash-cols">
    <div class="dash-col">${cCobros}${cIngresos}${cOpps}</div>
    <div class="dash-col">${cAus}${cListos}${cRapidas}${cCumple}${cDist}</div>
  </div>
  <button type="button" class="fab only-m" data-new aria-label="${t("Nuevo alumno")}">${icon("plus")}</button>`;
  bind();
  return watchSync();

  function bind(){
    el.onclick = async e => {
      const tg = e.target;
      const p = tg.closest("[data-pay]"); if(p){ e.preventDefault(); quickPay(S.get("alumnos", p.dataset.pay)); return; }
      if(tg.closest("[data-new]")){ studentForm(null); return; }
      const g = tg.closest("[data-goto]"); if(g){ document.getElementById(g.dataset.goto)?.scrollIntoView({behavior: "smooth", block: "start"}); return; }
      if(tg.closest("[data-setup-hide]")){ S.setPref(hideKey, true); rerender(); toast(t("Primeros pasos ocultos"), "ok", {label: t("Deshacer"), fn: () => { S.setPref(hideKey, false); rerender(); }}); return; }
      if(tg.closest("[data-demo]")){
        const n = loadDemo();
        if(n) toast(t("Alumnos de ejemplo agregados")); else toast(t("Primero crea una sede y una disciplina en Academia."), "warn");
        return;
      }
      if(tg.closest("[data-undemo]")){
        if(!await confirmDlg(t("Se borran los alumnos, pagos, grados y asistencias de ejemplo. Tus datos reales no se tocan."), {ok: t("Quitar datos de ejemplo"), title: t("¿Quitar datos de ejemplo?")})) return;
        removeDemo(); toast(t("Datos de ejemplo quitados"));
      }
    };
  }
  /* el paso "Conecta Google" se marca solo cuando cambia la conexión */
  function watchSync(){
    if(!showSetup) return null;
    const was = Sync.connected();
    return Sync.onStatus(() => { if(Sync.connected() !== was) setTimeout(rerender); });
  }
}
