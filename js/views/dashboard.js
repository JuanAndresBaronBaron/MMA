import * as S from "../store.js";
import * as Sync from "../sync.js";
import * as UI from "../ui.js";
import {icon, avatar, belt, pill, rankLabel, toast, confirmDlg} from "../ui.js";
const haptic = k => { try{ UI.haptic && UI.haptic(k); }catch(e){} };
import {esc, money, today, fmtDate, MESES, parseISO, waLink, addMonths, addDays, fmtMonth, relDays, daysBetween} from "../util.js";
import {studentForm, quickPay} from "../forms.js";
import {GEAR} from "../catalog.js";
import {loadDemo, removeDemo, hasDemo} from "../demo.js";
import {deuda, pillTxt, estadoPago, estadoEf} from "../cobros.js";
import * as C from "../cobros.js";
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
  const activos = als.filter(a => estadoEf(a) === "activo");
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
    {ok: real("clases"), txt: t("Arma tu horario de clases"), sub: t("Cada día se abre sola la clase que empieza para pasar lista."), href: "#/horario"},
    {ok: real("leads"), txt: t("Anota tu primer prospecto"), sub: t("Quien pregunta por clases: la app te recuerda cuándo escribirle."), href: "#/leads?nuevo=1"},
    {ok: Sync.connected(), txt: t("Conecta Google Drive"), sub: t("Copia automática y uso en varios aparatos."), href: "#/ajustes"},
  ];
  const nOk = steps.filter(s => s.ok).length;
  const hideKey = "setupHide:" + acad.id;
  const showSetup = nOk < steps.length && !S.pref(hideKey, false);
  const demoBtn = !demo ? `<button type="button" class="btn ghost" data-demo>${icon("users")} ${t("Probar con datos de ejemplo")}</button>` : "";
  /* con datos de ejemplo, primeros pasos queda en una línea (se abre con un toque) */
  const setupMini = demo && !S.pref("setupOpen", false);
  const pctSetup = Math.round(nOk / steps.length * 100);
  const setupMiniRow = showSetup && setupMini ? `<button type="button" class="row-inset dash-note setup-mini" data-setup-open aria-expanded="false"><span class="row-ic" style="--rc:var(--chip-brass)">${icon("star")}</span><span class="dash-note-t">${t("Primeros pasos · {a}/{b}", {a: nOk, b: steps.length})}</span><span class="setup-mini-bar" aria-hidden="true"><i style="width:${pctSetup}%"></i></span>${icon("chevron", "dash-note-go")}</button>` : "";
  const setup = !showSetup || setupMini ? ""
  : `<section class="card setup" aria-labelledby="setupH">
    <header class="card-h"><h3 id="setupH">${icon("star")} ${t("Primeros pasos")}</h3>${demo ? `<button type="button" class="btn-link" data-setup-close>${t("Contraer")}</button>` : ""}<button type="button" class="icon-btn gray" data-setup-hide aria-label="${t("Ocultar primeros pasos")}" title="${t("Ocultar")}">${icon("x")}</button></header>
    <div class="setup-prog"><div class="setup-bar"><span style="width:${pctSetup}%"></span></div><span class="muted small">${t("{a} de {b} listos", {a: nOk, b: steps.length})}</span></div>
    <ol class="setup-list">${steps.map((s, i) => {
      const inner = `<span class="setup-ck tnum" aria-hidden="true">${s.ok ? icon("check") : i + 1}</span><span class="setup-tx"><b>${esc(s.txt)}</b><span class="muted small">${esc(s.sub)}</span></span>${s.ok ? `<span class="dash-sr">${t("Hecho")}</span>` : icon("chevron", "setup-go")}`;
      return `<li class="${s.ok ? "done" : ""}">${s.act ? `<button type="button" class="setup-i" ${s.act}>${inner}</button>` : `<a class="setup-i" href="${s.href}">${inner}</a>`}</li>`;
    }).join("")}</ol>
    ${demoBtn ? `<div class="setup-demo"><p class="muted small">${t("¿Quieres ver cómo se ve con una academia llena? Carga alumnos ficticios y quítalos cuando quieras.")}</p>${demoBtn}</div>` : ""}
  </section>`;
  const demoBar = demo ? `<div class="row-inset dash-note demo-bar" role="status"><span class="row-ic" style="--rc:var(--chip-steel)">${icon("info")}</span><span class="dash-note-t">${t("Estás viendo datos de ejemplo")}</span><button type="button" class="btn small tinted" data-undemo>${t("Quitar")}</button></div>` : "";

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
  /* la fecha va como antetítulo sobre el título grande del shell (como Fitness / Salud) */
  const eyebrow = () => {
    const lt = document.querySelector(".lt-wrap"), h = lt && lt.querySelector("#title");
    if(!h) return null;
    document.getElementById("dashEyebrow")?.remove();
    const p = document.createElement("p");
    p.id = "dashEyebrow"; p.className = "dash-eyebrow"; p.textContent = fecha;
    h.before(p);
    return () => p.remove();
  };
  const done = unsub => { const off = eyebrow(); return () => { off && off(); unsub && unsub(); }; };

  if(!todos.length){
    el.innerHTML = (setup || `<section class="card">${emptyS({icon: "users", title: t("Bienvenido a {academia}", {academia: acad.nombre}), text: t("Empieza agregando a tus alumnos. Puedes subir su foto, registrar su cinturón actual y su plan de pago."),
      cta: `<div class="row gap wrap dash-empty-cta"><button type="button" class="btn primary" data-new>${icon("plus")} ${t("Agregar primer alumno")}</button>${demoBtn}</div>`})}</section>`);
    bind();
    return done(watchSync());
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
  const delta = (v, txt, title) => `<small class="kpi-sub delta ${v > 0 ? "up" : v < 0 ? "down" : ""}" title="${esc(title || "")}"><span aria-hidden="true">${v > 0 ? "↑" : v < 0 ? "↓" : "="}</span> ${txt}</small>`;
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

  /* baldosa tipo Salud: ficha de color + etiqueta arriba, cifra grande tabular, nota abajo */
  const KC = {c1: "steel", c2: "olive", c3: "crimson", c4: "brass", c5: "burnt", c6: "gunmetal"};
  const kpi = (ic, c, val, label, sub, attrs = "", tag = "div") => `<${tag} class="dstat ${c}" style="--rc:var(--chip-${KC[c]})" ${attrs}><span class="dstat-h"><span class="row-ic" aria-hidden="true">${icon(ic)}</span><span class="dstat-l">${label}</span>${icon("chevron", "dstat-go")}</span><b class="dstat-v" title="${esc(String(val).replace(/<[^>]+>/g, ""))}">${val}</b>${sub || `<small class="kpi-sub">&nbsp;</small>`}</${tag}>`;

  const cCobros = `<section class="card">
      <header class="card-h"><h3 style="--sc:var(--ok)">${icon("cash")} ${t("Cobros pendientes")}</h3><a class="btn-link" href="#/pagos">${t("Ver todos")}</a></header>
      ${venc.length + pronto.length ? `<div class="list">${[...venc, ...pronto].slice(0, 8).map(payRow).join("")}</div>` : emptyS({icon: "check", tone: "ok", title: t("Todo al día"), text: t("No hay pagos vencidos ni por vencer esta semana.")})}
    </section>`;
  const cIngresos = `<section class="card">
      <header class="card-h"><h3 style="--sc:var(--accent2)">${icon("cash")} ${t("Ingresos últimos 6 meses")}</h3>${prom ? `<span class="muted small">${t("Promedio {v}", {v: esc(moneyC(prom, cur))})}</span>` : ""}</header>
      <div class="dchart" role="img" aria-label="${esc(months.map((m, i) => `${fmtMonth(m)}: ${money(inc[i], cur)}`).join(", "))}">
        <div class="dc-plot"><div class="dc-area">
          ${prom ? `<div class="dc-avg" style="bottom:${(prom / maxInc * 100).toFixed(1)}%"></div>` : ""}
          ${months.map((m, i) => { const hp = Math.round(inc[i] / maxInc * 100); return `<div class="dc-col ${i === 5 ? "cur" : ""}"><span class="dc-v" style="bottom:calc(${hp}% + 4px)">${inc[i] ? esc(moneyC(inc[i], cur)) : ""}</span><div class="dc-bar" style="height:${hp}%"></div></div>`; }).join("")}
        </div></div>
        <div class="dc-x">${months.map((m, i) => `<span>${fmtMonth(m)}${i === 5 ? `<small>${t("en curso")}</small>` : ""}</span>`).join("")}</div>
      </div>
    </section>`;
  /* las 3 oportunidades más grandes */
  const opps = [{k: "gi", n: sinGi, txt: t("sin gi (BJJ / Judo)")}, {k: "bucal", n: sinBucal, txt: t("sin protector bucal")},
    ...GEAR.filter(g => !["gi", "bucal"].includes(g.k)).map(g => ({k: g.k, n: activos.filter(a => !a.equipo?.[g.k]?.tiene).length, txt: t("sin {equipo}", {equipo: t(g.n).toLowerCase()})}))]
    .filter(o => o.n > 0).sort((a, b) => b.n - a.n);
  const cOpps = !opps.length ? "" : `<section class="card">
      <header class="card-h"><h3 style="--sc:var(--gold)">${icon("bag")} ${t("Oportunidades de venta")}</h3><a class="btn-link" href="#/tienda">${t("Ver todos")}</a></header>
      <div class="opps dash-opps">${opps.slice(0, 3).map(o => `<a href="#/tienda/${o.k}" class="opp"><b>${o.n}</b><span>${esc(o.txt)}</span></a>`).join("")}</div>
    </section>`;
  const cAus = !ausentes.length ? "" : `<section class="card warn-card" id="dashRet">
      <header class="card-h"><h3 style="--sc:var(--warn)">${icon("clock")} ${t("Hace tiempo no vienen")}</h3><span class="count-b">${ausentes.length}</span></header>
      <div class="list">${ausentes.slice(0, 8).map(x => {
        const msg = t("Hola {nombre}, te extrañamos en {academia}. ¿Todo bien? Te esperamos en la próxima clase.", {nombre: nom1(x.a), academia: acad.nombre});
        return `<div class="li"><a class="li-link" href="#/alumno/${x.a.id}">${avatar(x.a, 38)}<div class="li-main"><b>${esc(x.a.nombre)}</b><span class="muted small">${x.u ? tn(x.d, "Última clase hace 1 día", "Última clase hace {n} días") : t("Sin asistencias registradas")}</span></div></a>
          <div class="li-act"><span class="dash-days" aria-hidden="true">${x.d}d</span>${waA(waLink(x.a.telefono || x.a.acudienteTel, msg), t("Escribir a {nombre} por WhatsApp", {nombre: x.a.nombre}))}</div></div>`;
      }).join("")}</div>
      ${ausentes.length > 8 ? `<p class="muted small dash-more">${tn(ausentes.length - 8, "y 1 más", "y {n} más")}</p>` : ""}
    </section>`;
  const cListos = !listos.length ? "" : `<section class="card">
      <header class="card-h"><h3 style="--sc:var(--gold)">${icon("belt")} ${t("Listos para promoción")}</h3><a class="btn-link" href="#/grados">${t("Ver grados")}</a></header>
      <div class="list">${listos.slice(0, 8).map(x => {
        const g = S.rangoActual(x.a.id, x.d.id);
        return `<a class="li" href="#/alumno/${x.a.id}">${avatar(x.a, 38)}<div class="li-main"><b>${esc(x.a.nombre)}</b><span class="muted small"><span class="dot" style="background:${x.d.color}"></span>${esc(t(x.d.nombre))}</span><span class="small dash-next">${x.n.tipo === "grado" ? t("Siguiente: {grado}", {grado: esc(x.n.txt)}) : t("Próximo cinturón: {cinturon}", {cinturon: esc(x.n.txt)})}</span></div><span class="li-belt">${belt(x.d, g.rank, g.grado, {w: 74, h: 14})}</span></a>`;
      }).join("")}</div>
    </section>`;
  const cRapidas = !rapidas.length ? "" : `<section class="card warn-card">
      <header class="card-h"><h3 style="--sc:var(--warn)">${icon("alert")} ${t("Promociones antes de tiempo")}</h3>${rapidas.length > 3 ? `<a class="btn-link" href="#/grados">${t("Ver todos ({n})", {n: rapidas.length})}</a>` : `<span class="muted small">${t("último año")}</span>`}</header>
      <div class="list">${rapidas.slice(0, 3).map(x => `<a class="li" href="#/alumno/${x.a.id}">${avatar(x.a, 38)}<div class="li-main"><b>${esc(x.a.nombre)} · ${esc(rankLabel(x.d, x.g))}</b><span class="muted small">${esc(x.avisos[0].txt)}</span></div><span class="muted small">${fmtDate(x.g.fecha)}</span></a>`).join("")}</div>
    </section>`;
  const cCumple = !cumple.length ? "" : `<section class="card">
      <header class="card-h"><h3 style="--sc:var(--accent2)">${icon("cake")} ${t("Próximos cumpleaños")}</h3><span class="muted small">${t("30 días")}</span></header>
      <div class="list">${cumple.slice(0, 8).map(x => {
        const msg = t("¡Feliz cumpleaños, {nombre}! Todo el equipo de {academia} te desea un gran año.", {nombre: nom1(x.a), academia: acad.nombre});
        return `<div class="li ${x.dd === 0 ? "bday-hoy" : ""}"><a class="li-link" href="#/alumno/${x.a.id}">${avatar(x.a, 38)}<div class="li-main"><b>${esc(x.a.nombre)}</b><span class="muted small">${t("{dia} de {mes}", {dia: x.b.getDate(), mes: MESES[x.b.getMonth()]})} · ${t("cumple {edad}", {edad: x.edad})}</span></div></a>
          <div class="li-act">${x.dd === 0 ? pill("aldia", t("¡Hoy!")) : `<span class="muted small">${relDays(x.dd)}</span>`}${waA(waLink(x.a.telefono || x.a.acudienteTel, msg), t("Felicitar a {nombre} por WhatsApp", {nombre: x.a.nombre}))}</div></div>`;
      }).join("")}</div>
    </section>`;
  const cDist = !discs.length ? "" : `<section class="card">
      <header class="card-h"><h3 style="--sc:var(--gold)">${icon("trophy")} ${t("Alumnos por cinturón")}</h3><a class="btn-link" href="#/ranking">${t("Ranking")}</a></header>
      ${discs.map(d => {
        const counts = d.ranks.map(() => 0);
        for(const a of activos) if((a.disciplinaIds || []).includes(d.id)){ const g = S.rangoActual(a.id, d.id); if(g) counts[g.rank]++; }
        const tot = counts.reduce((s, c) => s + c, 0);
        return `<div class="dist"><div class="dist-h"><span><span class="dot" style="background:${d.color}"></span>${esc(t(d.nombre))}</span><span class="muted small">${tn(tot, "1 alumno", "{n} alumnos")}</span></div>
          <div class="dist-bar">${tot ? counts.map((c, i) => c ? `<span style="flex:${c};background:${d.ranks[i].c}" title="${esc(t(d.ranks[i].n))}: ${c}"></span>` : "").join("") : `<span class="none"></span>`}</div></div>`;
      }).join("")}
    </section>`;

  /* ---------- prospectos ---------- */
  const leads = S.inAcad("leads").filter(l => !sede || !l.sedeId || l.sedeId === sede);
  const fLead = l => l.fecha || new Date(l._c || 0).toISOString().slice(0, 10);
  const leads30 = leads.filter(l => fLead(l) >= addDays(hoy, -29)).length;
  const l90 = leads.filter(l => fLead(l) >= addDays(hoy, -89));
  const conv = l90.length ? Math.round(l90.filter(l => l.etapa === "inscrito").length / l90.length * 100) : null;
  const pruebasHoy = leads.filter(l => l.prueba === hoy && !["inscrito", "perdido"].includes(l.etapa));
  const nuevosL = leads.filter(l => (l.etapa || "nuevo") === "nuevo").length;
  const lStat = (n, txt, href) => `<a class="dl-st" href="${href}"><b>${n}</b><span>${esc(txt)}</span></a>`;
  const cLeads = `<section class="card">
      <header class="card-h"><h3 style="--sc:var(--info)">${icon("userPlus")} ${t("Prospectos")}</h3><a class="btn-link" href="#/leads">${t("Ver todos")}</a></header>
      ${leads.length ? `<div class="dl-stats">${lStat(nuevosL, t("nuevos por contactar"), "#/leads")}${lStat(pruebasHoy.length, t("pruebas hoy"), "#/leads")}${lStat(conv === null ? "–" : conv + "%", t("conversión 90 días"), "#/leads")}</div>
        ${pruebasHoy.length ? `<div class="list">${pruebasHoy.slice(0, 4).map(l => `<a class="li" href="#/leads?lead=${l.id}"><span class="li-ic">${icon("calendar")}</span><div class="li-main"><b>${esc(l.nombre)}</b><span class="muted small">${t("Clase de prueba hoy")}${l.claseId && S.get("clases", l.claseId) ? " · " + esc(S.get("clases", l.claseId).hora || "") : ""}</span></div>${icon("chevron")}</a>`).join("")}</div>` : ""}`
      : `<p class="muted small dash-p">${t("Anota a cada persona que pregunta por clases y la app te recuerda cuándo escribirle.")}</p><a class="btn ghost small" href="#/leads?nuevo=1">${icon("plus")} ${t("Nuevo prospecto")}</a>`}
    </section>`;

  /* ---------- cumpleaños de hoy: aviso arriba ---------- */
  const cumpleHoy = cumple.filter(x => x.dd === 0);
  const bdayBar = !cumpleHoy.length ? "" : `<div class="row-inset dash-note dash-bday" role="status"><span class="row-ic" style="--rc:var(--chip-crimson)">${icon("cake")}</span><span class="dash-note-t">${cumpleHoy.length === 1 ? t("Hoy cumple {nombre} ({edad})", {nombre: esc(cumpleHoy[0].a.nombre), edad: cumpleHoy[0].edad}) : t("Hoy cumplen {nombres}", {nombres: esc(cumpleHoy.map(x => nom1(x.a)).join(", "))})}</span>
    ${cumpleHoy.length === 1 ? waA(waLink(cumpleHoy[0].a.telefono || cumpleHoy[0].a.acudienteTel, t("¡Feliz cumpleaños, {nombre}! Todo el equipo de {academia} te desea un gran año.", {nombre: nom1(cumpleHoy[0].a), academia: acad.nombre})), t("Felicitar a {nombre} por WhatsApp", {nombre: cumpleHoy[0].a.nombre})) : ""}</div>`;

  let incRows = null;
  const slot = k => `<div class="dash-slot" data-slot="${k}"></div>`;
  /* ---------- héroe de hoy: anillos (cobrado / al día / asistencia 7 días) ---------- */
  let rowMes = null;
  try{ if(typeof C.ingresos12 === "function"){ const r = C.ingresos12(); rowMes = r && r[r.length - 1]; } }catch(e){ rowMes = null; }
  const cob = rowMes ? rowMes.cobrado || 0 : mes, esp = rowMes ? rowMes.esperado || 0 : mes + porCobrar;
  const alDia = activos.length - venc.length;
  const ids7 = new Set(), desde7 = addDays(hoy, -6), actIds = new Set(activos.map(a => a.id));
  for(const r of asisAcad) if(r.fecha >= desde7 && r.fecha <= hoy) for(const id of r.presentes || []) if(actIds.has(id)) ids7.add(id);
  const P = (a, b) => b ? Math.round(a / b * 100) : 0;
  const rings = [
    {k: "cob", c: "var(--system-red)", tc: "accent", p: P(cob, esp), l: t("Cobrado"), v: esc(moneyC(cob, cur)), of: esp ? esc(moneyC(esp, cur)) : "", href: "#/pagos"},
    {k: "dia", c: "var(--system-green)", tc: "ok", p: P(alDia, activos.length), l: t("Al día"), v: alDia, of: activos.length, href: "#/pagos"},
    {k: "asis", c: "var(--system-cyan)", tc: "info", p: asisAcad.length ? P(ids7.size, activos.length) : 0, l: t("Vinieron (7 días)"), v: asisAcad.length ? ids7.size : "–", of: asisAcad.length ? activos.length : "", href: "#/asistencia"},
  ];
  const R0 = [52, 37, 22];
  const ringSvg = `<svg class="dh-rings" viewBox="0 0 120 120" aria-hidden="true"><g transform="rotate(-90 60 60)">${rings.map((r, i) => `<circle class="dr-track" cx="60" cy="60" r="${R0[i]}" style="--rc:${r.c}"/><circle class="dr-val ${r.p ? "" : "zero"}" cx="60" cy="60" r="${R0[i]}" pathLength="100" style="--rc:${r.c};--off:${100 - Math.min(100, r.p)};--d:${i * 120}ms"/>`).join("")}</g></svg>`;
  const hero = `<section class="card dash-hero" aria-labelledby="dhT">
    <div class="dh-top"><div class="dh-hi"><h2 id="dhT">${t("Hola, {academia}", {academia: esc(acad.nombre)})}</h2>
      <p>${hoyN ? `<a href="#/pagos" class="dh-due">${icon("clock")}${tn(hoyN, "1 cobro vence hoy", "{n} cobros vencen hoy")}</a>` : t("Ningún cobro vence hoy")}</p></div>
      <div class="dh-act"><a class="btn primary" href="#/asistencia">${icon("calendar")} ${t("Pasar lista")}</a><button type="button" class="btn gray dash-new" data-new>${icon("plus")} ${t("Nuevo alumno")}</button></div></div>
    <div class="dh-body" role="img" aria-label="${esc(rings.map(r => `${r.l}: ${String(r.v).replace(/<[^>]+>/g, "")}${r.of !== "" ? " / " + String(r.of).replace(/<[^>]+>/g, "") : ""}`).join(", "))}">
      ${ringSvg}
      <ul class="dh-leg">${rings.map(r => `<li class="${r.tc}"><span class="dh-l">${r.l}</span><b class="dh-v">${r.v}${r.of !== "" ? `<small>/${r.of}</small>` : ""}</b><span class="dh-p">${r.of !== "" ? r.p + "%" : t("Aún no tomas asistencia")}</span></li>`).join("")}</ul>
    </div>
  </section>`;
  const notes = [demoBar, bdayBar, setupMiniRow].filter(Boolean).join("");

  el.innerHTML = `${hero}${notes ? `<div class="grouped dash-notes">${notes}</div>` : ""}${setup}${slot("install")}
  <div class="dash-kpis">
    ${kpi("users", "c1", activos.length, t("Alumnos activos"), altas ? delta(altas, t("{n} este mes", {n: altas})) : `<small class="kpi-sub">${t("Sin altas este mes")}</small>`, `href="#/alumnos"`, "a")}
    ${kpi("cash", "c2", esc(moneyC(mes, cur)), t("Recaudado en {mes}", {mes: MESES[mesN]}), recSub, `href="#/pagos"`, "a")}
    ${kpi("alert", "c3", venc.length, t("Pagos vencidos"), porCobrar ? `<small class="kpi-sub err-t">${t("{v} por cobrar", {v: esc(moneyC(porCobrar, cur))})}</small>` : "", `href="#/pagos"`, "a")}
    ${kpi("belt", "c4", listos.length, t("Listos para promoción"), "", `href="#/grados"`, "a")}
    ${kpi("clock", "c5", asisAcad.length ? ausentes.length : "–", t("Sin venir +{n} días", {n: AUS}), asisAcad.length ? "" : `<small class="kpi-sub">${t("Aún no tomas asistencia")}</small>`, ausentes.length ? `type="button" data-goto="dashRet"` : `href="#/asistencia"`, ausentes.length ? "button" : "a")}
    ${kpi("userPlus", "c6", leads30, t("Prospectos (30 días)"), pruebasHoy.length ? `<small class="kpi-sub ok-t">${tn(pruebasHoy.length, "1 prueba hoy", "{n} pruebas hoy")}</small>` : "", `href="#/leads"`, "a")}
  </div>
  <div class="dash-cols">
    <div class="dash-col">${slot("clases")}${cCobros}${cAus}${cListos}${slot("ingresos")}</div>
    <div class="dash-col">${slot("riesgo")}${cLeads}${slot("tds")}${slot("frase")}${cCumple}${cRapidas}${cOpps}${cDist}</div>
  </div>
  <button type="button" class="fab only-m" data-new aria-label="${t("Nuevo alumno")}">${icon("plus")}</button>`;
  bind();
  tarjetas();
  return done(watchSync());

  /* ---------- tarjetas de otros módulos: cada una se carga aparte y, si su módulo falta, no sale ---------- */
  function poner(k, html, after){
    const s = el.querySelector(`[data-slot="${k}"]`); if(!s) return;
    if(!html){ s.remove(); return; }
    const tpl = document.createElement("template"); tpl.innerHTML = html.trim();
    const node = tpl.content.firstElementChild;
    s.replaceWith(node); after && after(node);
  }
  function tarjetas(){
    const carga = (k, imp, fn) => imp.then(m => { if(el.isConnected) poner(k, ...[].concat(fn(m))); }).catch(err => { if(!/dynamically imported|Failed to fetch|Importing a module/i.test(err?.message || "")) console.warn(err); poner(k, ""); });
    carga("clases", import("../clases.js"), cardClases);
    carga("riesgo", import("../retencion.js"), cardRiesgo);
    carga("tds", import("../entreno/semana.js"), cardTds);
    carga("frase", import("./frases.js"), m => m.dailyCard ? m.dailyCard() : "");
    carga("install", import("../install.js"), m => [m.installCardHTML ? m.installCardHTML() : "", n => m.bindInstallCard && m.bindInstallCard(n)]);
    if(typeof C.ingresos12 === "function") Promise.resolve().then(() => poner("ingresos", cardIngresos(C.ingresos12()))).catch(err => { console.warn(err); poner("ingresos", cIngresos); });
    else poner("ingresos", cIngresos);
  }
  function cardClases(m){
    if(!S.clases().length) return "";
    const hoyCl = m.clasesHoy(hoy, sede), prox = m.proximaClase(sede), ahora = new Date();
    const hm = d => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    return `<section class="card dash-cl">
      <header class="card-h"><h3 style="--sc:var(--info)">${icon("clock")} ${t("Clases de hoy")}</h3><a class="btn-link" href="#/horario">${t("Horario")}</a></header>
      ${hoyCl.length ? `<div class="list">${hoyCl.map(x => {
        const n = m.presentesClase(hoy, x.clase), pasada = x.fin <= ahora, esProx = prox && prox.clase.id === x.clase.id;
        const cuando = esProx ? (prox.enMin <= 0 ? t("ahora") : prox.enMin < 60 ? t("en {n} min", {n: prox.enMin}) : "") : "";
        return `<div class="li dash-cl-row ${pasada ? "past" : ""} ${esProx ? "next" : ""}"><span class="dash-cl-h"><b>${esc(hm(x.inicio))}</b><small>${esc(hm(x.fin))}</small></span>
          <div class="li-main"><b><span class="dot" style="background:${esc(x.disc.color || "#888")}"></span>${esc(m.nombreClase ? m.nombreClase(x.clase, x.disc) : t(x.disc.nombre))}</b><span class="muted small">${x.clase.cupo ? t("{n}/{cupo} presentes", {n, cupo: x.clase.cupo}) : tn(n, "{n} presente", "{n} presentes")}${x.clase.instructor ? " · " + esc(x.clase.instructor) : ""}</span></div>
          <div class="li-act">${cuando ? `<span class="pill ${prox.enMin <= 0 ? "aldia" : "pronto"}">${esc(cuando)}</span>` : ""}<a class="btn small ${esProx ? "primary" : "ghost"}" href="#/asistencia?clase=${x.clase.id}&fecha=${hoy}">${icon("check")}<span>${t("Pasar lista")}</span></a></div></div>`;
      }).join("")}</div>` : `<p class="muted small dash-p">${t("Hoy no hay clases en el horario.")}</p>`}
    </section>`;
  }
  function cardRiesgo(m){
    const lista = m.listaRiesgo(20, sede).filter(x => x.nivel !== "bajo");
    if(!lista.length) return "";
    return `<section class="card">
      <header class="card-h"><h3 style="--sc:var(--err)">${icon("alert")} ${t("En riesgo de irse")}</h3><span class="count-b">${lista.length}</span></header>
      <div class="list">${lista.slice(0, 5).map(x => `<div class="li"><a class="li-link" href="#/alumno/${x.al.id}">${avatar(x.al, 38)}<div class="li-main"><b>${esc(x.al.nombre)}</b><span class="muted small">${esc(x.motivos.slice(0, 2).join(" · "))}</span></div></a>
        <div class="li-act"><span class="risk ${x.nivel}" title="${t("Riesgo")}">${x.score}</span>${waA(waLink(x.al.telefono || x.al.acudienteTel, x.script), t("Escribir a {nombre} por WhatsApp", {nombre: x.al.nombre}))}</div></div>`).join("")}</div>
      ${lista.length > 5 ? `<button type="button" class="btn-link dash-more" data-dif="riesgo">${icon("whatsapp", "inline")} ${t("Escribirles a todos ({n})", {n: lista.length})}</button>` : ""}
    </section>`;
  }
  function cardTds(m){
    const x = m.tdsActual && m.tdsActual({fecha: new Date(), pin: acad.tds || null});
    if(!x) return "";
    return `<section class="card dash-tds">
      <header class="card-h"><h3 style="--sc:var(--accent2)">${icon("target")} ${t("Técnica de la semana")}</h3>${x.arte ? `<span class="tag">${esc(String(x.arte).toUpperCase())}</span>` : ""}</header>
      <b class="dash-tds-f">${esc(x.foco || "")}</b>
      ${Array.isArray(x.claves) && x.claves.length ? `<ul class="dash-tds-k">${x.claves.slice(0, 3).map(k => `<li>${esc(k)}</li>`).join("")}</ul>` : ""}
      ${x.reto ? `<p class="muted small dash-p">${icon("flame", "inline")} ${esc(x.reto)}</p>` : ""}
      ${x.arte && x.mod ? `<a class="btn ghost small" href="#/entreno/${esc(x.arte)}/${esc(x.mod)}">${icon("book")} ${t("Ver en Entrenamiento")}</a>` : ""}
    </section>`;
  }
  /* 12 meses: cobrado (línea) frente a esperado (guía punteada); un toque muestra el mes */
  function cardIngresos(rows){
    if(!Array.isArray(rows) || !rows.length) return cIngresos;
    incRows = rows;
    const W = 320, H = 96, P = 6, n = rows.length;
    const max = Math.max(1, ...rows.map(r => Math.max(r.cobrado || 0, r.esperado || 0)));
    const x = i => P + i * (W - 2 * P) / Math.max(1, n - 1), y = v => H - P - (v || 0) / max * (H - 2 * P);
    const path = k => rows.map((r, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(r[k]).toFixed(1)}`).join("");
    const last = rows[n - 1], tot = rows.reduce((s, r) => s + (r.cobrado || 0), 0);
    const pctR = last.esperado ? Math.round(last.cobrado / last.esperado * 100) : null;
    return `<section class="card dash-inc">
      <header class="card-h"><h3 style="--sc:var(--accent2)">${icon("chart")} ${t("Ingresos 12 meses")}</h3><a class="btn-link" href="#/reportes">${t("Reportes")}</a></header>
      <div class="dash-inc-n"><div><b>${esc(moneyC(last.cobrado, cur))}</b><span class="muted small">${t("cobrado este mes")}${pctR !== null ? ` · ${t("{p}% de lo esperado", {p: pctR})}` : ""}</span></div><div><b>${esc(moneyC(tot, cur))}</b><span class="muted small">${t("en 12 meses")}</span></div></div>
      <div class="spark" role="img" aria-label="${esc(rows.map(r => `${fmtMonth(r.ym)}: ${money(r.cobrado, cur)} / ${money(r.esperado, cur)}`).join(", "))}">
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
          <path d="${path("esperado")}" class="sp-exp" vector-effect="non-scaling-stroke"/>
          <path d="${path("cobrado")}L${x(n - 1)} ${H - P}L${x(0)} ${H - P}Z" class="sp-area"/>
          <path d="${path("cobrado")}" class="sp-line" vector-effect="non-scaling-stroke"/>
        </svg>
        <span class="sp-dot" style="left:${(x(n - 1) / W * 100).toFixed(2)}%;top:${(y(last.cobrado) / H * 100).toFixed(2)}%"></span>
        <div class="sp-hit">${rows.map((r, i) => `<button type="button" data-sp="${i}" aria-label="${esc(fmtMonth(r.ym))}"></button>`).join("")}</div>
        <div class="sp-tip" hidden></div>
      </div>
      <div class="sp-x"><span>${esc(fmtMonth(rows[0].ym))}</span><span class="sp-leg"><i class="l1"></i>${t("Cobrado")}<i class="l2"></i>${t("Esperado")}</span><span>${esc(fmtMonth(last.ym))}</span></div>
    </section>`;
  }

  function bind(){
    el.onpointerover = e => { const b = e.target.closest?.("[data-sp]"); if(b && e.pointerType === "mouse") tip(b); };
    el.onclick = async e => {
      const tg = e.target;
      const p = tg.closest("[data-pay]"); if(p){ e.preventDefault(); quickPay(S.get("alumnos", p.dataset.pay)); return; }
      if(tg.closest("[data-new]")){ studentForm(null); return; }
      if(tg.closest("[data-setup-open]")){ haptic("selection"); S.setPref("setupOpen", true); rerender(); return; }
      if(tg.closest("[data-setup-close]")){ S.setPref("setupOpen", false); rerender(); return; }
      const df = tg.closest("[data-dif]"); if(df){ import("../difusion.js").then(m => m.openDifusion({segmento: df.dataset.dif})).catch(() => {}); return; }
      const sp = tg.closest("[data-sp]"); if(sp){ haptic("selection"); tip(sp); return; }
      const g = tg.closest("[data-goto]"); if(g){ haptic("light"); const smooth = !matchMedia("(prefers-reduced-motion: reduce)").matches; document.getElementById(g.dataset.goto)?.scrollIntoView({behavior: smooth ? "smooth" : "auto", block: "start"}); return; }
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
  /* globo del gráfico de 12 meses */
  function tip(b){
    const r = incRows && incRows[+b.dataset.sp], box = b.closest(".spark"); if(!r || !box) return;
    const tp = box.querySelector(".sp-tip");
    for(const o of box.querySelectorAll("[data-sp]")) o.classList.toggle("on", o === b);
    tp.innerHTML = `<b>${esc(fmtMonth(r.ym))}</b><span>${t("Cobrado")}: ${esc(money(r.cobrado, cur))}</span><span>${t("Esperado")}: ${esc(money(r.esperado, cur))}</span>`;
    tp.hidden = false;
    const i = +b.dataset.sp, n = incRows.length;
    tp.style.left = `${Math.min(80, Math.max(20, i / Math.max(1, n - 1) * 100))}%`;
  }
  /* el paso "Conecta Google" se marca solo cuando cambia la conexión */
  function watchSync(){
    if(!showSetup) return null;
    const was = Sync.connected();
    return Sync.onStatus(() => { if(Sync.connected() !== was) setTimeout(rerender); });
  }
}
