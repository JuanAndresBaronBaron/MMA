/* Reportes del mes: cobrado vs esperado (12 meses), indicadores, tablas por método, concepto, disciplina, clase y deudores, con CSV. */
import * as S from "../store.js";
import {icon, avatar, emptyState, toast} from "../ui.js";
import {esc, money, today, MESES, fmtMonth, downloadText} from "../util.js";
import {reporteMes, ingresos12, ymMas} from "../cobros.js";
import {t, tn, locale} from "../i18n.js";

/* mes elegido: null = el actual al pintar */
const st = {ym: null};
const FRANJA = {mañana: "Mañana (antes de 12 m)", tarde: "Tarde (12 m a 6 pm)", noche: "Noche (desde 6 pm)"};
const pct = (a, b) => b ? Math.round(a / b * 100) : null;
const nombreMes = ym => { const [y, m] = ym.split("-").map(Number); return `${MESES[m - 1]} ${y}`; };
const compact = v => { try{ return new Intl.NumberFormat(locale(), {notation: "compact", maximumFractionDigits: 1}).format(v); }catch(e){ return String(Math.round(v)); } };

/* CSV con BOM (Excel abre bien las tildes); separador ; o , según la preferencia */
function csvTxt(rows, sep = S.pref("csvSep", ";")){
  return "﻿" + rows.map(r => r.map(c => { const s = String(c ?? ""); return s.includes(sep) || /["\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(sep)).join("\r\n");
}

export function render(el){
  const acad = S.academy(), cur = acad.moneda || "COP", m$ = v => money(v, cur);
  const ymHoy = today().slice(0, 7), ym = st.ym && st.ym <= ymHoy ? st.ym : ymHoy;
  const r = reporteMes(ym), serie = ingresos12(ym + "-28");
  const deuda = r.deudores.reduce((s, d) => s + d.monto, 0), rec = pct(r.cobrado, r.esperado);
  const discN = id => { const d = S.get("disciplinas", id); return d ? t(d.nombre) : t("Sin disciplina"); };
  const clase = id => S.get("clases", id);
  const claseN = id => { const c = clase(id); if(!c) return t("Clase eliminada"); const d = S.get("disciplinas", c.disciplinaId); return `${c.nombre || (d ? t(d.nombre) : t("Clase"))} · ${diaCorto(c.dia)} ${c.hora || ""}`; };
  /* tablas: {k, titulo, ic, cols, rows: [[...celdas]], vacio} ; la primera celda es texto, el resto números */
  const tablas = [
    {k: "metodo", titulo: t("Por método de pago"), ic: "cash", cols: [t("Método"), t("Valor"), "%"],
      rows: Object.entries(r.porMetodo).sort((a, b) => b[1] - a[1]).map(([k, v]) => [t(k), v, pct(v, r.cobrado)]), money: [1]},
    {k: "concepto", titulo: t("Por concepto"), ic: "receipt", cols: [t("Concepto"), t("Valor"), "%"],
      rows: Object.entries(r.porConcepto).sort((a, b) => b[1] - a[1]).map(([k, v]) => [t(k), v, pct(v, r.cobrado)]), money: [1]},
    {k: "disciplina", titulo: t("Asistencias por disciplina"), ic: "belt", cols: [t("Disciplina"), t("Asistencias")],
      rows: r.porDisciplina.map(x => [discN(x.discId), x.n])},
    {k: "clase", titulo: t("Asistencias por clase"), ic: "clock", cols: [t("Clase"), t("Asistencias"), t("Promedio")],
      rows: r.porClase.map(x => [claseN(x.claseId), x.n, x.prom]), vacio: t("Las asistencias por clase aparecen cuando pasas lista desde el horario.")},
    {k: "franja", titulo: t("Asistencias por franja"), ic: "sun", cols: [t("Franja"), t("Asistencias")],
      rows: r.porFranja.some(x => x.n) ? r.porFranja.map(x => [t(FRANJA[x.franja]), x.n]) : [], vacio: t("Las asistencias por clase aparecen cuando pasas lista desde el horario.")},
    {k: "deudores", titulo: t("Deudores hoy"), ic: "alert", cols: [t("Alumno"), t("Teléfono"), t("Debe")],
      rows: r.deudores.map(x => [x.al.nombre, x.al.telefono || x.al.acudienteTel || "", x.monto]), money: [2], ids: r.deudores.map(x => x.al.id)},
  ];
  const celda = (tb, v, i) => i === 0 ? esc(v) : tb.money?.includes(i) ? esc(m$(v)) : v === null || v === undefined ? "—" : esc(i === 2 && tb.cols[2] === "%" ? v + " %" : v);
  const tabla = tb => `<section class="card rp-card" data-tb="${tb.k}">
    <header class="card-h"><h3>${icon(tb.ic)} ${esc(tb.titulo)}</h3>${tb.rows.length ? `<button type="button" class="btn ghost small" data-csv="${tb.k}" aria-label="${esc(t("Descargar CSV") + ": " + tb.titulo)}">${icon("download")}<span>CSV</span></button>` : ""}</header>
    ${tb.rows.length ? `<div class="rp-tw"><table class="tbl rp-tbl"><thead><tr>${tb.cols.map((c, i) => `<th class="${i ? "num" : ""}" scope="col">${esc(c)}</th>`).join("")}</tr></thead>
    <tbody>${tb.rows.slice(0, tb.k === "deudores" ? 50 : 30).map((row, j) => `<tr>${row.map((v, i) => `<td class="${i ? "num" : ""}">${i === 0 && tb.ids ? `<a href="#/alumno/${tb.ids[j]}">${avatar(S.get("alumnos", tb.ids[j]), 24)}<span>${esc(v)}</span></a>` : celda(tb, v, i)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`
      : `<p class="muted small rp-empty">${esc(tb.vacio || t("Sin datos este mes."))}</p>`}
  </section>`;

  const vacio = !S.inAcad("pagos").length && !S.inAcad("alumnos").length;
  el.innerHTML = `
  <div class="rp-tools">
    <div class="rp-month" role="group" aria-label="${t("Mes")}">
      <button type="button" class="icon-btn" data-mes="-1" aria-label="${t("Mes anterior")}">${icon("back")}</button>
      <b aria-live="polite">${esc(nombreMes(ym))}</b>
      <button type="button" class="icon-btn" data-mes="1" aria-label="${t("Mes siguiente")}" ${ym >= ymHoy ? "disabled" : ""}><span class="rp-flip">${icon("back")}</span></button>
    </div>
    <span class="rp-sp"></span>
    <label class="rp-sep small muted">${t("Separador CSV")} <select id="csvSep" aria-label="${t("Separador CSV")}"><option value=";" ${S.pref("csvSep", ";") === ";" ? "selected" : ""}>; (Excel)</option><option value="," ${S.pref("csvSep", ";") === "," ? "selected" : ""}>,</option></select></label>
    <button type="button" class="btn ghost small" data-csvall>${icon("download")}<span>${t("Todo en CSV")}</span></button>
    <button type="button" class="btn primary small" data-print>${icon("print")}<span>${t("Imprimir")}</span></button>
  </div>
  <h2 class="rp-print-h">${esc(acad.nombre || "")} · ${esc(t("Reporte de {mes}", {mes: nombreMes(ym)}))}</h2>
  ${vacio ? `<div class="card">${emptyState({icon: "chart", title: t("Aún no hay datos para reportar"), text: t("Agrega alumnos y registra pagos: aquí verás cuánto cobras cada mes frente a lo esperado."), cta: {label: t("Ir a Alumnos"), href: "#/alumnos"}})}</div>` : ""}
  <div class="kpis rp-kpis">
    <div class="kpi"><span class="kpi-ic c2">${icon("cash")}</span><div><b>${m$(r.cobrado)}</b><span>${t("Cobrado")}</span></div></div>
    <div class="kpi"><span class="kpi-ic c1">${icon("target")}</span><div><b>${m$(r.esperado)}</b><span>${t("Esperado")}</span></div></div>
    <div class="kpi"><span class="kpi-ic ${rec === null ? "c1" : rec >= 90 ? "c2" : rec >= 70 ? "c4" : "c3"}">${icon("chart")}</span><div><b>${rec === null ? "—" : rec + " %"}</b><span>${t("Recaudo")}</span></div></div>
    <a class="kpi" href="#/pagos"><span class="kpi-ic c3">${icon("alert")}</span><div><b>${m$(deuda)}</b><span>${tn(r.deudores.length, "Deuda hoy · 1 alumno", "Deuda hoy · {n} alumnos")}</span></div></a>
    <div class="kpi"><span class="kpi-ic c2">${icon("userPlus")}</span><div><b>${r.nuevos.length}</b><span>${t("Alumnos nuevos")}</span></div></div>
    <div class="kpi"><span class="kpi-ic c4">${icon("logout")}</span><div><b>${r.bajas.length}</b><span>${t("Bajas")}</span></div></div>
    <div class="kpi"><span class="kpi-ic c1">${icon("calendar")}</span><div><b>${r.asistencias}</b><span>${t("Asistencias")}</span></div></div>
    <div class="kpi"><span class="kpi-ic c1">${icon("receipt")}</span><div><b>${r.pagos}</b><span>${t("Pagos registrados")}</span></div></div>
  </div>
  <section class="card rp-chart-card">
    <header class="card-h"><h3>${icon("chart")} ${t("Cobrado vs esperado · 12 meses")}</h3>
      <div class="rp-legend" aria-hidden="true"><span><i class="lg-bar"></i>${t("Cobrado")}</span><span><i class="lg-line"></i>${t("Esperado")}</span></div></header>
    <div class="rp-chart" data-chart role="group" aria-label="${esc(t("Cobrado vs esperado · 12 meses"))}"></div>
    <details class="rp-data"><summary>${t("Ver como tabla")}</summary>
      <div class="rp-tw"><table class="tbl rp-tbl"><thead><tr><th scope="col">${t("Mes")}</th><th class="num" scope="col">${t("Cobrado")}</th><th class="num" scope="col">${t("Esperado")}</th><th class="num" scope="col">${t("Recaudo")}</th></tr></thead>
      <tbody>${serie.map(x => `<tr class="${x.ym === ym ? "on" : ""}"><td>${esc(nombreMes(x.ym))}</td><td class="num">${esc(m$(x.cobrado))}</td><td class="num">${esc(m$(x.esperado))}</td><td class="num">${pct(x.cobrado, x.esperado) ?? "—"}${x.esperado ? " %" : ""}</td></tr>`).join("")}</tbody></table></div>
    </details>
    <p class="muted small rp-note">${t("Esperado = lo que suman los planes de los alumnos activos ese mes (un plan trimestral cuenta un tercio por mes; becas y pago por clase no suman).")}</p>
  </section>
  ${r.nuevos.length || r.bajas.length ? `<section class="card rp-card"><header class="card-h"><h3>${icon("users")} ${t("Movimiento de alumnos")}</h3></header><div class="rp-mov">
    <div><h4 class="grp ok">${t("Nuevos")} <span>${r.nuevos.length}</span></h4>${r.nuevos.slice(0, 12).map(a => `<a class="rp-al" href="#/alumno/${a.id}">${avatar(a, 28)}<span>${esc(a.nombre)}</span></a>`).join("") || `<p class="muted small">—</p>`}</div>
    <div><h4 class="grp err">${t("Bajas")} <span>${r.bajas.length}</span></h4>${r.bajas.slice(0, 12).map(a => `<a class="rp-al" href="#/alumno/${a.id}">${avatar(a, 28)}<span>${esc(a.nombre)}</span></a>`).join("") || `<p class="muted small">—</p>`}</div>
  </div></section>` : ""}
  <div class="rp-grid">${tablas.map(tabla).join("")}</div>`;

  const box = el.querySelector("[data-chart]");
  const draw = () => chart(box, serie, ym, m$, sel => { st.ym = sel; render(el); });
  draw();
  let w0 = box.clientWidth;
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => { if(Math.abs(box.clientWidth - w0) > 4){ w0 = box.clientWidth; draw(); } }) : null;
  ro?.observe(box);

  const nombreArch = k => `${(acad.nombre || "academia").replace(/[^\wÀ-ſ]+/g, "-").toLowerCase()}-${k}-${ym}.csv`;
  const filasCsv = tb => [tb.cols, ...tb.rows];
  el.querySelector("#csvSep").onchange = e => S.setPref("csvSep", e.target.value);
  el.onclick = e => {
    const mb = e.target.closest("[data-mes]");
    if(mb){ st.ym = ymMas(ym, +mb.dataset.mes); if(st.ym > ymHoy) st.ym = ymHoy; render(el); return; }
    if(e.target.closest("[data-print]")) return window.print();
    const cb = e.target.closest("[data-csv]");
    if(cb){ const tb = tablas.find(x => x.k === cb.dataset.csv); downloadText(nombreArch(tb.k), "text/csv;charset=utf-8", csvTxt(filasCsv(tb))); toast(t("CSV descargado")); return; }
    if(e.target.closest("[data-csvall]")){
      const rows = [[t("Reporte de {mes}", {mes: nombreMes(ym)}), acad.nombre || ""], [],
        [t("Cobrado"), r.cobrado], [t("Esperado"), r.esperado], [t("Recaudo"), rec === null ? "" : rec + " %"], [t("Deuda hoy"), deuda], [t("Alumnos nuevos"), r.nuevos.length], [t("Bajas"), r.bajas.length], [t("Asistencias"), r.asistencias], [],
        [t("Mes"), t("Cobrado"), t("Esperado")], ...serie.map(x => [x.ym, x.cobrado, x.esperado])];
      for(const tb of tablas) if(tb.rows.length) rows.push([], [tb.titulo], ...filasCsv(tb));
      downloadText(nombreArch("reporte"), "text/csv;charset=utf-8", csvTxt(rows)); toast(t("CSV descargado"));
    }
  };
  return () => ro?.disconnect();
}

const diaCorto = d => { try{ return new Intl.DateTimeFormat(locale(), {weekday: "short"}).format(new Date(2024, 0, 7 + (+d || 0))); }catch(e){ return ""; } };

/* columnas SVG: cobrado (barra) y esperado (marca horizontal) por mes; tocar un mes lo elige */
function chart(box, serie, ym, m$, onPick){
  const W = Math.max(280, box.clientWidth || 600), H = W < 520 ? 210 : 240;
  const padL = 44, padR = 8, padT = 22, padB = 30, iw = W - padL - padR, ih = H - padT - padB;
  const max = Math.max(1, ...serie.flatMap(x => [x.cobrado, x.esperado]));
  /* escala con 3 líneas «redondas» */
  const paso = (() => { const raw = max / 3, p = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; })();
  const top = paso * Math.ceil(max / paso), y = v => padT + ih - v / top * ih;
  const band = iw / serie.length, bw = Math.min(24, band * .56), tw = Math.min(34, band * .82);
  const grid = [];
  for(let v = 0; v <= top + 1e-6; v += paso) grid.push(`<line x1="${padL}" x2="${W - padR}" y1="${y(v)}" y2="${y(v)}" class="${v ? "rp-grid-l" : "rp-base"}"/><text x="${padL - 6}" y="${y(v) + 4}" class="rp-ax" text-anchor="end">${esc(compact(v))}</text>`);
  const cols = serie.map((x, i) => {
    const cx = padL + band * i + band / 2, h = Math.max(0, y(0) - y(x.cobrado)), r = Math.min(4, h);
    const xb = cx - bw / 2, yb = y(x.cobrado);
    const path = h > 0 ? `M${xb} ${y(0)}V${yb + r}Q${xb} ${yb} ${xb + r} ${yb}H${xb + bw - r}Q${xb + bw} ${yb} ${xb + bw} ${yb + r}V${y(0)}Z` : "";
    const on = x.ym === ym, p = x.esperado ? Math.round(x.cobrado / x.esperado * 100) : null;
    const lbl = `${fmtMonth(x.ym)}: ${t("Cobrado")} ${m$(x.cobrado)}, ${t("Esperado")} ${m$(x.esperado)}${p === null ? "" : `, ${p} %`}`;
    return `<g class="rp-col ${on ? "on" : ""}" data-i="${i}" tabindex="0" role="button" aria-pressed="${on}" aria-label="${esc(lbl)}">
      <rect class="rp-hit" x="${padL + band * i}" y="${padT - 14}" width="${band}" height="${ih + 14 + padB}"/>
      ${path ? `<path class="rp-bar" d="${path}"/>` : ""}
      ${x.esperado ? `<line class="rp-exp" x1="${cx - tw / 2}" x2="${cx + tw / 2}" y1="${y(x.esperado)}" y2="${y(x.esperado)}"/>` : ""}
      ${on && x.cobrado ? `<text class="rp-val" x="${cx}" y="${Math.max(12, (x.esperado && Math.abs(yb - 6 - y(x.esperado)) < 14 ? Math.min(yb, y(x.esperado)) : yb) - 6)}" text-anchor="middle">${esc(compact(x.cobrado))}</text>` : ""}
      <text class="rp-ax rp-mx ${on ? "on" : ""}" x="${cx}" y="${H - 10}" text-anchor="middle">${esc(mesCorto(x.ym, W))}</text></g>`;
  }).join("");
  box.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="false">${grid.join("")}${cols}</svg><div class="rp-tip" role="status" hidden></div>`;
  const tip = box.querySelector(".rp-tip");
  const show = g => {
    const x = serie[+g.dataset.i], p = x.esperado ? Math.round(x.cobrado / x.esperado * 100) : null;
    tip.replaceChildren();
    const hd = document.createElement("b"); hd.textContent = nombreMes(x.ym); tip.append(hd);
    for(const [k, v, cls] of [[t("Cobrado"), m$(x.cobrado), "k-bar"], [t("Esperado"), m$(x.esperado), "k-line"]]){
      const row = document.createElement("span"); row.className = "rp-tr";
      const key = document.createElement("i"); key.className = cls;
      const val = document.createElement("strong"); val.textContent = v;
      const lab = document.createElement("em"); lab.textContent = k;
      row.append(key, val, lab); tip.append(row);
    }
    if(p !== null){ const row = document.createElement("span"); row.className = "rp-tr muted"; row.textContent = t("Recaudo") + ": " + p + " %"; tip.append(row); }
    tip.hidden = false;
    const cx = padL + band * (+g.dataset.i) + band / 2, tw2 = tip.offsetWidth;
    tip.style.left = Math.max(0, Math.min(W - tw2, cx - tw2 / 2)) + "px";
    tip.style.top = "0px";
  };
  const hide = () => { tip.hidden = true; };
  for(const g of box.querySelectorAll(".rp-col")){
    g.addEventListener("pointerenter", () => show(g));
    g.addEventListener("pointerleave", hide);
    g.addEventListener("focus", () => show(g));
    g.addEventListener("blur", hide);
    const pick = () => { const v = serie[+g.dataset.i].ym; if(v !== ym) onPick(v); else show(g); };
    g.addEventListener("click", pick);
    g.addEventListener("keydown", e => { if(e.key === "Enter" || e.key === " "){ e.preventDefault(); pick(); } });
  }
}
/* en el celular solo la inicial del mes */
const mesCorto = (ym, W) => { const s = fmtMonth(ym).split(" ")[0]; return W < 420 ? s.slice(0, 1).toUpperCase() : s; };
