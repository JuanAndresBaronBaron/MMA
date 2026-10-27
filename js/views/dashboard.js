import * as S from "../store.js";
import {icon, avatar, belt, empty, pill, rankLabel} from "../ui.js";
import {esc, money, today, fmtDate, MESES, parseISO, waLink, addMonths, fmtMonth, relDays, daysBetween, age} from "../util.js";
import {studentForm, quickPay, promotionModal} from "../forms.js";
import {GEAR} from "../catalog.js";

export function render(el){
  const acad = S.academy(), cur = acad.moneda || "COP";
  const als = S.alumnos();
  const activos = als.filter(a => a.estado === "activo");
  const t = today(), ym = t.slice(0, 7);
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
  const desde = addMonths(t, -12);
  for(const a of als) for(const did of a.disciplinaIds || []){
    const d = S.get("disciplinas", did); if(!d) continue;
    for(const r of S.promocionesRapidas(a.id, d)) if(r.g.fecha >= desde) rapidas.push({a, d, ...r});
  }
  rapidas.sort((x, y) => y.g.fecha.localeCompare(x.g.fecha));
  const mesN = parseISO(t).getMonth();
  const cumple = activos.filter(a => a.nacimiento && parseISO(a.nacimiento)?.getMonth() === mesN).sort((x, y) => parseISO(x.nacimiento).getDate() - parseISO(y.nacimiento).getDate());
  const sinGi = activos.filter(a => !a.equipo?.gi?.tiene && (a.disciplinaIds || []).some(id => /jiu|bjj|judo|kids/i.test(S.get("disciplinas", id)?.nombre || ""))).length;
  const sinBucal = activos.filter(a => !a.equipo?.bucal?.tiene).length;

  /* ingresos 6 meses */
  const months = Array.from({length: 6}, (_, i) => addMonths(ym + "-01", i - 5).slice(0, 7));
  const inc = months.map(m => pagos.filter(p => (p.fecha || "").startsWith(m)).reduce((s, p) => s + (Number(p.monto) || 0), 0));
  const maxInc = Math.max(1, ...inc);

  if(!S.alumnos({todos: true}).length){
    el.innerHTML = `<section class="hero card">
      <div><h2>Bienvenido a ${esc(acad.nombre)}</h2><p class="muted">Empieza agregando a tus alumnos. Puedes subir su foto, registrar su cinturón actual y su plan de pago.</p>
      <div class="row gap"><button class="btn primary" data-new>${icon("plus")} Agregar primer alumno</button><a class="btn ghost" href="#/academia">${icon("building")} Configurar sedes y disciplinas</a></div></div>
    </section>`;
    el.querySelector("[data-new]").onclick = () => studentForm(null);
    return;
  }

  const row = (x, right) => `<a class="li" href="#/alumno/${x.a.id}">${avatar(x.a, 38)}<div class="li-main"><b>${esc(x.a.nombre)}</b><span class="muted small">${right}</span></div>`;
  const payRow = x => {
    const msg = `Hola ${x.a.nombre.split(" ")[0]}, te recordamos que tu mensualidad en ${acad.nombre} ${x.e.dias < 0 ? "venció el " + fmtDate(x.e.vence) : "vence el " + fmtDate(x.e.vence)}. Valor: ${money(S.valorPlan(x.a), cur)}. ¡Gracias!`;
    const wa = waLink(x.a.telefono || x.a.acudienteTel, msg);
    return `${row(x, `${pill(x.e.k, x.e.txt)} · ${money(S.valorPlan(x.a), cur)}`)}
      <span class="li-act">${wa ? `<span class="icon-btn wa" data-wa="${esc(wa)}" title="Recordar por WhatsApp">${icon("whatsapp")}</span>` : ""}<span class="icon-btn ok" data-pay="${x.a.id}" title="Marcar como pagado">${icon("check")}</span></span></a>`;
  };

  el.innerHTML = `
  <div class="kpis">
    <div class="kpi"><span class="kpi-ic c1">${icon("users")}</span><div><b>${activos.length}</b><span>Alumnos activos</span></div></div>
    <div class="kpi"><span class="kpi-ic c2">${icon("cash")}</span><div><b>${money(mes, cur)}</b><span>Recaudado en ${MESES[mesN]}</span></div></div>
    <a class="kpi" href="#/pagos"><span class="kpi-ic c3">${icon("alert")}</span><div><b>${venc.length}</b><span>Pagos vencidos · ${money(porCobrar, cur)}</span></div></a>
    <a class="kpi" href="#/grados"><span class="kpi-ic c4">${icon("belt")}</span><div><b>${listos.length}</b><span>Listos para promoción</span></div></a>
  </div>
  <div class="grid2">
    <section class="card">
      <header class="card-h"><h3>${icon("cash")} Cobros pendientes</h3><a class="btn-link" href="#/pagos">Ver todos</a></header>
      ${venc.length + pronto.length ? `<div class="list">${[...venc, ...pronto].slice(0, 8).map(payRow).join("")}</div>` : empty("check", "Todo al día", "No hay pagos vencidos ni por vencer esta semana.")}
    </section>
    <section class="card">
      <header class="card-h"><h3>${icon("belt")} Listos para promoción</h3><a class="btn-link" href="#/grados">Ver grados</a></header>
      ${listos.length ? `<div class="list">${listos.slice(0, 8).map(x => {
        const g = S.rangoActual(x.a.id, x.d.id);
        return `<a class="li" href="#/alumno/${x.a.id}">${avatar(x.a, 38)}<div class="li-main"><b>${esc(x.a.nombre)}</b><span class="muted small"><span class="dot" style="background:${x.d.color}"></span>${esc(x.d.nombre)} · ${x.n.tipo === "grado" ? "Siguiente: " : "Próximo cinturón: "}${esc(x.n.txt)}</span></div><span class="li-belt">${belt(x.d, g.rank, g.grado, {w: 74, h: 14})}</span></a>`;
      }).join("")}</div>` : empty("clock", "Nadie todavía", "Aquí aparecen los alumnos que ya cumplen el tiempo mínimo para su siguiente grado.")}
    </section>
    <section class="card">
      <header class="card-h"><h3>${icon("cash")} Ingresos últimos 6 meses</h3></header>
      <div class="bars">${months.map((m, i) => `<div class="bar-col"><span class="bar-v">${inc[i] ? money(inc[i], cur).replace(/\s/g, "") : ""}</span><div class="bar" style="height:${Math.round(inc[i] / maxInc * 100)}%"></div><span class="bar-l">${fmtMonth(m)}</span></div>`).join("")}</div>
    </section>
    <section class="card">
      <header class="card-h"><h3>${icon("trophy")} Alumnos por cinturón</h3><a class="btn-link" href="#/ranking">Ranking</a></header>
      ${discs.length ? discs.map(d => {
        const counts = d.ranks.map(() => 0);
        for(const a of activos) if((a.disciplinaIds || []).includes(d.id)){ const g = S.rangoActual(a.id, d.id); if(g) counts[g.rank]++; }
        const tot = counts.reduce((s, c) => s + c, 0);
        return `<div class="dist"><div class="dist-h"><span><span class="dot" style="background:${d.color}"></span>${esc(d.nombre)}</span><span class="muted small">${tot} alumnos</span></div>
          <div class="dist-bar">${tot ? counts.map((c, i) => c ? `<span style="flex:${c};background:${d.ranks[i].c}" title="${esc(d.ranks[i].n)}: ${c}"></span>` : "").join("") : `<span class="none"></span>`}</div></div>`;
      }).join("") : `<p class="muted">Sin disciplinas.</p>`}
    </section>
    ${rapidas.length ? `<section class="card warn-card">
      <header class="card-h"><h3>${icon("alert")} Promociones muy seguidas (último año)</h3></header>
      <div class="list">${rapidas.slice(0, 6).map(x => `<a class="li" href="#/alumno/${x.a.id}">${avatar(x.a, 38)}<div class="li-main"><b>${esc(x.a.nombre)} · ${esc(rankLabel(x.d, x.g))}</b><span class="muted small">${esc(x.avisos[0].txt)}</span></div><span class="muted small">${fmtDate(x.g.fecha)}</span></a>`).join("")}</div>
    </section>` : ""}
    <section class="card">
      <header class="card-h"><h3>${icon("cake")} Cumpleaños de ${MESES[mesN]}</h3></header>
      ${cumple.length ? `<div class="list">${cumple.map(a => { const d = parseISO(a.nacimiento); const thisY = `${t.slice(0, 4)}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; const dd = daysBetween(t, thisY);
        return `<a class="li" href="#/alumno/${a.id}">${avatar(a, 38)}<div class="li-main"><b>${esc(a.nombre)}</b><span class="muted small">${d.getDate()} de ${MESES[d.getMonth()]} · cumple ${(age(a.nacimiento) || 0) + (dd > 0 ? 1 : 0)}</span></div>${dd === 0 ? pill("aldia", "¡Hoy!") : `<span class="muted small">${relDays(dd)}</span>`}</a>`; }).join("")}</div>` : `<p class="muted small">Nadie cumple años este mes (o falta la fecha de nacimiento).</p>`}
    </section>
    <section class="card">
      <header class="card-h"><h3>${icon("bag")} Oportunidades de venta</h3><a class="btn-link" href="#/tienda">Tienda</a></header>
      <div class="opps">
        <a href="#/tienda/gi" class="opp"><b>${sinGi}</b><span>sin gi (BJJ / Judo)</span></a>
        <a href="#/tienda/bucal" class="opp"><b>${sinBucal}</b><span>sin protector bucal</span></a>
        ${GEAR.filter(g => !["gi", "bucal"].includes(g.k)).slice(0, 2).map(g => `<a href="#/tienda/${g.k}" class="opp"><b>${activos.filter(a => !a.equipo?.[g.k]?.tiene).length}</b><span>sin ${esc(g.n.toLowerCase())}</span></a>`).join("")}
      </div>
    </section>
  </div>
  <button class="fab" data-new aria-label="Nuevo alumno">${icon("plus")}</button>`;

  el.querySelector("[data-new]").onclick = () => studentForm(null);
  el.onclick = e => {
    const p = e.target.closest("[data-pay]"); if(p){ e.preventDefault(); quickPay(S.get("alumnos", p.dataset.pay)); return; }
    const w = e.target.closest("[data-wa]"); if(w){ e.preventDefault(); window.open(w.dataset.wa, "_blank", "noopener"); }
  };
}
