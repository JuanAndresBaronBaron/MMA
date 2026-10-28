import * as S from "../store.js";
import {icon, avatar, belt, empty, pill, rankLabel} from "../ui.js";
import {esc, money, today, fmtDate, MESES, parseISO, waLink, addMonths, fmtMonth, relDays, daysBetween, age} from "../util.js";
import {studentForm, quickPay, promotionModal} from "../forms.js";
import {GEAR} from "../catalog.js";
import {t, tn} from "../i18n.js";

export function render(el){
  const acad = S.academy(), cur = acad.moneda || "COP";
  const als = S.alumnos();
  const activos = als.filter(a => a.estado === "activo");
  const hoy = today(), ym = hoy.slice(0, 7);
  const sede = S.curSede();
  const pagos = S.inAcad("pagos").filter(p => !sede || p.sedeId === sede);
  const mes = pagos.filter(p => (p.fecha || "").startsWith(ym)).reduce((s, p) => s + (Number(p.monto) || 0), 0);
  const est = activos.map(a => ({a, e: S.estadoPago(a, acad.avisoDias ?? 5)}));
  const venc = est.filter(x => x.e.k === "vencido").sort((x, y) => x.e.dias - y.e.dias);
  const pronto = est.filter(x => x.e.k === "pronto").sort((x, y) => x.e.dias - y.e.dias);
  const porCobrar = venc.reduce((s, x) => s + S.valorPlan(x.a), 0);
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
  const mesN = parseISO(hoy).getMonth();
  const cumple = activos.filter(a => a.nacimiento && parseISO(a.nacimiento)?.getMonth() === mesN).sort((x, y) => parseISO(x.nacimiento).getDate() - parseISO(y.nacimiento).getDate());
  const sinGi = activos.filter(a => !a.equipo?.gi?.tiene && (a.disciplinaIds || []).some(id => /jiu|bjj|judo|kids/i.test(S.get("disciplinas", id)?.nombre || ""))).length;
  const sinBucal = activos.filter(a => !a.equipo?.bucal?.tiene).length;

  /* ingresos 6 meses */
  const months = Array.from({length: 6}, (_, i) => addMonths(ym + "-01", i - 5).slice(0, 7));
  const inc = months.map(m => pagos.filter(p => (p.fecha || "").startsWith(m)).reduce((s, p) => s + (Number(p.monto) || 0), 0));
  const maxInc = Math.max(1, ...inc);

  if(!S.alumnos({todos: true}).length){
    el.innerHTML = `<section class="hero card">
      <div><h2>${t("Bienvenido a {academia}", {academia: esc(acad.nombre)})}</h2><p class="muted">${t("Empieza agregando a tus alumnos. Puedes subir su foto, registrar su cinturón actual y su plan de pago.")}</p>
      <div class="row gap"><button class="btn primary" data-new>${icon("plus")} ${t("Agregar primer alumno")}</button><a class="btn ghost" href="#/academia">${icon("building")} ${t("Configurar sedes y disciplinas")}</a></div></div>
    </section>`;
    el.querySelector("[data-new]").onclick = () => studentForm(null);
    return;
  }

  const row = (x, right) => `<a class="li" href="#/alumno/${x.a.id}">${avatar(x.a, 38)}<div class="li-main"><b>${esc(x.a.nombre)}</b><span class="muted small">${right}</span></div>`;
  const payRow = x => {
    const vars = {nombre: x.a.nombre.split(" ")[0], academia: acad.nombre, fecha: fmtDate(x.e.vence), valor: money(S.valorPlan(x.a), cur)};
    const msg = x.e.dias < 0 ? t("Hola {nombre}, te recordamos que tu mensualidad en {academia} venció el {fecha}. Valor: {valor}. ¡Gracias!", vars) : t("Hola {nombre}, te recordamos que tu mensualidad en {academia} vence el {fecha}. Valor: {valor}. ¡Gracias!", vars);
    const wa = waLink(x.a.telefono || x.a.acudienteTel, msg);
    return `${row(x, `${pill(x.e.k, x.e.txt)} · ${money(S.valorPlan(x.a), cur)}`)}
      <span class="li-act">${wa ? `<span class="icon-btn wa" data-wa="${esc(wa)}" title="${t("Recordar por WhatsApp")}">${icon("whatsapp")}</span>` : ""}<span class="icon-btn ok" data-pay="${x.a.id}" title="${t("Marcar como pagado")}">${icon("check")}</span></span></a>`;
  };

  el.innerHTML = `
  <div class="kpis">
    <div class="kpi"><span class="kpi-ic c1">${icon("users")}</span><div><b>${activos.length}</b><span>${t("Alumnos activos")}</span></div></div>
    <div class="kpi"><span class="kpi-ic c2">${icon("cash")}</span><div><b>${money(mes, cur)}</b><span>${t("Recaudado en {mes}", {mes: MESES[mesN]})}</span></div></div>
    <a class="kpi" href="#/pagos"><span class="kpi-ic c3">${icon("alert")}</span><div><b>${venc.length}</b><span>${t("Pagos vencidos")} · ${money(porCobrar, cur)}</span></div></a>
    <a class="kpi" href="#/grados"><span class="kpi-ic c4">${icon("belt")}</span><div><b>${listos.length}</b><span>${t("Listos para promoción")}</span></div></a>
  </div>
  <div class="grid2">
    <section class="card">
      <header class="card-h"><h3>${icon("cash")} ${t("Cobros pendientes")}</h3><a class="btn-link" href="#/pagos">${t("Ver todos")}</a></header>
      ${venc.length + pronto.length ? `<div class="list">${[...venc, ...pronto].slice(0, 8).map(payRow).join("")}</div>` : empty("check", t("Todo al día"), t("No hay pagos vencidos ni por vencer esta semana."))}
    </section>
    <section class="card">
      <header class="card-h"><h3>${icon("belt")} ${t("Listos para promoción")}</h3><a class="btn-link" href="#/grados">${t("Ver grados")}</a></header>
      ${listos.length ? `<div class="list">${listos.slice(0, 8).map(x => {
        const g = S.rangoActual(x.a.id, x.d.id);
        return `<a class="li" href="#/alumno/${x.a.id}">${avatar(x.a, 38)}<div class="li-main"><b>${esc(x.a.nombre)}</b><span class="muted small"><span class="dot" style="background:${x.d.color}"></span>${esc(t(x.d.nombre))} · ${x.n.tipo === "grado" ? t("Siguiente: {grado}", {grado: esc(x.n.txt)}) : t("Próximo cinturón: {cinturon}", {cinturon: esc(x.n.txt)})}</span></div><span class="li-belt">${belt(x.d, g.rank, g.grado, {w: 74, h: 14})}</span></a>`;
      }).join("")}</div>` : empty("clock", t("Nadie todavía"), t("Aquí aparecen los alumnos que ya cumplen el tiempo mínimo para su siguiente grado."))}
    </section>
    <section class="card">
      <header class="card-h"><h3>${icon("cash")} ${t("Ingresos últimos 6 meses")}</h3></header>
      <div class="bars">${months.map((m, i) => `<div class="bar-col"><span class="bar-v">${inc[i] ? money(inc[i], cur).replace(/\s/g, "") : ""}</span><div class="bar" style="height:${Math.round(inc[i] / maxInc * 100)}%"></div><span class="bar-l">${fmtMonth(m)}</span></div>`).join("")}</div>
    </section>
    <section class="card">
      <header class="card-h"><h3>${icon("trophy")} ${t("Alumnos por cinturón")}</h3><a class="btn-link" href="#/ranking">${t("Ranking")}</a></header>
      ${discs.length ? discs.map(d => {
        const counts = d.ranks.map(() => 0);
        for(const a of activos) if((a.disciplinaIds || []).includes(d.id)){ const g = S.rangoActual(a.id, d.id); if(g) counts[g.rank]++; }
        const tot = counts.reduce((s, c) => s + c, 0);
        return `<div class="dist"><div class="dist-h"><span><span class="dot" style="background:${d.color}"></span>${esc(t(d.nombre))}</span><span class="muted small">${tn(tot, "1 alumno", "{n} alumnos")}</span></div>
          <div class="dist-bar">${tot ? counts.map((c, i) => c ? `<span style="flex:${c};background:${d.ranks[i].c}" title="${esc(t(d.ranks[i].n))}: ${c}"></span>` : "").join("") : `<span class="none"></span>`}</div></div>`;
      }).join("") : `<p class="muted">${t("Sin disciplinas.")}</p>`}
    </section>
    ${rapidas.length ? `<section class="card warn-card">
      <header class="card-h"><h3>${icon("alert")} ${t("Promociones muy seguidas (último año)")}</h3></header>
      <div class="list">${rapidas.slice(0, 6).map(x => `<a class="li" href="#/alumno/${x.a.id}">${avatar(x.a, 38)}<div class="li-main"><b>${esc(x.a.nombre)} · ${esc(rankLabel(x.d, x.g))}</b><span class="muted small">${esc(x.avisos[0].txt)}</span></div><span class="muted small">${fmtDate(x.g.fecha)}</span></a>`).join("")}</div>
    </section>` : ""}
    <section class="card">
      <header class="card-h"><h3>${icon("cake")} ${t("Cumpleaños de {mes}", {mes: MESES[mesN]})}</h3></header>
      ${cumple.length ? `<div class="list">${cumple.map(a => { const d = parseISO(a.nacimiento); const thisY = `${hoy.slice(0, 4)}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; const dd = daysBetween(hoy, thisY);
        return `<a class="li" href="#/alumno/${a.id}">${avatar(a, 38)}<div class="li-main"><b>${esc(a.nombre)}</b><span class="muted small">${t("{dia} de {mes}", {dia: d.getDate(), mes: MESES[d.getMonth()]})} · ${t("cumple {edad}", {edad: (age(a.nacimiento) || 0) + (dd > 0 ? 1 : 0)})}</span></div>${dd === 0 ? pill("aldia", t("¡Hoy!")) : `<span class="muted small">${relDays(dd)}</span>`}</a>`; }).join("")}</div>` : `<p class="muted small">${t("Nadie cumple años este mes (o falta la fecha de nacimiento).")}</p>`}
    </section>
    <section class="card">
      <header class="card-h"><h3>${icon("bag")} ${t("Oportunidades de venta")}</h3><a class="btn-link" href="#/tienda">${t("Tienda")}</a></header>
      <div class="opps">
        <a href="#/tienda/gi" class="opp"><b>${sinGi}</b><span>${t("sin gi (BJJ / Judo)")}</span></a>
        <a href="#/tienda/bucal" class="opp"><b>${sinBucal}</b><span>${t("sin protector bucal")}</span></a>
        ${GEAR.filter(g => !["gi", "bucal"].includes(g.k)).slice(0, 2).map(g => `<a href="#/tienda/${g.k}" class="opp"><b>${activos.filter(a => !a.equipo?.[g.k]?.tiene).length}</b><span>${t("sin {equipo}", {equipo: esc(t(g.n).toLowerCase())})}</span></a>`).join("")}
      </div>
    </section>
  </div>
  <button class="fab" data-new aria-label="${t("Nuevo alumno")}">${icon("plus")}</button>`;

  el.querySelector("[data-new]").onclick = () => studentForm(null);
  el.onclick = e => {
    const p = e.target.closest("[data-pay]"); if(p){ e.preventDefault(); quickPay(S.get("alumnos", p.dataset.pay)); return; }
    const w = e.target.closest("[data-wa]"); if(w){ e.preventDefault(); window.open(w.dataset.wa, "_blank", "noopener"); }
  };
}
